import { PALETTES } from '@/components/lib/color-scheme';

export const MIN_RESULT_PANEL_SECS = 2;
export const MAX_RESULT_PANEL_SECS = 15;

export const RESULT_PANEL_SEGMENT_MASK = 'repeating-linear-gradient(to right, #000 0 10px, transparent 10px 12px)';

export const clampResultPanelDurationSecs = (secs: number) =>
    Math.min(MAX_RESULT_PANEL_SECS, Math.max(MIN_RESULT_PANEL_SECS, secs));

export const buildResultPanelGradient = () => {
    const { edge, mid, center } = PALETTES.standard;
    return `linear-gradient(to right, ${edge} 0%, ${mid} 25%, ${center} 50%, ${mid} 75%, ${edge} 100%)`;
};
