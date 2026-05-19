import { useState, useEffect, useRef, useCallback } from 'react';

export const useBlindTestAudio = (url: string | null) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasError, setHasError] = useState(false); // 👈 NOUVEL ÉTAT

    useEffect(() => {
        // Reset global à chaque nouvelle musique
        setIsReady(false);
        setHasError(false);
        setIsPlaying(false);

        if (!url) {
            setHasError(true);
            return;
        }

        const audio = new Audio();
        audio.preload = 'auto';

        const handleReady = () => {
            setIsReady(true);
            setHasError(false);
        };

        const handleError = () => {
            console.warn('⚠️ Lien audio mort ou bloqué :', url);
            setHasError(true);
            setIsReady(false); // On empêche la lecture !
        };

        audio.addEventListener('canplay', handleReady);
        audio.addEventListener('canplaythrough', handleReady);
        audio.addEventListener('loadeddata', handleReady);
        audio.addEventListener('error', handleError);

        audio.src = url;
        audio.load();

        audioRef.current = audio;

        return () => {
            audio.removeEventListener('canplay', handleReady);
            audio.removeEventListener('canplaythrough', handleReady);
            audio.removeEventListener('loadeddata', handleReady);
            audio.removeEventListener('error', handleError);
            audio.pause();
            audio.removeAttribute('src'); // Nettoyage plus propre que src = ''
            audioRef.current = null;
        };
    }, [url]);

    const playSnippet = useCallback(
        (customDurationMs: number = 1500) => {
            if (!audioRef.current || !isReady || isPlaying || hasError) return;

            const audio = audioRef.current;
            setIsPlaying(true);

            try {
                if (audio.currentTime > 0) audio.currentTime = 0;
            } catch (e) {
                // Ignoré silencieusement
            }

            audio
                .play()
                .then(() => {
                    setTimeout(() => {
                        audio.pause();
                        setIsPlaying(false);
                    }, customDurationMs); // 👈 On utilise la durée dynamique ici !
                })
                .catch((err) => {
                    console.error('❌ Erreur de lecture :', err);
                    setIsPlaying(false);
                    setHasError(true);
                });
        },
        [isReady, isPlaying, hasError]
    );

    return { isReady, isPlaying, playSnippet, hasError }; // 👈 On exporte l'erreur
};
