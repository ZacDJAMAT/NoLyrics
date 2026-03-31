import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Song } from '@/types';
import { useFillyricsGame } from '@/hooks/useFillyricsGame';
import { DifficultyLevel } from '@/utils/fillyricsParser';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Disc3, CheckCircle2, XCircle, Lightbulb, TimerOff, SkipForward } from 'lucide-react';

import GameHeader from '@/features/allmusic/GameHeader';
import ScoreBoard from '@/features/allmusic/ScoreBoard';
import LyricsGrid from '@/features/allmusic/LyricsGrid';
import ProfileScreen from '@/pages/auth/ProfileScreen';
import GiveUpConfirmModal from '@/components/modals/GiveUpConfirmModal';
import HintConfirmModal from '@/components/modals/HintConfirmModal';
import DisableTimerModal from '@/features/allmusic/modals/DisableTimerModal';

import ContractProgressBar from './ContractProgressBar';
import SpeedBonusBar from './SpeedBonusBar';
import FillyricsInlineComposer from './FillyricsInlineComposer';

interface FillyricsGameRoundProps {
    song: Song;
    sessionId: string;
    difficulty: DifficultyLevel;
    targetWordCount: number;
    roundIndex: number;
    totalRounds: number;
    thresholdPercent: number;
    onRoundEnd: (won: boolean, points: number) => void;
    isInfiniteMode?: boolean;
}

export default function FillyricsGameRound({
    sessionId,
    song,
    difficulty,
    targetWordCount,
    roundIndex,
    totalRounds,
    thresholdPercent,
    onRoundEnd,
    isInfiniteMode = false,
}: FillyricsGameRoundProps) {
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [showGiveUpModal, setShowGiveUpModal] = useState(false);
    const [showHintModal, setShowHintModal] = useState(false);
    const [showTimerModal, setShowTimerModal] = useState(false);
    const [lyricsAlignment, setLyricsAlignment] = useState<'left' | 'center' | 'right'>('center');
    const [nextRoundTimer, setNextRoundTimer] = useState(7);
    const hasEnded = useRef(false);

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
        submitInlineGuess,
        setGameStatus,
        scorePoints,
        lastFoundWord,
        hasUsedHint,
        applyHint,
        isTimerDisabled,
        disableTimer,
        skipRound,
        isContractSecured,
        speedBonusMultiplier,
    } = useFillyricsGame(
        sessionId,
        song,
        handleError,
        difficulty,
        targetWordCount,
        thresholdPercent
    );

    const useInlineComposer = isInfiniteMode;

    useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'lost') {
            const timer = setInterval(() => {
                setNextRoundTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        if (!hasEnded.current) {
                            hasEnded.current = true;
                            onRoundEnd(gameStatus === 'won', scorePoints);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameStatus, onRoundEnd, scorePoints]);

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
                autoPlayPreview
            />

            <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 pt-4 md:gap-8 md:p-6 md:pt-6">
                <div className="-mt-2 mb-0 flex justify-center">
                    <div className="bg-secondary/10 border-secondary/30 text-secondary font-titre flex items-center gap-2 rounded-full border px-6 py-1.5 text-lg shadow-[0_0_10px_rgba(64,201,255,0.2)]">
                        <Disc3 className="animate-spin-slow h-4 w-4" />
                        {isInfiniteMode
                            ? `Quick Play - Piste ${roundIndex + 1}`
                            : `Round ${roundIndex + 1} / ${totalRounds}`}
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

                {useInlineComposer ? (
                    <div className="glass-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:flex-nowrap">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
                                    Points
                                </p>
                                <p className="font-titre text-secondary text-2xl">{scorePoints}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
                                    Temps
                                </p>
                                <p className="font-titre text-foreground text-2xl">
                                    {formattedTime}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowHintModal(true)}
                                disabled={hasUsedHint || gameStatus !== 'playing'}
                                className="h-10 w-10 rounded-xl border-white/15 bg-white/5"
                                title="Coup de pouce"
                            >
                                <Lightbulb className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowTimerModal(true)}
                                disabled={isTimerDisabled || gameStatus !== 'playing'}
                                className="h-10 w-10 rounded-xl border-white/15 bg-white/5"
                                title="Mode Zen"
                            >
                                <TimerOff className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={skipRound}
                                disabled={gameStatus !== 'playing'}
                                className="border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20 h-10 w-10 rounded-xl"
                                title="Evaluer le contrat"
                            >
                                <SkipForward className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ) : (
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
                        onGiveUp={skipRound}
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
                )}

                <div className="relative mt-2">
                    <LyricsGrid
                        lyricsData={lyricsData}
                        isFetchingLyrics={isFetchingLyrics}
                        gameStatus={gameStatus}
                        lastFoundWord={lastFoundWord}
                        alignment={lyricsAlignment}
                        gameMode="fillyrics"
                        topContent={
                            useInlineComposer ? (
                                <FillyricsInlineComposer
                                    gameStatus={gameStatus}
                                    disabled={isFetchingLyrics}
                                    onSubmitGuess={submitInlineGuess}
                                />
                            ) : undefined
                        }
                    />
                </div>
            </main>

            {(gameStatus === 'won' || gameStatus === 'lost') && (
                <div className="animate-in slide-in-from-bottom-8 fade-in fixed bottom-8 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 duration-500">
                    <div className="glass-panel flex flex-col items-center gap-2 border-white/10 bg-black/60 p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        <p className="font-titre text-sm tracking-widest text-white/80 uppercase">
                            {isInfiniteMode ? 'Chargement de la prochaine piste...' : 'Passage au round suivant...'}
                        </p>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-black/50">
                            <div
                                className="bg-secondary h-full transition-all duration-1000 ease-linear"
                                style={{ width: `${((7 - nextRoundTimer) / 7) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
