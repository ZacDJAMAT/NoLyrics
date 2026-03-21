import { Word, ParsedLyricsResult } from '@/types';
import { normalizeWord } from '@/utils/lyricsParser';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const parseFillyrics = (
    rawLyrics: string,
    targetWordCount: number = 5
): ParsedLyricsResult => {
    // 1. Nettoyage et préparation
    const cleanRaw = rawLyrics.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');
    const allLines = cleanRaw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    // 2. Extraction d'un grand extrait (On prend jusqu'à 10 lignes pour être sûr d'avoir la place)
    const snippetLength = Math.min(allLines.length, 10);
    const startIndex = Math.max(0, Math.floor(Math.random() * (allLines.length - snippetLength)));
    const snippetLines = allLines.slice(startIndex, startIndex + snippetLength);

    // 3. Découpage en Mots
    const parsedLines: Word[][] = snippetLines
        .map((line) => {
            const spacedLine = line.replace(/(['’])/g, '$1 ');
            const rawWords = spacedLine.split(/\s+/);
            return rawWords
                .map((word) => ({
                    original: word,
                    normalized: normalizeWord(word),
                    isFound: true, // Par défaut, tout est trouvé/visible
                    isHidden: false,
                }))
                .filter((w) => w.normalized.length > 0);
        })
        .filter((line) => line.length > 0);

    // 4. 🧠 ALGORITHME DU CONTRAT STRICT (Cacher exactement targetWordCount mots consécutifs)
    let totalHiddenWords = 0;

    if (parsedLines.length > 2) {
        // A. On isole les mots éligibles (Lignes 2 et +, pour garder les 2 lignes de contexte)
        const eligibleWords: { lineIndex: number; wordIndex: number }[] = [];
        for (let i = 2; i < parsedLines.length; i++) {
            for (let j = 0; j < parsedLines[i].length; j++) {
                eligibleWords.push({ lineIndex: i, wordIndex: j });
            }
        }

        // B. Si on a assez de mots éligibles pour remplir le contrat
        if (eligibleWords.length >= targetWordCount) {
            // On choisit un point de départ aléatoire qui laisse assez de place pour la suite de mots
            const maxStartIndex = eligibleWords.length - targetWordCount;
            const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));

            // On cache EXACTEMENT le nombre de mots demandé
            for (let i = 0; i < targetWordCount; i++) {
                const target = eligibleWords[startIndex + i];
                parsedLines[target.lineIndex][target.wordIndex].isHidden = true;
                parsedLines[target.lineIndex][target.wordIndex].isFound = false;
                totalHiddenWords++;
            }
        }
    }

    // 5. SÉCURITÉ : Si la chanson est trop courte ou mal formatée, on cache au moins la fin
    if (totalHiddenWords === 0 && parsedLines.length > 0) {
        let wordsHidden = 0;
        for (let i = parsedLines.length - 1; i >= 0 && wordsHidden < targetWordCount; i--) {
            for (let j = parsedLines[i].length - 1; j >= 0 && wordsHidden < targetWordCount; j--) {
                parsedLines[i][j].isHidden = true;
                parsedLines[i][j].isFound = false;
                wordsHidden++;
            }
        }
        totalHiddenWords = wordsHidden;
    }

    return {
        parsedLyrics: parsedLines,
        totalWords: totalHiddenWords,
    };
};
