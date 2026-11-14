use crate::audio::chunking::{ChunkPipeline, Chunker};
use crate::audio::clean_recording::clean_transcription;
use crate::audio::helpers::{read_wav_mono_native, resample, rms};
use crate::audio::types::AudioState;
use crate::dictionary::{correct_transcription, sync_boost_words, Dictionary};
use crate::engine::transcription_engine::{TranscriptionEngine, TranscriptionResult};
use crate::formatting_rules;
use crate::history;
use crate::stats;
use anyhow::Result;
use log::{debug, error, warn};
use std::path::Path;
use tauri::{AppHandle, Emitter, Manager};

pub enum ChunkOutcome {
    Text { cleaned: String, corrected: String },
    Empty,
    Failed,
}

const INFERENCE_SILENCE_PAD_SECS: f32 = 0.25;

pub(crate) fn pad_with_silence(samples: &[f32], sample_rate: u32) -> Vec<f32> {
    let silence = vec![0.0; (INFERENCE_SILENCE_PAD_SECS * sample_rate as f32) as usize];
    let mut padded = Vec::with_capacity(samples.len() + silence.len() * 2);
    padded.extend_from_slice(&silence);
    padded.extend_from_slice(samples);
    padded.extend_from_slice(&silence);
    padded
}

/// Transcribes one chunk in isolation (fresh decoder state)
pub fn process_chunk(app: &AppHandle, samples: Vec<f32>, sample_rate: u32) -> ChunkOutcome {
    // 1. Resample to 16 kHz if needed
    let resampled = if sample_rate != 16000 {
        resample(&samples, sample_rate as usize, 16000)
    } else {
        samples
    };
    if resampled.is_empty() {
        return ChunkOutcome::Empty;
    }
    let padded = pad_with_silence(&resampled, 16000);

    let dictionary = app.state::<Dictionary>().get();
    let state = app.state::<AudioState>();
    if let Err(e) = crate::audio::preload_engine(app) {
        error!("Chunk transcription: engine not available: {}", e);
        return ChunkOutcome::Failed;
    }

    let mut engine_guard = state.engine.lock();
    let Some(engine) = engine_guard.as_mut() else {
        return ChunkOutcome::Failed;
    };

    // 2. Sync dictionary boost words
    sync_boost_words(engine, &dictionary);

    // 3. Transcribe
    match engine.transcribe_samples(padded, None) {
        Ok(result) => {
            let trimmed = result.text.trim();
            if trimmed.is_empty() {
                ChunkOutcome::Empty
            } else {
                // 4. Dictionary correction
                let corrected =
                    correct_transcription(trimmed, &dictionary, &result.word_confidences);
                if log::log_enabled!(log::Level::Debug) {
                    let confidences = crate::dictionary::confidence_map(&result.word_confidences);
                    for candidate in crate::dictionary::fuzzy_correction_candidates(
                        trimmed,
                        &dictionary,
                        &confidences,
                    ) {
                        debug!("FZCAND {}", candidate);
                    }
                }
                ChunkOutcome::Text {
                    cleaned: trimmed.to_string(),
                    corrected,
                }
            }
        }
        Err(e) => {
            error!("Chunk transcription failed: {}", e);
            ChunkOutcome::Failed
        }
    }
}

/// Post-processes the concatenated chunks at the end of transcription
pub fn merge_all_chunks(app: &AppHandle, accumulated: String, file_path: &Path) -> Result<String> {
    let text = post_process_chunks(app, accumulated);
    if !text.trim().is_empty() {
        // 7. Save stats & history
        save_stats_and_history(app, file_path, &text)?;
    }
    Ok(text)
}

fn post_process_chunks(app: &AppHandle, accumulated: String) -> String {
    if accumulated.trim().is_empty() {
        return accumulated;
    }

    // 5. Clean transcription (dedup repeats, optional hesitation removal)
    let text = clean_accumulated(app, &accumulated);
    // 6. Apply formatting rules
    apply_formatting_rules(app, text)
}

pub fn transcribe_file_chunked(app: &AppHandle, file_path: &Path) -> Result<String> {
    let (samples, sample_rate) = read_wav_mono_native(file_path)?;
    if samples.is_empty() {
        return Err(anyhow::anyhow!("Audio file contains no samples"));
    }

    let pipeline = ChunkPipeline::start_headless(app);
    let mut chunker = Chunker::new(pipeline.sender(), sample_rate, None);
    let window = sample_rate as usize * 33 / 1000;
    for win in samples.chunks(window) {
        chunker.push_samples(win);
        chunker.on_throttle_tick(rms(win));
    }
    chunker.flush_remaining();
    let accumulated = pipeline.finalize();

    Ok(post_process_chunks(app, accumulated).trim().to_string())
}

