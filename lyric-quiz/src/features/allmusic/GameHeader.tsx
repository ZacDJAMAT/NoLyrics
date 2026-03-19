import { useState, useEffect } from 'react';
import { Song } from '../../types.ts';
import UserMenuButton from '../../components/layout/UserMenuButton.tsx';
import { Button } from '../../components/ui/button.tsx';
import { ArrowLeft } from 'lucide-react';

interface GameHeaderProps {
    song: Song;
    onBack: () => void;
    onProfileClick?: () => void;
}

export default function GameHeader({ song, onBack, onProfileClick }: GameHeaderProps) {
    // 1. État pour stocker les featurings une fois chargés
    const [featuring, setFeaturing] = useState<string | null>(null);

    // 2. On va chercher les vrais contributeurs sur Deezer sans bloquer le reste du jeu !
    useEffect(() => {
        const fetchFeats = async () => {
            try {
                const response = await fetch(`/api/deezer/track/${song.id}`);
                if (!response.ok) return;

                const track = await response.json();

                // Si la musique a plusieurs contributeurs
                if (track.contributors && track.contributors.length > 1) {
                    // On filtre pour ne garder que les invités (on enlève l'artiste principal)
                    const feats = track.contributors
                        .filter((c: any) => c.name !== track.artist.name)
                        .map((c: any) => c.name)
                        .join(', ');

                    if (feats) {
                        setFeaturing(`feat. ${feats}`);
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des feat:', error);
            }
        };

        fetchFeats();
    }, [song.id]);

    return (
        <header className="border-border relative z-20 flex items-center justify-between gap-2 border-b px-3 py-2 md:gap-4 md:px-6 md:py-4">
            <div className="flex flex-1 justify-start">
                {/* On a ajouté la condition pour cacher le texte sur mobile avec ton beau bouton */}
                <Button
                    variant="back"
                    onClick={onBack}
                    className="font-texte h-9 px-2 text-base md:h-10 md:px-3 md:text-lg"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="hidden sm:inline">Retour</span>
                </Button>
            </div>

            <div className="flex flex-none items-center gap-2 md:gap-5">
                {/* 3. MODIFICATION : La cover est maintenant parfaitement carrée avec aspect-square et w-20 h-20 */}
                <img
                    src={song.album.cover_xl}
                    alt={`Pochette`}
                    className="aspect-square h-12 w-12 rounded-lg border border-white/10 object-cover shadow-[0_5px_15px_rgba(0,0,0,0.3)] md:h-20 md:w-20 md:rounded-2xl md:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                />

                <div className="flex flex-col justify-center text-left">
                    <h1 className="text-neon-primary mb-0 text-xl leading-none tracking-widest md:mb-1 md:text-3xl md:text-4xl">
                        NOLYRICS
                    </h1>
                    <h2 className="font-titre text-foreground max-w-[130px] truncate text-sm leading-tight drop-shadow-sm sm:max-w-[200px] md:max-w-[300px] md:text-lg">
                        {song.title}
                    </h2>
                    {/* 4. MODIFICATION : Affichage stylisé des featurings */}
                    <p className="text-secondary font-texte mt-0 max-w-[130px] truncate text-[10px] drop-shadow-sm sm:max-w-[200px] md:mt-0.5 md:max-w-[300px] md:text-sm">
                        {song.artist.name}{' '}
                        {featuring && (
                            <span className="ml-1 text-[9px] text-white/60 italic md:text-xs">
                                {featuring}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <div className="flex flex-1 justify-end">
                <UserMenuButton onClickOverride={onProfileClick} />
            </div>
        </header>
    );
}
