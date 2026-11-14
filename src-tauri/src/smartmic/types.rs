use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tokio::sync::{mpsc, oneshot};

/// Main state for the SmartMic feature, managed by Tauri
#[derive(Clone)]
pub struct SmartMicState {
    pub shutdown_tx: Arc<Mutex<Option<oneshot::Sender<()>>>>,
    pub connected_device: Arc<Mutex<Option<ConnectedDevice>>>,
    pub paired_devices: Arc<Mutex<Vec<PairedDevice>>>,
    pub recording_buffer: Arc<Mutex<Vec<i16>>>,
    pub paste_enabled: Arc<AtomicBool>,
    pub sample_rate: Arc<Mutex<u32>>,
    pub is_running: Arc<AtomicBool>,
}

impl SmartMicState {
    pub fn new() -> Self {
        Self {
            shutdown_tx: Arc::new(Mutex::new(None)),
            connected_device: Arc::new(Mutex::new(None)),
            paired_devices: Arc::new(Mutex::new(Vec::new())),
            recording_buffer: Arc::new(Mutex::new(Vec::new())),
            paste_enabled: Arc::new(AtomicBool::new(true)),
            sample_rate: Arc::new(Mutex::new(16000)),
            is_running: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn set_shutdown_sender(&self, tx: oneshot::Sender<()>) {
        let mut guard = self.shutdown_tx.lock();
        *guard = Some(tx);
    }

    pub fn stop(&self) {
        let mut guard = self.shutdown_tx.lock();
        if let Some(tx) = guard.take() {
            let _ = tx.send(());
        }
    }
}

impl Default for SmartMicState {
    fn default() -> Self {
        Self::new()
    }
}

/// A network interface candidate for binding the SmartMic server.
#[derive(Serialize, Clone, Debug)]
pub struct NetworkInterface {
    pub name: String,
    pub ip: String,
}

/// A paired device that has been authorized to connect
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PairedDevice {
    pub token: String,
    pub name: String,
    pub last_connected: String,
    #[serde(default)]
    pub created_at: String, // RFC3339 timestamp, empty = no expiry (migration compat)
}

/// A currently connected device with its message sender
pub struct ConnectedDevice {
    pub token: String,
    pub name: String,
    pub tx: mpsc::Sender<String>,
}

fn default_paste() -> bool {
    true
}

/// Messages received from the smartphone client (text JSON)
#[derive(Deserialize, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMessage {
    MouseMove {
        dx: f64,
        dy: f64,
    },
    Click {
        button: String,
    },
    Scroll {
        dy: f64,
    },
    RecStart {
        #[serde(default = "default_paste")]
        paste: bool,
    },
    RecStop,
    RecCancel,
    KeyPress {
        key: String,
    },
    Pair {
        #[allow(dead_code)]
        token: String,
    },
    ForceConnect,
}

/// Messages sent from the server to the smartphone client (text JSON)
#[derive(Serialize, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerMessage {
    Transcription { text: String },
    Status { recording: bool },
    MicLevel { level: f32 },
    Error { message: String },
    DeviceAlreadyConnected { device_name: String },
    ForceDisconnect,
}

impl ServerMessage {
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).expect("ServerMessage must serialize")
    }
}
