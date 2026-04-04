import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Song } from '@/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RefreshCw, Home, Music, Target, Zap } from 'lucide-react';

export interface FillyricsSummaryScreenProps {
    results: {
        song: Song;
        won: boolean;
        points: number;
        stats: { foundWords: number; totalWords: number; speedBonus: number };
    }[];
    onReplay: () => void;
    onQuit: () => void;
}

export default function FillyricsSummaryScreen({
    results,
    onReplay,
    onQuit,
}: FillyricsSummaryScreenProps) {
    // --- 🧮 CALCUL DES STATISTIQUES ---
    const score = results.filter((r) => r.won).length;
    const totalPoints = results.reduce((acc, curr) => acc + curr.points, 0);

    const totalFoundWords = results.reduce((acc, curr) => acc + curr.stats.foundWords, 0);
    const totalWords = results.reduce((acc, curr) => acc + curr.stats.totalWords, 0);
    const globalPrecision = totalWords > 0 ? Math.round((totalFoundWords / totalWords) * 100) : 0;

    const avgSpeedBonus =
        results.length > 0
            ? Math.round(
                  (results.reduce((acc, curr) => acc + curr.stats.speedBonus, 0) / results.length) *
                      100
              )
            : 0;

    // --- 🏅 CALCUL DU RANG (S, A, B, C, D) ---
    const gradeInfo = useMemo(() => {
        if (globalPrecision >= 95)
            return {
                letter: 'S',
                color: 'text-primary drop-shadow-[0_0_30px_rgba(232,28,255,0.8)]',
                glow: 'shadow-[0_0_50px_rgba(232,28,255,0.4)]',
                phrase: 'LÉGENDAIRE',
            };
        if (globalPrecision >= 80)
            return {
                letter: 'A',
                color: 'text-[#4ade80] drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]',
                glow: 'shadow-[0_0_40px_rgba(74,222,128,0.3)]',
                phrase: 'EXCELLENT',
            };
        if (globalPrecision >= 60)
            return {
                letter: 'B',
                color: 'text-secondary drop-shadow-[0_0_20px_rgba(64,201,255,0.6)]',
                glow: 'shadow-[0_0_40px_rgba(64,201,255,0.3)]',
                phrase: 'SOLIDE',
            };
        if (globalPrecision >= 40)
            return {
                letter: 'C',
                color: 'text-[#facc15] drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]',
                glow: 'shadow-[0_0_40px_rgba(250,204,21,0.3)]',
                phrase: 'PAS MAL',
            };
        return {
            letter: 'D',
            color: 'text-destructive drop-shadow-[0_0_20px_rgba(255,42,95,0.6)]',
            glow: 'shadow-[0_0_40px_rgba(255,42,95,0.3)]',
            phrase: 'AÏE...',
        };
    }, [globalPrecision]);

    return (
        <div className="bg-background text-foreground flex min-h-screen flex-col items-center overflow-x-hidden p-4 pb-20 md:p-6">
            <h1 className="font-titre titre-neon-secondary mt-8 mb-2 text-center text-4xl tracking-widest drop-shadow-[0_0_20px_rgba(64,201,255,0.4)] md:text-5xl">
                FIN DE SESSION
            </h1>

            {/* 🏅 LA ZONE DU RANG */}
            <div className="mt-8 mb-8 flex flex-col items-center gap-4">
                <motion.div
                    initial={{ scale: 3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className={`relative flex h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur-md md:h-40 md:w-40 ${gradeInfo.glow}`}
                >
                    <span className={`font-titre text-7xl md:text-8xl ${gradeInfo.color}`}>
                        {gradeInfo.letter}
                    </span>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="font-texte text-lg tracking-widest text-white/60 uppercase"
                >
                    {gradeInfo.phrase}
                </motion.p>
            </div>

            {/* 📊 SCORE ET STATISTIQUES GLOBALES */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-10 flex w-full max-w-2xl flex-col gap-3 sm:gap-4"
            >
                {/* 1. Le Score Total Géant */}
                <div className="glass-panel border-secondary/30 flex flex-col items-center justify-center p-6 text-center shadow-[0_0_15px_rgba(64,201,255,0.15)]">
                    <p className="font-titre text-secondary mb-1 text-[10px] tracking-widest uppercase">
                        Score Total
                    </p>
                    <p className="font-titre text-4xl text-white">{totalPoints.toLocaleString()}</p>
                </div>

                {/* 2. Les 3 jauges de performance (Pistes / Précision / VITESSE) */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="glass-panel flex flex-col items-center justify-center p-4 text-center">
                        <Music className="mb-2 h-6 w-6 text-white/40" />
                        <p className="font-titre text-2xl text-white">
                            {score}
                            <span className="text-sm text-white/40">/{results.length}</span>
                        </p>
                        <p className="font-texte mt-1 text-[10px] tracking-widest text-white/50 uppercase">
                            Pistes
                        </p>
                    </div>

                    <div className="glass-panel flex flex-col items-center justify-center p-4 text-center">
                        <Target className="mb-2 h-6 w-6 text-white/40" />
                        <p className="font-titre text-2xl text-white">{globalPrecision}%</p>
                        <p className="font-texte mt-1 text-[10px] tracking-widest text-white/50 uppercase">
                            Précision
                        </p>
                    </div>

                    <div className="glass-panel flex flex-col items-center justify-center p-4 text-center">
                        <Zap className="mb-2 h-6 w-6 text-white/40" />
                        <p className="font-titre text-2xl text-white">+{avgSpeedBonus}%</p>
                        <p className="font-texte mt-1 text-[10px] tracking-widest text-white/50 uppercase">
                            Vitesse
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* 📜 LE DÉTAIL DES MUSIQUES */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mb-8 w-full max-w-2xl rounded-[30px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex flex-col gap-3">
                    {results.map((r, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-3"
                        >
                            <span className="font-titre w-6 text-right text-xl text-white/30">
                                {i + 1}.
                            </span>
                            <img
                                src={r.song.album.cover_xl}
                                alt="cover"
                                className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                                <p className="font-titre line-clamp-1 text-lg text-white">
                                    {r.song.title}
                                </p>
                                <div className="mt-1 flex gap-3">
                                    <span className="font-texte flex items-center gap-1 text-xs text-white/50">
                                        <Target className="h-3 w-3" />{' '}
                                        {Math.round(
                                            (r.stats.foundWords / r.stats.totalWords) * 100
                                        )}
                                        %
                                    </span>
                                    <span className="font-texte flex items-center gap-1 text-xs text-white/50">
                                        <Zap className="h-3 w-3" /> +
                                        {Math.round(r.stats.speedBonus * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div className="mr-2 flex flex-col items-end">
                                <span
                                    className={`font-titre text-lg ${r.won ? 'text-secondary' : 'text-destructive'}`}
                                >
                                    {r.points} pts
                                </span>
                                {r.won ? (
                                    <CheckCircle2 className="text-secondary mt-1 h-5 w-5 drop-shadow-[0_0_10px_rgba(64,201,255,0.5)]" />
                                ) : (
                                    <XCircle className="text-destructive mt-1 h-5 w-5 drop-shadow-[0_0_10px_rgba(255,42,95,0.5)]" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* 🚪 LES BOUTONS */}
            <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
                <Button
                    onClick={onReplay}
                    className="font-titre bg-secondary hover:bg-secondary/80 text-secondary-foreground h-14 flex-1 rounded-2xl text-lg shadow-[0_0_15px_rgba(64,201,255,0.4)]"
                >
                    <RefreshCw className="mr-2 h-5 w-5" /> REJOUER
                </Button>
                <Button
                    onClick={onQuit}
                    variant="outline"
                    className="font-titre h-14 flex-1 rounded-2xl border-white/10 text-lg hover:bg-white/10"
                >
                    <Home className="mr-2 h-5 w-5" /> QUITTER
                </Button>
            </div>
        </div>
    );
}
