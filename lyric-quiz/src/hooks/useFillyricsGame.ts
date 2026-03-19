import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchLyrics } from '@/utils/api';
import { parseFillyrics } from '../utils/fillyricsParser';
import { normalizeWord } from '@/utils/lyricsParser';
import { Song, Word, GameStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { saveGameResult } from '@/lib/history';

export const useFillyricsGame = (song: Song, onError: (message: string) => void) => {
    const [lyricsData, setLyricsData] = useState<Word[][] | null>(null);
    const [totalWords, setTotalWords] = useState<number>(0);
    const [isFetchingLyrics, setIsFetchingLyrics] = useState<boolean>(true);

    const [currentInput, setCurrentInput] = useState<string>('');
    const [foundWordsCount, setFoundWordsCount] = useState<number>(0);

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
    const [lastFoundWord, setLastFoundWord] = useState<string | null>(null);

    const { user, isGuest } = useAuth();
    const [hasSaved, setHasSaved] = useState<boolean>(false);
    const [hasUsedHint, setHasUsedHint] = useState<boolean>(false);
    const [isTimerDisabled, setIsTimerDisabled] = useState<boolean>(false);

    useEffect(() => {
        let ignore = false; // 👈 ANTI-GLITCH : Le fameux drapeau

        const initGame = async () => {
            setIsFetchingLyrics(true);
            setGameStatus('idle');

            try {
                const rawLyrics = await fetchLyrics(song.artist.name, song.title);

                if (ignore) return; // 👈 Si React a démonté le composant entre-temps, on annule tout !

                if (!rawLyrics) {
                    onError('Paroles introuvables.');
                    return;
                }

                const { parsedLyrics, totalWords: totalHidden } = parseFillyrics(rawLyrics);

                if (ignore) return; // 👈 Double sécurité

                setLyricsData(parsedLyrics);
                setTotalWords(totalHidden);

                const calculatedTime = 30 + totalHidden * 5;
                setTimeLeft(calculatedTime);
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

        // 👈 Fonction de nettoyage : s'active si React démonte le composant
        return () => {
            ignore = true;
        };
    }, [song, onError]);

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

    const scorePercentage = useMemo(() => {
        return totalWords > 0 ? Math.round((foundWordsCount / totalWords) * 100) : 0;
    }, [foundWordsCount, totalWords]);

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
        const wordsToHintCount = Math.floor(shuffled.length * 0.75);
        const indicesToHint = shuffled.slice(0, wordsToHintCount);

        setLyricsData((prevData) => {
            if (!prevData) return prevData;
            const newData = prevData.map((line) => line.map((w) => ({ ...w })));
            indicesToHint.forEach(({ l, w }) => (newData[l][w].isHinted = true));
            return newData;
        });
    }, [lyricsData, hasUsedHint, gameStatus]);

    useEffect(() => {
        if (timeLeft === 0 && gameStatus === 'playing' && !isTimerDisabled) {
            setGameStatus(scorePercentage >= 100 ? 'won' : 'lost');
        }
    }, [timeLeft, gameStatus, scorePercentage, isTimerDisabled]);

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
            const missingWords = foundWordsCount === totalWords ? [] : getMissingWords();
            saveGameResult(
                user,
                isGuest,
                song,
                scorePercentage,
                gameStatus,
                timeLeft,
                hasUsedHint,
                missingWords
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
        lastFoundWord,
        hasUsedHint,
        applyHint,
        isTimerDisabled,
        disableTimer,
    };
};
