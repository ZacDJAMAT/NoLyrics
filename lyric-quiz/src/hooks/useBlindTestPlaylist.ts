import { useState, useEffect, useCallback } from 'react';
import { SelectionItem } from '@/pages/fillyrics/FillyricsLobbyScreen'; // On réutilise ton type !
import { Song } from '@/types';
import { getArtistTopTracks } from '@/utils/api';

// Fonction de mélange aléatoire
const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const useBlindTestPlaylist = (initialSelection: SelectionItem[]) => {
    const [playlist, setPlaylist] = useState<Song[]>([]);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        const initPlaylist = async () => {
            setIsLoading(true);
            try {
                const artists = initialSelection.filter((item) => item.type === 'artist');
                if (artists.length === 0) {
                    throw new Error('Aucun artiste sélectionné.');
                }

                // 1. On récupère les IDs et on télécharge en parallèle (grâce à notre optimisation précédente !)
                const artistIds = artists.map((a) => a.data.id);
                const tracksArrays = await Promise.all(
                    artistIds.map((id) => getArtistTopTracks(id, 50)) // On prend large (50 par artiste)
                );

                // 2. 🛡️ FILTRE STRICT : On ne garde QUE les musiques avec un 'preview' valide
                const validTracks = tracksArrays
                    .flat()
                    .filter((track) => track.preview && track.preview.trim() !== '');

                if (validTracks.length === 0) {
                    throw new Error('Aucun extrait audio disponible pour ces artistes.');
                }

                if (!ignore) {
                    // 3. On mélange tout et on stocke
                    setPlaylist(shuffleArray(validTracks));
                }
            } catch (err: any) {
                if (!ignore) setError(err.message || 'Erreur de chargement');
            } finally {
                if (!ignore) setIsLoading(false);
            }
        };

        initPlaylist();
        return () => {
            ignore = true;
        };
    }, [initialSelection]);

    const nextRound = useCallback(() => {
        setCurrentRoundIndex((prev) => prev + 1);
    }, []);

    return {
        playlist,
        currentSong: playlist[currentRoundIndex] || null,
        currentRoundIndex,
        isLoading,
        error,
        nextRound,
    };
};
