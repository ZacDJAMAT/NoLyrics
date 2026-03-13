import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Ajuste le chemin vers ton client Supabase si besoin

export interface WordStat {
    word: string;
    missCount: number;
    successRate: number; // Pourcentage de fois où le mot a été trouvé (0-100)
}

export interface GlobalSongStats {
    totalPlays: number;
    averageScore: number;
    perfectScores: number;
    wordStats: Record<string, WordStat>; // Un dictionnaire pour trouver le score d'un mot instantanément
    hardestWord: WordStat | null;
}

export function useSongStats(songId: string | undefined) {
    const [stats, setStats] = useState<GlobalSongStats | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!songId) return;

        const fetchStats = async () => {
            setIsLoading(true);
            try {
                // 1. On récupère TOUTES les parties jouées sur cette musique
                // On ne prend que le score et les mots manqués pour que la requête soit ultra légère
                const { data, error } = await supabase
                    .from('game_history')
                    .select('score_percentage, missing_words')
                    .eq('song_id', songId);

                if (error) throw error;

                // S'il n'y a encore aucune partie jouée
                if (!data || data.length === 0) {
                    setStats({
                        totalPlays: 0,
                        averageScore: 0,
                        perfectScores: 0,
                        wordStats: {},
                        hardestWord: null
                    });
                    return;
                }

                const totalPlays = data.length;
                let totalScore = 0;
                let perfectScores = 0;
                const missCounts: Record<string, number> = {};

                // 2. On parcourt chaque partie jouée
                data.forEach(game => {
                    totalScore += game.score_percentage;
                    if (game.score_percentage === 100) perfectScores++;

                    // On compte combien de fois chaque mot a été raté
                    if (Array.isArray(game.missing_words)) {
                        game.missing_words.forEach((word: string) => {
                            missCounts[word] = (missCounts[word] || 0) + 1;
                        });
                    }
                });

                // 3. On calcule les pourcentages de réussite pour chaque mot raté
                const wordStats: Record<string, WordStat> = {};
                let hardestWord: WordStat | null = null;
                let maxMisses = -1;

                Object.entries(missCounts).forEach(([word, missCount]) => {
                    // Calcul : (Total de parties - Nombre de ratés) / Total de parties
                    const successRate = Math.round(((totalPlays - missCount) / totalPlays) * 100);

                    const stat = { word, missCount, successRate };
                    wordStats[word] = stat;

                    // On cherche le mot le plus difficile (celui avec le plus grand missCount)
                    if (missCount > maxMisses) {
                        maxMisses = missCount;
                        hardestWord = stat;
                    }
                });

                // 4. On met à jour notre état avec toutes ces belles données !
                setStats({
                    totalPlays,
                    averageScore: Math.round(totalScore / totalPlays),
                    perfectScores,
                    wordStats,
                    hardestWord
                });

            } catch (error) {
                console.error("Erreur lors de la récupération des statistiques globales :", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [songId]);

    return { stats, isLoading };
}