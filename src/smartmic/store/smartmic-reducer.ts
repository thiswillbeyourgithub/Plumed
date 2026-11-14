import type { ServerMessage, TranscriptionEntry } from '../smartmic.types';

export interface SmartMicState {
    isRecording: boolean;
    micLevel: number;
    transcriptions: TranscriptionEntry[];
    error: { title: string; message: string } | null;
    deviceConflict: string | null;
}

export type SmartMicAction =
    | { type: 'server_message'; message: ServerMessage }
    | { type: 'rec_started' }
    | { type: 'rec_stopped' }
    | { type: 'rec_cancelled' }
    | { type: 'set_error'; error: { title: string; message: string } }
    | { type: 'dismiss_error' }
    | { type: 'force_connect' }
    | { type: 'dismiss_conflict' }
    | { type: 'disconnected' }
    | { type: 'clear_transcriptions' };

export const initialState: SmartMicState = {
    isRecording: false,
    micLevel: 0,
    transcriptions: [],
    error: null,
    deviceConflict: null,
};

export const smartMicReducer = (state: SmartMicState, action: SmartMicAction): SmartMicState => {
    switch (action.type) {
        case 'server_message':
            return handleServerMessage(state, action.message);
        case 'rec_started':
            return { ...state, isRecording: true };
        case 'rec_stopped':
        case 'rec_cancelled':
        case 'disconnected':
            return { ...state, isRecording: false, micLevel: 0 };
        case 'set_error':
            return { ...state, error: action.error };
        case 'dismiss_error':
            return { ...state, error: null };
        case 'force_connect':
            return { ...state, deviceConflict: null };
        case 'dismiss_conflict':
            return { ...state, deviceConflict: null };
        case 'clear_transcriptions':
            return { ...state, transcriptions: [] };
    }
};

const handleServerMessage = (state: SmartMicState, msg: ServerMessage): SmartMicState => {
    switch (msg.type) {
        case 'transcription': {
            const entry: TranscriptionEntry = { text: msg.text || '', timestamp: Date.now() };
            return {
                ...state,
                transcriptions: [entry, ...state.transcriptions].slice(0, 50),
            };
        }
        case 'mic_level':
            return typeof msg.level === 'number' ? { ...state, micLevel: msg.level } : state;
        case 'device_already_connected':
            return { ...state, deviceConflict: msg.device_name };
        // `force_disconnect` and `error` are intercepted in useServerMessageDispatcher
        // to build a localized message, then dispatched as `set_error`.
        case 'force_disconnect':
        case 'error':
            return state;
        case 'status':
            if (typeof msg.recording === 'boolean' && !msg.recording) {
                return { ...state, isRecording: false, micLevel: 0 };
            }
            return state;
    }
};
