import { Word, GameStatus } from '../types';

interface LyricsGridProps {
    lyricsData: Word[][] | null;
    isFetchingLyrics: boolean;
    gameStatus: GameStatus;
    lastFoundWord?: string | null; // <-- NOUVEAU
}

export default function LyricsGrid({ lyricsData, isFetchingLyrics, gameStatus, lastFoundWord }: LyricsGridProps) {
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
                                // On vérifie si c'est le dernier mot tapé par le joueur
                                const isLastFound = word.normalized === lastFoundWord;

                                // S'il vient d'être trouvé, il reste vert fluo et ombré. Sinon, il devient blanc.
                                styleClass = `bg-transparent font-medium animate-pop-word transition-colors duration-500 ${
                                    isLastFound
                                        ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                                        : 'text-white'
                                }`;

                            } else if (gameStatus === 'lost' || gameStatus === 'won') {
                                styleClass = 'text-red-400 bg-transparent font-medium opacity-80';
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