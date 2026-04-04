import { useState, useEffect } from 'react';
import { Song } from '../types';

export function useTrendingSongs() {
    const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
    const [isLoadingTrending, setIsLoadingTrending] = useState<boolean>(true);
    const [trendingError, setTrendingError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                setIsLoadingTrending(true);
                setTrendingError(null);

                // On utilise la playlist officielle "Top France" de Deezer (ID: 1109890291)
                // Grâce à ton proxy Vite, la requête partira vers https://api.deezer.com/playlist/1109890291
                const response = await fetch('/api/deezer/playlist/1109890291');

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des tendances');
                }

                const data = await response.json();

                // L'API playlist de Deezer met les chansons dans "tracks.data"
                if (data && data.tracks && data.tracks.data) {
                    // On ne garde que les 10 premières chansons pour ne pas surcharger la page d'accueil
                    const top100 = data.tracks.data.slice(0, 100);

                    // 🪄 La magie opère ici : on transforme les données Deezer en notre type "Song" strict
                    const formattedSongs: Song[] = top100.map((track: any) => ({
                        id: track.id,
                        title: track.title,
                        artist: {
                            name: track.artist.name,
                        },
                        album: {
                            cover_small: track.album.cover_small || '',
                            // Parfois Deezer ne renvoie pas le cover_xl dans les playlists, on utilise le medium en secours
                            cover_xl:
                                track.album.cover_xl ||
                                track.album.cover_medium ||
                                track.album.cover_small ||
                                '',
                        },
                        duration: track.duration,
                        preview: track.preview || '',
                    }));

                    setTrendingSongs(formattedSongs);
                } else {
                    throw new Error('Format de données inattendu');
                }
            } catch (err: any) {
                console.error('Erreur hook tendances:', err);
                setTrendingError(err.message || 'Impossible de charger les tendances');
                // En cas d'erreur (pas de connexion, proxy HS), on pourrait injecter des musiques "fallback" ici plus tard
            } finally {
                setIsLoadingTrending(false);
            }
        };

        fetchTrending();
    }, []);

    return { trendingSongs, isLoadingTrending, trendingError };
}
