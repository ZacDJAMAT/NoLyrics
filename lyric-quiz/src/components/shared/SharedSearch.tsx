import React, { useState, useEffect } from 'react';
import { searchSongs, searchArtists } from '../../utils/api';
import { Song, Artist } from '../../types';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../contexts/AuthContext';
import { useTrendingSongs } from '../../hooks/useTrendingSongs';
import { useTrendingArtists } from '../../hooks/useTrendingArtists';
import Pagination from '../shared/Pagination';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MicVocal, Music, Heart, Search } from 'lucide-react';

interface SharedSearchProps {
    allowedTabs?: ('songs' | 'artists')[];
    defaultTab?: 'songs' | 'artists';
    onDisplayedItemsChange?: (items: (Song | Artist)[]) => void;

    // INVERSION DE CONTRÔLE : C'est le parent qui dessine la carte !
    renderSongCard?: (
        song: Song,
        isFavorite: boolean,
        onToggleFav?: (e: React.MouseEvent, s: Song) => void
    ) => React.ReactNode;
    renderArtistCard?: (
        artist: Artist,
        isFavorite: boolean,
        onToggleFav?: (e: React.MouseEvent, a: Artist) => void
    ) => React.ReactNode;

    headerChildren?: React.ReactNode;
}

export default function SharedSearch({
    allowedTabs = ['songs', 'artists'],
    defaultTab = 'songs',
    renderSongCard,
    renderArtistCard,
    headerChildren,
    onDisplayedItemsChange,
}: SharedSearchProps) {
    const { user, isGuest } = useAuth();
    const { favorites, isFavorite, toggleFavorite } = useFavorites();
    const { trendingSongs, isLoadingTrending: isLoadingSongs } = useTrendingSongs();
    const { trendingArtists, isLoadingTrendingArtists: isLoadingArtists } = useTrendingArtists();

    const [query, setQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'songs' | 'artists'>(defaultTab);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const [songResults, setSongResults] = useState<Song[]>([]);
    const [artistResults, setArtistResults] = useState<Artist[]>([]);

    // Pagination pour les tendances
    const [currentTrendingPage, setCurrentTrendingPage] = useState(1);
    const itemsPerTrendingPage = 12;

    // 👉 NOUVEAU : Pagination pour la recherche active
    const [currentSearchPage, setCurrentSearchPage] = useState(1);
    const [totalSearchItems, setTotalSearchItems] = useState(0);
    const itemsPerSearchPage = 12;

    const showTrending = activeQuery.trim() === '' && !showFavoritesOnly;

    // 👉 NOUVEAU : Fonction dédiée pour fetcher une page précise de la recherche
    const fetchSearchResults = async (page: number, searchQuery: string) => {
        if (!searchQuery.trim()) return;
        setIsLoadingSearch(true);

        try {
            if (activeTab === 'songs') {
                const data = await searchSongs(searchQuery, page, itemsPerSearchPage);
                setSongResults(data.results);
                setTotalSearchItems(data.total);
            } else {
                const data = await searchArtists(searchQuery, page, itemsPerSearchPage);
                setArtistResults(data.results);
                setTotalSearchItems(data.total);
            }
            setCurrentSearchPage(page);
        } catch (error) {
            console.error('Erreur de recherche:', error);
        } finally {
            setIsLoadingSearch(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setActiveQuery(query);
        setCurrentTrendingPage(1);
        setCurrentSearchPage(1); // Reset de la page de recherche à 1

        if (!query.trim() && !showFavoritesOnly) {
            setSongResults([]);
            setArtistResults([]);
            setTotalSearchItems(0);
            return;
        }

        if (showFavoritesOnly) {
            if (activeTab === 'songs') {
                const favSongs = favorites
                    .filter(
                        (f) =>
                            f.item_type === 'song' &&
                            f.item_name.toLowerCase().includes(query.toLowerCase())
                    )
                    .map(
                        (f) =>
                            ({
                                id: f.item_id,
                                title: f.item_name,
                                artist: { name: '' },
                                album: { cover_xl: f.image_url, cover_small: '' },
                                duration: 0,
                            }) as Song
                    );
                setSongResults(favSongs);
            } else {
                const favArtists = favorites
                    .filter(
                        (f) =>
                            f.item_type === 'artist' &&
                            f.item_name.toLowerCase().includes(query.toLowerCase())
                    )
                    .map(
                        (f) =>
                            ({
                                id: f.item_id,
                                name: f.item_name,
                                picture_xl: f.image_url,
                            }) as Artist
                    );
                setArtistResults(favArtists);
            }
            setTotalSearchItems(0); // Pas de pagination API pour les favoris locaux
        } else {
            // 👉 Appel à notre nouvelle fonction pour la page 1
            await fetchSearchResults(1, query);
        }
    };

    useEffect(() => {
        handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, showFavoritesOnly]);

    // Outils pour les favoris
    const handleToggleSongFavorite = (_e: React.MouseEvent, song: Song) => {
        toggleFavorite('song', song.id.toString(), song.title, song.album.cover_xl);
    };

    const handleToggleArtistFavorite = (_e: React.MouseEvent, artist: Artist) => {
        toggleFavorite('artist', artist.id.toString(), artist.name, artist.picture_xl);
    };

    // Calculs d'affichage
    const currentList =
        activeTab === 'songs'
            ? showTrending
                ? trendingSongs
                : songResults
            : showTrending
              ? trendingArtists
              : artistResults;

    const paginatedList = showTrending
        ? currentList.slice(
              (currentTrendingPage - 1) * itemsPerTrendingPage,
              currentTrendingPage * itemsPerTrendingPage
          )
        : currentList;

    const totalTrendingPages = Math.ceil(currentList.length / itemsPerTrendingPage);
    // 👉 NOUVEAU : Calcul du nombre total de pages pour la recherche API
    const totalSearchPages = Math.ceil(totalSearchItems / itemsPerSearchPage);

    useEffect(() => {
        if (onDisplayedItemsChange) {
            onDisplayedItemsChange(paginatedList);
        }
    }, [paginatedList, onDisplayedItemsChange]);

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            {headerChildren && <div className="animate-in fade-in w-full">{headerChildren}</div>}

            {/* BARRE DE RECHERCHE ET FILTRES (Optimisé Mobile) */}
            <div className="mx-auto w-full max-w-3xl">
                <form
                    onSubmit={handleSearch}
                    className="flex w-full flex-col gap-3 md:flex-row md:gap-4"
                >
                    <div className="flex w-full gap-2">
                        <Input
                            type="text"
                            placeholder={
                                activeTab === 'artists'
                                    ? 'Rechercher un artiste...'
                                    : 'Rechercher une musique...'
                            }
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="font-texte bg-input border-border focus-visible:ring-primary h-14 flex-1 rounded-2xl text-lg shadow-inner focus-visible:ring-2"
                        />

                        {user && !isGuest && (
                            <Button
                                type="button"
                                variant={showFavoritesOnly ? 'neon-secondary' : 'secondary'}
                                onClick={() => {
                                    setShowFavoritesOnly(!showFavoritesOnly);
                                    setQuery('');
                                    setActiveQuery('');
                                }}
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl p-0 transition-all"
                                title={showFavoritesOnly ? 'Voir tout' : 'Voir mes favoris'}
                            >
                                <Heart
                                    className="h-6 w-6"
                                    fill={showFavoritesOnly ? 'currentColor' : 'none'}
                                />
                            </Button>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoadingSearch}
                        className="font-texte bg-primary hover:bg-primary/80 h-14 w-full shrink-0 rounded-2xl px-6 text-lg shadow-[0_0_15px_rgba(232,28,255,0.3)] md:w-auto"
                    >
                        {isLoadingSearch ? (
                            '...'
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <Search className="h-5 w-5" />
                                <span>Rechercher</span>
                            </div>
                        )}
                    </Button>
                </form>
            </div>

            {allowedTabs.length > 1 && (
                <div className="mt-2 mb-4 flex justify-center gap-4">
                    {allowedTabs.includes('artists') && (
                        <Button
                            variant={activeTab === 'artists' ? 'neon-primary' : 'secondary'}
                            onClick={() => {
                                setActiveTab('artists');
                                setQuery('');
                                setActiveQuery('');
                                setShowFavoritesOnly(false);
                            }}
                            className="font-titre rounded-full px-6 py-5 text-lg"
                        >
                            <MicVocal className="mr-2 h-5 w-5" /> Artistes
                        </Button>
                    )}
                    {allowedTabs.includes('songs') && (
                        <Button
                            variant={activeTab === 'songs' ? 'neon-primary' : 'secondary'}
                            onClick={() => {
                                setActiveTab('songs');
                                setQuery('');
                                setActiveQuery('');
                                setShowFavoritesOnly(false);
                            }}
                            className="font-titre rounded-full px-6 py-5 text-lg"
                        >
                            <Music className="mr-2 h-5 w-5" /> Musiques
                        </Button>
                    )}
                </div>
            )}

            {showTrending && (
                <h2 className="font-titre text-muted-foreground text-l mb-4 text-center">
                    Top 100 Tendances {activeTab === 'songs' ? 'Musiques' : 'Artistes'}
                </h2>
            )}

            {(isLoadingSongs || isLoadingArtists) && showTrending ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={`skeleton-${i}`}
                            className="h-[280px] animate-pulse rounded-2xl border border-white/10 bg-white/5"
                        />
                    ))}
                </div>
            ) : (
                <>
                    {activeTab === 'artists' && renderArtistCard && (
                        <div className="animate-in fade-in grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {/* 👉 CORRECTION ICI : (paginatedList as Artist[]) */}
                            {(paginatedList as Artist[]).map((item) =>
                                renderArtistCard(
                                    item,
                                    isFavorite('artist', item.id.toString()),
                                    user && !isGuest ? handleToggleArtistFavorite : undefined
                                )
                            )}
                        </div>
                    )}

                    {activeTab === 'songs' && renderSongCard && (
                        <div className="animate-in fade-in grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {/* 👉 CORRECTION ICI : (paginatedList as Song[]) */}
                            {(paginatedList as Song[]).map((item) =>
                                renderSongCard(
                                    item,
                                    isFavorite('song', item.id.toString()),
                                    user && !isGuest ? handleToggleSongFavorite : undefined
                                )
                            )}
                        </div>
                    )}
                </>
            )}

            {/* 👉 NOUVEAU : Pagination globale (Gère à la fois le mode Tendances et le mode Recherche API) */}

            {showTrending && totalTrendingPages > 1 && (
                <div className="mt-8">
                    <Pagination
                        currentPage={currentTrendingPage}
                        totalPages={totalTrendingPages}
                        isLoading={false}
                        onPageChange={setCurrentTrendingPage}
                    />
                </div>
            )}

            {!showTrending && !showFavoritesOnly && totalSearchPages > 1 && (
                <div className="mt-8">
                    <Pagination
                        currentPage={currentSearchPage}
                        totalPages={totalSearchPages}
                        isLoading={isLoadingSearch}
                        onPageChange={(page) => fetchSearchResults(page, activeQuery)}
                    />
                </div>
            )}

            {!showTrending && paginatedList.length === 0 && !isLoadingSearch && (
                <div className="text-muted-foreground font-texte py-10 text-center text-lg">
                    Aucun résultat trouvé.
                </div>
            )}
        </div>
    );
}
