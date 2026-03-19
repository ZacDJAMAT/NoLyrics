import { Word, ParsedLyricsResult } from '@/types';
import { normalizeWord } from '@/utils/lyricsParser';

export const parseFillyrics = (rawLyrics: string): ParsedLyricsResult => {
    // 1. Nettoyage et préparation
    const cleanRaw = rawLyrics.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');
    const allLines = cleanRaw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    // 2. Extraction d'un extrait de 4 à 6 lignes
    const snippetLength = Math.min(allLines.length, Math.floor(Math.random() * 3) + 4);
    const startIndex = Math.max(0, Math.floor(Math.random() * (allLines.length - snippetLength)));
    const snippetLines = allLines.slice(startIndex, startIndex + snippetLength);

    let totalHiddenWords = 0;

    // 3. Découpage en Mots
    const parsedLines: Word[][] = snippetLines
        .map((line) => {
            const spacedLine = line.replace(/(['’])/g, '$1 ');
            const rawWords = spacedLine.split(/\s+/);

            return rawWords
                .map((word) => {
                    const normalized = normalizeWord(word);
                    return {
                        original: word,
                        normalized: normalized,
                        isFound: false,
                        isHidden: false, // Par défaut, rien n'est caché
                    };
                })
                .filter((w) => w.normalized.length > 0);
        })
        .filter((line) => line.length > 0);

    // 4. 🧠 ALGORITHME DU TROU À REBOURS (Minimum 5 mots)
    if (parsedLines.length > 0) {
        const lastIdx = parsedLines.length - 1;
        // 50% de chance d'avoir la toute dernière phrase visible après le trou
        const leaveOneLineAfter = lastIdx > 0 && Math.random() > 0.5;
        const targetLineIdx = leaveOneLineAfter ? lastIdx - 1 : lastIdx;

        // On va remonter les mots à l'envers depuis la fin de targetLineIdx
        // On veut cacher TOUTE la ligne ciblée OU au moins les 5 derniers mots si la ligne est très longue
        let wordsToHide = Math.max(5, parsedLines[targetLineIdx].length);

        let currentLine = targetLineIdx;
        let currentWord = parsedLines[currentLine].length - 1;

        while (totalHiddenWords < wordsToHide && currentLine >= 0) {
            if (currentWord >= 0) {
                parsedLines[currentLine][currentWord].isHidden = true;
                totalHiddenWords++;
                currentWord--;
            } else {
                // On passe à la ligne du dessus si on n'a pas encore atteint les 5 mots
                currentLine--;
                if (currentLine >= 0) {
                    currentWord = parsedLines[currentLine].length - 1;
                }
            }
        }
    }

    // 5. PRÉ-REMPLISSAGE NEUTRE
    parsedLines.forEach((line) => {
        line.forEach((w) => {
            // Dans cette nouvelle version, on ne triche plus en mettant isFound = true
            // On laisse isFound = false, mais on utilisera isHidden = false dans la grille
            // pour l'afficher comme du texte normal.
            if (!w.isHidden) {
                // On s'assure juste que les mots visibles ne bloquent pas la victoire
                w.isFound = true;
            }
        });
    });

    return {
        parsedLyrics: parsedLines,
        totalWords: totalHiddenWords, // On ne score que sur les trous !
    };
};
