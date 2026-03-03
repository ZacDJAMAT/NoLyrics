import { useState } from 'react';
import SearchScreen from './components/SearchScreen';
import GameScreen from './components/GameScreen';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen'; // Le nouvel écran
import ProfileScreen from './components/ProfileScreen';
import { useAuth } from './contexts/AuthContext'; // Le cerveau
import SyncModal from './components/SyncModal';

function App() {
    const [showSyncModal, setShowSyncModal] = useState<boolean>(true);
    const { user, isGuest, isLoading } = useAuth();

    // 1. Si Supabase est encore en train de vérifier qui est là, on affiche un loader
    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // 2. Si on ne connaît pas la personne (ni connectée, ni invitée), on bloque l'entrée
    if (!user && !isGuest) {
        return <LoginScreen />;
    }

    return (
        <>
            {showSyncModal && <SyncModal onComplete={() => setShowSyncModal(false)} />}

            {/* LE NOUVEAU SYSTÈME DE ROUTAGE */}
            <Routes>
                {/* Page par défaut : La recherche */}
                <Route path="/" element={<SearchScreen />} />

                {/* Page du jeu */}
                <Route path="/game" element={<GameScreen />} />

                {/* Page du profil */}
                <Route path="/profile" element={<ProfileScreen />} />

                {/* Sécurité : Si l'utilisateur tape une URL qui n'existe pas, on le renvoie à l'accueil */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}


export default App;