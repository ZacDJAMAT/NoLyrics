interface SpeedBonusBarProps {
    multiplier: number;
    seconds: number;
}

export default function SpeedBonusBar({ multiplier, seconds }: SpeedBonusBarProps) {
    const isCritical = multiplier < 0.25;

    // 👉 CALCUL DYNAMIQUE DE LA COULEUR : 120 = Vert (Emerald), 0 = Rouge (Destructive)
    const hue = Math.max(0, multiplier * 120);
    const colorStyle = `hsl(${hue}, 80%, 50%)`;
    const shadowStyle = `0 0 15px hsl(${hue}, 80%, 50%, 0.8)`;

    return (
        <div className="group flex w-full flex-col gap-2">
            <div className="font-texte flex items-end justify-between px-1">
                <span className="text-[9px] tracking-[0.3em] text-white/30 uppercase">
                    Stabilité du Flux
                </span>
                <span
                    className={`font-titre text-2xl transition-all duration-300 ${isCritical ? 'scale-110 animate-pulse' : ''}`}
                    style={{ color: colorStyle }}
                >
                    {seconds}s
                </span>
            </div>

            {/* Le Rail */}
            <div className="relative h-2 w-full rounded-full border border-white/5 bg-white/5 p-[2px]">
                {/* Le Laser d'Énergie qui change de couleur */}
                <div
                    className="relative h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{
                        width: `${multiplier * 100}%`,
                        backgroundColor: colorStyle,
                        boxShadow: shadowStyle,
                    }}
                >
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
