interface ContractProgressBarProps {
    percent: number;
    threshold: number;
    isSuccess: boolean;
}

export default function ContractProgressBar({
    percent,
    threshold,
    isSuccess,
}: ContractProgressBarProps) {
    return (
        <div className="relative flex w-full flex-col gap-2">
            <div className="font-texte z-10 flex justify-between px-1 text-[10px] tracking-widest uppercase">
                <span
                    className={`transition-colors duration-700 ${isSuccess ? 'text-secondary drop-shadow-[0_0_8px_rgba(64,201,255,1)]' : 'text-white/40'}`}
                >
                    Contrat {isSuccess ? 'Validé' : 'En attente'}
                </span>
                <span className="text-white/40">
                    {percent}% / {threshold}%
                </span>
            </div>

            {/* Le Rail de fond */}
            <div className="relative h-1.5 w-full overflow-visible rounded-full bg-white/5">
                {/* Le marqueur de Seuil (Petit losange lumineux) */}
                <div
                    className="absolute top-1/2 z-20 h-2 w-2 -translate-y-1/2 rotate-45 bg-white shadow-[0_0_10px_white] transition-all"
                    style={{ left: `calc(${threshold}% - 4px)` }}
                />

                {/* Le "Plasma" de remplissage */}
                <div
                    className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ease-out ${
                        isSuccess
                            ? 'bg-secondary shadow-[0_0_20px_rgba(64,201,255,0.8),_0_0_40px_rgba(64,201,255,0.4)]'
                            : 'bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                >
                    {/* Tête de lecture (L'étincelle au bout) */}
                    <div className="absolute top-1/2 -right-1 h-3 w-3 -translate-y-1/2 rounded-full bg-white blur-[2px]" />
                </div>
            </div>
        </div>
    );
}
