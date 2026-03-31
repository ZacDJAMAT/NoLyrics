import { useEffect, useRef } from 'react';
import { useSurvivalStore } from './useSurvivalStore';

export const useSurvivalLoop = () => {
    const { isSurviving, isLineActive, tick } = useSurvivalStore();
    const requestRef = useRef<number | undefined>(undefined);
    const previousTimeRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const loop = (time: number) => {
            if (previousTimeRef.current != undefined) {
                const deltaTime = time - previousTimeRef.current;
                // On appelle le tick du store uniquement si le jeu tourne et qu'une ligne est active
                if (isSurviving && isLineActive) {
                    tick(deltaTime);
                }
            }
            previousTimeRef.current = time;
            requestRef.current = requestAnimationFrame(loop);
        };

        if (isSurviving) {
            requestRef.current = requestAnimationFrame(loop);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            previousTimeRef.current = undefined;
        };
    }, [isSurviving, isLineActive, tick]);
};
