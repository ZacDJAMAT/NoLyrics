import { useState, useEffect, useCallback, useRef } from 'react';
import { SelectionItem } from '@/pages/fillyrics/FillyricsLobbyScreen';
import { Song } from '@/types';
import { getArtistTopTracks, fetchLyrics } from '@/utils/api';

const TRENDING_ARTIST_IDS = ['4050205', '1188', '1063640', '73568', '144227', '6220', '11800'];

const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const useFillyricsPlaylist = (initialSelection: SelectionItem[], reloadKey: number) => {
    const [playlist, setPlaylist] = useState<Song[]>([]);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [isMixing, setIsMixing] = useState(true);
    const [mixError, setMixError] = useState<string | null>(null);

    // 👉 NOUVEAU : Les états et mémoires pour la recharge infinie
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [isCatalogExhausted, setIsCatalogExhausted] = useState(false);

    // Le réservoir de musiques non encore vérifiées
    const candidatePool = useRef<Song[]>([]);
    // Historique des musiques validées pour éviter les doublons
    const loadedSongIds = useRef<Set<string | number>>(new Set());

    // 👉 NOUVEAU : La fonction qui pioche dans le réservoir
    const fetchNextBatch = useCallback(async (count: number = 10) => {
        const newTracks: Song[] = [];

        // Tant qu'on n'a pas notre compte ET qu'il reste des musiques dans le réservoir
        while (newTracks.length < count && candidatePool.current.length > 0) {
            // On prend la première musique du tas (et on l'enlève du réservoir)
            const candidate = candidatePool.current.shift();
            if (!candidate) continue;

            // Sécurité anti-doublon
            if (loadedSongIds.current.has(candidate.id)) continue;

            try {
                // On vérifie les paroles
                const rawLyrics = await fetchLyrics(candidate.artist.name, candidate.title);
                if (rawLyrics && rawLyrics.trim().length > 50) {
                    newTracks.push(candidate);
                    loadedSongIds.current.add(candidate.id); // On la marque comme utilisée
                }
            } catch (err) {
                // Paroles introuvables, on ignore silencieusement
            }
        }

        // Si le réservoir est vide après avoir fouillé, on signale l'épuisement
        if (candidatePool.current.length === 0) {
            setIsCatalogExhausted(true);
        }

        return newTracks;
    }, []);

    // Initialisation globale (Le premier chargement)
    useEffect(() => {
        let ignore = false;

        const initPlaylist = async () => {
            setIsMixing(true);
            setMixError(null);
            setCurrentRoundIndex(0);
            setIsCatalogExhausted(false);
            candidatePool.current = [];
            loadedSongIds.current.clear();

            try {
                const artists = initialSelection.filter((item) => item.type === 'artist');
                let artistIdsToFetch: (string | number)[] = [];

                if (artists.length > 0) {
                    artistIdsToFetch = artists.map((a) => a.data.id);
                } else {
                    artistIdsToFetch = [...TRENDING_ARTIST_IDS]
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 4);
                }

                let allTracks: Song[] = [];
                for (const id of artistIdsToFetch) {
                    const tracks = await getArtistTopTracks(id, 100);
                    allTracks = [...allTracks, ...tracks];
                }

                // 👉 On remplit le réservoir avec TOUTES les musiques mélangées
                candidatePool.current = shuffleArray(allTracks);

                if (ignore) return;

                // 👉 On pioche la première fournée de 10
                const initialTracks = await fetchNextBatch(10);

                if (ignore) return;

                if (initialTracks.length === 0) {
                    throw new Error(
                        'Impossible de générer le mix : aucune des musiques ne possède de paroles valides.'
                    );
                }

                setPlaylist(initialTracks);
            } catch (err: any) {
                if (!ignore) setMixError(err.message || 'Erreur lors de la préparation du mix.');
            } finally {
                if (!ignore) setIsMixing(false);
            }
        };

        initPlaylist();

        return () => {
            ignore = true;
        };
    }, [initialSelection, reloadKey, fetchNextBatch]);

    // 👉 NOUVEAU : La fonction publique pour demander plus de musiques
    const loadMore = useCallback(async () => {
        if (isFetchingMore || isCatalogExhausted || isMixing) return;

        setIsFetchingMore(true);
        const moreTracks = await fetchNextBatch(10);

        if (moreTracks.length > 0) {
            setPlaylist((prev) => [...prev, ...moreTracks]);
        }
        setIsFetchingMore(false);
    }, [isFetchingMore, isCatalogExhausted, isMixing, fetchNextBatch]);

    const nextRound = useCallback(() => {
        setCurrentRoundIndex((prev) => prev + 1);
    }, []);

    return {
        playlist,
        currentSong: playlist[currentRoundIndex],
        currentRoundIndex,
        totalRounds: playlist.length,
        isMixing,
        mixError,
        nextRound,
        isLastRound: currentRoundIndex === playlist.length - 1,
        // 👉 On exporte les nouveaux outils
        loadMore,
        isFetchingMore,
        isCatalogExhausted,
    };
};
