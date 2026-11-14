use crate::formatting_rules;
use regex::Regex;
use tauri::{command, AppHandle};

#[command]
pub fn get_formatting_settings(
    app: AppHandle,
) -> Result<formatting_rules::FormattingSettings, String> {
    formatting_rules::load(&app)
}

#[command]
pub fn set_formatting_settings(
    app: AppHandle,
    settings: formatting_rules::FormattingSettings,
) -> Result<(), String> {
    let boosting_was = formatting_rules::load(&app).map(|s| s.built_in.phrase_boosting);
    formatting_rules::save(&app, &settings)?;
    let boosting = settings.built_in.phrase_boosting;
    if boosting_was != Ok(boosting) {
        crate::medical::phrase_list::apply_setting(&app, boosting);
    }
    Ok(())
}

#[command]
pub fn validate_regex(pattern: String) -> Result<(), String> {
    Regex::new(&pattern).map(|_| ()).map_err(|e| e.to_string())
}
