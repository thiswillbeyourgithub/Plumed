use log::warn;
use tauri::{AppHandle, Emitter, Manager};

use crate::audio::record_audio;
use crate::cli::types::CliCommand;
use crate::shortcuts::shortcuts::{
    force_cancel_recording, is_recording_idle, spawn_paste_last_transcript, toggle_recording_action,
};
use crate::shortcuts::types::{RecordingSource, ShortcutState};

/// Reuses the same backend toggle path as internal shortcuts (cooldown,
/// focus capture, ShortcutState toggling, UI flow) to guarantee parity.
pub fn dispatch(app: &AppHandle, cmd: &CliCommand) {
    // CLI invocations always toggle: a single OS-level shortcut event cannot
    // express press/release, so PushToTalk is not supported from the CLI.
    match cmd {
        CliCommand::Transcription => cli_toggle_recording(app),
        CliCommand::PasteLast => spawn_paste_last_transcript(app),
        CliCommand::Cancel => cancel(app),
        CliCommand::VoiceMode => {
            let _ = app.emit("voice-mode-toggle-requested", ());
        }
        CliCommand::Quit => app.exit(0),
        CliCommand::Import { .. } => {
            warn!("cli_dispatch::dispatch called with Import; handled separately");
        }
        CliCommand::Transcribe { .. } => {
            warn!("cli_dispatch::dispatch called with Transcribe; handled separately");
        }
    }
}

fn cli_toggle_recording(app: &AppHandle) {
    let shortcut_state = app.state::<ShortcutState>();
    let app_for_fn = app.clone();
    toggle_recording_action(
        app,
        RecordingSource::Standard,
        shortcut_state.inner(),
        move || {
            record_audio(&app_for_fn);
        },
    );
}

fn cancel(app: &AppHandle) {
    if !is_recording_idle() {
        force_cancel_recording(app);
    }
}
