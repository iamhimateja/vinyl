import { Music } from "lucide-react";
import type { Song } from "../types";

interface NowPlayingProps {
  song: Song | undefined;
  showAlbumArt?: boolean;
}

export function NowPlaying({ song, showAlbumArt = false }: NowPlayingProps) {
  if (!song) {
    return (
      <div className="text-center py-2">
        <p className="text-vinyl-text-muted text-sm">No track selected</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 py-4 animate-fade-in">
      {/* Album art (optional) */}
      {showAlbumArt && (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-vinyl-border">
          {song.coverArt ? (
            <img
              src={song.coverArt}
              alt={song.album}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-8 h-8 text-vinyl-text-muted" />
            </div>
          )}
        </div>
      )}

      {/* Song info */}
      <div className={showAlbumArt ? "text-left min-w-0" : "text-center"}>
        <h2 className="text-xl font-semibold text-vinyl-text truncate px-4">
          {song.title}
        </h2>
        <p className="text-vinyl-text-muted mt-1 truncate px-4">
          {song.artist}
          {song.album !== "Unknown Album" && ` — ${song.album}`}
        </p>
      </div>
    </div>
  );
}
