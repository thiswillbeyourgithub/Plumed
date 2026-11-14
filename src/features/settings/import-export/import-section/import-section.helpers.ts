import { invoke } from '@tauri-apps/api/core';
import { CategoryKey, ExportedCategories, ImportStrategy } from '../import-export.types';
import { FormattingRule, FormattingSettings } from '@/features/personalize/formatting-rules/types';

const applySettings = async (categories: ExportedCategories): Promise<void> => {
    const settings = categories.settings;
    if (settings == null) {
        return;
    }
    await invoke('set_record_mode', { mode: settings.record_mode });
    await invoke('set_overlay_mode', { mode: settings.overlay_mode });
    await invoke('set_overlay_position', { position: settings.overlay_position });
    await invoke('set_copy_to_clipboard', { enabled: settings.copy_to_clipboard });
    await invoke('set_paste_method', { method: settings.paste_method });
    if (settings.auto_insert != null) {
        await invoke('set_auto_insert', { enabled: settings.auto_insert });
    }
    await invoke('set_persist_history', { enabled: settings.persist_history });
    await invoke('set_current_language', { lang: settings.language });
    await invoke('set_sound_enabled', { enabled: settings.sound_enabled });
    await invoke('set_log_level', { level: settings.log_level });
    await invoke('set_show_in_dock', { show: settings.show_in_dock });
    if (settings.sound_volume != null) {
        await invoke('set_sound_volume', { percent: settings.sound_volume });
    }
    if (settings.lower_output_while_recording != null) {
        await invoke('set_lower_output_while_recording', { enabled: settings.lower_output_while_recording });
    }
    if (settings.output_volume_while_recording != null) {
        await invoke('set_output_volume_while_recording', { percent: settings.output_volume_while_recording });
    }
    if (settings.streaming_preview != null) {
        await invoke('set_streaming_preview', { enabled: settings.streaming_preview });
    }
    if (settings.overlay_size != null) {
        await invoke('set_overlay_size', { size: settings.overlay_size });
    }
    if (
        settings.streaming_text_width != null &&
        settings.streaming_font_size != null &&
        settings.streaming_max_lines != null
    ) {
        await invoke('set_streaming_text_settings', {
            textWidth: settings.streaming_text_width,
            fontSize: settings.streaming_font_size,
            maxLines: settings.streaming_max_lines,
        });
    }
    if (settings.result_panel_mode != null) {
        await invoke('set_result_panel_mode', { mode: settings.result_panel_mode });
    }
    if (settings.result_panel_duration_secs != null) {
        await invoke('set_result_panel_duration', { secs: settings.result_panel_duration_secs });
    }
};

const applyVoiceMode = async (categories: ExportedCategories): Promise<void> => {
    const voiceMode = categories.voice_mode;
    if (voiceMode == null) {
        return;
    }
    await invoke('set_wake_word_enabled', { enabled: voiceMode.wake_word_enabled });
    await invoke('set_wake_word_record', { word: voiceMode.wake_word_record });
    await invoke('set_wake_word_cancel', { word: voiceMode.wake_word_cancel });
    await invoke('set_wake_word_validate', { word: voiceMode.wake_word_validate });
    await invoke('set_wake_word_submit', { word: voiceMode.wake_word_submit });
    await invoke('set_auto_enter_after_wake_word', { enabled: voiceMode.auto_enter_after_wake_word });
    await invoke('set_silence_timeout_ms', { value: voiceMode.silence_timeout_ms });
};

