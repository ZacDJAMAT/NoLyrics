import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchLyrics } from '@/utils/api';
import { parseFillyrics } from '@/utils/fillyricsParser';
import { normalizeWord } from '@/utils/lyricsParser';
import { Song, Word, GameStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { saveFillyricsResult } from '@/lib/history';

export const useFillyricsGame = (
    sessionId: string,
    song: Song,
    roundIndex: number, // 👈 Le round actuel dicte la difficulté !
    onError: (message: string) => void
) => {
    const [lyricsData, setLyricsData] = useState<Word[][] | null>(null);
    const [totalWords, setTotalWords] = useState<number>(0);
    const [isFetchingLyrics, setIsFetchingLyrics] = useState<boolean>(true);

    const [currentInput, setCurrentInput] = useState<string>('');
    const [foundWordsCount, setFoundWordsCount] = useState<number>(0);
    const [basePoints, setBasePoints] = useState<number>(0); // Nouveau score par longueur

    // Le curseur qui cible le mot chronologique à deviner
    const [activeWordCoords, setActiveWordCoords] = useState<{ l: number; w: number } | null>(null);

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [totalTime, setTotalTime] = useState<number>(0);
    const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
    const [lastFoundWord, setLastFoundWord] = useState<string | null>(null);

    const { user } = useAuth();
    const [hasSaved, setHasSaved] = useState<boolean>(false);
    const [isTimerDisabled, setIsTimerDisabled] = useState<boolean>(false);

    // 1. CALCUL DE LA DIFFICULTÉ PROGRESSIVE
    const targetWordCount = useMemo(
        () => Math.min(5 + Math.floor(roundIndex / 2), 15),
        [roundIndex]
    );
    const thresholdPercent = useMemo(() => Math.min(20 + roundIndex * 10, 80), [roundIndex]); // Capé à 80% max

    // 2. FONCTION DE CIBLAGE DU MOT
    const findNextTarget = useCallback((data: Word[][], startL: number, startW: number) => {
        for (let l = startL; l < data.length; l++) {
            const wStart = l === startL ? startW + 1 : 0;
            for (let w = wStart; w < data[l].length; w++) {
                if (data[l][w].isHidden && !data[l][w].isFound) {
                    setActiveWordCoords({ l, w });
                    return;
                }
            }
        }
        setActiveWordCoords(null);
    }, []);

    // 3. INITIALISATION DU ROUND
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

                const { parsedLyrics, totalWords: actualWords } = parseFillyrics(
                    rawLyrics,
                    targetWordCount
                );
                if (ignore) return;

                setLyricsData(parsedLyrics);
                setTotalWords(actualWords);

                // On cherche le tout premier mot à deviner
                findNextTarget(parsedLyrics, 0, -1);

                const calculatedTime = 30 + actualWords * 5;
                setTimeLeft(calculatedTime);
                setTotalTime(calculatedTime);
                setFoundWordsCount(0);
                setBasePoints(0);
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
    }, [song, onError, targetWordCount, findNextTarget]);

    // 4. CHRONOMÈTRE
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

    // 5. MOTEUR DE SCORE
    const scorePercentage = useMemo(() => {
        return totalWords > 0 ? Math.round((foundWordsCount / totalWords) * 100) : 0;
    }, [foundWordsCount, totalWords]);

    const isContractSecured = scorePercentage >= thresholdPercent;

    const speedBonusMultiplier = useMemo(() => {
        if (totalTime === 0 || isTimerDisabled) return 0;
        return Math.max(0, timeLeft / totalTime);
    }, [timeLeft, totalTime, isTimerDisabled]);

    // Le score est désormais basé sur les points accumulés * vitesse (plus besoin de valider le contrat pour avoir ses points)
    const scorePoints = useMemo(() => {
        return Math.round(basePoints * (1 + speedBonusMultiplier));
    }, [basePoints, speedBonusMultiplier]);

    // 6. FIN DE TEMPS
    useEffect(() => {
        if (timeLeft === 0 && gameStatus === 'playing' && !isTimerDisabled) {
            setGameStatus(scorePercentage >= thresholdPercent ? 'won' : 'lost');
        }
    }, [timeLeft, gameStatus, scorePercentage, isTimerDisabled, thresholdPercent]);

    // 7. VÉRIFICATION DU MOT (Saisie Linéaire)
    const handleInputChange = useCallback(
        (text: string) => {
            if (gameStatus !== 'playing' || !activeWordCoords || !lyricsData) return;

            const normalizedInput = normalizeWord(text);
            if (!normalizedInput) {
                setCurrentInput(text);
                return;
            }

            const targetWord = lyricsData[activeWordCoords.l][activeWordCoords.w];

            // On ne valide QUE si c'est le mot ciblé actuellement !
            if (targetWord.normalized === normalizedInput) {
                // AJOUT DES POINTS (Longueur du mot * 10)
                const wordPoints = targetWord.original.length * 10;
                setBasePoints((prev) => prev + wordPoints);

                const newFoundCount = foundWordsCount + 1;
                setFoundWordsCount(newFoundCount);
                setCurrentInput('');
                setLastFoundWord(targetWord.normalized);

                // Mise à jour de la grille
                const newLyricsData = [...lyricsData];
                newLyricsData[activeWordCoords.l] = [...newLyricsData[activeWordCoords.l]];
                newLyricsData[activeWordCoords.l][activeWordCoords.w] = {
                    ...targetWord,
                    isFound: true,
                };
                setLyricsData(newLyricsData);

                // Vérification de victoire totale ou passage au mot suivant
                if (newFoundCount === totalWords) {
                    setGameStatus('won');
                    setActiveWordCoords(null);
                } else {
                    findNextTarget(newLyricsData, activeWordCoords.l, activeWordCoords.w);
                }
            } else {
                setCurrentInput(text);
            }
        },
        [gameStatus, activeWordCoords, lyricsData, foundWordsCount, totalWords, findNextTarget]
    );

    // Sauvegarde en BDD
    useEffect(() => {
        if ((gameStatus === 'won' || gameStatus === 'lost') && !hasSaved) {
            saveFillyricsResult(
                user,
                song,
                scorePoints,
                thresholdPercent,
                targetWordCount,
                gameStatus,
                sessionId,
                roundIndex, // 👈 On envoie l'index du round
                speedBonusMultiplier // 👈 On envoie le bonus de vitesse
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
        roundIndex, // 👈 Ajouté aux dépendances
        speedBonusMultiplier, // 👈 Ajouté aux dépendances
    ]);

    const disableTimer = useCallback(() => {
        setIsTimerDisabled(true);
        setTimeLeft(-1);
    }, []);

    const skipRound = useCallback(() => {
        if (gameStatus === 'playing' && !isTimerDisabled) setTimeLeft(0);
    }, [gameStatus, isTimerDisabled]);

    // 8. NAVIGATION AU CLAVIER (Touche TAB)
    const cycleNextWord = useCallback(() => {
        if (gameStatus !== 'playing' || !activeWordCoords || !lyricsData) return;

        let found = false;

        // On cherche le prochain mot après notre position actuelle
        for (let l = activeWordCoords.l; l < lyricsData.length; l++) {
            const wStart = l === activeWordCoords.l ? activeWordCoords.w + 1 : 0;
            for (let w = wStart; w < lyricsData[l].length; w++) {
                if (lyricsData[l][w].isHidden && !lyricsData[l][w].isFound) {
                    setActiveWordCoords({ l, w });
                    setCurrentInput('');
                    found = true;
                    return;
                }
            }
        }

        // Si on n'a rien trouvé (on est au dernier mot), on recommence au début du texte !
        if (!found) {
            for (let l = 0; l <= activeWordCoords.l; l++) {
                for (let w = 0; w < lyricsData[l].length; w++) {
                    if (lyricsData[l][w].isHidden && !lyricsData[l][w].isFound) {
                        setActiveWordCoords({ l, w });
                        setCurrentInput('');
                        return;
                    }
                }
            }
        }
    }, [gameStatus, activeWordCoords, lyricsData]);

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
        isTimerDisabled,
        disableTimer,
        skipRound,
        thresholdPercent,
        targetWordCount,
        isContractSecured,
        speedBonusMultiplier,
        activeWordCoords,
        setActiveWordCoords,
        setCurrentInput,
        cycleNextWord,
    };
};
