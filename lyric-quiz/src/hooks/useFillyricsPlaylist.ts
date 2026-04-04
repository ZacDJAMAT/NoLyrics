import { useState, useEffect, useCallback, useRef } from 'react';
import { SelectionItem } from '@/pages/fillyrics/FillyricsLobbyScreen';
import { Song } from '@/types';
import {
    getArtistTopTracks,
    fetchLyrics,
    getTopArtists,
    searchArtists,
    getSongById,
} from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { getSmartArtists, getEasyWinSongId } from '@/lib/history';

const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const useFillyricsPlaylist = (initialSelection: SelectionItem[], reloadKey: number) => {
    const { user } = useAuth();
    const [playlist, setPlaylist] = useState<Song[]>([]);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [isMixing, setIsMixing] = useState(true);
    const [mixError, setMixError] = useState<string | null>(null);

    // 👉 NOUVEAU : Les états et mémoires pour la recharge infinie
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [isCatalogExhausted, setIsCatalogExhausted] = useState(false);

    // Le réservoir de musiques non encore vérifiées (80% - Affinité)
    const candidatePool = useRef<Song[]>([]);
    // 👉 NOUVEAU : Le réservoir de découvertes (20% - Exploration)
    const explorationPool = useRef<Song[]>([]);

    // Historique des musiques validées pour éviter les doublons
    const loadedSongIds = useRef<Set<string | number>>(new Set());

    // 👉 NOUVEAU : Mémoire à court terme pour l'anti-répétition
    const recentArtistIds = useRef<string[]>([]);

    const calculateCandidateScore = useCallback((candidate: Song) => {
        const artistId = candidate.artist.id.toString();
        let score = Math.random(); // 🎲 Base : Exploration aléatoire (entre 0 et 1)

        // 🧮 Pénalité progressive : On compte combien de fois l'artiste est passé
        const playCount = recentArtistIds.current.filter((id) => id === artistId).length;

        // On applique -0.4 par passage
        score -= 0.4 * playCount;

        return score;
    }, []);

    // 👉 NOUVEAU : La fonction qui pioche dans le réservoir
    const fetchNextBatch = useCallback(async (count: number = 10) => {
        const newTracks: Song[] = [];

        // Tant qu'on n'a pas notre compte ET qu'il reste des musiques
        while (
            newTracks.length < count &&
            (candidatePool.current.length > 0 || explorationPool.current.length > 0)
        ) {
            // ⚖️ REGLE DU 80/20 : La 5ème musique (index 4, 9, 14...) est une découverte
            const totalFetched = loadedSongIds.current.size + newTracks.length;
            const isExplorationSlot = (totalFetched + 1) % 5 === 0;

            let activePool = candidatePool;
            if (isExplorationSlot && explorationPool.current.length > 0) {
                activePool = explorationPool;
                console.log('🌍 [Queue Manager] Slot 20% activé : Exploration !');
            } else if (candidatePool.current.length === 0) {
                activePool = explorationPool;
            }

            // 🧠 1. On prend jusqu'à 15 candidats en haut du tas ACTIF
            const candidatesToScore = activePool.current.slice(0, 15);

            // 🧠 2. On les trie du meilleur au pire selon notre algorithme
            candidatesToScore.sort((a, b) => {
                return calculateCandidateScore(b) - calculateCandidateScore(a);
            });

            // 🧠 3. Le gagnant est le premier de la liste !
            const bestCandidate = candidatesToScore[0];

            // On l'enlève du réservoir principal pour ne pas le re-tester à l'infini
            const indexToRemove = activePool.current.findIndex((c) => c.id === bestCandidate.id);
            if (indexToRemove !== -1) {
                activePool.current.splice(indexToRemove, 1); // 👈 CORRIGÉ
            }

            // Sécurité anti-doublon
            if (loadedSongIds.current.has(bestCandidate.id)) continue;

            // Log pour suivre l'intelligence en action
            console.log(`🏆 [Sélectionné] ${bestCandidate.artist.name} - ${bestCandidate.title}`);

            try {
                // On vérifie les paroles pour le MEILLEUR candidat
                const rawLyrics = await fetchLyrics(bestCandidate.artist.name, bestCandidate.title);
                if (rawLyrics && rawLyrics.trim().length > 50) {
                    newTracks.push(bestCandidate);
                    loadedSongIds.current.add(bestCandidate.id); // On la marque comme utilisée

                    // 👉 NOUVEAU : On ajoute l'artiste à la mémoire récente
                    recentArtistIds.current.push(bestCandidate.artist.id.toString());
                    // On garde une mémoire des 10 derniers artistes maximum pour qu'ils puissent revenir plus tard
                    if (recentArtistIds.current.length > 10) {
                        recentArtistIds.current.shift();
                    }
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
            recentArtistIds.current = [];

            try {
                const artists = initialSelection.filter((item) => item.type === 'artist');

                let allTracks: Song[] = [];

                if (artists.length > 0) {
                    // 🟢 MODE CLASSIQUE (Panier rempli)
                    const artistIdsToFetch = artists.map((a) => a.data.id);
                    for (const id of artistIdsToFetch) {
                        const tracks = await getArtistTopTracks(id, 100);
                        allTracks = [...allTracks, ...tracks];
                    }

                    // 🚨 HOTFIX : On remplit le réservoir principal !
                    candidatePool.current = shuffleArray(allTracks);
                } else {
                    // 🚀 MODE "POUR TOI" (Panier vide)
                    const smartArtistNames = await getSmartArtists(user);

                    if (smartArtistNames.length > 0) {
                        // 🔥 WARM START : L'algorithme a trouvé des affinités !
                        const topNames = smartArtistNames.slice(0, 4);
                        for (const name of topNames) {
                            const searchResult = await searchArtists(name, 1, 1);
                            if (searchResult.results.length > 0) {
                                const tracks = await getArtistTopTracks(
                                    searchResult.results[0].id,
                                    100
                                );
                                allTracks = [...allTracks, ...tracks];
                            }
                        }
                        // Pour les habitués, on mélange tout !
                        candidatePool.current = shuffleArray(allTracks);
                    } else {
                        // ❄️ COLD START : Top Tendances France (Nouvel utilisateur)
                        try {
                            const trendingArtists = await getTopArtists(10);
                            if (trendingArtists.length > 0) {
                                const top3 = trendingArtists.slice(0, 3);
                                for (const artist of top3) {
                                    const tracks = await getArtistTopTracks(artist.id, 1);
                                    allTracks = [...allTracks, ...tracks];
                                }
                                const rest = trendingArtists.slice(3, 8);
                                for (const artist of rest) {
                                    const tracks = await getArtistTopTracks(artist.id, 5);
                                    allTracks = [...allTracks, ...tracks];
                                }
                            }
                        } catch (err) {
                            console.error('Erreur récupération tendances :', err);
                        }

                        if (allTracks.length === 0) {
                            const fallbackIds = ['4050205', '1188', '1063640']; // Jul, Gims, Angèle
                            for (const id of fallbackIds) {
                                const tracks = await getArtistTopTracks(id, 5);
                                allTracks = [...allTracks, ...tracks];
                            }
                        }

                        // IMPORTANT : On garde l'ordre des 3 Hits pour le Cold Start !
                        const top3Tracks = allTracks.slice(0, 3);
                        const remainingTracks = shuffleArray(allTracks.slice(3));
                        candidatePool.current = [...top3Tracks, ...remainingTracks];
                    }

                    // 🌍 REMPLISSAGE DU POOL D'EXPLORATION (Le fameux 20%)
                    // Ce bloc tourne pour tout le monde, Warm Start ou Cold Start.
                    try {
                        const trendingArtists = await getTopArtists(20);
                        const explorationIds = trendingArtists
                            .sort(() => 0.5 - Math.random())
                            .slice(0, 3)
                            .map((a) => a.id);

                        let exploreTracks: Song[] = [];
                        for (const id of explorationIds) {
                            const tracks = await getArtistTopTracks(id, 10);
                            exploreTracks = [...exploreTracks, ...tracks];
                        }
                        explorationPool.current = shuffleArray(exploreTracks);
                    } catch (e) {
                        console.error('Erreur pool exploration', e);
                    }
                }

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

    // 🚨 NOUVEAU : Le Pivot à 180° (Hyper-Reactive Profiling)
    const pivotAlgorithm = useCallback(async (currentIndex: number) => {
        console.log('🚨 [PIVOT 180°] Hard Skips détectés ! On purge le buffer !');

        // 1. On vide le réservoir de base
        candidatePool.current = [];

        // 2. On ampute la playlist pour supprimer les musiques pré-chargées
        setPlaylist((prev) => prev.slice(0, currentIndex + 1));

        // 3. On force des artistes "Secours" très accessibles (Pop/Variété : Stromae, Vianney, Soprano)
        const SECURE_ARTISTS = ['215920', '4201083', '11800'];
        let newTracks: Song[] = [];
        for (const id of SECURE_ARTISTS) {
            const tracks = await getArtistTopTracks(id, 5);
            newTracks = [...newTracks, ...tracks];
        }
        candidatePool.current = shuffleArray(newTracks);

        // 4. On relance le moteur pour remplir la suite du buffer
        setIsFetchingMore(false);
    }, []);

    // ⚡ NOUVEAU : Le Défibrillateur Émotionnel (Anti-Ragequit)
    const defibrillatorAlgorithm = useCallback(
        async (currentIndex: number) => {
            console.log(
                "⚡ [DÉFIBRILLATEUR] Joueur en détresse ! Injection d'une victoire garantie !"
            );

            // 1. On purge la mémoire et le buffer
            candidatePool.current = [];
            setPlaylist((prev) => prev.slice(0, currentIndex + 1));

            let newTracks: Song[] = [];

            // 2. On cherche une victoire passée
            const easySongId = await getEasyWinSongId(user);

            if (easySongId) {
                const song = await getSongById(easySongId);
                if (song) newTracks.push(song);
            }

            // 3. Fallback si aucune victoire passée (ex: nouveau joueur) : on met une musique ultra connue
            if (newTracks.length === 0) {
                const fallbackTracks = await getArtistTopTracks('1063640', 1); // Top 1 Angèle
                newTracks = fallbackTracks;
            }

            // 4. On force cette musique comme prochaine piste
            candidatePool.current = newTracks;
            setIsFetchingMore(false);
        },
        [user]
    );

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
        pivotAlgorithm,
        defibrillatorAlgorithm,
    };
};
