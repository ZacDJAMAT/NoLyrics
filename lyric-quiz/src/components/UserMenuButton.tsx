import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { User as UserIcon } from 'lucide-react'; // NOUVEAU : Import de l'icône "bonhomme"

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
            <>
                {/* 1. BOUTON PC (Caché sur mobile : hidden md:flex) */}
                <Button
                    onClick={loginWithGoogle}
                    className="hidden md:flex items-center gap-2 bg-white text-black hover:bg-neutral-200 rounded-xl font-texte text-base px-4 h-10 transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                    title="Conserve ton historique en te connectant"
                >
                    <UserIcon className="w-5 h-5" strokeWidth={2.5} />
                    <span>Se connecter</span>
                </Button>

                {/* 2. BOUTON MOBILE (Caché sur PC : flex md:hidden) */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={loginWithGoogle}
                    title="Se connecter"
                    className="flex md:hidden rounded-full w-10 h-10 border-white/10 bg-card/30 hover:bg-white/10 backdrop-blur-md group shadow-md"
                >
                    {/* Design similaire à l'avatar connecté, mais en gris/neutre */}
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform">
                        <UserIcon className="w-4 h-4" strokeWidth={2} />
                    </div>
                </Button>
            </>
        );
    }

    if (user) {
        const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U';

        return (
            <Button
                variant="outline"
                size="icon"
                onClick={handleProfileClick}
                title="Mon Profil"
                className="rounded-full w-10 h-10 md:w-14 md:h-14 border-white/10 bg-card/30 hover:bg-white/10 backdrop-blur-md group shadow-md"
            >
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-titre text-sm md:text-xl shadow-[0_0_10px_rgba(232,28,255,0.4)] group-hover:scale-105 transition-transform">
                    {initial}
                </div>
            </Button>
        );
    }

    return null;
}