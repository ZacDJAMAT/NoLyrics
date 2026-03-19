import { SearchResult, LRCLIBTrack } from '../types';
import { Song, Artist } from '../types';

export const searchSongs = async (
    searchQuery: string,
    pageNumber: number,
    limit: number = 12
): Promise<SearchResult> => {
    if (!searchQuery) return { results: [], total: 0 };

    const index = (pageNumber - 1) * limit;

    try {
        const response = await fetch(
            `/api/deezer/search?q=${encodeURIComponent(searchQuery)}&limit=${limit}&index=${index}`
        );
        if (!response.ok) throw new Error('Erreur réseau Deezer');

        const data = await response.json();

        return {
            results: data.data || [],
            total: data.total || 0,
        };
    } catch (error) {
        console.error('Erreur lors de la recherche Deezer :', error);
        throw new Error('Impossible de récupérer les résultats de recherche.');
    }
};

export const searchArtists = async (
    query: string,
    page: number = 1,
    limit: number = 12
): Promise<{ results: Artist[]; total: number }> => {
    try {
        const startIndex = (page - 1) * limit;
        const response = await fetch(
            `/api/deezer/search/artist?q=${encodeURIComponent(query)}&index=${startIndex}&limit=${limit}`
        );

        if (!response.ok) throw new Error('Erreur réseau Deezer');

        const data = await response.json();

        if (data.error) throw new Error(data.error.message);

        const artists: Artist[] = data.data.map((artist: any) => ({
            id: artist.id,
            name: artist.name,
            picture_xl: artist.picture_xl || artist.picture_medium || artist.picture_small || '',
        }));

        return {
            results: artists,
            total: data.total || 0,
        };
    } catch (error) {
        console.error('Erreur API searchArtists :', error);
        throw error;
    }
};

export const fetchLyrics = async (
    artistName: string,
    trackTitle: string
): Promise<string | null> => {
    try {
        const searchQuery = `${artistName} ${trackTitle}`;
        const response = await fetch(
            `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`
        );
        if (!response.ok) throw new Error('Erreur réseau LRCLIB');

        // On précise que data est un tableau de LRCLIBTrack
        const data: LRCLIBTrack[] = await response.json();

        const trackWithLyrics = data.find(
            (track) => track.plainLyrics && track.plainLyrics.trim() !== ''
        );

        if (!trackWithLyrics || !trackWithLyrics.plainLyrics) {
            return null;
        }

        return trackWithLyrics.plainLyrics;
    } catch (error) {
        console.error('Erreur lors de la récupération des paroles LRCLIB :', error);
        throw new Error('Erreur de connexion lors de la récupération des paroles.');
    }
};

export const getSongById = async (id: string | number): Promise<Song | null> => {
    try {
        const response = await fetch(`/api/deezer/track/${id}`);
        if (!response.ok) throw new Error('Erreur réseau Deezer');

        const track = await response.json();

        // Si Deezer renvoie une erreur (ID introuvable)
        if (track.error) return null;

        // On formate la réponse pour qu'elle corresponde à notre type Song
        return {
            id: track.id,
            title: track.title,
            artist: {
                name: track.artist.name,
                id: '',
                picture_xl: '',
            },
            album: {
                cover_small: track.album.cover_small || '',
                cover_xl:
                    track.album.cover_xl ||
                    track.album.cover_medium ||
                    track.album.cover_small ||
                    '',
            },
            duration: track.duration,
        };
    } catch (error) {
        console.error('Erreur lors de la récupération de la musique :', error);
        return null;
    }
};

export const getArtistTopTracks = async (
    artistId: string | number,
    limit: number = 10
): Promise<Song[]> => {
    try {
        const response = await fetch(`/api/deezer/artist/${artistId}/top?limit=${limit}`);
        if (!response.ok) throw new Error('Erreur réseau Deezer (Top Artist)');

        const data = await response.json();

        if (data.error || !data.data) return [];

        // On formate pour que ça corresponde à notre type Song
        return data.data.map((track: any) => ({
            id: track.id,
            title: track.title,
            artist: {
                name: track.artist.name,
                id: track.artist.id,
                picture_xl: '',
            },
            album: {
                cover_small: track.album.cover_small || '',
                cover_xl: track.album.cover_xl || track.album.cover_medium || '',
            },
            duration: track.duration,
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération du top artiste :', error);
        return [];
    }
};
