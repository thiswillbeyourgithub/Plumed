import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation, applyUiLanguage } from '@/i18n';

export const useLanguageState = () => {
    const [currentLang, setCurrentLang] = useState<string>('default');
    const { t } = useTranslation();

    const applyLanguage = (lang: string) => {
        applyUiLanguage(lang);
        setCurrentLang(lang.length > 0 ? lang : 'default');
    };

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLang = await invoke<string>('get_current_language');
                applyLanguage(savedLang || 'default');
            } catch (error) {
                console.error('Failed to load language:', error);
                toast.error(t('Failed to load language'));
            }
        };
        void loadLanguage();
    }, []);

    const setLanguage = async (lang: string) => {
        try {
            await invoke('set_current_language', { lang });
            applyLanguage(lang);
        } catch (error) {
            console.error('Failed to save language:', error);
            toast.error(t('Failed to save language'));
        }
    };

    return {
        currentLang,
        setLanguage,
    };
};
