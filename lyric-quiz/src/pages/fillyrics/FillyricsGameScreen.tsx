import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Song } from '@/types';
import { useFillyricsPreRound } from '@/hooks/useFillyricsPreRound';
import { DifficultyLevel } from '@/utils/fillyricsParser';

import { AlertTriangle, Mic, Flame, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

import FillyricsGameRound from '@/features/fillyrics/FillyricsGameRound';
import FillyricsSummaryScreen from '@/pages/fillyrics/FillyricsSummaryScreen';

export default function FillyricsGameScreen() {
    const location = useLocation();
    const navigate = useNavigate();

    const selection = location.state?.selection;
    const numRounds = location.state?.numRounds || 5;

    const { prepareRound, isPreparing, choices, error } = useFillyricsPreRound();

    // 1. LES ÉTATS DU JEU (Note : 'transition' a été supprimé)
    const [phase, setPhase] = useState<'preparing' | 'choice' | 'playing' | 'summary'>('preparing');
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [playedSongIds, setPlayedSongIds] = useState<string[]>([]);

    const [selectedSong, setSelectedSong] = useState<{
        song: Song;
        difficulty: DifficultyLevel;
        targetWordCount: number;
    } | null>(null);
    const [choiceCountdown, setChoiceCountdown] = useState(12);

    const [results, setResults] = useState<{ song: Song; won: boolean; points: number }[]>([]);

    // 2. LOGIQUE DE CYCLE DE VIE DES ROUNDS
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

    // Timer de 12 secondes pour l'écran de choix
    useEffect(() => {
        if (phase === 'choice') {
            if (choiceCountdown > 0) {
                const timer = setTimeout(() => setChoiceCountdown((prev) => prev - 1), 1000);
                return () => clearTimeout(timer);
            } else if (choiceCountdown === 0 && choices) {
                // Temps écoulé : Sélection automatique du contrat Facile
                handleChoice(choices.easy, 'easy', choices.targetWordCount);
            }
        }
    }, [choiceCountdown, phase, choices]);

    // 3. ACTIONS UTILISATEUR
    const handleChoice = (song: Song, difficulty: DifficultyLevel, targetWordCount: number) => {
        setSelectedSong({ song, difficulty, targetWordCount });
        setPlayedSongIds((prev) => [...prev, song.id.toString()]);
        setPhase('playing');
    };

    const handleRoundEnd = useCallback(
        (won: boolean, points: number) => {
            if (selectedSong) {
                setResults((prev) => {
                    // Double sécurité : on empêche d'ajouter la même musique deux fois
                    const alreadyExists = prev.some((r) => r.song.id === selectedSong.song.id);
                    if (alreadyExists) return prev;
                    return [...prev, { song: selectedSong.song, won, points }];
                });
            }

            if (currentRoundIndex + 1 >= numRounds) {
                setPhase('summary');
            } else {
                setCurrentRoundIndex((prev) => prev + 1);
                setPhase('preparing');
            }
        },
        [selectedSong, currentRoundIndex, numRounds]
    );

    const handleReplay = () => {
        setResults([]);
        setPlayedSongIds([]);
        setCurrentRoundIndex(0);
        setSelectedSong(null);
        setPhase('preparing');
    };

    if (!selection || selection.length === 0) return <Navigate to="/mode/fillyrics" replace />;

    // PHASE 1 : PRÉPARATION (CHARGEMENT)
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

    // PHASE 2 : CHOIX DU CONTRAT (CARTES)
    if (phase === 'choice' && choices) {
        const currentArtist = selection[currentRoundIndex % selection.length].data;
        const nbMots = choices.targetWordCount;

        // Calculs pour le chrono SVG circulaire
        const radius = 38;
        const circumference = 2 * Math.PI * radius;
        const progress = choiceCountdown / 12;
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
                    {/* CARTE FACILE */}
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
                    {/* CARTE MOYEN */}
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
                    {/* CARTE DIFFICILE */}
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

                {/* CHRONO CIRCULAIRE SVG */}
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg className="absolute inset-0 h-full w-full -rotate-90 transform">
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-secondary/20"
                        />
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

    // PHASE 3 : RÉSUMÉ FINAL
    if (phase === 'summary') {
        return (
            <FillyricsSummaryScreen
                results={results}
                onReplay={handleReplay}
                onQuit={() => navigate('/mode/fillyrics')}
            />
        );
    }

    // PHASE 4 : EN JEU
    if (phase === 'playing' && selectedSong) {
        return (
            <FillyricsGameRound
                key={selectedSong.song.id}
                song={selectedSong.song}
                difficulty={selectedSong.difficulty}
                targetWordCount={selectedSong.targetWordCount}
                roundIndex={currentRoundIndex}
                totalRounds={numRounds}
                onRoundEnd={handleRoundEnd} // 👈 Réception des points ici
            />
        );
    }

    return null;
}
