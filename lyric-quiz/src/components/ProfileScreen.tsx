import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmModal from './LogoutConfirmModal';
import { Button } from './ui/button';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-texte p-6 selection:bg-secondary selection:text-secondary-foreground animate-fade-in-up relative">

            {showLogoutModal && (
                <LogoutConfirmModal
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}

            <header className="max-w-4xl mx-auto flex items-center mb-8">
                <Button
                    variant="back"
                    onClick={() => navigate('/')}
                    className="font-texte text-lg px-3 mb-8"
                >
                    ← Retour
                </Button>
            </header>

            <main className="max-w-4xl mx-auto bg-card rounded-3xl p-8 md:p-12 border border-border shadow-[0_0_30px_rgba(64,201,255,0.05)]">
                <h1 className="text-4xl font-titre text-secondary mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(64,201,255,0.3)]">
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