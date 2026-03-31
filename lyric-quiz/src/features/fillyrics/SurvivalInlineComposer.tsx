import { useEffect, useRef, useState } from 'react';

interface SurvivalInlineComposerProps {
    targetWord: string;
    onValidGuess: () => void;
    isActive: boolean; // Si c'est à ce mot d'être tapé
}

const CLEAN_REGEX = /[^\w\sÀ-ÿ]/g;

export default function SurvivalInlineComposer({
    targetWord,
    onValidGuess,
    isActive,
}: SurvivalInlineComposerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [buffer, setBuffer] = useState('');

    // Force le focus si c'est le mot actif (Garde le clavier ouvert !)
    useEffect(() => {
        if (isActive && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isActive]);

    // Validation à chaque frappe (Levenshtein simplifié pour la démo)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setBuffer(val);

        // Nettoyage pour comparaison
        const cleanVal = val.replace(CLEAN_REGEX, '').toLowerCase();
        const cleanTarget = targetWord.replace(CLEAN_REGEX, '').toLowerCase();

        // Si c'est validé (Ici tolérance 0 pour l'exemple, tu y brancheras ton Levenshtein)
        if (cleanVal === cleanTarget || cleanVal.includes(cleanTarget)) {
            setBuffer(targetWord); // On affiche le beau mot fini
            onValidGuess(); // On prévient le parent de passer au mot suivant
        }
    };

    return (
        <span className="relative mx-1 inline-block">
            {/* L'affichage visuel (La glass-cell) */}
            <span
                className={`inline-block min-w-[3rem] border-b-2 px-1 text-center transition-all duration-200 ${
                    isActive
                        ? 'border-secondary bg-white/10 text-white shadow-[inset_0_-2px_8px_rgba(64,201,255,0.3)]'
                        : 'border-white/20 bg-black/40 text-white/30'
                }`}
            >
                {isActive ? buffer || <span className="opacity-0">{targetWord}</span> : ' '}
                {isActive && (
                    <span className="bg-secondary ml-[2px] inline-block h-[1em] w-[2px] animate-pulse align-middle" />
                )}
            </span>

            {/* L'Input Invisible (Le vrai moteur) */}
            {isActive && (
                <input
                    ref={inputRef}
                    type="text"
                    value={buffer}
                    onChange={handleChange}
                    onBlur={() => {
                        // Anti-fermeture du clavier mobile
                        setTimeout(() => inputRef.current?.focus(), 10);
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="absolute inset-0 h-full w-full opacity-0"
                />
            )}
        </span>
    );
}
