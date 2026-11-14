import { FormattingRule } from '@/features/personalize/formatting-rules/types';
import {
    CategoryKey,
    CategoryDefinition,
    CategorySelection,
    DynamicSubItemsRenderer,
    ExportedCategories,
    ExportedFormattingSettings,
    ExportedSystemSettings,
    ShortcutSettings,
    VoiceModeSettings,
    SmartMicSettings,
    AppSettings,
} from './import-export.types';
import { CATEGORY_DEFINITIONS, SUB_ITEM_KEY } from './import-export.constants';

export const buildSubItems = (keys: string[], staticKeys: string[] = []): Record<string, boolean> =>
    Object.fromEntries([...staticKeys, ...keys].map((k) => [k, true]));

export const formatRuleLabel = (rule: FormattingRule): string => {
    const trigger = rule.trigger || '(empty)';
    const replacement =
        rule.replacement.length > 20
            ? `${rule.replacement.replaceAll('\n', '\u21B5').substring(0, 20)}...`
            : rule.replacement.replaceAll('\n', '\u21B5') || '(delete)';
    return `${trigger} \u2192 ${replacement}`;
};

export const hasSubItems = (def: CategoryDefinition, selection: CategorySelection): boolean => {
    const subKeys = Object.keys(selection[def.key]?.subItems ?? {});
    return subKeys.length > 0;
};

export const isCategoryOn = (categoryKey: string, selection: CategorySelection): boolean => {
    const cat = selection[categoryKey];
    if (!cat?.selected) {
        return false;
    }
    const subValues = Object.values(cat.subItems);
    return subValues.length === 0 || subValues.some(Boolean);
};

export const getCounterValue = (
    def: CategoryDefinition,
    counters?: Partial<Record<CategoryKey, number>>
): number | null => {
    return counters?.[def.key] ?? null;
};

export const buildCategoriesWithDynamic = (
    definitions: CategoryDefinition[],
    renderers: Partial<Record<CategoryKey, DynamicSubItemsRenderer>>
): CategoryDefinition[] => {
    return definitions.map((def) => {
        const renderer = renderers[def.key];
        if (renderer != null) {
            return { ...def, dynamicSubItems: renderer };
        }
        return def;
    });
};

export const extractSystemSettings = (all: AppSettings): ExportedSystemSettings => {
    return {
        record_mode: all.record_mode,
        overlay_mode: all.overlay_mode,
        overlay_position: all.overlay_position,
        copy_to_clipboard: all.copy_to_clipboard,
        paste_method: all.paste_method,
        auto_insert: all.auto_insert,
        persist_history: all.persist_history,
        language: all.language,
        sound_enabled: all.sound_enabled,
        sound_volume: all.sound_volume,
        lower_output_while_recording: all.lower_output_while_recording,
        output_volume_while_recording: all.output_volume_while_recording,
        log_level: all.log_level,
        show_in_dock: all.show_in_dock,
        streaming_preview: all.streaming_preview,
        overlay_size: all.overlay_size,
        streaming_text_width: all.streaming_text_width,
        streaming_font_size: all.streaming_font_size,
        streaming_max_lines: all.streaming_max_lines,
        result_panel_mode: all.result_panel_mode,
        result_panel_duration_secs: all.result_panel_duration_secs,
    };
};

export const extractVoiceMode = (all: AppSettings): VoiceModeSettings => {
    return {
        wake_word_enabled: all.wake_word_enabled,
        wake_word_record: all.wake_word_record,
        wake_word_cancel: all.wake_word_cancel,
        wake_word_validate: all.wake_word_validate,
        wake_word_submit: all.wake_word_submit,
        auto_enter_after_wake_word: all.auto_enter_after_wake_word,
        silence_timeout_ms: all.silence_timeout_ms,
    };
};

export const extractSmartMic = (all: AppSettings): SmartMicSettings => {
    return {
        smartmic_enabled: all.smartmic_enabled,
        smartmic_port: all.smartmic_port,
        smartmic_relay_enabled: all.smartmic_relay_enabled,
        smartmic_relay_url: all.smartmic_relay_url,
        smartmic_machine_id_enabled: all.smartmic_machine_id_enabled,
        smartmic_machine_id: all.smartmic_machine_id,
        smartmic_token_ttl_hours: all.smartmic_token_ttl_hours,
        smartmic_bind_address: all.smartmic_bind_address,
    };
};

export const extractShortcuts = (all: AppSettings): ShortcutSettings => {
    return {
        record_shortcut: all.record_shortcut,
        last_transcript_shortcut: all.last_transcript_shortcut,
        voice_mode_toggle_shortcut: all.voice_mode_toggle_shortcut,
        cancel_shortcut: all.cancel_shortcut,
    };
};

const buildCategorySubItems = (def: CategoryDefinition, categories: ExportedCategories): Record<string, boolean> => {
    if (def.key === 'formatting_rules' && categories.formatting_rules != null) {
        return buildSubItems(
            categories.formatting_rules.rules.map((r) => SUB_ITEM_KEY.rule(r.id)),
            ['built_in']
        );
    }
    if (def.key === 'dictionary' && categories.dictionary != null) {
        return buildSubItems(categories.dictionary.map((w) => SUB_ITEM_KEY.word(w)));
    }
    const isPresent = categories[def.key as keyof ExportedCategories] != null;
    return Object.fromEntries(def.subItems.map((sub) => [sub.key, isPresent]));
};

export const buildImportSelection = (categories: ExportedCategories): CategorySelection => {
    const selection: CategorySelection = {};

    for (const def of CATEGORY_DEFINITIONS) {
        const isPresent = categories[def.key as keyof ExportedCategories] != null;
        selection[def.key] = { selected: isPresent, subItems: buildCategorySubItems(def, categories) };
    }

    return selection;
};

const filterFormattingRules = (
    formattingRules: ExportedFormattingSettings,
    subItems: Record<string, boolean>
): ExportedFormattingSettings => ({
    built_in: subItems.built_in ? formattingRules.built_in : undefined,
    rules: formattingRules.rules.filter((rule) => subItems[SUB_ITEM_KEY.rule(rule.id)] === true),
});

export const buildFilteredCategories = (
    categories: ExportedCategories,
    selection: CategorySelection
): ExportedCategories => {
    const filtered: ExportedCategories = {};
    if (selection.settings?.selected && categories.settings != null) {
        filtered.settings = categories.settings;
    }
    if (selection.shortcuts?.selected && categories.shortcuts != null) {
        filtered.shortcuts = categories.shortcuts;
    }
    if (selection.voice_mode?.selected && categories.voice_mode != null) {
        filtered.voice_mode = categories.voice_mode;
    }
    if (selection.smartmic?.selected && categories.smartmic != null) {
        filtered.smartmic = categories.smartmic;
    }
    if (selection.formatting_rules?.selected && categories.formatting_rules != null) {
        filtered.formatting_rules = filterFormattingRules(
            categories.formatting_rules,
            selection.formatting_rules.subItems
        );
    }
    if (selection.dictionary?.selected && categories.dictionary != null) {
        const subItems = selection.dictionary.subItems;
        filtered.dictionary = categories.dictionary.filter((word) => subItems[SUB_ITEM_KEY.word(word)] === true);
    }

    return filtered;
};

export const getCounters = (categories: ExportedCategories): Partial<Record<CategoryKey, number>> => {
    const counters: Partial<Record<CategoryKey, number>> = {};

    if (categories.formatting_rules != null) {
        counters.formatting_rules = categories.formatting_rules.rules.length;
    }
    if (categories.dictionary != null) {
        counters.dictionary = categories.dictionary.length;
    }

    return counters;
};
