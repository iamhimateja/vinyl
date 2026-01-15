use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use walkdir::WalkDir;

/// Represents a music file found on disk
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MusicFile {
    pub path: String,
    pub name: String,
    pub extension: String,
    /// Relative folder path from the scanned root (for playlist creation)
    pub folder: Option<String>,
}

/// Supported audio file extensions
const AUDIO_EXTENSIONS: &[&str] = &[
    "mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "aiff", "ape", "opus", "webm",
];

/// Check if a file has an audio extension
fn is_audio_file(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| AUDIO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

/// Scan a directory for music files
#[tauri::command]
pub fn scan_music_folder(folder_path: String) -> Result<Vec<MusicFile>, String> {
    let root_path = PathBuf::from(&folder_path);

    if !root_path.exists() {
        return Err(format!("Folder does not exist: {}", folder_path));
    }

    if !root_path.is_dir() {
        return Err(format!("Path is not a directory: {}", folder_path));
    }

    let mut music_files = Vec::new();

    for entry in WalkDir::new(&root_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let file_path = entry.path();

        if file_path.is_file() && is_audio_file(file_path) {
            if let Some(name) = file_path.file_name().and_then(|n| n.to_str()) {
                let extension = file_path
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_string();

                // Get the relative folder path from root
                let folder = file_path
                    .parent()
                    .and_then(|p| p.strip_prefix(&root_path).ok())
                    .and_then(|p| p.to_str())
                    .map(|s| s.to_string())
                    .filter(|s| !s.is_empty());

                music_files.push(MusicFile {
                    path: file_path.to_string_lossy().to_string(),
                    name: name.to_string(),
                    extension,
                    folder,
                });
            }
        }
    }

    Ok(music_files)
}

/// Check if a file exists
#[tauri::command]
pub fn file_exists(file_path: String) -> bool {
    PathBuf::from(&file_path).exists()
}
