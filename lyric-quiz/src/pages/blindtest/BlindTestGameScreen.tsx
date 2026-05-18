import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Loader2, SkipForward, CheckCircle2, XCircle } from 'lucide-react';
import { useBlindTestAudio } from '@/hooks/useBlindTestAudio';
import { useBlindTestPlaylist } from '@/hooks/useBlindTestPlaylist';
import SharedSearch from '@/components/shared/SharedSearch';
import { Song } from '@/types';

export default function BlindTestGameScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const selection = location.state?.selection;

    // État du round : 'pending' (en train de chercher) | 'won' (trouvé) | 'lost' (erreur)
    const [guessResult, setGuessResult] = useState<'pending' | 'won' | 'lost'>('pending');

    if (!selection || selection.length === 0) {
        return <Navigate to="/mode/blindtest" replace />;
    }

    const { playlist, currentSong, isLoading, error, nextRound, currentRoundIndex } =
        useBlindTestPlaylist(selection);
    const { isReady, isPlaying, playSnippet } = useBlindTestAudio(
        currentSong?.preview || null,
        1500
    );

    // 👉 NOUVEAU : La logique de vérification de la réponse
    const handleGuess = (selectedSong: Song) => {
        if (guessResult !== 'pending' || !currentSong) return;

        // On vérifie par ID, ou par titre exact (Deezer a parfois plusieurs IDs pour un même son, ex: Album vs Single)
        const isSameId = selectedSong.id.toString() === currentSong.id.toString();
        const isSameTitle =
            selectedSong.title.toLowerCase().trim() === currentSong.title.toLowerCase().trim();

        if (isSameId || isSameTitle) {
            setGuessResult('won');
        } else {
            setGuessResult('lost');
        }
    };

    // 👉 NOUVEAU : Passer à la manche suivante et remettre à zéro
    const handleNextRound = () => {
        setGuessResult('pending');
        nextRound();
    };

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
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6">
                <h2 className="font-titre text-destructive mb-4 text-2xl">Fin de partie !</h2>
                <p className="font-texte mb-8 text-white/70">
                    {error || 'Tu as terminé toutes les musiques disponibles.'}
                </p>
                <Button variant="outline" onClick={() => navigate('/mode/blindtest')}>
                    Retour au menu
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center p-6 pt-20">
            <Button
                variant="ghost"
                onClick={() => navigate('/mode/blindtest')}
                className="font-texte absolute top-6 left-6"
            >
                <ArrowLeft className="mr-2 h-5 w-5" /> Quitter
            </Button>

            {/* EN-TÊTE FIXE : Compteur et Bouton Play */}
            <div className="mb-8 flex w-full shrink-0 flex-col items-center">
                <h1 className="font-titre text-destructive mb-2 text-6xl drop-shadow-[0_0_20px_rgba(255,42,95,0.5)] md:text-7xl">
                    500 MS
                </h1>
                <p className="font-texte mb-8 text-lg text-white/50">
                    Piste {currentRoundIndex + 1} / {playlist.length}
                </p>

                <div className="relative mb-4">
                    {isPlaying && (
                        <div className="border-destructive absolute -inset-4 animate-ping rounded-full border-2 opacity-50" />
                    )}
                    <Button
                        onClick={playSnippet}
                        disabled={!isReady || isPlaying}
                        className="bg-destructive hover:bg-destructive/80 h-28 w-28 rounded-full shadow-[0_0_40px_rgba(255,42,95,0.4)] transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 md:h-32 md:w-32"
                    >
                        {!isReady ? (
                            <Loader2 className="h-10 w-10 animate-spin text-white md:h-12 md:w-12" />
                        ) : (
                            <Play
                                className="ml-2 h-12 w-12 text-white md:h-14 md:w-14"
                                fill="currentColor"
                            />
                        )}
                    </Button>
                </div>
            </div>

            {/* ZONE INTERACTIVE : Recherche OU Résultat */}
            <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
                {guessResult === 'pending' ? (
                    // 🔍 PHASE 1 : RECHERCHE
                    <div className="animate-in fade-in slide-in-from-bottom-4 w-full duration-500">
                        <SharedSearch
                            allowedTabs={['songs']}
                            defaultTab="songs"
                            renderSongCard={(song) => (
                                // 👉 Mini-carte de résultat de recherche, spécifique au Blind Test
                                <div
                                    key={`search-${song.id}`}
                                    onClick={() => handleGuess(song)}
                                    className="group flex cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
                                >
                                    <img
                                        src={song.album.cover_small || song.album.cover_xl}
                                        alt={song.title}
                                        className="h-12 w-12 rounded-md object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-titre group-hover:text-secondary truncate text-lg text-white transition-colors">
                                            {song.title}
                                        </h3>
                                        <p className="font-texte truncate text-sm text-white/50">
                                            {song.artist.name}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="font-texte mr-2 rounded-full"
                                    >
                                        Choisir
                                    </Button>
                                </div>
                            )}
                        />
                    </div>
                ) : (
                    // 🎉 PHASE 2 : RÉSULTAT
                    <div className="animate-in zoom-in-95 mt-8 flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-md duration-300">
                        {guessResult === 'won' ? (
                            <CheckCircle2 className="text-secondary mb-4 h-20 w-20 drop-shadow-[0_0_15px_rgba(64,201,255,0.5)]" />
                        ) : (
                            <XCircle className="text-destructive mb-4 h-20 w-20 drop-shadow-[0_0_15px_rgba(255,42,95,0.5)]" />
                        )}

                        <h2
                            className={`font-titre mb-6 text-4xl ${guessResult === 'won' ? 'text-secondary' : 'text-destructive'}`}
                        >
                            {guessResult === 'won' ? 'BIEN JOUÉ !' : 'RATÉ !'}
                        </h2>

                        <img
                            src={currentSong.album.cover_xl}
                            alt="Cover"
                            className="mb-6 h-40 w-40 rounded-xl object-cover shadow-2xl"
                        />

                        <p className="font-titre mb-1 text-center text-2xl text-white">
                            {currentSong.title}
                        </p>
                        <p className="font-texte mb-8 text-center text-lg text-white/50">
                            {currentSong.artist.name}
                        </p>

                        <Button
                            onClick={handleNextRound}
                            className="font-texte h-14 w-full rounded-full bg-white text-lg text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:bg-white/80"
                        >
                            Piste Suivante <SkipForward className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Le cheat est toujours là pour tester */}
            {guessResult === 'pending' && (
                <p className="pointer-events-none fixed bottom-2 font-mono text-[10px] text-white/20">
                    Cheat: {currentSong.title}
                </p>
            )}
        </div>
    );
}
