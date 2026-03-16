import { Song } from '../types';

interface SongCardProps {
    song: Song;
    onClick: (song: Song) => void;
    bestScore?: number;
}

export default function SongCard({ song, onClick, bestScore }: SongCardProps) {
    return (
        <div
            onClick={() => onClick(song)}
            // MODIFICATION ICI : On applique le fond bleu (hover:bg-secondary/15) et la bordure au conteneur parent
            className="group hover:bg-secondary/15 hover:border-secondary/30 relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-transparent p-3 transition-all duration-300"
        >
            {/* LE FILTRE BLEU GLOBAL EN POSITION ABSOLUE A ÉTÉ SUPPRIMÉ ! */}

            {/* CONTENEUR DE L'IMAGE */}
            <div className="bg-card border-border/50 relative z-10 aspect-square overflow-hidden rounded-xl border shadow-lg">
                <img
                    src={song.album.cover_xl}
                    alt={`Pochette de ${song.title}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

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
