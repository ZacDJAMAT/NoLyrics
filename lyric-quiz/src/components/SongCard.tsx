// src/components/SongCard.tsx
import { Song } from '../types';

interface SongCardProps {
    song: Song;
    onClick: (song: Song) => void;
}

export default function SongCard({ song, onClick }: SongCardProps) {
    return (
        <div
            onClick={() => onClick(song)}
            className="group cursor-pointer flex flex-col gap-3"
        >
            <div className="aspect-square overflow-hidden rounded-xl bg-neutral-800 shadow-lg">
                <img
                    src={song.album.cover_xl}
                    alt={`Pochette de ${song.title}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div>
                <h3 className="font-semibold text-lg truncate group-hover:text-pink-400 transition-colors">
                    {song.title}
                </h3>
                <p className="text-neutral-400 text-sm truncate">
                    {song.artist.name}
                </p>
            </div>
        </div>
    );
}