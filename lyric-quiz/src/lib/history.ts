import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { Song, GameStatus } from '../types';
import { Storage } from './storage'; // NOUVEL IMPORT

export const saveGameResult = async (
    user: User | null,
    isGuest: boolean,
    song: Song,
    scorePercentage: number,
    status: GameStatus,
    timeLeft: number
) => {
    const historyData = {
        song_id: song.id.toString(),
        song_title: song.title,
        artist_name: song.artist.name,
        score_percentage: scorePercentage,
        status: status,
        time_left: timeLeft,
        created_at: new Date().toISOString()
    };

    if (user) {
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
        // CAS B : Utilisation du nouvel adaptateur (Plus de localStorage direct !)
        Storage.addGuestHistory(historyData);
        console.log("Score sauvegardé en local via l'adaptateur ! 💾");
    }
};