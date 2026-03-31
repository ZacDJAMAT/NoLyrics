export const levenshteinDistance = (a: string, b: string): number => {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const previous = new Array<number>(b.length + 1);
    const current = new Array<number>(b.length + 1);

    for (let j = 0; j <= b.length; j += 1) previous[j] = j;

    for (let i = 1; i <= a.length; i += 1) {
        current[0] = i;

        for (let j = 1; j <= b.length; j += 1) {
            const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(
                current[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + substitutionCost
            );
        }

        for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
    }

    return previous[b.length];
};

export const allowedLevenshteinDistance = (targetLength: number): number => {
    if (targetLength <= 4) return 0;
    if (targetLength <= 7) return 1;
    return 2;
};

