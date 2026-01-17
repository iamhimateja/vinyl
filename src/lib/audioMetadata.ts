import type { Song } from "../types";

// Lazy-loaded music-metadata module (saves ~106KB on initial load)
let musicMetadataModule: typeof import("music-metadata") | null = null;

async function getMusicMetadata() {
  if (!musicMetadataModule) {
    musicMetadataModule = await import("music-metadata");
  }
  return musicMetadataModule;
}

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Type for picture data (compatible with music-metadata IPicture)
interface PictureData {
  data: Uint8Array;
  format?: string;
}

// Convert picture data to base64 data URL
function pictureToDataUrl(picture: PictureData): string {
  const base64 = arrayBufferToBase64(picture.data);
  const mimeType = picture.format || "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

// Convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Get duration using HTML5 Audio element (fallback)
async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration);
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    });

    audio.src = objectUrl;
  });
}

// Extract metadata from audio file using music-metadata (lazy loaded)
export async function extractMetadata(file: File): Promise<Partial<Song>> {
  try {
    // Lazy load music-metadata module
    const musicMetadata = await getMusicMetadata();
    
    // Parse metadata using music-metadata
    const metadata = await musicMetadata.parseBlob(file);

    // Extract common tags
    const common = metadata.common;
    const format = metadata.format;

    // Get title - fallback to filename
    let title = common.title;
    let artist = common.artist || common.albumartist;

    // If no metadata title, try to parse filename
    if (!title) {
      const nameParts = file.name.replace(/\.[^/.]+$/, "").split(" - ");
      title = file.name.replace(/\.[^/.]+$/, "");

      if (nameParts.length >= 2) {
        if (!artist) {
          artist = nameParts[0].trim();
        }
        title = nameParts.slice(1).join(" - ").trim();
      }
    }

    // Get album art
    let coverArt: string | undefined;
    if (common.picture && common.picture.length > 0) {
      // Get the first picture (usually front cover)
      const picture = common.picture[0];
      coverArt = pictureToDataUrl(picture);
    }

    // Get duration - use format duration or fallback to audio element
    let duration = format.duration;
    if (!duration || duration === 0) {
      duration = await getAudioDuration(file);
    }

    return {
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      artist: artist || "Unknown Artist",
      album: common.album || "Unknown Album",
      duration: duration || 0,
      coverArt,
      sourceType: "local",
    };
  } catch (error) {
    console.warn(
      "Failed to parse metadata with music-metadata, using fallback:",
      error,
    );

    // Fallback: basic metadata extraction
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener("loadedmetadata", () => {
        // Try to parse filename for title/artist
        const nameParts = file.name.replace(/\.[^/.]+$/, "").split(" - ");
        let title = file.name.replace(/\.[^/.]+$/, "");
        let artist = "Unknown Artist";

        if (nameParts.length >= 2) {
          artist = nameParts[0].trim();
          title = nameParts.slice(1).join(" - ").trim();
        }

        URL.revokeObjectURL(objectUrl);

        resolve({
          title,
          artist,
          album: "Unknown Album",
          duration: audio.duration,
          sourceType: "local",
        });
      });

      audio.addEventListener("error", () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Unknown Artist",
          album: "Unknown Album",
          duration: 0,
          sourceType: "local",
        });
      });

      audio.src = objectUrl;
    });
  }
}

// Supported audio MIME types
export const SUPPORTED_AUDIO_TYPES = [
  // MP3
  "audio/mpeg",
  "audio/mp3",
  // WAV
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  // OGG
  "audio/ogg",
  "audio/vorbis",
  // FLAC
  "audio/flac",
  "audio/x-flac",
  // AAC / M4A
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  // WebM
  "audio/webm",
  // Opus
  "audio/opus",
  // AIFF
  "audio/aiff",
  "audio/x-aiff",
  // WMA
  "audio/x-ms-wma",
  // APE (Monkey's Audio)
  "audio/ape",
  "audio/x-ape",
];

// Supported audio file extensions
export const SUPPORTED_AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".aac",
  ".m4a",
  ".webm",
  ".opus",
  ".aiff",
  ".aif",
  ".wma",
  ".ape",
];

// Check if file is a supported audio format
export function isAudioFile(file: File): boolean {
  // Check by MIME type first
  if (file.type && SUPPORTED_AUDIO_TYPES.includes(file.type.toLowerCase())) {
    return true;
  }

  // Fallback to extension check (some browsers don't set correct MIME types)
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return SUPPORTED_AUDIO_EXTENSIONS.includes(ext);
}

// Format duration in mm:ss
export function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
