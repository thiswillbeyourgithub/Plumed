export interface CliCommandDescriptor {
    id: string;
    label: string;
    command: string;
}

// New CLI flags must be added here AND in the Rust `CliCommand` enum and tauri.conf.json.
export const CLI_COMMANDS: CliCommandDescriptor[] = [
    { id: 'transcription', label: 'Toggle transcription', command: 'murmure --transcription' },
    { id: 'paste-last', label: 'Paste last transcript', command: 'murmure --paste-last' },
    { id: 'cancel', label: 'Cancel recording', command: 'murmure --cancel' },
    { id: 'voice-mode', label: 'Toggle Voice Mode', command: 'murmure --voice-mode' },
];

export const CLI_DOC_URL = 'https://docs.murmure.app/configure-shortcuts-on-linux/';
