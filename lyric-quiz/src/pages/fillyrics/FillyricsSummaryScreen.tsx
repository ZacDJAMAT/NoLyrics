import { Song } from '@/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RefreshCw, Home, Music } from 'lucide-react';

interface FillyricsSummaryScreenProps {
    results: { song: Song; won: boolean; points: number }[];
    onReplay: () => void;
    onQuit: () => void;
}

export default function FillyricsSummaryScreen({
    results,
    onReplay,
    onQuit,
}: FillyricsSummaryScreenProps) {
    const score = results.filter((r) => r.won).length;
    // 👉 CALCUL DU SCORE TOTAL
    const totalPoints = results.reduce((acc, curr) => acc + curr.points, 0);

    return (
        <div className="bg-background text-foreground flex min-h-screen flex-col items-center overflow-x-hidden p-4 pb-20 md:p-6">
            <h1 className="font-titre titre-neon-secondary mt-12 mb-2 text-center text-5xl tracking-widest drop-shadow-[0_0_20px_rgba(64,201,255,0.4)] md:text-6xl">
                RÉSUMÉ DU JEU
            </h1>

            <div className="mt-8 mb-10 flex flex-col items-center gap-6">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-black/40 shadow-[0_0_30px_rgba(64,201,255,0.2)]">
                    <div className="border-secondary/30 animate-spin-slow absolute inset-2 rounded-full border-2 border-dashed"></div>
                    <div className="text-center">
                        <p className="font-titre text-5xl text-white">
                            {score}
                            <span className="text-3xl text-white/50">/{results.length}</span>
                        </p>
                    </div>
                </div>

                {/* 👉 AFFICHAGE DU SCORE TOTAL */}
                <div className="bg-secondary/20 border-secondary/50 rounded-2xl border px-8 py-3 text-center shadow-[0_0_15px_rgba(64,201,255,0.3)]">
                    <p className="font-titre text-secondary mb-1 text-sm tracking-widest uppercase">
                        Score Total
                    </p>
                    <p className="font-titre text-4xl text-white">
                        {totalPoints.toLocaleString()}{' '}
                        <span className="text-lg text-white/60">pts</span>
                    </p>
                </div>
            </div>

            <div className="mb-8 w-full max-w-2xl rounded-[30px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="font-titre mb-6 flex items-center gap-2 border-b border-white/10 pb-3 text-xl text-white">
                    <Music className="text-secondary h-5 w-5" /> Détail des Contrats
                </h3>
                <div className="flex flex-col gap-3">
                    {results.map((r, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
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
                                <p className="font-texte line-clamp-1 text-sm text-white/60">
                                    {r.song.artist.name}
                                </p>
                            </div>

                            {/* 👉 AFFICHAGE DES POINTS PAR MUSIQUE */}
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
            </div>
            <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
                <Button
                    onClick={onReplay}
                    className="font-titre bg-secondary hover:bg-secondary/80 text-secondary-foreground h-14 flex-1 rounded-2xl text-lg shadow-[0_0_15px_rgba(64,201,255,0.4)]"
                >
                    <RefreshCw className="mr-2 h-5 w-5" /> remixer
                </Button>
                <Button
                    onClick={onQuit}
                    variant="outline"
                    className="font-titre h-14 flex-1 rounded-2xl border-white/10 text-lg hover:bg-white/10"
                >
                    <Home className="mr-2 h-5 w-5" /> Retour au Lobby
                </Button>
            </div>
        </div>
    );
}
