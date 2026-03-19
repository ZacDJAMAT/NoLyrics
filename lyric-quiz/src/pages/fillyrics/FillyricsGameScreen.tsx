import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Song } from '@/types';
import { useFillyricsPlaylist } from '@/hooks/useFillyricsPlaylist';
import { useFillyricsGame } from '@/hooks/useFillyricsGame';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Trophy,
    AlertTriangle,
    Disc3,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Home,
    Music,
    Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import GameHeader from '@/features/allmusic/GameHeader';
import ScoreBoard from '@/features/allmusic/ScoreBoard';
import LyricsGrid from '@/features/allmusic/LyricsGrid';
import ProfileScreen from '@/pages/auth/ProfileScreen';
import GiveUpConfirmModal from '@/components/modals/GiveUpConfirmModal';
import HintConfirmModal from '@/components/modals/HintConfirmModal';
import DisableTimerModal from '@/features/allmusic/modals/DisableTimerModal';

// --- 1. LE COMPOSANT D'UN ROUND DE JEU PUR ---
function FillyricsGameRound({
    song,
    roundIndex,
    totalRounds,
    onRoundEnd,
}: {
    song: Song;
    roundIndex: number;
    totalRounds: number;
    onRoundEnd: (won: boolean) => void;
}) {
    const navigate = useNavigate();

    const [showProfile, setShowProfile] = useState(false);
    const [showGiveUpModal, setShowGiveUpModal] = useState(false);
    const [showHintModal, setShowHintModal] = useState(false);
    const [showTimerModal, setShowTimerModal] = useState(false);
    const [lyricsAlignment, setLyricsAlignment] = useState<'left' | 'center' | 'right'>('center');

    const handleError = useCallback(
        (message: string) => {
            alert(message);
            navigate('/mode/fillyrics');
        },
        [navigate]
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
        hasUsedHint,
        applyHint,
        isTimerDisabled,
        disableTimer,
    } = useFillyricsGame(song, handleError);

    useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'lost') {
            const t = setTimeout(() => {
                onRoundEnd(gameStatus === 'won');
            }, 7000);
            return () => clearTimeout(t);
        }
    }, [gameStatus, onRoundEnd]);

    return (
        <div className="selection:bg-secondary selection:text-secondary-foreground relative flex min-h-screen flex-col overflow-clip font-sans">
            {showProfile && <ProfileScreen onClose={() => setShowProfile(false)} />}
            {showGiveUpModal && (
                <GiveUpConfirmModal
                    onConfirm={() => setGameStatus('lost')}
                    onCancel={() => setShowGiveUpModal(false)}
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
                onBack={() => navigate('/mode/fillyrics')}
                onProfileClick={() => setShowProfile(true)}
            />

            <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 pt-4 md:gap-8 md:p-6 md:pt-6">
                <div className="-mt-2 mb-2 flex justify-center">
                    <div className="bg-secondary/10 border-secondary/30 text-secondary font-titre flex items-center gap-2 rounded-full border px-6 py-1.5 text-lg shadow-[0_0_10px_rgba(64,201,255,0.2)]">
                        <Disc3 className="animate-spin-slow h-4 w-4" />
                        Round {roundIndex + 1} / {totalRounds}
                    </div>
                </div>

                {gameStatus === 'won' && (
                    <Alert className="border-secondary bg-secondary/10 text-secondary flex items-center justify-center gap-2 text-center shadow-[0_0_15px_rgba(64,201,255,0.2)]">
                        <Trophy className="h-5 w-5" />
                        <AlertDescription className="text-xl">
                            {foundWordsCount === totalWords ? 'Mix parfait !' : 'Super !'}
                        </AlertDescription>
                    </Alert>
                )}

                {gameStatus === 'lost' && (
                    <Alert className="border-destructive bg-destructive/10 text-destructive flex items-center justify-center gap-2 text-center shadow-[0_0_15px_rgba(255,42,95,0.2)]">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertDescription className="text-xl">Temps écoulé !</AlertDescription>
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
                    onGiveUp={() => setShowGiveUpModal(true)}
                    onRestart={() => {}}
                    lyricsAlignment={lyricsAlignment}
                    onAlignmentChange={setLyricsAlignment}
                    onHint={() => setShowHintModal(true)}
                    hasUsedHint={hasUsedHint}
                    onDisableTimer={() => setShowTimerModal(true)}
                    isTimerDisabled={isTimerDisabled}
                />

                <div className="relative mt-2">
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

// --- 2. LE RÉSUMÉ FINAL ---
function FillyricsSummaryScreen({
    results,
    onReplay,
    onQuit,
}: {
    results: { song: Song; won: boolean }[];
    onReplay: () => void;
    onQuit: () => void;
}) {
    const score = results.filter((r) => r.won).length;
    return (
        <div className="bg-background text-foreground flex min-h-screen flex-col items-center overflow-x-hidden p-4 pb-20 md:p-6">
            <h1 className="font-titre titre-neon-secondary mt-12 mb-2 text-center text-5xl tracking-widest drop-shadow-[0_0_20px_rgba(64,201,255,0.4)] md:text-6xl">
                RÉSUMÉ DU MIX
            </h1>

            <div className="mt-8 mb-10 flex flex-col items-center">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-black/40 shadow-[0_0_30px_rgba(64,201,255,0.2)]">
                    <div className="border-secondary/30 animate-spin-slow absolute inset-2 rounded-full border-2 border-dashed"></div>
                    <div className="text-center">
                        <p className="font-titre text-5xl text-white">
                            {score}
                            <span className="text-3xl text-white/50">/10</span>
                        </p>
                    </div>
                </div>
                <p className="font-texte mt-4 text-xl text-white/80">
                    {score >= 8
                        ? 'Incroyable ! Tu gères 🎧'
                        : score >= 5
                          ? 'Pas mal du tout ! 🎵'
                          : 'Il faut réviser tes classiques ! 😅'}
                </p>
            </div>

            <div className="mb-8 w-full max-w-2xl rounded-[30px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="font-titre mb-6 flex items-center gap-2 border-b border-white/10 pb-3 text-xl text-white">
                    <Music className="text-secondary h-5 w-5" /> Pistes Jouées
                </h3>
                <div className="flex flex-col gap-3">
                    {results.map((r, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
                        >
                            <span className="font-titre w-6 text-right text-xl text-white/30">
                                {i + 1}.
                            </span>
                            <img
                                src={r.song.album.cover_xl}
                                alt="cover"
                                className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                                <p className="font-titre line-clamp-1 text-lg text-white">
                                    {r.song.title}
                                </p>
                                <p className="font-texte line-clamp-1 text-sm text-white/60">
                                    {r.song.artist.name}
                                </p>
                            </div>
                            <div className="mr-2">
                                {r.won ? (
                                    <CheckCircle2 className="text-secondary h-6 w-6 drop-shadow-[0_0_10px_rgba(64,201,255,0.5)]" />
                                ) : (
                                    <XCircle className="text-destructive h-6 w-6 drop-shadow-[0_0_10px_rgba(255,42,95,0.5)]" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
                <Button
                    onClick={onReplay}
                    className="font-titre bg-secondary hover:bg-secondary/80 text-secondary-foreground h-14 flex-1 rounded-2xl text-lg shadow-[0_0_15px_rgba(64,201,255,0.4)]"
                >
                    <RefreshCw className="mr-2 h-5 w-5" /> Rejouer ce Mix
                </Button>
                <Button
                    onClick={onQuit}
                    variant="outline"
                    className="font-titre h-14 flex-1 rounded-2xl border-white/10 text-lg hover:bg-white/10"
                >
                    <Home className="mr-2 h-5 w-5" /> Retour au Lobby
                </Button>
            </div>
        </div>
    );
}

// --- 3. LA MACHINE A ÉTAT PRINCIPALE ---
export default function FillyricsGameScreen() {
    const location = useLocation();
    const navigate = useNavigate();

    const selection = location.state?.selection;
    const [reloadKey, setReloadKey] = useState(Date.now());

    const {
        playlist,
        currentSong,
        currentRoundIndex,
        totalRounds,
        isMixing,
        mixError,
        nextRound,
        isLastRound,
    } = useFillyricsPlaylist(selection, reloadKey);

    // 👉 Le contrôle strict des phases
    const [phase, setPhase] = useState<'preview' | 'playing' | 'transition' | 'summary'>('preview');
    const [countdown, setCountdown] = useState(10);
    const [lastResult, setLastResult] = useState<boolean | null>(null);
    const [results, setResults] = useState<{ song: Song; won: boolean }[]>([]);

    useEffect(() => {
        if (!isMixing && !mixError && (phase === 'preview' || phase === 'transition')) {
            // 👉 5 SECONDES de compte à rebours (au lieu de 10)
            let currentCount = 5;
            setCountdown(currentCount);

            const timer = setInterval(() => {
                currentCount -= 1;
                setCountdown(currentCount);
                if (currentCount <= 0) {
                    clearInterval(timer);
                    if (phase === 'transition') nextRound();
                    setPhase('playing');
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isMixing, mixError, phase, nextRound]);

    if (!selection || selection.length === 0) return <Navigate to="/mode/fillyrics" replace />;

    const handleRoundEnd = (won: boolean) => {
        setResults((prev) => [...prev, { song: currentSong, won }]);
        setLastResult(won);
        if (isLastRound) setPhase('summary');
        else setPhase('transition');
    };

    const handleReplay = () => {
        setReloadKey(Date.now());
        setResults([]);
        setLastResult(null);
        setPhase('preview');
    };

    if (isMixing) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6">
                <div className="relative h-24 w-24">
                    <div className="border-secondary/20 absolute inset-0 rounded-full border-4"></div>
                    <div className="border-secondary absolute inset-0 animate-spin rounded-full border-4 border-t-transparent"></div>
                    <Mic className="text-secondary absolute inset-0 m-auto h-8 w-8 animate-pulse" />
                </div>
                <div className="text-center">
                    <h2 className="font-titre mb-2 text-2xl tracking-widest text-white">
                        MIXAGE EN COURS
                    </h2>
                    <p className="font-texte text-muted-foreground">Nous vérifions tes pistes...</p>
                </div>
            </div>
        );
    }

    if (mixError) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 p-6">
                <AlertTriangle className="text-destructive h-16 w-16" />
                <p className="font-texte text-center text-xl">{mixError}</p>
                <Button onClick={() => navigate('/mode/fillyrics')} variant="neon-destructive">
                    Retour au Lobby
                </Button>
            </div>
        );
    }

    if (phase === 'summary')
        return (
            <FillyricsSummaryScreen
                results={results}
                onReplay={handleReplay}
                onQuit={() => navigate('/mode/fillyrics')}
            />
        );

    // 10s Avant la première musique
    if (phase === 'preview') {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <h2 className="font-titre titre-neon-secondary mb-6 text-4xl">Le Mix est Prêt !</h2>
                <div className="animate-in zoom-in flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl duration-500">
                    <img
                        src={currentSong.album.cover_xl}
                        className="mb-4 h-32 w-32 rounded-2xl object-cover shadow-lg"
                        alt="Cover"
                    />
                    <p className="text-secondary mb-1 text-sm font-bold tracking-widest uppercase">
                        Piste 1 / {totalRounds}
                    </p>
                    <p className="font-titre mb-1 line-clamp-1 text-2xl text-white">
                        {currentSong.title}
                    </p>
                    <p className="font-texte mb-6 line-clamp-1 text-white/60">
                        {currentSong.artist.name}
                    </p>

                    <div className="border-secondary/20 relative flex h-20 w-20 items-center justify-center rounded-full border-4">
                        <div className="border-secondary absolute inset-0 animate-spin rounded-full border-4 border-l-transparent"></div>
                        <span className="font-titre text-secondary absolute text-3xl">
                            {countdown}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // 10s Entre les rounds
    if (phase === 'transition') {
        const nextSong = playlist[currentRoundIndex + 1];
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <div className="animate-in slide-in-from-bottom-4 mb-8">
                    {lastResult ? (
                        <div className="text-secondary flex flex-col items-center gap-3">
                            <CheckCircle2 className="h-16 w-16 drop-shadow-[0_0_15px_rgba(64,201,255,0.6)]" />
                            <h2 className="font-titre titre-neon-secondary text-4xl">
                                Bien joué !
                            </h2>
                        </div>
                    ) : (
                        <div className="text-destructive flex flex-col items-center gap-3">
                            <XCircle className="h-16 w-16 drop-shadow-[0_0_15px_rgba(255,42,95,0.6)]" />
                            <h2 className="font-titre titre-neon-destructive text-4xl">Raté !</h2>
                        </div>
                    )}
                </div>

                <div className="animate-in fade-in flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl duration-700">
                    <p className="mb-4 text-sm font-semibold tracking-wider text-white/50 uppercase">
                        Piste Suivante
                    </p>
                    <img
                        src={nextSong.album.cover_xl}
                        className="mb-4 h-24 w-24 rounded-2xl object-cover shadow-lg"
                        alt="Cover"
                    />
                    <p className="font-titre mb-1 line-clamp-1 text-xl text-white">
                        {nextSong.title}
                    </p>
                    <p className="font-texte mb-6 line-clamp-1 text-white/60">
                        {nextSong.artist.name}
                    </p>

                    <div className="border-secondary/20 relative flex h-16 w-16 items-center justify-center rounded-full border-4">
                        <div className="border-secondary absolute inset-0 animate-spin rounded-full border-4 border-l-transparent"></div>
                        <span className="font-titre text-secondary absolute text-2xl">
                            {countdown}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Le Jeu pur
    return (
        <FillyricsGameRound
            key={currentSong.id}
            song={currentSong}
            roundIndex={currentRoundIndex}
            totalRounds={totalRounds}
            onRoundEnd={handleRoundEnd}
        />
    );
}
