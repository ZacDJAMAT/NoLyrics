import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Favorite {
    id: string;
    user_id: string;
    item_type: 'artist' | 'song';
    item_id: string;
    item_name: string;
    image_url: string;
}

export function useFavorites() {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [isLoadingFavs, setIsLoadingFavs] = useState<boolean>(true);

    // 1. Récupérer tous les favoris au chargement
    const fetchFavorites = useCallback(async () => {
        if (!user) {
            setFavorites([]);
            setIsLoadingFavs(false);
            return;
        }

        setIsLoadingFavs(true);
        const { data, error } = await supabase
            .from('user_favorites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur lors de la récupération des favoris :', error);
        } else {
            setFavorites(data || []);
        }
        setIsLoadingFavs(false);
    }, [user]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    // 2. Ajouter ou retirer un favori (Optimistic UI)
    const toggleFavorite = async (
        item_type: 'artist' | 'song',
        item_id: string,
        item_name: string,
        image_url: string
    ) => {
        if (!user) {
            // Optionnel : tu pourrais ouvrir ta modale de connexion ici
            alert('Tu dois être connecté pour ajouter des favoris !');
            return;
        }

        // On regarde si cet élément est déjà dans nos favoris
        const existingFav = favorites.find(
            (f) => f.item_type === item_type && f.item_id === item_id
        );

        if (existingFav) {
            // Mettre à jour l'interface instantanément (on le retire)
            setFavorites((prev) => prev.filter((f) => f.id !== existingFav.id));

            // Envoyer la requête à Supabase
            const { error } = await supabase
                .from('user_favorites')
                .delete()
                .eq('id', existingFav.id);

            if (error) {
                console.error('Erreur suppression favori:', error);
                fetchFavorites(); // En cas d'erreur, on annule et on recharge les vraies données
            }
        } else {
            // Mettre à jour l'interface instantanément (on l'ajoute avec un faux ID temporaire)
            const tempId = `temp-${Date.now()}`;
            const newFav: Favorite = {
                id: tempId,
                user_id: user.id,
                item_type,
                item_id,
                item_name,
                image_url,
            };
            setFavorites((prev) => [newFav, ...prev]);

            // Envoyer la requête à Supabase
            const { data, error } = await supabase
                .from('user_favorites')
                .insert([{ user_id: user.id, item_type, item_id, item_name, image_url }])
                .select()
                .single();

            if (error) {
                console.error('Erreur ajout favori:', error);
                fetchFavorites(); // Rollback en cas d'erreur
            } else if (data) {
                // On remplace le faux ID par le vrai ID généré par Supabase
                setFavorites((prev) => prev.map((f) => (f.id === tempId ? data : f)));
            }
        }
    };

    // 3. Fonction utilitaire pour savoir si un élément est en favori
    const isFavorite = useCallback(
        (item_type: 'artist' | 'song', item_id: string) => {
            return favorites.some((f) => f.item_type === item_type && f.item_id === item_id);
        },
        [favorites]
    );

    return {
        favorites,
        isLoadingFavs,
        toggleFavorite,
        isFavorite,
        refreshFavorites: fetchFavorites,
    };
}
