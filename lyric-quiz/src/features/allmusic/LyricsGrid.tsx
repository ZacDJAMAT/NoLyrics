import { ReactNode } from 'react';
import { Word, GameStatus } from '@/types';

interface LyricsGridProps {
    lyricsData: Word[][] | null;
    isFetchingLyrics: boolean;
    gameStatus: GameStatus;
    lastFoundWord?: string | null;
    alignment?: 'left' | 'center' | 'right';
    gameMode?: 'allmusic' | 'fillyrics';
    topContent?: ReactNode;
    activeWordCoords?: { l: number; w: number } | null;
    currentInput?: string;
    onWordClick?: (l: number, w: number) => void;
}

export default function LyricsGrid({
    lyricsData,
    isFetchingLyrics,
    gameStatus,
    lastFoundWord,
    alignment = 'center',
    topContent,
    activeWordCoords,
    currentInput = '',
    onWordClick,
}: LyricsGridProps) {
    if (isFetchingLyrics) {
        return (
            <div className="glass-panel text-muted-foreground flex min-h-[400px] flex-col items-center justify-center gap-4 py-20">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                <p className="font-texte text-lg">Création du jeu en cours...</p>
            </div>
        );
    }

    if (!lyricsData) return null;

    const justificationClass =
        alignment === 'left'
            ? 'justify-start'
            : alignment === 'right'
              ? 'justify-end'
              : 'justify-center';

    return (
        <div
            translate="no"
            className="glass-panel notranslate flex min-h-[300px] flex-col items-center p-4 md:min-h-[400px] md:p-8"
        >
            {topContent}
            <div className="w-fit max-w-full space-y-4 text-lg leading-relaxed select-none md:space-y-6 md:text-xl">
                {lyricsData.map((line, lineIndex) => (
                    <div
                        key={lineIndex}
                        className={`flex flex-wrap gap-x-1.5 gap-y-1.5 md:gap-x-2 md:gap-y-2 ${justificationClass}`}
                    >
                        {line.map((word, wordIndex) => {
                            const isContextWord = word.isHidden === false;
                            const isUserFoundWord = word.isFound && word.isHidden !== false;

                            // 👉 NOUVEAU : Est-ce que c'est le mot qu'on est en train de taper ?
                            const isActiveTarget =
                                activeWordCoords?.l === lineIndex &&
                                activeWordCoords?.w === wordIndex &&
                                gameStatus === 'playing';

                            // 1. LE MOT ACTIF (IN-LINE)
                            if (isActiveTarget) {
                                return (
                                    <span
                                        key={wordIndex}
                                        className="bg-secondary/10 text-secondary border-secondary inline-block min-w-[40px] animate-pulse rounded border-b-2 px-2 py-0.5 text-center font-bold shadow-[0_0_15px_rgba(64,201,255,0.3)] md:py-1"
                                    >
                                        {/* On affiche ce que le joueur tape, ou le motif vide par défaut */}
                                        {currentInput || '_'.repeat(word.original.length)}
                                    </span>
                                );
                            }

                            // 2. MOTS DE CONTEXTE
                            if (isContextWord) {
                                return (
                                    <span
                                        key={wordIndex}
                                        className="text-foreground/80 font-texte inline-block bg-transparent px-1.5 py-0.5 md:px-2 md:py-1"
                                    >
                                        {word.original}
                                    </span>
                                );
                            }

                            // 3. MOTS TROUVÉS PAR LE JOUEUR
                            if (isUserFoundWord) {
                                const isLastFound =
                                    word.normalized === lastFoundWord && gameStatus === 'playing';
                                return (
                                    <span
                                        key={wordIndex}
                                        className={`font-texte animate-pop-word inline-block rounded bg-transparent px-1.5 py-0.5 transition-colors duration-500 md:px-2 md:py-1 ${isLastFound ? 'text-neon-secondary shadow' : 'text-secondary [text-shadow:0_0_10px_rgba(64,201,255,0.5)]'}`}
                                    >
                                        {word.original}
                                    </span>
                                );
                            }

                            // 4. FIN DE PARTIE (Mots Ratés)
                            if (gameStatus === 'lost' || gameStatus === 'won') {
                                return (
                                    <span
                                        key={wordIndex}
                                        className="text-destructive font-texte inline-block bg-transparent px-1.5 py-0.5 font-semibold opacity-80 md:px-2 md:py-1"
                                    >
                                        {word.original}
                                    </span>
                                );
                            }

                            // 5. MOTS CACHÉS (Trous standards)
                            return (
                                <span
                                    key={wordIndex}
                                    onClick={() => onWordClick && onWordClick(lineIndex, wordIndex)}
                                    className="glass-cell inline-block cursor-pointer px-1.5 py-0.5 opacity-30 transition-opacity hover:bg-white/20 hover:opacity-80 md:px-2 md:py-1"
                                >
                                    {'_'.repeat(word.original.length)}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
