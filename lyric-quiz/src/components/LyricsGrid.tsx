import { Word, GameStatus } from '../types';

interface LyricsGridProps {
    lyricsData: Word[][] | null;
    isFetchingLyrics: boolean;
    gameStatus: GameStatus;
    lastFoundWord?: string | null;
}

export default function LyricsGrid({ lyricsData, isFetchingLyrics, gameStatus, lastFoundWord }: LyricsGridProps) {
    if (isFetchingLyrics) {
        return (
            <div className="glass-panel min-h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-4 py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-texte text-lg">Création du jeu en cours...</p>
            </div>
        );
    }

    if (!lyricsData) return null;

    return (
        <div className="glass-panel p-8 min-h-[400px]">
            <div className="space-y-6 text-center text-xl leading-relaxed select-none">
                {lyricsData.map((line, lineIndex) => (
                    <div key={lineIndex} className="flex flex-wrap justify-center gap-x-2 gap-y-2">
                        {line.map((word, wordIndex) => {

                            // 1. STYLE PAR DÉFAUT : La case en verre vide
                            let styleClass = 'glass-cell';

                            // 2. SI LE MOT EST TROUVÉ
                            if (word.isFound) {
                                const isLastFound = word.normalized === lastFoundWord;

                                // On utilise notre utilitaire text-neon-secondary pour le dernier mot !
                                styleClass = `bg-transparent font-texte animate-pop-word transition-colors duration-500 ${
                                    isLastFound ? 'text-neon-secondary' : 'text-foreground'
                                }`;
                            }
                            // 3. SI LA PARTIE EST FINIE ET LE MOT N'EST PAS TROUVÉ
                            else if (gameStatus === 'lost' || gameStatus === 'won') {
                                styleClass = 'text-destructive bg-transparent font-texte opacity-80';
                            }

                            return (
                                <span key={wordIndex} className={`inline-block px-2 py-1 rounded ${styleClass}`}>
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