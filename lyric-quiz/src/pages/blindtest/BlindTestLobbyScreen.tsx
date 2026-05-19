import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';
import SharedSearch from '@/components/shared/SharedSearch';
import ArtistCard from '@/components/shared/ArtistCard';
import { Artist } from '@/types';
import { SelectionItem } from '@/pages/fillyrics/FillyricsLobbyScreen'; // Pour le type

export default function BlindTestLobbyScreen() {
    const navigate = useNavigate();
    const [selection, setSelection] = useState<SelectionItem[]>([]);

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

    return (
        <div className="bg-background text-foreground min-h-screen p-6 pb-32">
            <Button variant="back" onClick={() => navigate('/')} className="font-texte mb-8">
                <ArrowLeft className="mr-2 h-5 w-5" /> Retour au Hub
            </Button>

            <h1 className="font-titre text-destructive mb-2 text-center text-4xl drop-shadow-[0_0_15px_rgba(255,42,95,0.5)]">
                BLIND TEST EXTRÊME
            </h1>
            <p className="font-texte text-muted-foreground mb-8 text-center">
                Sélectionne les artistes pour générer ta partie.
            </p>

            {/* Réutilisation intelligente de ton composant de recherche */}
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

            {/* Bouton de validation dynamique */}
            {selection.length > 0 && (
                <div className="animate-in slide-in-from-bottom-10 fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
                    <Button
                        onClick={() => navigate('/mode/blindtest/play', { state: { selection } })}
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
