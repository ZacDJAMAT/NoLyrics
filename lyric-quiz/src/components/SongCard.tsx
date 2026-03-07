import { Song } from '../types';

interface SongCardProps {
    song: Song;
    onClick: (song: Song) => void;
}

export default function SongCard({ song, onClick }: SongCardProps) {
    return (
        <div
            onClick={() => onClick(song)}
            // On ajoute relative et overflow-hidden ici
            className="group cursor-pointer flex flex-col gap-3 p-3 rounded-2xl hover:bg-card/40 transition-colors border border-transparent hover:border-border relative overflow-hidden"
        >
            {/* LE FILTRE BLEU GLOBAL : Positionné en absolu sur toute la carte, il passe par-dessus le texte et l'image */}
            <div className="absolute inset-0 bg-secondary/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>

            <div className="aspect-square overflow-hidden rounded-xl bg-card shadow-lg border border-border/50">
                <img
                    src={song.album.cover_xl}
                    alt={`Pochette de ${song.title}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            <div className="px-1 relative z-0">
                <h3 className="text-neon-secondary font-titre text-xl truncate transition-all duration-300">
                    {song.title}
                </h3>
                <p className="text-muted-foreground font-texte text-lg truncate mt-1">
                    {song.artist.name}
                </p>
            </div>
        </div>
    );
}