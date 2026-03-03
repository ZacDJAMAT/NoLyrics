import { Song } from '../types';
import { useGame } from '../hooks/useGame';
import GameHeader from './GameHeader';
import ScoreBoard from './ScoreBoard';
import LyricsGrid from './LyricsGrid';

interface GameScreenProps {
    song: Song;
    onBack: () => void;
}

export default function GameScreen({ song, onBack }: GameScreenProps) {
    // 🧠 1. On charge notre "cerveau" (toute la logique complexe)
    const {
        lyricsData,
        totalWords,
        isFetchingLyrics,
        currentInput,
        foundWordsCount,
        timeLeft,
        gameStatus,
        scorePercentage,
        formattedTime,
        handleInputChange,
        setGameStatus
    } = useGame(song, onBack);

    // 🎨 2. On assemble l'interface avec nos "muscles" (les petits composants visuels)
    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-pink-500 selection:text-white flex flex-col">

            {/* L'en-tête du jeu */}
            <GameHeader
                song={song}
                onBack={onBack}
                gameStatus={gameStatus}
                isFetchingLyrics={isFetchingLyrics}
                onGiveUp={() => setGameStatus('lost')}
            />

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col gap-8">

                {/* Les bannières de Victoire ou de Défaite */}
                {gameStatus === 'won' && (
                    <div className="bg-green-600/20 border border-green-500 text-green-400 p-4 rounded-xl text-center font-bold text-lg animate-pulse">
                        🎉 Félicitations ! Tu as trouvé toutes les paroles !
                    </div>
                )}
                {gameStatus === 'lost' && (
                    <div className="bg-red-600/20 border border-red-500 text-red-400 p-4 rounded-xl text-center font-bold text-lg">
                        Temps écoulé (ou partie abandonnée). Regarde les mots en rouge !
                    </div>
                )}

                {/* Le tableau des scores et l'input */}
                <ScoreBoard
                    scorePercentage={scorePercentage}
                    foundWordsCount={foundWordsCount}
                    totalWords={totalWords}
                    currentInput={currentInput}
                    handleInputChange={handleInputChange}
                    gameStatus={gameStatus}
                    isFetchingLyrics={isFetchingLyrics}
                    timeLeft={timeLeft}
                    formattedTime={formattedTime}
                />

                {/* La grille des paroles */}
                <LyricsGrid
                    lyricsData={lyricsData}
                    isFetchingLyrics={isFetchingLyrics}
                    gameStatus={gameStatus}
                />

            </main>
        </div>
    );
}