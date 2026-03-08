import { Song } from '../types';
import UserMenuButton from './UserMenuButton';
import { Button } from './ui/button';

interface GameHeaderProps {
    song: Song;
    onBack: () => void;
    onProfileClick?: () => void;
}

export default function GameHeader({ song, onBack, onProfileClick }: GameHeaderProps) {
    return (
    <header className="flex items-center justify-between px-3 md:px-6 py-2 md:py-4 border-b border-border relative z-20 gap-2 md:gap-4">

        <div className="flex-1 flex justify-start">
            {/* Le bouton retour devient plus compact sur mobile. On cache "Retour" sur les petits écrans. */}
            <Button variant="back" onClick={onBack} className="font-texte text-base md:text-lg px-2 md:px-3 h-9 md:h-10">
                <span className="sm:hidden">←</span>
                <span className="hidden sm:inline">← Retour</span>
            </Button>
        </div>

        <div className="flex items-center gap-2 md:gap-5 flex-none">
            {/* Pochette rétrécie à w-12 h-12 sur mobile, et coins un peu moins arrondis (rounded-lg) */}
            <img
                src={song.album.cover_xl}
                alt={`Pochette`}
                className="w-12 h-12 md:w-20 md:h-24 rounded-lg md:rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.3)] md:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 object-cover"
            />

            <div className="flex flex-col justify-center text-left">
                {/* Tailles de texte ajustées pour ne pas prendre toute la largeur */}
                <h1 className="text-neon-primary text-xl md:text-3xl md:text-4xl tracking-widest mb-0 md:mb-1 leading-none">
                    NOLYRICS
                </h1>
                <h2 className="font-titre text-sm md:text-lg leading-tight text-foreground drop-shadow-sm truncate max-w-[130px] sm:max-w-[200px] md:max-w-[300px]">
                    {song.title}
                </h2>
                <p className="text-secondary font-texte text-[10px] md:text-sm drop-shadow-sm truncate max-w-[130px] sm:max-w-[200px] md:max-w-[300px] mt-0 md:mt-0.5">
                    {song.artist.name}
                </p>
            </div>
        </div>

        <div className="flex-1 flex justify-end">
            <UserMenuButton onClickOverride={onProfileClick} />
        </div>

    </header>
);
}