import { Song, GameStatus } from '../types';
import UserMenuButton from './UserMenuButton';

interface GameHeaderProps {
    song: Song;
    onBack: () => void;
    gameStatus: GameStatus;
    isFetchingLyrics: boolean;
    onGiveUp: () => void;
}

export default function GameHeader({ song, onBack, gameStatus, isFetchingLyrics, onGiveUp }: GameHeaderProps) {
    return (
        <header className="p-6 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900/95 backdrop-blur z-20">

            {/* 1. Côté Gauche : Bouton Retour et Infos Musique */}
            <div className="flex items-center gap-6">
                <button
                    onClick={onBack}
                    className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    ← Retour
                </button>
                <div className="flex items-center gap-4">
                    <img src={song.album.cover_small} alt="Pochette" className="w-12 h-12 rounded-lg shadow-md" />
                    <div>
                        <h2 className="font-bold text-xl leading-tight">{song.title}</h2>
                        <p className="text-pink-400 text-sm">{song.artist.name}</p>
                    </div>
                </div>
            </div>

            {/* 2. Côté Droit : Bouton d'action ET Bouton Profil */}
            <div className="flex items-center gap-4">

                {/* Le bouton d'action (Unique !) */}
                {!isFetchingLyrics && (
                    <button
                        onClick={() => {
                            if (gameStatus === 'playing') onGiveUp();
                            else onBack();
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            gameStatus === 'playing'
                                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                : 'bg-pink-600 text-white hover:bg-pink-500 shadow-lg'
                        }`}
                    >
                        {gameStatus === 'playing' ? 'Abandonner' : 'Chercher une autre musique'}
                    </button>
                )}

                {/* Le bouton Profil qui s'affiche à la fin */}
                {(gameStatus === 'won' || gameStatus === 'lost') && (
                    <UserMenuButton />
                )}
            </div>

        </header>
    );
}