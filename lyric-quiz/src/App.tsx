import { useState } from 'react';
import SearchScreen from './components/SearchScreen';
import GameScreen from './components/GameScreen';
import LoginScreen from './components/LoginScreen'; // Le nouvel écran
import { Song } from './types';
import { useAuth } from './contexts/AuthContext'; // Le cerveau
import SyncModal from './components/SyncModal';

function App() {
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [showSyncModal, setShowSyncModal] = useState<boolean>(true); // Nouveau !

    // On interroge le cerveau
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
            {/* On ajoute la modale ici. Elle se cachera toute seule une fois terminée */}
            {showSyncModal && <SyncModal onComplete={() => setShowSyncModal(false)} />}

            {selectedSong ? (
                <GameScreen
                    song={selectedSong}
                    onBack={() => setSelectedSong(null)}
                />
            ) : (
                <SearchScreen
                    onSelectSong={setSelectedSong}
                />
            )}
        </>
    );
}


export default App;