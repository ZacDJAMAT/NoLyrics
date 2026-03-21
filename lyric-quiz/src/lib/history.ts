import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { Song, GameStatus } from '../types';

// ============================================================================
// 1. SAUVEGARDE CLASSIQUE (Pour le mode AllMusic)
// ============================================================================
export const saveGameResult = async (
    user: User | null,
    isGuest: boolean,
    song: Song,
    scorePercentage: number,
    status: GameStatus,
    timeLeft: number,
    usedHint: boolean,
    missingWords: string[]
) => {
    const historyData = {
        song_id: song.id.toString(),
        song_title: song.title,
        artist_name: song.artist.name,
        score_percentage: scorePercentage,
        status: status,
        time_left: timeLeft,
        used_hint: usedHint,
        missing_words: missingWords,
        created_at: new Date().toISOString(),
    };

    if (user) {
        try {
            const { error } = await supabase.from('game_history').insert([
                {
                    user_id: user.id,
                    ...historyData,
                },
            ]);

            if (error) {
                console.error('Erreur lors de la sauvegarde Supabase :', error);
            } else {
                console.log('Score AllMusic sauvegardé sur le cloud ! ☁️');
            }
        } catch (err) {
            console.error(err);
        }
    } else if (isGuest) {
        const existingHistory = localStorage.getItem('guest_history');
        const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
        historyArray.push(historyData);
        localStorage.setItem('guest_history', JSON.stringify(historyArray));
        console.log('Score AllMusic sauvegardé en local ! 💾');
    }
};

// ============================================================================
// 2. NOUVELLE SAUVEGARDE SÉPARÉE (Pour le mode Fillyrics / Contrats)
// ============================================================================
export const saveFillyricsResult = async (
    user: User | null,
    isGuest: boolean,
    song: Song,
    points: number,
    threshold: number,
    targetWords: number,
    status: GameStatus
) => {
    // Les données spécifiques au format Fillyrics
    const historyData = {
        song_id: song.id.toString(),
        song_title: song.title,
        artist_name: song.artist.name,
        points: points,
        contract_threshold: threshold,
        target_words: targetWords,
        status: status === 'won' ? 'won' : 'lost',
        created_at: new Date().toISOString(),
    };

    if (user) {
        try {
            // 👉 Envoi vers la nouvelle table dédiée
            const { error } = await supabase.from('history_fillyrics').insert([
                {
                    user_id: user.id,
                    ...historyData,
                },
            ]);

            if (error) {
                console.error('Erreur lors de la sauvegarde Supabase Fillyrics :', error);
            } else {
                console.log('Score Fillyrics sauvegardé sur le cloud ! ☁️');
            }
        } catch (err) {
            console.error(err);
        }
    } else if (isGuest) {
        // Sauvegarde locale distincte pour ne pas mélanger les données JSON
        const existingHistory = localStorage.getItem('guest_fillyrics_history');
        const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
        historyArray.push(historyData);
        localStorage.setItem('guest_fillyrics_history', JSON.stringify(historyArray));
        console.log('Score Fillyrics sauvegardé en local ! 💾');
    }
};
