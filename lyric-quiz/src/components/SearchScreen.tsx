import React from 'react';
import { Song } from '../types';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import UserMenuButton from './UserMenuButton';
import SongCard from './SongCard';
import Pagination from './Pagination';


export default function SearchScreen() {
    // 🧠 1. On délègue TOUTE la logique complexe à notre Hook personnalisé
    const {
        query,
        setQuery,
        results,
        isLoading,
        currentPage,
        totalResults,
        totalPages,
        handleSearch,
        handlePageChange
    } = useSearch();

    const navigate = useNavigate();

    const handleSelectSong = (song: Song) => {
        // On navigue vers la page /game, et on glisse l'objet "song" dans les bagages (state)
        navigate('/game', { state: { song } });
    };

    // 🎨 2. On ne garde que l'affichage (qui utilise nos "Dumb Components")
    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-pink-500 selection:text-white pb-12">
            <header className="pt-16 pb-8 px-6 flex flex-col items-center border-b border-neutral-800 relative">

                <div className="absolute top-6 right-6">
                    <UserMenuButton />
                </div>

                <h1 className="text-6xl font-title mb-8 tracking-tight">NoLyrics</h1>
                <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-3">
                    <input
                        type="text"
                        placeholder="Rechercher un artiste, un titre..."
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        className="flex-1 bg-neutral-800 text-white px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 transition-all text-lg placeholder:text-neutral-500 shadow-inner"
                    />
                    <button
                        type="submit"
                        className="bg-pink-600 hover:bg-pink-500 px-8 py-4 rounded-2xl font-semibold transition-colors disabled:opacity-50 shadow-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? '...' : 'Chercher'}
                    </button>
                </form>
            </header>

            <main className="p-6 max-w-7xl mx-auto">
                {totalResults > 0 && (
                    <p className="text-neutral-400 mb-6 text-sm">
                        {totalResults} résultats trouvés
                    </p>
                )}

                {results.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {/* On utilise notre composant SongCard pour chaque résultat */}
                        {results.map((song) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                onClick={handleSelectSong}
                            />
                        ))}
                    </div>
                )}

                {/* On utilise notre composant Pagination */}
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