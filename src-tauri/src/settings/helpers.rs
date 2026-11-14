// "all" shows every dictation. Anything else is "off", including the legacy
// "command" and "command_llm" values: those only covered the removed Command
// and Prompt modes, so they never showed a plain dictation.
pub fn normalize_result_panel_mode(mode: &str) -> &'static str {
    match mode {
        "all" => "all",
        _ => "off",
    }
}

pub fn migrate_legacy_paste_method(settings: &mut serde_json::Value) {
    let Some(object) = settings.as_object_mut() else {
        return;
    };
    if matches!(
        object
            .get("paste_method")
            .and_then(serde_json::Value::as_str),
        Some("none" | "None")
    ) {
        object.insert("paste_method".to_string(), "ctrl_v".into());
        object.insert("auto_insert".to_string(), false.into());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_result_panel_modes_are_kept() {
        for mode in ["off", "all"] {
            assert_eq!(normalize_result_panel_mode(mode), mode);
        }
    }

    #[test]
    fn legacy_and_unknown_result_panel_modes_fall_back_to_off() {
        for mode in ["command", "command_llm", "commands", "", "All"] {
            assert_eq!(normalize_result_panel_mode(mode), "off");
        }
    }
}
