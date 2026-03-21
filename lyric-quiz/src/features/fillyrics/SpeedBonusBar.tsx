interface SpeedBonusBarProps {
    multiplier: number;
}

export default function SpeedBonusBar({ multiplier }: SpeedBonusBarProps) {
    return (
        <div className="mb-4 flex w-full flex-col gap-1.5">
            <div className="font-texte flex justify-between text-[10px] tracking-wider text-white/50 uppercase">
                <span>Bonus Vitesse</span>
                <span className="font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                    x{(1 + multiplier).toFixed(2)}
                </span>
            </div>

            {/* Conteneur de la barre */}
            <div className="relative h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/60 shadow-inner">
                {/* Jauge qui se vide avec dégradé émeraude */}
                <div
                    className="linear absolute top-0 bottom-0 left-0 z-10 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] transition-all duration-1000"
                    style={{ width: `${multiplier * 100}%` }}
                >
                    {/* Tête de lecture lumineuse */}
                    <div className="absolute top-0 right-0 bottom-0 w-2 rounded-full bg-white/50 blur-[1px]" />
                </div>
            </div>
        </div>
    );
}
