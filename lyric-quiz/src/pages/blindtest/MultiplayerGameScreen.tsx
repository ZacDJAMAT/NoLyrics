import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Play,
    Loader2,
    SkipForward,
    CheckCircle2,
    XCircle,
    Heart,
    Timer,
    Swords,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { subscribeToMatch, updateMatchScore, abandonMatch } from '@/lib/multiplayer';
import { MultiplayerMatch, Song } from '@/types';
import { useBlindTestAudio } from '@/hooks/useBlindTestAudio';
import { useBlindTestGame } from '@/hooks/useBlindTestGame';
import SharedSearch from '@/components/shared/SharedSearch';

export default function MultiplayerGameScreen() {
    const { matchId } = useParams<{ matchId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // 👉 ÉTATS MULTIJOUEUR
    const [match, setMatch] = useState<MultiplayerMatch | null>(null);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [showEndScreen, setShowEndScreen] = useState(false);

    const [transitionTimer, setTransitionTimer] = useState<number | null>(null);

    // Verrous
    const hasAutoPlayed = useRef(false);
    const hasBroadcastedScore = useRef(false);

    // 1. Initialisation du match et écoute temps réel
    useEffect(() => {
        if (!matchId) return;

        // A. Chargement initial de la playlist figée
        const fetchMatch = async () => {
            const { data } = await supabase
                .from('multiplayer_matches')
                .select('*')
                .eq('id', matchId)
                .single();
            if (data) setMatch(data as MultiplayerMatch);
        };
        fetchMatch();

        // B. ⚡ Abonnement Temps Réel (pour recevoir le score de l'adversaire)
        const unsubscribe = subscribeToMatch(matchId, (updatedMatch) => {
            setMatch((prev) => {
                // S'il n'y a pas d'ancien match, on prend le nouveau
                if (!prev) return updatedMatch;

                return {
                    ...prev,
                    ...updatedMatch,
                    // 👉 SÉCURITÉ MAXIMALE : On force la conservation de la playlist
                    // si Supabase décide de ne pas la renvoyer pour économiser de la donnée.
                    playlist: updatedMatch.playlist || prev.playlist,
                };
            });
        });

        return () => unsubscribe();
    }, [matchId]);

    const currentSong = match?.playlist[currentRoundIndex] as Song | null;

    // 2. Audio & Moteur de jeu (Identique au solo !)
    const { isReady, isPlaying, playSnippet, hasError } = useBlindTestAudio(
        currentSong?.preview || null
    );

    const handleQuitMatch = async () => {
        const confirmQuit = window.confirm(
            'Veux-tu vraiment abandonner ce duel ? Ton adversaire gagnera par forfait.'
        );
        if (confirmQuit && match) {
            await abandonMatch(match.id); // On prévient la base de données
            navigate('/mode/blindtest');
        }
    };

    // Protection contre la fermeture brutale de l'onglet (F5, Croix, Retour navigateur)
    useEffect(() => {
        if (!matchId) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Affiche la popup d'avertissement native du navigateur
            e.preventDefault();
            e.returnValue = '';
        };

        const handleUnload = () => {
            // Tentative d'envoi du statut "abandoned" si le joueur force la fermeture
            abandonMatch(matchId);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
        };
    }, [matchId]);

    const {
        lives,
        score,
        timeLeft,
        roundStatus,
        hintsUsed,
        currentDurationMs,
        useHint,
        submitGuess,
        resetRound,
        isGameOver,
    } = useBlindTestGame(() => {});

    // 3. ⚡ ENVOI DU SCORE EN TEMPS RÉEL
    useEffect(() => {
        // Dès qu'un round est fini (gagné/perdu), on broadcast le nouveau score !
        if (roundStatus !== 'playing' && user && match && !hasBroadcastedScore.current) {
            hasBroadcastedScore.current = true;
            const role = user.id === match.host_id ? 'host' : 'guest';
            updateMatchScore(match.id, role, score);
        }
    }, [roundStatus, score, user, match]);

    // 🤖 L'Auto-play intelligent
    useEffect(() => {
        if (isReady && !hasError && roundStatus === 'playing' && !hasAutoPlayed.current) {
            hasAutoPlayed.current = true;
            playSnippet(1500);
        }
    }, [isReady, hasError, roundStatus, playSnippet]);

    const handleHintClick = () => {
        useHint();
        playSnippet(currentDurationMs + 500);
    };

    const handleGuess = (selectedSong: Song) => {
        if (!currentSong) return;
        const isCorrect =
            selectedSong.id.toString() === currentSong.id.toString() ||
            selectedSong.title.toLowerCase().trim() === currentSong.title.toLowerCase().trim();
        submitGuess(isCorrect);
    };

    const handleNextRound = useCallback(() => {
        hasAutoPlayed.current = false;
        hasBroadcastedScore.current = false;
        resetRound();

        if (isGameOver || !match || currentRoundIndex >= match.playlist.length - 1) {
            setShowEndScreen(true);
        } else {
            setCurrentRoundIndex((prev) => prev + 1);
        }
    }, [isGameOver, match, currentRoundIndex, resetRound]);

    useEffect(() => {
        if (roundStatus !== 'playing') {
            setTransitionTimer(5);
        } else {
            setTransitionTimer(null);
        }
    }, [roundStatus]);

    // ✅ CORRECTION : handleNextRound est ajoutée aux dépendances
    useEffect(() => {
        if (transitionTimer === null) return;

        if (transitionTimer > 0) {
            const timeout = setTimeout(() => setTransitionTimer((prev) => prev! - 1), 1000);
            return () => clearTimeout(timeout);
        } else if (transitionTimer === 0) {
            handleNextRound();
        }
    }, [transitionTimer, handleNextRound]);

    if (!match) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-6">
                <Loader2 className="text-secondary mb-6 h-12 w-12 animate-spin" />
            </div>
        );
    }

    // 🔍 Qui suis-je et quel est le score de l'autre ?
    const isHost = user?.id === match.host_id;
    const opponentScore = isHost ? match.guest_score : match.host_score;

    if (showEndScreen) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <div className="animate-in zoom-in-95 flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-md duration-500">
                    <Swords className="text-secondary mb-6 h-24 w-24 drop-shadow-[0_0_30px_rgba(64,201,255,0.6)]" />
                    <h2 className="font-titre mb-2 text-5xl text-white">DUEL TERMINÉ</h2>

                    <div className="mb-8 flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                        {/* Mon Score */}
                        <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-4">
                            <span className="font-texte mb-1 text-xs tracking-widest text-white/50 uppercase">
                                Ton Score
                            </span>
                            <span className="font-titre text-4xl text-white">
                                {score} <span className="text-lg text-white/50">pts</span>
                            </span>
                        </div>
                        {/* Score Adversaire */}
                        <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-4">
                            <span className="font-texte text-secondary mb-1 text-xs tracking-widest uppercase">
                                Score Adversaire
                            </span>
                            <span className="font-titre text-secondary text-4xl">
                                {opponentScore} <span className="text-lg text-white/50">pts</span>
                            </span>
                        </div>
                    </div>

                    <Button
                        onClick={() => navigate('/mode/blindtest')}
                        className="font-texte bg-secondary hover:bg-secondary/80 w-full rounded-full py-6 text-lg text-black"
                    >
                        Quitter le duel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center p-6 pt-24">
            {/* HUD */}
            <div className="absolute top-6 right-6 left-6 z-50 flex items-start justify-between">
                <Button variant="ghost" onClick={handleQuitMatch} className="font-texte shrink-0">
                    <ArrowLeft className="mr-2 h-5 w-5" /> Quitter
                </Button>

                <div className="flex gap-6">
                    {/* Score Adversaire (En direct) */}
                    <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                        <span className="font-texte text-secondary text-[10px] tracking-widest uppercase">
                            Adversaire
                        </span>
                        <div className="font-titre text-secondary text-xl">{opponentScore} pts</div>
                    </div>

                    {/* Ton Score et Vies */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((life) => (
                                <Heart
                                    key={life}
                                    className={`h-5 w-5 ${life <= lives ? 'text-destructive fill-destructive' : 'text-white/20'}`}
                                />
                            ))}
                        </div>
                        <div className="font-titre text-2xl text-white">
                            {score} <span className="text-sm text-white/50">pts</span>
                        </div>
                    </div>
                </div>
                {match.status === 'abandoned' && (
                    <div className="bg-destructive/90 font-texte animate-in slide-in-from-top-4 relative z-40 mb-4 w-full max-w-3xl rounded-xl border border-white/20 p-3 text-center text-white shadow-lg duration-500">
                        ⚠️ <strong>Victoire par forfait !</strong> Ton adversaire a fui le duel. Tu
                        peux tout de même terminer ta partie.
                    </div>
                )}
            </div>

            {/* EN-TÊTE FIXE : Compteur Audio et Temps */}
            <div className="mb-6 flex w-full shrink-0 flex-col items-center">
                <div
                    className={`font-titre mb-2 flex items-center gap-4 text-6xl md:text-7xl ${timeLeft <= 5 && roundStatus === 'playing' ? 'animate-pulse text-orange-500' : 'text-destructive drop-shadow-[0_0_20px_rgba(255,42,95,0.5)]'}`}
                >
                    <Timer className="h-12 w-12 md:h-16 md:w-16" /> {timeLeft}s
                </div>
                <p className="font-texte mb-8 text-sm tracking-widest text-white/50 uppercase">
                    Piste {currentRoundIndex + 1} / {match.playlist.length}
                </p>

                <div className="relative mb-4">
                    {isPlaying && (
                        <div className="border-destructive absolute -inset-4 animate-ping rounded-full border-2 opacity-50" />
                    )}
                    <Button
                        onClick={() =>
                            hasError ? handleNextRound() : playSnippet(currentDurationMs)
                        }
                        disabled={(!isReady && !hasError) || isPlaying || roundStatus !== 'playing'}
                        className={`h-28 w-28 rounded-full md:h-32 md:w-32 ${hasError ? 'bg-orange-500 hover:bg-orange-600' : 'bg-destructive hover:scale-105'}`}
                    >
                        {hasError ? (
                            <SkipForward className="h-10 w-10 text-white" />
                        ) : !isReady ? (
                            <Loader2 className="h-10 w-10 animate-spin text-white" />
                        ) : (
                            <Play className="ml-2 h-12 w-12 text-white" fill="currentColor" />
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleHintClick}
                        disabled={
                            hintsUsed >= 5 || roundStatus !== 'playing' || hasError || isPlaying
                        }
                        className="absolute -top-3 -right-3 h-10 w-10 rounded-full border-white/20 bg-white/5 p-0 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110"
                    >
                        <span className="font-texte text-xs font-bold">+0.5s</span>
                    </Button>
                </div>
            </div>

            {/* ZONE INTERACTIVE */}
            <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
                {roundStatus === 'playing' ? (
                    <div className="animate-in fade-in w-full duration-500">
                        <SharedSearch
                            allowedTabs={['songs']}
                            defaultTab="songs"
                            maxResults={1}
                            disableTrending={true}
                            disablePagination={true}
                            renderSongCard={(song) => (
                                <div
                                    onClick={() => handleGuess(song)}
                                    className="mx-auto flex w-full max-w-sm cursor-pointer flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl transition-all hover:scale-105 hover:bg-white/10"
                                >
                                    <img
                                        src={song.album.cover_xl}
                                        alt={song.title}
                                        className="h-40 w-40 rounded-2xl object-cover shadow-lg"
                                    />
                                    <div className="w-full px-2 text-center">
                                        <h3 className="font-titre line-clamp-1 text-xl text-white">
                                            {song.title}
                                        </h3>
                                        <p className="font-texte text-white/50">
                                            {song.artist.name}
                                        </p>
                                    </div>
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        className="font-texte w-full rounded-full bg-white text-black"
                                    >
                                        Valider cette réponse
                                    </Button>
                                </div>
                            )}
                        />
                    </div>
                ) : (
                    <div className="animate-in zoom-in-95 flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-md">
                        {roundStatus === 'won' ? (
                            <CheckCircle2 className="text-secondary mb-4 h-20 w-20 drop-shadow-[0_0_15px_rgba(64,201,255,0.5)]" />
                        ) : (
                            <XCircle className="text-destructive mb-4 h-20 w-20" />
                        )}
                        <h2
                            className={`font-titre mb-2 text-center text-4xl ${roundStatus === 'won' ? 'text-secondary' : 'text-destructive'}`}
                        >
                            {roundStatus === 'won'
                                ? 'BIEN JOUÉ !'
                                : timeLeft === 0
                                  ? 'TEMPS ÉCOULÉ !'
                                  : 'RATÉ !'}
                        </h2>
                        {currentSong && (
                            <>
                                <img
                                    src={currentSong.album.cover_xl}
                                    alt="Cover"
                                    className={`mb-6 h-40 w-40 rounded-xl object-cover shadow-2xl ${roundStatus === 'lost' ? 'opacity-50 grayscale' : ''}`}
                                />
                                <p className="font-titre mb-1 text-center text-2xl text-white">
                                    {currentSong.title}
                                </p>
                                <p className="font-texte mb-8 text-center text-lg text-white/50">
                                    {currentSong.artist.name}
                                </p>
                            </>
                        )}
                        <Button
                            disabled
                            className="font-texte h-14 w-full cursor-wait rounded-full bg-white/20 text-lg text-white shadow-lg transition-all"
                        >
                            {isGameOver || currentRoundIndex >= (match?.playlist.length || 1) - 1
                                ? 'Score final'
                                : 'Piste suivante'}{' '}
                            dans {transitionTimer}s...
                            <Timer className="ml-2 h-5 w-5 animate-pulse" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
