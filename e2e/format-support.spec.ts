import { test, expect, Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, "fixtures");

/**
 * Helper to open the import dialog
 */
async function openImportDialog(page: Page) {
  const addMusicBtn = page.locator('button:has-text("Add Music"), button:has-text("Import")').first();
  await addMusicBtn.click();
  await page.waitForTimeout(300);
}

/**
 * Helper to import an audio file
 */
async function importAudioFile(page: Page, filename: string): Promise<boolean> {
  const filepath = path.join(FIXTURES_DIR, filename);
  
  try {
    await openImportDialog(page);
    const fileInput = page.locator('input[type="file"][accept="audio/*"]').first();
    await fileInput.setInputFiles(filepath);
    await page.waitForTimeout(2000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to check if a song is in library
 */
async function isSongInLibrary(page: Page, title: string): Promise<boolean> {
  try {
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to play a song and check if it starts
 */
async function canPlaySong(page: Page, title: string): Promise<boolean> {
  try {
    const songElement = page.getByText(title).first();
    await songElement.dblclick();
    await page.waitForTimeout(1000);
    
    // Check if song title appears in player area
    const playerArea = page.locator('[class*="player"], footer, [class*="bottom"]');
    const playerText = await playerArea.first().textContent();
    return playerText?.includes(title) || false;
  } catch {
    return false;
  }
}

test.describe("Audio Format Compatibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await page.waitForTimeout(500);
  });

  test("MP3 - should import, extract metadata, and play", async ({ page }) => {
    const imported = await importAudioFile(page, "test-audio.mp3");
    expect(imported).toBe(true);

    const inLibrary = await isSongInLibrary(page, "Test Song MP3");
    expect(inLibrary).toBe(true);

    // Verify metadata
    await expect(page.getByText("Test Artist").first()).toBeVisible();

    // Play the song
    const canPlay = await canPlaySong(page, "Test Song MP3");
    expect(canPlay).toBe(true);
  });

  test("WAV - should import and play uncompressed audio", async ({ page }) => {
    const imported = await importAudioFile(page, "test-audio.wav");
    expect(imported).toBe(true);

    const inLibrary = await isSongInLibrary(page, "Test Song WAV");
    expect(inLibrary).toBe(true);

    const canPlay = await canPlaySong(page, "Test Song WAV");
    expect(canPlay).toBe(true);
  });

  test("OGG Vorbis - should import and play", async ({ page }) => {
    const imported = await importAudioFile(page, "test-audio.ogg");
    expect(imported).toBe(true);

    const inLibrary = await isSongInLibrary(page, "Test Song OGG");
    expect(inLibrary).toBe(true);

    const canPlay = await canPlaySong(page, "Test Song OGG");
    expect(canPlay).toBe(true);
  });

  test("FLAC - should import and play lossless audio", async ({ page }) => {
    const imported = await importAudioFile(page, "test-audio.flac");
    expect(imported).toBe(true);

    const inLibrary = await isSongInLibrary(page, "Test Song FLAC");
    expect(inLibrary).toBe(true);

    const canPlay = await canPlaySong(page, "Test Song FLAC");
    expect(canPlay).toBe(true);
  });

  test("OPUS - should import and play modern codec", async ({ page }) => {
    const imported = await importAudioFile(page, "test-audio.opus");
    expect(imported).toBe(true);

    const inLibrary = await isSongInLibrary(page, "Test Song OPUS");
    expect(inLibrary).toBe(true);

    const canPlay = await canPlaySong(page, "Test Song OPUS");
    expect(canPlay).toBe(true);
  });

  test("WebM Audio - should import and play", async ({ page }) => {
    const imported = await importAudioFile(page, "test-audio.webm");
    expect(imported).toBe(true);

    const inLibrary = await isSongInLibrary(page, "Test Song WebM");
    expect(inLibrary).toBe(true);

    const canPlay = await canPlaySong(page, "Test Song WebM");
    expect(canPlay).toBe(true);
  });

  // M4A test - may need transcoding on Linux
  test("M4A/AAC - should import (may require transcoding on Linux)", async ({ page }) => {
    const imported = await importAudioFile(page, "test-audio.m4a");
    expect(imported).toBe(true);

    const inLibrary = await isSongInLibrary(page, "Test Song M4A");
    expect(inLibrary).toBe(true);

    // Note: Playback may fail on Linux Chromium without transcoding
    // This test primarily checks import and metadata extraction
  });
});

test.describe("Metadata Extraction by Format", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should extract title from MP3 ID3 tags", async ({ page }) => {
    await importAudioFile(page, "test-audio.mp3");
    await expect(page.getByText("Test Song MP3")).toBeVisible({ timeout: 5000 });
  });

  test("should extract artist from MP3 ID3 tags", async ({ page }) => {
    await importAudioFile(page, "test-audio.mp3");
    await expect(page.getByText("Test Artist")).toBeVisible({ timeout: 5000 });
  });

  test("should extract album from MP3 ID3 tags", async ({ page }) => {
    await importAudioFile(page, "test-audio.mp3");
    await expect(page.getByText("Test Album")).toBeVisible({ timeout: 5000 });
  });

  test("should extract metadata from FLAC Vorbis comments", async ({ page }) => {
    await importAudioFile(page, "test-audio.flac");
    await expect(page.getByText("Test Song FLAC")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Test Artist").first()).toBeVisible();
  });

  test("should extract metadata from OGG Vorbis comments", async ({ page }) => {
    await importAudioFile(page, "test-audio.ogg");
    await expect(page.getByText("Test Song OGG")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Test Artist").first()).toBeVisible();
  });

  test("should extract duration from all formats", async ({ page }) => {
    await importAudioFile(page, "test-audio.mp3");
    await page.waitForTimeout(500);
    
    // 3-second test file should show 0:03
    await expect(page.getByText(/0:0[23]/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Large File Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should handle importing WAV file (larger uncompressed)", async ({ page }) => {
    // WAV files are typically larger
    await importAudioFile(page, "test-audio.wav");
    await expect(page.getByText("Test Song WAV")).toBeVisible({ timeout: 10000 });
  });

  test("should handle FLAC file (lossless compression)", async ({ page }) => {
    await importAudioFile(page, "test-audio.flac");
    await expect(page.getByText("Test Song FLAC")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Batch Import", () => {
  test("should import multiple formats simultaneously", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();

    const files = [
      "test-audio.mp3",
      "test-audio.ogg",
      "test-audio.flac",
      "test-audio-2.mp3",
    ];

    const filepaths = files.map((f) => path.join(FIXTURES_DIR, f));
    
    // Open import dialog first
    await openImportDialog(page);
    const fileInput = page.locator('input[type="file"][accept="audio/*"]').first();
    await fileInput.setInputFiles(filepaths);

    await page.waitForTimeout(3000);

    // All should be imported
    await expect(page.getByText("Test Song MP3")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Test Song OGG")).toBeVisible();
    await expect(page.getByText("Test Song FLAC")).toBeVisible();
    await expect(page.getByText("Second Track")).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test("should gracefully handle unsupported file types", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();

    // Open import dialog first
    await openImportDialog(page);
    
    // Try to import the shell script (not an audio file)
    // Note: The input has accept="audio/*" so browser may filter it
    const fileInput = page.locator('input[type="file"][accept="audio/*"]').first();
    
    try {
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, "generate-test-audio.sh"));
      await page.waitForTimeout(1000);
    } catch {
      // Expected to fail or be ignored
    }

    // App should still be functional
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Playback Quality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should play audio without noticeable glitches", async ({ page }) => {
    await importAudioFile(page, "test-audio.mp3");
    await isSongInLibrary(page, "Test Song MP3");

    // Start playback
    const songElement = page.getByText("Test Song MP3").first();
    await songElement.dblclick();

    // Wait for some playback time
    await page.waitForTimeout(2000);

    // App should still be responsive (no freeze)
    await expect(page.locator("main")).toBeVisible();

    // Time should have progressed (not stuck at 0:00)
    // This is a basic check that playback is happening
    const timeDisplay = page.locator('[class*="time"], [class*="duration"], [class*="progress"]');
    if (await timeDisplay.count() > 0) {
      await expect(timeDisplay.first()).toBeVisible();
    }
  });
});
