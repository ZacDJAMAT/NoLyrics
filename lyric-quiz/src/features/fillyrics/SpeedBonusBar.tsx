interface SpeedBonusBarProps {
    multiplier: number;
}

export default function SpeedBonusBar({ multiplier }: SpeedBonusBarProps) {
    return (
        <div className="mb-4 flex w-full flex-col gap-1">
            <div className="font-texte flex justify-between text-[10px] text-white/50 uppercase">
                <span>Bonus Vitesse</span>
                <span>x{(1 + multiplier).toFixed(2)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
                <div
                    className="h-full bg-emerald-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${multiplier * 100}%` }}
                />
            </div>
        </div>
    );
}
