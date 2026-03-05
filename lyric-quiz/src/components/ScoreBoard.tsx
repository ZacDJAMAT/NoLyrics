import React, { useState, useEffect } from 'react';
import { GameStatus } from '../types';
import { Input } from './ui/input';
import { Button } from "./ui/button.tsx";

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
        <div className={`glass-panel flex justify-between items-center p-6 sticky top-[88px] z-10 transition-[box-shadow,border-color] duration-500 ${
            gameStatus === 'won' ? 'border-secondary shadow-[0_0_20px_rgba(64,201,255,0.3)]'
                : gameStatus === 'lost' ? 'border-destructive shadow-[0_0_20px_rgba(255,42,95,0.3)]'
                    : ''
        }`}>

            <div className="text-center w-24">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Score</p>
                <p className="text-neon-primary text-3xl">{scorePercentage}%</p>
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
                        variant="glass"
                        type="text"
                        placeholder="Tape un mot ici..."
                        disabled={isFetchingLyrics || gameStatus !== 'playing'}
                        value={currentInput}
                        onChange={handleInputChange}
                        autoFocus
                        className="h-14 px-6 rounded-xl text-2xl text-center font-texte"
                    />
                ) : gameStatus === 'ready' ? (
                    <Button
                        variant="ghost"
                        onClick={onStartGame}
                        className="text-2xl font-titre text-muted-foreground animate-pulse hover:text-foreground hover:bg-transparent h-auto py-2 px-6"
                        title="Démarrer la partie"
                    >
                        Prêt à jouer ?
                    </Button>
                ) : (
                    <div className="text-2xl font-titre text-muted-foreground">
                        {gameStatus === 'won' ? 'Score Parfait !' : 'Partie terminée'}
                    </div>
                )}
            </div>

            <div className="text-center w-24">
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>Temps</p>
                <p className={`text-3xl font-bold ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-neon-destructive' : 'text-foreground'}`}>                    {formattedTime}
                </p>
            </div>
        </div>
    );
}