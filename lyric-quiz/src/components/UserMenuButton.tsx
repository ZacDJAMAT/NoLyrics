import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

export default function UserMenuButton() {
    const { user, isGuest, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    // Si l'utilisateur est un invité
    if (isGuest && !user) {
        return (
            <Button
                onClick={loginWithGoogle}
                className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 rounded-xl font-texte text-base transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                title="Conserve ton historique en te connectant"
            >
                {/* NOUVEAU LOGO : Icône utilisateur neutre et stylisée */}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Se connecter
            </Button>
        );
    }

    // Si l'utilisateur est connecté
    if (user) {
        const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U';

        return (
            <button
                onClick={() => navigate('/profile')}
                title="Mon Profil"
                // Le bouton extérieur devient aussi rond pour que le survol (hover) soit circulaire
                className="flex items-center justify-center bg-card hover:bg-muted border border-border p-1.5 rounded-full transition-all shadow-md group"
            >
                {/* L'avatar passe en rounded-full (cercle parfait) */}
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-titre text-xl shadow-[0_0_10px_rgba(232,28,255,0.4)] group-hover:scale-105 transition-transform">
                    {initial}
                </div>
            </button>
        );
    }

    return null;
}