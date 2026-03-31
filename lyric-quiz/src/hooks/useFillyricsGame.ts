import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchLyrics } from '@/utils/api';
import { parseFillyrics, DifficultyLevel } from '@/utils/fillyricsParser';
import { normalizeWord } from '@/utils/lyricsParser';
import { allowedLevenshteinDistance, levenshteinDistance } from '@/utils/fuzzyMatch';
import { Song, Word, GameStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { saveFillyricsResult } from '@/lib/history';

export const useFillyricsGame = (
    sessionId: string,
    song: Song,
    onError: (message: string) => void,
    difficulty: DifficultyLevel = 'easy',
    targetWordCount: number = 5,
    thresholdPercent: number = 30 // 👈 Paramètre dynamique pour le contrat
) => {
    const [lyricsData, setLyricsData] = useState<Word[][] | null>(null);
    const [totalWords, setTotalWords] = useState<number>(0);
    const [isFetchingLyrics, setIsFetchingLyrics] = useState<boolean>(true);

    const [currentInput, setCurrentInput] = useState<string>('');
    const [foundWordsCount, setFoundWordsCount] = useState<number>(0);

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [totalTime, setTotalTime] = useState<number>(0);
    const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
    const [lastFoundWord, setLastFoundWord] = useState<string | null>(null);

    const { user } = useAuth();
    const [hasSaved, setHasSaved] = useState<boolean>(false);
    const [hasUsedHint, setHasUsedHint] = useState<boolean>(false);
    const [isTimerDisabled, setIsTimerDisabled] = useState<boolean>(false);

    // 1. Valeur de base des mots selon la difficulté
    const valuePerWord = useMemo(() => {
        if (difficulty === 'easy') return 10;
        if (difficulty === 'medium') return 30;
        return 80;
    }, [difficulty]);

    // 2. Initialisation du Jeu et du Parseur
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

                // Parseur avec la protection Anti-Répétition
                const { parsedLyrics, totalWords: actualWords } = parseFillyrics(
                    rawLyrics,
                    targetWordCount
                );
                if (ignore) return;

                setLyricsData(parsedLyrics);
                setTotalWords(actualWords);

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

    // 3. Gestion du Chronomètre
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

    // 4. Moteur de Score et de Contrat
    const scorePercentage = useMemo(() => {
        return totalWords > 0 ? Math.round((foundWordsCount / totalWords) * 100) : 0;
    }, [foundWordsCount, totalWords]);

    const isContractSecured = scorePercentage >= thresholdPercent;

    const speedBonusMultiplier = useMemo(() => {
        if (totalTime === 0 || isTimerDisabled) return 0;
        return Math.max(0, timeLeft / totalTime); // Descend de 1.0 à 0.0
    }, [timeLeft, totalTime, isTimerDisabled]);

    const scorePoints = useMemo(() => {
        if (!isContractSecured && gameStatus !== 'won') return 0;

        let basePoints = foundWordsCount * valuePerWord;
        let points = basePoints * (1 + speedBonusMultiplier);

        // Bonus Perfect fixe
        if (gameStatus === 'won' && foundWordsCount === totalWords && totalWords > 0) {
            const maxTheoreticalPoints = targetWordCount * valuePerWord;
            points += maxTheoreticalPoints * 0.2;
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

    // 5. Évaluation de fin de temps
    useEffect(() => {
        if (timeLeft === 0 && gameStatus === 'playing' && !isTimerDisabled) {
            setGameStatus(scorePercentage >= thresholdPercent ? 'won' : 'lost');
        }
    }, [timeLeft, gameStatus, scorePercentage, isTimerDisabled, thresholdPercent]);

    // 6. Gameplay (Coup de pouce et Saisie)
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

    const submitInlineGuess = useCallback(
        (rawGuess: string): boolean => {
            if (gameStatus !== 'playing' || !lyricsData) return false;

            const normalizedInput = normalizeWord(rawGuess);
            if (!normalizedInput) return false;

            type MatchCandidate = {
                lineIndex: number;
                wordIndex: number;
                normalized: string;
                distance: number;
            };

            let bestMatch: MatchCandidate | null = null;

            for (let lineIndex = 0; lineIndex < lyricsData.length; lineIndex += 1) {
                const line = lyricsData[lineIndex];

                for (let wordIndex = 0; wordIndex < line.length; wordIndex += 1) {
                    const word = line[wordIndex];

                    if (!word.isHidden || word.isFound) continue;

                    if (word.normalized === normalizedInput) {
                        bestMatch = {
                            lineIndex,
                            wordIndex,
                            normalized: word.normalized,
                            distance: 0,
                        };
                        break;
                    }

                    const tolerance = allowedLevenshteinDistance(word.normalized.length);
                    if (tolerance === 0) continue;

                    const lengthDelta = Math.abs(word.normalized.length - normalizedInput.length);
                    if (lengthDelta > tolerance) continue;

                    const distance = levenshteinDistance(normalizedInput, word.normalized);
                    if (distance > tolerance) continue;

                    if (
                        !bestMatch ||
                        distance < bestMatch.distance ||
                        (distance === bestMatch.distance &&
                            word.normalized.length < bestMatch.normalized.length)
                    ) {
                        bestMatch = {
                            lineIndex,
                            wordIndex,
                            normalized: word.normalized,
                            distance,
                        };
                    }
                }

                if (bestMatch?.distance === 0) break;
            }

            if (!bestMatch) return false;
            const matchedWord = bestMatch;

            setLyricsData((prevData) => {
                if (!prevData) return prevData;

                return prevData.map((line, lIndex) =>
                    line.map((word, wIndex) => {
                        if (lIndex === matchedWord.lineIndex && wIndex === matchedWord.wordIndex) {
                            return { ...word, isFound: true };
                        }
                        return word;
                    })
                );
            });

            setFoundWordsCount((previousFoundCount) => {
                const updatedFoundCount = previousFoundCount + 1;
                if (updatedFoundCount === totalWords) setGameStatus('won');
                return updatedFoundCount;
            });
            setLastFoundWord(matchedWord.normalized);
            setCurrentInput('');

            return true;
        },
        [gameStatus, lyricsData, totalWords]
    );

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
            saveFillyricsResult(
                user,
                song,
                scorePoints,
                thresholdPercent,
                targetWordCount,
                gameStatus,
                sessionId
            );
            setHasSaved(true);
        }
    }, [
        gameStatus,
        hasSaved,
        user,
        song,
        scorePoints,
        thresholdPercent,
        targetWordCount,
        sessionId,
    ]);

    const disableTimer = useCallback(() => {
        setIsTimerDisabled(true);
        setTimeLeft(-1);
    }, []);

    // Le fameux bouton "Skip" qui évalue le contrat avant la fin du temps
    const skipRound = useCallback(() => {
        if (gameStatus === 'playing' && !isTimerDisabled) {
            setTimeLeft(0);
        }
    }, [gameStatus, isTimerDisabled]);

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
        submitInlineGuess,
        setGameStatus,
        scorePoints,
        lastFoundWord,
        hasUsedHint,
        applyHint,
        isTimerDisabled,
        disableTimer,
        skipRound,
        thresholdPercent,
        isContractSecured,
        speedBonusMultiplier,
    };
};
