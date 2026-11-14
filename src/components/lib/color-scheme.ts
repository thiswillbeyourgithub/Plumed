export type ColorScheme = 'standard';

export const PALETTES: Record<ColorScheme, { center: string; accent: string; mid: string; edge: string }> = {
    standard: {
        center: 'hsl(239, 84%, 67%)',
        accent: 'hsl(199, 89%, 48%)',
        mid: 'hsl(199, 89%, 48%)',
        edge: 'hsl(180, 100%, 50%)',
    },
};