const applySmartMic = async (categories: ExportedCategories): Promise<void> => {
    const smartmic = categories.smartmic;
    if (smartmic == null) {
        return;
    }
    await invoke('set_smartmic_enabled', { enabled: smartmic.smartmic_enabled });
    await invoke('set_smartmic_port', { port: smartmic.smartmic_port });
    await invoke('set_smartmic_relay_enabled', { enabled: smartmic.smartmic_relay_enabled });
    await invoke('set_smartmic_relay_url', { url: smartmic.smartmic_relay_url });
    await invoke('set_smartmic_machine_id_enabled', { enabled: smartmic.smartmic_machine_id_enabled });
    await invoke('set_smartmic_machine_id', { id: smartmic.smartmic_machine_id });
    await invoke('set_smartmic_token_ttl_hours', { hours: smartmic.smartmic_token_ttl_hours });
    await invoke('set_smartmic_bind_address', { address: smartmic.smartmic_bind_address });
};

const applyShortcuts = async (categories: ExportedCategories): Promise<void> => {
    const shortcuts = categories.shortcuts;
    if (shortcuts == null) {
        return;
    }
    // Sequential to avoid race conditions on shortcut re-registration
    await invoke('set_record_shortcut', { binding: shortcuts.record_shortcut });
    await invoke('set_last_transcript_shortcut', {
        binding: shortcuts.last_transcript_shortcut,
    });
    await invoke('set_cancel_shortcut', { binding: shortcuts.cancel_shortcut });
};

const applyFormattingRules = async (categories: ExportedCategories, strategy: ImportStrategy): Promise<void> => {
    const imported = categories.formatting_rules;
    if (imported == null) {
        return;
    }

    const current = await invoke<FormattingSettings>('get_formatting_settings');

    let rules: FormattingRule[];
    if (strategy === 'merge') {
        const existingRuleIds = new Set(current.rules.map((r) => r.id));
        rules = [...current.rules];
        for (const rule of imported.rules) {
            if (existingRuleIds.has(rule.id)) {
                const idx = rules.findIndex((r) => r.id === rule.id);
                if (idx >= 0) {
                    rules[idx] = rule;
                }
            } else {
                rules.push(rule);
            }
        }
    } else {
        rules = imported.rules;
    }

    await invoke('set_formatting_settings', {
        settings: { built_in: imported.built_in ?? current.built_in, rules },
    });
};

// Old backups stored the dictionary as { word: languages }; keep only the words for backward compatibility.
export const normalizeDictionary = (dictionary: unknown): string[] | undefined => {
    if (dictionary == null) {
        return undefined;
    }
    if (Array.isArray(dictionary)) {
        return dictionary.filter((word): word is string => typeof word === 'string');
    }
    if (typeof dictionary === 'object') {
        return Object.keys(dictionary);
    }
    return undefined;
};

const mergeDictionaries = (current: string[], imported: string[]): string[] => {
    const existingLower = new Set(current.map((w) => w.toLowerCase()));
    const merged = [...current];

    for (const word of imported) {
        if (!existingLower.has(word.toLowerCase())) {
            merged.push(word);
            existingLower.add(word.toLowerCase());
        }
    }

    return merged;
};

const applyDictionary = async (categories: ExportedCategories, strategy: ImportStrategy): Promise<void> => {
    const imported = categories.dictionary;
    if (imported == null) {
        return;
    }

    if (strategy === 'merge') {
        const current = await invoke<string[]>('get_dictionary');
        await invoke('set_dictionary', { dictionary: mergeDictionaries(current, imported) });
    } else {
        await invoke('set_dictionary', { dictionary: imported });
    }
};

export const applySingleCategory = async (
    categoryKey: CategoryKey,
    categories: ExportedCategories,
    strategies: Partial<Record<CategoryKey, ImportStrategy>>
): Promise<void> => {
    switch (categoryKey) {
        case 'settings':
            await applySettings(categories);
            break;
        case 'shortcuts':
            await applyShortcuts(categories);
            break;
        case 'voice_mode':
            await applyVoiceMode(categories);
            break;
        case 'smartmic':
            await applySmartMic(categories);
            break;
        case 'formatting_rules':
            await applyFormattingRules(categories, strategies.formatting_rules ?? 'replace');
            break;
        case 'dictionary':
            await applyDictionary(categories, strategies.dictionary ?? 'replace');
            break;
    }
};
