import { Song } from '../types';

interface SongCardProps {
    song: Song;
    onClick: (song: Song) => void;
}

export default function SongCard({ song, onClick }: SongCardProps) {
    return (
        <div
            onClick={() => onClick(song)}
            className="group cursor-pointer flex flex-col gap-3 p-3 rounded-2xl hover:bg-card/40 transition-colors border border-transparent hover:border-border"
        >
            <div className="aspect-square overflow-hidden rounded-xl bg-card shadow-lg border border-border/50">
                <img
                    src={song.album.cover_xl}
                    alt={`Pochette de ${song.title}`}
                    className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-90 transition-all duration-300"
                />
            </div>
            <div className="px-1">
                <h3 className="font-titre text-xl truncate text-foreground group-hover:text-secondary transition-colors drop-shadow-sm">
                    {song.title}
                </h3>
                <p className="text-muted-foreground font-texte text-lg truncate mt-1">
                    {song.artist.name}
                </p>
            </div>
        </div>
    );
}