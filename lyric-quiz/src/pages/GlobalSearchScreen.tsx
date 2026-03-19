import { useNavigate } from 'react-router-dom';
import SharedSearch from '../components/shared/SharedSearch.tsx';
import { Button } from '../components/ui/button.tsx';
import { ArrowLeft, Search } from 'lucide-react';
import UserMenuButton from '../components/layout/UserMenuButton.tsx';
import ArtistCard from '@/components/shared/ArtistCard.tsx';
import SongCard from '@/components/shared/SongCard.tsx';

export default function GlobalSearchScreen() {
    const navigate = useNavigate();

    return (
        <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen p-4 pb-24 font-sans md:p-6">
            <header className="border-border relative mb-8 flex flex-col items-center border-b pb-8">
                <div className="absolute top-0 left-0 z-20">
                    <Button variant="back" onClick={() => navigate('/')} className="font-texte">
                        <ArrowLeft className="h-5 w-5 md:mr-1" />
                        <span className="hidden sm:inline">Retour au Hub</span>
                    </Button>
                </div>
                <div className="absolute top-0 right-0 z-20">
                    <UserMenuButton />
                </div>

                <h1 className="font-titre titre-neon-primary mt-12 mb-2 flex items-center justify-center gap-4 text-center text-4xl tracking-widest drop-shadow-[0_0_20px_rgba(232,28,255,0.4)] md:text-6xl">
                    <Search className="text-primary h-8 w-8 md:h-12 md:w-12" /> RECHERCHE GLOBALE
                </h1>
                <p className="text-muted-foreground font-texte text-center text-lg md:text-xl">
                    Gère ta bibliothèque et tes favoris.
                </p>
            </header>

            <main>
                <SharedSearch
                    allowedTabs={['artists', 'songs']}
                    defaultTab="artists"
                    renderSongCard={(song, isFavorite, onToggleFav) => (
                        <SongCard
                            key={song.id}
                            song={song}
                            onClick={() => {}} // Rien au clic
                            isFavorite={isFavorite}
                            onToggleFavorite={onToggleFav}
                        />
                    )}
                    renderArtistCard={(artist, isFavorite, onToggleFav) => (
                        <ArtistCard
                            key={artist.id}
                            artist={artist}
                            onClick={() => {}} // Rien au clic
                            isFavorite={isFavorite}
                            onToggleFavorite={onToggleFav}
                        />
                    )}
                />
            </main>
        </div>
    );
}
