import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { Song, GameStatus } from '../types';

// 1. SAUVEGARDE ALLMUSIC
export const saveGameResult = async (
    user: User | null,
    song: Song,
    scorePercentage: number,
    status: GameStatus,
    timeLeft: number,
    usedHint: boolean,
    missingWords: string[]
) => {
    if (!user) return; // Sécurité de base

    try {
        const { error } = await supabase.from('game_history').insert([
            {
                user_id: user.id, // Fonctionne pour les vrais comptes ET les comptes anonymes
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

        if (error) console.error('Erreur BDD :', error);
    } catch (err) {
        console.error(err);
    }
};

// 2. SAUVEGARDE FILLYRICS
export const saveFillyricsResult = async (
    user: User | null,
    song: Song,
    points: number,
    threshold: number,
    targetWords: number,
    status: GameStatus
) => {
    if (!user) return;

    try {
        const { error } = await supabase.from('history_fillyrics').insert([
            {
                user_id: user.id,
                song_id: song.id.toString(),
                song_title: song.title,
                artist_name: song.artist.name,
                points: points,
                contract_threshold: threshold,
                target_words: targetWords,
                status: status === 'won' ? 'won' : 'lost',
            },
        ]);

        if (error) console.error('Erreur BDD :', error);
    } catch (err) {
        console.error(err);
    }
};
