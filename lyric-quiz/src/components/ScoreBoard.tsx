import { useState, useEffect } from 'react';
import { GameStatus } from '../types';
import { Input } from './ui/input';
import { Button } from "./ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";
import {RotateCcw, Flag, Settings, AlignLeft, AlignCenter, AlignRight, Lightbulb, TimerOff} from "lucide-react";

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
    handleInputChange: (text: string) => void;
    gameStatus: GameStatus;
    isFetchingLyrics: boolean;
    timeLeft: number;
    formattedTime: string;
    lastFoundWord?: string | null;
    onGiveUp: () => void;
    onRestart: () => void;
    lyricsAlignment: 'left' | 'center' | 'right';
    onAlignmentChange: (alignment: 'left' | 'center' | 'right') => void;
    onHint: () => void;
    hasUsedHint: boolean;
    onDisableTimer: () => void;
    isTimerDisabled: boolean;
}

export default function ScoreBoard({
                                       scorePercentage, foundWordsCount, totalWords, currentInput, handleInputChange, gameStatus, isFetchingLyrics, timeLeft, formattedTime, lastFoundWord, onGiveUp, onRestart, lyricsAlignment, onAlignmentChange, onHint, hasUsedHint, isTimerDisabled, onDisableTimer
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
        <div
            className={`glass-panel flex flex-wrap md:flex-nowrap justify-between items-center p-3 md:p-6 sticky top-2 md:top-6 z-50 gap-y-3 md:gap-y-0 transition-[box-shadow,border-color] duration-500 ease-in-out ${
                gameStatus === 'won' ? 'border-secondary shadow-[0_0_20px_rgba(64,201,255,0.3)]'
                    : gameStatus === 'lost' ? 'border-destructive shadow-[0_0_20px_rgba(255,42,95,0.3)]'
                        : ''
            }`}
            style={{
                WebkitTransform: 'translate3d(0,0,0)',
                transform: 'translate3d(0,0,0)'
            }}
        >
            {/* 1. SCORE */}
            <div className="text-center w-16 md:w-24 shrink-0 transition-all duration-500 order-1">
                <p className="text-muted-foreground text-[10px] md:text-xs uppercase tracking-wider font-semibold mb-0 md:mb-1">Score</p>
                <p className="titre-neon-primary font-titre text-lg md:text-3xl text-foreground leading-none md:leading-tight">{scorePercentage}%</p>
                <p className="text-muted-foreground font-texte text-[10px] md:text-sm mt-0.5 md:mt-0">{foundWordsCount} / {totalWords}</p>
            </div>

            {/* 2. CHRONO & BOUTONS */}
            <div className="flex items-center gap-1.5 md:gap-4 shrink-0 transition-all duration-500 order-2 md:order-3">
                <div className="text-center mr-0 md:mr-2 transition-all duration-500 w-16 md:w-auto">
                    <p className={`text-[10px] md:text-xs uppercase tracking-wider font-semibold mb-0 md:mb-1 ${timeLeft <= 30 && gameStatus === 'playing' ? '!text-destructive animate-pulse' : 'text-muted-foreground'}`}>Temps</p>
                    <p className={`titre-neon-primary font-titre text-lg md:text-3xl leading-none md:leading-tight ${timeLeft <= 30 && gameStatus === 'playing' ? 'titre-neon-destructive' : 'text-foreground'}`}>
                        {formattedTime}
                    </p>
                </div>

                <div className="flex items-center border-l border-white/10 pl-1.5 md:pl-4 h-8 md:h-10 transition-all duration-500 ease-out gap-1 md:gap-2">

                    {/* BOUTON RECOMMENCER */}
                    <div className={`transition-all duration-500 ease-out flex items-center origin-right ${(gameStatus === 'playing' || gameStatus === 'won' || gameStatus === 'lost') ? 'w-8 md:w-10 opacity-100 scale-100 overflow-visible' : 'w-0 opacity-0 scale-50 overflow-hidden'}`}>
                        <Button variant="outline" size="icon" onClick={onRestart} className="!w-8 !h-8 md:!w-10 md:!h-10 !rounded-xl overflow-hidden border-white/10 bg-card/50 hover:bg-white/10 backdrop-blur-md transition-all hover:shadow-[0_0_15px_rgba(64,201,255,0.4)] group" title="Recommencer">
                            <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-secondary group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
                        </Button>
                    </div>

                    {/* BOUTON ABANDONNER */}
                    <div className={`transition-all duration-500 ease-out flex items-center origin-right ${gameStatus === 'playing' ? 'w-8 md:w-10 opacity-100 scale-100 overflow-visible' : 'w-0 opacity-0 scale-50 overflow-hidden'}`}>
                        <Button variant="outline" size="icon" onClick={onGiveUp} className="!w-8 !h-8 md:!w-10 md:!h-10 !rounded-xl overflow-hidden border-white/10 bg-card/50 hover:bg-white/10 backdrop-blur-md transition-all hover:shadow-[0_0_15px_rgba(255,42,95,0.4)] group" title="Abandonner">
                            <Flag className="w-4 h-4 md:w-5 md:h-5 text-destructive group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
                        </Button>
                    </div>

                    {/* BOUTON SANS CHRONO (Mode Zen) */}
                    <div className={`transition-all duration-500 ease-out flex items-center origin-right ${(gameStatus === 'playing' && !isTimerDisabled) ? 'w-8 md:w-10 opacity-100 scale-100 overflow-visible' : 'w-0 opacity-0 scale-50 overflow-hidden'}`}>
                        <Button variant="outline" size="icon" onClick={onDisableTimer} className="!w-8 !h-8 md:!w-10 md:!h-10 !rounded-xl overflow-hidden border-white/10 bg-card/50 hover:bg-white/10 backdrop-blur-md transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] group" title="Désactiver le chrono">
                            <TimerOff className="w-4 h-4 md:w-5 md:h-5 text-foreground/80 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
                        </Button>
                    </div>

                    {/* BOUTON PARAMÈTRES*/}
                    <div className="w-8 md:w-10 flex items-center transition-all duration-500">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="!w-8 !h-8 md:!w-10 md:!h-10 !rounded-xl overflow-hidden border-white/10 bg-card/50 hover:bg-white/10 backdrop-blur-md transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] group" title="Paramètres">
                                    <Settings className="w-4 h-4 md:w-5 md:h-5 text-foreground/80 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                sideOffset={16}
                                className="w-72 glass-modal border-white/10 p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-background/40 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-4 duration-300 ease-out"
                            >
                                <div className="flex flex-col gap-5">

                                    {/* NOUVEAU : Section Aide (Visible uniquement en jeu si non utilisé) */}
                                    {gameStatus === 'playing' && !hasUsedHint && (
                                        <div className="glass-inner p-4 flex flex-col gap-3 animate-in fade-in zoom-in duration-300">
                                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold text-center">
                                                Coup de pouce
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={onHint}
                                                className="w-full h-10 rounded-lg border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:shadow-[0_0_15px_rgba(232,28,255,0.4)] flex items-center justify-center gap-2 group"
                                            >
                                                <Lightbulb className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
                                                <span className="font-semibold">Utiliser un indice</span>
                                            </Button>
                                        </div>
                                    )}

                                    {/* ALIGNEMENT DU TEXTE (Ton code actuel) */}
                                    <div className="glass-inner p-4 flex flex-col gap-3">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold text-center">
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

                                    {/* PROCHAINEMENT (Ton code actuel) */}
                                    <div className="glass-inner p-4">
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

            {/* 3. INPUT (CHAMP DE TEXTE) */}
            <div className="w-full md:w-auto md:flex-1 md:max-w-sm mx-0 md:mx-8 flex justify-center items-center relative transition-all duration-500 order-3 md:order-2">
                <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
                    {floatingWords.map(fw => (
                        <span
                            key={fw.id}
                            className="absolute text-foreground font-titre text-xl md:text-2xl animate-fly-up drop-shadow-[0_0_5px_rgba(252,222,255,0.5)]"
                            style={{ left: `${fw.leftPercentage}%`, bottom: '80%', transform: 'translateX(-50%)' }}
                        >
                            {fw.text}
                        </span>
                    ))}
                </div>

                {isFetchingLyrics ? (
                    <div className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl font-titre text-primary animate-pulse drop-shadow-[0_0_8px_rgba(232,28,255,0.4)] h-10 md:h-14">
                        <div className="w-4 h-4 md:w-6 md:h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Chargement...</span>
                    </div>
                ) : (
                    <Input
                        variant="glass"
                        type="text"
                        placeholder={gameStatus === 'ready' ? "Commence à taper..." : gameStatus === 'playing' ? "Tape un mot ici..." : "Partie terminée"}
                        disabled={gameStatus === 'won' || gameStatus === 'lost'}
                        value={currentInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        autoCapitalize="none"
                        className="h-10 md:h-14 px-3 md:px-6 rounded-xl text-lg md:text-2xl text-center font-texte w-full transition-all duration-500"
                    />
                )}
            </div>
        </div>
    );
}