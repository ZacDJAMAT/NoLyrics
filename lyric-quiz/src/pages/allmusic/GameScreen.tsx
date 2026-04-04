import { useState, useEffect, useCallback } from 'react';
import { Song } from '@/types.ts';
import { useGame } from '../../hooks/useGame.ts';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { saveGameResult } from '@/lib/history.ts';
import { Alert, AlertDescription } from '../../components/ui/alert.tsx';
import { Trophy, AlertTriangle, BarChart3 } from 'lucide-react';
import HintConfirmModal from '../../components/modals/HintConfirmModal.tsx';
import HundredPercentModal from '@/features/allmusic/modals/HundredPercentModal.tsx';
import GiveUpConfirmModal from '../../components/modals/GiveUpConfirmModal.tsx';
import RestartConfirmModal from '../../components/modals/RestartConfirmModal.tsx';
import GameHeader from '../../features/allmusic/GameHeader.tsx';
import ScoreBoard from '../../features/allmusic/ScoreBoard.tsx';
import LyricsGrid from '../../features/allmusic/LyricsGrid.tsx';
import SaveScoreModal from '../../components/modals/SaveScoreModal.tsx';
import ProfileScreen from '../auth/ProfileScreen.tsx';
import DisableTimerModal from '@/features/allmusic/modals/DisableTimerModal.tsx';
import { Button } from '../../components/ui/button.tsx';
import { getSongById } from '@/utils/api.ts';

// Imports des composants de statistiques
import StatsDashboard from '../../features/allmusic/StatsDashboard.tsx';
import { useSongStats } from '../../hooks/useSongStats.ts';

