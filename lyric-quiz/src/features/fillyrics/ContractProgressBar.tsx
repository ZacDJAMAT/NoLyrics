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
        <div className="mb-3 flex w-full flex-col gap-2">
            <div className="font-texte flex justify-between text-xs tracking-widest uppercase">
                <span
                    className={`transition-colors duration-500 ${isSuccess ? 'text-secondary font-bold drop-shadow-[0_0_5px_rgba(64,201,255,0.8)]' : 'text-destructive'}`}
                >
                    Contrat : {isSuccess ? 'Sécurisé' : 'En cours...'}
                </span>
                <span className="text-white/50">Seuil : {threshold}%</span>
            </div>

            {/* Conteneur de la barre (Plus épais) */}
            <div className="relative h-4 w-full overflow-hidden rounded-full border border-white/10 bg-black/60 shadow-inner">
                {/* Le marqueur de seuil (Ligne blanche éclatante) */}
                <div
                    className="absolute top-0 bottom-0 z-20 w-[2px] bg-white/90 shadow-[0_0_5px_white]"
                    style={{ left: `${threshold}%` }}
                />

                {/* La jauge de remplissage avec dégradé et halo */}
                <div
                    className={`absolute top-0 bottom-0 left-0 z-10 rounded-full transition-all duration-500 ease-out ${
                        isSuccess
                            ? 'from-secondary/40 to-secondary bg-gradient-to-r shadow-[0_0_15px_rgba(64,201,255,0.8)]'
                            : 'from-destructive/40 to-destructive bg-gradient-to-r shadow-[0_0_10px_rgba(255,42,95,0.8)]'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                >
                    {/* Tête de lecture lumineuse (Le bout du néon) */}
                    <div className="absolute top-0 right-0 bottom-0 w-4 rounded-full bg-white/40 blur-[2px]" />
                </div>
            </div>
        </div>
    );
}
