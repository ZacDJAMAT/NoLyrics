import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const handleSessionChange = async (sessionUser: User | null) => {
        const currentIsGuest = sessionUser?.is_anonymous || false;

        if (sessionUser && !currentIsGuest) {
            const pendingAnonId = localStorage.getItem('pending_anon_id');

            if (pendingAnonId && pendingAnonId !== sessionUser.id) {
                // 👉 1. On supprime l'ID IMMÉDIATEMENT pour éviter les conflits entre la popup et la fenêtre principale
                localStorage.removeItem('pending_anon_id');

                const { error } = await supabase.rpc('merge_anon_data', { anon_id: pendingAnonId });

                if (error) {
                    // 👉 2. On ignore la fausse erreur liée à la fermeture de la fenêtre
                    if (
                        !error.message.includes('Failed to fetch') &&
                        !error.message.includes('fetch')
                    ) {
                        alert('Erreur de transfert de vos données : ' + error.message);
                    }
                } else {
                    setTimeout(() => window.location.reload(), 500);
                }
            } else if (pendingAnonId === sessionUser.id) {
                localStorage.removeItem('pending_anon_id');
            }
        }

        setUser(sessionUser);
        setIsGuest(currentIsGuest);
        setIsLoading(false);
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (error) {
                    await supabase.auth.signOut();
                    setUser(null);
                    setIsGuest(false);
                } else {
                    await handleSessionChange(session?.user || null);
                }

                if (session?.user && window.opener) {
                    window.close();
                }
            } catch {
                await supabase.auth.signOut();
                setUser(null);
                setIsGuest(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            // 👉 3. Correction TS2367 : On utilise uniquement SIGNED_OUT
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsGuest(false);
                setIsLoading(false);
            } else {
                await handleSessionChange(session?.user || null);
            }

            if (session?.user && window.opener) {
                window.close();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        if (isGuest && user) {
            localStorage.setItem('pending_anon_id', user.id);
        }

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
        localStorage.removeItem('pending_anon_id');
        await supabase.auth.signOut();
        setUser(null);
        setIsGuest(false);
    };

    const continueAsGuest = async () => {
        setIsLoading(true);
        localStorage.removeItem('pending_anon_id');

        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
            alert('Erreur de connexion invité : ' + error.message);
        } else if (data.user) {
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
    if (context === undefined)
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
    return context;
};
