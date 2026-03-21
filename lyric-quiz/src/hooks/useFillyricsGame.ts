import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchLyrics } from '@/utils/api';
import { parseFillyrics, DifficultyLevel } from '../utils/fillyricsParser';
import { normalizeWord } from '@/utils/lyricsParser';
import { Song, Word, GameStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { saveGameResult } from '@/lib/history';

export const useFillyricsGame = (
    song: Song,
    onError: (message: string) => void,
    difficulty: DifficultyLevel = 'easy',
    targetWordCount: number = 5 // 👈 NOUVEAU : Le contrat exact
) => {
    const [lyricsData, setLyricsData] = useState<Word[][] | null>(null);
    const [totalWords, setTotalWords] = useState<number>(0);
    const [isFetchingLyrics, setIsFetchingLyrics] = useState<boolean>(true);

    const [currentInput, setCurrentInput] = useState<string>('');
    const [foundWordsCount, setFoundWordsCount] = useState<number>(0);

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [totalTime, setTotalTime] = useState<number>(0); // 👈 Nécessaire pour le Bonus Vitesse
    const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
    const [lastFoundWord, setLastFoundWord] = useState<string | null>(null);

    const { user, isGuest } = useAuth();
    const [hasSaved, setHasSaved] = useState<boolean>(false);
    const [hasUsedHint, setHasUsedHint] = useState<boolean>(false);
    const [isTimerDisabled, setIsTimerDisabled] = useState<boolean>(false);

    // 1. LES VARIABLES DU CONTRAT
    const { valuePerWord, thresholdPercent } = useMemo(() => {
        if (difficulty === 'easy') return { valuePerWord: 10, thresholdPercent: 30 };
        if (difficulty === 'medium') return { valuePerWord: 30, thresholdPercent: 60 };
        return { valuePerWord: 80, thresholdPercent: 90 };
    }, [difficulty]);

    useEffect(() => {
        let ignore = false;
        const initGame = async () => {
            setIsFetchingLyrics(true);
            setGameStatus('idle');

            try {
                const rawLyrics = await fetchLyrics(song.artist.name, song.title);
                if (ignore) return;
                if (!rawLyrics) {
                    onError('Paroles introuvables.');
                    return;
                }

                // On transmet le contrat exact (targetWordCount) au Parseur
                const { parsedLyrics, totalWords: actualWords } = parseFillyrics(
                    rawLyrics,
                    targetWordCount
                );
                if (ignore) return;

                setLyricsData(parsedLyrics);
                setTotalWords(actualWords);

                // Initialisation du chrono (ex: 30s + 5s par mot)
                const calculatedTime = 30 + actualWords * 5;
                setTimeLeft(calculatedTime);
                setTotalTime(calculatedTime);
                setFoundWordsCount(0);
                setCurrentInput('');

                setGameStatus('playing');
                setHasSaved(false);
            } catch (error) {
                if (!ignore) onError('Erreur paroles.');
            } finally {
                if (!ignore) setIsFetchingLyrics(false);
            }
        };

        if (song) initGame();
        return () => {
            ignore = true;
        };
    }, [song, onError, targetWordCount, difficulty]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (gameStatus === 'playing' && timeLeft > 0 && !isTimerDisabled) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [gameStatus, timeLeft, isTimerDisabled]);

    const formattedTime = useMemo(() => {
        if (isTimerDisabled || timeLeft === -1) return '∞';
        const m = Math.floor(timeLeft / 60)
            .toString()
            .padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }, [timeLeft, isTimerDisabled]);

    // 2. LE MOTEUR DE POINTS (Binaire + Bonus)
    const scorePercentage = useMemo(() => {
        return totalWords > 0 ? Math.round((foundWordsCount / totalWords) * 100) : 0;
    }, [foundWordsCount, totalWords]);

    const isContractSecured = scorePercentage >= thresholdPercent;

    const speedBonusMultiplier = useMemo(() => {
        if (totalTime === 0 || isTimerDisabled) return 0;
        return Math.max(0, timeLeft / totalTime); // Descend de 1.0 à 0.0
    }, [timeLeft, totalTime, isTimerDisabled]);

    const scorePoints = useMemo(() => {
        if (!isContractSecured && gameStatus !== 'won') return 0; // Contrat échoué pour l'instant = 0 pts

        let basePoints = foundWordsCount * valuePerWord;
        let points = basePoints * (1 + speedBonusMultiplier);

        // Bonus Perfect appliqué à la victoire
        if (gameStatus === 'won' && foundWordsCount === totalWords && totalWords > 0) {
            const maxTheoreticalPoints = targetWordCount * valuePerWord;
            points += maxTheoreticalPoints * 0.2; // 20% du max en bonus fixe
        }

        return Math.round(points);
    }, [
        isContractSecured,
        foundWordsCount,
        valuePerWord,
        speedBonusMultiplier,
        gameStatus,
        totalWords,
        targetWordCount,
    ]);

    // 3. CONDITIONS DE FIN DE PARTIE
    useEffect(() => {
        if (timeLeft === 0 && gameStatus === 'playing' && !isTimerDisabled) {
            // Le contrat est validé si le seuil a été atteint avant la fin du temps
            setGameStatus(scorePercentage >= thresholdPercent ? 'won' : 'lost');
        }
    }, [timeLeft, gameStatus, scorePercentage, isTimerDisabled, thresholdPercent]);

    const getMissingWords = useCallback(() => {
        if (!lyricsData) return [];
        const missing = new Set<string>();
        lyricsData.forEach((line) =>
            line.forEach((word) => {
                if (word.isHidden && !word.isFound) missing.add(word.normalized);
            })
        );
        return Array.from(missing);
    }, [lyricsData]);

    const applyHint = useCallback(() => {
        if (!lyricsData || hasUsedHint || gameStatus !== 'playing') return;
        setHasUsedHint(true);
        const unfoundIndices: { l: number; w: number }[] = [];
        lyricsData.forEach((line, lIndex) =>
            line.forEach((word, wIndex) => {
                if (word.isHidden && !word.isFound) unfoundIndices.push({ l: lIndex, w: wIndex });
            })
        );
        const shuffled = [...unfoundIndices].sort(() => 0.5 - Math.random());
        const indicesToHint = shuffled.slice(0, Math.floor(shuffled.length * 0.75));

        setLyricsData((prevData) => {
            if (!prevData) return prevData;
            const newData = prevData.map((line) => line.map((w) => ({ ...w })));
            indicesToHint.forEach(({ l, w }) => (newData[l][w].isHinted = true));
            return newData;
        });
    }, [lyricsData, hasUsedHint, gameStatus]);

    const handleInputChange = useCallback(
        (text: string) => {
            if (gameStatus !== 'playing') return;
            const normalizedInput = normalizeWord(text);
            if (!normalizedInput) {
                setCurrentInput(text);
                return;
            }

            let isMatch = false;
            let newWordsFoundCount = 0;

            if (lyricsData) {
                const newLyricsData = lyricsData.map((line) =>
                    line.map((word) => {
                        if (word.isHidden && !word.isFound && word.normalized === normalizedInput) {
                            isMatch = true;
                            newWordsFoundCount++;
                            return { ...word, isFound: true };
                        }
                        return word;
                    })
                );

                if (isMatch) {
                    setLyricsData(newLyricsData);
                    const updatedFoundCount = foundWordsCount + newWordsFoundCount;
                    setFoundWordsCount(updatedFoundCount);
                    setCurrentInput('');
                    setLastFoundWord(normalizedInput);

                    if (updatedFoundCount === totalWords) setGameStatus('won');
                } else {
                    setCurrentInput(text);
                }
            }
        },
        [gameStatus, lyricsData, foundWordsCount, totalWords]
    );

    useEffect(() => {
        if ((gameStatus === 'won' || gameStatus === 'lost') && !hasSaved) {
            saveGameResult(
                user,
                isGuest,
                song,
                scorePercentage,
                gameStatus,
                timeLeft,
                hasUsedHint,
                foundWordsCount === totalWords ? [] : getMissingWords()
            );
            setHasSaved(true);
        }
    }, [
        gameStatus,
        hasSaved,
        user,
        isGuest,
        song,
        scorePercentage,
        timeLeft,
        hasUsedHint,
        getMissingWords,
        foundWordsCount,
        totalWords,
    ]);

    const disableTimer = useCallback(() => {
        setIsTimerDisabled(true);
        setTimeLeft(-1);
    }, []);

    return {
        lyricsData,
        totalWords,
        isFetchingLyrics,
        currentInput,
        foundWordsCount,
        timeLeft,
        gameStatus,
        scorePercentage,
        formattedTime,
        handleInputChange,
        setGameStatus,
        scorePoints,
        lastFoundWord,
        hasUsedHint,
        applyHint,
        isTimerDisabled,
        disableTimer,
        // Expositions pour les jauges UI :
        thresholdPercent,
        isContractSecured,
        speedBonusMultiplier,
    };
};
