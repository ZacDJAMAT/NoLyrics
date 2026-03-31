import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Loader2, Play, Shield, Sparkles } from 'lucide-react';

import { Artist, Song } from '@/types';
import { Button } from '@/components/ui/button';
import UserMenuButton from '@/components/layout/UserMenuButton';
import FillyricsGameRound from '@/features/fillyrics/FillyricsGameRound';
import { useTrendingArtists } from '@/hooks/useTrendingArtists';
import { useAuth } from '@/contexts/AuthContext';
import { DifficultyLevel } from '@/utils/fillyricsParser';
import { fetchLyrics, getArtistTopTracks } from '@/utils/api';

type QuickPlayConfig = {
    song: Song;
    difficulty: DifficultyLevel;
    targetWordCount: number;
    thresholdPercent: number;
};

type QuickRunStats = {
    songsPlayed: number;
    wins: number;
    totalPoints: number;
};

type RankedArtist = {
    artist: Artist;
    rank: number;
};

const PREFETCH_TARGET = 2;
const MAX_PREPARE_ATTEMPTS = 8;
const MAX_TRACK_CHECKS = 12;
const RECENT_ARTIST_WINDOW = 4;
const SUMMARY_COUNTDOWN_SECONDS = 4;

const chooseDifficulty = (momentum: number): DifficultyLevel => {
    const roll = Math.random();

    if (momentum >= 0.75) {
        if (roll < 0.2) return 'easy';
        if (roll < 0.55) return 'medium';
        return 'hard';
    }

    if (momentum >= 0.45) {
        if (roll < 0.25) return 'easy';
        if (roll < 0.75) return 'medium';
        return 'hard';
    }

    if (roll < 0.35) return 'easy';
    if (roll < 0.85) return 'medium';
    return 'hard';
};

const getTargetWordCount = (): number => Math.floor(Math.random() * 6) + 5;

const getThresholdPercent = (difficulty: DifficultyLevel): number => {
    const ranges: Record<DifficultyLevel, [number, number]> = {
        easy: [25, 40],
        medium: [50, 70],
        hard: [75, 95],
    };

    const [min, max] = ranges[difficulty];
    const steps = Math.floor((max - min) / 5);
    return min + Math.floor(Math.random() * (steps + 1)) * 5;
};

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => 0.5 - Math.random());

const buildCandidatePool = (tracks: Song[], difficulty: DifficultyLevel): Song[] => {
    if (tracks.length === 0) return [];

    if (difficulty === 'easy') {
        const pool = tracks.slice(0, Math.min(30, tracks.length));
        return pool.length > 0 ? pool : tracks;
    }

    if (difficulty === 'hard') {
        const start = Math.min(55, tracks.length - 1);
        const pool = tracks.slice(start);
        return pool.length > 0 ? pool : tracks;
    }

    const start = Math.min(20, tracks.length - 1);
    const end = Math.min(70, tracks.length);
    const pool = tracks.slice(start, end);
    return pool.length > 0 ? pool : tracks;
};

const isRemixTitle = (title: string): boolean => {
    const normalized = title.toLowerCase();
    return (
        normalized.includes('remix') ||
        normalized.includes('edit') ||
        normalized.includes('version') ||
        normalized.includes('karaoke')
    );
};

