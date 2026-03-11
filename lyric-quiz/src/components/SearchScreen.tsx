import React, { useEffect, useState } from 'react';
import { Song } from '../types';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import UserMenuButton from './UserMenuButton';
import SongCard from './SongCard';
import Pagination from './Pagination';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '../lib/supabase';

export default function SearchScreen() {
    const {
        query, setQuery, results, isLoading, currentPage, totalResults, totalPages, handleSearch, handlePageChange
    } = useSearch();

    const navigate = useNavigate();

    // NOUVEAU : Un état pour stocker les meilleurs scores (ex: { "12345": 100, "67890": 45 })
    const [bestScores, setBestScores] = useState<Record<string, number>>({});

    const handleSelectSong = (song: Song) => {
        navigate('/game', { state: { song } });
    };

    // NOUVEAU : L'effet qui va chercher les scores quand les résultats s'affichent
    useEffect(() => {
        const fetchBestScores = async () => {
            // 1. On vérifie s'il y a des résultats à l'écran
            if (results.length === 0) {
                setBestScores({});
                return;
            }

            // 2. On récupère l'utilisateur actuellement connecté
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // S'il n'est pas connecté, on ne fait rien

            // 3. On extrait les IDs des musiques affichées (en format texte comme dans ta BDD)
            const songIds = results.map(song => song.id.toString());

            // 4. On demande à Supabase les scores de CE joueur pour CES musiques
            const { data, error } = await supabase
                .from('game_history')
                .select('song_id, score_percentage')
                .eq('user_id', user.id)
                .in('song_id', songIds);

            if (error) {
                console.error("Erreur lors de la récupération des scores :", error);
                return;
            }

            // 5. On trie pour ne garder que le MEILLEUR score de chaque musique
            if (data) {
                const scoresMap: Record<string, number> = {};
                data.forEach(record => {
                    const currentMax = scoresMap[record.song_id] || 0;
                    if (record.score_percentage > currentMax) {
                        scoresMap[record.song_id] = record.score_percentage;
                    }
                });
                setBestScores(scoresMap);
            }
        };

        fetchBestScores();
    }, [results]); // Se déclenche à chaque fois que `results` change

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground pb-12">

            {/* HEADER INCHANGÉ... */}
            <header className="pt-12 md:pt-16 pb-8 px-4 md:px-6 flex flex-col items-center border-b border-border relative">
                <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <UserMenuButton />
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-8xl font-titre titre-neon-primary mb-8 md:mb-10 tracking-widest drop-shadow-[0_0_20px_rgba(232,28,255,0.4)] text-center">
                    NoLyrics
                </h1>

                <form onSubmit={handleSearch} className="w-full max-w-xl flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Input
                        type="text"
                        placeholder="Rechercher un artiste, un titre..."
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        className="flex-1 font-texte text-lg md:text-xl h-14 rounded-2xl bg-input border-border focus-visible:ring-primary focus-visible:ring-2 shadow-inner"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-14 w-full sm:w-auto px-8 rounded-2xl font-texte text-lg md:text-xl bg-primary text-primary-foreground hover:bg-primary/80 shadow-[0_0_15px_rgba(232,28,255,0.3)] transition-all"
                    >
                        {isLoading ? '...' : 'Chercher'}
                    </Button>
                </form>
            </header>

            <main id="results-top" className="p-4 md:p-6 max-w-7xl mx-auto">
                {totalResults > 0 && (
                    <p className="text-muted-foreground font-texte mb-4 md:mb-6 text-base md:text-lg">
                        {totalResults} résultats trouvés
                    </p>
                )}

                {results.length > 0 && (
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {results.map((song) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                onClick={handleSelectSong}
                                // NOUVEAU : On injecte le score si on l'a trouvé dans notre dictionnaire
                                bestScore={bestScores[song.id.toString()]}
                            />
                        ))}
                    </div>
                )}

                <div className="mt-8">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        isLoading={isLoading}
                        onPageChange={handlePageChange}
                    />
                </div>
            </main>
        </div>
    );
}