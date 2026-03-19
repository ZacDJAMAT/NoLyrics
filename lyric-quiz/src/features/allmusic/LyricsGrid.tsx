import { Word, GameStatus } from '@/types.ts';

interface LyricsGridProps {
    lyricsData: Word[][] | null;
    isFetchingLyrics: boolean;
    gameStatus: GameStatus;
    lastFoundWord?: string | null;
    alignment?: 'left' | 'center' | 'right';
}

export default function LyricsGrid({
    lyricsData,
    isFetchingLyrics,
    gameStatus,
    lastFoundWord,
    alignment = 'center',
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
            <div className="w-fit max-w-full space-y-4 text-lg leading-relaxed select-none md:space-y-6 md:text-xl">
                {lyricsData.map((line, lineIndex) => (
                    <div
                        key={lineIndex}
                        className={`flex flex-wrap gap-x-1.5 gap-y-1.5 md:gap-x-2 md:gap-y-2 ${justificationClass}`}
                    >
                        {line.map((word, wordIndex) => {
                            // 👉 NOUVELLE LOGIQUE : On sépare les mots de contexte des mots trouvés par le joueur
                            const isContextWord = word.isHidden === false;
                            const isUserFoundWord = word.isFound && word.isHidden !== false;

                            let styleClass = 'glass-cell';

                            if (isContextWord) {
                                // 1. Mot pré-rempli (FILLyrics) : Affichage neutre
                                styleClass = 'bg-transparent text-foreground/80 font-texte';
                            } else if (isUserFoundWord) {
                                // 2. Mot deviné par le joueur : Animation et néon
                                const isLastFound =
                                    word.normalized === lastFoundWord && gameStatus === 'playing';

                                styleClass = `bg-transparent font-texte animate-pop-word transition-colors duration-500 ${
                                    isLastFound ? 'text-neon-secondary shadow' : 'text-foreground'
                                }`;
                            } else if (gameStatus === 'lost' || gameStatus === 'won') {
                                // 3. Fin de partie pour les trous non trouvés
                                styleClass =
                                    'text-destructive bg-transparent font-texte opacity-80';
                            }

                            return (
                                <span
                                    key={wordIndex}
                                    className={`inline-block rounded px-1.5 py-0.5 md:px-2 md:py-1 ${styleClass}`}
                                >
                                    {isContextWord ? (
                                        // Affichage simple pour le contexte
                                        <span>{word.original}</span>
                                    ) : isUserFoundWord ? (
                                        // Affichage avec effet pour les mots trouvés
                                        <span
                                            className={`transition-all duration-500 ${
                                                word.normalized === lastFoundWord
                                                    ? 'text-secondary [text-shadow:0_0_15px_rgba(64,201,255,0.8)]'
                                                    : 'text-foreground'
                                            }`}
                                        >
                                            {word.original}
                                        </span>
                                    ) : gameStatus === 'lost' || gameStatus === 'won' ? (
                                        <span className="text-destructive font-semibold">
                                            {word.original}
                                        </span>
                                    ) : word.isHinted ? (
                                        <span className="text-primary/80 font-bold">
                                            {word.original.charAt(0)}
                                            <span className="ml-0.5 text-[0.6em] tracking-widest opacity-60">
                                                ...
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="opacity-30">
                                            {'_'.repeat(word.original.length)}
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
