import { useState, useEffect, useCallback } from 'react'; // <-- NOUVEAUX IMPORTS REACT
import { Song } from '../types';
import { useGame } from '../hooks/useGame';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // <-- NOUVEL IMPORT
import GameHeader from './GameHeader';
import ScoreBoard from './ScoreBoard';
import LyricsGrid from './LyricsGrid';
import SaveScoreModal from './SaveScoreModal'; // <-- NOUVEL IMPORT

export default function GameScreen() {
    const location = useLocation();
    const navigate = useNavigate();

    // On récupère les infos de l'utilisateur pour savoir s'il faut lui proposer de sauvegarder
    const { user, loginWithGoogle } = useAuth();

    // NOUVEAUX ÉTATS POUR LA MODALE
    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [hasGivenUp, setHasGivenUp] = useState<boolean>(false);

    const song = location.state?.song as Song | undefined;

    if (!song) {
        return <Navigate to="/" replace />;
    }

    const handleBack = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const {
        lyricsData, totalWords, isFetchingLyrics, currentInput, foundWordsCount,
        timeLeft, gameStatus, scorePercentage, formattedTime, handleInputChange, setGameStatus,
        startGame
    } = useGame(song, handleBack);

    // Fonction personnalisée pour l'abandon (pour le différencier d'une fin de temps)
    const handleGiveUp = () => {
        setHasGivenUp(true);
        setGameStatus('lost');
    };

    // EFFET : Détecte la fin de partie et affiche la modale après un léger délai
    useEffect(() => {
        // Condition : Pas connecté + Partie terminée + N'a pas abandonné
        const isGameFinished = gameStatus === 'won' || (gameStatus === 'lost' && !hasGivenUp);

        if (!user && isGameFinished) {
            // On attend 1.5 seconde pour le laisser voir son score final avant de lui sauter dessus
            const timer = setTimeout(() => {
                setShowSaveModal(true);
            }, 1500);

            return () => clearTimeout(timer); // Nettoyage si on quitte la page avant la fin du délai
        }
    }, [gameStatus, user, hasGivenUp]);

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-pink-500 selection:text-white flex flex-col relative">

            {/* Affichage conditionnel de la modale */}
            {showSaveModal && (
                <SaveScoreModal
                    onAccept={loginWithGoogle}
                    onDecline={() => setShowSaveModal(false)}
                />
            )}

            <GameHeader
                song={song}
                onBack={handleBack}
                gameStatus={gameStatus}
                isFetchingLyrics={isFetchingLyrics}
                onGiveUp={handleGiveUp} // <-- On utilise notre nouvelle fonction ici
            />

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col gap-8">
                {gameStatus === 'won' && (
                    <div className="bg-green-600/20 border border-green-500 text-green-400 p-4 rounded-xl text-center font-bold text-lg animate-pulse">
                        🎉 Félicitations ! Tu as trouvé toutes les paroles !
                    </div>
                )}
                {gameStatus === 'lost' && (
                    <div className="bg-red-600/20 border border-red-500 text-red-400 p-4 rounded-xl text-center font-bold text-lg">
                        {hasGivenUp
                            ? "Partie abandonnée. Regarde les mots en rouge !"
                            : "Temps écoulé ! Regarde les mots en rouge !"}
                    </div>
                )}

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
                    onStartGame={startGame} // <-- NOUVEAU
                />

                <div className="relative">
                    <LyricsGrid
                        lyricsData={lyricsData}
                        isFetchingLyrics={isFetchingLyrics}
                        gameStatus={gameStatus}
                    />

                    {gameStatus === 'ready' && (
                        <div
                            onClick={startGame}
                            // 1. On enlève le flex et items-center d'ici
                            className="absolute inset-0 z-10 bg-neutral-900/40 backdrop-blur-md rounded-2xl cursor-pointer group transition-all"
                        >
                            {/* 2. On crée un conteneur "sticky" qui va suivre le scroll de l'utilisateur.
                                top-[50vh] le place au milieu de l'écran, et -translate-y-1/2 le centre parfaitement */}
                            <div className="sticky top-[50vh] w-full flex justify-center -translate-y-1/2">
                                <button className="bg-pink-600 text-white font-black text-3xl px-12 py-6 rounded-2xl shadow-2xl group-hover:bg-pink-500 group-hover:scale-105 transition-all animate-bounce">
                                    Clique ici !
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}