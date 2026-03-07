import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmModal from './LogoutConfirmModal';
import { Button } from './ui/button';

// 1. On accepte une prop onClose optionnelle
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

    // 2. Le bouton retour s'adapte à la situation
    const handleBack = () => {
        if (onClose) {
            onClose(); // Ferme le calque (retour au jeu actif)
        } else {
            navigate(-1); // Comportement classique
        }
    };

    return (
        // 3. Si "onClose" existe, on ajoute "fixed inset-0 z-[100]" pour recouvrir tout l'écran de jeu !
        <div className={`min-h-screen bg-background text-foreground font-texte p-6 selection:bg-secondary selection:text-secondary-foreground animate-fade-in-up relative ${onClose ? 'fixed inset-0 z-[100] overflow-y-auto' : ''}`}>

            {showLogoutModal && (
                <LogoutConfirmModal
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}

            <header className="max-w-4xl mx-auto flex items-center mb-8">
                <Button
                    variant="back"
                    onClick={handleBack}
                    className="font-texte text-lg px-3 mb-8"
                >
                    ← Retour
                </Button>
            </header>

            <main className="glass-panel max-w-4xl mx-auto p-8 md:p-12">
                <h1 className="titre-neon-secondary text-4xl mb-8 tracking-widest">
                    Mon Compte
                </h1>

                <div className="space-y-6">
                    <div>
                        <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold mb-1">Email</p>
                        <p className="text-2xl font-texte text-foreground">
                            {user?.email || "Email non disponible"}
                        </p>
                    </div>
                </div>

                <div className="pt-8 border-t border-border mt-12 flex justify-end">
                    <Button
                        variant="destructive"
                        onClick={() => setShowLogoutModal(true)}
                        className="font-texte text-lg px-8 py-6 rounded-xl shadow-[0_0_15px_rgba(255,77,79,0.3)]"
                    >
                        Se déconnecter
                    </Button>
                </div>
            </main>
        </div>
    );
}