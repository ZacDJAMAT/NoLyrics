import { useState, useCallback } from 'react';
import { Song, Artist } from '@/types';
import { getArtistTopTracks, fetchLyrics } from '@/utils/api';

export type RoundChoices = {
    easy: Song;
    medium: Song;
    hard: Song;
    targetWordCount: number;
};

// Utilitaire : Calcul de la complexité linguistique d'une chanson
const calculateLinguisticComplexity = (lyrics: string): number => {
    const cleanLyrics = lyrics.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');
    const words = cleanLyrics
        .replace(/[^a-zA-ZÀ-ÿ0-9]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 0);
    if (words.length === 0) return 0;

    // Complexité = Longueur moyenne des mots (plus les mots sont longs, plus c'est difficile)
    const avgLength = words.reduce((acc, w) => acc + w.length, 0) / words.length;
    return avgLength;
};

export const useFillyricsPreRound = () => {
    const [isPreparing, setIsPreparing] = useState(false);
    const [choices, setChoices] = useState<RoundChoices | null>(null);
    const [error, setError] = useState<string | null>(null);

    const prepareRound = useCallback(async (artist: Artist, playedSongIds: string[]) => {
        setIsPreparing(true);
        setError(null);
        setChoices(null);

        try {
            // 1. Définition du Contrat du Round (entre 5 et 10 mots)
            const roundWordCount = Math.floor(Math.random() * 6) + 5;

            const allTracks = await getArtistTopTracks(artist.id, 100);
            const availableTracks = allTracks.filter((t) => {
                const titleLower = t.title.toLowerCase();
                const isRemix =
                    titleLower.includes('remix') ||
                    titleLower.includes('edit') ||
                    titleLower.includes('version');
                return !playedSongIds.includes(t.id.toString()) && !isRemix;
            });

            if (availableTracks.length < 3) {
                throw new Error('Pas assez de musiques disponibles pour cet artiste.');
            }

            // Outil pour trouver une musique valide (qui a des paroles)
            const findValidTrack = async (pool: Song[]): Promise<Song | null> => {
                const shuffled = [...pool].sort(() => 0.5 - Math.random());
                for (const track of shuffled) {
                    try {
                        const lyrics = await fetchLyrics(track.artist.name, track.title);
                        // On s'assure qu'il y a assez de matière pour cacher roundWordCount mots + contexte
                        if (lyrics && lyrics.trim().length > 100) return track;
                    } catch (e) {}
                }
                return null;
            };

            let finalEasy: Song | null = null;
            let finalMedium: Song | null = null;
            let finalHard: Song | null = null;

            // 2. SCÉNARIO A : Grand Catalogue (>= 30 musiques) -> Basé sur la popularité
            if (availableTracks.length >= 30) {
                const easyPool = availableTracks.slice(0, 15);
                const mediumPool = availableTracks.slice(15, 50);
                const hardPool = availableTracks.slice(50);

                [finalEasy, finalMedium, finalHard] = await Promise.all([
                    findValidTrack(easyPool),
                    findValidTrack(mediumPool),
                    findValidTrack(hardPool),
                ]);
            }
            // 3. SCÉNARIO B : Petit Catalogue (< 30 musiques) -> Basé sur la Complexité Linguistique
            else {
                const validTracks: { song: Song; complexity: number }[] = [];
                const shuffled = [...availableTracks].sort(() => 0.5 - Math.random());

                // On cherche 3 pistes valides et on analyse leur texte
                for (const track of shuffled) {
                    if (validTracks.length >= 3) break;
                    try {
                        const lyrics = await fetchLyrics(track.artist.name, track.title);
                        if (lyrics && lyrics.trim().length > 100) {
                            validTracks.push({
                                song: track,
                                complexity: calculateLinguisticComplexity(lyrics),
                            });
                        }
                    } catch (e) {}
                }

                if (validTracks.length === 3) {
                    // On trie de la complexité la plus faible (Facile) à la plus forte (Difficile)
                    validTracks.sort((a, b) => a.complexity - b.complexity);
                    finalEasy = validTracks[0].song;
                    finalMedium = validTracks[1].song;
                    finalHard = validTracks[2].song;
                }
            }

            // Sécurité de remplissage si certains pools ont échoué
            const fallbackTrack = async (exclude: (string | undefined)[]) => {
                const fallbackPool = availableTracks.filter(
                    (t) => !exclude.includes(t.id.toString())
                );
                return await findValidTrack(fallbackPool);
            };

            finalEasy =
                finalEasy ||
                (await fallbackTrack([finalMedium?.id.toString(), finalHard?.id.toString()]));
            finalMedium =
                finalMedium ||
                (await fallbackTrack([finalEasy?.id.toString(), finalHard?.id.toString()]));
            finalHard =
                finalHard ||
                (await fallbackTrack([finalEasy?.id.toString(), finalMedium?.id.toString()]));

            if (!finalEasy || !finalMedium || !finalHard) {
                throw new Error('Impossible de trouver 3 musiques valides.');
            }

            // 4. On renvoie les choix ET le nombre de mots strict pour ce round !
            setChoices({
                easy: finalEasy,
                medium: finalMedium,
                hard: finalHard,
                targetWordCount: roundWordCount,
            });
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la préparation des contrats.');
        } finally {
            setIsPreparing(false);
        }
    }, []);

    return { prepareRound, isPreparing, choices, error };
};
