import { useState, useEffect, useCallback } from 'react';
import { SelectionItem } from '@/pages/fillyrics/FillyricsLobbyScreen';
import { Song } from '@/types';
import { getArtistTopTracks, fetchLyrics } from '@/utils/api';

export const useFillyricsPlaylist = (initialSelection: SelectionItem[], reloadKey: number) => {
    const [playlist, setPlaylist] = useState<Song[]>([]);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [isMixing, setIsMixing] = useState(true);
    const [mixError, setMixError] = useState<string | null>(null);

    useEffect(() => {
        // 👉 ANTI-GLITCH : Le drapeau pour bloquer le double-chargement de React
        let ignore = false;

        const generatePlaylist = async () => {
            setIsMixing(true);
            setMixError(null);
            setCurrentRoundIndex(0);

            try {
                // 1. Séparer artistes et musiques
                const explicitSongs = initialSelection
                    .filter((item) => item.type === 'song')
                    .map((item) => item.data as Song);
                const artists = initialSelection.filter((item) => item.type === 'artist');

                let candidates: Song[] = [...explicitSongs.sort(() => 0.5 - Math.random())];

                // 2. Extraire TOUTES les musiques des artistes (jusqu'à 300)
                if (artists.length > 0) {
                    const artistsTracks: Record<string, Song[]> = {};
                    for (const artist of artists) {
                        // 👉 MODIFICATION : On demande 300 pistes au lieu de 15 pour couvrir la discographie
                        // Ensuite on les mélange aléatoirement pour avoir des musiques moins connues
                        const tracks = await getArtistTopTracks(artist.id, 300);
                        artistsTracks[artist.id] = tracks.sort(() => 0.5 - Math.random());
                    }

                    // Distribution équitable entre les artistes
                    let added = true;
                    while (added) {
                        added = false;
                        for (const artist of artists) {
                            if (artistsTracks[artist.id] && artistsTracks[artist.id].length > 0) {
                                candidates.push(artistsTracks[artist.id].pop() as Song);
                                added = true;
                            }
                        }
                    }
                }

                if (ignore) return; // 👈 On coupe ici si le composant a été démonté

                // 3. LA VÉRIFICATION OBLIGATOIRE DES PAROLES
                const finalPlaylist: Song[] = [];
                for (const candidate of candidates) {
                    if (finalPlaylist.length >= 10) break;

                    if (finalPlaylist.some((fs) => fs.id === candidate.id)) continue;

                    try {
                        const rawLyrics = await fetchLyrics(candidate.artist.name, candidate.title);
                        if (rawLyrics && rawLyrics.trim().length > 50) {
                            finalPlaylist.push(candidate);
                        }
                    } catch (err) {
                        console.warn(`Paroles introuvables pour ${candidate.title}, ignorée.`);
                    }
                }

                if (ignore) return; // 👈 Double sécurité avant de valider la playlist finale

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

        if (initialSelection && initialSelection.length > 0) {
            generatePlaylist();
        }

        // 👈 Nettoyage : Si React relance l'effet, on annule l'ancien mixage !
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
