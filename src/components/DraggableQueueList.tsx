import { memo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Music, Play, Pause, Square, Trash2 } from "lucide-react";
import type { Song } from "../types";
import { formatDuration } from "../lib/audioMetadata";
import { tooltipProps } from "./Tooltip";

interface DraggableQueueListProps {
  songs: Song[];
  currentSongId: string | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onTogglePlayPause?: () => void;
  onStop?: () => void;
  onDelete: (songId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

interface SortableSongItemProps {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onTogglePlayPause?: () => void;
  onStop?: () => void;
  onDelete: (songId: string) => void;
}

const SortableSongItem = memo(function SortableSongItem({
  song,
  index,
  isCurrentSong,
  isPlaying,
  onPlay,
  onTogglePlayPause,
  onStop,
  onDelete,
}: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2 transition-colors ${
        isCurrentSong ? "bg-vinyl-accent/20" : "hover:bg-vinyl-border/50"
      } ${isDragging ? "shadow-lg bg-vinyl-surface" : ""}`}
    >
      {/* Drag handle */}
      <button
        className="p-1 cursor-grab active:cursor-grabbing text-vinyl-text-muted hover:text-vinyl-text touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Index / cover art */}
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded bg-vinyl-border/50 overflow-hidden">
        {song.coverArt ? (
          <img
            src={song.coverArt}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-vinyl-text-muted">{index + 1}</span>
        )}
      </div>

      {/* Song info */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onPlay(song)}
      >
        <p
          className={`text-sm font-medium truncate ${
            isCurrentSong ? "text-vinyl-accent" : "text-vinyl-text"
          }`}
        >
          {song.title}
        </p>
        <p className="text-xs text-vinyl-text-muted truncate">{song.artist}</p>
      </div>

      {/* Duration and Actions container - fixed width */}
      <div className="flex items-center justify-end gap-1 w-24 flex-shrink-0">
        {/* Actions - show on hover, hide duration */}
        <div className="hidden group-hover:flex items-center gap-1">
          {isCurrentSong ? (
            <>
              <button
                onClick={() => onTogglePlayPause?.()}
                className="p-1.5 rounded-full text-vinyl-accent hover:bg-vinyl-accent/20 transition-colors"
                {...tooltipProps(isCurrentlyPlaying ? "Pause" : "Play")}
              >
                {isCurrentlyPlaying ? (
                  <Pause className="w-4 h-4" fill="currentColor" />
                ) : (
                  <Play className="w-4 h-4" fill="currentColor" />
                )}
              </button>
              <button
                onClick={() => onStop?.()}
                className="p-1.5 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border transition-colors"
                {...tooltipProps("Stop")}
              >
                <Square className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onPlay(song)}
              className="p-1.5 rounded-full text-vinyl-text-muted hover:text-vinyl-accent hover:bg-vinyl-accent/20 transition-colors"
              {...tooltipProps("Play")}
            >
              <Play className="w-4 h-4" fill="currentColor" />
            </button>
          )}
          <button
            onClick={() => onDelete(song.id)}
            className="p-1.5 rounded-full text-vinyl-text-muted hover:text-red-400 hover:bg-red-500/20 transition-colors"
            {...tooltipProps("Remove from queue")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Duration - hide on hover */}
        <span className="text-xs text-vinyl-text-muted group-hover:hidden">
          {formatDuration(song.duration)}
        </span>
      </div>
    </div>
  );
});

export function DraggableQueueList({
  songs,
  currentSongId,
  isPlaying,
  onPlay,
  onTogglePlayPause,
  onStop,
  onDelete,
  onReorder,
}: DraggableQueueListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = songs.findIndex((s) => s.id === active.id);
      const newIndex = songs.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Music className="w-12 h-12 text-vinyl-text-muted mb-4" />
        <p className="text-vinyl-text-muted">Queue is empty</p>
        <p className="text-sm text-vinyl-text-muted mt-1">
          Play a song to start the queue
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={songs.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="overflow-y-auto h-full">
          {songs.map((song, index) => (
            <SortableSongItem
              key={song.id}
              song={song}
              index={index}
              isCurrentSong={song.id === currentSongId}
              isPlaying={isPlaying}
              onPlay={onPlay}
              onTogglePlayPause={onTogglePlayPause}
              onStop={onStop}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
