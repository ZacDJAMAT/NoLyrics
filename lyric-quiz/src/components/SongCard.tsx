import { Song } from '../types';
import { Heart } from 'lucide-react'; // NOUVEAU : L'icône du cœur

interface SongCardProps {
    song: Song;
    onClick: (song: Song) => void;
    bestScore?: number;

    // NOUVELLES PROPS POUR LES FAVORIS
    isFavorite?: boolean;
    onToggleFavorite?: (e: React.MouseEvent, song: Song) => void;
}

export default function SongCard({
    song,
    onClick,
    bestScore,
    isFavorite,
    onToggleFavorite,
}: SongCardProps) {
    return (
        <div
            onClick={() => onClick(song)}
            className="group hover:bg-secondary/15 hover:border-secondary/30 relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-transparent p-3 transition-all duration-300"
        >
            {/* CONTENEUR DE L'IMAGE */}
            <div className="bg-card border-border/50 relative z-10 aspect-square overflow-hidden rounded-xl border shadow-lg">
                <img
                    src={song.album.cover_xl}
                    alt={`Pochette de ${song.title}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* NOUVEAU : LE BOUTON FAVORIS */}
                {onToggleFavorite && (
                    <button
                        // e.stopPropagation() empêche le clic sur le cœur de déclencher le clic sur la carte (qui lance le jeu)
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(e, song);
                        }}
                        className={`absolute top-2 left-2 z-20 rounded-full border p-2 backdrop-blur-md transition-all duration-300 ${
                            isFavorite
                                ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(232,28,255,0.4)]'
                                : 'border-white/10 bg-black/40 text-white/60 hover:scale-110 hover:bg-black/60 hover:text-white'
                        }`}
                    >
                        <Heart
                            className="h-4 w-4 md:h-5 md:w-5"
                            fill={isFavorite ? 'currentColor' : 'none'}
                        />
                    </button>
                )}

                {/* LE BADGE DE SCORE */}
                {bestScore !== undefined && (
                    <div
                        className={`font-texte absolute right-2 bottom-2 z-20 rounded-lg px-2 py-1 text-xs font-bold tracking-wider backdrop-blur-md transition-all ${
                            bestScore === 100
                                ? 'bg-secondary/20 text-secondary border-secondary/50 border shadow-[0_0_10px_rgba(64,201,255,0.5)]'
                                : 'text-foreground/90 border border-white/10 bg-black/60'
                        } `}
                    >
                        {bestScore}%
                    </div>
                )}
            </div>

            {/* CONTENEUR DU TEXTE */}
            <div className="relative z-10 px-1">
                <h3 className="font-titre text-foreground group-hover:text-secondary truncate text-xl drop-shadow-sm transition-colors">
                    {song.title}
                </h3>
                <p className="text-muted-foreground font-texte mt-1 truncate text-lg">
                    {song.artist.name}
                </p>
            </div>
        </div>
    );
}
