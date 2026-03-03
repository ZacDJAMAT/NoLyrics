// src/types.ts

export interface Artist {
    name: string;
}

export interface Album {
    cover_small: string;
    cover_xl: string;
}

export interface Song {
    id: number;
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
}

export interface ParsedLyricsResult {
    parsedLyrics: Word[][];
    totalWords: number;
}

// NOUVEAU : On centralise le statut du jeu ici
export type GameStatus = 'idle' | 'ready' | 'playing' | 'won' | 'lost';

// NOUVEAU : On type le retour de l'API LRCLIB pour éviter le "any"
export interface LRCLIBTrack {
    id: number;
    trackName: string;
    artistName: string;
    plainLyrics: string | null;
}