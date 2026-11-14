import { buildSubItems } from '../import-export.helpers';
import { SUB_ITEM_KEY } from '../import-export.constants';
import { CategoryDefinition, CategorySelection } from '../import-export.types';
import { FormattingSettings } from '@/features/personalize/formatting-rules/types';

export const getSelectedCategoryKeys = (definitions: CategoryDefinition[], selection: CategorySelection) => {
    return definitions.filter((def) => selection[def.key]?.selected).map((def) => def.key);
};

export const buildInitialSelection = (
    formattingRules: FormattingSettings,
    dictionary: string[]
): CategorySelection => ({
    settings: { selected: true, subItems: {} },
    shortcuts: { selected: true, subItems: {} },
    voice_mode: { selected: true, subItems: {} },
    smartmic: { selected: true, subItems: {} },
    formatting_rules: {
        selected: true,
        subItems: buildSubItems(
            formattingRules.rules.map((r) => SUB_ITEM_KEY.rule(r.id)),
            ['built_in']
        ),
    },
    dictionary: {
        selected: true,
        subItems: buildSubItems(dictionary.map((w) => SUB_ITEM_KEY.word(w))),
    },
});
