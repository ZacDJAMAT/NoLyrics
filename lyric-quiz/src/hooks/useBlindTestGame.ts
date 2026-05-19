import { useState, useEffect, useCallback } from 'react';

export const useBlindTestGame = (onGameOver: (finalScore: number) => void) => {
    // 1. Nouvelles limites (5 vies, 25 secondes)
    const [lives, setLives] = useState(5);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(25);
    const [roundStatus, setRoundStatus] = useState<'playing' | 'won' | 'lost'>('playing');

    // 2. 👉 NOUVEAU : Système d'indices (Heardle-like)
    const [hintsUsed, setHintsUsed] = useState(0);
    const [currentDurationMs, setCurrentDurationMs] = useState(1500); // Base : 1.5s

    // ⏱️ Le Chronomètre (25 secondes)
    useEffect(() => {
        if (roundStatus !== 'playing' || timeLeft <= 0) return;

        const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, roundStatus]);

    // 💀 Gestion de la fin du temps
    useEffect(() => {
        if (timeLeft === 0 && roundStatus === 'playing') {
            setRoundStatus('lost');
            setLives((prev) => Math.max(0, prev - 1));
        }
    }, [timeLeft, roundStatus]);

    // 💡 👉 NOUVEAU : Fonction pour utiliser un indice (+500ms)
    const useHint = useCallback(() => {
        // Si on n'est pas en train de jouer ou si on a atteint la limite, on ne fait rien
        if (roundStatus !== 'playing' || hintsUsed >= 5) return;

        // On incrémente le nombre d'indices utilisés
        setHintsUsed((prev) => prev + 1);
        // On incrémente la durée d'écoute de 500ms
        setCurrentDurationMs((prev) => prev + 500);
    }, [roundStatus, hintsUsed]);

    // 🎯 Soumission d'une réponse
    const submitGuess = useCallback(
        (isCorrect: boolean) => {
            if (roundStatus !== 'playing') return;

            if (isCorrect) {
                setRoundStatus('won');
                // 🧮 👉 NOUVEAU SCORE : 500 pts max, -50 pts par indice
                const pointsEarned = 500 - hintsUsed * 50;
                setScore((prev) => prev + pointsEarned);
            } else {
                setRoundStatus('lost');
                setLives((prev) => Math.max(0, prev - 1));
            }
        },
        [roundStatus, hintsUsed]
    );

    // 🔄 Passer à la manche suivante (ou déclencher le Game Over)
    const resetRound = useCallback(() => {
        if (lives <= 0) {
            onGameOver(score);
        } else {
            setRoundStatus('playing');
            setTimeLeft(25); // On remet à 25s
            setHintsUsed(0); // On remet les indices à 0
            setCurrentDurationMs(1500); // On remet l'écoute à 1.5s
        }
    }, [lives, score, onGameOver]);

    return {
        lives,
        score,
        timeLeft,
        roundStatus,
        hintsUsed, // 👈 Exporte l'info pour l'interface
        currentDurationMs, // 👈 Exporte la durée actuelle pour le bouton Play
        useHint, // 👈 Exporte l'action pour le bouton "+500ms"
        submitGuess,
        resetRound,
        isGameOver: lives === 0,
    };
};