export default function FillyricsQuickPlayScreen() {
    const navigate = useNavigate();
    const { user, isGuest, loginWithGoogle } = useAuth();
    const { trendingArtists, isLoadingTrendingArtists } = useTrendingArtists();

    const queueRef = useRef<QuickPlayConfig[]>([]);
    const playedSongIdsRef = useRef<string[]>([]);
    const recentArtistIdsRef = useRef<string[]>([]);
    const lyricsCacheRef = useRef<Map<string, boolean>>(new Map());
    const preparationLockRef = useRef(false);
    const isUnmountedRef = useRef(false);

    const [phase, setPhase] = useState<'finding' | 'playing' | 'summary'>('finding');
    const [queue, setQueue] = useState<QuickPlayConfig[]>([]);
    const [activeRound, setActiveRound] = useState<QuickPlayConfig | null>(null);
    const [isPreparingRound, setIsPreparingRound] = useState(false);
    const [roundIndex, setRoundIndex] = useState(0);
    const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
    const [playedSongIds, setPlayedSongIds] = useState<string[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);
    const [summaryCountdown, setSummaryCountdown] = useState(SUMMARY_COUNTDOWN_SECONDS);
    const [runStats, setRunStats] = useState<QuickRunStats>({
        songsPlayed: 0,
        wins: 0,
        totalPoints: 0,
    });

    const rankedArtists = useMemo<RankedArtist[]>(
        () => trendingArtists.map((artist, index) => ({ artist, rank: index + 1 })),
        [trendingArtists]
    );

    const momentum = useMemo(() => {
        if (runStats.songsPlayed === 0) return 0.5;
        return runStats.wins / runStats.songsPlayed;
    }, [runStats.songsPlayed, runStats.wins]);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    useEffect(() => {
        playedSongIdsRef.current = playedSongIds;
    }, [playedSongIds]);

    useEffect(() => {
        return () => {
            isUnmountedRef.current = true;
        };
    }, []);

    const pickWeightedArtist = useCallback(
        (excludedIds: Set<string>): Artist | null => {
            const filtered = rankedArtists.filter(
                ({ artist }) => !excludedIds.has(artist.id.toString())
            );
            const source = filtered.length >= 3 ? filtered : rankedArtists;

            if (source.length === 0) return null;

            const weighted = source.map(({ artist, rank }) => ({
                artist,
                weight: 1 / Math.pow(rank, 0.55),
            }));

            const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
            let cursor = Math.random() * totalWeight;

            for (const item of weighted) {
                cursor -= item.weight;
                if (cursor <= 0) return item.artist;
            }

            return weighted[weighted.length - 1].artist;
        },
        [rankedArtists]
    );

    const hasPlayableLyrics = useCallback(async (song: Song): Promise<boolean> => {
        const key = `${song.artist.name}::${song.title}`.toLowerCase().trim();

        if (lyricsCacheRef.current.has(key)) {
            return lyricsCacheRef.current.get(key) ?? false;
        }

        try {
            const lyrics = await fetchLyrics(song.artist.name, song.title);
            const isPlayable = Boolean(lyrics && lyrics.trim().length > 100);
            lyricsCacheRef.current.set(key, isPlayable);
            return isPlayable;
        } catch {
            lyricsCacheRef.current.set(key, false);
            return false;
        }
    }, []);

    const findPlayableSongForArtist = useCallback(
        async (artist: Artist, difficulty: DifficultyLevel): Promise<Song | null> => {
            const rawTracks = await getArtistTopTracks(artist.id, 100);
            const filteredTracks = rawTracks.filter((track) => {
                const songId = track.id.toString();
                return !playedSongIdsRef.current.includes(songId) && !isRemixTitle(track.title);
            });

            if (filteredTracks.length === 0) return null;

            const pool = buildCandidatePool(filteredTracks, difficulty);
            const shuffledPool = shuffle(pool);

            let checks = 0;
            for (const track of shuffledPool) {
                if (checks >= MAX_TRACK_CHECKS) break;
                checks += 1;

                if (await hasPlayableLyrics(track)) {
                    return track;
                }
            }

            return null;
        },
        [hasPlayableLyrics]
    );

    const buildRoundConfig = useCallback(async (): Promise<QuickPlayConfig | null> => {
        const excluded = new Set<string>(recentArtistIdsRef.current);

        for (let attempt = 0; attempt < MAX_PREPARE_ATTEMPTS; attempt += 1) {
            const artist = pickWeightedArtist(excluded);
            if (!artist) return null;

            const artistId = artist.id.toString();
            excluded.add(artistId);

            const difficulty = chooseDifficulty(momentum);
            const song = await findPlayableSongForArtist(artist, difficulty);

            if (!song) continue;

            recentArtistIdsRef.current = [...recentArtistIdsRef.current, artistId].slice(
                -RECENT_ARTIST_WINDOW
            );

            return {
                song,
                difficulty,
                targetWordCount: getTargetWordCount(),
                thresholdPercent: getThresholdPercent(difficulty),
            };
        }

        return null;
    }, [findPlayableSongForArtist, momentum, pickWeightedArtist]);

    const prefetchQueue = useCallback(async () => {
        if (preparationLockRef.current) return;
        if (rankedArtists.length === 0) return;

        preparationLockRef.current = true;
        if (!isUnmountedRef.current) setIsPreparingRound(true);

        try {
            while (queueRef.current.length < PREFETCH_TARGET) {
                const candidate = await buildRoundConfig();
                if (!candidate) break;

                const candidateId = candidate.song.id.toString();
                const duplicateInQueue = queueRef.current.some(
                    (item) => item.song.id.toString() === candidateId
                );

                if (duplicateInQueue || playedSongIdsRef.current.includes(candidateId)) {
                    continue;
                }

                const nextQueue = [...queueRef.current, candidate];
                queueRef.current = nextQueue;

                if (!isUnmountedRef.current) {
                    setQueue(nextQueue);
                    setLocalError(null);
                }
            }

            if (queueRef.current.length === 0 && !isUnmountedRef.current) {
                setLocalError(
                    'Impossible de preparer une nouvelle piste pour le moment. Reessaie dans quelques secondes.'
                );
            }
        } finally {
            preparationLockRef.current = false;
            if (!isUnmountedRef.current) setIsPreparingRound(false);
        }
    }, [buildRoundConfig, rankedArtists.length]);

    useEffect(() => {
        if (isLoadingTrendingArtists) return;

        if (rankedArtists.length === 0) {
            setLocalError('Aucun artiste tendance disponible pour le Quick Play.');
            return;
        }

        if ((phase === 'finding' || phase === 'playing') && queueRef.current.length < PREFETCH_TARGET) {
            void prefetchQueue();
        }
    }, [phase, rankedArtists, isLoadingTrendingArtists, prefetchQueue]);

    useEffect(() => {
        if (phase !== 'finding' || activeRound) return;
        if (queue.length === 0) return;

        const [nextRound, ...rest] = queue;
        queueRef.current = rest;
        setQueue(rest);
        setActiveRound(nextRound);
        setRoundIndex((prev) => prev + 1);

        const songId = nextRound.song.id.toString();
        setPlayedSongIds((prev) => {
            if (prev.includes(songId)) return prev;
            const next = [...prev, songId];
            playedSongIdsRef.current = next;
            return next;
        });

        setPhase('playing');
    }, [phase, activeRound, queue]);

    const handlePlayNext = useCallback(() => {
        setLocalError(null);
        setSummaryCountdown(SUMMARY_COUNTDOWN_SECONDS);
        setActiveRound(null);
        setPhase('finding');
    }, []);

    useEffect(() => {
        if (phase !== 'summary') return;

        if (summaryCountdown <= 0) {
            handlePlayNext();
            return;
        }

        const timer = setTimeout(() => setSummaryCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [phase, summaryCountdown, handlePlayNext]);

    const handleRoundEnd = useCallback((won: boolean, points: number) => {
        setRunStats((prev) => ({
            songsPlayed: prev.songsPlayed + 1,
            wins: prev.wins + (won ? 1 : 0),
            totalPoints: prev.totalPoints + points,
        }));

        setSummaryCountdown(SUMMARY_COUNTDOWN_SECONDS);
        setPhase('summary');
    }, []);

    const handleRestartRun = useCallback(() => {
        setRunStats({ songsPlayed: 0, wins: 0, totalPoints: 0 });
        setRoundIndex(0);
        setSessionId(crypto.randomUUID());
        setPlayedSongIds([]);
        playedSongIdsRef.current = [];
        recentArtistIdsRef.current = [];
        queueRef.current = [];
        setQueue([]);
        setActiveRound(null);
        setSummaryCountdown(SUMMARY_COUNTDOWN_SECONDS);
        setLocalError(null);
        setPhase('finding');
    }, []);

    const winRate = useMemo(() => {
        if (runStats.songsPlayed === 0) return 0;
        return Math.round((runStats.wins / runStats.songsPlayed) * 100);
    }, [runStats.songsPlayed, runStats.wins]);

    if (localError) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
                <p className="font-texte max-w-xl text-lg text-white/80">{localError}</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                        variant="neon-secondary"
                        onClick={() => {
                            setLocalError(null);
                            void prefetchQueue();
                        }}
                    >
                        Reessayer
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/mode/fillyrics')}>
                        Retour
                    </Button>
                </div>
            </div>
        );
    }

    if (phase === 'finding' || !activeRound) {
        return (
            <div className="bg-background min-h-screen p-4 md:p-6">
                <header className="border-border relative mb-12 flex flex-col items-center border-b pb-8">
                    <div className="absolute top-0 left-0 z-20">
                        <Button
                            variant="back"
                            onClick={() => navigate('/mode/fillyrics')}
                            className="font-texte"
                        >
                            <ArrowLeft className="h-5 w-5 md:mr-1" />
                            <span className="hidden sm:inline">Retour au Lobby</span>
                        </Button>
                    </div>
                    <div className="absolute top-0 right-0 z-20">
                        <UserMenuButton />
                    </div>

                    <h1 className="font-titre titre-neon-secondary mt-12 mb-2 text-center text-5xl tracking-widest md:text-6xl">
                        QUICK PLAY
                    </h1>
                    <p className="font-texte text-muted-foreground text-center text-base md:text-lg">
                        Playlist infinie prechargee avec anti repetition.
                    </p>
                </header>

                <div className="glass-panel mx-auto flex w-full max-w-xl flex-col items-center gap-4 p-8 text-center">
                    <Loader2 className="text-secondary h-10 w-10 animate-spin" />
                    <p className="font-titre text-secondary text-2xl tracking-wide">
                        Preparation de la prochaine piste
                    </p>
                    <p className="font-texte text-white/60">
                        {isLoadingTrendingArtists || isPreparingRound
                            ? 'Recherche en cours...'
                            : 'Initialisation...'}
                    </p>
                </div>
            </div>
        );
    }

    if (phase === 'summary') {
        return (
            <div className="bg-background min-h-screen p-4 md:p-6">
                <header className="border-border relative mb-10 flex flex-col items-center border-b pb-8">
                    <div className="absolute top-0 left-0 z-20">
                        <Button
                            variant="back"
                            onClick={() => navigate('/mode/fillyrics')}
                            className="font-texte"
                        >
                            <ArrowLeft className="h-5 w-5 md:mr-1" />
                            <span className="hidden sm:inline">Quitter</span>
                        </Button>
                    </div>
                    <div className="absolute top-0 right-0 z-20">
                        <UserMenuButton />
                    </div>

                    <h1 className="font-titre titre-neon-secondary mt-12 mb-2 text-center text-5xl tracking-widest md:text-6xl">
                        RUN EN COURS
                    </h1>
                    <p className="font-texte text-muted-foreground text-center text-base md:text-lg">
                        Prochaine piste automatique dans {summaryCountdown}s.
                    </p>
                </header>

                <main className="mx-auto flex w-full max-w-2xl flex-col gap-5">
                    <div className="glass-panel grid grid-cols-3 gap-3 p-5 text-center">
                        <div>
                            <p className="font-texte text-xs tracking-wide text-white/50 uppercase">
                                Pistes
                            </p>
                            <p className="font-titre text-secondary text-4xl">
                                {runStats.songsPlayed}
                            </p>
                        </div>
                        <div>
                            <p className="font-texte text-xs tracking-wide text-white/50 uppercase">
                                Winrate
                            </p>
                            <p className="font-titre text-secondary text-4xl">{winRate}%</p>
                        </div>
                        <div>
                            <p className="font-texte text-xs tracking-wide text-white/50 uppercase">
                                Points
                            </p>
                            <p className="font-titre text-secondary text-4xl">
                                {runStats.totalPoints.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="glass-panel flex flex-col gap-3 p-5">
                        <Button
                            onClick={handlePlayNext}
                            className="font-texte bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 rounded-xl text-lg"
                        >
                            <Play className="h-5 w-5" />
                            Piste suivante maintenant
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleRestartRun}
                            className="font-texte h-12 rounded-xl text-base"
                        >
                            <Sparkles className="h-5 w-5" />
                            Recommencer le run
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/mode/fillyrics')}
                            className="font-texte h-12 rounded-xl text-base"
                        >
                            Quitter le Quick Play
                        </Button>
                    </div>

                    {isGuest && user && (
                        <button
                            type="button"
                            onClick={loginWithGoogle}
                            className="glass-panel border-secondary/40 bg-secondary/10 text-secondary flex h-14 items-center justify-center gap-2 rounded-2xl border text-base font-semibold"
                        >
                            <Shield className="h-5 w-5" />
                            Securise ton butin (Google)
                            <Flame className="h-5 w-5" />
                        </button>
                    )}
                </main>
            </div>
        );
    }

    return (
        <FillyricsGameRound
            key={`${activeRound.song.id}-${roundIndex}`}
            sessionId={sessionId}
            song={activeRound.song}
            difficulty={activeRound.difficulty}
            targetWordCount={activeRound.targetWordCount}
            thresholdPercent={activeRound.thresholdPercent}
            roundIndex={Math.max(roundIndex - 1, 0)}
            totalRounds={999}
            onRoundEnd={handleRoundEnd}
            isInfiniteMode
        />
    );
}
