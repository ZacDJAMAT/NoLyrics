import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Shield, RefreshCw, Skull, FastForward } from 'lucide-react';

import { Song } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSurvivalStore } from '@/hooks/useSurvivalStore';
import { Button } from '@/components/ui/button';
import SurvivalGameRound from '@/features/fillyrics/SurvivalGameRound';

export default function FillyricsSurvivalScreen() {
    const navigate = useNavigate();
    const { user, isGuest, loginWithGoogle } = useAuth();

    // Le Moteur de Survie
    const { isSurviving, hype, score, coins, startGame, reset } = useSurvivalStore();

    // L'état de l'orchestrateur
    const [playlist, setPlaylist] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Chargement initial du "Flow" (Le Top 50 Mondial)
    useEffect(() => {
        const fetchInitialFlow = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/deezer/chart/0/tracks?limit=50');
                if (!response.ok) throw new Error('Erreur réseau');

                const data = await response.json();
                if (data && data.data) {
                    const formattedSongs: Song[] = data.data.map((track: any) => ({
                        id: track.id,
                        title: track.title,
                        artist: { name: track.artist.name, id: track.artist.id, picture_xl: '' },
                        album: {
                            cover_small: track.album.cover_small || '',
                            cover_xl: track.album.cover_xl || track.album.cover_medium || '',
                        },
                        duration: track.duration,
                    }));

                    // On mélange le top 50 pour l'effet "aléatoire" TikTok
                    setPlaylist(formattedSongs.sort(() => 0.5 - Math.random()));
                }
            } catch (err) {
                console.error('Impossible de charger le flow', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialFlow();

        // Nettoyage absolu en quittant la page
        return () => reset();
    }, [reset]);

    // 2. Gestion des transitions de musique
    const nextSong = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % playlist.length); // Boucle infinie
        // Ici on pourrait ajouter un "+40 HYPE" volant pour le "Track Cleared"
    }, [playlist.length]);

    const handleStart = () => {
        setHasStarted(true);
        startGame(); // Lance la hype à 50%
    };

    const handleReplay = () => {
        setPlaylist((prev) => [...prev].sort(() => 0.5 - Math.random())); // Remélange
        setCurrentIndex(0);
        setHasStarted(false); // Retour à l'écran TikTok
        reset();
    };

    // --- RENDU : CHARGEMENT ---
    if (isLoading || playlist.length === 0) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="border-secondary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent shadow-[0_0_15px_rgba(64,201,255,0.5)]" />
            </div>
        );
    }

    const currentSong = playlist[currentIndex];
    const isGameOver = !isSurviving && hasStarted && hype === 0;

    return (
        <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
            {/* BACKGROUND DYNAMIQUE (Pochette de l'album floutée) */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 blur-2xl transition-all duration-1000"
                style={{ backgroundImage: `url(${currentSong.album.cover_xl})` }}
            />
            {/* Overlay très sombre pour garantir la lisibilité */}
            <div className="absolute inset-0 z-0 bg-black/80" />

            <AnimatePresence mode="wait">
                {/* --- ÉCRAN 1 : LE LOBBY TIKTOK (Teasing & Autorisation Audio) --- */}
                {!hasStarted && (
                    <motion.div
                        key="lobby"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="z-10 flex w-full max-w-md flex-col items-center px-6 text-center"
                    >
                        <div className="relative mb-8 h-64 w-64 overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(232,28,255,0.3)]">
                            <img
                                src={currentSong.album.cover_xl}
                                alt="Cover"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <h2 className="font-texte text-muted-foreground mb-1 text-xl tracking-widest uppercase">
                            {currentSong.artist.name}
                        </h2>
                        <h1 className="font-titre titre-neon-primary mb-12 text-4xl">
                            {currentSong.title}
                        </h1>

                        <div className="flex w-full flex-col gap-4">
                            <Button
                                onClick={handleStart}
                                className="bg-secondary/20 text-secondary border-secondary/40 hover:bg-secondary font-titre h-16 rounded-2xl border text-xl shadow-[0_0_20px_rgba(64,201,255,0.4)] transition-all hover:text-black hover:shadow-[0_0_30px_rgba(64,201,255,0.8)]"
                            >
                                <Play className="mr-2 h-6 w-6 fill-current" />
                                TAPER POUR JOUER
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={nextSong}
                                className="text-muted-foreground hover:text-foreground font-texte h-14 text-lg tracking-wider uppercase hover:bg-white/5"
                            >
                                <FastForward className="mr-2 h-5 w-5" />
                                Passer ce son
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* --- ÉCRAN 2 : LE JEU EN COURS (Arène In-Line) --- */}
                {hasStarted && !isGameOver && (
                    <motion.div
                        key="game"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="z-10 flex h-full w-full flex-col justify-start pt-8"
                    >
                        <SurvivalGameRound song={currentSong} onTrackComplete={nextSong} />
                    </motion.div>
                )}

                {/* --- ÉCRAN 3 : LE GAME OVER (Hype Kill & Conversion) --- */}
                {isGameOver && (
                    <motion.div
                        key="gameover"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    >
                        <div className="glass-panel bg-popover/95 border-destructive/50 flex w-full max-w-sm flex-col items-center p-8 shadow-[0_0_50px_rgba(255,42,95,0.3)]">
                            <Skull className="text-destructive mb-4 h-16 w-16 drop-shadow-[0_0_15px_rgba(255,42,95,0.8)]" />
                            <h1 className="font-titre titre-neon-destructive mb-6 text-5xl">
                                HYPE KILL
                            </h1>

                            <div className="mb-8 flex w-full flex-col items-center gap-2 rounded-xl border border-white/5 bg-black/40 p-4">
                                <p className="font-texte text-muted-foreground text-sm tracking-widest uppercase">
                                    Score Final
                                </p>
                                <p className="font-titre text-4xl text-white">
                                    {score.toLocaleString()}
                                </p>

                                {coins > 0 && (
                                    <div className="font-texte mt-2 flex items-center gap-2 font-bold text-yellow-400">
                                        <div className="h-4 w-4 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                                        +{coins} Disques d'Or
                                    </div>
                                )}
                            </div>

                            <div className="flex w-full flex-col gap-3">
                                <Button
                                    onClick={handleReplay}
                                    className="font-titre bg-primary/20 text-primary border-primary/50 hover:bg-primary h-14 border text-lg shadow-[0_0_15px_rgba(232,28,255,0.4)] hover:text-white"
                                >
                                    <RefreshCw className="mr-2 h-5 w-5" />
                                    REVANCHE
                                </Button>

                                {isGuest && user && (
                                    <Button
                                        variant="neon-glass"
                                        onClick={loginWithGoogle}
                                        className="font-texte h-14 text-sm font-bold tracking-wide"
                                    >
                                        <Shield className="mr-2 h-4 w-4" />
                                        SÉCURISER MON BUTIN
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/')}
                                    className="text-muted-foreground mt-2"
                                >
                                    Retour à l'accueil
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
