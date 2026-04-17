#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use chrono::Local;

#[derive(Serialize, Deserialize, Clone)]
struct RecentFile {
    name: String,
    path: String,
    date: i64,
}

fn get_config_dir() -> PathBuf {
    let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    let dir = base.join("mapmig");
    fs::create_dir_all(&dir).ok();
    dir
}

fn get_recents_path() -> PathBuf {
    get_config_dir().join("recents.json")
}

fn get_settings_path() -> PathBuf {
    get_config_dir().join("settings.json")
}

fn get_persistent_wads_dir() -> PathBuf {
    let dir = get_config_dir().join("persistent_wads");
    fs::create_dir_all(&dir).ok();
    dir
}

// --- File operations ---

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    // Read as raw bytes and decode as Latin-1 (ISO 8859-1).
    // Each byte maps 1:1 to a Unicode codepoint U+0000..U+00FF,
    // preserving all original byte values through the JS round-trip.
    let bytes = fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(bytes.iter().map(|&b| b as char).collect())
}

#[tauri::command]
fn read_binary_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    // Convert back from Latin-1 string to raw bytes.
    // Each char's low byte is the original file byte.
    let bytes: Vec<u8> = content.chars().map(|c| c as u8).collect();
    fs::write(&path, bytes).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
fn write_binary_file(path: String, content: Vec<u8>) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
fn get_file_name(path: String) -> String {
    Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default()
}

#[tauri::command]
fn get_parent_dir(path: String) -> String {
    Path::new(&path)
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default()
}

#[tauri::command]
fn join_path(dir: String, filename: String) -> String {
    Path::new(&dir).join(&filename).to_string_lossy().to_string()
}

#[tauri::command]
fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[tauri::command]
fn generate_backup_name(path: String) -> String {
    let p = Path::new(&path);
    let stem = p.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_default();
    let ext = p.extension().map(|s| s.to_string_lossy().to_string()).unwrap_or_default();
    let dir = p.parent().map(|d| d.to_string_lossy().to_string()).unwrap_or_default();
    let ts = Local::now().format("%Y-%m-%dT%H-%M-%S").to_string();
    let backup_name = format!("{}_original_{}.{}", stem, ts, ext);
    Path::new(&dir).join(&backup_name).to_string_lossy().to_string()
}

// --- Recents ---

#[tauri::command]
fn get_recents() -> Vec<RecentFile> {
    let path = get_recents_path();
    if let Ok(data) = fs::read_to_string(&path) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        Vec::new()
    }
}

#[tauri::command]
fn add_recent(name: String, path: String) -> Vec<RecentFile> {
    let mut recents = get_recents();
    recents.retain(|r| r.path != path);
    recents.insert(0, RecentFile {
        name,
        path,
        date: Local::now().timestamp_millis(),
    });
    recents.truncate(20);
    let recents_path = get_recents_path();
    if let Ok(json) = serde_json::to_string_pretty(&recents) {
        fs::write(&recents_path, json).ok();
    }
    recents
}

#[tauri::command]
fn clear_recents() {
    let path = get_recents_path();
    fs::write(&path, "[]").ok();
}

// --- Settings (persistent key-value) ---

#[tauri::command]
fn get_setting(key: String) -> Option<String> {
    let path = get_settings_path();
    if let Ok(data) = fs::read_to_string(&path) {
        if let Ok(map) = serde_json::from_str::<serde_json::Map<String, serde_json::Value>>(&data) {
            return map.get(&key).and_then(|v| v.as_str().map(|s| s.to_string()));
        }
    }
    None
}

#[tauri::command]
fn set_setting(key: String, value: String) {
    let path = get_settings_path();
    let mut map: serde_json::Map<String, serde_json::Value> = if let Ok(data) = fs::read_to_string(&path) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        serde_json::Map::new()
    };
    map.insert(key, serde_json::Value::String(value));
    if let Ok(json) = serde_json::to_string_pretty(&serde_json::Value::Object(map)) {
        fs::write(&path, json).ok();
    }
}

// --- Persistent WADs (stored as files in config dir) ---

#[tauri::command]
fn get_persistent_wad_list() -> Vec<String> {
    let dir = get_persistent_wads_dir();
    let mut names = Vec::new();
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                if name.ends_with(".wad") {
                    names.push(name.to_string());
                }
            }
        }
    }
    names.sort();
    names
}

#[tauri::command]
fn read_persistent_wad(name: String) -> Result<Vec<u8>, String> {
    let path = get_persistent_wads_dir().join(&name);
    fs::read(&path).map_err(|e| format!("Failed to read WAD: {}", e))
}

#[tauri::command]
fn save_persistent_wad(name: String, data: Vec<u8>) -> Result<(), String> {
    let path = get_persistent_wads_dir().join(&name);
    fs::write(&path, data).map_err(|e| format!("Failed to save WAD: {}", e))
}

#[tauri::command]
fn remove_persistent_wad(name: String) -> Result<(), String> {
    let path = get_persistent_wads_dir().join(&name);
    fs::remove_file(&path).map_err(|e| format!("Failed to remove WAD: {}", e))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            read_binary_file,
            write_text_file,
            write_binary_file,
            get_file_name,
            get_parent_dir,
            join_path,
            path_exists,
            generate_backup_name,
            get_recents,
            add_recent,
            clear_recents,
            get_setting,
            set_setting,
            get_persistent_wad_list,
            read_persistent_wad,
            save_persistent_wad,
            remove_persistent_wad,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
