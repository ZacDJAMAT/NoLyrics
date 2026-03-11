import { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { useGame } from '../hooks/useGame';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveGameResult } from '../lib/history';
import { Alert, AlertDescription } from "./ui/alert";
// NOUVEAU : Import de BarChart3 pour l'icône du bouton
import { Trophy, AlertTriangle, BarChart3 } from "lucide-react";
import HintConfirmModal from './HintConfirmModal';
import HundredPercentModal from './HundredPercentModal';
import GiveUpConfirmModal from './GiveUpConfirmModal';
import RestartConfirmModal from './RestartConfirmModal';
import GameHeader from './GameHeader';
import ScoreBoard from './ScoreBoard';
import LyricsGrid from './LyricsGrid';
import SaveScoreModal from './SaveScoreModal';
import ProfileScreen from './ProfileScreen';
import DisableTimerModal from './DisableTimerModal';
import { Button } from './ui/button'; // Assure-toi que l'import est correct

// NOUVEAU : Imports des composants de statistiques
import StatsDashboard from './StatsDashboard';
import { useSongStats } from '../hooks/useSongStats';

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
    const [hasSaved, setHasSaved] = useState<boolean>(false);

    // NOUVEAU : L'état pour afficher ou cacher le dashboard des statistiques
    const [showStatsDashboard, setShowStatsDashboard] = useState<boolean>(false);

    const [lyricsAlignment, setLyricsAlignment] = useState<'left' | 'center' | 'right'>('center');
    const [showHintModal, setShowHintModal] = useState<boolean>(false);
    const [showTimerModal, setShowTimerModal] = useState<boolean>(false);

    const song = location.state?.song as Song | undefined;

    if (!song) {
        return <Navigate to="/" replace />;
    }

    const handleError = useCallback((message: string) => {
        alert(message);
        navigate('/');
    }, [navigate]);

    const {
        lyricsData, totalWords, isFetchingLyrics, currentInput, foundWordsCount,
        timeLeft, gameStatus, scorePercentage, formattedTime, handleInputChange, setGameStatus,
        lastFoundWord, restartGame, hasUsedHint, applyHint, getMissingWords,
        isTimerDisabled, disableTimer
    } = useGame(song, handleError);

    // NOUVEAU : Appel du hook pour récupérer les stats globales de cette chanson depuis Supabase
    const { stats: globalStats } = useSongStats(song.id.toString());

    // Modale de récompense des 100%
    useEffect(() => {
        if (scorePercentage >= 100 && foundWordsCount < totalWords && !hasPromptedHundred && gameStatus === 'playing') {
            setShowHundredPercentModal(true);
            setHasPromptedHundred(true);
        }
    }, [scorePercentage, foundWordsCount, totalWords, hasPromptedHundred, gameStatus]);

    // L'écouteur global de fin de partie
    useEffect(() => {
        if ((gameStatus === 'won' || gameStatus === 'lost') && !hasSaved) {
            const finalStatus = scorePercentage >= 100 ? 'won' : 'lost';
            const missing = foundWordsCount === totalWords ? [] : getMissingWords();

            saveGameResult(user, isGuest, song, scorePercentage, finalStatus, timeLeft, hasUsedHint, missing);
            setHasSaved(true);
        }
    }, [gameStatus, hasSaved, scorePercentage, timeLeft, hasUsedHint, user, isGuest, song, foundWordsCount, totalWords, getMissingWords]);

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
            const missing = foundWordsCount === totalWords ? [] : getMissingWords();
            saveGameResult(user, isGuest, song, scorePercentage, finalStatus, timeLeft, hasUsedHint, missing);
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
            const missing = foundWordsCount === totalWords ? [] : getMissingWords();
            saveGameResult(user, isGuest, song, scorePercentage, finalStatus, timeLeft, hasUsedHint, missing);
        }
        setShowRestartModal(false);
        setHasGivenUp(false);
        setHasPromptedHundred(false);
        setHasSaved(false);

        // NOUVEAU : On cache les stats quand on recommence !
        setShowStatsDashboard(false);

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
            {showHintModal && (
                <HintConfirmModal
                    onConfirm={() => {
                        applyHint();
                        setShowHintModal(false);
                    }}
                    onCancel={() => setShowHintModal(false)}
                />
            )}
            {showTimerModal && (
                <DisableTimerModal
                    onConfirm={() => {
                        disableTimer();
                        setShowTimerModal(false);
                    }}
                    onCancel={() => setShowTimerModal(false)}
                />
            )}

            <GameHeader song={song} onBack={handleUserBack} onProfileClick={() => setShowProfile(true)} />

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
                    lyricsAlignment={lyricsAlignment}
                    onAlignmentChange={setLyricsAlignment}
                    onHint={() => setShowHintModal(true)}
                    hasUsedHint={hasUsedHint}
                    onDisableTimer={() => setShowTimerModal(true)}
                    isTimerDisabled={isTimerDisabled}
                />

                {/* NOUVEAU : Le bouton pour basculer vers les statistiques (Uniquement en fin de partie) */}
                {(gameStatus === 'won' || gameStatus === 'lost') && !showStatsDashboard && (
                    <div className="flex justify-center mt-2 animate-in fade-in zoom-in duration-500">
                        <Button
                            onClick={() => setShowStatsDashboard(true)}
                            className="h-12 px-6 rounded-xl bg-secondary/20 hover:bg-secondary/40 text-secondary border border-secondary/30 shadow-[0_0_15px_rgba(64,201,255,0.3)] hover:shadow-[0_0_25px_rgba(64,201,255,0.5)] transition-all flex items-center gap-3 text-lg font-semibold"
                        >
                            <BarChart3 className="w-5 h-5" />
                            Voir les statistiques détaillées
                        </Button>
                    </div>
                )}

                <div className="fixed top-0 inset-x-0 h-24 backdrop-blur-[12px] z-20 pointer-events-none [mask-image:linear-gradient(to_bottom,black_20%,transparent_100%)]" aria-hidden="true" />

                {/* NOUVEAU : La transition fluide entre LyricsGrid et StatsDashboard */}
                <div className="relative mt-2">
                    {showStatsDashboard ? (
                        <StatsDashboard
                            lyricsData={lyricsData}
                            globalStats={globalStats}
                            onClose={() => setShowStatsDashboard(false)}
                        />
                    ) : (
                        <LyricsGrid
                            lyricsData={lyricsData}
                            isFetchingLyrics={isFetchingLyrics}
                            gameStatus={gameStatus}
                            lastFoundWord={lastFoundWord}
                            alignment={lyricsAlignment}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}