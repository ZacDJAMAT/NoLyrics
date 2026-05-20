import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Clock, Loader2 } from 'lucide-react';
import SharedSearch from '@/components/shared/SharedSearch';
import ArtistCard from '@/components/shared/ArtistCard';
import { Artist } from '@/types';
import { SelectionItem } from '@/pages/fillyrics/FillyricsLobbyScreen';

// 👉 NOUVEAUX IMPORTS POUR LA BASE DE DONNÉES
import { useAuth } from '@/contexts/AuthContext';
import { getRecentBlindTestSessions, RecentGame } from '@/lib/history';

export default function BlindTestLobbyScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selection, setSelection] = useState<SelectionItem[]>([]);

    // 👉 NOUVEAUX ÉTATS POUR SUPABASE
    const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
    const [isLoadingRecent, setIsLoadingRecent] = useState(true);

    // 👉 RÉCUPÉRATION DES PARTIES RÉCENTES AU CHARGEMENT
    useEffect(() => {
        const fetchRecentGames = async () => {
            setIsLoadingRecent(true);
            const games = await getRecentBlindTestSessions(user);
            setRecentGames(games);
            setIsLoadingRecent(false);
        };
        fetchRecentGames();
    }, [user]);

    const toggleSelection = (item: Artist) => {
        const itemId = item.id.toString();
        const exists = selection.find((s) => s.id === itemId);

        if (exists) {
            setSelection((prev) => prev.filter((s) => s.id !== itemId));
        } else {
            const newItem: SelectionItem = {
                id: itemId,
                type: 'artist',
                name: item.name,
                image: item.picture_xl,
                data: item,
            };
            setSelection((prev) => [newItem, ...prev]);
        }
    };

    const handleStartGame = (finalSelection: SelectionItem[]) => {
        // Plus besoin de sauvegarder en local ici, la base de données s'en charge en jeu !
        navigate('/mode/blindtest/play', { state: { selection: finalSelection } });
    };

    return (
        <div className="bg-background text-foreground min-h-screen p-6 pb-32">
            <Button variant="back" onClick={() => navigate('/')} className="font-texte mb-8">
                <ArrowLeft className="mr-2 h-5 w-5" /> Retour au Hub
            </Button>

            <h1 className="font-titre text-destructive mb-2 text-center text-4xl drop-shadow-[0_0_15px_rgba(255,42,95,0.5)]">
                BLIND TEST EXTRÊME
            </h1>
            <p className="font-texte text-muted-foreground mb-12 text-center">
                Sélectionne les artistes pour générer ta partie.
            </p>

            {/* 👉 AFFICHAGE INTELLIGENT DES SÉLECTIONS RÉCENTES (OU DU CHARGEMENT) */}
            {isLoadingRecent ? (
                <div className="mb-12 flex h-32 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white/30" />
                </div>
            ) : (
                recentGames.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-4 mx-auto mb-12 w-full max-w-7xl duration-500">
                        <div className="mb-4 flex items-center justify-center gap-2 pl-2 md:justify-start">
                            <Clock className="h-5 w-5 text-white/50" />
                            <h2 className="font-titre text-xl tracking-widest text-white/50 uppercase">
                                Rejouer une sélection
                            </h2>
                        </div>

                        <div className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex snap-x items-start gap-4 overflow-x-auto pb-4">
                            {' '}
                            {recentGames.map((game: RecentGame) => (
                                <div
                                    key={game.id}
                                    // 👉 NOUVEAU : On passe la largeur de 220px à 320px
                                    className="flex max-w-[320px] min-w-[320px] shrink-0 snap-start flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
                                >
                                    {/* Grille large pour 5 belles photos */}
                                    <div className="mb-6 grid w-full grid-cols-5 justify-items-center gap-2">
                                        {game.artists.map((artist) => (
                                            <img
                                                key={artist.id}
                                                src={artist.image}
                                                alt={artist.name}
                                                title={artist.name}
                                                // 👉 RETOUR : Aux belles images h-12 w-12 (48px) avec une belle bordure
                                                className="h-12 w-12 rounded-full border-2 border-black object-cover shadow-lg transition-transform hover:scale-110"
                                            />
                                        ))}
                                    </div>

                                    {/* Bouton Rejouer */}
                                    <Button
                                        variant="secondary"
                                        className="font-texte w-full rounded-full transition-transform hover:scale-105"
                                        onClick={() => handleStartGame(game.artists)}
                                    >
                                        <Play className="mr-2 h-4 w-4" fill="currentColor" /> Lancer
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            )}

            {/* RECHERCHE */}
            <SharedSearch
                allowedTabs={['artists']}
                defaultTab="artists"
                renderArtistCard={(artist, isFavorite, onToggleFav) => (
                    <ArtistCard
                        key={`bt-artist-${artist.id}`}
                        artist={artist}
                        onClick={(a) => toggleSelection(a)}
                        isFavorite={isFavorite}
                        onToggleFavorite={onToggleFav}
                        isSelected={selection.some((s) => s.id === artist.id.toString())}
                    />
                )}
            />

            {/* BOUTON FLOTTANT GÉNÉRER */}
            {selection.length > 0 && (
                <div className="animate-in slide-in-from-bottom-10 fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
                    <Button
                        onClick={() => handleStartGame(selection)}
                        className="bg-destructive hover:bg-destructive/80 font-titre rounded-full px-8 py-6 text-xl text-white shadow-[0_0_30px_rgba(255,42,95,0.5)] transition-all hover:scale-105"
                    >
                        <Play className="mr-2 h-6 w-6" fill="currentColor" />
                        GÉNÉRER ({selection.length} artistes)
                    </Button>
                </div>
            )}
        </div>
    );
}
