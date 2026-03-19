import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button.tsx';
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
                    className="font-texte hidden h-10 items-center gap-2 rounded-xl bg-white px-4 text-base text-black shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all hover:bg-neutral-200 md:flex"
                    title="Conserve ton historique en te connectant"
                >
                    <UserIcon className="h-5 w-5" strokeWidth={2.5} />
                    <span>Se connecter</span>
                </Button>

                {/* 2. BOUTON MOBILE (Caché sur PC : flex md:hidden) */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={loginWithGoogle}
                    title="Se connecter"
                    className="bg-card/30 group flex h-10 w-10 rounded-full border-white/10 shadow-md backdrop-blur-md hover:bg-white/10 md:hidden"
                >
                    {/* Design similaire à l'avatar connecté, mais en gris/neutre */}
                    <div className="text-foreground flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-transform group-hover:scale-105">
                        <UserIcon className="h-4 w-4" strokeWidth={2} />
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
                className="bg-card/30 group h-10 w-10 rounded-full border-white/10 shadow-md backdrop-blur-md hover:bg-white/10 md:h-14 md:w-14"
            >
                <div className="bg-primary text-primary-foreground font-titre flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-[0_0_10px_rgba(232,28,255,0.4)] transition-transform group-hover:scale-105 md:h-10 md:w-10 md:text-xl">
                    {initial}
                </div>
            </Button>
        );
    }

    return null;
}
