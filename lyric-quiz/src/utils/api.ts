// src/utils/api.ts
import { SearchResult, LRCLIBTrack } from '../types';

export const searchSongs = async (searchQuery: string, pageNumber: number, limit: number = 12): Promise<SearchResult> => {
    if (!searchQuery) return { results: [], total: 0 };

    const index = (pageNumber - 1) * limit;

    try {
        const response = await fetch(`/api/deezer/search?q=${encodeURIComponent(searchQuery)}&limit=${limit}&index=${index}`);
        if (!response.ok) throw new Error('Erreur réseau Deezer');

        const data = await response.json();

        return {
            results: data.data || [],
            total: data.total || 0
        };
    } catch (error) {
        console.error("Erreur lors de la recherche Deezer :", error);
        throw new Error("Impossible de récupérer les résultats de recherche.");
    }
};

export const fetchLyrics = async (artistName: string, trackTitle: string): Promise<string | null> => {
    try {
        const searchQuery = `${artistName} ${trackTitle}`;
        const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Erreur réseau LRCLIB');

        // On précise que data est un tableau de LRCLIBTrack
        const data: LRCLIBTrack[] = await response.json();

        const trackWithLyrics = data.find(track => track.plainLyrics && track.plainLyrics.trim() !== '');

        if (!trackWithLyrics || !trackWithLyrics.plainLyrics) {
            return null;
        }

        return trackWithLyrics.plainLyrics;
    } catch (error) {
        console.error("Erreur lors de la récupération des paroles LRCLIB :", error);
        throw new Error("Erreur de connexion lors de la récupération des paroles.");
    }
};