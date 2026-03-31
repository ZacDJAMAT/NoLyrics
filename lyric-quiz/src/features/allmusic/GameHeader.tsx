import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, Volume2 } from 'lucide-react';

import { Song } from '../../types.ts';
import UserMenuButton from '../../components/layout/UserMenuButton.tsx';
import { Button } from '../../components/ui/button.tsx';

interface GameHeaderProps {
    song: Song;
    onBack: () => void;
    onProfileClick?: () => void;
    autoPlayPreview?: boolean;
}

export default function GameHeader({
    song,
    onBack,
    onProfileClick,
    autoPlayPreview = false,
}: GameHeaderProps) {
    const [featuring, setFeaturing] = useState<string | null>(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(0);

    const previewRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const fetchFeats = async () => {
            try {
                const response = await fetch(`/api/deezer/track/${song.id}`);
                if (!response.ok) return;

                const track = await response.json();

                if (track.contributors && track.contributors.length > 1) {
                    const feats = track.contributors
                        .filter((c: any) => c.name !== track.artist.name)
                        .map((c: any) => c.name)
                        .join(', ');

                    setFeaturing(feats ? `feat. ${feats}` : null);
                } else {
                    setFeaturing(null);
                }
            } catch (error) {
                console.error('Erreur lors de la recuperation des feat:', error);
            }
        };

        fetchFeats();
    }, [song.id, song.artist.name]);

    useEffect(() => {
        const audio = previewRef.current;
        if (!audio) return;

        audio.pause();
        audio.currentTime = 0;
        setIsPlayingPreview(false);
        setPreviewProgress(0);

        if (autoPlayPreview && song.preview) {
            void audio
                .play()
                .then(() => setIsPlayingPreview(true))
                .catch(() => setIsPlayingPreview(false));
        }
    }, [song.id, song.preview, autoPlayPreview]);

    const togglePreview = async () => {
        const audio = previewRef.current;
        if (!audio || !song.preview) return;

        if (audio.paused) {
            try {
                await audio.play();
                setIsPlayingPreview(true);
            } catch {
                setIsPlayingPreview(false);
            }
            return;
        }

        audio.pause();
        setIsPlayingPreview(false);
    };

    return (
        <header className="border-border relative z-20 flex items-center justify-between gap-2 border-b px-3 py-2 md:gap-4 md:px-6 md:py-4">
            <div className="flex flex-1 justify-start">
                <Button
                    variant="back"
                    onClick={onBack}
                    className="font-texte h-9 px-2 text-base md:h-10 md:px-3 md:text-lg"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="hidden sm:inline">Retour</span>
                </Button>
            </div>

            <div className="flex flex-none items-center gap-2 md:gap-5">
                <img
                    src={song.album.cover_xl}
                    alt="Pochette"
                    className="aspect-square h-12 w-12 rounded-lg border border-white/10 object-cover shadow-[0_5px_15px_rgba(0,0,0,0.3)] md:h-20 md:w-20 md:rounded-2xl md:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                />

                <div className="flex flex-col justify-center text-left">
                    <h1 className="text-neon-primary mb-0 text-xl leading-none tracking-widest md:mb-1 md:text-3xl md:text-4xl">
                        NOLYRICS
                    </h1>
                    <h2 className="font-titre text-foreground max-w-[130px] truncate text-sm leading-tight drop-shadow-sm sm:max-w-[200px] md:max-w-[300px] md:text-lg">
                        {song.title}
                    </h2>
                    <p className="text-secondary font-texte mt-0 max-w-[130px] truncate text-[10px] drop-shadow-sm sm:max-w-[200px] md:mt-0.5 md:max-w-[300px] md:text-sm">
                        {song.artist.name}{' '}
                        {featuring && (
                            <span className="ml-1 text-[9px] text-white/60 italic md:text-xs">
                                {featuring}
                            </span>
                        )}
                    </p>

                    {song.preview && (
                        <div className="mt-1.5 flex items-center gap-2 md:mt-2 md:gap-3">
                            <button
                                type="button"
                                onClick={togglePreview}
                                className="border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20 flex h-7 w-7 items-center justify-center rounded-full border transition-colors md:h-8 md:w-8"
                                title="Ecouter l'extrait 30s"
                            >
                                {isPlayingPreview ? (
                                    <Pause className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                ) : (
                                    <Play className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                )}
                            </button>

                            <div className="flex items-center gap-1.5">
                                <Volume2 className="h-3.5 w-3.5 text-white/60" />
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/15 md:w-28">
                                    <div
                                        className="bg-secondary h-full transition-[width] duration-200"
                                        style={{ width: `${previewProgress}%` }}
                                    />
                                </div>
                            </div>

                            <audio
                                ref={previewRef}
                                src={song.preview}
                                preload="none"
                                onTimeUpdate={() => {
                                    const audio = previewRef.current;
                                    if (!audio || !audio.duration) {
                                        setPreviewProgress(0);
                                        return;
                                    }
                                    setPreviewProgress((audio.currentTime / audio.duration) * 100);
                                }}
                                onEnded={() => {
                                    setIsPlayingPreview(false);
                                    setPreviewProgress(100);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-1 justify-end">
                <UserMenuButton onClickOverride={onProfileClick} />
            </div>
        </header>
    );
}
