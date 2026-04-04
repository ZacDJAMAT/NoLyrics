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
    preview?: string;
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

// On s'assure que LRCLIBTrack gère bien le texte synchronisé
export interface LRCLIBTrack {
    id: number;
    trackName: string;
    artistName: string;
    plainLyrics: string | null;
    syncedLyrics?: string | null; // 👉 NOUVEAU
}

// 👉 NOUVELLES INTERFACES POUR LE MODE SURVIE
export interface SyncedLine {
    timeMs: number; // Le timestamp de la ligne en millisecondes
    text: string; // Le texte original complet
    words: Word[]; // Les mots découpés (avec isHidden, isFound, etc.)
}

export interface SyncedLyricsResult {
    lines: SyncedLine[];
    totalHiddenWords: number;
}

