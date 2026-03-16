import { useState, useEffect } from 'react';
import { GameStatus } from '../../types.ts';
import { Input } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover.tsx';
import {
    Settings,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Lightbulb,
    Flag,
    RotateCcw,
    TimerOff,
} from 'lucide-react';

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
    scorePercentage,
    foundWordsCount,
    totalWords,
    currentInput,
    handleInputChange,
    gameStatus,
    isFetchingLyrics,
    timeLeft,
    formattedTime,
    lastFoundWord,
    onGiveUp,
    onRestart,
    lyricsAlignment,
    onAlignmentChange,
    onHint,
    hasUsedHint,
    isTimerDisabled,
    onDisableTimer,
}: ScoreBoardProps) {
    const [floatingWords, setFloatingWords] = useState<FloatingWord[]>([]);

    useEffect(() => {
        if (lastFoundWord && foundWordsCount > 0) {
            const newFloatingWord: FloatingWord = {
                id: Date.now() + Math.random(),
                text: lastFoundWord,
                leftPercentage: 10 + Math.random() * 80,
            };
            setFloatingWords((prev) => [...prev, newFloatingWord]);
            setTimeout(() => {
                setFloatingWords((prev) => prev.filter((w) => w.id !== newFloatingWord.id));
            }, 1000);
        }
    }, [foundWordsCount, lastFoundWord]);

    return (
        <div
            className={`glass-panel sticky top-2 z-50 flex flex-wrap items-center justify-between gap-y-3 p-3 transition-[box-shadow,border-color] duration-500 ease-in-out md:top-6 md:flex-nowrap md:gap-y-0 md:p-6 ${
                gameStatus === 'won'
                    ? 'border-secondary shadow-[0_0_20px_rgba(64,201,255,0.3)]'
                    : gameStatus === 'lost'
                      ? 'border-destructive shadow-[0_0_20px_rgba(255,42,95,0.3)]'
                      : ''
            }`}
            style={{
                WebkitTransform: 'translate3d(0,0,0)',
                transform: 'translate3d(0,0,0)',
            }}
        >
            {/* 1. SCORE */}
            <div className="order-1 w-16 shrink-0 text-center transition-all duration-500 md:w-24">
                <p className="text-muted-foreground mb-0 text-[10px] font-semibold tracking-wider uppercase md:mb-1 md:text-xs">
                    Score
                </p>
                <p className="titre-neon-primary font-titre text-foreground text-lg leading-none md:text-3xl md:leading-tight">
                    {scorePercentage}%
                </p>
                <p className="text-muted-foreground font-texte mt-0.5 text-[10px] md:mt-0 md:text-sm">
                    {foundWordsCount} / {totalWords}
                </p>
            </div>

            {/* 2. CHRONO & BOUTONS */}
            <div className="order-2 flex shrink-0 items-center gap-1.5 transition-all duration-500 md:order-3 md:gap-4">
                <div className="mr-0 w-16 text-center transition-all duration-500 md:mr-2 md:w-auto">
                    <p
                        className={`mb-0 text-[10px] font-semibold tracking-wider uppercase md:mb-1 md:text-xs ${timeLeft <= 30 && timeLeft >= 0 && gameStatus === 'playing' ? '!text-destructive animate-pulse' : 'text-muted-foreground'}`}
                    >
                        Temps
                    </p>
                    <p
                        className={`titre-neon-primary font-titre text-lg leading-none md:text-3xl md:leading-tight ${timeLeft <= 30 && timeLeft >= 0 && gameStatus === 'playing' ? 'titre-neon-destructive' : 'text-foreground'}`}
                    >
                        {formattedTime}
                    </p>
                </div>

                <div className="flex h-8 items-center gap-1 border-l border-white/10 pl-1.5 transition-all duration-500 ease-out md:h-10 md:gap-2 md:pl-4">
                    {/* ZONE DROITE : Uniquement le bouton Paramètres */}
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="bg-card/50 group h-10 w-10 rounded-xl border-white/10 transition-all hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                    title="Paramètres et Actions"
                                >
                                    <Settings
                                        className="text-foreground/80 h-5 w-5 transition-transform duration-500 group-hover:rotate-90"
                                        strokeWidth={2.5}
                                    />
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent
                                align="end"
                                sideOffset={16}
                                className="glass-modal bg-background/40 w-72 rounded-3xl border-white/10 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl duration-300 ease-out"
                            >
                                <div className="flex flex-col gap-5">
                                    {/* SECTION 1 : ACTIONS DE JEU */}
                                    <div className="glass-inner flex flex-col gap-3 p-4">
                                        <p className="text-muted-foreground mb-1 text-center text-xs font-semibold tracking-wider uppercase">
                                            Actions de jeu
                                        </p>

                                        {/* Indice (Visible si en jeu et non utilisé) */}
                                        {gameStatus === 'playing' && !hasUsedHint && (
                                            <Button
                                                variant="neon-primary"
                                                onClick={onHint}
                                                className="group h-10 w-full justify-start gap-3 rounded-lg"
                                            >
                                                <Lightbulb
                                                    className="h-4 w-4 transition-transform group-hover:scale-110"
                                                    strokeWidth={2.5}
                                                />
                                                <span className="font-semibold">Coup de pouce</span>
                                            </Button>
                                        )}

                                        {/* Mode Zen (Visible si en jeu et chrono actif) */}
                                        {gameStatus === 'playing' && !isTimerDisabled && (
                                            <Button
                                                variant="neon-primary"
                                                onClick={onDisableTimer}
                                                className="group h-10 w-full justify-start gap-3 rounded-lg"
                                            >
                                                <TimerOff
                                                    className="h-4 w-4 transition-transform group-hover:scale-110"
                                                    strokeWidth={2.5}
                                                />
                                                <span className="font-semibold">Mode Zen</span>
                                            </Button>
                                        )}

                                        {/* Recommencer */}
                                        {gameStatus === 'playing' && (
                                            <Button
                                                variant="neon-secondary"
                                                onClick={onRestart}
                                                className="group h-10 w-full justify-start gap-3 rounded-lg"
                                            >
                                                <RotateCcw
                                                    className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-90"
                                                    strokeWidth={2.5}
                                                />
                                                <span className="font-semibold">Recommencer</span>
                                            </Button>
                                        )}

                                        {/* Abandonner (Visible uniquement en jeu) */}
                                        {gameStatus === 'playing' && (
                                            <Button
                                                variant="neon-destructive"
                                                onClick={onGiveUp}
                                                className="group h-10 w-full justify-start gap-3 rounded-lg"
                                            >
                                                <Flag
                                                    className="h-4 w-4 transition-transform group-hover:scale-110"
                                                    strokeWidth={2.5}
                                                />
                                                <span className="font-semibold">Abandonner</span>
                                            </Button>
                                        )}

                                        {gameStatus !== 'playing' && (
                                            <div className="px-1 py-2">
                                                <p className="text-muted-foreground/80 text-center text-sm italic">
                                                    Lance la partie pour avoir accès aux actions de
                                                    jeu.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* SECTION 2 : AFFICHAGE */}
                                    <div className="glass-inner flex flex-col gap-3 p-4">
                                        <p className="text-muted-foreground mb-1 text-center text-xs font-semibold tracking-wider uppercase">
                                            Alignement du texte
                                        </p>
                                        <div className="flex justify-center gap-1 rounded-lg bg-black/40 p-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-10 rounded-md ${lyricsAlignment === 'left' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`}
                                                onClick={() => onAlignmentChange('left')}
                                                title="Aligner à gauche"
                                            >
                                                <AlignLeft size={16} strokeWidth={2.5} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-10 rounded-md ${lyricsAlignment === 'center' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`}
                                                onClick={() => onAlignmentChange('center')}
                                                title="Centrer"
                                            >
                                                <AlignCenter size={16} strokeWidth={2.5} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-10 rounded-md ${lyricsAlignment === 'right' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`}
                                                onClick={() => onAlignmentChange('right')}
                                                title="Aligner à droite"
                                            >
                                                <AlignRight size={16} strokeWidth={2.5} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* 3. INPUT (CHAMP DE TEXTE) */}
            <div className="relative order-3 mx-0 flex w-full items-center justify-center transition-all duration-500 md:order-2 md:mx-8 md:w-auto md:max-w-sm md:flex-1">
                <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
                    {floatingWords.map((fw) => (
                        <span
                            key={fw.id}
                            className="text-foreground font-titre animate-fly-up absolute text-xl drop-shadow-[0_0_5px_rgba(252,222,255,0.5)] md:text-2xl"
                            style={{
                                left: `${fw.leftPercentage}%`,
                                bottom: '80%',
                                transform: 'translateX(-50%)',
                            }}
                        >
                            {fw.text}
                        </span>
                    ))}
                </div>

                {isFetchingLyrics ? (
                    <div className="font-titre text-primary flex h-10 animate-pulse items-center gap-2 text-lg drop-shadow-[0_0_8px_rgba(232,28,255,0.4)] md:h-14 md:gap-3 md:text-2xl">
                        <div className="border-primary h-4 w-4 animate-spin rounded-full border-4 border-t-transparent md:h-6 md:w-6"></div>
                        <span>Chargement...</span>
                    </div>
                ) : (
                    <Input
                        variant="glass"
                        type="text"
                        placeholder={
                            gameStatus === 'ready'
                                ? 'Commence à taper...'
                                : gameStatus === 'playing'
                                  ? 'Tape un mot ici...'
                                  : 'Partie terminée'
                        }
                        disabled={gameStatus === 'won' || gameStatus === 'lost'}
                        value={currentInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        autoCapitalize="none"
                        className="font-texte h-10 w-full rounded-xl px-3 text-center text-lg transition-all duration-500 md:h-14 md:px-6 md:text-2xl"
                    />
                )}
            </div>
        </div>
    );
}
