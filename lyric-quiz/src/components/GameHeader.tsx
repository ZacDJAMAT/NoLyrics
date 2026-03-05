import { Song, GameStatus } from '../types';
import UserMenuButton from './UserMenuButton';
import { Button } from './ui/button';

interface GameHeaderProps {
    song: Song;
    onBack: () => void;
    gameStatus: GameStatus;
    isFetchingLyrics: boolean;
    onGiveUp: () => void;
    onRestart: () => void; // NOUVEAU : On ajoute la fonction pour recommencer
}

export default function GameHeader({ song, onBack, gameStatus, onGiveUp, onRestart }: GameHeaderProps) {
    return (
        // On a retiré "sticky top-0 bg-background/50 backdrop-blur-md"
        <header className="p-6 border-b border-border flex items-center justify-between relative z-20">

            <div className="flex items-center gap-6">
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

                {/* 1. Pendant la partie : Uniquement le bouton Abandonner */}
                {gameStatus === 'playing' && (
                    <Button
                        variant="destructive"
                        onClick={onGiveUp}
                        className="font-texte text-base"
                    >
                        Abandonner
                    </Button>
                )}

                {/* 2. Fin de partie (Gagné/Perdu) : Bouton Recommencer */}
                {(gameStatus === 'won' || gameStatus === 'lost') && (
                    <Button
                        onClick={onRestart}
                        className="font-texte text-base shadow-[0_0_15px_rgba(232,28,255,0.3)]"
                    >
                        Recommencer
                    </Button>
                )}

                {/* Avatar utilisateur à la fin de la partie */}
                {(gameStatus === 'won' || gameStatus === 'lost') && (
                    <UserMenuButton />
                )}
            </div>
        </header>
    );
}