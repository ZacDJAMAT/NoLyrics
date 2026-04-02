import { useEffect, useRef } from 'react';
import { GameStatus } from '@/types';

interface FillyricsInlineComposerProps {
    currentInput: string;
    onInputChange: (val: string) => void;
    gameStatus: GameStatus;
}

export default function FillyricsInlineComposer({
    currentInput,
    onInputChange,
    gameStatus,
}: FillyricsInlineComposerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Maintient le focus forcé sur l'input invisible pour que le clavier mobile reste ouvert
    // et que le joueur n'ait pas besoin de cliquer quelque part pour taper.
    useEffect(() => {
        const handleFocus = () => {
            if (gameStatus === 'playing' && inputRef.current) {
                inputRef.current.focus();
            }
        };

        handleFocus();

        // Si le joueur clique ailleurs, on le re-focus instantanément
        window.addEventListener('click', handleFocus);
        // Si le joueur tape sur le clavier, on sécurise le focus
        window.addEventListener('keydown', handleFocus);

        return () => {
            window.removeEventListener('click', handleFocus);
            window.removeEventListener('keydown', handleFocus);
        };
    }, [gameStatus]);

    if (gameStatus !== 'playing') return null;

    return (
        <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            // Le secret de l'invisibilité (mais accessible au DOM pour le clavier virtuel)
            className="pointer-events-none absolute top-0 left-0 h-[1px] w-[1px] opacity-0"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
        />
    );
}
