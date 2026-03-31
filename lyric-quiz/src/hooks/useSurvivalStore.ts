import { create } from 'zustand';

// Paramètres d'équilibrage (Game Design)
const BALANCE = {
    START_HYPE: 50,
    MAX_HYPE: 100,
    FEVER_END_THRESHOLD: 50, // Le palier où le Fever Mode s'arrête
    NORMAL_DRAIN_PER_SEC: 3, // -3% par seconde
    FEVER_DRAIN_PER_SEC: 10, // -10% par seconde en surchauffe
    MISS_PENALTY: 15, // -15% punition immédiate
    HIT_REWARD: 8, // +8% par mot trouvé (à ajuster)
};

interface SurvivalState {
    // État global
    isSurviving: boolean;
    hype: number;
    score: number;
    coins: number;

    // États dérivés du mode Fever
    isFeverMode: boolean;
    multiplier: number;

    // Filet de sécurité
    isLineActive: boolean;

    // Actions
    startGame: () => void;
    endGame: () => void;
    setLineActive: (isActive: boolean) => void;

    // Événements de frappe
    hitWord: (basePoints: number) => void;
    missWord: () => void;

    // La boucle de temps (appelée par requestAnimationFrame)
    tick: (deltaTimeMs: number) => void;

    reset: () => void;

    isVideoPlaying: boolean;
    setVideoPlaying: (isPlaying: boolean) => void;
}

export const useSurvivalStore = create<SurvivalState>((set) => ({
    isSurviving: false,
    hype: BALANCE.START_HYPE,
    score: 0,
    coins: 0,
    isFeverMode: false,
    multiplier: 1,
    isLineActive: false, // Par défaut, on ne draine pas si aucune phrase n'est affichée
    isVideoPlaying: false,
    setVideoPlaying: (isPlaying) => set({ isVideoPlaying: isPlaying }),

    startGame: () =>
        set({
            isSurviving: true,
            hype: BALANCE.START_HYPE,
            score: 0,
            coins: 0,
            isFeverMode: false,
            multiplier: 1,
            isLineActive: false,
        }),

    endGame: () => set({ isSurviving: false }),

    setLineActive: (isActive) => set({ isLineActive: isActive }),

    hitWord: (basePoints) =>
        set((state) => {
            if (!state.isSurviving) return state;

            const newHype = Math.min(BALANCE.MAX_HYPE, state.hype + BALANCE.HIT_REWARD);
            const isNowFever = state.isFeverMode || newHype === BALANCE.MAX_HYPE;

            return {
                hype: newHype,
                isFeverMode: isNowFever,
                multiplier: isNowFever ? 3 : 1,
                score: state.score + basePoints * state.multiplier,
                // On gagne des coins uniquement en Fever Mode !
                coins: isNowFever ? state.coins + 1 : state.coins,
            };
        }),

    missWord: () =>
        set((state) => {
            if (!state.isSurviving) return state;

            const newHype = Math.max(0, state.hype - BALANCE.MISS_PENALTY);
            // Si on rate un mot, on perd direct le Fever Mode (punition sévère)
            const isFever = false;

            return {
                hype: newHype,
                isFeverMode: isFever,
                multiplier: 1,
                isSurviving: newHype > 0, // GAME OVER si on tombe à 0
            };
        }),

    tick: (deltaTimeMs) =>
        set((state) => {
            // Si la vidéo buffer ou est en pause, on fige le jeu (Filet de sécurité technique !)
            if (!state.isSurviving || !state.isLineActive || !state.isVideoPlaying) return state;

            // Calcul de la perte en fonction du delta time (pour une fluidité parfaite peu importe les FPS)
            const drainRate = state.isFeverMode
                ? BALANCE.FEVER_DRAIN_PER_SEC
                : BALANCE.NORMAL_DRAIN_PER_SEC;
            const hypeLoss = (drainRate * deltaTimeMs) / 1000;

            let newHype = state.hype - hypeLoss;
            let newFeverMode = state.isFeverMode;
            let newMultiplier = state.multiplier;

            // Gestion de la descente du Fever Mode (Le Cooldown)
            if (state.isFeverMode && newHype <= BALANCE.FEVER_END_THRESHOLD) {
                newFeverMode = false;
                newMultiplier = 1;
            }

            // Gestion du Game Over
            if (newHype <= 0) {
                newHype = 0;
                return { hype: 0, isSurviving: false }; // HYPE KILL !
            }

            return {
                hype: newHype,
                isFeverMode: newFeverMode,
                multiplier: newMultiplier,
            };
        }),

    reset: () =>
        set({
            isSurviving: false,
            hype: BALANCE.START_HYPE,
            score: 0,
            coins: 0,
            isFeverMode: false,
            multiplier: 1,
            isLineActive: false,
        }),
}));
