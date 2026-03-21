//import React from 'react';

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
        <div className="mb-2 flex w-full flex-col gap-1">
            <div className="font-texte flex justify-between text-xs uppercase">
                <span className={isSuccess ? 'text-secondary font-bold' : 'text-destructive'}>
                    Contrat : {isSuccess ? 'Sécurisé !' : 'En danger'}
                </span>
                <span className="text-white/50">Seuil: {threshold}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
                <div
                    className={`h-full transition-all duration-500 ${isSuccess ? 'bg-secondary shadow-[0_0_10px_rgba(64,201,255,0.8)]' : 'bg-destructive'}`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
                <div
                    className="absolute top-0 bottom-0 z-10 w-1 bg-white/80 shadow-sm"
                    style={{ left: `${threshold}%` }}
                />
            </div>
        </div>
    );
}
