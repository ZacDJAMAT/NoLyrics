import { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { useGame } from '../hooks/useGame';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveGameResult } from '../lib/history';
import GiveUpConfirmModal from './GiveUpConfirmModal';
import GameHeader from './GameHeader';
import ScoreBoard from './ScoreBoard';
import LyricsGrid from './LyricsGrid';
import SaveScoreModal from './SaveScoreModal';

export default function GameScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isGuest, loginWithGoogle } = useAuth();

    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [hasGivenUp, setHasGivenUp] = useState<boolean>(false);
    const [showGiveUpModal, setShowGiveUpModal] = useState<boolean>(false);
    const [pendingAction, setPendingAction] = useState<'back' | 'giveup' | null>(null);

    const song = location.state?.song as Song | undefined;

    if (!song) {
        return <Navigate to="/" replace />;
    }

    const handleInitFailure = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const {
        lyricsData, totalWords, isFetchingLyrics, currentInput, foundWordsCount,
        timeLeft, gameStatus, scorePercentage, formattedTime, handleInputChange, setGameStatus,
        startGame, lastFoundWord
    } = useGame(song, handleInitFailure);

    const handleUserBack = () => {
        if (gameStatus === 'playing') {
            setPendingAction('back');
            setShowGiveUpModal(true);
        } else {
            navigate('/');
        }
    };

    const handleGiveUpClick = () => {
        setPendingAction('giveup');
        setShowGiveUpModal(true);
    };

    const confirmGiveUp = () => {
        if (pendingAction === 'back') {
            saveGameResult(user, isGuest, song, scorePercentage, 'lost', timeLeft);
            navigate('/');
        } else if (pendingAction === 'giveup') {
            setHasGivenUp(true);
            setGameStatus('lost');
        }
        setShowGiveUpModal(false);
        setPendingAction(null);
    };

    const cancelGiveUp = () => {
        setShowGiveUpModal(false);
        setPendingAction(null);
    };

    useEffect(() => {
        const isGameFinished = gameStatus === 'won' || (gameStatus === 'lost' && !hasGivenUp);
        if (!user && isGameFinished) {
            const timer = setTimeout(() => setShowSaveModal(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [gameStatus, user, hasGivenUp]);

    return (
        // Conteneur principal en "relative" et sans couleur de fond (c'est le body qui gère)
        <div className="min-h-screen font-sans selection:bg-primary selection:text-primary-foreground flex flex-col relative overflow-hidden">

            {showSaveModal && (
                <SaveScoreModal onAccept={loginWithGoogle} onDecline={() => setShowSaveModal(false)} />
            )}

            {showGiveUpModal && (
                <GiveUpConfirmModal onConfirm={confirmGiveUp} onCancel={cancelGiveUp} />
            )}

            <GameHeader
                song={song}
                onBack={handleUserBack}
                gameStatus={gameStatus}
                isFetchingLyrics={isFetchingLyrics}
                onGiveUp={handleGiveUpClick}
            />

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col gap-8 relative z-10">

                {/* Message de Victoire (Néon Cyan) */}
                {gameStatus === 'won' && (
                    <div className="bg-secondary/10 border border-secondary text-secondary p-4 rounded-xl text-center font-titre text-xl animate-pulse shadow-[0_0_15px_rgba(64,201,255,0.2)] tracking-wide">
                        🎉 Félicitations ! Tu as trouvé toutes les paroles !
                    </div>
                )}

                {/* Message de Défaite (Néon Rouge) */}
                {gameStatus === 'lost' && (
                    <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-xl text-center font-titre text-xl shadow-[0_0_15px_rgba(255,77,79,0.2)] tracking-wide">
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
                    onStartGame={startGame}
                    lastFoundWord={lastFoundWord}
                />

                <div className="relative">
                    <LyricsGrid
                        lyricsData={lyricsData}
                        isFetchingLyrics={isFetchingLyrics}
                        gameStatus={gameStatus}
                        lastFoundWord={lastFoundWord}
                    />

                    {/* OVERLAY DE DÉMARRAGE (Flou sombre + Bouton Rose Fluo) */}
                    {gameStatus === 'ready' && (
                        <div
                            onClick={startGame}
                            className="absolute inset-0 z-10 bg-background/60 backdrop-blur-md rounded-2xl cursor-pointer group transition-all"
                        >
                            <div className="sticky top-[70vh] w-full flex justify-center -translate-y-1/2">
                                <button className="bg-primary text-primary-foreground font-titre text-3xl px-12 py-6 rounded-2xl shadow-[0_0_30px_rgba(232,28,255,0.4)] group-hover:bg-primary/80 group-hover:scale-105 transition-all">
                                    Cliquez pour commencer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}