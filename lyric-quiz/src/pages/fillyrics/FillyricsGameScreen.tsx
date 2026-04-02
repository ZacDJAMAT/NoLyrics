import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useFillyricsPlaylist } from '@/hooks/useFillyricsPlaylist';
import { Button } from '@/components/ui/button';
import { Heart, Mic, Play, ChevronUp, Timer, SkipForward } from 'lucide-react';
import FillyricsGameRound from '@/features/fillyrics/FillyricsGameRound.tsx';

export default function FillyricsGameScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const selection = location.state?.selection;

    // --- ÉTATS GLOBAUX ---
    const [phase, setPhase] = useState<'mixing' | 'preview' | 'playing' | 'summary'>('mixing');
    const [lives, setLives] = useState(3);
    const [globalScore, setGlobalScore] = useState(0);

    // Timer global remis à 30 secondes
    const [choiceCountdown, setChoiceCountdown] = useState(30);

    // --- GESTION DE LA PLAYLIST ---
    const [reloadKey] = useState(0);
    const { playlist, currentSong, currentRoundIndex, nextRound, isMixing, mixError } =
        useFillyricsPlaylist(selection || [], reloadKey);

    const audioRef = useRef<HTMLAudioElement>(null);
    const canScrollRef = useRef(true);

    // --- LOGIQUE PARTAGÉE : PASSER À LA SUIVANTE ---
    const triggerNext = useCallback(() => {
        if (phase !== 'preview') return;
        if (currentRoundIndex < playlist.length - 1) {
            nextRound();
        } else {
            handlePlay(); // Buffer épuisé, on force le jeu
        }
    }, [phase, currentRoundIndex, playlist.length, nextRound]);

    // --- LOGIQUE PARTAGÉE : JOUER ---
    const handlePlay = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setPhase('playing');
    }, []);

    // --- GESTION DE LA FIN DU ROUND (Remonté ici pour respecter les Rules of Hooks !) ---
    const handleRoundEnd = useCallback(
        (won: boolean, points: number) => {
            setGlobalScore((prev) => prev + points);

            if (!won) {
                setLives((prev) => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        setPhase('summary');
                    } else {
                        // On a perdu une vie, on passe à la suite de la playlist
                        setTimeout(() => {
                            nextRound();
                            setChoiceCountdown(30); // On remet le chrono à 30s
                            setPhase('preview');
                        }, 500); // Petit délai pour laisser souffler
                    }
                    return newLives;
                });
            } else {
                // Victoire ! On enchaîne
                setTimeout(() => {
                    nextRound();
                    setChoiceCountdown(30); // On remet le chrono à 30s
                    setPhase('preview');
                }, 500);
            }
        },
        [nextRound]
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

    // --- SWIPE TACTILE ---
    const handleSwipeSkip = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y < -50) {
            // Swipe vers le haut
            triggerNext();
        }
    };

    // ==========================================
    // SÉCURITÉ : Les "return" (sorties anticipées) commencent UNIQUEMENT ICI
    // ==========================================
    if (!selection || selection.length === 0) return <Navigate to="/mode/fillyrics" replace />;

    // ==========================================
    // ÉCRAN 1 : MIXAGE (CHARGEMENT)
    // ==========================================
    if (phase === 'mixing' || isMixing) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6">
                <div className="relative h-24 w-24">
                    <div className="border-secondary/20 absolute inset-0 rounded-full border-4"></div>
                    <div className="border-secondary absolute inset-0 animate-spin rounded-full border-4 border-t-transparent"></div>
                    <Mic className="text-secondary absolute inset-0 m-auto h-8 w-8 animate-pulse" />
                </div>
                <h2 className="font-titre text-2xl tracking-widest text-white">
                    PRÉPARATION DU MIX
                </h2>
            </div>
        );
    }

    if (mixError) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <p className="font-texte text-destructive mb-4 text-xl">{mixError}</p>
                <Button onClick={() => navigate('/mode/fillyrics')}>Retour</Button>
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

                <div className="z-10 mt-8 flex w-full max-w-sm flex-col items-center px-4">
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

                    <div className="z-20 flex w-full gap-4">
                        <Button
                            onClick={handlePlay}
                            className="bg-primary text-primary-foreground hover:bg-primary/80 font-titre h-16 flex-1 rounded-2xl border-0 text-2xl shadow-[0_0_30px_rgba(232,28,255,0.4)] transition-all hover:scale-[1.02]"
                        >
                            <Play className="mr-2 h-7 w-7 fill-current" />
                            JOUER CE SON
                        </Button>

                        <Button
                            onClick={triggerNext}
                            variant="ghost"
                            className="group flex h-16 w-16 items-center justify-center rounded-2xl border-0 bg-white/5 hover:bg-white/10"
                            title="Passer à la suivante"
                        >
                            <SkipForward className="h-7 w-7 text-white/70 transition-all group-hover:scale-110 group-hover:text-white" />
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
                sessionId="survival-session"
                song={currentSong}
                roundIndex={currentRoundIndex}
                onRoundEnd={handleRoundEnd}
            />
        );
    }

    // ==========================================
    // ÉCRAN 4 : GAME OVER / RÉSUMÉ
    // ==========================================
    if (phase === 'summary') {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <h1 className="font-titre titre-neon-destructive mb-4 text-6xl">GAME OVER</h1>
                <p className="font-texte mb-8 text-2xl text-white">
                    Score final : <span className="text-secondary font-bold">{globalScore}</span>{' '}
                    pts
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => window.location.reload()} variant="neon-glass">
                        Rejouer
                    </Button>
                    <Button onClick={() => navigate('/mode/fillyrics')} variant="outline">
                        Quitter
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
