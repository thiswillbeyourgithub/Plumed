import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CATEGORY_DEFINITIONS } from '../../import-export.constants';
import { AppSettings, CategorySelection } from '../../import-export.types';
import { FormattingSettings, FormattingRule } from '@/features/personalize/formatting-rules/types';
import { buildInitialSelection } from '../export-section.helpers';

export const useExportData = () => {
    const [exportSelection, setExportSelection] = useState<CategorySelection>(() =>
        Object.fromEntries(CATEGORY_DEFINITIONS.map((def) => [def.key, { selected: true, subItems: {} }]))
    );
    const [rules, setRules] = useState<FormattingRule[]>([]);
    const [dictionaryWords, setDictionaryWords] = useState<string[]>([]);
    const [allSettings, setAllSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [formattingRules, dictionary, settings] = await Promise.all([
                    invoke<FormattingSettings>('get_formatting_settings'),
                    invoke<string[]>('get_dictionary'),
                    invoke<AppSettings>('get_all_settings'),
                ]);

                setRules(formattingRules.rules);
                setDictionaryWords(dictionary);
                setAllSettings(settings);
                setExportSelection(buildInitialSelection(formattingRules, dictionary));
            } catch {
                // Data loading is best-effort, fail silently
            }
        };

        void loadData();
    }, []);

    return {
        rules,
        dictionaryWords,
        allSettings,
        exportSelection,
        setExportSelection,
    };
};
