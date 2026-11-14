export interface CliCommandDescriptor {
    id: string;
    label: string;
    command: string;
}

// New CLI flags must be added here AND in the Rust `CliCommand` enum and tauri.conf.json.
export const CLI_COMMANDS: CliCommandDescriptor[] = [
    { id: 'transcription', label: 'Toggle transcription', command: 'plumed --transcription' },
    { id: 'paste-last', label: 'Paste last transcript', command: 'plumed --paste-last' },
    { id: 'cancel', label: 'Cancel recording', command: 'plumed --cancel' },
    { id: 'voice-mode', label: 'Toggle Voice Mode', command: 'plumed --voice-mode' },
];
