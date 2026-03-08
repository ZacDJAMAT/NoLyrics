import { Word, GameStatus } from '../types';

interface LyricsGridProps {
    lyricsData: Word[][] | null;
    isFetchingLyrics: boolean;
    gameStatus: GameStatus;
    lastFoundWord?: string | null;
    // NOUVELLE PROP : L'alignement choisi par le joueur
    alignment?: 'left' | 'center' | 'right';
}

export default function LyricsGrid({ lyricsData, isFetchingLyrics, gameStatus, lastFoundWord, alignment = 'center' }: LyricsGridProps) {
    if (isFetchingLyrics) {
        return (
            <div className="glass-panel min-h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-4 py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-texte text-lg">Création du jeu en cours...</p>
            </div>
        );
    }

    if (!lyricsData) return null;

    // On convertit le choix en classe Tailwind pour flexbox
    const justificationClass = alignment === 'left' ? 'justify-start' : alignment === 'right' ? 'justify-end' : 'justify-center';

    return (
        // flex flex-col items-center : Maintient le bloc de texte entier au centre de la carte
        // P-4 au lieu de P-8 sur mobile
        <div className="glass-panel p-4 md:p-8 min-h-[300px] md:min-h-[400px] flex flex-col items-center">

            {/* Police un peu plus petite et espacement réduit sur mobile */}
            <div className="w-fit max-w-full space-y-4 md:space-y-6 text-lg md:text-xl leading-relaxed select-none">
                {lyricsData.map((line, lineIndex) => (

                    <div key={lineIndex} className={`flex flex-wrap gap-x-1.5 gap-y-1.5 md:gap-x-2 md:gap-y-2 ${justificationClass}`}>
                        {line.map((word, wordIndex) => {

                            let styleClass = 'glass-cell';

                            if (word.isFound) {
                                const isLastFound = word.normalized === lastFoundWord && gameStatus === 'playing';

                                styleClass = `bg-transparent font-texte animate-pop-word transition-colors duration-500 ${
                                    isLastFound ? 'text-neon-secondary shadow' : 'text-foreground'
                                }`;
                            }
                            else if (gameStatus === 'lost' || gameStatus === 'won') {
                                styleClass = 'text-destructive bg-transparent font-texte opacity-80';
                            }

                            return (
                                // Padding ajusté sur mobile
                                <span key={wordIndex} className={`inline-block px-1.5 py-0.5 md:px-2 md:py-1 rounded ${styleClass}`}>
                                    {word.original}
                                </span>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}