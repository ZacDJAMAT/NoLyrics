import React, { useState, useEffect } from 'react';
import { GameStatus } from '../types';

// On crée un petit type pour nos particules (les mots volants)
interface FloatingWord {
    id: number;
    text: string;
    leftPercentage: number; // Pour la position aléatoire sur l'axe X
}

interface ScoreBoardProps {
    scorePercentage: number;
    foundWordsCount: number;
    totalWords: number;
    currentInput: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    gameStatus: GameStatus;
    isFetchingLyrics: boolean;
    timeLeft: number;
    formattedTime: string;
    onStartGame?: () => void;
    lastFoundWord?: string | null; // <-- NOUVEAU
}

export default function ScoreBoard({
                                       scorePercentage, foundWordsCount, totalWords, currentInput, handleInputChange, gameStatus, isFetchingLyrics, timeLeft, formattedTime, onStartGame, lastFoundWord
                                   }: ScoreBoardProps) {

    // Notre liste de mots actuellement en train de voler à l'écran
    const [floatingWords, setFloatingWords] = useState<FloatingWord[]>([]);

    useEffect(() => {
        // Si on a bien un mot et que le compteur a augmenté
        if (lastFoundWord && foundWordsCount > 0) {

            // 1. On crée un nouveau mot volant
            const newFloatingWord: FloatingWord = {
                id: Date.now() + Math.random(), // Un ID unique
                text: lastFoundWord,
                // Un point de départ aléatoire (entre 10% et 90% de la largeur de la barre)
                leftPercentage: 10 + Math.random() * 80
            };

            // 2. On l'ajoute à la liste pour l'afficher
            setFloatingWords(prev => [...prev, newFloatingWord]);

            // 3. On programme sa destruction exacte au bout d'1 seconde (fin de l'animation)
            setTimeout(() => {
                setFloatingWords(prev => prev.filter(w => w.id !== newFloatingWord.id));
            }, 1000);
        }
    }, [foundWordsCount]); // On déclenche ce code à chaque fois que le compteur augmente

    return (
        // Les bordures restent fixes et s'allument juste à la fin du jeu (plus de flash)
        <div className={`flex justify-between items-center bg-neutral-800 p-6 rounded-2xl shadow-xl sticky top-[88px] z-10 border transition-colors duration-500 ${gameStatus === 'won' ? 'border-green-500' : gameStatus === 'lost' ? 'border-red-500' : 'border-neutral-700'}`}>

            <div className="text-center w-24">
                <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold mb-1">Score</p>
                <p className="text-3xl font-bold text-pink-500">{scorePercentage}%</p>
                <p className="text-neutral-500 text-sm">{foundWordsCount} / {totalWords}</p>
            </div>

            {/* LA ZONE CENTRALE */}
            <div className="flex-1 max-w-sm mx-8 flex justify-center relative">

                {/* LES MOTS VOLANTS */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {floatingWords.map(fw => (
                        <span
                            key={fw.id}
                            // On applique notre animation "animate-fly-up" en absolu
                            className="absolute text-white font-bold text-2xl animate-fly-up drop-shadow-md"
                            // On le positionne au centre verticalement (bottom 75%) et aléatoirement horizontalement
                            style={{ left: `${fw.leftPercentage}%`, bottom: '75%', transform: 'translateX(-50%)' }}
                        >
                            {fw.text}
                        </span>
                    ))}
                </div>

                {/* L'INPUT NORMAL (Nettoyé des flashs verts) */}
                {gameStatus === 'playing' ? (
                    <input
                        type="text"
                        placeholder="Tape un mot ici..."
                        disabled={isFetchingLyrics || gameStatus !== 'playing'}
                        value={currentInput}
                        onChange={handleInputChange}
                        autoFocus
                        className="w-full bg-neutral-700 text-white px-6 py-4 rounded-xl outline-none text-2xl text-center font-semibold focus:ring-2 focus:ring-pink-500 shadow-inner transition-all"
                    />
                ) : gameStatus === 'ready' ? (
                    <button
                        onClick={onStartGame}
                        className="text-2xl font-bold text-neutral-300 animate-pulse hover:text-white transition-colors cursor-pointer"
                        title="Démarrer la partie"
                    >
                        Prêt à jouer ?
                    </button>
                ) : (
                    <div className="text-2xl font-bold text-neutral-300">
                        {gameStatus === 'won' ? 'Score Parfait !' : 'Partie terminée'}
                    </div>
                )}
            </div>

            <div className="text-center w-24">
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-red-400 animate-pulse' : 'text-neutral-400'}`}>Temps</p>
                <p className={`text-3xl font-bold font-mono ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-red-400' : ''}`}>
                    {formattedTime}
                </p>
            </div>
        </div>
    );
}