import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, SkipForward } from 'lucide-react';

import { Song, SyncedLine } from '@/types';
import { useSurvivalStore } from '@/hooks/useSurvivalStore';
import { useSurvivalLoop } from '@/hooks/useSurvivalLoop';
import { fetchSurvivalLyrics } from '@/utils/api';
import { parseSurvivalLyrics } from '@/utils/survivalParser';

import SurvivalHypeBar from './SurvivalHypeBar';
import SurvivalInlineComposer from './SurvivalInlineComposer';
import { Button } from '@/components/ui/button';

interface SurvivalGameRoundProps {
    song: Song;
    onTrackComplete: () => void;
}

export default function SurvivalGameRound({ song, onTrackComplete }: SurvivalGameRoundProps) {
    // 1. État Global
    const { setLineActive, setVideoPlaying, hitWord } = useSurvivalStore();
    useSurvivalLoop(); // Fait fuir la jauge en continu

    // 2. État Local
    const [phase, setPhase] = useState<'loading' | 'preview' | 'playing'>('loading');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lines, setLines] = useState<SyncedLine[]>([]);

    // Curseurs du jeu
    const [currentLineIdx, setCurrentLineIdx] = useState(0);
    const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);

    const audioRef = useRef<HTMLAudioElement>(null);

    // Initialisation
    useEffect(() => {
        let isMounted = true;
        let skipTimeout: NodeJS.Timeout;

        const prepareRound = async () => {
            setPhase('loading');
            setErrorMsg(null);
            setLineActive(false);
            // On utilise "VideoPlaying" du store pour signifier "Le jeu est actif et la jauge peut fuir"
            setVideoPlaying(false);

            const cleanTitle = song.title
                .replace(/\(.*?\)|-.*?(Edit|Remix|Remastered)/gi, '')
                .trim();

            try {
                const rawTrack = await fetchSurvivalLyrics(song.artist.name, cleanTitle);

                if (!isMounted) return;

                if (rawTrack?.syncedLyrics) {
                    const parsed = parseSurvivalLyrics(rawTrack.syncedLyrics, 15);
                    setLines(parsed.lines);

                    // Si on a un son Deezer, on passe en preview. Sinon, on saute direct au jeu.
                    if (song.preview) {
                        setPhase('preview');
                    } else {
                        startPlaying(parsed.lines);
                    }
                } else {
                    console.warn(
                        `[SKIP] Paroles introuvables: ${song.artist.name} - ${cleanTitle}`
                    );
                    setErrorMsg('Paroles introuvables, piste suivante...');

                    skipTimeout = setTimeout(() => {
                        if (isMounted) onTrackComplete();
                    }, 1500);
                }
            } catch (err) {
                if (!isMounted) return;
                console.error(`[ERREUR] Crash sur: ${cleanTitle}`, err);
                setErrorMsg('Erreur réseau, skip...');
                skipTimeout = setTimeout(() => {
                    if (isMounted) onTrackComplete();
                }, 1500);
            }
        };

        prepareRound();

        return () => {
            isMounted = false;
            if (skipTimeout) clearTimeout(skipTimeout);
        };
    }, [song, onTrackComplete, setLineActive, setVideoPlaying]);

    // Lancer le jeu après la preview
    const startPlaying = useCallback(
        (parsedLines = lines) => {
            if (audioRef.current) {
                audioRef.current.pause(); // Coupe le son si le joueur a skip
            }
            setPhase('playing');
            setVideoPlaying(true); // Débloque la fuite de la jauge !
            findNextTarget(parsedLines, 0, -1);
        },
        [lines, setVideoPlaying]
    );

    // Chercher le prochain mot à taper
    const findNextTarget = useCallback(
        (currentLines: SyncedLine[], startLine: number, startWord: number) => {
            for (let l = startLine; l < currentLines.length; l++) {
                const wordStart = l === startLine ? startWord + 1 : 0;
                for (let w = wordStart; w < currentLines[l].words.length; w++) {
                    if (currentLines[l].words[w].isHidden && !currentLines[l].words[w].isFound) {
                        setCurrentLineIdx(l);
                        setActiveWordIdx(w);
                        setLineActive(true); // Autorise la jauge à descendre
                        return;
                    }
                }
            }

            // La musique est finie !
            setLineActive(false);
            onTrackComplete();
        },
        [setLineActive, onTrackComplete]
    );

    // Validation d'un mot par le joueur
    const handleWordFound = useCallback(() => {
        hitWord(10);

        const newLines = [...lines];
        newLines[currentLineIdx].words[activeWordIdx].isFound = true;
        setLines(newLines);

        findNextTarget(newLines, currentLineIdx, activeWordIdx);
    }, [lines, currentLineIdx, activeWordIdx, hitWord, findNextTarget]);

    // --- RENDU : CHARGEMENT ---
    if (phase === 'loading' || errorMsg) {
        return (
            <div className="text-muted-foreground flex min-h-[50vh] animate-pulse flex-col items-center justify-center">
                <span className="font-titre text-center text-2xl drop-shadow-md">
                    {errorMsg || 'Préparation du texte...'}
                </span>
            </div>
        );
    }

    // --- RENDU : PREVIEW AUDIO ---
    if (phase === 'preview') {
        return (
            <div className="animate-in fade-in zoom-in mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center px-4 text-center duration-500">
                <div className="bg-primary/20 relative mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-[0_0_30px_rgba(232,28,255,0.4)]">
                    <Headphones className="text-primary h-12 w-12 animate-pulse drop-shadow-[0_0_15px_rgba(232,28,255,0.8)]" />
                    {/* Cercles concentriques animés pour l'effet "Son" */}
                    <div className="border-primary/50 absolute inset-0 animate-ping rounded-full border opacity-75" />
                </div>

                <h2 className="font-titre text-foreground mb-2 text-3xl">
                    Imprègne-toi du rythme...
                </h2>
                <p className="font-texte text-muted-foreground mb-8">
                    Dès que la musique se coupe, tu devras survivre sans filet.
                </p>

                {/* Le lecteur audio caché qui joue la musique */}
                <audio ref={audioRef} src={song.preview} autoPlay onEnded={() => startPlaying()} />

                <Button
                    onClick={() => startPlaying()}
                    variant="neon-glass"
                    className="font-titre h-14 w-full rounded-2xl text-lg"
                >
                    <SkipForward className="mr-2 h-5 w-5" />
                    Passer direct au jeu
                </Button>
            </div>
        );
    }

    // --- RENDU : JEU (PROMPTEUR) ---
    return (
        <div className="relative mx-auto flex w-full max-w-3xl flex-col px-4">
            <div className="z-20 mt-4 mb-12">
                <SurvivalHypeBar />
            </div>

            <div className="relative flex h-[40vh] min-h-[300px] w-full flex-col items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {lines.map((line, lineIdx) => {
                        if (lineIdx < currentLineIdx - 1 || lineIdx > currentLineIdx + 2)
                            return null;

                        const isActive = lineIdx === currentLineIdx;
                        const isFuture = lineIdx > currentLineIdx;

                        return (
                            <motion.div
                                key={`line-${lineIdx}`}
                                layout
                                initial={
                                    isFuture
                                        ? { opacity: 0, y: 40, scale: 0.9, filter: 'blur(4px)' }
                                        : false
                                }
                                animate={{
                                    opacity: isActive ? 1 : isFuture ? 0.4 : 0,
                                    y: isActive
                                        ? 0
                                        : isFuture
                                          ? 50 * (lineIdx - currentLineIdx)
                                          : -60,
                                    scale: isActive ? 1 : isFuture ? 0.9 : 0.8,
                                    filter: isActive ? 'blur(0px)' : 'blur(2px)',
                                }}
                                exit={{ opacity: 0, y: -80, scale: 0.8, filter: 'blur(4px)' }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className={`absolute z-10 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-3 px-2 text-center md:px-8 ${
                                    isActive
                                        ? 'font-titre text-foreground text-2xl md:text-4xl'
                                        : 'font-texte text-muted-foreground pointer-events-none text-lg md:text-xl'
                                }`}
                            >
                                {line.words.map((word, wordIdx) => {
                                    if (word.isHidden && !word.isFound) {
                                        const isCurrentTarget =
                                            isActive && activeWordIdx === wordIdx;
                                        if (isCurrentTarget) {
                                            return (
                                                <SurvivalInlineComposer
                                                    key={wordIdx}
                                                    targetWord={word.original}
                                                    isActive={true}
                                                    onValidGuess={handleWordFound}
                                                />
                                            );
                                        }
                                        return (
                                            <span key={wordIdx} className="glass-cell opacity-50">
                                                <span className="opacity-0">{word.original}</span>
                                            </span>
                                        );
                                    }

                                    return (
                                        <span
                                            key={wordIdx}
                                            className={
                                                word.isHidden && word.isFound
                                                    ? 'text-neon-secondary font-bold'
                                                    : ''
                                            }
                                        >
                                            {word.original}
                                        </span>
                                    );
                                })}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
