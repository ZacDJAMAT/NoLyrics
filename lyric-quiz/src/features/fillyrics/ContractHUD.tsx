import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContractIcon } from '@/components/icons/ContractIcon';
import { CheckCircle2 } from 'lucide-react';

interface ContractHUDProps {
    timeLeft: number;
    maxTime: number;
    currentPercent: number;
    thresholdPercent: number;
    isSecured: boolean;
}

export default function ContractHUD({
    timeLeft,
    maxTime,
    currentPercent,
    thresholdPercent,
    isSecured,
}: ContractHUDProps) {
    // 👉 1. LA MÉMOIRE INTERNE DE FIGEAGE
    // Le composant retient le pourcentage exact de brûlure au moment où le contrat est sécurisé
    const [frozenBurnPercent, setFrozenBurnPercent] = useState<number | null>(null);

    useEffect(() => {
        if (isSecured && frozenBurnPercent === null) {
            // Clic ! On prend en photo l'état exact de consumation actuel
            setFrozenBurnPercent(Math.max(0, Math.min(100, 100 - (timeLeft / maxTime) * 100)));
        } else if (!isSecured && frozenBurnPercent !== null) {
            // On réinitialise la mémoire quand on passe à un nouveau round (isSecured redevient faux)
            setFrozenBurnPercent(null);
        }
    }, [isSecured, timeLeft, maxTime, frozenBurnPercent]);

    // On utilise la mémoire figée si elle existe, sinon on suit le temps réel
    const burnPercentage =
        isSecured && frozenBurnPercent !== null
            ? frozenBurnPercent
            : Math.max(0, Math.min(100, 100 - (timeLeft / maxTime) * 100));

    // 👉 2. LE CERCLE AGRANDI (Radius 130)
    const radius = 140;
    const circumference = 2 * Math.PI * radius;

    let circleRatio = 0;
    if (!isSecured) {
        const safeThreshold = thresholdPercent > 0 ? thresholdPercent : 1;
        circleRatio = Math.min(currentPercent / safeThreshold, 1);
    } else {
        circleRatio = Math.max(0, timeLeft / maxTime);
    }

    const strokeOffset = circumference - circleRatio * circumference;

    return (
        <div className="relative mb-8 flex scale-[0.8] flex-col items-center justify-center p-8">
            {/* --- LE CERCLE DE PROGRESSION / TEMPS --- */}
            <div className="absolute inset-0 flex items-center justify-center">
                {/* On agrandit la zone SVG (280x320) pour laisser la place au rayon de 130 */}
                <svg
                    width="280"
                    height="320"
                    viewBox="0 0 280 320"
                    className="-rotate-90 transform"
                >
                    <circle
                        cx="140"
                        cy="160"
                        r={radius}
                        fill="transparent"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="6"
                    />
                    <motion.circle
                        cx="140"
                        cy="160"
                        r={radius}
                        fill="transparent"
                        stroke={isSecured ? 'var(--color-secondary)' : 'var(--color-destructive)'}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: strokeOffset }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{
                            filter: `drop-shadow(0 0 10px ${isSecured ? 'var(--color-secondary)' : 'var(--color-destructive)'})`,
                        }}
                    />
                </svg>
            </div>

            {/* --- L'ICÔNE DU CONTRAT ET LA FLAMME --- */}
            <div className="relative z-10 flex h-[140px] w-[100px] items-center justify-center">
                <div className="absolute inset-0 opacity-10">
                    <ContractIcon className="h-full w-full grayscale" />
                </div>

                <motion.div
                    className="absolute inset-0 z-10"
                    animate={{ clipPath: `inset(${burnPercentage}% 0% 0% 0%)` }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                >
                    <ContractIcon className="h-full w-full drop-shadow-xl" />
                </motion.div>

                {!isSecured && timeLeft > 0 && burnPercentage > 0 && (
                    <motion.div
                        animate={
                            timeLeft <= 5
                                ? {
                                      scale: [1, 1.1, 1],
                                      transition: { repeat: Infinity, duration: 0.5 },
                                  }
                                : {}
                        }
                    ></motion.div>
                )}
            </div>

            {/* --- LE TEXTE (UNIQUEMENT POUR LA SÉCURISATION) --- */}
            <div className="absolute -bottom-8 flex flex-col items-center gap-2">
                <AnimatePresence>
                    {isSecured && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.8 }}
                            className="bg-background/80 border-secondary/30 flex flex-col items-center gap-1 rounded-full border px-4 py-1.5 backdrop-blur-md"
                        >
                            <div className="font-titre text-secondary flex items-center gap-2 text-xs uppercase drop-shadow-[0_0_8px_rgba(64,201,255,0.8)] md:text-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                Contrat Sécurisé
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
