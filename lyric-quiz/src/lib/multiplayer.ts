import { supabase } from './supabase';
import { MultiplayerMatch, Song } from '../types';

/**
 * 1. Créer une nouvelle partie (Hôte)
 * Génère un ID unique et insère la playlist complète en base.
 */
export const createMatch = async (hostId: string, playlist: Song[]): Promise<string | null> => {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
        const { error } = await supabase.from('multiplayer_matches').insert([
            {
                id: matchId,
                host_id: hostId,
                playlist: playlist,
                status: 'waiting',
                host_score: 0,
                guest_score: 0,
            },
        ]);

        if (error) throw error;
        return matchId;
    } catch (err) {
        console.error('Erreur lors de la création du match :', err);
        return null;
    }
};

/**
 * 2. Rejoindre une partie existante (Invité)
 * Met à jour le match avec l'ID de l'invité et passe le statut en "playing".
 */
export const joinMatch = async (matchId: string, guestId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('multiplayer_matches')
            .update({
                guest_id: guestId,
                status: 'playing',
            })
            .eq('id', matchId)
            .eq('status', 'waiting'); // Sécurité : On ne peut rejoindre qu'une partie en attente

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Erreur lors de la connexion au match :', err);
        return false;
    }
};

/**
 * 3. Mettre à jour le score (Fin de chaque round)
 */
export const updateMatchScore = async (
    matchId: string,
    role: 'host' | 'guest',
    newScore: number
): Promise<void> => {
    try {
        const updateData = role === 'host' ? { host_score: newScore } : { guest_score: newScore };

        await supabase.from('multiplayer_matches').update(updateData).eq('id', matchId);
    } catch (err) {
        console.error('Erreur lors de la mise à jour du score :', err);
    }
};

/**
 * 4. Déclarer l'abandon (Ragequit ou déconnexion volontaire)
 */
export const abandonMatch = async (matchId: string): Promise<void> => {
    try {
        await supabase
            .from('multiplayer_matches')
            .update({ status: 'abandoned' })
            .eq('id', matchId);
    } catch (err) {
        console.error("Erreur lors de l'abandon du match :", err);
    }
};

/**
 * ⚡ 5. LA MAGIE DU TEMPS RÉEL (Supabase Realtime)
 * Écoute les modifications de la ligne du match et déclenche un callback à chaque changement.
 */
export const subscribeToMatch = (matchId: string, onUpdate: (match: MultiplayerMatch) => void) => {
    const channel = supabase
        .channel(`match_${matchId}`)
        .on(
            'postgres_changes',
            {
                event: '*', // Écoute tous les événements (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'multiplayer_matches',
                filter: `id=eq.${matchId}`,
            },
            (payload) => {
                // Dès qu'une donnée change en DB (ex: l'autre joueur gagne des points),
                // cette fonction est appelée avec les nouvelles données !
                onUpdate(payload.new as MultiplayerMatch);
            }
        )
        .subscribe();

    // Retourne la fonction pour se désabonner quand on quitte la page
    return () => {
        supabase.removeChannel(channel);
    };
};
