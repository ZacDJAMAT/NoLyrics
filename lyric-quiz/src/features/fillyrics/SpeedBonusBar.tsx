interface SpeedBonusBarProps {
    multiplier: number;
    seconds: number; // 👉 On ajoute les secondes pour l'affichage numérique
}

export default function SpeedBonusBar({ multiplier, seconds }: SpeedBonusBarProps) {
    const isCritical = multiplier < 0.25;

    return (
        <div className="group flex w-full flex-col gap-2">
            <div className="font-texte flex items-end justify-between px-1">
                <span className="text-[9px] tracking-[0.3em] text-white/30 uppercase">
                    Stabilité du Flux
                </span>
                {/* 👉 TIMER NUMÉRIQUE RE-POSITIONNÉ ET LISIBLE */}
                <span
                    className={`font-titre text-2xl transition-all duration-300 ${isCritical ? 'text-destructive scale-110 animate-pulse' : 'text-emerald-400'}`}
                >
                    {seconds}s
                </span>
            </div>

            {/* Le Rail Laser */}
            <div className="relative h-2 w-full rounded-full border border-white/5 bg-white/5 p-[2px]">
                {/* Le Laser d'Énergie */}
                <div
                    className={`relative h-full rounded-full transition-all duration-1000 ease-linear ${
                        isCritical
                            ? 'bg-destructive shadow-[0_0_15px_rgba(255,42,95,1)]'
                            : 'bg-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.8)]'
                    }`}
                    style={{ width: `${multiplier * 100}%` }}
                >
                    {/* Effet de brillance au bout du laser */}
                    <div className="absolute top-0 right-0 bottom-0 w-8 rounded-full bg-white/20 blur-md" />
                    <div className="absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_white]" />
                </div>
            </div>

            <div className="font-texte mt-1 text-right text-[8px] tracking-widest text-white/20 uppercase">
                Multiplicateur : x{(1 + multiplier).toFixed(2)}
            </div>
        </div>
    );
}
