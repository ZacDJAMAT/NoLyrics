import { useEffect, useState } from 'react';
import { useSurvivalStore } from '@/hooks/useSurvivalStore';
//import { Flame } from 'lucide-react';

export default function SurvivalHypeBar() {
    const { hype, isFeverMode, multiplier } = useSurvivalStore();
    const [isShaking, setIsShaking] = useState(false);
    const [lastHype, setLastHype] = useState(hype);

    // Effet de "dégât" si la hype chute d'un coup (erreur du joueur)
    useEffect(() => {
        if (lastHype - hype > 10) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 300);
        }
        setLastHype(hype);
    }, [hype, lastHype]);

    return (
        <div className={`mb-6 flex w-full flex-col gap-2 ${isShaking ? 'animate-shake' : ''}`}>
            <div className="font-texte flex items-center justify-between text-xs tracking-widest uppercase">
                <span
                    className={`transition-colors duration-300 ${
                        isFeverMode
                            ? 'font-bold text-[#E81CFF] drop-shadow-[0_0_8px_rgba(232,28,255,0.8)]'
                            : hype < 20
                              ? 'animate-pulse font-bold text-red-500'
                              : 'text-white/70'
                    }`}
                >
                    {isFeverMode ? '🔥 FEVER MODE ACTIVE' : 'HYPE LEVEL'}
                </span>

                {multiplier > 1 && (
                    <span className="font-titre animate-pulse text-lg text-[#E81CFF] drop-shadow-[0_0_10px_rgba(232,28,255,0.6)]">
                        x{multiplier}
                    </span>
                )}
            </div>

            <div className="relative h-4 w-full overflow-hidden rounded-full border border-white/10 bg-black/80 shadow-inner">
                {/* Jauge de remplissage */}
                <div
                    className={`absolute top-0 bottom-0 left-0 transition-[width,background-color] duration-100 ease-linear ${
                        isFeverMode
                            ? 'bg-gradient-to-r from-pink-600 via-fuchsia-500 to-[#E81CFF] shadow-[0_0_20px_rgba(232,28,255,0.8)]'
                            : hype < 20
                              ? 'bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_15px_rgba(255,0,0,0.6)]'
                              : 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(64,201,255,0.5)]'
                    }`}
                    style={{ width: `${hype}%` }}
                >
                    {/* Tête de lecture lumineuse */}
                    <div className="absolute top-0 right-0 bottom-0 w-2 rounded-full bg-white/80 blur-[2px]" />
                </div>
            </div>
        </div>
    );
}
