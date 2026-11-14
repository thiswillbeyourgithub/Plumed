import { FormattingRulesSubItems } from './formatting-rules-sub-items/formatting-rules-sub-items';
import { SelectableWordList } from './selectable-word-list/selectable-word-list';
import { CategoryKey, DynamicSubItemsRenderer } from './import-export.types';
import { FormattingRule } from '@/features/personalize/formatting-rules/types';

export const buildRenderers = (
    rules: FormattingRule[],
    words: string[]
): Partial<Record<CategoryKey, DynamicSubItemsRenderer>> => {
    const renderers: Partial<Record<CategoryKey, DynamicSubItemsRenderer>> = {};
    if (rules.length > 0) {
        renderers.formatting_rules = (props) => <FormattingRulesSubItems rules={rules} {...props} />;
    }
    if (words.length > 0) {
        renderers.dictionary = (props) => <SelectableWordList words={words} {...props} />;
    }
    return renderers;
};
