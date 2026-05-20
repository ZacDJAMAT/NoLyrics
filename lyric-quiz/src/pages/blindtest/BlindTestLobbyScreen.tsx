import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Clock, Loader2, Users } from 'lucide-react';
import SharedSearch from '@/components/shared/SharedSearch';
import ArtistCard from '@/components/shared/ArtistCard';
import { Artist } from '@/types';
import { SelectionItem } from '@/pages/fillyrics/FillyricsLobbyScreen';
import { createMatch } from '@/lib/multiplayer';
import { getArtistTopTracks } from '@/utils/api';

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
    // État pour le bouton de chargement multijoueur
    const [isCreatingMatch, setIsCreatingMatch] = useState(false);

    // 👉 NOUVELLE FONCTION : Pré-générer la playlist et créer le duel
    const handleCreateMultiplayerMatch = async (finalSelection: SelectionItem[]) => {
        if (!user) return;
        setIsCreatingMatch(true);

        try {
            // 1. Récupérer les musiques de l'API (comme le fait le mode solo en coulisses)
            const artists = finalSelection.filter((item) => item.type === 'artist');
            const artistIds = artists.map((a) => a.data.id);
            const tracksArrays = await Promise.all(
                artistIds.map((id) => getArtistTopTracks(id, 50))
            );

            // 2. Filtrer les musiques valides
            const validTracks = tracksArrays
                .flat()
                .filter((track) => track.preview && track.preview.trim() !== '');

            if (validTracks.length === 0) {
                alert('Aucun extrait audio disponible pour ces artistes.');
                setIsCreatingMatch(false);
                return;
            }

            // 3. Mélanger la playlist (Algorithme de Fisher-Yates rapide)
            const shuffledPlaylist = validTracks.sort(() => Math.random() - 0.5);

            // 4. Créer le match dans Supabase
            const matchId = await createMatch(user.id, shuffledPlaylist);

            if (matchId) {
                // 5. Rediriger vers notre nouvelle salle d'attente
                navigate(`/mode/blindtest/multi/${matchId}`);
            } else {
                alert('Erreur lors de la création du match.');
            }
        } catch (err) {
            console.error('Erreur création multi :', err);
            alert('Erreur lors de la création.');
        } finally {
            setIsCreatingMatch(false);
        }
    };

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

            {/* BOUTONS FLOTTANTS GÉNÉRER */}
            {selection.length > 0 && (
                <div className="animate-in slide-in-from-bottom-10 fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 gap-4">
                    {/* Bouton Solo (Léger) */}
                    <Button
                        onClick={() => handleStartGame(selection)}
                        variant="secondary"
                        className="font-titre rounded-full px-6 py-6 text-xl transition-all hover:scale-105"
                    >
                        <Play className="mr-2 h-6 w-6" fill="currentColor" />
                        SOLO ({selection.length})
                    </Button>

                    {/* Bouton Duel (Principal et Fluorescent) */}
                    <Button
                        onClick={() => handleCreateMultiplayerMatch(selection)}
                        disabled={isCreatingMatch}
                        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-titre rounded-full px-8 py-6 text-xl shadow-[0_0_30px_rgba(64,201,255,0.5)] transition-all hover:scale-105"
                    >
                        {isCreatingMatch ? (
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        ) : (
                            <Users className="mr-2 h-6 w-6" />
                        )}
                        DUEL EN LIGNE
                    </Button>
                </div>
            )}
        </div>
    );
}
