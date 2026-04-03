import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { Song, GameStatus } from '../types';

export const saveGameResult = async (
    user: User | null,
    song: Song,
    scorePercentage: number,
    status: GameStatus,
    timeLeft: number,
    usedHint: boolean,
    missingWords: string[]
) => {
    if (!user) return;

    try {
        await supabase.from('game_history').insert([
            {
                user_id: user.id,
                song_id: song.id.toString(),
                song_title: song.title,
                artist_name: song.artist.name,
                score_percentage: scorePercentage,
                status: status,
                time_left: timeLeft,
                used_hint: usedHint,
                missing_words: missingWords,
            },
        ]);
    } catch {
        // Échec silencieux
    }
};

export const saveFillyricsResult = async (
    user: User | null,
    song: Song,
    points: number,
    threshold: number,
    targetWords: number,
    status: GameStatus,
    sessionId: string,
    roundIndex: number, // 👈 Nouveau paramètre
    speedMultiplier: number // 👈 Nouveau paramètre
) => {
    if (!user) return;

    try {
        await supabase.from('history_fillyrics').insert([
            {
                session_id: sessionId,
                user_id: user.id,
                song_id: song.id.toString(),
                song_title: song.title,
                artist_name: song.artist.name,
                points: points,
                contract_threshold: threshold,
                target_words: targetWords,
                round_index: roundIndex, // 👈 Nouvelle colonne
                speed_multiplier: speedMultiplier, // 👈 Nouvelle colonne
                status: status === 'won' ? 'won' : 'lost',
            },
        ]);
    } catch (error) {
        console.error('Erreur de sauvegarde Supabase :', error);
    }
};