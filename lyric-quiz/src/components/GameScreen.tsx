import { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { useGame } from '../hooks/useGame';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveGameResult } from '../lib/history';
import GiveUpConfirmModal from './GiveUpConfirmModal';
import RestartConfirmModal from './RestartConfirmModal';
import GameHeader from './GameHeader';
import ScoreBoard from './ScoreBoard';
import LyricsGrid from './LyricsGrid';
import SaveScoreModal from './SaveScoreModal';
import { Button } from './ui/button';
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

    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [showProfile, setShowProfile] = useState<boolean>(false);

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
        lastFoundWord, restartGame
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
        setIsSettingsOpen(false);
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

    const handleRestartClick = () => {
        if (gameStatus === 'playing') {
            setIsSettingsOpen(false);
            setShowRestartModal(true);
        } else {
            confirmRestart();
        }
    };

    const confirmRestart = () => {
        if (gameStatus === 'playing') {
            saveGameResult(user, isGuest, song, scorePercentage, 'lost', timeLeft);
        }

        setIsSettingsOpen(false);
        setShowRestartModal(false);
        setHasGivenUp(false);

        if (restartGame) {
            restartGame();
        } else {
            setGameStatus('ready');
        }
    };

    useEffect(() => {
        const isGameFinished = gameStatus === 'won' || (gameStatus === 'lost' && !hasGivenUp);
        if (!user && isGameFinished) {
            const timer = setTimeout(() => setShowSaveModal(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [gameStatus, user, hasGivenUp]);

    return (
        <div className="min-h-screen font-sans selection:bg-primary selection:text-primary-foreground flex flex-col relative overflow-clip">

            {/* LE CALQUE DU PROFIL */}
            {showProfile && (
                <ProfileScreen onClose={() => setShowProfile(false)} />
            )}

            {showSaveModal && (
                <SaveScoreModal onAccept={loginWithGoogle} onDecline={() => setShowSaveModal(false)} />
            )}

            {showGiveUpModal && (
                <GiveUpConfirmModal onConfirm={confirmGiveUp} onCancel={() => setShowGiveUpModal(false)} />
            )}

            {showRestartModal && (
                <RestartConfirmModal onConfirm={confirmRestart} onCancel={() => setShowRestartModal(false)} />
            )}

            <GameHeader
                song={song}
                onBack={handleUserBack}
                onProfileClick={() => setShowProfile(true)}
            />

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col gap-8 relative z-10">

                {gameStatus === 'won' && (
                    <div className="bg-secondary/10 border border-secondary text-secondary p-4 rounded-xl text-center font-titre text-xl animate-pulse shadow-[0_0_15px_rgba(64,201,255,0.2)] tracking-wide">
                        🎉 Félicitations ! Tu as trouvé toutes les paroles !
                    </div>
                )}

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
                    lastFoundWord={lastFoundWord}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onGiveUp={handleGiveUpClick}
                    onRestart={handleRestartClick}
                />

                {/* --- 🌟 LE PLAFOND DE VERRE (Nouveau) --- */}
                {/* Il est fixé en haut, ne bloque pas les clics, et utilise un flou très fort qui s'efface en dégradé */}
                <div className="fixed top-0 inset-x-0 h-24 backdrop-blur-[12px] z-20 pointer-events-none [mask-image:linear-gradient(to_bottom,black_20%,transparent_100%)]" aria-hidden="true" />

                {/* --- On englobe LyricsGrid pour le forcer à passer sous le flou (z-0) --- */}
                <div className="relative z-0">
                    <LyricsGrid
                        lyricsData={lyricsData}
                        isFetchingLyrics={isFetchingLyrics}
                        gameStatus={gameStatus}
                        lastFoundWord={lastFoundWord}
                    />
                </div>
            </main>

            {isSettingsOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsSettingsOpen(false)}
                />
            )}

            <div className={`fixed inset-y-0 right-0 w-80 glass-modal border-r-0 rounded-r-none rounded-l-3xl z-50 transform transition-transform duration-500 ease-out flex flex-col p-8 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${
                isSettingsOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-neon-secondary text-2xl tracking-widest">MENU</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSettingsOpen(false)}
                        className="rounded-full w-10 h-10 hover:bg-white/10 text-muted-foreground"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Button>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                    <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                        <p className="text-muted-foreground font-texte text-sm text-center leading-relaxed">
                            <span className="text-foreground font-bold">PROCHAINEMENT</span><br/>
                            Indentation des paroles<br/>Mode de frappe simplifié<br/>Thèmes visuels
                        </p>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <p className="text-xs text-center text-muted-foreground font-texte">
                        NOLYRICS v1.0
                    </p>
                </div>
            </div>

        </div>
    );
}