import React, { useState, useEffect } from 'react';
import { GameStatus } from '../types';
import { Input } from './ui/input';
import { Button } from "./ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";
import { RotateCcw, Flag, Settings, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

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
    onGiveUp: () => void;
    onRestart: () => void;
    // NOUVEAU : On gère l'alignement directement depuis le ScoreBoard
    lyricsAlignment: 'left' | 'center' | 'right';
    onAlignmentChange: (alignment: 'left' | 'center' | 'right') => void;
}

export default function ScoreBoard({
                                       scorePercentage, foundWordsCount, totalWords, currentInput, handleInputChange, gameStatus, isFetchingLyrics, timeLeft, formattedTime, lastFoundWord, onGiveUp, onRestart, lyricsAlignment, onAlignmentChange
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
                <p className="titre-neon-primary text-3xl">{scorePercentage}%</p>
                <p className="text-muted-foreground font-texte text-sm">{foundWordsCount} / {totalWords}</p>
            </div>

            <div className="flex-1 max-w-sm mx-4 md:mx-8 flex justify-center items-center relative transition-all duration-500">
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
                    <p className={`text-foreground font-titre text-2xl ${timeLeft <= 30 && gameStatus === 'playing' ? 'titre-neon-destructive' : 'text-foreground'}`}>
                        {formattedTime}
                    </p>
                </div>

                <div className="flex items-center border-l border-white/10 pl-4 h-10 transition-all duration-500 ease-out gap-2">
                    <div className={`transition-all duration-500 ease-out flex items-center overflow-hidden origin-right ${(gameStatus === 'playing' || gameStatus === 'won' || gameStatus === 'lost') ? 'w-10 opacity-100 scale-100' : 'w-0 opacity-0 scale-50'}`}>
                        <Button variant="glass-icon-blue" size="icon" onClick={onRestart} className="w-10 h-10 rounded-xl" title="Recommencer">
                            <RotateCcw size={18} strokeWidth={2.5} />
                        </Button>
                    </div>
                    <div className={`transition-all duration-500 ease-out flex items-center overflow-hidden origin-right ${gameStatus === 'playing' ? 'w-10 opacity-100 scale-100' : 'w-0 opacity-0 scale-50'}`}>
                        <Button variant="glass-icon-red" size="icon" onClick={onGiveUp} className="w-10 h-10 rounded-xl" title="Abandonner">
                            <Flag size={18} strokeWidth={2.5} />
                        </Button>
                    </div>

                    {/* --- LE POPOVER DES PARAMÈTRES (ENGRENAGE) --- */}
                    <div className="w-10 flex items-center transition-all duration-500">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="glass-icon-blue" size="icon" className="w-10 h-10 rounded-xl hover:text-foreground" title="Paramètres">
                                    <Settings size={18} strokeWidth={2.5} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                sideOffset={16}
                                className="w-72 glass-modal border-white/10 p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-background/40 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-4 duration-300 ease-out"
                            >
                                <div className="flex flex-col gap-5">
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                                        <p className="text-muted-foreground font-texte text-xs text-center uppercase tracking-wider font-semibold">
                                            Alignement du texte
                                        </p>
                                        <div className="flex justify-center gap-1 bg-black/40 p-1 rounded-lg">
                                            <Button variant="ghost" size="icon" className={`rounded-md w-10 h-8 ${lyricsAlignment === 'left' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`} onClick={() => onAlignmentChange('left')} title="Aligner à gauche">
                                                <AlignLeft size={16} strokeWidth={2.5} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className={`rounded-md w-10 h-8 ${lyricsAlignment === 'center' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`} onClick={() => onAlignmentChange('center')} title="Centrer">
                                                <AlignCenter size={16} strokeWidth={2.5} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className={`rounded-md w-10 h-8 ${lyricsAlignment === 'right' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`} onClick={() => onAlignmentChange('right')} title="Aligner à droite">
                                                <AlignRight size={16} strokeWidth={2.5} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <p className="text-muted-foreground font-texte text-xs text-center leading-relaxed">
                                            <span className="text-foreground font-bold">PROCHAINEMENT</span><br/>
                                            Mode de frappe simplifié<br/>Thèmes visuels
                                        </p>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                </div>
            </div>
        </div>
    );
}