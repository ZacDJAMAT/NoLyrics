import { useState } from 'react';
import SearchScreen from './features/nallmusic/SearchScreen.tsx';
import GameScreen from './features/nallmusic/GameScreen.tsx';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';
import { useAuth } from './contexts/AuthContext';
import SyncModal from './components/SyncModal';
import HubScreen from './features/hub/HubScreen.tsx';
import LobbyScreen from './features/hub/LobbyScreen.tsx';

function App() {
    const [showSyncModal, setShowSyncModal] = useState<boolean>(true);
    const { user, isGuest, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-900">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!user && !isGuest) {
        return <LoginScreen />;
    }

    return (
        <>
            {showSyncModal && <SyncModal onComplete={() => setShowSyncModal(false)} />}

            {/* LE NOUVEAU SYSTÈME DE ROUTAGE IMBRIQUÉ */}
            <Routes>
                {/* 1. L'accueil est maintenant le vrai Hub */}
                <Route path="/" element={<HubScreen />} />

                {/* 2. Le vrai Lobby */}
                <Route path="/mode/:modeId" element={<LobbyScreen />} />

                {/* 3. L'ancien accueil devient l'écran de recherche spécifique au solo */}
                <Route path="/mode/:modeId/solo/search" element={<SearchScreen />} />

                {/* 4. L'ancien écran de jeu devient l'écran de jeu spécifique au solo */}
                <Route path="/mode/:modeId/solo/play/:songId" element={<GameScreen />} />

                {/* Page du profil (Inchangée) */}
                <Route path="/profile" element={<ProfileScreen />} />

                {/* Sécurité : Redirection vers le Hub si l'URL est inconnue */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
