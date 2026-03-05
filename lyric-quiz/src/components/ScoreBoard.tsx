import React, { useState, useEffect } from 'react';
import { GameStatus } from '../types';
import { Input } from './ui/input';

interface FloatingWord {
    id: number;
    text: string;
    leftPercentage: number;
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
    lastFoundWord?: string | null;
}

export default function ScoreBoard({
                                       scorePercentage, foundWordsCount, totalWords, currentInput, handleInputChange, gameStatus, isFetchingLyrics, timeLeft, formattedTime, onStartGame, lastFoundWord
                                   }: ScoreBoardProps) {

    const [floatingWords, setFloatingWords] = useState<FloatingWord[]>([]);

    useEffect(() => {
        if (lastFoundWord && foundWordsCount > 0) {
            const newFloatingWord: FloatingWord = {
                id: Date.now() + Math.random(),
                text: lastFoundWord,
                leftPercentage: 10 + Math.random() * 80
            };
            setFloatingWords(prev => [...prev, newFloatingWord]);
            setTimeout(() => {
                setFloatingWords(prev => prev.filter(w => w.id !== newFloatingWord.id));
            }, 1000);
        }
    }, [foundWordsCount, lastFoundWord]);

    return (
        <div className={`flex justify-between items-center bg-card p-6 rounded-3xl shadow-[0_20px_50px_rgba(232,28,255,0.05),_0_20px_50px_rgba(64,201,255,0.05)] sticky top-[88px] z-10 border border-white/5 backdrop-blur-xl transition-all duration-500 ${
            gameStatus === 'won' ? 'border-secondary shadow-[0_0_20px_rgba(64,201,255,0.3)]'
                : gameStatus === 'lost' ? 'border-destructive shadow-[0_0_20px_rgba(255,42,95,0.3)]'
                    : 'border-white/5'
        }`}>

            <div className="text-center w-24">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Score</p>
                <p className="text-3xl font-titre text-primary drop-shadow-[0_0_8px_rgba(232,28,255,0.4)]">{scorePercentage}%</p>
                <p className="text-muted-foreground font-texte text-sm">{foundWordsCount} / {totalWords}</p>
            </div>

            <div className="flex-1 max-w-sm mx-8 flex justify-center relative">

                <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {floatingWords.map(fw => (
                        <span
                            key={fw.id}
                            className="absolute text-foreground font-titre text-2xl animate-fly-up drop-shadow-[0_0_5px_rgba(252,222,255,0.5)]"
                            style={{ left: `${fw.leftPercentage}%`, bottom: '75%', transform: 'translateX(-50%)' }}
                        >
                            {fw.text}
                        </span>
                    ))}
                </div>

                {gameStatus === 'playing' ? (
                    <Input
                        type="text"
                        placeholder="Tape un mot ici..."
                        disabled={isFetchingLyrics || gameStatus !== 'playing'}
                        value={currentInput}
                        onChange={handleInputChange}
                        autoFocus
                        /* 3. INPUT : Bien visible tout le temps grâce au bg-white/10 et border-white/20 */
                        className="w-full h-14 px-6 rounded-xl text-2xl text-center font-texte bg-white/10 border border-white/20 text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary focus-visible:bg-white/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] transition-all"
                    />
                ) : gameStatus === 'ready' ? (
                    <button
                        onClick={onStartGame}
                        className="text-2xl font-titre text-muted-foreground animate-pulse hover:text-foreground transition-colors cursor-pointer"
                        title="Démarrer la partie"
                    >
                        Prêt à jouer ?
                    </button>
                ) : (
                    <div className="text-2xl font-titre text-muted-foreground">
                        {gameStatus === 'won' ? 'Score Parfait !' : 'Partie terminée'}
                    </div>
                )}
            </div>

            <div className="text-center w-24">
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>Temps</p>
                <p className={`text-3xl font-texte font-bold ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-destructive drop-shadow-[0_0_8px_rgba(255,42,95,0.5)]' : 'text-foreground'}`}>
                    {formattedTime}
                </p>
            </div>
        </div>
    );
}