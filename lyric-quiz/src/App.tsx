import { useState } from 'react';
import SearchScreen from './pages/allmusic/SearchScreen.tsx';
import GameScreen from './pages/allmusic/GameScreen.tsx';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './pages/auth/LoginScreen.tsx';
import ProfileScreen from './pages/auth/ProfileScreen.tsx';
import { useAuth } from './contexts/AuthContext';
import SyncModal from './components/modals/SyncModal.tsx';
import HubScreen from './pages/hub/HubScreen.tsx';
import LobbyScreen from './pages/hub/LobbyScreen.tsx';
import FillyricsLobbyScreen from './pages/fillyrics/FillyricsLobbyScreen.tsx';
import GlobalSearchScreen from './pages/GlobalSearchScreen.tsx';
import FillyricsGameScreen from '@/pages/fillyrics/FillyricsGameScreen.tsx';

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

                {/* Lobby spécifique au mode FILLyrics */}
                <Route path="/mode/fillyrics" element={<FillyricsLobbyScreen />} />

                {/* Recherche globale */}
                <Route path="/search" element={<GlobalSearchScreen />} />

                <Route path="/mode/fillyrics" element={<FillyricsLobbyScreen />} />

                <Route path="/mode/fillyrics/play" element={<FillyricsGameScreen />} />
            </Routes>
        </>
    );
}

export default App;
