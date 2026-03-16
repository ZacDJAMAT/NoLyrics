import React, { useEffect, useState } from 'react';
import { Song } from '../../types.ts';
import { useSearch } from './hooks/useSearch.ts';
import { useTrendingSongs } from '../../hooks/useTrendingSongs.ts';
import UserMenuButton from '../../components/UserMenuButton.tsx';
import SongCard from '../../components/SongCard.tsx';
import Pagination from '../../components/Pagination.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input } from '../../components/ui/input.tsx';
import { supabase } from '../../lib/supabase.ts';
import { useNavigate, useParams } from 'react-router-dom';

export default function SearchScreen() {
    const {
        query,
        setQuery,
        activeQuery,
        results,
        isLoading,
        currentPage,
        totalResults,
        totalPages,
        handleSearch,
        handlePageChange,
    } = useSearch();

    const { trendingSongs, isLoadingTrending, trendingError } = useTrendingSongs();
    const navigate = useNavigate();
    const { modeId } = useParams();
    const [bestScores, setBestScores] = useState<Record<string, number>>({});

    // NOUVEAU : État pour la pagination des tendances
    const [currentTrendingPage, setCurrentTrendingPage] = useState(1);
    const itemsPerTrendingPage = 12;

    const handleSelectSong = (song: Song) => {
        navigate(`/mode/${modeId}/solo/play`, { state: { song } });
    };

    // CORRECTION : On utilise `activeQuery` au lieu de `query` pour ne pas réagir à la frappe !
    const showTrending = results.length === 0 && activeQuery.trim() === '';

    // NOUVEAU : Logique de pagination locale pour les 100 musiques tendances
    const totalTrendingPages = Math.ceil(trendingSongs.length / itemsPerTrendingPage);
    const paginatedTrendingSongs = trendingSongs.slice(
        (currentTrendingPage - 1) * itemsPerTrendingPage,
        currentTrendingPage * itemsPerTrendingPage
    );

    // NOUVEAU : On affiche soit les tendances Paginées, soit les résultats de recherche
    const displayedSongs = showTrending ? paginatedTrendingSongs : results;

    useEffect(() => {
        const fetchBestScores = async () => {
            if (displayedSongs.length === 0) {
                setBestScores({});
                return;
            }

            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const songIds = displayedSongs.map((song) => song.id.toString());

            const { data, error } = await supabase
                .from('game_history')
                .select('song_id, score_percentage')
                .eq('user_id', user.id)
                .in('song_id', songIds);

            if (error) {
                console.error('Erreur lors de la récupération des scores :', error);
                return;
            }

            if (data) {
                const scoresMap: Record<string, number> = {};
                data.forEach((record) => {
                    const currentMax = scoresMap[record.song_id] || 0;
                    if (record.score_percentage > currentMax) {
                        scoresMap[record.song_id] = record.score_percentage;
                    }
                });
                setBestScores(scoresMap);
            }
        };

        fetchBestScores();
    }, [results, paginatedTrendingSongs, showTrending]); // Mise à jour des dépendances

    // Fonction pour scroller en haut lors du changement de page des tendances
    const handleTrendingPageChange = (page: number) => {
        setCurrentTrendingPage(page);
        setTimeout(() => {
            const resultsContainer = document.getElementById('results-top');
            if (resultsContainer) {
                resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 50);
    };

    return (
        <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen pb-12 font-sans">
            <header className="border-border relative flex flex-col items-center border-b px-4 pt-12 pb-8 md:px-6 md:pt-16">
                <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <UserMenuButton />
                </div>

                <h1 className="font-titre titre-neon-primary mb-8 text-center text-5xl tracking-widest drop-shadow-[0_0_20px_rgba(232,28,255,0.4)] sm:text-6xl md:mb-10 md:text-8xl">
                    NoLyrics
                </h1>

                <form
                    onSubmit={handleSearch}
                    className="flex w-full max-w-xl flex-col gap-3 sm:flex-row md:gap-4"
                >
                    <Input
                        type="text"
                        placeholder="Rechercher un artiste, un titre..."
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setQuery(e.target.value)
                        }
                        className="font-texte bg-input border-border focus-visible:ring-primary h-14 flex-1 rounded-2xl text-lg shadow-inner focus-visible:ring-2 md:text-xl"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="font-texte bg-primary text-primary-foreground hover:bg-primary/80 h-14 w-full rounded-2xl px-8 text-lg shadow-[0_0_15px_rgba(232,28,255,0.3)] transition-all sm:w-auto md:text-xl"
                    >
                        {isLoading ? '...' : 'Chercher'}
                    </Button>
                </form>
            </header>

            <main id="results-top" className="mx-auto max-w-7xl p-4 md:p-6">
                {/* SECTION 1 : TENDANCES */}
                {showTrending && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 mb-8 duration-700">
                        {isLoadingTrending ? (
                            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div
                                        key={`skeleton-${i}`}
                                        className="h-[280px] animate-pulse rounded-2xl border border-white/10 bg-white/5"
                                    />
                                ))}
                            </div>
                        ) : trendingError ? (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                                <p className="text-muted-foreground font-texte italic">
                                    Impossible de charger les tendances pour le moment.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                                    {paginatedTrendingSongs.map((song) => (
                                        <SongCard
                                            key={`trending-${song.id}`}
                                            song={song}
                                            onClick={handleSelectSong}
                                            bestScore={bestScores[song.id.toString()]}
                                        />
                                    ))}
                                </div>

                                {/* NOUVEAU : Pagination pour les tendances */}
                                {trendingSongs.length > itemsPerTrendingPage && (
                                    <div className="mt-8">
                                        <Pagination
                                            currentPage={currentTrendingPage}
                                            totalPages={totalTrendingPages}
                                            isLoading={false}
                                            onPageChange={handleTrendingPageChange}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* SECTION 2 : RÉSULTATS DE RECHERCHE */}
                {!showTrending && totalResults > 0 && (
                    <p className="text-muted-foreground font-texte animate-in fade-in mb-4 text-base md:mb-6 md:text-lg">
                        {totalResults} résultats trouvés
                    </p>
                )}

                {!showTrending && results.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                        {results.map((song) => (
                            <SongCard
                                key={`search-${song.id}`}
                                song={song}
                                onClick={handleSelectSong}
                                bestScore={bestScores[song.id.toString()]}
                            />
                        ))}
                    </div>
                )}

                {!showTrending &&
                    results.length === 0 &&
                    !isLoading &&
                    activeQuery.trim() !== '' && (
                        <div className="animate-in fade-in py-20 text-center">
                            <p className="font-titre text-muted-foreground mb-2 text-2xl">Oups !</p>
                            <p className="font-texte text-muted-foreground/80 text-lg">
                                Aucun résultat trouvé pour "{activeQuery}". Essaie avec un autre
                                titre !
                            </p>
                        </div>
                    )}

                {!showTrending && results.length > 0 && (
                    <div className="mt-8">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            isLoading={isLoading}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
