// src/components/SyncModal.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SyncModalProps {
    onComplete: () => void;
}

export default function SyncModal({ onComplete }: SyncModalProps) {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState<boolean>(false);

    // On récupère l'historique local
    const guestHistoryString = localStorage.getItem('guest_history');
    const guestHistory = guestHistoryString ? JSON.parse(guestHistoryString) : [];

    // Si pas d'historique local ou pas d'utilisateur, on ne montre rien
    if (!user || guestHistory.length === 0) {
        onComplete();
        return null;
    }

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // On prépare les données locales pour Supabase en ajoutant l'ID du nouvel utilisateur
            const formattedHistory = guestHistory.map((game: any) => ({
                user_id: user.id,
                song_id: game.song_id,
                song_title: game.song_title,
                artist_name: game.artist_name,
                score_percentage: game.score_percentage,
                status: game.status,
                time_left: game.time_left,
                created_at: game.created_at
            }));

            // On envoie tout d'un coup !
            const { error } = await supabase.from('game_history').insert(formattedHistory);

            if (error) throw error;

            // Si c'est un succès, on vide le stockage local
            localStorage.removeItem('guest_history');
            onComplete(); // On ferme la modale

        } catch (error) {
            console.error("Erreur lors de la synchronisation :", error);
            alert("Une erreur est survenue lors de la synchronisation.");
            setIsSyncing(false);
        }
    };

    const handleDecline = () => {
        // S'il refuse, on vide le stockage local pour ne plus lui redemander
        localStorage.removeItem('guest_history');
        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-neutral-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-neutral-700 text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-pink-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold mb-3">Synchronisation</h2>
                <p className="text-neutral-400 mb-8 leading-relaxed">
                    Nous avons trouvé <strong className="text-white">{guestHistory.length} partie(s)</strong> jouée(s) en mode invité. Veux-tu les ajouter à ton nouveau compte ?
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full bg-pink-600 hover:bg-pink-500 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {isSyncing ? 'Synchronisation...' : 'Oui, sauvegarder mes scores'}
                    </button>
                    <button
                        onClick={handleDecline}
                        disabled={isSyncing}
                        className="w-full bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-4 rounded-xl font-bold transition-all"
                    >
                        Non, les effacer
                    </button>
                </div>
            </div>
        </div>
    );
}