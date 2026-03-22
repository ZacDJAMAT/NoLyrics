import { useState, useEffect } from 'react';
import { Artist } from '../types';
import { getTopArtists } from '../utils/api';

export function useTrendingArtists() {
    const [trendingArtists, setTrendingArtists] = useState<Artist[]>([]);
    const [isLoadingTrendingArtists, setIsLoadingTrendingArtists] = useState<boolean>(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                setIsLoadingTrendingArtists(true);

                // 👉 On délègue à notre API (50 max pour éviter le bug de Deezer)
                const artists = await getTopArtists(50);

                if (artists && artists.length > 0) {
                    setTrendingArtists(artists);
                } else {
                    setTrendingArtists([]);
                }
            } catch {
                setTrendingArtists([]);
            } finally {
                setIsLoadingTrendingArtists(false);
            }
        };

        fetchTrending();
    }, []);

    return { trendingArtists, isLoadingTrendingArtists };
}
