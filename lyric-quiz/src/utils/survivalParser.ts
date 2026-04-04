import { Word, SyncedLine, SyncedLyricsResult } from '@/types';
import { normalizeWord } from '@/utils/lyricsParser';

// Regex pour capturer les tags [mm:ss.xx]
const TIME_TAG_REGEX = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

export const parseSurvivalLyrics = (
    syncedLyrics: string,
    targetWordCount: number = 10
): SyncedLyricsResult => {
    const rawLines = syncedLyrics.split('\n');
    const parsedLines: SyncedLine[] = [];
    let totalHiddenWords = 0;

    // 1. Extraction des timestamps et des mots
    for (const line of rawLines) {
        const match = TIME_TAG_REGEX.exec(line);
        if (!match) continue; // On ignore les lignes sans timestamp

        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3].padEnd(3, '0'), 10); // Standardisation à 3 chiffres

        const timeMs = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
        const text = line.replace(TIME_TAG_REGEX, '').trim();

        if (text.length === 0) continue; // On ignore les sauts de ligne instrumentaux

        // On découpe en mots comme dans ton fillyricsParser.ts
        const words: Word[] = text
            .replace(/(['’])/g, '$1 ')
            .split(/\s+/)
            .filter((w) => w.length > 0)
            .map((word) => ({
                original: word,
                normalized: normalizeWord(word),
                isFound: true,
                isHidden: false,
            }));

        parsedLines.push({ timeMs, text, words });
    }

    // 2. Logique de cache-cache (Simplifiée pour la Survie)
    // On cache des mots aléatoirement, en évitant les intros et les mots trop courts
    const eligibleWords: { lineIdx: number; wordIdx: number }[] = [];

    parsedLines.forEach((line, lineIdx) => {
        // On évite de cacher des mots dans la toute première ligne (pour laisser le joueur atterrir)
        if (lineIdx === 0) return;

        line.words.forEach((word, wordIdx) => {
            if (word.normalized.length > 3) {
                // Uniquement les mots de plus de 3 lettres
                eligibleWords.push({ lineIdx, wordIdx });
            }
        });
    });

    // On mélange et on prend le nombre ciblé
    const shuffled = eligibleWords.sort(() => 0.5 - Math.random());
    const selectedToHide = shuffled.slice(0, targetWordCount);

    selectedToHide.forEach(({ lineIdx, wordIdx }) => {
        parsedLines[lineIdx].words[wordIdx].isHidden = true;
        parsedLines[lineIdx].words[wordIdx].isFound = false;
        totalHiddenWords++;
    });

    return { lines: parsedLines, totalHiddenWords };
};
