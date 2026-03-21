import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Song } from '@/types';
import { useFillyricsGame } from '@/hooks/useFillyricsGame';
import { useFillyricsPreRound } from '@/hooks/useFillyricsPreRound';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertTriangle,
    Disc3,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Home,
    Music,
    Mic,
    Flame,
    Star,
    Zap,
    ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import GameHeader from '@/features/allmusic/GameHeader';
import ScoreBoard from '@/features/allmusic/ScoreBoard';
import LyricsGrid from '@/features/allmusic/LyricsGrid';
import ProfileScreen from '@/pages/auth/ProfileScreen';
import GiveUpConfirmModal from '@/components/modals/GiveUpConfirmModal';
import HintConfirmModal from '@/components/modals/HintConfirmModal';
import DisableTimerModal from '@/features/allmusic/modals/DisableTimerModal';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

// -----------------------------------------------------------------
// COMPOSANTS UI TACTIQUES
// -----------------------------------------------------------------
function ContractProgressBar({
    percent,
    threshold,
    isSuccess,
}: {
    percent: number;
    threshold: number;
    isSuccess: boolean;
}) {
    return (
        <div className="mb-2 flex w-full flex-col gap-1">
            <div className="font-texte flex justify-between text-xs uppercase">
                <span className={isSuccess ? 'text-secondary font-bold' : 'text-destructive'}>
                    Contrat : {isSuccess ? 'Sécurisé !' : 'En danger'}
                </span>
                <span className="text-white/50">Seuil: {threshold}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
                <div
                    className={`h-full transition-all duration-500 ${isSuccess ? 'bg-secondary shadow-[0_0_10px_rgba(64,201,255,0.8)]' : 'bg-destructive'}`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
                <div
                    className="absolute top-0 bottom-0 z-10 w-1 bg-white/80 shadow-sm"
                    style={{ left: `${threshold}%` }}
                />
            </div>
        </div>
    );
}

function SpeedBonusBar({ multiplier }: { multiplier: number }) {
    return (
        <div className="mb-4 flex w-full flex-col gap-1">
            <div className="font-texte flex justify-between text-[10px] text-white/50 uppercase">
                <span>Bonus Vitesse</span>
                <span>x{(1 + multiplier).toFixed(2)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
                <div
                    className="h-full bg-emerald-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${multiplier * 100}%` }}
                />
            </div>
        </div>
    );
}

// -----------------------------------------------------------------
// LE COMPOSANT D'UN ROUND DE JEU PUR
// -----------------------------------------------------------------
function FillyricsGameRound({
    song,
    difficulty,
    targetWordCount,
    roundIndex,
    totalRounds,
    onRoundEnd,
}: {
    song: Song;
    difficulty: DifficultyLevel;
    targetWordCount: number;
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
        scorePoints,
        lastFoundWord,
        hasUsedHint,
        applyHint,
        isTimerDisabled,
        disableTimer,
        thresholdPercent,
        isContractSecured,
        speedBonusMultiplier,
    } = useFillyricsGame(song, handleError, difficulty, targetWordCount);

    // 👉 7 secondes d'observation AVEC POSSIBILITÉ DE PASSER !
    useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'lost') {
            const t = setTimeout(() => onRoundEnd(gameStatus === 'won'), 7000);
            // Si onRoundEnd est appelé manuellement par le bouton, le composant se démonte
            // et clearTimeout annule proprement le timer pour éviter les bugs.
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
                <div className="-mt-2 mb-0 flex justify-center">
                    <div className="bg-secondary/10 border-secondary/30 text-secondary font-titre flex items-center gap-2 rounded-full border px-6 py-1.5 text-lg shadow-[0_0_10px_rgba(64,201,255,0.2)]">
                        <Disc3 className="animate-spin-slow h-4 w-4" />
                        Round {roundIndex + 1} / {totalRounds}
                        <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-xs text-white uppercase">
                            {difficulty === 'easy'
                                ? 'Facile'
                                : difficulty === 'medium'
                                  ? 'Moyen'
                                  : 'Difficile'}
                        </span>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-xl px-2">
                    <ContractProgressBar
                        percent={scorePercentage}
                        threshold={thresholdPercent}
                        isSuccess={isContractSecured}
                    />
                    {!isTimerDisabled && gameStatus === 'playing' && (
                        <SpeedBonusBar multiplier={speedBonusMultiplier} />
                    )}
                </div>

                {/* 👉 FEEDBACK IMMÉDIAT EN FIN DE PARTIE (Remplace l'écran de transition) */}
                {gameStatus === 'won' && (
                    <Alert className="border-secondary bg-secondary/10 text-secondary animate-in zoom-in flex items-center justify-center gap-3 py-4 text-center shadow-[0_0_20px_rgba(64,201,255,0.4)] duration-300">
                        <CheckCircle2 className="h-8 w-8 drop-shadow-[0_0_10px_rgba(64,201,255,0.6)]" />
                        <AlertDescription className="font-titre text-2xl tracking-wider uppercase">
                            {foundWordsCount === totalWords
                                ? 'Contrat Parfait !'
                                : 'Contrat Rempli !'}
                        </AlertDescription>
                    </Alert>
                )}

                {gameStatus === 'lost' && (
                    <Alert className="border-destructive bg-destructive/10 text-destructive animate-in zoom-in flex items-center justify-center gap-3 py-4 text-center shadow-[0_0_20px_rgba(255,42,95,0.4)] duration-300">
                        <XCircle className="h-8 w-8 drop-shadow-[0_0_10px_rgba(255,42,95,0.6)]" />
                        <AlertDescription className="font-titre text-2xl tracking-wider uppercase">
                            Contrat Échoué !
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
                    onGiveUp={() => setGameStatus('lost')}
                    onRestart={() => {}}
                    lyricsAlignment={lyricsAlignment}
                    onAlignmentChange={setLyricsAlignment}
                    onHint={() => setShowHintModal(true)}
                    hasUsedHint={hasUsedHint}
                    onDisableTimer={() => setShowTimerModal(true)}
                    isTimerDisabled={isTimerDisabled}
                    gameMode="fillyrics"
                    scorePoints={scorePoints}
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

            {/* 👉 BOUTON CONTINUER FLOTTANT */}
            {(gameStatus === 'won' || gameStatus === 'lost') && (
                <div className="animate-in slide-in-from-bottom-8 fade-in fixed bottom-8 left-1/2 z-50 -translate-x-1/2 duration-500">
                    <Button
                        size="lg"
                        onClick={() => onRoundEnd(gameStatus === 'won')}
                        className="font-titre h-14 rounded-full bg-white px-8 text-xl text-black shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all hover:scale-105 hover:bg-white/90"
                    >
                        Continuer <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                </div>
            )}
        </div>
    );
}

// -----------------------------------------------------------------
// LE RÉSUMÉ FINAL
// -----------------------------------------------------------------
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
                RÉSUMÉ DU JEU
            </h1>
            <div className="mt-8 mb-10 flex flex-col items-center">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-black/40 shadow-[0_0_30px_rgba(64,201,255,0.2)]">
                    <div className="border-secondary/30 animate-spin-slow absolute inset-2 rounded-full border-2 border-dashed"></div>
                    <div className="text-center">
                        <p className="font-titre text-5xl text-white">
                            {score}
                            <span className="text-3xl text-white/50">/{results.length}</span>
                        </p>
                    </div>
                </div>
            </div>
            <div className="mb-8 w-full max-w-2xl rounded-[30px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="font-titre mb-6 flex items-center gap-2 border-b border-white/10 pb-3 text-xl text-white">
                    <Music className="text-secondary h-5 w-5" /> Contrats Remplis
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
                    <RefreshCw className="mr-2 h-5 w-5" /> Rejouer
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

// -----------------------------------------------------------------
// MACHINE À ÉTAT PRINCIPALE (Modifiée pour retirer 'transition')
// -----------------------------------------------------------------
export default function FillyricsGameScreen() {
    const location = useLocation();
    const navigate = useNavigate();

    const selection = location.state?.selection;
    const numRounds = location.state?.numRounds || 5;

    const { prepareRound, isPreparing, choices, error } = useFillyricsPreRound();

    // 👉 SUPPRESSION DE 'transition'
    const [phase, setPhase] = useState<'preparing' | 'choice' | 'playing' | 'summary'>('preparing');
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [playedSongIds, setPlayedSongIds] = useState<string[]>([]);

    const [selectedSong, setSelectedSong] = useState<{
        song: Song;
        difficulty: DifficultyLevel;
        targetWordCount: number;
    } | null>(null);
    const [choiceCountdown, setChoiceCountdown] = useState(12);
    const [results, setResults] = useState<{ song: Song; won: boolean }[]>([]);

    useEffect(() => {
        if (phase === 'preparing' && selection && selection.length > 0) {
            const currentArtist = selection[currentRoundIndex % selection.length].data;
            prepareRound(currentArtist, playedSongIds);
        }
    }, [phase, currentRoundIndex, selection, playedSongIds, prepareRound]);

    useEffect(() => {
        if (phase === 'preparing' && choices) {
            setPhase('choice');
            setChoiceCountdown(12);
        }
    }, [choices, phase]);

    useEffect(() => {
        if (phase === 'choice') {
            if (choiceCountdown > 0) {
                const timer = setTimeout(() => setChoiceCountdown((prev) => prev - 1), 1000);
                return () => clearTimeout(timer);
            } else if (choiceCountdown === 0 && choices) {
                handleChoice(choices.easy, 'easy', choices.targetWordCount);
            }
        }
    }, [choiceCountdown, phase, choices]);

    const handleChoice = (song: Song, difficulty: DifficultyLevel, targetWordCount: number) => {
        setSelectedSong({ song, difficulty, targetWordCount });
        setPlayedSongIds((prev) => [...prev, song.id.toString()]);
        setPhase('playing');
    };

    const handleRoundEnd = (won: boolean) => {
        if (selectedSong) setResults((prev) => [...prev, { song: selectedSong.song, won }]);
        // 👉 PASSAGE DIRECT EN 'preparing' POUR LE PROCHAIN ROUND
        if (currentRoundIndex + 1 >= numRounds) {
            setPhase('summary');
        } else {
            setCurrentRoundIndex((prev) => prev + 1);
            setPhase('preparing');
        }
    };

    const handleReplay = () => {
        setResults([]);
        setPlayedSongIds([]);
        setCurrentRoundIndex(0);
        setSelectedSong(null);
        setPhase('preparing');
    };

    if (!selection || selection.length === 0) return <Navigate to="/mode/fillyrics" replace />;

    if (phase === 'preparing' || isPreparing) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6">
                <div className="relative h-24 w-24">
                    <div className="border-secondary/20 absolute inset-0 rounded-full border-4"></div>
                    <div className="border-secondary absolute inset-0 animate-spin rounded-full border-4 border-t-transparent"></div>
                    <Mic className="text-secondary absolute inset-0 m-auto h-8 w-8 animate-pulse" />
                </div>
                <div className="text-center">
                    <h2 className="font-titre mb-2 text-2xl tracking-widest text-white">
                        RECHERCHE DES TITRES
                    </h2>
                    <p className="font-texte text-muted-foreground">
                        Analyse de la discographie...
                    </p>
                </div>
            </div>
        );
    }

    if (error && phase !== 'summary') {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 p-6">
                <AlertTriangle className="text-destructive h-16 w-16" />
                <p className="font-texte text-center text-xl text-white/80">{error}</p>
                <Button onClick={() => navigate('/mode/fillyrics')} variant="neon-destructive">
                    Retour au Lobby
                </Button>
            </div>
        );
    }

    if (phase === 'choice' && choices) {
        const currentArtist = selection[currentRoundIndex % selection.length].data;
        const nbMots = choices.targetWordCount;

        // 👉 CALCULS POUR LE NOUVEAU TIMER SVG
        const radius = 38;
        const circumference = 2 * Math.PI * radius;
        const progress = choiceCountdown / 12; // Valeur de 1 à 0
        const strokeDashoffset = circumference - progress * circumference;

        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4 text-center md:p-6">
                <div className="mb-6 flex flex-col items-center">
                    <img
                        src={currentArtist.picture_xl}
                        className="border-secondary mb-4 h-24 w-24 rounded-full border-2 object-cover shadow-[0_0_15px_rgba(64,201,255,0.5)]"
                        alt={currentArtist.name}
                    />
                    <h2 className="font-titre text-3xl text-white">Choisis ton Contrat</h2>
                    <p className="font-texte text-muted-foreground mt-2">
                        Round {currentRoundIndex + 1} / {numRounds} • {nbMots} mots cachés
                    </p>
                </div>

                <div className="mb-8 flex w-full max-w-4xl flex-col gap-4 md:flex-row">
                    <button
                        onClick={() => handleChoice(choices.easy, 'easy', nbMots)}
                        className="glass-panel flex flex-1 flex-col items-center border-t-4 border-t-emerald-400 p-6 transition-transform hover:scale-[1.02] hover:bg-white/10"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <Star className="h-6 w-6 text-emerald-400" />
                            <p className="font-titre text-2xl text-emerald-400">Facile</p>
                        </div>
                        <img
                            src={choices.easy.album.cover_xl}
                            className="mb-3 h-28 w-28 rounded-lg border border-emerald-400/20 object-cover shadow-lg"
                            alt="Cover"
                        />
                        <p className="font-titre mt-2 line-clamp-2 text-xl text-white">
                            {choices.easy.title}
                        </p>
                        <div className="font-texte mt-4 w-full rounded-lg bg-black/20 p-2 text-sm">
                            <div className="flex justify-between text-white/70">
                                <span>Contrat:</span> <span className="text-white">Min. 30%</span>
                            </div>
                            <div className="flex justify-between text-white/70">
                                <span>Potentiel:</span>{' '}
                                <span className="font-bold text-emerald-400">
                                    {Math.round(nbMots * 10 * 2.2)} pts
                                </span>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => handleChoice(choices.medium, 'medium', nbMots)}
                        className="glass-panel flex flex-1 flex-col items-center border-t-4 border-t-orange-400 p-6 transition-transform hover:scale-[1.02] hover:bg-white/10"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <Zap className="h-6 w-6 text-orange-400" />
                            <p className="font-titre text-2xl text-orange-400">Moyen</p>
                        </div>
                        <img
                            src={choices.medium.album.cover_xl}
                            className="mb-3 h-28 w-28 rounded-lg border border-orange-400/20 object-cover shadow-lg"
                            alt="Cover"
                        />
                        <p className="font-titre mt-2 line-clamp-2 text-xl text-white">
                            {choices.medium.title}
                        </p>
                        <div className="font-texte mt-4 w-full rounded-lg bg-black/20 p-2 text-sm">
                            <div className="flex justify-between text-white/70">
                                <span>Contrat:</span> <span className="text-white">Min. 60%</span>
                            </div>
                            <div className="flex justify-between text-white/70">
                                <span>Potentiel:</span>{' '}
                                <span className="font-bold text-orange-400">
                                    {Math.round(nbMots * 30 * 2.2)} pts
                                </span>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => handleChoice(choices.hard, 'hard', nbMots)}
                        className="glass-panel border-t-destructive flex flex-1 flex-col items-center border-t-4 p-6 transition-transform hover:scale-[1.02] hover:bg-white/10"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <Flame className="text-destructive h-6 w-6" />
                            <p className="font-titre text-destructive text-2xl">Difficile</p>
                        </div>
                        <img
                            src={choices.hard.album.cover_xl}
                            className="border-destructive/20 mb-3 h-28 w-28 rounded-lg border object-cover shadow-lg"
                            alt="Cover"
                        />
                        <p className="font-titre mt-2 line-clamp-2 text-xl text-white">
                            {choices.hard.title}
                        </p>
                        <div className="font-texte mt-4 w-full rounded-lg bg-black/20 p-2 text-sm">
                            <div className="flex justify-between text-white/70">
                                <span>Contrat:</span> <span className="text-white">Min. 90%</span>
                            </div>
                            <div className="flex justify-between text-white/70">
                                <span>Potentiel:</span>{' '}
                                <span className="text-destructive font-bold">
                                    {Math.round(nbMots * 80 * 2.2)} pts
                                </span>
                            </div>
                        </div>
                    </button>
                </div>

                {/* 👉 NOUVEAU CHRONOMÈTRE SVG */}
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg className="absolute inset-0 h-full w-full -rotate-90 transform">
                        {/* Cercle de fond */}
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-secondary/20"
                        />
                        {/* Cercle animé (Le chrono) */}
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="text-secondary transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    <span className="font-titre text-secondary absolute text-4xl">
                        {choiceCountdown}
                    </span>
                </div>
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

    if (phase === 'playing' && selectedSong) {
        return (
            <FillyricsGameRound
                key={selectedSong.song.id}
                song={selectedSong.song}
                difficulty={selectedSong.difficulty}
                targetWordCount={selectedSong.targetWordCount}
                roundIndex={currentRoundIndex}
                totalRounds={numRounds}
                onRoundEnd={handleRoundEnd}
            />
        );
    }

    return null;
}
