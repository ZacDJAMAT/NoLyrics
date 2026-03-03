import { useState } from 'react';
import SearchScreen from './components/SearchScreen';
import GameScreen from './components/GameScreen';
import { Song } from './types'; // On importe notre moule "Song"

function App() {
    // L'état est soit une "Song" complète, soit "null"
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);

    return (
        <>
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