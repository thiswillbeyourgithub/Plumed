import { Mic, QrCode } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { PALETTES } from '@/components/lib/color-scheme';
import { PreviewCell } from '@/features/extensions/extension-demo/preview-cell/preview-cell';
import { PreviewArrow } from '@/features/extensions/extension-demo/preview-arrow/preview-arrow';

export const SmartMicPreview = () => {
    const { t } = useTranslation();
    const accentColor = PALETTES.standard.accent;

    const sampleText = t("Hello everyone, let's start.");

    return (
        <div className="grid grid-cols-1 gap-4 text-left lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <PreviewCell label={t('Scan')} centered>
                <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                    <span className="text-sm text-foreground">{t('the QR code')}</span>
                </div>
            </PreviewCell>

            <PreviewArrow horizontalFrom="lg" />

            <PreviewCell label={t('Speak into your phone')} centered>
                <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 shrink-0 motion-safe:animate-pulse" style={{ color: accentColor }} />
                    <span className="text-sm italic text-foreground">{t('"{{text}}"', { text: sampleText })}</span>
                </div>
            </PreviewCell>

            <PreviewArrow horizontalFrom="lg" />

            <PreviewCell label={t("It's typed on your PC")} labelStyle={{ color: accentColor }} centered>
                <span className="text-sm text-foreground">{sampleText}</span>
            </PreviewCell>
        </div>
    );
};
