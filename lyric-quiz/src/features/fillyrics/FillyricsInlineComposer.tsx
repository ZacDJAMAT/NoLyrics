import { useEffect, useRef } from 'react';
import { GameStatus } from '@/types';

interface FillyricsInlineComposerProps {
    currentInput: string;
    onInputChange: (val: string) => void;
    gameStatus: GameStatus;
    onTabPress: () => void; // 👈 NOUVELLE PROP
}

export default function FillyricsInlineComposer({
    currentInput,
    onInputChange,
    gameStatus,
    onTabPress,
}: FillyricsInlineComposerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleFocus = () => {
            if (gameStatus === 'playing' && inputRef.current) {
                inputRef.current.focus({ preventScroll: true });
            }
        };

        handleFocus();

        window.addEventListener('click', handleFocus);
        const handleKeyDown = () => handleFocus();
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('click', handleFocus);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameStatus]);

    if (gameStatus !== 'playing') return null;

    return (
        <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
                // 👉 SI LE JOUEUR APPUIE SUR TAB :
                if (e.key === 'Tab') {
                    e.preventDefault(); // On empêche la page de descendre / changer le focus
                    onTabPress(); // On passe au mot suivant !
                }
            }}
            className="pointer-events-none fixed top-1/2 left-1/2 -z-50 h-[1px] w-[1px] opacity-0"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
        />
    );
}
