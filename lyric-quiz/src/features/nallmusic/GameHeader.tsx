import { Song } from '../../types.ts';
import UserMenuButton from '../../components/UserMenuButton.tsx';
import { Button } from '../../components/ui/button.tsx';

interface GameHeaderProps {
    song: Song;
    onBack: () => void;
    onProfileClick?: () => void;
}

export default function GameHeader({ song, onBack, onProfileClick }: GameHeaderProps) {
    return (
        <header className="border-border relative z-20 flex items-center justify-between gap-2 border-b px-3 py-2 md:gap-4 md:px-6 md:py-4">
            <div className="flex flex-1 justify-start">
                {/* Le bouton retour devient plus compact sur mobile. On cache "Retour" sur les petits écrans. */}
                <Button
                    variant="back"
                    onClick={onBack}
                    className="font-texte h-9 px-2 text-base md:h-10 md:px-3 md:text-lg"
                >
                    <span className="sm:hidden">←</span>
                    <span className="hidden sm:inline">← Retour</span>
                </Button>
            </div>

            <div className="flex flex-none items-center gap-2 md:gap-5">
                {/* Pochette rétrécie à w-12 h-12 sur mobile, et coins un peu moins arrondis (rounded-lg) */}
                <img
                    src={song.album.cover_xl}
                    alt={`Pochette`}
                    className="h-12 w-12 rounded-lg border border-white/10 object-cover shadow-[0_5px_15px_rgba(0,0,0,0.3)] md:h-24 md:w-20 md:rounded-2xl md:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                />

                <div className="flex flex-col justify-center text-left">
                    {/* Tailles de texte ajustées pour ne pas prendre toute la largeur */}
                    <h1 className="text-neon-primary mb-0 text-xl leading-none tracking-widest md:mb-1 md:text-3xl md:text-4xl">
                        NOLYRICS
                    </h1>
                    <h2 className="font-titre text-foreground max-w-[130px] truncate text-sm leading-tight drop-shadow-sm sm:max-w-[200px] md:max-w-[300px] md:text-lg">
                        {song.title}
                    </h2>
                    <p className="text-secondary font-texte mt-0 max-w-[130px] truncate text-[10px] drop-shadow-sm sm:max-w-[200px] md:mt-0.5 md:max-w-[300px] md:text-sm">
                        {song.artist.name}
                    </p>
                </div>
            </div>

            <div className="flex flex-1 justify-end">
                <UserMenuButton onClickOverride={onProfileClick} />
            </div>
        </header>
    );
}
