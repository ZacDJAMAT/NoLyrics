import React from 'react';
import { GameStatus } from '../types';

interface ScoreBoardProps {
    scorePercentage: number;
    foundWordsCount: number;
    totalWords: number;
    currentInput: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    gameStatus: GameStatus;
    isFetchingLyrics: boolean;
    timeLeft: number;
    formattedTime: string;
}

export default function ScoreBoard({
                                       scorePercentage, foundWordsCount, totalWords, currentInput, handleInputChange, gameStatus, isFetchingLyrics, timeLeft, formattedTime
                                   }: ScoreBoardProps) {
    return (
        <div className={`flex justify-between items-center bg-neutral-800 p-6 rounded-2xl shadow-xl sticky top-[88px] z-10 border transition-colors ${gameStatus === 'won' ? 'border-green-500' : gameStatus === 'lost' ? 'border-red-500' : 'border-neutral-700'}`}>
            <div className="text-center w-24">
                <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold mb-1">Score</p>
                <p className="text-3xl font-bold text-pink-500">{scorePercentage}%</p>
                <p className="text-neutral-500 text-sm">{foundWordsCount} / {totalWords}</p>
            </div>

            <div className="flex-1 max-w-sm mx-8 flex justify-center">
                {gameStatus === 'playing' ? (
                    <input
                        type="text"
                        placeholder="Tape un mot ici..."
                        disabled={isFetchingLyrics || gameStatus !== 'playing'}
                        value={currentInput}
                        onChange={handleInputChange}
                        autoFocus
                        className="w-full bg-neutral-700 text-white px-6 py-4 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all text-2xl text-center placeholder:text-neutral-500 shadow-inner font-semibold"
                    />
                ) : (
                    <div className="text-2xl font-bold text-neutral-300">
                        {gameStatus === 'won' ? 'Score Parfait !' : 'Partie terminée'}
                    </div>
                )}
            </div>

            <div className="text-center w-24">
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-red-400 animate-pulse' : 'text-neutral-400'}`}>Temps</p>
                <p className={`text-3xl font-bold font-mono ${timeLeft <= 30 && gameStatus === 'playing' ? 'text-red-400' : ''}`}>
                    {formattedTime}
                </p>
            </div>
        </div>
    );
}