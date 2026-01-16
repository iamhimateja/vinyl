import { useState } from "react";
import {
  Disc3,
  FolderOpen,
  FolderPlus,
  Music,
  Loader2,
  CheckCircle,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import type { MusicFileInfo } from "../lib/platform";

interface FirstLaunchWizardProps {
  onAddFolder: () => Promise<string | null>;
  onScanFolder: (folderPath: string) => Promise<MusicFileInfo[]>;
  onImportFiles: (files: MusicFileInfo[]) => Promise<void>;
  onComplete: () => void;
  onSkip: () => void;
}

type WizardStep = "welcome" | "select-folder" | "scanning" | "complete";

export function FirstLaunchWizard({
  onAddFolder,
  onScanFolder,
  onImportFiles,
  onComplete,
  onSkip,
}: FirstLaunchWizardProps) {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<{
    phase: "scanning" | "importing";
    found: number;
    imported: number;
  } | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  // Handle folder selection
  const handleSelectFolder = async () => {
    const folderPath = await onAddFolder();
    if (folderPath) {
      setSelectedFolder(folderPath);
      setStep("scanning");

      // Start scanning
      setScanProgress({ phase: "scanning", found: 0, imported: 0 });
      const files = await onScanFolder(folderPath);

      if (files.length > 0) {
        setScanProgress({ phase: "importing", found: files.length, imported: 0 });
        await onImportFiles(files);
        setImportedCount(files.length);
      } else {
        setImportedCount(0);
      }

      setScanProgress(null);
      setStep("complete");
    }
  };

  // Get folder name from path
  const getFolderName = (folderPath: string) => {
    const parts = folderPath.split(/[/\\]/);
    return parts[parts.length - 1] || folderPath;
  };

  return (
    <div className="fixed inset-0 z-50 bg-vinyl-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-vinyl-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-vinyl-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Skip button */}
      {step !== "scanning" && step !== "complete" && (
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 text-vinyl-text-muted hover:text-vinyl-text rounded-full hover:bg-vinyl-surface transition-colors"
          title="Skip setup"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="relative w-full max-w-lg">
        {/* Welcome Step */}
        {step === "welcome" && (
          <div className="text-center space-y-8 animate-fade-in">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-vinyl-accent/20 rounded-full flex items-center justify-center">
                  <Disc3 className="w-12 h-12 text-vinyl-accent" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-vinyl-accent rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-vinyl-bg" />
                </div>
              </div>
            </div>

            {/* Welcome text */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-vinyl-text">
                Welcome to Vinyl
              </h1>
              <p className="text-vinyl-text-muted text-lg">
                Your personal music player that feels like home
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-vinyl-surface rounded-xl">
                <Music className="w-6 h-6 text-vinyl-accent mx-auto mb-2" />
                <p className="text-sm text-vinyl-text-muted">
                  Play your music
                </p>
              </div>
              <div className="p-4 bg-vinyl-surface rounded-xl">
                <FolderOpen className="w-6 h-6 text-vinyl-accent mx-auto mb-2" />
                <p className="text-sm text-vinyl-text-muted">
                  Auto-sync folders
                </p>
              </div>
              <div className="p-4 bg-vinyl-surface rounded-xl">
                <Disc3 className="w-6 h-6 text-vinyl-accent mx-auto mb-2" />
                <p className="text-sm text-vinyl-text-muted">
                  Beautiful design
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep("select-folder")}
              className="w-full py-4 bg-vinyl-accent text-vinyl-bg rounded-xl font-semibold text-lg hover:bg-vinyl-accent-light transition-colors flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-sm text-vinyl-text-muted">
              You can always add more folders later in Settings
            </p>
          </div>
        )}

        {/* Select Folder Step */}
        {step === "select-folder" && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="w-20 h-20 bg-vinyl-surface rounded-2xl flex items-center justify-center mx-auto">
              <FolderPlus className="w-10 h-10 text-vinyl-accent" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-vinyl-text">
                Where's your music?
              </h2>
              <p className="text-vinyl-text-muted">
                Select a folder containing your music files.
                <br />
                We'll scan it and keep it synced automatically.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSelectFolder}
                className="w-full py-4 bg-vinyl-accent text-vinyl-bg rounded-xl font-semibold text-lg hover:bg-vinyl-accent-light transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-5 h-5" />
                Choose Music Folder
              </button>

              <button
                onClick={onSkip}
                className="w-full py-3 text-vinyl-text-muted hover:text-vinyl-text transition-colors"
              >
                I'll do this later
              </button>
            </div>

            <p className="text-xs text-vinyl-text-muted">
              Supports MP3, FLAC, WAV, OGG, AAC, M4A, and more
            </p>
          </div>
        )}

        {/* Scanning Step */}
        {step === "scanning" && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-vinyl-accent/20 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-vinyl-surface rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-vinyl-accent animate-spin" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-vinyl-text">
                {scanProgress?.phase === "scanning"
                  ? "Scanning your music..."
                  : "Importing songs..."}
              </h2>
              {selectedFolder && (
                <p className="text-vinyl-text-muted">
                  {getFolderName(selectedFolder)}
                </p>
              )}
            </div>

            {scanProgress && (
              <div className="space-y-2">
                <div className="h-2 bg-vinyl-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-vinyl-accent transition-all duration-300"
                    style={{
                      width: scanProgress.phase === "scanning" ? "50%" : "100%",
                    }}
                  />
                </div>
                <p className="text-sm text-vinyl-text-muted">
                  {scanProgress.phase === "scanning"
                    ? "Finding music files..."
                    : `Found ${scanProgress.found} songs`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-vinyl-text">
                You're all set!
              </h2>
              {importedCount > 0 ? (
                <p className="text-vinyl-text-muted">
                  Successfully imported{" "}
                  <span className="text-vinyl-accent font-semibold">
                    {importedCount} songs
                  </span>{" "}
                  to your library
                </p>
              ) : (
                <p className="text-vinyl-text-muted">
                  No music files found in the selected folder.
                  <br />
                  You can add more folders in Settings.
                </p>
              )}
            </div>

            {selectedFolder && importedCount > 0 && (
              <div className="p-4 bg-vinyl-surface rounded-xl">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-vinyl-accent flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-vinyl-text font-medium truncate">
                      {getFolderName(selectedFolder)}
                    </p>
                    <p className="text-xs text-vinyl-text-muted">
                      Watching for new files automatically
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onComplete}
              className="w-full py-4 bg-vinyl-accent text-vinyl-bg rounded-xl font-semibold text-lg hover:bg-vinyl-accent-light transition-colors flex items-center justify-center gap-2"
            >
              Start Listening
              <Music className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
