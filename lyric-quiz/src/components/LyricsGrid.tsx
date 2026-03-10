import {Word, GameStatus} from '../types';

interface LyricsGridProps {
    lyricsData: Word[][] | null;
    isFetchingLyrics: boolean;
    gameStatus: GameStatus;
    lastFoundWord?: string | null;
    // NOUVELLE PROP : L'alignement choisi par le joueur
    alignment?: 'left' | 'center' | 'right';
}

export default function LyricsGrid({
                                       lyricsData,
                                       isFetchingLyrics,
                                       gameStatus,
                                       lastFoundWord,
                                       alignment = 'center'
                                   }: LyricsGridProps) {
    if (isFetchingLyrics) {
        return (
            <div
                className="glass-panel min-h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-4 py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-texte text-lg">Création du jeu en cours...</p>
            </div>
        );
    }

    if (!lyricsData) return null;

    // On convertit le choix en classe Tailwind pour flexbox
    const justificationClass = alignment === 'left' ? 'justify-start' : alignment === 'right' ? 'justify-end' : 'justify-center';

    return (
        <div translate="no"
             className="glass-panel p-4 md:p-8 min-h-[300px] md:min-h-[400px] flex flex-col items-center notranslate">

            {/* Police un peu plus petite et espacement réduit sur mobile */}
            <div className="w-fit max-w-full space-y-4 md:space-y-6 text-lg md:text-xl leading-relaxed select-none">
                {lyricsData.map((line, lineIndex) => (

                    <div key={lineIndex}
                         className={`flex flex-wrap gap-x-1.5 gap-y-1.5 md:gap-x-2 md:gap-y-2 ${justificationClass}`}>
                        {line.map((word, wordIndex) => {

                            let styleClass = 'glass-cell';

                            if (word.isFound) {
                                const isLastFound = word.normalized === lastFoundWord && gameStatus === 'playing';

                                styleClass = `bg-transparent font-texte animate-pop-word transition-colors duration-500 ${
                                    isLastFound ? 'text-neon-secondary shadow' : 'text-foreground'
                                }`;
                            } else if (gameStatus === 'lost' || gameStatus === 'won') {
                                styleClass = 'text-destructive bg-transparent font-texte opacity-80';
                            }

                            return (
                                // Padding ajusté sur mobile
                                <span key={wordIndex}
                                      className={`inline-block px-1.5 py-0.5 md:px-2 md:py-1 rounded ${styleClass}`}>
                                    {/* Affichage du mot */}
                                    {word.isFound ? (
                                        // L'épaisseur de police reste standard. Seule la couleur et l'ombre changent pour le dernier mot.
                                        <span className={`transition-all duration-500 ${
                                            word.normalized === lastFoundWord
                                                ? 'text-secondary [text-shadow:0_0_15px_rgba(64,201,255,0.8)]'
                                                : 'text-foreground'
                                        }`}>
                                            {word.original}
                                        </span>
                                    ) : (gameStatus === 'lost' || gameStatus === 'won') ? (
                                        // Fin de partie : on révèle les mots ratés en rouge
                                        <span className="text-destructive font-semibold">{word.original}</span>
                                    ) : word.isHinted ? (
                                        // L'indice est activé, on affiche la première lettre
                                        <span className="text-primary/80 font-bold">
                                            {word.original.charAt(0)}
                                            <span className="text-[0.6em] tracking-widest opacity-60 ml-0.5">...</span>
                                        </span>
                                    ) : (
                                        // En cours de jeu normal : des tirets
                                        <span className="opacity-30">{"_".repeat(word.original.length)}</span>
                                    )}
                                </span>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}