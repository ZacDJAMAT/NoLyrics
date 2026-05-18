import { useState, useEffect, useRef, useCallback } from 'react';

export const useBlindTestAudio = (url: string | null, durationMs: number = 1500) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!url) {
            setIsReady(false);
            return;
        }

        setIsReady(false);
        const audio = new Audio();

        // 1. On retire crossOrigin qui bloquait les requêtes vers Deezer
        audio.preload = 'auto';

        const handleReady = () => {
            setIsReady(true);
        };

        const handleError = (e: any) => {
            console.error('Erreur de chargement audio :', e);
            // Même en cas d'erreur réseau mineure, on débloque le bouton
            // pour permettre au navigateur de retenter au clic.
            setIsReady(true);
        };

        // 2. On écoute plusieurs événements pour être sûr de ne pas rater le coche
        audio.addEventListener('canplay', handleReady);
        audio.addEventListener('canplaythrough', handleReady);
        audio.addEventListener('loadeddata', handleReady);
        audio.addEventListener('error', handleError);

        audio.src = url;
        audio.load(); // 3. On force explicitement le navigateur à chercher le fichier

        audioRef.current = audio;

        return () => {
            audio.removeEventListener('canplay', handleReady);
            audio.removeEventListener('canplaythrough', handleReady);
            audio.removeEventListener('loadeddata', handleReady);
            audio.removeEventListener('error', handleError);
            audio.pause();
            audio.src = '';
            audioRef.current = null;
        };
    }, [url]);

    const playSnippet = useCallback(() => {
        if (!audioRef.current || !isReady || isPlaying) {
            console.log('⚠️ Clic ignoré :', { isReady, isPlaying, hasAudio: !!audioRef.current });
            return;
        }

        const audio = audioRef.current;

        // On bloque le bouton immédiatement pour éviter les doubles clics
        setIsPlaying(true);

        try {
            // Sur certains navigateurs mobiles, cela peut planter si on le fait trop tôt.
            if (audio.currentTime > 0) {
                audio.currentTime = 0;
            }
        } catch (e) {
            console.warn("Impossible de rembobiner l'audio :", e);
        }

        console.log("▶️ Lancement de l'audio...");

        audio
            .play()
            .then(() => {
                console.log('✅ Audio en cours de lecture pour', durationMs, 'ms');

                setTimeout(() => {
                    audio.pause();
                    console.log('⏸️ Audio coupé pile à temps !');
                    setIsPlaying(false);
                }, durationMs);
            })
            .catch((err) => {
                console.error('❌ Le navigateur a bloqué la lecture :', err);
                setIsPlaying(false);
                alert('Erreur de lecture. Regarde la console (F12) !');
            });
    }, [isReady, isPlaying, durationMs]);

    return {
        isReady,
        isPlaying,
        playSnippet,
    };
};
