import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchLyrics } from '../utils/api';
import { parseLyrics, normalizeWord } from '../utils/lyricsParser';
import { Song, Word, GameStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { saveGameResult } from '../lib/history';

// NOUVEAU : On remplace onBack par onError pour que l'interface gère l'affichage des erreurs
export const useGame = (song: Song, onError: (message: string) => void) => {
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
                    // Fini les alert() ! On délègue l'affichage de l'erreur à la vue.
                    onError("Les paroles de cette musique ne sont pas encore disponibles !");
                    return;
                }

                const { parsedLyrics, totalWords } = parseLyrics(rawLyrics);

                setLyricsData(parsedLyrics);
                setTotalWords(totalWords);

                const audioDuration = song.duration || 180;
                const baseTime = audioDuration + (totalWords * 1.65);

                const MAX_TIME = 3600;
                const calculatedTime = Math.floor(MAX_TIME * (1 - Math.exp(-baseTime / MAX_TIME)));

                setTimeLeft(calculatedTime);
                setFoundWordsCount(0);
                setCurrentInput('');
                setGameStatus('ready');

            } catch (error) {
                onError("Erreur lors de la récupération des paroles.");
            } finally {
                setIsFetchingLyrics(false);
            }
        };

        initGame();
    }, [song, onError]);

    // 2. Gestion du Chronomètre (Décompte)
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (gameStatus === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameStatus, timeLeft]);



    // NOUVEAU : On mémorise la chaîne de temps pour ne pas la recalculer inutilement
    const formattedTime = useMemo(() => {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }, [timeLeft]);

    // NOUVEAU : On mémorise le calcul du score
    const scorePercentage = useMemo(() => {
        return totalWords > 0 ? Math.round((foundWordsCount / totalWords) * 100) : 0;
    }, [foundWordsCount, totalWords]);

    useEffect(() => {
        if (timeLeft === 0 && gameStatus === 'playing') {
            // Si on a atteint les 100%, c'est gagné, sinon c'est perdu !
            setGameStatus(scorePercentage >= 100 ? 'won' : 'lost');
        }
    }, [timeLeft, gameStatus, scorePercentage]);

    const startGame = useCallback(() => {
        setGameStatus('playing');
    }, []);

    // 3. Gestion de l'input utilisateur
    // NOUVEAU : On ne demande plus un événement HTML, mais juste le texte tapé !
    const handleInputChange = useCallback((text: string) => {
        if (gameStatus === 'ready') {
            startGame();
        } else if (gameStatus !== 'playing') {
            return;
        }

        const normalizedInput = normalizeWord(text);

        if (!normalizedInput) {
            setCurrentInput(text);
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
                setCurrentInput(text);
            }
        }
    }, [gameStatus, lyricsData, foundWordsCount, totalWords, startGame]);

    useEffect(() => {
        if ((gameStatus === 'won' || gameStatus === 'lost') && !hasSaved) {
            saveGameResult(user, isGuest, song, scorePercentage, gameStatus, timeLeft);
            setHasSaved(true);
        }
    }, [gameStatus, hasSaved, user, isGuest, song, scorePercentage, timeLeft]);

    const restartGame = useCallback(() => {
        if (!lyricsData) return;

        const resetLyrics = lyricsData.map(line =>
            line.map(word => ({ ...word, isFound: false }))
        );

        setLyricsData(resetLyrics);
        setFoundWordsCount(0);
        setCurrentInput('');
        setLastFoundWord(null);
        setHasSaved(false);

        const audioDuration = song.duration || 180;
        const typingTime = Math.floor(totalWords * 1.2);
        setTimeLeft(audioDuration + typingTime);
        setGameStatus('ready');
    }, [lyricsData, song, totalWords]);

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
        startGame,
        lastFoundWord,
        restartGame,
    };
};