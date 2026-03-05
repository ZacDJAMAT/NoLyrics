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
            // Chargement en Glassmorphism
            <div className="bg-card/30 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border backdrop-blur-xl min-h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-4 py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-texte text-lg">Création du jeu en cours...</p>
            </div>
        );
    }

    if (!lyricsData) return null;

    return (
        // Grille en Glassmorphism (bg-card/30, backdrop-blur-xl)
        <div className="bg-card/30 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border backdrop-blur-xl min-h-[400px]">
            <div className="space-y-6 text-center text-xl leading-relaxed select-none">
                {lyricsData.map((line, lineIndex) => (
                    <div key={lineIndex} className="flex flex-wrap justify-center gap-x-2 gap-y-2">
                        {line.map((word, wordIndex) => {

                            // NOUVEL EFFET INCORPORÉ : Un trou noir transparent creusé dans le verre
                            let styleClass = 'bg-white/10 text-transparent min-w-[3rem] rounded-md border border-white/10 border-b-white/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]';
                            if (word.isFound) {
                                const isLastFound = word.normalized === lastFoundWord;

                                styleClass = `bg-transparent font-texte animate-pop-word transition-colors duration-500 ${
                                    isLastFound
                                        ? 'text-secondary drop-shadow-[0_0_10px_rgba(64,201,255,0.6)]'
                                        : 'text-foreground'
                                }`;

                            } else if (gameStatus === 'lost' || gameStatus === 'won') {
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