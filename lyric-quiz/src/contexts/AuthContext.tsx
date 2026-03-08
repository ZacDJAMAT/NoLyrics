import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Storage } from '../lib/storage'; // NOUVEL IMPORT

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

            // Utilisation de l'adaptateur au lieu de localStorage
            const storedGuest = Storage.getGuestStatus();
            if (!session?.user && storedGuest) {
                setIsGuest(true);
            }

            setIsLoading(false);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                setIsGuest(false);
                Storage.setGuestStatus(false); // Utilisation de l'adaptateur
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsGuest(false);
        Storage.setGuestStatus(false); // Utilisation de l'adaptateur
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        Storage.setGuestStatus(true); // Utilisation de l'adaptateur
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