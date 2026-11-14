import { Lightbulb, Mic, Settings } from 'lucide-react';
import { Typography } from '@/components/typography';
import { ShortcutButton } from './shortcut-button/shortcut-button';
import { SettingsUI } from '@/components/settings-ui';
import { Page } from '@/components/page';
import { useShortcut, SHORTCUT_CONFIGS } from '../hooks/use-shortcut';
import { useTranslation } from '@/i18n';
import { useRecordModeState } from '@/features/settings/system/record-mode-settings/hooks/use-record-mode-state';

export const ShortcutsRegular = () => {
    const { t } = useTranslation();
    const { recordMode } = useRecordModeState();

    const {
        shortcut: recordShortcut,
        setShortcut: setRecordShortcut,
        resetShortcut: resetRecordShortcut,
    } = useShortcut(SHORTCUT_CONFIGS.record);

    const {
        shortcut: lastTranscriptShortcut,
        setShortcut: setLastTranscriptShortcut,
        resetShortcut: resetLastTranscriptShortcut,
    } = useShortcut(SHORTCUT_CONFIGS.lastTranscript);

    const {
        shortcut: cancelShortcut,
        setShortcut: setCancelShortcut,
        resetShortcut: resetCancelShortcut,
    } = useShortcut(SHORTCUT_CONFIGS.cancel);

    const {
        shortcut: voiceModeToggleShortcut,
        setShortcut: setVoiceModeToggleShortcut,
        resetShortcut: resetVoiceModeToggleShortcut,
    } = useShortcut(SHORTCUT_CONFIGS.voiceModeToggle);

    const isPushToTalk = recordMode === 'push_to_talk';
    const recordTitle = isPushToTalk ? t('Push to talk') : t('Toggle to talk');
    const recordTestId = isPushToTalk ? 'push-to-talk-button' : 'toggle-to-talk-button';

    const recordDescription = isPushToTalk
        ? t('Hold to record, release to transcribe.')
        : t('Starts and stops the recording.');

    const allShortcuts = [
        { id: 'record', name: recordTitle, value: recordShortcut },
        { id: 'lastTranscript', name: t('Paste last transcript'), value: lastTranscriptShortcut },
        { id: 'cancel', name: t('Cancel recording'), value: cancelShortcut },
        { id: 'voiceModeToggle', name: t('Toggle Voice Mode'), value: voiceModeToggleShortcut },
    ];

    const othersOf = (id: string) =>
        allShortcuts.filter((entry) => entry.id !== id).map(({ name, value }) => ({ name, value }));

    return (
        <main>
            <div className="space-y-4">
                <Page.Header>
                    <Typography.MainTitle data-testid="shortcuts-title">{t('Shortcuts')}</Typography.MainTitle>
                </Page.Header>

                <SettingsUI.Section title={t('General')} icon={Settings} titleTestId="general-title">
                    <SettingsUI.Item>
                        <SettingsUI.Description className="flex-1 min-w-0">
                            <Typography.Title>{recordTitle}</Typography.Title>
                            <Typography.Paragraph>{recordDescription}</Typography.Paragraph>
                        </SettingsUI.Description>
                        <ShortcutButton
                            keyName={recordTitle}
                            shortcut={recordShortcut}
                            saveShortcut={setRecordShortcut}
                            resetShortcut={resetRecordShortcut}
                            dataTestId={recordTestId}
                            existingShortcuts={othersOf('record')}
                        />
                    </SettingsUI.Item>
                    <SettingsUI.Separator />
                    <SettingsUI.Item>
                        <SettingsUI.Description className="flex-1 min-w-0">
                            <Typography.Title>{t('Paste last transcript')}</Typography.Title>
                            <Typography.Paragraph>{t('Pastes the last transcript.')}</Typography.Paragraph>
                            <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
                                <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" />
                                <span>
                                    {t('Useful when you forgot to select an input field when you started recording.')}
                                </span>
                            </div>
                        </SettingsUI.Description>
                        <ShortcutButton
                            keyName={t('Paste last transcript')}
                            shortcut={lastTranscriptShortcut}
                            saveShortcut={setLastTranscriptShortcut}
                            resetShortcut={resetLastTranscriptShortcut}
                            dataTestId="paste-transcript-button"
                            existingShortcuts={othersOf('lastTranscript')}
                        />
                    </SettingsUI.Item>
                    <SettingsUI.Separator />
                    <SettingsUI.Item>
                        <SettingsUI.Description className="flex-1 min-w-0">
                            <Typography.Title>{t('Cancel recording')}</Typography.Title>
                            <Typography.Paragraph>{t('Cancels the current recording.')}</Typography.Paragraph>
                        </SettingsUI.Description>
                        <ShortcutButton
                            keyName={t('Cancel recording')}
                            shortcut={cancelShortcut}
                            saveShortcut={setCancelShortcut}
                            resetShortcut={resetCancelShortcut}
                            dataTestId="cancel-recording-button"
                            existingShortcuts={othersOf('cancel')}
                        />
                    </SettingsUI.Item>
                </SettingsUI.Section>

                <SettingsUI.Section title={t('Voice Mode')} icon={Mic} titleTestId="voice-mode-title">
                    <SettingsUI.Item>
                        <SettingsUI.Description className="flex-1 min-w-0">
                            <Typography.Title>{t('Toggle Voice Mode')}</Typography.Title>
                            <Typography.Paragraph>{t('Mutes or unmutes Voice Mode listening.')}</Typography.Paragraph>
                        </SettingsUI.Description>
                        <ShortcutButton
                            keyName={t('Toggle Voice Mode')}
                            shortcut={voiceModeToggleShortcut}
                            saveShortcut={setVoiceModeToggleShortcut}
                            resetShortcut={resetVoiceModeToggleShortcut}
                            dataTestId="voice-mode-toggle-button"
                            existingShortcuts={othersOf('voiceModeToggle')}
                        />
                    </SettingsUI.Item>
                </SettingsUI.Section>
            </div>
        </main>
    );
};
