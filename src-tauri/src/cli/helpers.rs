use super::types::ImportStrategy;

pub(super) fn parse_strategy(value: &str) -> Result<ImportStrategy, String> {
    match value.to_lowercase().as_str() {
        "replace" => Ok(ImportStrategy::Replace),
        "merge" => Ok(ImportStrategy::Merge),
        other => Err(format!(
            "Error: Invalid strategy '{}'. Use 'replace' or 'merge'.",
            other
        )),
    }
}

pub(super) fn parse_file_arg(args: &[String], keyword: &str) -> Option<String> {
    let index = args.iter().position(|a| a == keyword)?;
    let file_path = args.get(index + 1)?;
    if file_path.starts_with('-') {
        return None;
    }
    Some(file_path.clone())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_strategy_valid() {
        assert_eq!(parse_strategy("replace").unwrap(), ImportStrategy::Replace);
        assert_eq!(parse_strategy("merge").unwrap(), ImportStrategy::Merge);
        assert_eq!(parse_strategy("Replace").unwrap(), ImportStrategy::Replace);
        assert_eq!(parse_strategy("MERGE").unwrap(), ImportStrategy::Merge);
    }

    #[test]
    fn test_parse_strategy_invalid() {
        assert!(parse_strategy("foo").is_err());
        assert!(parse_strategy("").is_err());
    }
}
