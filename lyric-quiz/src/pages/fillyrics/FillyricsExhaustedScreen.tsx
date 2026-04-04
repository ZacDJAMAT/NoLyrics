import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Leaf, Wind, Home } from 'lucide-react';

export default function FillyricsExhaustedScreen() {
    const navigate = useNavigate();

    return (
        <div className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center selection:bg-[#4ade80] selection:text-black">
            {/* 🌿 Effet de fond : Un halo vert subtil qui pulse doucement */}
            <motion.div
                animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 z-0 m-auto h-[60vh] w-[60vh] rounded-full bg-[#4ade80] blur-[100px] md:blur-[150px]"
            />

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative z-10 flex w-full max-w-lg flex-col items-center"
            >
                {/* 🍃 L'icône de feuille avec une animation de lévitation */}
                <motion.div
                    animate={{ y: [-8, 8, -8], rotate: [-4, 4, -4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="mb-8 rounded-full border border-white/5 bg-black/40 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                >
                    <Leaf className="h-14 w-14 text-[#4ade80] drop-shadow-[0_0_15px_rgba(74,222,128,0.6)] sm:h-16 sm:w-16" />
                </motion.div>

                {/* 🏷️ Le Titre */}
                <h1 className="font-titre mb-6 text-5xl text-white drop-shadow-lg md:text-6xl">
                    CATALOGUE{' '}
                    <span className="text-[#4ade80] drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
                        VIDÉ
                    </span>
                </h1>

                {/* 📜 Le message encadré dans un glass-panel */}
                <div className="glass-panel mb-10 w-full p-6 sm:p-8">
                    <p className="font-texte text-lg leading-relaxed text-white/80 md:text-xl">
                        Wow, l'air commence à manquer ici... <br />
                        <br />
                        Tu as littéralement poncé <strong>100%</strong> des musiques disponibles
                        pour cette session.
                    </p>

                    <div className="mt-8 flex items-center justify-center gap-3 text-[#4ade80]/80">
                        <Wind className="h-5 w-5" />
                        <span className="font-texte text-xs tracking-widest uppercase sm:text-sm">
                            Il est temps d'aller toucher de l'herbe
                        </span>
                        <Wind className="h-5 w-5" />
                    </div>
                </div>

                {/* 🚪 Le bouton de sortie */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        onClick={() => navigate('/')}
                        className="font-texte flex h-14 items-center justify-center gap-3 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10 px-8 text-lg text-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.15)] backdrop-blur-md transition-colors hover:bg-[#4ade80]/20"
                    >
                        <Home className="h-5 w-5" />
                        Retour à la réalité
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
