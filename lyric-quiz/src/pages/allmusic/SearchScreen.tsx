import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SharedSearch from '../../components/shared/SharedSearch';
import SongCard from '../../components/shared/SongCard';
import { Song } from '../../types';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import UserMenuButton from '../../components/layout/UserMenuButton';
import { supabase } from '../../lib/supabase';

export default function SearchScreen() {
    const navigate = useNavigate();
    const { modeId } = useParams();
    const [bestScores, setBestScores] = useState<Record<string, number>>({});

    // 1. Cette fonction est appelée par SharedSearch à chaque fois que la page ou la recherche change
    const handleDisplayedItemsChange = async (items: any[]) => {
        if (items.length === 0) {
            setBestScores({});
            return;
        }

        // On vérifie si l'utilisateur est connecté
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // On extrait les IDs des musiques affichées (en ignorant les artistes s'il y en avait)
        const songIds = items.filter((item) => item.title).map((song) => song.id.toString());
        if (songIds.length === 0) return;

        // On va chercher les scores uniquement pour ces musiques
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

    // 2. On prépare l'en-tête spécifique à NAllMusic
    const headerChildren = (
        <div className="border-border relative mb-8 flex flex-col items-center border-b pb-8">
            <div className="absolute top-0 left-0 z-20">
                <Button
                    variant="back"
                    onClick={() => navigate('/')}
                    className="font-texte px-2 text-base md:px-3 md:text-lg"
                >
                    <ArrowLeft className="h-5 w-5 md:mr-1" />
                    <span className="hidden sm:inline">Retour au Hub</span>
                </Button>
            </div>
            <div className="absolute top-0 right-0 z-20">
                <UserMenuButton />
            </div>

            <h1 className="font-titre titre-neon-primary mt-12 mb-2 text-center text-5xl tracking-widest drop-shadow-[0_0_20px_rgba(232,28,255,0.4)] sm:text-6xl md:mb-4 md:text-8xl">
                NoLyrics
            </h1>
        </div>
    );

    return (
        <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen p-4 pb-12 font-sans md:p-6">
            <SharedSearch
                allowedTabs={['songs']} // NAllMusic ne cherche QUE des musiques
                defaultTab="songs"
                headerChildren={headerChildren}
                onDisplayedItemsChange={handleDisplayedItemsChange} // On écoute les changements
                // L'Inversion de Contrôle : On dessine la carte avec la redirection vers le jeu et le badge de score !
                renderSongCard={(song, isFavorite, onToggleFav) => (
                    <SongCard
                        key={`nallmusic-${song.id}`}
                        song={song as Song}
                        onClick={(s) =>
                            navigate(`/mode/${modeId}/solo/play/${s.id}`, { state: { song: s } })
                        }
                        bestScore={bestScores[song.id.toString()]}
                        isFavorite={isFavorite}
                        onToggleFavorite={onToggleFav}
                    />
                )}
            />
        </div>
    );
}
