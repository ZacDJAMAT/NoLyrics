import { Song } from '../types';

interface SongCardProps {
    song: Song;
    onClick: (song: Song) => void;
    bestScore?: number; // NOUVEAU : Propriété optionnelle pour le score
}

export default function SongCard({ song, onClick, bestScore }: SongCardProps) {
    return (
        <div
            onClick={() => onClick(song)}
            className="group cursor-pointer flex flex-col gap-3 p-3 rounded-2xl hover:bg-card/40 transition-colors border border-transparent hover:border-border relative overflow-hidden"
        >
            {/* LE FILTRE BLEU GLOBAL */}
            <div className="absolute inset-0 bg-secondary/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>

            {/* CONTENEUR DE L'IMAGE (Ajout de relative ici pour le badge) */}
            <div className="aspect-square overflow-hidden rounded-xl bg-card shadow-lg border border-border/50 relative">
                <img
                    src={song.album.cover_xl}
                    alt={`Pochette de ${song.title}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* NOUVEAU : LE BADGE DE SCORE (Visible uniquement si bestScore est défini) */}
                {bestScore !== undefined && (
                    <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-bold tracking-wider backdrop-blur-md transition-all z-20 font-texte
                        ${bestScore === 100
                        ? 'bg-secondary/20 text-secondary border border-secondary/50 shadow-[0_0_10px_rgba(64,201,255,0.5)]' // Style 100% : Néon Bleu
                        : 'bg-black/60 text-foreground/90 border border-white/10' // Style normal : Verre sombre discret
                    }
                    `}>
                        {bestScore}%
                    </div>
                )}
            </div>

            <div className="px-1 relative z-0">
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