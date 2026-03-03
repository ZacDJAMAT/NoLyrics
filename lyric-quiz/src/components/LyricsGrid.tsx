import { Word, GameStatus } from '../types';

interface LyricsGridProps {
    lyricsData: Word[][] | null;
    isFetchingLyrics: boolean;
    gameStatus: GameStatus;
}

export default function LyricsGrid({ lyricsData, isFetchingLyrics, gameStatus }: LyricsGridProps) {
    if (isFetchingLyrics) {
        return (
            <div className="bg-neutral-800 p-8 rounded-2xl shadow-lg border border-neutral-700 min-h-[400px] flex flex-col items-center justify-center text-neutral-400 gap-4 py-20">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p>Création du jeu en cours...</p>
            </div>
        );
    }

    if (!lyricsData) return null;

    return (
        <div className="bg-neutral-800 p-8 rounded-2xl shadow-lg border border-neutral-700 min-h-[400px]">
            <div className="space-y-6 text-center text-lg leading-relaxed select-none">
                {lyricsData.map((line, lineIndex) => (
                    <div key={lineIndex} className="flex flex-wrap justify-center gap-x-2 gap-y-2">
                        {line.map((word, wordIndex) => {
                            let styleClass = 'bg-neutral-700 text-transparent min-w-[3rem] border-b-2 border-neutral-600';
                            if (word.isFound) {
                                styleClass = 'text-white bg-transparent font-medium';
                            } else if (gameStatus === 'lost' || gameStatus === 'won') {
                                styleClass = 'text-red-400 bg-transparent font-medium opacity-80';
                            }
                            return (
                                <span key={wordIndex} className={`inline-block px-2 py-1 rounded transition-all duration-300 ${styleClass}`}>
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