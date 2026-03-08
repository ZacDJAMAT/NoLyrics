import React from 'react';
import { Song } from '../types';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import UserMenuButton from './UserMenuButton';
import SongCard from './SongCard';
import Pagination from './Pagination';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function SearchScreen() {
    const {
        query, setQuery, results, isLoading, currentPage, totalResults, totalPages, handleSearch, handlePageChange
    } = useSearch();

    const navigate = useNavigate();

    const handleSelectSong = (song: Song) => {
        navigate('/game', { state: { song } });
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground pb-12">

            {/* 1. HEADER : Marges réduites sur mobile (px-4 au lieu de px-6, pt-12 au lieu de pt-16) */}
            <header className="pt-12 md:pt-16 pb-8 px-4 md:px-6 flex flex-col items-center border-b border-border relative">

                {/* 2. MENU UTILISATEUR : Repositionné pour ne pas toucher les bords sur mobile */}
                <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <UserMenuButton />
                </div>

                {/* 3. TITRE : text-5xl sur mobile (pour s'adapter aux petits écrans), puis text-6xl, puis text-8xl sur PC */}
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-titre titre-neon-primary mb-8 md:mb-10 tracking-widest drop-shadow-[0_0_20px_rgba(232,28,255,0.4)] text-center">
                    NoLyrics
                </h1>

                {/* 4. FORMULAIRE : flex-col sur mobile (les éléments s'empilent), et sm:flex-row (côte à côte) à partir des tablettes */}
                <form onSubmit={handleSearch} className="w-full max-w-xl flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Input
                        type="text"
                        placeholder="Rechercher un artiste, un titre..."
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        className="flex-1 font-texte text-lg md:text-xl h-14 rounded-2xl bg-input border-border focus-visible:ring-primary focus-visible:ring-2 shadow-inner"
                    />
                    {/* Le bouton prend 100% de la largeur sur mobile (w-full), et s'adapte à son contenu sur PC (sm:w-auto) */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-14 w-full sm:w-auto px-8 rounded-2xl font-texte text-lg md:text-xl bg-primary text-primary-foreground hover:bg-primary/80 shadow-[0_0_15px_rgba(232,28,255,0.3)] transition-all"
                    >
                        {isLoading ? '...' : 'Chercher'}
                    </Button>
                </form>
            </header>

            {/* 5. MAIN : Padding adapté */}
            <main className="p-4 md:p-6 max-w-7xl mx-auto">
                {totalResults > 0 && (
                    <p className="text-muted-foreground font-texte mb-4 md:mb-6 text-base md:text-lg">
                        {totalResults} résultats trouvés
                    </p>
                )}

                {results.length > 0 && (
                     // 6. GRILLE : 1 seule colonne sur les tout petits téléphones, 2 colonnes dès 400px, etc. Et l'espacement (gap) se réduit sur mobile.
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {results.map((song) => (
                    <SongCard
                    key={song.id}
                  song={song}
                  onClick={handleSelectSong}
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