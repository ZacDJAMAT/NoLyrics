import { useState, useEffect, useCallback } from 'react';
import { SelectionItem } from '@/pages/fillyrics/FillyricsLobbyScreen';

export interface RecentGame {
    id: string; // Un ID unique basé sur les IDs des artistes
    artists: SelectionItem[];
    timestamp: number;
}

const STORAGE_KEY = 'recent_blindtests';

export const useRecentBlindTests = () => {
    const [recentGames, setRecentGames] = useState<RecentGame[]>([]);

    // 1. Charger l'historique au démarrage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setRecentGames(JSON.parse(stored));
            } catch (e) {
                console.error("Erreur lors de la lecture de l'historique :", e);
            }
        }
    }, []);

    // 2. Sauvegarder une nouvelle partie
    const saveSelection = useCallback((selection: SelectionItem[]) => {
        if (!selection || selection.length === 0) return;

        // On crée une empreinte unique (ex: "id1-id2-id3") pour détecter les parties identiques
        const uniqueId = selection
            .map((s) => s.id)
            .sort()
            .join('-');

        setRecentGames((prev) => {
            // On retire l'ancienne partie si elle existait déjà (pour la remonter tout en haut)
            const filtered = prev.filter((game) => game.id !== uniqueId);

            const newGame: RecentGame = {
                id: uniqueId,
                artists: selection,
                timestamp: Date.now(),
            };

            // On ajoute la nouvelle et on coupe à 5 maximum !
            const updated = [newGame, ...filtered].slice(0, 5);

            // On sauvegarde physiquement dans le navigateur
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    return { recentGames, saveSelection };
};
