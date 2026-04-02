import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Song } from '@/types';
import { useFillyricsGame } from '@/hooks/useFillyricsGame';

import { Disc3, Flag, Star, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

import GameHeader from '@/features/allmusic/GameHeader';
import LyricsGrid from '@/features/allmusic/LyricsGrid';
import ProfileScreen from '@/pages/auth/ProfileScreen';
import GiveUpConfirmModal from '@/components/modals/GiveUpConfirmModal';

import ContractProgressBar from './ContractProgressBar';
import SpeedBonusBar from './SpeedBonusBar';
import FillyricsInlineComposer from './FillyricsInlineComposer';

interface FillyricsGameRoundProps {
    song: Song;
    sessionId: string;
    roundIndex: number;
    onRoundEnd: (won: boolean, points: number) => void;
}

export default function FillyricsGameRound({
    sessionId,
    song,
    roundIndex,
    onRoundEnd,
}: FillyricsGameRoundProps) {
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [showGiveUpModal, setShowGiveUpModal] = useState(false);
    const [nextRoundTimer, setNextRoundTimer] = useState(4);
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
        isFetchingLyrics,
        currentInput,
        timeLeft,
        gameStatus,
        scorePercentage,
        formattedTime,
        handleInputChange,
        setGameStatus,
        scorePoints,
        lastFoundWord,
        thresholdPercent,
        targetWordCount,
        isContractSecured,
        speedBonusMultiplier,
        activeWordCoords, // 👈 Notre fameux curseur
    } = useFillyricsGame(sessionId, song, roundIndex, handleError);

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
            {/* L'INTERCEPTEUR CLAVIER */}
            <FillyricsInlineComposer
                currentInput={currentInput}
                onInputChange={handleInputChange}
                gameStatus={gameStatus}
            />

            {showProfile && <ProfileScreen onClose={() => setShowProfile(false)} />}
            {showGiveUpModal && (
                <GiveUpConfirmModal
                    onConfirm={() => setGameStatus('lost')}
                    onCancel={() => setShowGiveUpModal(false)}
                />
            )}

            <GameHeader
                song={song}
                onBack={() => navigate('/mode/fillyrics')}
                onProfileClick={() => setShowProfile(true)}
                autoPlayPreview={false} // Pas de preview en plein jeu
            />

            <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 pt-4 md:gap-6 md:p-6 md:pt-6">
                {/* HUD Minimaliste (Score / Timer / Objectif) */}
                <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/40 p-4 shadow-xl backdrop-blur-md md:flex-row md:px-8">
                    {/* Gauche : Infos Piste */}
                    <div className="flex flex-col items-center md:items-start">
                        <div className="text-secondary font-titre flex items-center gap-2 text-lg">
                            <Disc3 className="animate-spin-slow h-5 w-5" />
                            Piste {roundIndex + 1}
                        </div>
                        <span className="mt-1 text-xs tracking-widest text-white/50 uppercase">
                            Objectif: {thresholdPercent}% de {targetWordCount} mots
                        </span>
                    </div>

                    {/* Centre : Timer Géant */}
                    <div
                        className={`font-titre flex items-center gap-2 text-5xl md:text-6xl ${timeLeft <= 10 ? 'text-destructive animate-pulse drop-shadow-[0_0_15px_rgba(255,42,95,0.8)]' : 'text-white'}`}
                    >
                        <Timer className="h-8 w-8 opacity-50 md:h-10 md:w-10" />
                        {formattedTime}
                    </div>

                    {/* Droite : Score & Abandon */}
                    <div className="flex w-full flex-col items-center gap-2 md:w-auto md:items-end">
                        <div className="font-titre text-secondary flex items-center gap-2 text-2xl">
                            <Star className="fill-secondary h-5 w-5" />
                            {scorePoints} <span className="text-sm text-white/50">pts</span>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setShowGiveUpModal(true)}
                            className="hover:text-destructive hover:bg-destructive/10 h-8 px-3 text-xs text-white/40"
                        >
                            <Flag className="mr-1.5 h-3 w-3" /> Passer
                        </Button>
                    </div>
                </div>

                {/* Barres de Progression (Contrat & Vitesse) */}
                <div className="mx-auto w-full max-w-xl px-2">
                    <ContractProgressBar
                        percent={scorePercentage}
                        threshold={thresholdPercent}
                        isSuccess={isContractSecured}
                    />
                    {gameStatus === 'playing' && (
                        <SpeedBonusBar multiplier={speedBonusMultiplier} />
                    )}
                </div>

                {/* LA GRILLE (Avec l'In-line activé !) */}
                <div className="relative mt-2">
                    <LyricsGrid
                        lyricsData={lyricsData}
                        isFetchingLyrics={isFetchingLyrics}
                        gameStatus={gameStatus}
                        lastFoundWord={lastFoundWord}
                        alignment="center"
                        activeWordCoords={activeWordCoords}
                        currentInput={currentInput}
                    />
                </div>
            </main>

            {(gameStatus === 'won' || gameStatus === 'lost') && (
                <div className="animate-in slide-in-from-bottom-8 fade-in fixed bottom-8 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 duration-500">
                    <div className="glass-panel flex flex-col items-center gap-2 border-white/10 bg-black/60 p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        <p className="font-titre text-sm tracking-widest text-white/80 uppercase">
                            Chargement de la prochaine piste...
                        </p>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-black/50">
                            <div
                                className="bg-secondary h-full transition-all duration-1000 ease-linear"
                                style={{ width: `${((4 - nextRoundTimer) / 4) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
