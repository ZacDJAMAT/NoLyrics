import { useState } from 'react'; // <-- NOUVEL IMPORT
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmModal from './LogoutConfirmModal'; // <-- NOUVEL IMPORT

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // État pour gérer l'affichage de la modale de confirmation
    const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

    const handleLogout = async () => {
        await logout();
        navigate('/'); // On retourne à l'accueil après la déconnexion
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans p-6 selection:bg-pink-500 selection:text-white animate-fade-in-up relative">

            {/* Affichage conditionnel de la modale de confirmation */}
            {showLogoutModal && (
                <LogoutConfirmModal
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}

            <header className="max-w-4xl mx-auto flex items-center mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="text-neutral-400 hover:text-white flex items-center gap-2 transition-colors font-medium"
                >
                    ← Retour à la recherche
                </button>
            </header>

            <main className="max-w-4xl mx-auto bg-neutral-800 rounded-3xl p-8 md:p-12 border border-neutral-700 shadow-2xl">
                <h1 className="text-3xl font-bold mb-8 tracking-tight">Mon Compte</h1>

                <div className="space-y-6">
                    <div>
                        <p className="text-neutral-400 text-sm uppercase tracking-wider font-semibold mb-1">Email</p>
                        <p className="text-xl font-medium text-white">
                            {user?.email || "Email non disponible"}
                        </p>
                    </div>

                    {/* Espace prévu pour les futurs onglets (Statistiques, Historique, etc.) */}
                </div>

                <div className="pt-8 border-t border-neutral-700 mt-12 flex justify-end">
                    <button
                        onClick={() => setShowLogoutModal(true)} // <-- Ouvre la modale au lieu de déconnecter
                        className="bg-red-600/10 text-red-500 hover:bg-red-500 hover:text-white px-6 py-3 rounded-xl font-bold transition-all border border-red-600/20 hover:border-red-500 active:scale-95"
                    >
                        Se déconnecter
                    </button>
                </div>
            </main>
        </div>
    );
}