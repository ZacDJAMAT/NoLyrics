const parseBooleanFlag = (value: string | undefined): boolean => {
    if (!value) return false;

    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

export const featureFlags = {
    fillyricsZeroFriction: parseBooleanFlag(import.meta.env.VITE_FF_FILLYRICS_ZERO_FRICTION),
};

