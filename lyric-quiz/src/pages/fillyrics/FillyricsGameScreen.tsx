import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useFillyricsPlaylist } from '@/hooks/useFillyricsPlaylist';
import { Button } from '@/components/ui/button';
import { Heart, Play, ChevronUp, Timer, ChevronDown } from 'lucide-react';
import FillyricsGameRound from '@/features/fillyrics/FillyricsGameRound.tsx';
import FillyricsSummaryScreen from '@/pages/fillyrics/FillyricsSummaryScreen.tsx';

export default function FillyricsGameScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const selection = location.state?.selection;

    // --- ÉTATS GLOBAUX ---
    const [phase, setPhase] = useState<'mixing' | 'preview' | 'playing' | 'summary'>('mixing');
    const [lives, setLives] = useState(3);
    const [playedRoundsCount, setPlayedRoundsCount] = useState(0);

    const [roundResults, setRoundResults] = useState<
        {
            song: (typeof playlist)[0];
            won: boolean;
            points: number;
            stats: { foundWords: number; totalWords: number; speedBonus: number };
        }[]
    >([]);

    // Timer global remis à 30 secondes
    const [choiceCountdown, setChoiceCountdown] = useState(30);

    // --- GESTION DE LA PLAYLIST ---
    const [reloadKey] = useState(0);
    const {
        playlist,
        currentSong,
        currentRoundIndex,
        nextRound,
        isMixing,
        mixError,
        loadMore,
        isFetchingMore,
        isCatalogExhausted,
        pivotAlgorithm,
        defibrillatorAlgorithm, // 👈 NOUVEAU
    } = useFillyricsPlaylist(selection || [], reloadKey);

    const audioRef = useRef<HTMLAudioElement>(null);
    const consecutiveZeroWordsRef = useRef(0);
    const consecutiveLossesRef = useRef(0);

    const canScrollRef = useRef(true);

    // --- ♾️ MOTEUR DE SWIPE INFINI ---
    useEffect(() => {
        // On calcule combien de musiques il reste devant nous
        const remainingTracks = playlist.length - currentRoundIndex;

        // S'il en reste 4 ou moins, qu'on n'est pas déjà en train de charger, et que le catalogue n'est pas vide
        if (remainingTracks <= 4 && !isFetchingMore && !isCatalogExhausted) {
            loadMore(); // On lance la recharge discrète !
        }
    }, [currentRoundIndex, playlist.length, isFetchingMore, isCatalogExhausted, loadMore]);

    const sessionId = useMemo(() => crypto.randomUUID(), []);
    // --- LOGIQUE PARTAGÉE : JOUER ---
    const handlePlay = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setPhase('playing');
    }, []);

    // --- LOGIQUE PARTAGÉE : PASSER À LA SUIVANTE ---
    const triggerNext = useCallback(() => {
        if (phase !== 'preview') return;
        if (currentRoundIndex < playlist.length - 1) {
            nextRound();
        } else if (isCatalogExhausted) {
            navigate('/mode/fillyrics/exhausted'); // 👈 La magie opère ici !
        } else {
            handlePlay();
        }
    }, [
        phase,
        currentRoundIndex,
        playlist.length,
        nextRound,
        isCatalogExhausted,
        handlePlay,
        navigate,
    ]);

    // --- GESTION DE LA FIN DU ROUND ---
    const handleRoundEnd = useCallback(
        (
            won: boolean,
            points: number,
            stats: { foundWords: number; totalWords: number; speedBonus: number }
        ) => {
            // 🚨 DÉTECTION DU HARD SKIP (Zéro mot trouvé et perdu)
            if (!won && stats?.foundWords === 0) {
                consecutiveZeroWordsRef.current += 1;
            } else {
                consecutiveZeroWordsRef.current = 0;
            }

            if (consecutiveZeroWordsRef.current === 2) {
                pivotAlgorithm(currentRoundIndex);
                consecutiveZeroWordsRef.current = 0;
            }

            // ⚡ NOUVEAU : DÉTECTION DE LA FRUSTRATION (Défibrillateur)
            if (!won) {
                consecutiveLossesRef.current += 1;
            } else {
                consecutiveLossesRef.current = 0; // Une victoire = le joueur est soigné !
            }

            // Si 3 défaites de suite, on sort les palettes !
            // Note: Comme on a que 3 vies de base, pour voir l'effet sur la même partie, on le règle à 2 pour le test, ou on le laisse à 3 si tu comptes donner plus de vies.
            // Mettons-le à 2 échecs consécutifs pour garantir qu'il sauve le joueur avant le Game Over (qui arrive à 0 vie).
            if (consecutiveLossesRef.current === 2 && lives > 1) {
                defibrillatorAlgorithm(currentRoundIndex);
                consecutiveLossesRef.current = 0; // On désarme le défibrillateur
            }

            setPlayedRoundsCount((prev) => prev + 1);

            setRoundResults((prev) => [
                ...prev,
                { song: playlist[currentRoundIndex], won, points, stats },
            ]);

            const advanceOrExhaust = () => {
                if (currentRoundIndex >= playlist.length - 1 && isCatalogExhausted) {
                    navigate('/mode/fillyrics/exhausted'); // 👈 Et ici aussi !
                } else {
                    nextRound();
                    setChoiceCountdown(30);
                    setPhase('preview');
                }
            };

            if (!won) {
                setLives((prev) => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        setPhase('summary');
                    } else {
                        setTimeout(advanceOrExhaust, 500); // 👈 Utilisée ici
                    }
                    return newLives;
                });
            } else {
                setTimeout(advanceOrExhaust, 500); // 👈 Et utilisée ici
            }
        },
        [nextRound, currentRoundIndex, playlist.length, isCatalogExhausted]
    );

    // --- LOGIQUE DU CYCLE DE VIE ---
    useEffect(() => {
        if (phase === 'mixing' && !isMixing && playlist.length > 0) {
            setPhase('preview');
        }
    }, [isMixing, playlist.length, phase]);

    useEffect(() => {
        if (phase === 'preview') {
            if (choiceCountdown > 0) {
                const timer = setTimeout(() => setChoiceCountdown((prev) => prev - 1), 1000);
                return () => clearTimeout(timer);
            } else if (choiceCountdown === 0) {
                handlePlay();
            }
        }
    }, [choiceCountdown, phase, handlePlay]);

    // --- DÉTECTION DU SCROLL SOURIS ---
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (phase !== 'preview' || isMixing || !currentSong) return;
            if (e.deltaY > 50 && canScrollRef.current) {
                canScrollRef.current = false;
                triggerNext();
                setTimeout(() => (canScrollRef.current = true), 800);
            }
        };
        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, [phase, isMixing, currentSong, triggerNext]);

    // --- GESTION DES ERREURS DE PLAYLIST ---
    useEffect(() => {
        if (mixError) {
            // On renvoie au lobby en remplaçant l'historique (replace: true)
            // et on passe le message d'erreur dans le "state"
            navigate('/mode/fillyrics', {
                state: { error: mixError },
                replace: true,
            });
        }
    }, [mixError, navigate]);

    // --- SWIPE TACTILE ---
    const handleSwipeSkip = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y < -50) {
            // Swipe vers le haut
            triggerNext();
        }
    };

    // ==========================================
    // ÉCRAN 1 : MIXAGE (CHARGEMENT AVEC LE DISQUE D'OR)
    // ==========================================
    if (phase === 'mixing' || isMixing) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6">
                {/* 👉 LE DISQUE D'OR TOURNANT (Mix CSS + SVG Animé) */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="relative flex h-32 w-32 items-center justify-center rounded-full border border-[#8e731b] shadow-[0_0_30px_rgba(212,175,55,0.4)] md:h-40 md:w-40"
                    style={{
                        // Le dégradé conique en CSS donne le reflet de l'or
                        background:
                            'conic-gradient(from 0deg at 50% 50%, #d4af37 0%, #f8e08e 25%, #d4af37 50%, #fff8dc 75%, #d4af37 100%)',
                    }}
                >
                    {/* Le SVG superposé pour dessiner les sillons et le centre */}
                    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                        {/* Sillons (Cercles Concentriques fins) */}
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#8e731b"
                            strokeWidth="0.5"
                            opacity="0.4"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="32"
                            fill="none"
                            stroke="#8e731b"
                            strokeWidth="0.5"
                            opacity="0.4"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="24"
                            fill="none"
                            stroke="#8e731b"
                            strokeWidth="0.5"
                            opacity="0.4"
                        />

                        {/* Label Central (On utilise la couleur secondary néon) */}
                        <circle
                            cx="50"
                            cy="50"
                            r="11"
                            fill="black"
                            stroke="#8e731b"
                            strokeWidth="0.5"
                        />
                        <circle cx="50" cy="50" r="2" fill="black" />
                    </svg>

                    {/* Effet d'ombre portée derrière le vinyle pour donner du relief */}
                    <div className="absolute inset-0 -z-10 rounded-full bg-black opacity-40 blur-2xl" />
                </motion.div>

                <h2 className="font-titre mt-4 text-2xl tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    PRÉPARATION DU MIX
                </h2>
            </div>
        );
    }

    // ==========================================
    // ÉCRAN 2 : PREVIEW (PURE IMMERSION)
    // ==========================================
    if (phase === 'preview' && currentSong) {
        return (
            <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 transition-all duration-700"
                    style={{ backgroundImage: `url(${currentSong.album.cover_xl})` }}
                />
                <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-xl" />

                <div className="absolute top-6 z-30 flex w-full max-w-xl items-center justify-between px-6">
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart
                                key={i}
                                className={`h-8 w-8 ${i < lives ? 'text-destructive fill-destructive drop-shadow-[0_0_10px_rgba(255,42,95,0.8)]' : 'text-white/20'}`}
                            />
                        ))}
                    </div>
                    <div
                        className={`font-titre flex items-center gap-2 text-3xl ${choiceCountdown <= 5 ? 'text-destructive animate-pulse' : 'text-secondary'}`}
                    >
                        <Timer className="h-8 w-8" />
                        {choiceCountdown}s
                    </div>
                </div>

                {currentSong.preview && (
                    <audio ref={audioRef} src={currentSong.preview} autoPlay loop />
                )}

                {/* 4. Contenu Principal Centré */}
                <div className="z-10 mt-8 flex w-full max-w-md flex-col items-center px-4">
                    <div className="relative flex w-full justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSong.id}
                                initial={{ opacity: 0, y: 300, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -300, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 0 }}
                                onDragEnd={handleSwipeSkip}
                                className="flex w-full cursor-grab flex-col items-center active:cursor-grabbing"
                            >
                                <img
                                    src={currentSong.album.cover_xl}
                                    alt={currentSong.title}
                                    className="pointer-events-none mb-6 h-64 w-64 rounded-[2rem] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.6)] md:h-80 md:w-80"
                                />

                                <h2 className="font-titre line-clamp-2 w-full text-center text-4xl text-white drop-shadow-md">
                                    {currentSong.title}
                                </h2>
                                <p className="font-texte text-secondary mb-8 text-xl">
                                    {currentSong.artist.name}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* 👉 LA FLÈCHE À DROITE DE LA MUSIQUE */}
                        <div className="absolute top-32 right-0 z-30 -translate-y-1/2 sm:-right-4 md:top-40">
                            <Button
                                onClick={triggerNext}
                                variant="ghost"
                                className="group flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/40 shadow-xl backdrop-blur-md hover:bg-white/10"
                                title="Passer à la suivante"
                            >
                                <ChevronDown className="h-8 w-8 text-white/70 transition-all group-hover:scale-110 group-hover:text-white" />
                            </Button>
                        </div>
                    </div>

                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="pointer-events-none mb-6 flex flex-col items-center text-white/40"
                    >
                        <ChevronUp className="mb-1 h-6 w-6" />
                        <span className="font-texte text-center text-xs tracking-widest uppercase">
                            Swipe vers le haut
                        </span>
                    </motion.div>

                    {/* 👉 LE NOUVEAU BOUTON GLASSMORPHISME (Pleine Largeur) */}
                    <div className="z-20 flex w-full gap-4">
                        <Button
                            onClick={handlePlay}
                            className="font-titre border-secondary/20 bg-secondary/10 hover:bg-secondary/20 h-16 w-full rounded-2xl border-2 text-2xl text-white shadow-[0_0_20px_rgba(64,201,255,0.3)] backdrop-blur-xl transition-all hover:scale-[1.02]"
                        >
                            <Play className="mr-2 h-7 w-7 fill-current text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                            JOUER CE SON
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // ÉCRAN 3 : JEU
    // ==========================================
    if (phase === 'playing' && currentSong) {
        return (
            <FillyricsGameRound
                key={currentSong.id}
                sessionId={sessionId}
                song={currentSong}
                roundIndex={playedRoundsCount}
                onRoundEnd={handleRoundEnd}
            />
        );
    }

    // ==========================================
    // ÉCRAN 4 : GAME OVER / RÉSUMÉ
    // ==========================================
    if (phase === 'summary') {
        return (
            <FillyricsSummaryScreen
                results={roundResults}
                onReplay={() => window.location.reload()}
                onQuit={() => navigate('/mode/fillyrics')}
            />
        );
    }

    return null;
}
