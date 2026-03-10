import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Storage } from '../lib/storage';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);

            const storedGuest = Storage.getGuestStatus();
            if (!session?.user && storedGuest) {
                setIsGuest(true);
            }

            // NOUVEAU : Si on est dans le nouvel onglet et que la session est bonne, on ferme l'onglet !
            if (session?.user && window.opener) {
                window.close();
            }

            setIsLoading(false);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                setIsGuest(false);
                Storage.setGuestStatus(false);

                // NOUVEAU : Fermeture automatique de l'onglet juste après la connexion réussie
                if (window.opener) {
                    window.close();
                }
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        // 1. On ouvre un onglet vide TOUT DE SUITE pour contourner les bloqueurs de popups des navigateurs
        const authWindow = window.open('', '_blank');

        // 2. On demande à Supabase de NE PAS nous rediriger, mais de nous donner l'URL Google
        const { data } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                skipBrowserRedirect: true
            }
        });

        // 3. On envoie notre nouvel onglet vers l'URL de connexion
        if (data?.url && authWindow) {
            authWindow.location.href = data.url;
        } else if (authWindow) {
            // S'il y a une erreur, on referme l'onglet vide
            authWindow.close();
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsGuest(false);
        Storage.setGuestStatus(false);
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        Storage.setGuestStatus(true);
    };

    return (
        <AuthContext.Provider value={{ user, isGuest, isLoading, loginWithGoogle, logout, continueAsGuest }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
    }
    return context;
};