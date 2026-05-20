import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
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
    Trophy,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveBlindTestResult, saveBlindTestSession } from '@/lib/history';
import { useBlindTestAudio } from '@/hooks/useBlindTestAudio';
import { useBlindTestPlaylist } from '@/hooks/useBlindTestPlaylist';
import { useBlindTestGame } from '@/hooks/useBlindTestGame';
import SharedSearch from '@/components/shared/SharedSearch';
import { Song } from '@/types';

export default function BlindTestGameScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const selection = location.state?.selection;
    const [showEndScreen, setShowEndScreen] = useState(false);
    const { user } = useAuth();

    const [sessionId] = useState(
        () => `bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
    const hasSavedRound = useRef(false);

    const hasSavedSession = useRef(false);

    useEffect(() => {
        if (!hasSavedSession.current && selection && selection.length > 0) {
            hasSavedSession.current = true;
            saveBlindTestSession(user, sessionId, selection);
        }
    }, [user, sessionId, selection]);

    // 👉 NOUVEAU : Un verrou pour s'assurer de ne faire l'auto-play qu'une seule fois par round
    const hasAutoPlayed = useRef(false);

    if (!selection || selection.length === 0) {
        return <Navigate to="/mode/blindtest" replace />;
    }

    const { playlist, currentSong, isLoading, error, nextRound, currentRoundIndex } =
        useBlindTestPlaylist(selection);

    // 2. Initialisation de l'Audio
    const { isReady, isPlaying, playSnippet, hasError } = useBlindTestAudio(
        currentSong?.preview || null
    );

    // 3. Initialisation du Moteur de Jeu
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

    useEffect(() => {
        if (isReady && !hasError && roundStatus === 'playing' && !hasAutoPlayed.current) {
            hasAutoPlayed.current = true;
            playSnippet(1500); // On lance toujours 1500ms au démarrage
        }
    }, [isReady, hasError, roundStatus, playSnippet]);

    const handleHintClick = () => {
        useHint(); // Met à jour le cerveau (+1 indice, le score, etc.)
        playSnippet(currentDurationMs + 500); // Lance le son immédiatement avec la NOUVELLE durée
    };

    const handleGuess = (selectedSong: Song) => {
        if (!currentSong) return;
        const isCorrect =
            selectedSong.id.toString() === currentSong.id.toString() ||
            selectedSong.title.toLowerCase().trim() === currentSong.title.toLowerCase().trim();

        submitGuess(isCorrect);
    };

    const handleNextRound = () => {
        hasSavedRound.current = false;
        hasAutoPlayed.current = false;
        resetRound();

        if (!isGameOver) {
            nextRound();
        } else {
            setShowEndScreen(true);
        }
    };

    // 🤖 NOUVEAU : L'Auto-play intelligent
    useEffect(() => {
        if (isReady && !hasError && roundStatus === 'playing' && !hasAutoPlayed.current) {
            hasAutoPlayed.current = true;
            playSnippet(currentDurationMs);
        }
    }, [isReady, hasError, roundStatus, currentDurationMs, playSnippet]);

    // Sauvegarde en Base de Données à la fin du round
    useEffect(() => {
        if (roundStatus !== 'playing' && currentSong && !hasSavedRound.current) {
            hasSavedRound.current = true;
            const pointsEarned = roundStatus === 'won' ? 500 - hintsUsed * 50 : 0;

            // 🔍 On retrouve la belle image de l'artiste depuis notre sélection initiale
            const artistSelection = selection.find(
                (s: any) => s.id === currentSong.artist.id.toString()
            );
            const artistImage = artistSelection
                ? artistSelection.image
                : currentSong.album.cover_xl;

            saveBlindTestResult(
                user,
                sessionId,
                currentSong,
                currentRoundIndex,
                roundStatus,
                timeLeft,
                pointsEarned,
                currentSong.artist.id.toString(), // 👈 NOUVEAU : ID de l'artiste
                artistImage // 👈 NOUVEAU : Image de l'artiste
            );
        }
    }, [
        roundStatus,
        currentSong,
        currentRoundIndex,
        timeLeft,
        user,
        sessionId,
        hintsUsed,
        selection,
    ]);

    if (isLoading) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6">
                <Loader2 className="text-destructive mb-6 h-12 w-12 animate-spin" />
                <h2 className="font-titre text-2xl tracking-widest text-white">
                    GÉNÉRATION DU TEST...
                </h2>
            </div>
        );
    }

    if (error || !currentSong) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <Trophy className="mb-6 h-20 w-20 text-[#d4af37] drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]" />
                <h2 className="font-titre mb-2 text-4xl text-white">PLAYLIST TERMINÉE !</h2>
                <p className="font-texte text-secondary mb-8 text-2xl">Score Final : {score} pts</p>
                <Button
                    onClick={() => navigate('/mode/blindtest')}
                    className="font-texte rounded-full bg-white px-8 text-black hover:bg-white/80"
                >
                    Nouveau Test
                </Button>
            </div>
        );
    }

    if (showEndScreen) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <div className="animate-in zoom-in-95 flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-md duration-500">
                    <Trophy className="mb-6 h-24 w-24 text-[#d4af37] drop-shadow-[0_0_30px_rgba(212,175,55,0.6)]" />

                    <h2 className="font-titre mb-2 text-5xl text-white">PARTIE TERMINÉE</h2>
                    <p className="font-texte text-muted-foreground mb-8 text-lg">
                        {lives > 0 ? 'Tu as survécu à la playlist !' : "Tu n'as plus de vies..."}
                    </p>

                    {/* Bloc de statistiques */}
                    <div className="mb-8 w-full rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="mb-4 flex flex-col items-center justify-center">
                            <span className="font-texte mb-1 text-sm tracking-widest text-white/50 uppercase">
                                Score Final
                            </span>
                            <span className="font-titre text-secondary text-5xl drop-shadow-[0_0_15px_rgba(64,201,255,0.5)]">
                                {score} <span className="text-xl text-white/50">pts</span>
                            </span>
                        </div>

                        <div className="flex justify-between border-t border-white/10 px-2 pt-4">
                            <div className="flex flex-col items-center">
                                <span className="font-texte text-xs text-white/40 uppercase">
                                    Pistes jouées
                                </span>
                                <span className="font-titre text-xl text-white">
                                    {currentRoundIndex + 1} / {playlist.length}
                                </span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-texte text-xs text-white/40 uppercase">
                                    Vies restantes
                                </span>
                                <div className="mt-1 flex">
                                    {[1, 2, 3, 4, 5].map((life) => (
                                        <Heart
                                            key={`end-life-${life}`}
                                            className={`h-4 w-4 ${life <= lives ? 'text-destructive fill-destructive' : 'text-white/20'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-3">
                        <Button
                            onClick={() => navigate('/mode/blindtest')}
                            className="font-texte w-full rounded-full bg-white py-6 text-lg text-black transition-transform hover:scale-105 hover:bg-white/80"
                        >
                            Nouveau Test (Lobby)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/')}
                            className="font-texte w-full rounded-full border-white/20 bg-transparent py-6 text-lg text-white hover:bg-white/10"
                        >
                            Retour au Hub
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center p-6 pt-24">
            {/* HUD (Affichage Tête Haute) */}
            <div className="absolute top-6 right-6 left-6 z-50 flex items-start justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/mode/blindtest')}
                    className="font-texte shrink-0"
                >
                    <ArrowLeft className="mr-2 h-5 w-5" /> Quitter
                </Button>

                <div className="flex flex-col items-end gap-2">
                    {/* 👉 NOUVEAU : 5 Vies au lieu de 3 */}
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((life) => (
                            <Heart
                                key={life}
                                className={`h-5 w-5 transition-all duration-300 md:h-6 md:w-6 ${life <= lives ? 'text-destructive fill-destructive drop-shadow-[0_0_8px_rgba(255,42,95,0.8)]' : 'text-white/20'}`}
                            />
                        ))}
                    </div>
                    {/* Le Score */}
                    <div className="font-titre text-2xl text-white drop-shadow-md">
                        {score} <span className="text-sm text-white/50">pts</span>
                    </div>
                </div>
            </div>

            {/* EN-TÊTE FIXE : Compteur Audio et Temps */}
            <div className="mb-6 flex w-full shrink-0 flex-col items-center">
                <div
                    className={`font-titre mb-2 flex items-center gap-4 text-6xl transition-colors md:text-7xl ${timeLeft <= 5 && roundStatus === 'playing' ? 'animate-pulse text-orange-500' : 'text-destructive drop-shadow-[0_0_20px_rgba(255,42,95,0.5)]'}`}
                >
                    <Timer className="h-12 w-12 md:h-16 md:w-16" />
                    {timeLeft}s
                </div>
                <p className="font-texte mb-8 text-sm tracking-widest text-white/50 uppercase">
                    Piste {currentRoundIndex + 1} / {playlist.length}
                </p>

                {/* 👉 NOUVEL AFFICHAGE DES CONTRÔLES : Positionnement Relatif */}
                <div className="relative mb-4">
                    {/* Anneau de lecture dynamique */}
                    {isPlaying && (
                        <div className="border-destructive absolute -inset-4 animate-ping rounded-full border-2 opacity-50" />
                    )}

                    {/* Gros Bouton Play Central */}
                    <Button
                        // On passe la durée actuelle (1500, 2000...) au moteur !
                        onClick={() =>
                            hasError ? handleNextRound() : playSnippet(currentDurationMs)
                        }
                        disabled={(!isReady && !hasError) || isPlaying || roundStatus !== 'playing'}
                        className={`h-28 w-28 rounded-full transition-all disabled:opacity-50 disabled:hover:scale-100 md:h-32 md:w-32 ${
                            hasError
                                ? 'bg-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:bg-orange-600'
                                : 'bg-destructive hover:bg-destructive/80 shadow-[0_0_40px_rgba(255,42,95,0.4)] hover:scale-105'
                        }`}
                    >
                        {hasError ? (
                            <SkipForward className="h-10 w-10 text-white" />
                        ) : !isReady ? (
                            <Loader2 className="h-10 w-10 animate-spin text-white" />
                        ) : (
                            <Play className="ml-2 h-12 w-12 text-white" fill="currentColor" />
                        )}
                    </Button>

                    {/* 👉 NOUVEAU BOUTON : Positionnement Absolu en haut à droite */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleHintClick} // 👈 ICI : On appelle notre nouvelle fonction combinée
                        disabled={
                            hintsUsed >= 5 || roundStatus !== 'playing' || hasError || isPlaying
                        }
                        className="absolute -top-3 -right-3 h-10 w-10 rounded-full border-white/20 bg-white/5 p-0 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/10"
                    >
                        <span className="font-texte text-xs font-bold">+0.5s</span>
                    </Button>
                </div>

                {/* Plus d'autre texte descriptif ici */}
            </div>

            {/* ZONE INTERACTIVE */}
            <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
                {roundStatus === 'playing' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 w-full duration-500">
                        <SharedSearch
                            allowedTabs={['songs']}
                            defaultTab="songs"
                            maxResults={1}
                            disableTrending={true}
                            disablePagination={true}
                            renderSongCard={(song) => (
                                <div
                                    key={`search-${song.id}`}
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
                                        className="font-texte w-full rounded-full bg-white text-black hover:bg-gray-200"
                                    >
                                        Valider cette réponse
                                    </Button>
                                </div>
                            )}
                        />
                    </div>
                ) : (
                    <div className="animate-in zoom-in-95 flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-md duration-300">
                        {roundStatus === 'won' ? (
                            <CheckCircle2 className="text-secondary mb-4 h-20 w-20 drop-shadow-[0_0_15px_rgba(64,201,255,0.5)]" />
                        ) : (
                            <XCircle className="text-destructive mb-4 h-20 w-20 drop-shadow-[0_0_15px_rgba(255,42,95,0.5)]" />
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

                        {roundStatus === 'won' && (
                            <div className="mb-6 flex flex-col items-center">
                                <p className="font-texte text-secondary text-xl">
                                    + {500 - hintsUsed * 50} pts
                                </p>
                                <p className="font-texte text-sm text-white/40">
                                    ({hintsUsed} indice{hintsUsed > 1 ? 's' : ''} utilisé
                                    {hintsUsed > 1 ? 's' : ''})
                                </p>
                            </div>
                        )}

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

                        <Button
                            onClick={handleNextRound}
                            className={`font-texte h-14 w-full rounded-full text-lg shadow-lg transition-all hover:scale-105 ${isGameOver ? 'bg-destructive hover:bg-destructive/80 text-white' : 'bg-white text-black hover:bg-white/80'}`}
                        >
                            {isGameOver ? 'Voir le score final' : 'Piste Suivante'}{' '}
                            <SkipForward className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
