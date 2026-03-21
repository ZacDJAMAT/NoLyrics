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

    // 2. Extraction d'un grand extrait (jusqu'à 10 lignes pour avoir de l'espace)
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
                    isFound: true,
                    isHidden: false,
                }))
                .filter((w) => w.normalized.length > 0);
        })
        .filter((line) => line.length > 0);

    // 4. 🧠 ALGORITHME ANTI-COPIE (Évite les suites exactes répétées)
    let totalHiddenWords = 0;

    if (parsedLines.length > 2) {
        // A. On aplatit les mots pour chercher les répétitions facilement
        const allWordsFlattened = parsedLines.flatMap((line) => line.map((w) => w.normalized));

        // Fonction utilitaire : Compte combien de fois un bloc EXACT de mots apparaît
        const countSequenceOccurrences = (sequence: string[]) => {
            let count = 0;
            for (let i = 0; i <= allWordsFlattened.length - sequence.length; i++) {
                let match = true;
                for (let j = 0; j < sequence.length; j++) {
                    if (allWordsFlattened[i + j] !== sequence[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) count++;
            }
            return count;
        };

        // B. On liste les mots qu'on a le droit de cacher (Lignes 2 et +, pour le contexte)
        const eligibleWords: { lineIndex: number; wordIndex: number; normalized: string }[] = [];
        for (let i = 2; i < parsedLines.length; i++) {
            for (let j = 0; j < parsedLines[i].length; j++) {
                eligibleWords.push({
                    lineIndex: i,
                    wordIndex: j,
                    normalized: parsedLines[i][j].normalized,
                });
            }
        }

        // C. On filtre pour trouver un point de départ qui ne se répète pas
        if (eligibleWords.length >= targetWordCount) {
            const maxStartIndex = eligibleWords.length - targetWordCount;
            const validStartIndices: number[] = [];
            const allStartIndices: number[] = [];

            for (let i = 0; i <= maxStartIndex; i++) {
                allStartIndices.push(i);

                // On extrait le bloc de N mots
                const sequence = eligibleWords
                    .slice(i, i + targetWordCount)
                    .map((w) => w.normalized);

                // S'il n'apparaît qu'une seule fois (c'est-à-dire lui-même), c'est un bon candidat !
                if (countSequenceOccurrences(sequence) === 1) {
                    validStartIndices.push(i);
                }
            }

            // D. On prend un index valide au hasard (ou n'importe lequel si la chanson boucle complètement)
            const pool = validStartIndices.length > 0 ? validStartIndices : allStartIndices;
            const chosenStartIndex = pool[Math.floor(Math.random() * pool.length)];

            // E. On cache le bloc sélectionné
            for (let i = 0; i < targetWordCount; i++) {
                const target = eligibleWords[chosenStartIndex + i];
                parsedLines[target.lineIndex][target.wordIndex].isHidden = true;
                parsedLines[target.lineIndex][target.wordIndex].isFound = false;
                totalHiddenWords++;
            }
        }
    }

    // 5. SÉCURITÉ DE REMPLISSAGE
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