// 1. LE COMPOSANT DU JEU
function GameContent({ song }: { song: Song }) {
    const navigate = useNavigate();
    const { modeId } = useParams();
    const { user, loginWithGoogle } = useAuth();

    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [hasGivenUp, setHasGivenUp] = useState<boolean>(false);
    const [showGiveUpModal, setShowGiveUpModal] = useState<boolean>(false);
    const [showRestartModal, setShowRestartModal] = useState<boolean>(false);
    const [pendingAction, setPendingAction] = useState<'back' | 'giveup' | null>(null);

    const [showProfile, setShowProfile] = useState<boolean>(false);
    const [showHundredPercentModal, setShowHundredPercentModal] = useState<boolean>(false);
    const [hasPromptedHundred, setHasPromptedHundred] = useState<boolean>(false);
    const [hasSaved, setHasSaved] = useState<boolean>(false);

    // L'état pour afficher ou cacher le dashboard des statistiques
    const [showStatsDashboard, setShowStatsDashboard] = useState<boolean>(false);

    const [lyricsAlignment, setLyricsAlignment] = useState<'left' | 'center' | 'right'>('center');
    const [showHintModal, setShowHintModal] = useState<boolean>(false);
    const [showTimerModal, setShowTimerModal] = useState<boolean>(false);

    const handleError = useCallback(
        (message: string) => {
            alert(message);
            navigate(`/mode/${modeId}/solo/search`);
        },
        [navigate, modeId]
    );

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
        setGameStatus,
        lastFoundWord,
        restartGame,
        hasUsedHint,
        applyHint,
        getMissingWords,
        isTimerDisabled,
        disableTimer,
    } = useGame(song, handleError);

    // Appel du hook pour récupérer les stats globales de cette chanson depuis Supabase
    const { stats: globalStats } = useSongStats(song.id.toString());

    // Modale de récompense des 100%
    useEffect(() => {
        if (
            scorePercentage >= 100 &&
            foundWordsCount < totalWords &&
            !hasPromptedHundred &&
            gameStatus === 'playing'
        ) {
            setShowHundredPercentModal(true);
            setHasPromptedHundred(true);
        }
    }, [scorePercentage, foundWordsCount, totalWords, hasPromptedHundred, gameStatus]);

    // L'écouteur global de fin de partie
    useEffect(() => {
        if ((gameStatus === 'won' || gameStatus === 'lost') && !hasSaved) {
            const finalStatus = scorePercentage >= 100 ? 'won' : 'lost';
            const missing = foundWordsCount === totalWords ? [] : getMissingWords();

            saveGameResult(
                user,
                song,
                scorePercentage,
                finalStatus,
                timeLeft,
                hasUsedHint,
                missing
            );
            setHasSaved(true);
        }
    }, [
        gameStatus,
        hasSaved,
        scorePercentage,
        timeLeft,
        hasUsedHint,
        user,
        song,
        foundWordsCount,
        totalWords,
        getMissingWords,
    ]);

    const handleUserBack = () => {
        if (gameStatus === 'playing') {
            setPendingAction('back');
            setShowGiveUpModal(true);
        } else {
            navigate(`/mode/${modeId}/solo/search`);
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
            saveGameResult(
                user,
                song,
                scorePercentage,
                finalStatus,
                timeLeft,
                hasUsedHint,
                missing
            );
            navigate(`/mode/${modeId}/solo/search`);
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
            saveGameResult(
                user,
                song,
                scorePercentage,
                finalStatus,
                timeLeft,
                hasUsedHint,
                missing
            );
        }
        setShowRestartModal(false);
        setHasGivenUp(false);
        setHasPromptedHundred(false);
        setHasSaved(false);

        // On cache les stats quand on recommence !
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
        <div className="selection:bg-primary selection:text-primary-foreground relative flex min-h-screen flex-col overflow-clip font-sans">
            {showProfile && <ProfileScreen onClose={() => setShowProfile(false)} />}
            {showSaveModal && (
                <SaveScoreModal
                    onAccept={loginWithGoogle}
                    onDecline={() => setShowSaveModal(false)}
                />
            )}
            {showGiveUpModal && (
                <GiveUpConfirmModal
                    onConfirm={confirmGiveUp}
                    onCancel={() => setShowGiveUpModal(false)}
                />
            )}
            {showRestartModal && (
                <RestartConfirmModal
                    onConfirm={confirmRestart}
                    onCancel={() => setShowRestartModal(false)}
                />
            )}
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

            <GameHeader
                song={song}
                onBack={handleUserBack}
                onProfileClick={() => setShowProfile(true)}
            />

            <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 pt-4 md:gap-8 md:p-6 md:pt-6">
                {gameStatus === 'won' && (
                    <Alert
                        variant="success"
                        className="flex items-center justify-center gap-2 text-center"
                    >
                        <Trophy className="h-5 w-5" />
                        <AlertDescription className="text-xl">
                            {foundWordsCount === totalWords
                                ? 'Incroyable ! Tu as trouvé absolument toutes les paroles !'
                                : 'Félicitations ! Tu as remporté la partie avec 100% !'}
                        </AlertDescription>
                    </Alert>
                )}

                {gameStatus === 'lost' && (
                    <Alert
                        variant="destructive"
                        className="flex items-center justify-center gap-2 text-center"
                    >
                        <AlertTriangle className="h-5 w-5" />
                        <AlertDescription className="text-xl">
                            {hasGivenUp
                                ? 'Partie abandonnée. Regarde les mots en rouge !'
                                : 'Temps écoulé ! Regarde les mots en rouge !'}
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

                {/* Le bouton pour basculer vers les statistiques (Uniquement en fin de partie) */}
                {(gameStatus === 'won' || gameStatus === 'lost') && !showStatsDashboard && (
                    <div className="animate-in fade-in zoom-in mt-2 flex justify-center duration-500">
                        <Button
                            onClick={() => setShowStatsDashboard(true)}
                            className="bg-secondary/20 hover:bg-secondary/40 text-secondary border-secondary/30 flex h-12 items-center gap-3 rounded-xl border px-6 text-lg font-semibold shadow-[0_0_15px_rgba(64,201,255,0.3)] transition-all hover:shadow-[0_0_25px_rgba(64,201,255,0.5)]"
                        >
                            <BarChart3 className="h-5 w-5" />
                            Voir les statistiques détaillées
                        </Button>
                    </div>
                )}

                <div
                    className="pointer-events-none fixed inset-x-0 top-0 z-20 h-24 [mask-image:linear-gradient(to_bottom,black_20%,transparent_100%)] backdrop-blur-[12px]"
                    aria-hidden="true"
                />

                {/* La transition fluide entre LyricsGrid et StatsDashboard */}
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

// 2. LE NOUVEAU WRAPPER (Qui gère le chargement direct depuis l'URL)
export default function GameScreen() {
    const { modeId, songId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // On regarde si on a déjà la musique dans le state (arrivée normale via recherche)
    const [song, setSong] = useState<Song | undefined>(location.state?.song);
    // On met en chargement uniquement s'il n'y a pas encore de musique
    const [isLoading, setIsLoading] = useState<boolean>(!song);

    useEffect(() => {
        // Si on a déjà la musique, pas besoin de la télécharger
        if (song || !songId) return;

        // Sinon (arrivée via lien direct avec l'ID dans l'URL), on télécharge les infos
        const fetchSong = async () => {
            const fetchedSong = await getSongById(songId);
            if (fetchedSong) {
                setSong(fetchedSong);
            } else {
                alert('Impossible de trouver cette musique !');
                navigate(`/mode/${modeId}/solo/search`);
            }
            setIsLoading(false);
        };

        fetchSong();
    }, [songId, song, modeId, navigate]);

    // Écran de chargement
    if (isLoading) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="border-secondary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
                    <p className="text-secondary font-texte animate-pulse">
                        Chargement de la piste...
                    </p>
                </div>
            </div>
        );
    }

    // Sécurité de secours
    if (!song) {
        return <Navigate to={`/mode/${modeId}/solo/search`} replace />;
    }

    // Une fois la musique prête (soit par le state, soit téléchargée), on lance le vrai jeu !
    return <GameContent song={song} />;
}
