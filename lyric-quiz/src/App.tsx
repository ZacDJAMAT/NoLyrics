import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import SyncModal from './components/modals/SyncModal.tsx';
import { useAuth } from './contexts/AuthContext';
import GameScreen from './pages/allmusic/GameScreen.tsx';
import SearchScreen from './pages/allmusic/SearchScreen.tsx';
import LoginScreen from './pages/auth/LoginScreen.tsx';
import ProfileScreen from './pages/auth/ProfileScreen.tsx';
import FillyricsGameScreen from './pages/fillyrics/FillyricsGameScreen.tsx';
import FillyricsLobbyScreen from './pages/fillyrics/FillyricsLobbyScreen.tsx';
import GlobalSearchScreen from './pages/GlobalSearchScreen.tsx';
import HubScreen from './pages/hub/HubScreen.tsx';
import LobbyScreen from './pages/hub/LobbyScreen.tsx';
import FillyricsExhaustedScreen from './pages/fillyrics/FillyricsExhaustedScreen.tsx';
import BlindTestLobbyScreen from './pages/blindtest/BlindTestLobbyScreen.tsx';
import BlindTestGameScreen from './pages/blindtest/BlindTestGameScreen.tsx';

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

            <Routes>
                <Route path="/" element={<HubScreen />} />
                <Route path="/mode/:modeId" element={<LobbyScreen />} />
                <Route path="/mode/:modeId/solo/search" element={<SearchScreen />} />
                <Route path="/mode/:modeId/solo/play/:songId" element={<GameScreen />} />

                <Route path="/profile" element={<ProfileScreen />} />
                <Route path="/search" element={<GlobalSearchScreen />} />

                <Route path="/mode/fillyrics" element={<FillyricsLobbyScreen />} />
                <Route path="/mode/fillyrics/play" element={<FillyricsGameScreen />} />
                <Route path="/mode/fillyrics/exhausted" element={<FillyricsExhaustedScreen />} />

                <Route path="/mode/blindtest" element={<BlindTestLobbyScreen />} />
                <Route path="/mode/blindtest/play" element={<BlindTestGameScreen />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
