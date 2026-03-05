import { useState, useEffect } from 'react';
import { fetchLyrics } from '../utils/api';
import { parseLyrics, normalizeWord } from '../utils/lyricsParser';
import { Song, Word, GameStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { saveGameResult } from '../lib/history';

export const useGame = (song: Song, onBack: () => void) => {
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

    // 1. Initialisation du jeu
    useEffect(() => {
        const initGame = async () => {
            setIsFetchingLyrics(true);
            setGameStatus('idle');

            try {
                const rawLyrics = await fetchLyrics(song.artist.name, song.title);

                if (!rawLyrics) {
                    alert("Mince, les paroles de cette musique ne sont pas encore disponibles ! Essaie une autre chanson.");
                    onBack();
                    return;
                }

                const { parsedLyrics, totalWords } = parseLyrics(rawLyrics);

                setLyricsData(parsedLyrics);
                setTotalWords(totalWords);

                const audioDuration = song.duration || 180;
                const typingTime = Math.floor(totalWords * 1.2);
                const calculatedTime = audioDuration + typingTime;

                setTimeLeft(calculatedTime);
                setFoundWordsCount(0);
                setCurrentInput('');
                setGameStatus('ready');


            } catch (error) {
                alert("Erreur lors de la récupération des paroles.");
                onBack();
            } finally {
                setIsFetchingLyrics(false);
            }
        };

        initGame();
    }, [song, onBack]);

    // 2. Gestion du Chronomètre
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (gameStatus === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameStatus === 'playing') {
            setGameStatus('lost');
        }
        return () => clearInterval(timer);
    }, [gameStatus, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // 3. Gestion de l'input utilisateur
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (gameStatus !== 'playing') return;

        const val = e.target.value;
        const normalizedInput = normalizeWord(val);

        if (!normalizedInput) {
            setCurrentInput(val);
            return;
        }

        let isMatch = false;
        let newWordsFoundCount = 0;

        if (lyricsData) {
            const newLyricsData = lyricsData.map(line => {
                return line.map(word => {
                    if (!word.isFound && word.normalized === normalizedInput) {
                        isMatch = true;
                        newWordsFoundCount++;
                        return { ...word, isFound: true };
                    }
                    return word;
                });
            });

            if (isMatch) {
                setLyricsData(newLyricsData);
                const updatedFoundCount = foundWordsCount + newWordsFoundCount;
                setFoundWordsCount(updatedFoundCount);
                setCurrentInput('');
                setLastFoundWord(normalizedInput);

                if (updatedFoundCount === totalWords) {
                    setGameStatus('won');
                }
            } else {
                setCurrentInput(val);
            }
        }
    };

    const scorePercentage = totalWords > 0 ? Math.round((foundWordsCount / totalWords) * 100) : 0;

    useEffect(() => {
        if ((gameStatus === 'won' || gameStatus === 'lost') && !hasSaved) {
            // On calcule le score exact au moment précis de la fin
            const finalScore = totalWords > 0 ? Math.round((foundWordsCount / totalWords) * 100) : 0;

            // On sauvegarde !
            saveGameResult(user, isGuest, song, finalScore, gameStatus, timeLeft);

            // On verrouille pour éviter que React ne sauvegarde en boucle
            setHasSaved(true);
        }
    }, [gameStatus, hasSaved, user, isGuest, song, foundWordsCount, totalWords, timeLeft]);

    const startGame = () => {
        setGameStatus('playing');
    };

    const restartGame = () => {
        if (!lyricsData) return;

        // 1. On recache tous les mots
        const resetLyrics = lyricsData.map(line =>
            line.map(word => ({ ...word, isFound: false }))
        );

        // 2. On réinitialise les compteurs et les textes
        setLyricsData(resetLyrics);
        setFoundWordsCount(0);
        setCurrentInput('');
        setLastFoundWord(null);

        // 3. On déverrouille la sauvegarde pour la nouvelle partie
        setHasSaved(false);

        // 4. On recalcule le temps initial
        const audioDuration = song.duration || 180;
        const typingTime = Math.floor(totalWords * 1.2);
        setTimeLeft(audioDuration + typingTime);

        // 5. On repasse en mode prêt
        setGameStatus('ready');
    };

    return {
        lyricsData,
        totalWords,
        isFetchingLyrics,
        currentInput,
        foundWordsCount,
        timeLeft,
        gameStatus,
        scorePercentage,
        formattedTime: formatTime(timeLeft),
        handleInputChange,
        setGameStatus,
        startGame,
        lastFoundWord,
        restartGame,
    };
};