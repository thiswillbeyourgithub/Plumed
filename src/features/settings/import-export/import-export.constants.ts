import { Settings, Keyboard, MicVocal, Smartphone, AlignLeft, BookText } from 'lucide-react';
import { CategoryDefinition } from './import-export.types';

export const CURRENT_MURMURE_FORMAT_VERSION = 1;

export const DICTIONARY_PREVIEW_LIMIT = 15;

export const SUB_ITEM_KEY = {
    rule: (id: string) => `rule_${id}`,
    word: (word: string) => `word_${word}`,
} as const;

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
    {
        key: 'settings',
        label: 'System Settings',
        icon: Settings,
        supportsMerge: false,
        subItems: [],
    },
    {
        key: 'shortcuts',
        label: 'Shortcuts',
        icon: Keyboard,
        supportsMerge: false,
        subItems: [],
    },
    {
        key: 'voice_mode',
        label: 'Voice Mode',
        icon: MicVocal,
        supportsMerge: false,
        subItems: [],
    },
    {
        key: 'smartmic',
        label: 'SmartMic',
        icon: Smartphone,
        supportsMerge: false,
        subItems: [],
    },
    {
        key: 'formatting_rules',
        label: 'Formatting Rules',
        icon: AlignLeft,
        supportsMerge: true,
        subItems: [{ key: 'built_in', label: 'Built-in Options' }],
    },
    {
        key: 'dictionary',
        label: 'Dictionary',
        icon: BookText,
        supportsMerge: true,
        subItems: [],
    },
];
