import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

interface UserMenuButtonProps {
    onClickOverride?: () => void;
}

export default function UserMenuButton({ onClickOverride }: UserMenuButtonProps) {
    const { user, isGuest, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleProfileClick = () => {
        if (onClickOverride) {
            onClickOverride();
        } else {
            navigate('/profile');
        }
    };

    if (isGuest && !user) {
        return (
            // On réduit le texte et le padding sur mobile
            <Button
                onClick={loginWithGoogle}
                className="flex items-center gap-1.5 md:gap-2 bg-white text-black hover:bg-neutral-200 rounded-xl font-texte text-xs md:text-base px-3 md:px-4 h-9 md:h-10 transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                title="Conserve ton historique en te connectant"
            >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Se connecter</span>
                <span className="inline sm:hidden">Connexion</span>
            </Button>
        );
    }

    if (user) {
        const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U';

        return (
            // w-10 h-10 sur mobile, w-14 h-14 sur PC
            <Button
                variant="outline"
                size="icon"
                onClick={handleProfileClick}
                title="Mon Profil"
                className="rounded-full w-10 h-10 md:w-14 md:h-14 border-white/10 bg-card/30 hover:bg-white/10 backdrop-blur-md group shadow-md"
            >
                {/* w-7 h-7 sur mobile, w-10 h-10 sur PC. Police text-sm sur mobile */}
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-titre text-sm md:text-xl shadow-[0_0_10px_rgba(232,28,255,0.4)] group-hover:scale-105 transition-transform">
                    {initial}
                </div>
            </Button>
        );
    }

    return null;
}