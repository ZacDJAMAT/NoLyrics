import { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { useGame } from '../hooks/useGame';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveGameResult } from '../lib/history';
import { Alert, AlertDescription } from "./ui/alert";
import { Trophy, AlertTriangle } from "lucide-react";
import HundredPercentModal from './HundredPercentModal';
import GiveUpConfirmModal from './GiveUpConfirmModal';
import RestartConfirmModal from './RestartConfirmModal';
import GameHeader from './GameHeader';
import ScoreBoard from './ScoreBoard';
import LyricsGrid from './LyricsGrid';
import SaveScoreModal from './SaveScoreModal';
import ProfileScreen from './ProfileScreen';

export default function GameScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isGuest, loginWithGoogle } = useAuth();

    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [hasGivenUp, setHasGivenUp] = useState<boolean>(false);
    const [showGiveUpModal, setShowGiveUpModal] = useState<boolean>(false);
    const [showRestartModal, setShowRestartModal] = useState<boolean>(false);
    const [pendingAction, setPendingAction] = useState<'back' | 'giveup' | null>(null);

    const [showProfile, setShowProfile] = useState<boolean>(false);
    const [showHundredPercentModal, setShowHundredPercentModal] = useState<boolean>(false);
    const [hasPromptedHundred, setHasPromptedHundred] = useState<boolean>(false);

    // NOUVEAU : C'est le seul état qu'on garde pour les paramètres !
    const [lyricsAlignment, setLyricsAlignment] = useState<'left' | 'center' | 'right'>('center');

    const song = location.state?.song as Song | undefined;

    if (!song) {
        return <Navigate to="/" replace />;
    }

    const handleError = useCallback((message: string) => {
        alert(message); // Ici, plus tard, on pourra remplacer par un beau Toast ou une Modale !
        navigate('/');
    }, [navigate]);

    const {
        lyricsData, totalWords, isFetchingLyrics, currentInput, foundWordsCount,
        timeLeft, gameStatus, scorePercentage, formattedTime, handleInputChange, setGameStatus,
        lastFoundWord, restartGame
    } = useGame(song, handleError);

    // NOUVEAU : On écoute le score. S'il touche 100% et qu'il reste des mots, on affiche la modale UNE seule fois.
    useEffect(() => {
        if (scorePercentage >= 100 && foundWordsCount < totalWords && !hasPromptedHundred && gameStatus === 'playing') {
            setShowHundredPercentModal(true);
            setHasPromptedHundred(true);
        }
    }, [scorePercentage, foundWordsCount, totalWords, hasPromptedHundred, gameStatus]);

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
        const finalStatus = scorePercentage >= 100 ? 'won' : 'lost';

        if (pendingAction === 'back') {
            saveGameResult(user, isGuest, song, scorePercentage, finalStatus, timeLeft);
            navigate('/');
        } else if (pendingAction === 'giveup') {
            setHasGivenUp(true);
            setGameStatus(finalStatus);
        }
        setShowGiveUpModal(false);
        setPendingAction(null);
    };

    const handleRestartClick = () => {
        if (gameStatus === 'playing') {
            setShowRestartModal(true);
        } else {
            confirmRestart();
        }
    };

    const confirmRestart = () => {
        if (gameStatus === 'playing') {
            const finalStatus = scorePercentage >= 100 ? 'won' : 'lost';
            saveGameResult(user, isGuest, song, scorePercentage, finalStatus, timeLeft);
        }
        setShowRestartModal(false);
        setHasGivenUp(false);
        setHasPromptedHundred(false); // NOUVEAU : On réinitialise la modale pour la prochaine partie
        if (restartGame) {
            restartGame();
        } else {
            setGameStatus('ready');
        }
    };

    useEffect(() => {
        if (user && showSaveModal) {
            setShowSaveModal(false);
        }
    }, [user, showSaveModal]);

    return (
        <div className="min-h-screen font-sans selection:bg-primary selection:text-primary-foreground flex flex-col relative overflow-clip">

            {showProfile && <ProfileScreen onClose={() => setShowProfile(false)} />}
            {showSaveModal && <SaveScoreModal onAccept={loginWithGoogle} onDecline={() => setShowSaveModal(false)} />}
            {showGiveUpModal && <GiveUpConfirmModal onConfirm={confirmGiveUp} onCancel={() => setShowGiveUpModal(false)} />}
            {showRestartModal && <RestartConfirmModal onConfirm={confirmRestart} onCancel={() => setShowRestartModal(false)} />}
            {showHundredPercentModal && (
                <HundredPercentModal
                    onFinish={() => {
                        setShowHundredPercentModal(false);
                        setGameStatus('won');
                    }}
                    onContinue={() => setShowHundredPercentModal(false)}
                />
            )}
            <GameHeader song={song} onBack={handleUserBack} onProfileClick={() => setShowProfile(true)} />

            {/* On passe en pb-28 sur mobile pour laisser l'espace à la barre d'input fixe, et on revient en pb-6 sur PC */}
            <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col gap-4 md:gap-8 relative z-10 pt-4 md:pt-6">

                {gameStatus === 'won' && (
                    <Alert variant="success" className="text-center flex items-center justify-center gap-2">
                        <Trophy className="h-5 w-5" />
                        <AlertDescription className="text-xl">
                            {foundWordsCount === totalWords
                                ? "Incroyable ! Tu as trouvé absolument toutes les paroles !"
                                : "Félicitations ! Tu as remporté la partie avec 100% !"}
                        </AlertDescription>
                    </Alert>
                )}

                {gameStatus === 'lost' && (
                    <Alert variant="destructive" className="text-center flex items-center justify-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertDescription className="text-xl">
                            {hasGivenUp ? "Partie abandonnée. Regarde les mots en rouge !" : "Temps écoulé ! Regarde les mots en rouge !"}
                        </AlertDescription>
                    </Alert>
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
                    lastFoundWord={lastFoundWord}
                    onGiveUp={handleGiveUpClick}
                    onRestart={handleRestartClick}
                    lyricsAlignment={lyricsAlignment} // NOUVEAU
                    onAlignmentChange={setLyricsAlignment} // NOUVEAU
                />

                <div className="fixed top-0 inset-x-0 h-24 backdrop-blur-[12px] z-20 pointer-events-none [mask-image:linear-gradient(to_bottom,black_20%,transparent_100%)]" aria-hidden="true" />

                <div className="relative">
                    <LyricsGrid
                        lyricsData={lyricsData}
                        isFetchingLyrics={isFetchingLyrics}
                        gameStatus={gameStatus}
                        lastFoundWord={lastFoundWord}
                        alignment={lyricsAlignment}
                    />
                </div>
            </main>
        </div>
    );
}