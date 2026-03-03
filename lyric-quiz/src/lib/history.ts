import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { Song, GameStatus } from '../types';

export const saveGameResult = async (
    user: User | null,
    isGuest: boolean,
    song: Song,
    scorePercentage: number,
    status: GameStatus,
    timeLeft: number
) => {
    // 1. On prépare le "colis" avec les données exactes attendues par la base de données
    const historyData = {
        song_id: song.id.toString(),
        song_title: song.title,
        artist_name: song.artist.name,
        score_percentage: scorePercentage,
        status: status,
        time_left: timeLeft,
        // Note : Supabase gère le 'created_at' tout seul, mais on l'ajoute pour le local
        created_at: new Date().toISOString()
    };

    if (user) {
        // 2. CAS A : Le joueur est connecté -> Envoi vers Supabase
        try {
            const { error } = await supabase.from('game_history').insert([{
                user_id: user.id,
                ...historyData
            }]);

            if (error) {
                console.error("Erreur lors de la sauvegarde Supabase :", error);
            } else {
                console.log("Score sauvegardé sur le cloud ! ☁️");
            }
        } catch (err) {
            console.error(err);
        }
    } else if (isGuest) {
        // 3. CAS B : Le joueur est invité -> Sauvegarde dans le navigateur
        const existingHistory = localStorage.getItem('guest_history');
        const historyArray = existingHistory ? JSON.parse(existingHistory) : [];

        // On ajoute la nouvelle partie à la fin de la liste
        historyArray.push(historyData);
        localStorage.setItem('guest_history', JSON.stringify(historyArray));
        console.log("Score sauvegardé en local ! 💾");
    }
};