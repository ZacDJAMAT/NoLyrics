import { useState, useEffect, useCallback } from 'react';
import { SelectionItem } from '@/pages/fillyrics/FillyricsLobbyScreen';
import { Song } from '@/types';
import { getArtistTopTracks, fetchLyrics } from '@/utils/api';

// Liste d'IDs d'artistes populaires par défaut (Tendances : Angèle, Orelsan, Damso, Stromae, The Weeknd, etc.)
const TRENDING_ARTIST_IDS = ['4050205', '1188', '1063640', '73568', '144227', '6220', '11800'];

const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const useFillyricsPlaylist = (initialSelection: SelectionItem[], reloadKey: number) => {
    const [playlist, setPlaylist] = useState<Song[]>([]);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [isMixing, setIsMixing] = useState(true);
    const [mixError, setMixError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        const generatePlaylist = async () => {
            setIsMixing(true);
            setMixError(null);
            setCurrentRoundIndex(0);

            try {
                const artists = initialSelection.filter((item) => item.type === 'artist');
                let artistIdsToFetch: (string | number)[] = [];

                // 👉 1. GESTION DES TENDANCES (Si aucun artiste n'est sélectionné)
                if (artists.length > 0) {
                    artistIdsToFetch = artists.map((a) => a.data.id);
                } else {
                    // On prend 4 artistes au hasard dans la liste des tendances
                    artistIdsToFetch = [...TRENDING_ARTIST_IDS]
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 4);
                }

                let allTracks: Song[] = [];
                for (const id of artistIdsToFetch) {
                    const tracks = await getArtistTopTracks(id, 100);
                    allTracks = [...allTracks, ...tracks];
                }

                const shuffledCandidates = shuffleArray(allTracks);

                if (ignore) return;

                // 3. LA VÉRIFICATION DES PAROLES
                const finalPlaylist: Song[] = [];
                for (const candidate of shuffledCandidates) {
                    if (finalPlaylist.length >= 10) break; // Buffer de 10 musiques prêtes
                    if (finalPlaylist.some((fs) => fs.id === candidate.id)) continue;

                    try {
                        const rawLyrics = await fetchLyrics(candidate.artist.name, candidate.title);
                        if (rawLyrics && rawLyrics.trim().length > 50) {
                            finalPlaylist.push(candidate);
                        }
                    } catch (err) {
                        // Paroles introuvables, on ignore silencieusement
                    }
                }

                if (ignore) return;

                if (finalPlaylist.length === 0) {
                    throw new Error(
                        'Impossible de générer le mix : aucune des musiques ne possède de paroles valides.'
                    );
                }

                setPlaylist(finalPlaylist);
            } catch (err: any) {
                if (!ignore) setMixError(err.message || 'Erreur lors de la préparation du mix.');
            } finally {
                if (!ignore) setIsMixing(false);
            }
        };

        generatePlaylist();

        return () => {
            ignore = true;
        };
    }, [initialSelection, reloadKey]);

    const nextRound = useCallback(() => {
        setCurrentRoundIndex((prev) => prev + 1);
    }, []);

    return {
        playlist,
        currentSong: playlist[currentRoundIndex],
        currentRoundIndex,
        totalRounds: playlist.length,
        isMixing,
        mixError,
        nextRound,
        isLastRound: currentRoundIndex === playlist.length - 1,
    };
};
