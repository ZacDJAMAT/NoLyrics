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
    const [hasUsedHint, setHasUsedHint] = useState<boolean>(false);
    const [isTimerDisabled, setIsTimerDisabled] = useState<boolean>(false);

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
        // NOUVEAU : On ajoute && !isTimerDisabled
        if (gameStatus === 'playing' && timeLeft > 0 && !isTimerDisabled) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameStatus, timeLeft, isTimerDisabled]);



    const formattedTime = useMemo(() => {
        if (isTimerDisabled) return "∞"; // NOUVEAU : Affiche l'infini si désactivé
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }, [timeLeft, isTimerDisabled]);

    // NOUVEAU : On mémorise le calcul du score
    const scorePercentage = useMemo(() => {
        return totalWords > 0 ? Math.round((foundWordsCount / totalWords) * 100) : 0;
    }, [foundWordsCount, totalWords]);

    // NOUVEAU : Extraction des mots non trouvés (sans doublons) pour les statistiques
    const getMissingWords = useCallback(() => {
        if (!lyricsData) return [];
        const missing = new Set<string>();
        lyricsData.forEach(line => {
            line.forEach(word => {
                if (!word.isFound) {
                    missing.add(word.normalized);
                }
            });
        });
        return Array.from(missing);
    }, [lyricsData]);

    // NOUVEAU : La mécanique de l'indice (75% des mots restants)
    const applyHint = useCallback(() => {
        if (!lyricsData || hasUsedHint || gameStatus !== 'playing') return;

        // On bloque l'indice pour le reste de la partie
        setHasUsedHint(true);

        // 1. On liste tous les mots qui n'ont pas encore été trouvés
        const unfoundIndices: {l: number, w: number}[] = [];
        lyricsData.forEach((line, lIndex) => {
            line.forEach((word, wIndex) => {
                if (!word.isFound) {
                    unfoundIndices.push({l: lIndex, w: wIndex});
                }
            });
        });

        // 2. On mélange la liste et on en garde 75%
        const shuffled = [...unfoundIndices].sort(() => 0.5 - Math.random());
        const wordsToHintCount = Math.floor(shuffled.length * 0.75);
        const indicesToHint = shuffled.slice(0, wordsToHintCount);

        // 3. On met à jour la grille de jeu avec la propriété isHinted = true
        setLyricsData(prevData => {
            if (!prevData) return prevData;
            const newData = prevData.map(line => line.map(w => ({...w})));
            indicesToHint.forEach(({l, w}) => {
                newData[l][w].isHinted = true;
            });
            return newData;
        });
    }, [lyricsData, hasUsedHint, gameStatus]);

    useEffect(() => {
        // NOUVEAU : && !isTimerDisabled
        if (timeLeft === 0 && gameStatus === 'playing' && !isTimerDisabled) {
            setGameStatus(scorePercentage >= 100 ? 'won' : 'lost');
        }
    }, [timeLeft, gameStatus, scorePercentage, isTimerDisabled]);

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
            // On calcule les mots manquants (vide si victoire à 100%)
            const missingWords = foundWordsCount === totalWords ? [] : getMissingWords();

            // On envoie les nouvelles données !
            saveGameResult(user, isGuest, song, scorePercentage, gameStatus, timeLeft, hasUsedHint, missingWords);
            setHasSaved(true);
        }
    }, [gameStatus, hasSaved, user, isGuest, song, scorePercentage, timeLeft, hasUsedHint, getMissingWords, foundWordsCount, totalWords]);

    const restartGame = useCallback(() => {
        if (!lyricsData) return;

        const resetLyrics = lyricsData.map(line =>
            line.map(word => ({ ...word, isFound: false, isHinted: false }))
        );


        setLyricsData(resetLyrics);
        setFoundWordsCount(0);
        setCurrentInput('');
        setLastFoundWord(null);
        setHasSaved(false);
        setHasUsedHint(false);
        setIsTimerDisabled(false);

        // --- LA CORRECTION DU CHRONO EST ICI ---
        const audioDuration = song.duration || 180;
        const baseTime = audioDuration + (totalWords * 1.65);
        const MAX_TIME = 3600;
        const calculatedTime = Math.floor(MAX_TIME * (1 - Math.exp(-baseTime / MAX_TIME)));

        setTimeLeft(calculatedTime);
        // ---------------------------------------

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
        hasUsedHint,
        applyHint,
        getMissingWords,
        isTimerDisabled,
        setIsTimerDisabled
    };
};