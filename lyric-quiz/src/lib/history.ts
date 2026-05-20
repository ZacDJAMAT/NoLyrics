import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { GameStatus, Song } from '../types';

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

export const trackUserEvent = async (
    user: User | null,
    songId: string | number,
    artistName: string, // 👈 NOUVEAU
    actionType: 'skip' | 'commit' | 'won' | 'lost',
    durationMs: number
) => {
    if (!user) return;

    try {
        await supabase.from('user_events').insert([
            {
                user_id: user.id,
                song_id: songId.toString(),
                artist_name: artistName, // 👈 NOUVEAU
                action_type: actionType,
                duration_ms: durationMs,
            },
        ]);
    } catch (error) {
        console.error('Erreur télémétrie Supabase :', error);
    }
};

export const getSmartArtists = async (user: User | null): Promise<string[]> => {
    if (!user) return [];
    try {
        const { data, error } = await supabase.rpc('get_smart_artists_v2', { p_user_id: user.id });
        if (error || !data) return [];

        // On ne garde que les artistes que l'utilisateur n'a pas rejetés massivement (score >= 0)
        return data
            .filter((row: any) => row.affinity_score >= 0)
            .map((row: any) => row.artist_name);
    } catch (err) {
        console.error('Erreur récupération recommandations:', err);
        return [];
    }
};

// ⚡ NOUVEAU : Le Défibrillateur (Trouver une victoire passée)
export const getEasyWinSongId = async (user: User | null): Promise<string | null> => {
    if (!user) return null;
    try {
        // On cherche jusqu'à 20 victoires passées du joueur
        const { data, error } = await supabase
            .from('history_fillyrics')
            .select('song_id')
            .eq('user_id', user.id)
            .eq('status', 'won')
            .limit(20);

        if (error || !data || data.length === 0) return null;

        // On en tire une au hasard pour créer la surprise positive
        const randomTrack = data[Math.floor(Math.random() * data.length)];
        return randomTrack.song_id;
    } catch (err) {
        console.error('Erreur Défibrillateur:', err);
        return null;
    }
};

// ⚡ NOUVEAU : Sauvegarde d'un round du Blind Test Extrême (Mis à jour)
export const saveBlindTestResult = async (
    user: User | null,
    sessionId: string,
    song: Song,
    roundIndex: number,
    status: 'won' | 'lost',
    timeLeft: number,
    pointsEarned: number,
    artistId: string, // 👈 NOUVEAU
    artistImage: string // 👈 NOUVEAU
) => {
    if (!user) return; // Les guests ont un `user`, donc ça passera !

    try {
        await supabase.from('history_blindtest').insert([
            {
                session_id: sessionId,
                user_id: user.id,
                song_id: song.id.toString(),
                song_title: song.title,
                artist_name: song.artist.name,
                round_index: roundIndex,
                status: status,
                time_left: timeLeft,
                points_earned: pointsEarned,
                artist_id: artistId, // 👈 NOUVEAU
                artist_image: artistImage, // 👈 NOUVEAU
            },
        ]);
    } catch (error) {
        console.error('Erreur sauvegarde Blind Test :', error);
    }
};

// ⚡ NOUVEAU : Sauvegarde d'une SESSION de Blind Test (Intention initiale)
export const saveBlindTestSession = async (
    user: User | null,
    sessionId: string,
    selection: any[]
) => {
    if (!user || !selection || selection.length === 0) return;

    try {
        await supabase.from('blindtest_sessions').insert([
            {
                session_id: sessionId,
                user_id: user.id,
                selected_artists: selection, // Supabase va automatiquement le transformer en JSONB
            },
        ]);
    } catch (error) {
        console.error('Erreur sauvegarde Session Blind Test :', error);
    }
};

// ==============================================================
// 🧠 ALGORITHME DE RÉCUPÉRATION DES PARTIES RÉCENTES (BLIND TEST)
// ==============================================================

export interface RecentGame {
    id: string;
    artists: any[]; // Notre tableau d'artistes
    timestamp: number;
}

export const getRecentBlindTestSessions = async (user: User | null): Promise<RecentGame[]> => {
    if (!user) return [];

    try {
        // 1. On récupère un plus grand lot (ex: 30) pour avoir de la marge lors du filtrage
        const { data, error } = await supabase
            .from('blindtest_sessions')
            .select('session_id, selected_artists, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30);

        if (error || !data) {
            console.error('Erreur SQL récupération sessions :', error);
            return [];
        }

        // 2. On filtre pour ne garder que les combinaisons UNIQUES
        const recentGames: RecentGame[] = [];
        const seenCombos = new Set<string>();

        for (const row of data) {
            // On crée une empreinte unique en triant les IDs des artistes (ex: "123-456")
            const comboId = row.selected_artists
                .map((a: any) => a.id)
                .sort()
                .join('-');

            // Si on n'a jamais vu cette combinaison précise, on l'ajoute
            if (!seenCombos.has(comboId)) {
                seenCombos.add(comboId);

                recentGames.push({
                    id: row.session_id, // L'ID de la session la plus récente pour cette combo
                    artists: row.selected_artists,
                    timestamp: new Date(row.created_at).getTime(),
                });
            }

            // On s'arrête net dès qu'on a nos 5 cartes uniques
            if (recentGames.length >= 5) break;
        }

        return recentGames;
    } catch (err) {
        console.error('Erreur getRecentBlindTestSessions:', err);
        return [];
    }
};
