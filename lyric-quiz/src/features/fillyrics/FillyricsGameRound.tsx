import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // 👉 IMPORT AJOUTÉ
import { Song } from '@/types';
import { useFillyricsGame } from '@/hooks/useFillyricsGame';

import { SkipForward, HeartCrack, CheckCircle2, Disc3 } from 'lucide-react';
import LyricsGrid from '@/features/allmusic/LyricsGrid';
import FillyricsInlineComposer from './FillyricsInlineComposer';

import ContractHUD from './ContractHUD';

interface FillyricsGameRoundProps {
    song: Song;
    sessionId: string;
    roundIndex: number;
    currentContractTime: number;
    onRoundEnd: (
        won: boolean,
        points: number,
        stats: { foundWords: number; totalWords: number; speedBonus: number; timeLeftRound: number } // 👈 NOUVEAU
    ) => void;
}

export default function FillyricsGameRound({
    sessionId,
    song,
    roundIndex,
    onRoundEnd,
    currentContractTime,
}: FillyricsGameRoundProps) {
    const [nextRoundTimer, setNextRoundTimer] = useState(5);
    const hasEnded = useRef(false);

    const handleError = useCallback((message: string) => {
        console.error(message);
    }, []);

    const {
        lyricsData,
        isFetchingLyrics,
        currentInput,
        timeLeft,
        gameStatus,
        scorePercentage,
        handleInputChange,
        scorePoints,
        lastFoundWord,
        thresholdPercent,
        isContractSecured,
        speedBonusMultiplier,
        activeWordCoords,
        setActiveWordCoords,
        setCurrentInput,
        cycleNextWord,
        skipRound,
        foundWordsCount,
        totalWords,
        savedContractTime,
    } = useFillyricsGame(sessionId, song, roundIndex, currentContractTime, handleError);

    // 1. Le useEffect qui s'occupe JUSTE de baisser le chrono
    useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'lost') {
            const timer = setInterval(() => {
                setNextRoundTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameStatus]);

    // 2. Le useEffect qui s'occupe JUSTE d'alerter le parent quand le chrono est à 0
    useEffect(() => {
        if ((gameStatus === 'won' || gameStatus === 'lost') && nextRoundTimer === 0) {
            if (!hasEnded.current) {
                hasEnded.current = true;
                onRoundEnd(gameStatus === 'won', scorePoints, {
                    foundWords: foundWordsCount,
                    totalWords: totalWords,
                    speedBonus: speedBonusMultiplier,
                    timeLeftRound: savedContractTime,
                });
            }
        }
    }, [
        nextRoundTimer,
        gameStatus,
        onRoundEnd,
        scorePoints,
        foundWordsCount,
        totalWords,
        speedBonusMultiplier,
        timeLeft,
        savedContractTime,
    ]);

    return (
        <div className="bg-background selection:bg-secondary selection:text-secondary-foreground relative flex min-h-screen flex-col overflow-clip font-sans">
            <FillyricsInlineComposer
                currentInput={currentInput}
                onInputChange={handleInputChange}
                gameStatus={gameStatus}
                onTabPress={cycleNextWord}
            />

            {/* 🎮 HUD FLOTTANT */}
            <div className="pointer-events-none absolute top-6 right-6 left-6 z-30 flex items-start justify-between">
                <div className="flex flex-col">
                    <span className="font-titre text-secondary text-2xl drop-shadow-[0_0_10px_rgba(64,201,255,0.5)]">
                        Piste {roundIndex + 1}
                    </span>
                    <span className="font-texte text-[10px] tracking-[0.2em] text-white/40 uppercase">
                        Objectif : {thresholdPercent}%
                    </span>
                </div>

                <div className="pointer-events-auto flex flex-col items-end gap-1">
                    <div className="font-titre flex items-center gap-2 text-3xl text-white drop-shadow-md">
                        <Disc3 className="h-6 w-6 text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                        {scorePoints}
                    </div>
                    <button
                        onClick={skipRound} // 👈 NOUVEAU : On utilise la fonction intelligente
                        className="group font-texte hover:text-secondary flex items-center gap-2 text-[10px] tracking-widest text-white/30 uppercase transition-all"
                    >
                        Skip{' '}
                        <SkipForward className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>

            {/* 📝 ZONE CENTRALE */}
            <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center p-4 pt-24 pb-32 md:p-8">
                {/* ⚡ JAUGE DE TENSION (LE CONTRAT) */}
                <div className="mb-4 flex w-full max-w-xl flex-col items-center gap-8 px-4">
                    <ContractHUD
                        timeLeft={timeLeft}
                        maxTime={30}
                        currentPercent={scorePercentage}
                        thresholdPercent={thresholdPercent}
                        isSecured={isContractSecured}
                    />
                </div>

                <div className="relative w-full">
                    <LyricsGrid
                        lyricsData={lyricsData}
                        isFetchingLyrics={isFetchingLyrics}
                        gameStatus={gameStatus}
                        lastFoundWord={lastFoundWord}
                        alignment="center"
                        activeWordCoords={activeWordCoords}
                        currentInput={currentInput}
                        onWordClick={(l, w) => {
                            setActiveWordCoords({ l, w });
                            setCurrentInput('');
                        }}
                    />
                </div>
            </main>

            {/* ============================================================ */}
            {/* 🌬️ TRANSITIONS DISCRÈTES (Smooth avec Framer Motion) */}
            {/* ============================================================ */}

            {/* 👉 NOUVEAU : Wrapper AnimatePresence */}
            <AnimatePresence mode="wait">
                {(gameStatus === 'won' || gameStatus === 'lost') && (
                    <motion.div
                        key={`${gameStatus}-transition`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                        className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-end"
                    >
                        {/* 1. Halo lumineux subtil sur les bords de l'écran */}
                        <div
                            className={`absolute inset-0 opacity-20 transition-all duration-1000 ${
                                gameStatus === 'won'
                                    ? 'shadow-[inset_0_0_150px_rgba(64,201,255,1)]'
                                    : 'shadow-[inset_0_0_150px_rgba(255,42,95,1)]'
                            }`}
                        />

                        {/* 2. Pilule flottante élégante (Avec animation douce y/opacity) */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                            className="mb-12 flex w-full justify-center"
                        >
                            <div className="flex items-center gap-3 rounded-full border border-white/5 bg-black/40 px-6 py-2.5 shadow-2xl backdrop-blur-md md:gap-4">
                                {gameStatus === 'won' ? (
                                    <CheckCircle2 className="text-secondary h-5 w-5" />
                                ) : (
                                    <HeartCrack className="text-destructive h-5 w-5" />
                                )}
                                <span
                                    className={`font-titre text-sm tracking-[0.15em] uppercase md:text-lg ${gameStatus === 'won' ? 'text-secondary' : 'text-destructive'}`}
                                >
                                    {gameStatus === 'won'
                                        ? `Contrat Rempli • +${scorePoints} pts`
                                        : 'Contrat Échoué • Vie Perdue'}
                                </span>
                            </div>
                        </motion.div>

                        {/* 3. Fil du temps (1px d'épaisseur tout en bas) */}
                        <div className="h-1 w-full bg-transparent">
                            <div
                                className={`h-full transition-all duration-1000 ease-linear ${
                                    gameStatus === 'won'
                                        ? 'bg-secondary shadow-[0_0_10px_rgba(64,201,255,1)]'
                                        : 'bg-destructive shadow-[0_0_10px_rgba(255,42,95,1)]'
                                }`}
                                style={{ width: `${((5 - nextRoundTimer) / 5) * 100}%` }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
