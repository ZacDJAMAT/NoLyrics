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

    // Fonction centralisée pour gérer la session et la fusion
    const handleSessionChange = async (sessionUser: User | null) => {
        const currentIsGuest = sessionUser?.is_anonymous || false;

        // 👉 LOGIQUE DE FUSION (MERGE)
        if (sessionUser && !currentIsGuest) {
            const pendingAnonId = localStorage.getItem('pending_anon_id');

            if (pendingAnonId && pendingAnonId !== sessionUser.id) {
                console.log('Fusion des données anonymes vers le compte principal...');
                await supabase.rpc('merge_anon_data', { anon_id: pendingAnonId });
                localStorage.removeItem('pending_anon_id');
            } else if (pendingAnonId === sessionUser.id) {
                // Supabase a fait l'upgrade automatiquement (Nouveau compte)
                localStorage.removeItem('pending_anon_id');
            }
        }

        setUser(sessionUser);
        setIsGuest(currentIsGuest);
        setIsLoading(false);
    };

    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            await handleSessionChange(session?.user || null);

            if (session?.user && window.opener) {
                window.close();
            }
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            await handleSessionChange(session?.user || null);

            if (session?.user && window.opener) {
                window.close();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        // 👉 On sauvegarde l'ID anonyme avant de partir sur Google
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
        localStorage.removeItem('pending_anon_id'); // Sécurité
        await supabase.auth.signOut();
        setUser(null);
        setIsGuest(false);
    };

    const continueAsGuest = async () => {
        setIsLoading(true);
        localStorage.removeItem('pending_anon_id'); // Sécurité

        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
            console.error('Erreur lors de la connexion anonyme :', error.message);
            alert('Erreur Supabase : ' + error.message);
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
