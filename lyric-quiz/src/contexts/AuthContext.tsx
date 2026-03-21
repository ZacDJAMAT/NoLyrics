import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => Promise<void>; // 👈 C'est maintenant une fonction asynchrone
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            setUser(session?.user || null);
            // 👉 Supabase nous dit directement si c'est un compte anonyme !
            setIsGuest(session?.user?.is_anonymous || false);

            if (session?.user && window.opener) {
                window.close();
            }

            setIsLoading(false);
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            setIsGuest(session?.user?.is_anonymous || false);

            if (session?.user && window.opener) {
                window.close();
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        const authWindow = window.open('', '_blank');

        const { data } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                skipBrowserRedirect: true,
            },
        });

        if (data?.url && authWindow) {
            authWindow.location.href = data.url;
        } else if (authWindow) {
            authWindow.close();
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsGuest(false);
    };

    const continueAsGuest = async () => {
        setIsLoading(true);

        // 1. On demande à Supabase de créer le compte anonyme
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
            console.error('Erreur lors de la connexion anonyme :', error.message);
            alert('Erreur Supabase : ' + error.message);
        } else if (data.user) {
            // 2. Mise à jour de l'interface immédiatement
            setUser(data.user);
            setIsGuest(true);
        }

        setIsLoading(false);
    };

    return (
        <AuthContext.Provider
            value={{ user, isGuest, isLoading, loginWithGoogle, logout, continueAsGuest }}
        >
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