fn clean_accumulated(app: &AppHandle, accumulated: &str) -> String {
    clean_transcription(
        accumulated,
        crate::settings::load_settings(app).remove_hesitations,
    )
}

fn apply_dictionary_correction(
    app: &AppHandle,
    text: String,
    word_confidences: &[(String, f32)],
) -> Result<String> {
    let dictionary = app.state::<Dictionary>().get();
    Ok(correct_transcription(&text, &dictionary, word_confidences))
}

fn apply_formatting_rules(app: &AppHandle, text: String) -> String {
    match formatting_rules::load(app) {
        Ok(settings) => formatting_rules::apply_formatting(text, &settings),
        Err(e) => {
            warn!("Failed to load formatting rules: {}. Skipping.", e);
            text
        }
    }
}

fn save_stats_and_history(app: &AppHandle, file_path: &Path, text: &str) -> Result<()> {
    // Calculate duration and size
    let (duration_seconds, wav_size_bytes) = match hound::WavReader::open(file_path) {
        Ok(reader) => {
            let spec = reader.spec();
            let total_samples = reader.duration() as f64;
            let seconds = if spec.sample_rate > 0 {
                total_samples / (spec.sample_rate as f64)
            } else {
                0.0
            };
            let size = std::fs::metadata(file_path).map(|m| m.len()).unwrap_or(0);
            (seconds, size)
        }
        Err(_) => (0.0, 0),
    };

    let word_count: u64 = text.split_whitespace().filter(|s| !s.is_empty()).count() as u64;

    if let Err(e) = history::add_transcription(app, text.to_string()) {
        error!("Failed to save to history: {}", e);
    }

    if let Err(e) =
        stats::add_transcription_session(app, word_count, duration_seconds, wav_size_bytes)
    {
        error!("Failed to save stats session: {}", e);
    }

    Ok(())
}

/// Process a recording from raw samples (no WAV file), used by SmartMic.
/// Bypasses file I/O and enters the pipeline directly from PCM samples.
pub fn process_recording_from_samples(app: &AppHandle, samples: Vec<f32>) -> Result<String> {
    // 1. Transcribe directly from samples
    let result = transcribe_samples_direct(app, samples)?;
    let raw_text = result.text;

    if raw_text.trim().is_empty() {
        return Ok(raw_text);
    }

    // 2. Deduplicate repeated words
    let text = clean_transcription(
        &raw_text,
        crate::settings::load_settings(app).remove_hesitations,
    );

    // 3. Dictionary correction
    let text = apply_dictionary_correction(app, text, &result.word_confidences)?;

    // 4. Formatting rules
    let final_text = apply_formatting_rules(app, text);

    // Note: No save_stats_and_history (no WAV file, no duration)
    Ok(final_text)
}

fn transcribe_samples_direct(app: &AppHandle, samples: Vec<f32>) -> Result<TranscriptionResult> {
    let _ = app.emit("transcription-processing-start", ());
    crate::audio::preload_engine(app)?;
    let state = app.state::<AudioState>();

    let mut engine_guard = state.engine.lock();
    let engine = engine_guard
        .as_mut()
        .ok_or_else(|| anyhow::anyhow!("Engine not loaded"))?;

    sync_boost_words(engine, &app.state::<Dictionary>().get());

    let result = engine.transcribe_samples(samples, None).map_err(|e| {
        let _ = app.emit("transcription-processing-end", ());
        anyhow::anyhow!("Transcription failed: {}", e)
    })?;
    let _ = app.emit("transcription-processing-end", ());

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SR: u32 = 16000;

    #[test]
    fn should_add_a_quarter_second_of_silence_at_both_ends() {
        let speech = vec![0.1; SR as usize];
        let padded = pad_with_silence(&speech, SR);

        let pad = SR as usize / 4;
        assert_eq!(padded.len(), speech.len() + pad * 2);
        assert!(padded[..pad].iter().all(|s| *s == 0.0));
        assert_eq!(&padded[pad..pad + speech.len()], &speech[..]);
        assert!(padded[pad + speech.len()..].iter().all(|s| *s == 0.0));
    }
}
