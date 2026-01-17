import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickPlayOverlay, DropZoneOverlay } from './QuickPlayOverlay';

// Mock the audioMetadata module
vi.mock('../lib/audioMetadata', () => ({
  isAudioFile: (file: File) => {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    return audioExtensions.includes(ext);
  },
  extractMetadata: vi.fn().mockResolvedValue({
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    coverArt: undefined,
  }),
  formatDuration: (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
}));

describe('DropZoneOverlay', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<DropZoneOverlay isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay when visible', () => {
    render(<DropZoneOverlay isVisible={true} />);
    expect(screen.getByText('Drop to Play')).toBeInTheDocument();
    expect(screen.getByText('Drop audio files here to play them instantly')).toBeInTheDocument();
  });
});

describe('QuickPlayOverlay', () => {
  const mockOnPlayFiles = vi.fn();
  const mockOnImportAndPlay = vi.fn();
  const mockOnDismiss = vi.fn();

  const createMockAudioFile = (name: string = 'test-song.mp3'): File => {
    return new File(['audio content'], name, { type: 'audio/mpeg' });
  };

  const createMockNonAudioFile = (name: string = 'document.pdf'): File => {
    return new File(['pdf content'], name, { type: 'application/pdf' });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    const { container } = render(
      <QuickPlayOverlay
        isVisible={false}
        droppedFiles={[]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no files are dropped', () => {
    const { container } = render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={[]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows unsupported file message for non-audio files', () => {
    const nonAudioFile = createMockNonAudioFile();
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={[nonAudioFile]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Unsupported File')).toBeInTheDocument();
    expect(screen.getByText('This file type is not supported')).toBeInTheDocument();
    expect(screen.getByText('Please use MP3, WAV, OGG, FLAC, AAC, or M4A files')).toBeInTheDocument();
  });

  it('shows unsupported files message (plural) for multiple non-audio files', () => {
    const nonAudioFiles = [createMockNonAudioFile('doc1.pdf'), createMockNonAudioFile('doc2.txt')];
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={nonAudioFiles}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Unsupported Files')).toBeInTheDocument();
    expect(screen.getByText('These files are not supported')).toBeInTheDocument();
  });

  it('renders single file dialog with correct title', async () => {
    const audioFile = createMockAudioFile();
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={[audioFile]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Play Audio File')).toBeInTheDocument();
    
    // Wait for metadata extraction
    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('renders multiple files dialog with correct title', () => {
    const audioFiles = [
      createMockAudioFile('song1.mp3'),
      createMockAudioFile('song2.mp3'),
      createMockAudioFile('song3.mp3'),
    ];
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={audioFiles}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Play 3 Files')).toBeInTheDocument();
    expect(screen.getByText('3 audio files')).toBeInTheDocument();
  });

  it('shows "Play Now" button for single file', async () => {
    const audioFile = createMockAudioFile();
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={[audioFile]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play now/i })).toBeInTheDocument();
    });
  });

  it('shows "Play All" button for multiple files', () => {
    const audioFiles = [createMockAudioFile('song1.mp3'), createMockAudioFile('song2.mp3')];
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={audioFiles}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByRole('button', { name: /play all/i })).toBeInTheDocument();
  });

  it('calls onPlayFiles when Play Now is clicked', async () => {
    const audioFile = createMockAudioFile();
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={[audioFile]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play now/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /play now/i }));

    await waitFor(() => {
      expect(mockOnPlayFiles).toHaveBeenCalledWith([audioFile]);
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  it('calls onImportAndPlay when Add to Library is clicked', async () => {
    const audioFile = createMockAudioFile();
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={[audioFile]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add to library/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /add to library/i }));

    await waitFor(() => {
      expect(mockOnImportAndPlay).toHaveBeenCalledWith([audioFile]);
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  it('calls onDismiss when Cancel is clicked', () => {
    const audioFile = createMockAudioFile();
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={[audioFile]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('calls onDismiss when X button is clicked', () => {
    const audioFile = createMockAudioFile();
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={[audioFile]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    // Find the close button (X) - it's the first button with just the X icon
    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('shows file list for multiple files (up to 5)', () => {
    const audioFiles = [
      createMockAudioFile('song1.mp3'),
      createMockAudioFile('song2.mp3'),
      createMockAudioFile('song3.mp3'),
    ];
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={audioFiles}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('song1')).toBeInTheDocument();
    expect(screen.getByText('song2')).toBeInTheDocument();
    expect(screen.getByText('song3')).toBeInTheDocument();
  });

  it('shows "+N more" for more than 5 files', () => {
    const audioFiles = Array.from({ length: 8 }, (_, i) => 
      createMockAudioFile(`song${i + 1}.mp3`)
    );
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={audioFiles}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('+3 more...')).toBeInTheDocument();
  });

  it('filters out non-audio files from mixed file drops', () => {
    const mixedFiles = [
      createMockAudioFile('song.mp3'),
      createMockNonAudioFile('document.pdf'),
    ];
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={mixedFiles}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    // Should show single file dialog since only one audio file
    expect(screen.getByText('Play Audio File')).toBeInTheDocument();
  });

  it('displays info text about quick play', async () => {
    const audioFile = createMockAudioFile();
    render(
      <QuickPlayOverlay
        isVisible={true}
        droppedFiles={[audioFile]}
        onPlayFiles={mockOnPlayFiles}
        onImportAndPlay={mockOnImportAndPlay}
        onDismiss={mockOnDismiss}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/"Play Now" plays the file without saving to your library/i)).toBeInTheDocument();
    });
  });
});
