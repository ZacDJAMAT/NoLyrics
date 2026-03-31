import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Sparkles } from 'lucide-react';

import { GameStatus } from '@/types';

interface FillyricsInlineComposerProps {
    gameStatus: GameStatus;
    disabled?: boolean;
    onSubmitGuess: (guess: string) => boolean;
}

const TOKEN_SEPARATOR_REGEX = /[\s.,!?;:()[\]{}"'`’“”\-_/\\]+/g;
const ENDS_WITH_SEPARATOR_REGEX = /[\s.,!?;:()[\]{}"'`’“”\-_/\\]$/;

const splitTokenBuffer = (value: string) => {
    if (!value) return { finalizedTokens: [] as string[], remainingToken: '' };

    const parts = value.split(TOKEN_SEPARATOR_REGEX);
    const hasSeparatorAtEnd = ENDS_WITH_SEPARATOR_REGEX.test(value);

    if (hasSeparatorAtEnd) {
        return {
            finalizedTokens: parts.filter((token) => token.trim().length > 0),
            remainingToken: '',
        };
    }

    const remainingToken = parts.pop() ?? '';
    return {
        finalizedTokens: parts.filter((token) => token.trim().length > 0),
        remainingToken,
    };
};

export default function FillyricsInlineComposer({
    gameStatus,
    disabled = false,
    onSubmitGuess,
}: FillyricsInlineComposerProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [buffer, setBuffer] = useState('');

    const isPlayable = useMemo(
        () => !disabled && gameStatus === 'playing',
        [disabled, gameStatus]
    );

    const focusInput = useCallback(() => {
        if (!isPlayable) return;
        inputRef.current?.focus({ preventScroll: true });
    }, [isPlayable]);

    useEffect(() => {
        if (!isPlayable) {
            setBuffer('');
            return;
        }

        const timer = setTimeout(() => focusInput(), 30);
        return () => clearTimeout(timer);
    }, [isPlayable, focusInput]);

    const handleTokenizedSubmit = useCallback(
        (rawValue: string) => {
            const { finalizedTokens, remainingToken } = splitTokenBuffer(rawValue);
            for (const token of finalizedTokens) {
                onSubmitGuess(token);
            }
            setBuffer(remainingToken);
        },
        [onSubmitGuess]
    );

    const flushRemainingToken = useCallback(() => {
        if (!buffer.trim()) return;
        onSubmitGuess(buffer.trim());
        setBuffer('');
    }, [buffer, onSubmitGuess]);

    return (
        <div className="mb-4 flex w-full justify-center">
            <div
                role="button"
                tabIndex={0}
                onPointerDown={(event) => {
                    event.preventDefault();
                    focusInput();
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        focusInput();
                    }
                }}
                className={`relative w-full max-w-2xl rounded-2xl border px-4 py-3 text-center transition-all ${
                    isPlayable
                        ? 'border-secondary/35 bg-secondary/10 shadow-[0_0_18px_rgba(64,201,255,0.2)]'
                        : 'border-white/10 bg-white/5'
                }`}
            >
                <div className="font-texte mb-2 flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] text-white/55 uppercase">
                    <Keyboard className="h-3.5 w-3.5" />
                    <span>Saisie In-Line</span>
                    {isPlayable && <Sparkles className="text-secondary h-3.5 w-3.5" />}
                </div>

                <div className="font-titre text-lg md:text-2xl">
                    <span
                        className={
                            buffer
                                ? 'text-secondary [text-shadow:0_0_10px_rgba(64,201,255,0.7)]'
                                : 'text-white/35'
                        }
                    >
                        {buffer || 'Tape directement ici...'}
                    </span>
                    {isPlayable && (
                        <span className="bg-secondary ml-1 inline-block h-5 w-[2px] animate-pulse align-middle md:h-7" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={buffer}
                    disabled={!isPlayable}
                    onChange={(event) => handleTokenizedSubmit(event.target.value)}
                    onBlur={() => {
                        if (!isPlayable) return;
                        setTimeout(() => focusInput(), 40);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            flushRemainingToken();
                        }
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="pointer-events-none absolute h-px w-px opacity-0"
                    aria-label="Saisie des paroles en ligne"
                />
            </div>
        </div>
    );
}
