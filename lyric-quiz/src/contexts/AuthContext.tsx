import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// 1. On définit la forme de notre "Cerveau"
interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => void;
}

// 2. On crée le Context avec des valeurs par défaut vides
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. On crée le Provider (le composant qui va englober notre application)
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Au chargement, on vérifie si l'utilisateur est déjà connecté à Supabase
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);

            // Si on a un utilisateur en local storage qui était invité, on le récupère
            const storedGuest = localStorage.getItem('isGuest') === 'true';
            if (!session?.user && storedGuest) {
                setIsGuest(true);
            }

            setIsLoading(false);
        };

        checkSession();

        // On écoute les changements (ex: quand il clique sur "Se connecter avec Google")
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                setIsGuest(false); // S'il se connecte, il n'est plus invité
                localStorage.removeItem('isGuest');
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Les fonctions d'action
    const loginWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            // On redirige vers la page d'accueil après la connexion
            options: { redirectTo: window.location.origin }
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        localStorage.setItem('isGuest', 'true');
    };

    return (
        <AuthContext.Provider value={{ user, isGuest, isLoading, loginWithGoogle, logout, continueAsGuest }}>
            {children}
        </AuthContext.Provider>
    );
}

// 4. On crée un petit hook personnalisé pour utiliser tout ça facilement
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
    }
    return context;
};