// src/components/SyncModal.tsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { supabase } from '../../lib/supabase.ts';

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
                created_at: game.created_at,
            }));

            // On envoie tout d'un coup !
            const { error } = await supabase.from('game_history').insert(formattedHistory);

            if (error) throw error;

            // Si c'est un succès, on vide le stockage local
            localStorage.removeItem('guest_history');
            onComplete(); // On ferme la modale
        } catch (error) {
            console.error('Erreur lors de la synchronisation :', error);
            alert('Une erreur est survenue lors de la synchronisation.');
            setIsSyncing(false);
        }
    };

    const handleDecline = () => {
        // S'il refuse, on vide le stockage local pour ne plus lui redemander
        localStorage.removeItem('guest_history');
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
            <div className="animate-fade-in-up w-full max-w-md rounded-3xl border border-neutral-700 bg-neutral-800 p-8 text-center shadow-2xl">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-600/20 text-pink-500">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </div>

                <h2 className="mb-3 text-2xl font-bold">Synchronisation</h2>
                <p className="mb-8 leading-relaxed text-neutral-400">
                    Nous avons trouvé{' '}
                    <strong className="text-white">{guestHistory.length} partie(s)</strong> jouée(s)
                    en mode invité. Veux-tu les ajouter à ton nouveau compte ?
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full rounded-xl bg-pink-600 px-6 py-4 font-bold text-white transition-all hover:bg-pink-500 disabled:opacity-50"
                    >
                        {isSyncing ? 'Synchronisation...' : 'Oui, sauvegarder mes scores'}
                    </button>
                    <button
                        onClick={handleDecline}
                        disabled={isSyncing}
                        className="w-full rounded-xl bg-neutral-700 px-6 py-4 font-bold text-white transition-all hover:bg-neutral-600"
                    >
                        Non, les effacer
                    </button>
                </div>
            </div>
        </div>
    );
}
