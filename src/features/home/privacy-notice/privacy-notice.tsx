import { ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/i18n';

// Plumed fork (written with Claude Code): states on the home page that
// medical dictation stays on the computer. Text kept here in both languages
// so upstream locale files stay untouched. Prompt Mode (the only feature
// that could send transcripts to a remote server) was removed, so there is
// no exception left to mention.

const TEXT = {
    en: {
        title: '100% local: your audio and transcripts never leave this computer.',
        detail: 'Transcription runs entirely on this computer: no cloud service, no remote AI server.',
    },
    fr: {
        title: '100 % local : votre audio et vos transcriptions ne quittent jamais cet ordinateur.',
        detail: "La transcription se fait entièrement sur cet ordinateur : aucun service cloud, aucun serveur d'IA distant.",
    },
};

export const PrivacyNotice = () => {
    const { i18n } = useTranslation();
    const text = TEXT[i18n.language.startsWith('fr') ? 'fr' : 'en'];

    return (
        <div className="flex items-start gap-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
            <div className="space-y-0.5">
                <p className="font-semibold text-foreground">{text.title}</p>
                <p className="text-xs text-muted-foreground">{text.detail}</p>
            </div>
        </div>
    );
};
