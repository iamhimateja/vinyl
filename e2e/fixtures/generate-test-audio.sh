#!/bin/bash
# Generate test audio files in various formats for E2E testing
# Requires: ffmpeg

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Generating test audio files..."

# Generate a 3-second 440Hz sine wave (A4 note) as base
# Using lavfi (libavfilter) to generate audio

# MP3 - Most common format
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=3" \
  -metadata title="Test Song MP3" \
  -metadata artist="Test Artist" \
  -metadata album="Test Album" \
  -c:a libmp3lame -q:a 9 \
  test-audio.mp3

# WAV - Uncompressed
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=3" \
  -metadata title="Test Song WAV" \
  -metadata artist="Test Artist" \
  -metadata album="Test Album" \
  -c:a pcm_s16le \
  test-audio.wav

# OGG - Vorbis
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=3" \
  -metadata title="Test Song OGG" \
  -metadata artist="Test Artist" \
  -metadata album="Test Album" \
  -c:a libvorbis -q:a 0 \
  test-audio.ogg

# FLAC - Lossless
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=3" \
  -metadata title="Test Song FLAC" \
  -metadata artist="Test Artist" \
  -metadata album="Test Album" \
  -c:a flac \
  test-audio.flac

# OPUS - Modern codec
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=3" \
  -metadata title="Test Song OPUS" \
  -metadata artist="Test Artist" \
  -metadata album="Test Album" \
  -c:a libopus -b:a 32k \
  test-audio.opus

# WebM audio
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=3" \
  -metadata title="Test Song WebM" \
  -metadata artist="Test Artist" \
  -metadata album="Test Album" \
  -c:a libopus -b:a 32k \
  test-audio.webm

# M4A/AAC (for testing transcoding on Linux)
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=3" \
  -metadata title="Test Song M4A" \
  -metadata artist="Test Artist" \
  -metadata album="Test Album" \
  -c:a aac -b:a 64k \
  test-audio.m4a

# Generate a second track for queue testing (different frequency)
ffmpeg -y -f lavfi -i "sine=frequency=523:duration=3" \
  -metadata title="Second Track" \
  -metadata artist="Another Artist" \
  -metadata album="Another Album" \
  -c:a libmp3lame -q:a 9 \
  test-audio-2.mp3

# Generate a third track (different frequency)
ffmpeg -y -f lavfi -i "sine=frequency=659:duration=3" \
  -metadata title="Third Track" \
  -metadata artist="Third Artist" \
  -metadata album="Third Album" \
  -c:a libmp3lame -q:a 9 \
  test-audio-3.mp3

echo ""
echo "Generated test audio files:"
ls -la *.mp3 *.wav *.ogg *.flac *.opus *.webm *.m4a 2>/dev/null || true
echo ""
echo "Done!"
