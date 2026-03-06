import { Song } from '../types';
import UserMenuButton from './UserMenuButton';
import { Button } from './ui/button';

interface GameHeaderProps {
    song: Song;
    onBack: () => void;
    onProfileClick?: () => void; // <-- NOUVEAU
}

export default function GameHeader({ song, onBack, onProfileClick }: GameHeaderProps) {
    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-border relative z-20 gap-4">

            <div className="flex-1 flex justify-start">
                <Button variant="back" onClick={onBack} className="font-texte text-lg px-3">
                    ← Retour
                </Button>
            </div>

            <div className="flex items-center gap-5 flex-none">
                <img src={song.album.cover_xl} alt={`Pochette`} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 object-cover" />
                <div className="flex flex-col justify-center text-left">
                    <h1 className="text-neon-primary text-3xl md:text-4xl tracking-widest mb-1">NOLYRICS</h1>
                    <h2 className="font-titre text-base md:text-lg leading-tight text-foreground drop-shadow-sm truncate max-w-[200px] md:max-w-[300px]">{song.title}</h2>
                    <p className="text-secondary font-texte text-xs md:text-sm drop-shadow-sm truncate max-w-[200px] md:max-w-[300px] mt-0.5">{song.artist.name}</p>
                </div>
            </div>

            <div className="flex-1 flex justify-end">
                {/* On passe l'action à notre bouton ! */}
                <UserMenuButton onClickOverride={onProfileClick} />
            </div>

        </header>
    );
}