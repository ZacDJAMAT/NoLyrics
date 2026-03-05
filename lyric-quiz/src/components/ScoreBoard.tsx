import React, { useState, useEffect } from 'react';
import { GameStatus } from '../types';
import { Input } from './ui/input';
import { Button } from "./ui/button";

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
    lastFoundWord?: string | null;
    onOpenSettings: () => void;
    onGiveUp: () => void;
    onRestart: () => void;
}

export default function ScoreBoard({
                                       scorePercentage, foundWordsCount, totalWords, currentInput, handleInputChange, gameStatus, isFetchingLyrics, timeLeft, formattedTime, lastFoundWord, onOpenSettings, onGiveUp, onRestart
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
        <div className={`glass-panel flex justify-between items-center p-6 sticky top-6 z-30 transition-[box-shadow,border-color] duration-500 ease-in-out ${
            gameStatus === 'won' ? 'border-secondary shadow-[0_0_20px_rgba(64,201,255,0.3)]'
                : gameStatus === 'lost' ? 'border-destructive shadow-[0_0_20px_rgba(255,42,95,0.3)]'
                    : ''
        }`}>

            <div className="text-center w-24 shrink-0 transition-all duration-500">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Score</p>
                <p className="text-neon-primary text-3xl">{scorePercentage}%</p>
                <p className="text-muted-foreground font-texte text-sm">{foundWordsCount} / {totalWords}</p>
            </div>

            <div className="flex-1 max-w-sm mx-4 md:mx-8 flex justify-center items-center relative transition-all duration-500">

                {/* LES MOTS VOLANTS UNIQUEMENT AU-DESSUS DE L'INPUT */}
                <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
                    {floatingWords.map(fw => (
                        <span
                            key={fw.id}
                            className="absolute text-foreground font-titre text-2xl animate-fly-up drop-shadow-[0_0_5px_rgba(252,222,255,0.5)]"
                            style={{ left: `${fw.leftPercentage}%`, bottom: '80%', transform: 'translateX(-50%)' }}
                        >
                            {fw.text}
                        </span>
                    ))}
                </div>

                {isFetchingLyrics ? (
                    <div className="flex items-center gap-3 text-2xl font-titre text-primary animate-pulse drop-shadow-[0_0_8px_rgba(232,28,255,0.4)] h-14">
                        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Chargement...</span>
                    </div>
                ) : (
                    <Input
                        variant="glass"
                        type="text"
                        placeholder={gameStatus === 'ready' ? "Commence à taper..." : gameStatus === 'playing' ? "Tape un mot ici..." : "Partie terminée"}
                        disabled={gameStatus === 'won' || gameStatus === 'lost'}
                        value={currentInput}
                        onChange={handleInputChange}
                        autoFocus
                        className="h-14 px-6 rounded-xl text-2xl text-center font-texte w-full transition-all duration-500"
                    />
                )}
            </div>

            <div className="flex items-center gap-4 shrink-0 transition-all duration-500">
                <div className="text-center w-24 mr-2 transition-all duration-500">
                    <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>Temps</p>
                    <p className={`text-3xl font-bold ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-neon-destructive' : 'text-foreground'}`}>
                        {formattedTime}
                    </p>
                </div>

                <div className="flex items-center border-l border-white/10 pl-4 h-10 transition-all duration-500 ease-out gap-2">
                    <div className={`transition-all duration-500 ease-out flex items-center overflow-hidden origin-right ${(gameStatus === 'playing' || gameStatus === 'won' || gameStatus === 'lost') ? 'w-10 opacity-100 scale-100' : 'w-0 opacity-0 scale-50'}`}>
                        <Button variant="glass-icon-blue" size="icon" onClick={onRestart} className="w-10 h-10 rounded-xl" title="Recommencer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        </Button>
                    </div>
                    <div className={`transition-all duration-500 ease-out flex items-center overflow-hidden origin-right ${gameStatus === 'playing' ? 'w-10 opacity-100 scale-100' : 'w-0 opacity-0 scale-50'}`}>
                        <Button variant="glass-icon-red" size="icon" onClick={onGiveUp} className="w-10 h-10 rounded-xl" title="Abandonner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
                        </Button>
                    </div>
                    <div className="w-10 flex items-center transition-all duration-500">
                        <Button variant="glass-icon-blue" size="icon" onClick={onOpenSettings} className="w-10 h-10 rounded-xl hover:text-foreground" title="Paramètres">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}