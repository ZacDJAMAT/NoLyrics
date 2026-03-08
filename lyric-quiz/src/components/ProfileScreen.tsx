import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmModal from './LogoutConfirmModal';
import { Button } from './ui/button';

interface ProfileScreenProps {
    onClose?: () => void;
}

export default function ProfileScreen({ onClose }: ProfileScreenProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleBack = () => {
        if (onClose) {
            onClose();
        } else {
            navigate(-1);
        }
    };

    return (
    <div className={`min-h-screen bg-background text-foreground font-texte p-4 md:p-6 selection:bg-secondary selection:text-secondary-foreground animate-fade-in-up relative ${onClose ? 'fixed inset-0 z-[100] overflow-y-auto' : ''}`}>

        {showLogoutModal && (
            <LogoutConfirmModal
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
        )}

        {/* Marges réduites sur le header mobile */}
        <header className="max-w-4xl mx-auto flex items-center mb-6 md:mb-8">
            <Button
                variant="back"
                onClick={handleBack}
                className="font-texte text-base md:text-lg px-2 md:px-3 h-9 md:h-10"
            >
                <span className="sm:hidden">←</span>
                <span className="hidden sm:inline">← Retour</span>
            </Button>
        </header>

        {/* p-5 sur mobile, et on garde p-12 sur les grands écrans */}
        <main className="glass-panel max-w-4xl mx-auto p-5 sm:p-8 md:p-12">

            {/* Taille du titre ajustée */}
            <h1 className="titre-neon-secondary text-3xl md:text-4xl mb-6 md:mb-8 tracking-widest text-center sm:text-left">
                Mon Compte
            </h1>

            <div className="space-y-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <p className="text-muted-foreground text-xs md:text-sm uppercase tracking-wider font-semibold mb-1">Email</p>
                    {/* break-all permet de couper une adresse e-mail trop longue pour qu'elle passe à la ligne au lieu de sortir de l'écran */}
                    <p className="text-lg sm:text-xl md:text-2xl font-texte text-foreground break-all">
                        {user?.email || "Email non disponible"}
                    </p>
                </div>
            </div>

            {/* mt-8 au lieu de mt-12 pour rapprocher le bouton sur mobile */}
            <div className="pt-6 md:pt-8 border-t border-border mt-8 md:mt-12 flex justify-center sm:justify-end">
                <Button
                    variant="destructive"
                    onClick={() => setShowLogoutModal(true)}
                    // w-full sur mobile pour qu'il prenne toute la largeur, w-auto sur PC
                    className="w-full sm:w-auto font-texte text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-xl shadow-[0_0_15px_rgba(255,77,79,0.3)]"
                >
                    Se déconnecter
                </Button>
            </div>
        </main>
    </div>
);
}