import React from 'react';
import { Song } from '../types';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import UserMenuButton from './UserMenuButton';
import SongCard from './SongCard';
import Pagination from './Pagination';
import { Button } from './ui/button';
import { Input } from './ui/input'; // <-- NOUVEL IMPORT

export default function SearchScreen() {
    const {
        query, setQuery, results, isLoading, currentPage, totalResults, totalPages, handleSearch, handlePageChange
    } = useSearch();

    const navigate = useNavigate();

    const handleSelectSong = (song: Song) => {
        navigate('/game', { state: { song } });
    };

    return (
        // On passe sur le vrai fond sombre (bg-background) et on sélectionne en rose
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground pb-12">

            <header className="pt-16 pb-8 px-6 flex flex-col items-center border-b border-border relative">
                <div className="absolute top-6 right-6">
                    <UserMenuButton />
                </div>

                {/* Le Titre principal en Rose Fluo avec un effet "Néon" (drop-shadow) */}
                <h1 className="text-6xl md:text-8xl font-titre text-primary mb-10 tracking-widest drop-shadow-[0_0_20px_rgba(232,28,255,0.4)]">
                    NoLyrics
                </h1>

                <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-3">
                    <Input
                        type="text"
                        placeholder="Rechercher un artiste, un titre..."
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        className="flex-1 font-texte text-xl h-14 rounded-2xl bg-input border-border focus-visible:ring-primary focus-visible:ring-2 shadow-inner"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-14 px-8 rounded-2xl font-texte text-xl bg-primary text-primary-foreground hover:bg-primary/80 shadow-[0_0_15px_rgba(232,28,255,0.3)] transition-all"
                    >
                        {isLoading ? '...' : 'Chercher'}
                    </Button>
                </form>
            </header>

            <main className="p-6 max-w-7xl mx-auto">
                {totalResults > 0 && (
                    <p className="text-muted-foreground font-texte mb-6 text-lg">
                        {totalResults} résultats trouvés
                    </p>
                )}

                {results.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {results.map((song) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                onClick={handleSelectSong}
                            />
                        ))}
                    </div>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    isLoading={isLoading}
                    onPageChange={handlePageChange}
                />
            </main>
        </div>
    );
}