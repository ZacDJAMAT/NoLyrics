import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SharedSearch from '@/components/shared/SharedSearch';
import ArtistCard from '@/components/shared/ArtistCard';
import { Artist } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import UserMenuButton from '@/components/layout/UserMenuButton';
import { featureFlags } from '@/lib/featureFlags';

import { motion, AnimatePresence, Variants } from 'framer-motion';

export interface SelectionItem {
    id: string;
    type: 'artist';
    name: string;
    image: string;
    data: Artist;
}

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 32,
            mass: 1,
            staggerChildren: 0.05,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0, x: -100 },
    visible: {
        opacity: 1,
        scale: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
            mass: 0.8,
        },
    },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

export default function FillyricsLobbyScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isClassicOverride = searchParams.get('classic') === '1';
    const isZeroFrictionEnabled = featureFlags.fillyricsZeroFriction && !isClassicOverride;
    const [selection, setSelection] = useState<SelectionItem[]>([]);

    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_ITEMS = 10;

    const toggleSelection = (item: Artist) => {
        const itemId = item.id.toString();
        const exists = selection.find((s) => s.id === itemId);

        if (exists) {
            setSelection((prev) => prev.filter((s) => s.id !== itemId));
        } else {
            if (selection.length >= MAX_ITEMS) {
                return;
            }

            const newItem: SelectionItem = {
                id: itemId,
                type: 'artist',
                name: item.name,
                image: item.picture_xl,
                data: item,
            };
            setSelection((prev) => [newItem, ...prev]);

            if (!isExpanded) {
                setIsExpanded(true);
            }
        }
    };

    if (isZeroFrictionEnabled) {
        return (
            <div className="bg-background text-foreground min-h-screen overflow-x-hidden p-4 md:p-6">
                <header className="border-border relative mb-12 flex flex-col items-center border-b pb-8">
                    <div className="absolute top-0 left-0 z-20">
                        <Button variant="back" onClick={() => navigate('/')} className="font-texte">
                            <ArrowLeft className="h-5 w-5 md:mr-1" />
                            <span className="hidden sm:inline">Retour au Hub</span>
                        </Button>
                    </div>
                    <div className="absolute top-0 right-0 z-20">
                        <UserMenuButton />
                    </div>

                    <h1 className="font-titre titre-neon-secondary mt-12 mb-2 text-center text-5xl tracking-widest drop-shadow-[0_0_20px_rgba(64,201,255,0.4)] md:text-6xl">
                        FILLYRICS
                    </h1>
                    <p className="text-muted-foreground font-texte max-w-xl text-center text-lg md:text-xl">
                        Quick Play actif: un tap pour lancer une piste sans menu.
                    </p>
                </header>

                <main className="mx-auto flex w-full max-w-xl flex-col gap-4">
                    <div className="glass-panel flex flex-col gap-5 p-6 text-center">
                        <div className="bg-secondary/15 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                            <Zap className="text-secondary h-7 w-7" />
                        </div>
                        <h2 className="font-titre text-2xl tracking-wide text-white">
                            Zero Friction Mode
                        </h2>
                        <p className="font-texte text-white/65">
                            Playlist auto, aucune selection manuelle, enchainement direct.
                        </p>
                        <Button
                            onClick={() => navigate('/mode/fillyrics/quick-play')}
                            className="font-texte bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 rounded-xl text-lg"
                        >
                            <Play className="h-5 w-5" fill="currentColor" />
                            Jouer maintenant
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => navigate('/mode/fillyrics?classic=1')}
                        className="font-texte h-11 rounded-xl text-sm"
                    >
                        Ouvrir le lobby classique
                    </Button>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground selection:bg-secondary selection:text-secondary-foreground min-h-screen overflow-x-hidden p-4 pb-40 font-sans md:p-6">
            <header className="border-border relative mb-12 flex flex-col items-center border-b pb-8">
                <div className="absolute top-0 left-0 z-20">
                    <Button variant="back" onClick={() => navigate('/')} className="font-texte">
                        <ArrowLeft className="h-5 w-5 md:mr-1" />
                        <span className="hidden sm:inline">Retour au Hub</span>
                    </Button>
                </div>
                <div className="absolute top-0 right-0 z-20">
                    <UserMenuButton />
                </div>

                <h1 className="font-titre titre-neon-secondary mt-12 mb-2 text-center text-5xl tracking-widest drop-shadow-[0_0_20px_rgba(64,201,255,0.4)] md:text-6xl">
                    FILLYRICS
                </h1>
                <p className="text-muted-foreground font-texte max-w-lg text-center text-lg md:text-xl">
                    Sélectionne tes artistes préférés pour lancer ta session de survie !
                </p>
            </header>

            <main>
                <SharedSearch
                    allowedTabs={['artists']}
                    defaultTab="artists"
                    renderArtistCard={(artist, isFavorite, onToggleFav) => (
                        <ArtistCard
                            key={`fill-artist-${artist.id}`}
                            artist={artist}
                            onClick={(a) => toggleSelection(a)}
                            isFavorite={isFavorite}
                            onToggleFavorite={onToggleFav}
                            isSelected={selection.some((s) => s.id === artist.id.toString())}
                        />
                    )}
                />
            </main>

            <motion.div
                layout
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="fixed right-4 bottom-4 z-50 flex w-[calc(100vw-2rem)] max-w-[420px] min-w-[260px] origin-bottom-right flex-col items-end gap-3 sm:right-6 sm:bottom-6 sm:w-[320px] md:w-[360px] lg:w-[28vw] xl:w-[22vw]"
            >
                <motion.div
                    layout
                    className="w-full overflow-hidden rounded-[30px] border border-white/10 bg-black/40 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-5"
                >
                    <motion.div
                        layout
                        className={`flex items-center justify-between gap-2 transition-colors duration-300 ${isExpanded ? 'mb-4 border-b border-white/10 pb-3' : ''}`}
                    >
                        {/* Le bouton de lancement dynamique (prend la place restante) */}
                        <motion.div layout className="min-w-0 flex-grow py-1 pl-1">
                            <Button
                                onClick={() =>
                                    navigate('/mode/fillyrics/play', {
                                        state: { selection },
                                    })
                                }
                                /* 👉 Ajout de overflow-hidden et relative sur le bouton pour masquer le texte qui glisse en dehors */
                                className="font-texte bg-secondary text-secondary-foreground hover:bg-secondary/80 relative flex h-9 w-full items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-sm shadow-[0_0_10px_rgba(64,201,255,0.3)] transition-all sm:h-10 sm:text-base"
                            >
                                <Play
                                    className="h-4 w-4 flex-shrink-0 sm:h-4 sm:w-4"
                                    fill="currentColor"
                                />

                                {/* 👉 NOUVEAU : Animation de roulette pour le texte */}
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.span
                                        key={selection.length === 0 ? 'pourtoi' : 'artistes'}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        className="truncate whitespace-nowrap"
                                    >
                                        {selection.length === 0 ? 'Lancer mes pourtoi' : 'Lancer'}
                                    </motion.span>
                                </AnimatePresence>
                            </Button>
                        </motion.div>

                        {/* Le bloc droit (Compteur + Flèche) protégé contre l'écrasement */}
                        <motion.div
                            layout
                            className="flex flex-shrink-0 items-center gap-2 sm:gap-3"
                        >
                            <AnimatePresence>
                                {selection.length > 0 && (
                                    <motion.span
                                        layout
                                        initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                        animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                        exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                        className="font-titre rounded-full bg-white/5 px-3 py-0.5 text-sm whitespace-nowrap text-white/70 sm:text-base"
                                    >
                                        {selection.length} artiste(s)
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* La flèche TOUJOURS PRÉSENTE */}
                            <motion.button
                                layout
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex-shrink-0 rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                                title={isExpanded ? 'Réduire le panneau' : 'Agrandir le panneau'}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <motion.div
                                key="basket-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="flex w-full flex-col overflow-hidden"
                            >
                                <motion.div layout className="w-full flex-grow py-1">
                                    {selection.length === 0 ? (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="font-texte flex aspect-[3/1] w-full items-center justify-center rounded-2xl border border-dashed border-white/5 p-4 text-center text-xs text-white/50 sm:text-sm"
                                        >
                                            Aucun artiste sélectionné. <br /> Lance la partie pour
                                            jouer avec les tendances du moment, ou ajoute tes
                                            favoris !
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            layout
                                            className="grid w-full grid-cols-5 gap-2 sm:gap-2.5"
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {selection.map((item) => (
                                                    <motion.div
                                                        key={`${item.type}-${item.id}`}
                                                        layout
                                                        variants={itemVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="exit"
                                                        onClick={() =>
                                                            toggleSelection(item.data as Artist)
                                                        }
                                                        className="group relative aspect-square w-full origin-center cursor-pointer" // 👈 Curseur pointeur ajouté
                                                        title={`Retirer ${item.name}`}
                                                    >
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className={`${
                                                                selection.length >= MAX_ITEMS
                                                                    ? 'border-destructive shadow-[0_0_10px_rgba(255,42,95,0.4)]'
                                                                    : 'border-secondary shadow-[0_0_10px_rgba(64,201,255,0.2)]'
                                                            } hover:border-destructive h-full w-full rounded-full border object-cover transition-all duration-300 group-hover:scale-95 group-hover:opacity-70`}
                                                        />
                                                        {/* La croix rouge a été complètement supprimée ! */}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>
    );
}
