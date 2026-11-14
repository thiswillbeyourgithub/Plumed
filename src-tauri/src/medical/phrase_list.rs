//! The bundled French medical phrase boosting list (see
//! `medical-data/SOURCE.md`), armed on the engine once, when the model loads:
//! building its trie takes a moment, unlike the per-transcription dictionary
//! sync. Written with Claude Code.

use crate::audio::types::AudioState;
use crate::engine::ParakeetEngine;
use tauri::{AppHandle, Manager};

const BUNDLED: &str = include_str!("../../medical-data/phrase-boosting/french_medical.txt");

/// The list to arm: the bundled phrases, or an empty list to turn boosting off.
fn list_for(enabled: bool) -> &'static str {
    match enabled {
        true => BUNDLED,
        false => "",
    }
}

/// Whether the user left phrase boosting on (the default when settings are unreadable).
fn enabled_in_settings(app: &AppHandle) -> bool {
    crate::formatting_rules::load(app)
        .map(|settings| settings.built_in.phrase_boosting)
        .unwrap_or(true)
}

/// Boost the bundled medical phrases on a freshly loaded `engine`, on top of
/// the dictionary, unless the user turned phrase boosting off.
pub fn arm(app: &AppHandle, engine: &mut ParakeetEngine) {
    engine.set_boost_list(list_for(enabled_in_settings(app)));
}

/// Applies a changed phrase boosting setting to the already loaded engine, if
/// any (a not yet loaded engine reads the setting in [`arm`]).
pub fn apply_setting(app: &AppHandle, enabled: bool) {
    let state = app.state::<AudioState>();
    let mut engine = state.engine.lock();
    if let Some(engine) = engine.as_mut() {
        engine.set_boost_list(list_for(enabled));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::phrase_boost::list::parse_boost_list;

    #[test]
    fn turning_boosting_off_arms_an_empty_list() {
        assert_eq!(list_for(true), BUNDLED);
        assert!(parse_boost_list(list_for(false)).phrases.is_empty());
    }

    #[test]
    fn bundled_list_parses_with_the_benchmarked_tuning() {
        let list = parse_boost_list(BUNDLED);
        assert!(
            list.warnings.is_empty(),
            "{:?}",
            &list.warnings[..3.min(list.warnings.len())]
        );
        assert_eq!(list.commitment, Some(0.0));
        assert!(
            list.phrases.len() > 70_000,
            "{} phrases",
            list.phrases.len()
        );
        let first = &list.phrases[0];
        assert_eq!((first.weight, first.minp), (1.5, 0.01));
    }
}
