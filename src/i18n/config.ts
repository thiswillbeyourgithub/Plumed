import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import { plumedName } from './plumed-name';

i18n.use(LanguageDetector)
    .use(plumedName)
    .use(initReactI18next)
    .init({
        resources: {
            fr: { translation: fr },
        },
        ns: ['translation'],
        defaultNS: 'translation',
        postProcess: ['plumed-name'],
        keySeparator: false,
        nsSeparator: false,
        fallbackLng: false,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            // htmlTag (lang=fr in index.html) instead of navigator: French by default
            order: ['localStorage', 'htmlTag'],
            caches: ['localStorage'],
        },
    });

// Plumed fork: the "default" UI language is French, not the OS language,
// because the speech model is much better at French than English.
export const DEFAULT_UI_LANGUAGE = 'fr';

/** Applies a saved language setting ("default", empty or a language code) to i18n. */
export const applyUiLanguage = (lang: string | null | undefined) => {
    const target = lang == null || lang.length === 0 || lang === 'default' ? DEFAULT_UI_LANGUAGE : lang;
    if (target !== i18n.language) {
        void i18n.changeLanguage(target);
    }
};

// Initialize language from Tauri settings on startup
if (typeof window !== 'undefined') {
    import('@tauri-apps/api/core')
        .then(({ invoke }) => invoke<string>('get_current_language'))
        .then(applyUiLanguage)
        .catch(() => {
            // If command fails, keep the detected language
        });
}

export default i18n;
