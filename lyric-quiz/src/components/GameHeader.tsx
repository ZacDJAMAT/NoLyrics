import { Song, GameStatus } from '../types';
import UserMenuButton from './UserMenuButton';
import { Button } from './ui/button';

interface GameHeaderProps {
    song: Song;
    onBack: () => void;
    gameStatus: GameStatus;
    isFetchingLyrics: boolean;
    onGiveUp: () => void;
}

export default function GameHeader({ song, onBack, gameStatus, isFetchingLyrics, onGiveUp }: GameHeaderProps) {
    return (
        <header className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-md z-20">

            <div className="flex items-center gap-6">
                {/* 1. BOUTON RETOUR : Plus de fond bleu agressif, juste un léger éclaircissement */}
                <Button
                    variant="back"
                    onClick={onBack}
                    className="font-texte text-lg px-3"
                >
                    ← Retour
                </Button>

                <div className="flex items-center gap-4">
                    <img src={song.album.cover_small} alt="Pochette" className="w-12 h-12 rounded-lg shadow-md border border-white/10" />
                    <div>
                        <h2 className="font-titre text-xl leading-tight text-foreground">{song.title}</h2>
                        <p className="text-secondary font-texte text-sm drop-shadow-sm">{song.artist.name}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">

                {!isFetchingLyrics && (
                    <Button
                        variant={gameStatus === 'playing' ? "destructive" : "default"}
                        onClick={() => {
                            if (gameStatus === 'playing') onGiveUp();
                            else onBack();
                        }}
                    >
                        {gameStatus === 'playing' ? 'Abandonner' : 'Chercher une autre musique'}
                    </Button>
                )}

                {(gameStatus === 'won' || gameStatus === 'lost') && (
                    <UserMenuButton />
                )}
            </div>

        </header>
    );
}