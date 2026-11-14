import { useReducer, useState } from 'react';
import { useSmartMicWebSocket, getToken } from './hooks/use-smartmic-websocket';
import { useServerMessageDispatcher } from './hooks/use-server-message-dispatcher';
import { usePersistedViewMode } from './hooks/use-persisted-view-mode';
import { useServiceWorker } from './hooks/use-service-worker';
import { useRecordingControl } from './hooks/use-recording-control';
import { useRemoteControl } from './hooks/use-remote-control';
import { StatusBar } from './components/status-bar';
import { TranscriptionZone } from './components/transcription-zone';
import { Trackpad } from './components/trackpad';
import { EnterButton } from './components/enter-button';
import { RecArea } from './components/rec-area';
import { ErrorOverlay } from './components/error-overlay';
import { DeviceConflictOverlay } from './components/device-conflict-overlay';
import { ModeTabs } from './components/mode-tabs';
import { TranscriptionMode } from './components/transcription-mode';
import { AudioVisualizer } from '@/features/home/audio-visualizer/audio-visualizer';
import { smartMicReducer, initialState } from './store/smartmic-reducer';
import { t } from './i18n';

export const SmartMic = () => {
    const [token] = useState<string | null>(() => getToken());
    const { connected, sendJson, sendBinary, lastMessage } = useSmartMicWebSocket(token);
    const [state, dispatch] = useReducer(smartMicReducer, initialState);
    const [viewMode, setViewMode] = usePersistedViewMode();

    useServiceWorker();
    useServerMessageDispatcher({ lastMessage, dispatch });

    const rec = useRecordingControl({ connected, sendJson, sendBinary, state, dispatch, viewMode });
    const remote = useRemoteControl(sendJson);

    const statusText = connected ? t('status.connected') : t('status.connecting');
    const pcName = connected ? location.hostname : '';

    return (
        <div className="w-full h-dvh flex flex-col bg-[#0a0a0a] text-[#e5e5e5] font-sans select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <ModeTabs activeMode={viewMode} onModeChange={setViewMode} />
            {viewMode === 'remote' && (
                <>
                    <StatusBar connected={connected} statusText={statusText} pcName={pcName} />
                    <TranscriptionZone transcriptions={state.transcriptions} />
                    <div className="h-24 px-3 flex items-center border-b border-[#222] shrink-0">
                        <AudioVisualizer
                            bars={28}
                            rows={16}
                            audioPixelWidth={6}
                            audioPixelHeight={3}
                            level={state.micLevel}
                            isProcessing={false}
                        />
                    </div>
                    <Trackpad
                        onMove={remote.onMove}
                        onScroll={remote.onScroll}
                        onTap={remote.onTap}
                        onLongPress={remote.onLongPress}
                    />
                    <EnterButton onPress={remote.onEnter} onBackspace={remote.onBackspace} />
                </>
            )}
            {viewMode === 'transcription' && (
                <TranscriptionMode
                    transcriptions={state.transcriptions}
                    onClearHistory={() => dispatch({ type: 'clear_transcriptions' })}
                />
            )}
            <RecArea
                isRecording={state.isRecording}
                micLevel={state.micLevel}
                onToggleRec={rec.toggle}
                onCancelRec={rec.cancel}
            />
            <DeviceConflictOverlay
                deviceName={state.deviceConflict}
                onForceConnect={() => {
                    sendJson({ type: 'force_connect' });
                    dispatch({ type: 'force_connect' });
                }}
                onDismiss={() => dispatch({ type: 'dismiss_conflict' })}
            />
            <ErrorOverlay
                visible={state.error !== null}
                title={state.error?.title ?? ''}
                message={state.error?.message ?? ''}
                onDismiss={() => dispatch({ type: 'dismiss_error' })}
            />
        </div>
    );
};
