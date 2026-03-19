import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmModal from '../../components/modals/LogoutConfirmModal.tsx';
import { Button } from '../../components/ui/button.tsx';
import { ArrowLeft } from 'lucide-react';

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
        <div
            className={`bg-background text-foreground font-texte selection:bg-secondary selection:text-secondary-foreground animate-fade-in-up relative min-h-screen p-4 md:p-6 ${onClose ? 'fixed inset-0 z-[100] overflow-y-auto' : ''}`}
        >
            {showLogoutModal && (
                <LogoutConfirmModal
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}

            {/* Marges réduites sur le header mobile */}
            <header className="mx-auto mb-6 flex max-w-4xl items-center md:mb-8">
                <Button
                    variant="back"
                    onClick={handleBack}
                    className="font-texte h-9 px-2 text-base md:h-10 md:px-3 md:text-lg"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Retour
                </Button>
            </header>

            {/* p-5 sur mobile, et on garde p-12 sur les grands écrans */}
            <main className="glass-panel mx-auto max-w-4xl p-5 sm:p-8 md:p-12">
                {/* Taille du titre ajustée */}
                <h1 className="titre-neon-secondary mb-6 text-center text-3xl tracking-widest sm:text-left md:mb-8 md:text-4xl">
                    Mon Compte
                </h1>

                <div className="space-y-6">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase md:text-sm">
                            Email
                        </p>
                        {/* break-all permet de couper une adresse e-mail trop longue pour qu'elle passe à la ligne au lieu de sortir de l'écran */}
                        <p className="font-texte text-foreground text-lg break-all sm:text-xl md:text-2xl">
                            {user?.email || 'Email non disponible'}
                        </p>
                    </div>
                </div>

                {/* mt-8 au lieu de mt-12 pour rapprocher le bouton sur mobile */}
                <div className="border-border mt-8 flex justify-center border-t pt-6 sm:justify-end md:mt-12 md:pt-8">
                    <Button
                        variant="destructive"
                        onClick={() => setShowLogoutModal(true)}
                        // w-full sur mobile pour qu'il prenne toute la largeur, w-auto sur PC
                        className="font-texte w-full rounded-xl px-6 py-5 text-base shadow-[0_0_15px_rgba(255,77,79,0.3)] sm:w-auto md:px-8 md:py-6 md:text-lg"
                    >
                        Se déconnecter
                    </Button>
                </div>
            </main>
        </div>
    );
}
