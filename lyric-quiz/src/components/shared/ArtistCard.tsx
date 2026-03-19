import { Artist } from '../../types.ts';
import { Heart } from 'lucide-react';
import React from 'react';

interface ArtistCardProps {
    artist: Artist;
    onClick?: (artist: Artist) => void;
    isFavorite?: boolean;
    isSelected?: boolean;
    onToggleFavorite?: (e: React.MouseEvent, artist: Artist) => void;
}

export default function ArtistCard({
    artist,
    onClick,
    isFavorite,
    onToggleFavorite,
    isSelected,
}: ArtistCardProps) {
    return (
        <div
            onClick={() => onClick && onClick(artist)}
            className={`group relative flex cursor-pointer flex-col items-center gap-4 rounded-2xl border p-4 text-center transition-all duration-300 ${
                isSelected
                    ? 'border-secondary bg-secondary/20 shadow-[0_0_20px_rgba(64,201,255,0.3)]'
                    : 'hover:bg-secondary/15 hover:border-secondary/30 border-transparent'
            }`}
        >
            {/* CONTENEUR DE L'IMAGE RONDE */}
            <div className="bg-card border-border/50 relative z-10 aspect-square w-full max-w-[160px] overflow-hidden rounded-full border shadow-lg">
                <img
                    src={artist.picture_xl}
                    alt={`Photo de ${artist.name}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* LE BOUTON FAVORIS */}
                {onToggleFavorite && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(e, artist);
                        }}
                        className={`absolute top-2 right-2 z-20 rounded-full border p-2 backdrop-blur-md transition-all duration-300 ${
                            isFavorite
                                ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(232,28,255,0.4)]'
                                : 'border-white/10 bg-black/40 text-white/60 hover:scale-110 hover:bg-black/60 hover:text-white'
                        }`}
                    >
                        <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                )}
            </div>

            {/* CONTENEUR DU TEXTE */}
            <div className="relative z-10 w-full px-1">
                <h3 className="font-titre text-foreground group-hover:text-secondary truncate text-xl drop-shadow-sm transition-colors">
                    {artist.name}
                </h3>
                <p className="text-muted-foreground font-texte mt-1 text-sm tracking-widest uppercase">
                    Artiste
                </p>
            </div>
        </div>
    );
}
