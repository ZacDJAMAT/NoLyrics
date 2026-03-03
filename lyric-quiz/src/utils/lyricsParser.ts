// src/utils/lyricsParser.ts
import { Word, ParsedLyricsResult } from '../types';

export const normalizeWord = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/œ/g, "oe")
        .replace(/æ/g, "ae")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
};

export const parseLyrics = (rawLyrics: string): ParsedLyricsResult => {
    const cleanRaw = rawLyrics.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');

    let wordCount = 0;

    const parsedLines: Word[][] = cleanRaw.split('\n').map(line => {
        const spacedLine = line.replace(/(['’])/g, "$1 ");
        const rawWords = spacedLine.split(/\s+/);

        const processedWords: Word[] = rawWords.map(word => {
            const normalized = normalizeWord(word);

            if (normalized.length > 0) wordCount++;

            return {
                original: word,
                normalized: normalized,
                isFound: false
            };

        }).filter(w => w.normalized.length > 0);

        return processedWords;
    }).filter(line => line.length > 0);

    return {
        parsedLyrics: parsedLines,
        totalWords: wordCount
    };
};