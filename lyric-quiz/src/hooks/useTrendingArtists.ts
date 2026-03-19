import { useState, useEffect } from 'react';
import { Artist } from '../types';

export function useTrendingArtists() {
    const [trendingArtists, setTrendingArtists] = useState<Artist[]>([]);
    const [isLoadingTrendingArtists, setIsLoadingTrendingArtists] = useState<boolean>(true);
    const [trendingError, setTrendingError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                setIsLoadingTrendingArtists(true);
                setTrendingError(null);

                // L'API Deezer possède un endpoint "chart" pour les tops. Le "0" correspond au top global/général.
                const response = await fetch('/api/deezer/chart/0/artists?limit=100');

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des artistes tendances');
                }

                const data = await response.json();

                if (data && data.data) {
                    const formattedArtists: Artist[] = data.data.map((artist: any) => ({
                        id: artist.id,
                        name: artist.name,
                        picture_xl:
                            artist.picture_xl ||
                            artist.picture_medium ||
                            artist.picture_small ||
                            '',
                    }));

                    setTrendingArtists(formattedArtists);
                } else {
                    throw new Error('Format de données inattendu');
                }
            } catch (err: any) {
                console.error('Erreur hook artistes tendances:', err);
                setTrendingError(err.message || 'Impossible de charger les tendances');
            } finally {
                setIsLoadingTrendingArtists(false);
            }
        };

        fetchTrending();
    }, []);

    return { trendingArtists, isLoadingTrendingArtists, trendingError };
}
