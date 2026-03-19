export interface Artist {
    id: number | string;
    name: string;
    picture_xl: string;
}

export interface Album {
    cover_small: string;
    cover_xl: string;
}

export interface Song {
    id: number | string; // Modifié : On accepte les strings pour les IDs venant des favoris (Supabase)
    title: string;
    artist: Artist;
    album: Album;
    duration: number;
}

export interface SearchResult {
    results: Song[];
    total: number;
}

export interface Word {
    original: string;
    normalized: string;
    isFound: boolean;
    isHinted?: boolean;
    isHidden?: boolean;
}

export interface ParsedLyricsResult {
    parsedLyrics: Word[][];
    totalWords: number;
}

export type GameStatus = 'idle' | 'ready' | 'playing' | 'won' | 'lost';

export interface LRCLIBTrack {
    id: number;
    trackName: string;
    artistName: string;
    plainLyrics: string | null;
}
