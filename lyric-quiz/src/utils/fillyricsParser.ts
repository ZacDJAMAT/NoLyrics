import { Word, ParsedLyricsResult } from '@/types';
import { normalizeWord } from '@/utils/lyricsParser';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const parseFillyrics = (
    rawLyrics: string,
    targetWordCount: number = 5
): ParsedLyricsResult => {
    // 1. Nettoyage et préparation (On prend toute la chanson)
    const cleanRaw = rawLyrics.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');
    const allLines = cleanRaw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    // 2. Découpage en Mots de TOUTE la chanson
    const allParsedLines: Word[][] = allLines
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

    let totalHiddenWords = 0;
    let firstHiddenLineIndex = 0;
    let lastHiddenLineIndex = allParsedLines.length - 1;

    // 3. 🧠 ALGORITHME ANTI-COPIE SUR TOUTE LA CHANSON
    if (allParsedLines.length > 3) {
        const allWordsFlattened = allParsedLines.flatMap((line) => line.map((w) => w.normalized));

        // 👉 L'OPTIMISATION : On fusionne tout avec un séparateur unique (|) pour utiliser le moteur de recherche natif
        const fullTextString = '|' + allWordsFlattened.join('|') + '|';

        const countSequenceOccurrences = (sequence: string[]) => {
            const sequenceString = '|' + sequence.join('|') + '|';
            // split() confie la recherche au moteur C++ du navigateur : c'est 1000x plus rapide !
            return fullTextString.split(sequenceString).length - 1;
        };

        // Mots éligibles : On s'assure de pouvoir garder 2 lignes au-dessus et 1 en-dessous
        const eligibleWords: { lineIndex: number; wordIndex: number; normalized: string }[] = [];
        for (let i = 2; i < allParsedLines.length - 1; i++) {
            for (let j = 0; j < allParsedLines[i].length; j++) {
                eligibleWords.push({
                    lineIndex: i,
                    wordIndex: j,
                    normalized: allParsedLines[i][j].normalized,
                });
            }
        }

        if (eligibleWords.length >= targetWordCount) {
            const maxStartIndex = eligibleWords.length - targetWordCount;
            const validStartIndices: number[] = [];
            const fallbackStartIndices: number[] = [];

            for (let i = 0; i <= maxStartIndex; i++) {
                fallbackStartIndices.push(i);
                const sequence = eligibleWords
                    .slice(i, i + targetWordCount)
                    .map((w) => w.normalized);

                if (countSequenceOccurrences(sequence) === 1) {
                    validStartIndices.push(i);
                }
            }

            const pool = validStartIndices.length > 0 ? validStartIndices : fallbackStartIndices;
            const chosenStartIndex = pool[Math.floor(Math.random() * pool.length)];

            // On enregistre les coordonnées extrêmes pour le cadrage
            firstHiddenLineIndex = eligibleWords[chosenStartIndex].lineIndex;
            lastHiddenLineIndex = eligibleWords[chosenStartIndex + targetWordCount - 1].lineIndex;

            // On cache le bloc sélectionné
            for (let i = 0; i < targetWordCount; i++) {
                const target = eligibleWords[chosenStartIndex + i];
                allParsedLines[target.lineIndex][target.wordIndex].isHidden = true;
                allParsedLines[target.lineIndex][target.wordIndex].isFound = false;
                totalHiddenWords++;
            }
        }
    }

    // 4. SÉCURITÉ DE REMPLISSAGE (Si la chanson est très courte ou algorithme échoue)
    if (totalHiddenWords === 0 && allParsedLines.length > 0) {
        let wordsHidden = 0;
        firstHiddenLineIndex = allParsedLines.length - 1;
        lastHiddenLineIndex = 0;

        // On part de l'avant-dernière ligne pour essayer de garder 1 ligne de contexte en bas
        for (let i = allParsedLines.length - 2; i >= 0 && wordsHidden < targetWordCount; i--) {
            for (
                let j = allParsedLines[i].length - 1;
                j >= 0 && wordsHidden < targetWordCount;
                j--
            ) {
                allParsedLines[i][j].isHidden = true;
                allParsedLines[i][j].isFound = false;
                wordsHidden++;
                if (i < firstHiddenLineIndex) firstHiddenLineIndex = i;
                if (i > lastHiddenLineIndex) lastHiddenLineIndex = i;
            }
        }
        totalHiddenWords = wordsHidden;
    }

    // 5. ✂️ LE FAMEUX DÉCOUPAGE (La fenêtre de lecture)
    // On prend 2 lignes avant, et 1 ligne après (Slice exclut la fin, donc +2 pour avoir +1 ligne incluse)
    const startSlice = Math.max(0, firstHiddenLineIndex - 2);
    const endSlice = Math.min(allParsedLines.length, lastHiddenLineIndex + 2);

    const finalSnippet = allParsedLines.slice(startSlice, endSlice);

    return {
        parsedLyrics: finalSnippet,
        totalWords: totalHiddenWords,
    };
};
