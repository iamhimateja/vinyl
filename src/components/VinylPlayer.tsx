import { useRef, useEffect } from "react";
import type { Song, PlaybackState } from "../types";

interface VinylPlayerProps {
  currentSong: Song | undefined;
  isPlaying: boolean;
  playbackState: PlaybackState;
  speed?: number;
  showAlbumArt?: boolean;
}

export function VinylPlayer({
  currentSong,
  isPlaying,
  playbackState,
  speed = 1,
  showAlbumArt = true,
}: VinylPlayerProps) {
  const vinylRef = useRef<HTMLDivElement>(null);

  // Calculate spin duration based on speed (base is 3s at 1x speed)
  const spinDuration = 3 / speed;

  // Determine if we should be spinning
  const shouldSpin = isPlaying && playbackState === "playing";
  const isBuffering = playbackState === "buffering";

  // Use effect to properly control animation state - runs on every relevant change
  useEffect(() => {
    if (vinylRef.current) {
      const element = vinylRef.current;
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (shouldSpin) {
          element.style.animationPlayState = "running";
        } else {
          element.style.animationPlayState = "paused";
        }
      });
    }
  }, [shouldSpin, isPlaying, playbackState]);

  // Update animation duration when speed changes
  useEffect(() => {
    if (vinylRef.current) {
      vinylRef.current.style.animationDuration = `${spinDuration}s`;
    }
  }, [spinDuration]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Turntable base/platter */}
      <div className="absolute w-72 h-72 sm:w-88 sm:h-88 lg:w-[26rem] lg:h-[26rem] rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl" />
      <div className="absolute w-[17rem] h-[17rem] sm:w-[21rem] sm:h-[21rem] lg:w-[25rem] lg:h-[25rem] rounded-full bg-zinc-900 border border-zinc-700" />

      {/* Platter mat */}
      <div className="absolute w-[16.5rem] h-[16.5rem] sm:w-[20.5rem] sm:h-[20.5rem] lg:w-[24.5rem] lg:h-[24.5rem] rounded-full bg-gradient-to-br from-zinc-800/50 to-zinc-900/50" />

      {/* Glow effect when playing */}
      {shouldSpin && (
        <div className="absolute inset-0 rounded-full bg-vinyl-accent/20 blur-3xl animate-pulse-glow" />
      )}

      {/* Vinyl record */}
      <div
        ref={vinylRef}
        className={`relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 ${isBuffering ? "animate-wobble" : ""}`}
        style={{
          transformOrigin: "center center",
          animationName: isBuffering ? undefined : "spin",
          animationDuration: `${spinDuration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationPlayState: "paused",
        }}
      >
        {/* Outer ring */}
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
          {/* Main vinyl disc */}
          <defs>
            {/* Vinyl gradient */}
            <radialGradient id="vinylGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="30%" stopColor="#0d0d0d" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>

            {/* Grooves pattern */}
            <pattern
              id="grooves"
              patternUnits="userSpaceOnUse"
              width="4"
              height="4"
            >
              <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.03)" />
            </pattern>

            {/* Label gradient */}
            <radialGradient id="labelGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4a574" />
              <stop offset="70%" stopColor="#b8956a" />
              <stop offset="100%" stopColor="#96785a" />
            </radialGradient>

            {/* Sheen effect */}
            <linearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="60%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Vinyl base */}
          <circle cx="200" cy="200" r="195" fill="url(#vinylGradient)" />

          {/* Groove rings */}
          {[...Array(25)].map((_, i) => (
            <circle
              key={i}
              cx="200"
              cy="200"
              r={70 + i * 5}
              fill="none"
              stroke="rgba(255,255,255,0.02)"
              strokeWidth="1"
            />
          ))}

          {/* Grooves texture */}
          <circle cx="200" cy="200" r="190" fill="url(#grooves)" />

          {/* Sheen overlay */}
          <circle cx="200" cy="200" r="195" fill="url(#sheen)" />

          {/* Edge highlight */}
          <circle
            cx="200"
            cy="200"
            r="195"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Inner edge */}
          <circle
            cx="200"
            cy="200"
            r="65"
            fill="none"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="2"
          />

          {/* Label - with album art if available and setting enabled */}
          {currentSong?.coverArt && showAlbumArt ? (
            <>
              {/* Clip path for circular album art */}
              <defs>
                <clipPath id="labelClip">
                  <circle cx="200" cy="200" r="60" />
                </clipPath>
              </defs>
              {/* Album art as label */}
              <image
                href={currentSong.coverArt}
                x="140"
                y="140"
                width="120"
                height="120"
                clipPath="url(#labelClip)"
                preserveAspectRatio="xMidYMid slice"
              />
              {/* Overlay for better center hole visibility */}
              <circle cx="200" cy="200" r="60" fill="rgba(0,0,0,0.1)" />
            </>
          ) : (
            <>
              {/* Default label gradient */}
              <circle cx="200" cy="200" r="60" fill="url(#labelGradient)" />
              {/* Label texture */}
              <circle
                cx="200"
                cy="200"
                r="55"
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="1"
              />
              {/* Label text */}
              <text
                x="200"
                y="185"
                textAnchor="middle"
                fill="rgba(0,0,0,0.6)"
                fontSize="10"
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
              >
                {currentSong?.artist?.toUpperCase().slice(0, 20) || "VINYL"}
              </text>
              <text
                x="200"
                y="200"
                textAnchor="middle"
                fill="rgba(0,0,0,0.8)"
                fontSize="8"
                fontFamily="system-ui, sans-serif"
              >
                {currentSong?.title?.slice(0, 25) || "No track playing"}
              </text>
              <text
                x="200"
                y="220"
                textAnchor="middle"
                fill="rgba(0,0,0,0.5)"
                fontSize="6"
                fontFamily="system-ui, sans-serif"
              >
                {currentSong?.album?.slice(0, 20) || ""}
              </text>
            </>
          )}

          {/* Center hole */}
          <circle cx="200" cy="200" r="8" fill="#0a0a0a" />
          <circle
            cx="200"
            cy="200"
            r="8"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Tonearm assembly */}
      <div
        className={`absolute -right-4 -top-4 sm:-right-6 sm:-top-6 w-36 h-52 sm:w-40 sm:h-56 pointer-events-none transition-transform duration-700 ease-out ${
          shouldSpin ? "rotate-[18deg]" : "rotate-0"
        }`}
        style={{ transformOrigin: "85% 12%" }}
      >
        <svg viewBox="0 0 120 170" className="w-full h-full drop-shadow-lg">
          {/* Tonearm pivot base */}
          <ellipse cx="100" cy="20" rx="18" ry="10" fill="#2a2a2a" />
          <circle cx="100" cy="18" r="14" fill="url(#armBaseGradient)" />
          <circle cx="100" cy="18" r="10" fill="#3a3a3a" />
          <circle cx="100" cy="18" r="6" fill="#4a4a4a" />

          {/* Gradient definitions */}
          <defs>
            <linearGradient
              id="armBaseGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#4a4a4a" />
              <stop offset="50%" stopColor="#3a3a3a" />
              <stop offset="100%" stopColor="#2a2a2a" />
            </linearGradient>
            <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#666" />
              <stop offset="50%" stopColor="#888" />
              <stop offset="100%" stopColor="#666" />
            </linearGradient>
          </defs>

          {/* Counterweight */}
          <circle cx="108" cy="35" r="8" fill="#333" />
          <circle cx="108" cy="35" r="6" fill="#444" />

          {/* Main arm tube */}
          <line
            x1="100"
            y1="18"
            x2="25"
            y2="130"
            stroke="url(#armGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Arm highlight */}
          <line
            x1="100"
            y1="17"
            x2="25"
            y2="129"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Headshell */}
          <rect x="12" y="125" width="30" height="10" rx="2" fill="#3a3a3a" />
          <rect x="14" y="127" width="26" height="6" rx="1" fill="#4a4a4a" />

          {/* Cartridge body */}
          <rect x="10" y="135" width="14" height="16" rx="2" fill="#2a2a2a" />
          <rect x="12" y="137" width="10" height="12" rx="1" fill="#333" />

          {/* Stylus/needle */}
          <line
            x1="17"
            y1="151"
            x2="17"
            y2="158"
            stroke="#d4a574"
            strokeWidth="1.5"
          />
          <circle cx="17" cy="159" r="1" fill="#d4a574" />
        </svg>
      </div>

      {/* Speed indicator light */}
      <div
        className={`absolute -right-2 top-1/2 w-2 h-2 rounded-full transition-colors duration-300 ${
          shouldSpin
            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
            : "bg-zinc-600"
        }`}
      />
    </div>
  );
}
