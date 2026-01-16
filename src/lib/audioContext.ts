// Shared audio context for equalizer and visualizer
// An audio element can only be connected to ONE MediaElementSourceNode EVER

const AUDIO_DATA = Symbol.for("vinyl-shared-audio-context");

export interface SharedAudioData {
  audioContext: AudioContext;
  sourceNode: MediaElementAudioSourceNode;
  analyser: AnalyserNode;
  preGainNode: GainNode; // Before EQ
  postGainNode: GainNode; // After EQ, before destination
}

function getAudioData(el: HTMLAudioElement): SharedAudioData | undefined {
  return (el as unknown as Record<symbol, SharedAudioData>)[AUDIO_DATA];
}

function setAudioData(el: HTMLAudioElement, data: SharedAudioData): void {
  (el as unknown as Record<symbol, SharedAudioData>)[AUDIO_DATA] = data;
}

export function getSharedAudioContext(
  audioElement: HTMLAudioElement
): SharedAudioData | null {
  // Return existing if already created
  const existing = getAudioData(audioElement);
  if (existing) {
    // Resume if suspended
    if (existing.audioContext.state === "suspended") {
      existing.audioContext.resume();
    }
    return existing;
  }

  // Create new shared audio context
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    const audioContext = new AudioContextClass();

    // Create source from audio element (can only be done ONCE)
    const sourceNode = audioContext.createMediaElementSource(audioElement);

    // Create analyser for visualizations
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;

    // Create gain nodes
    const preGainNode = audioContext.createGain();
    const postGainNode = audioContext.createGain();

    // Default chain: source -> analyser -> preGain -> postGain -> destination
    // The equalizer will insert filters between preGain and postGain
    sourceNode.connect(analyser);
    analyser.connect(preGainNode);
    preGainNode.connect(postGainNode);
    postGainNode.connect(audioContext.destination);

    const data: SharedAudioData = {
      audioContext,
      sourceNode,
      analyser,
      preGainNode,
      postGainNode,
    };

    // Store on the element itself so it survives HMR
    setAudioData(audioElement, data);

    // Resume if suspended
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    console.log("[AudioContext] Shared audio context created");
    return data;
  } catch (error) {
    console.error("[AudioContext] Failed to create:", error);
    return null;
  }
}

// Resume audio context (call on user interaction)
export function resumeAudioContext(audioElement: HTMLAudioElement): void {
  const data = getAudioData(audioElement);
  if (data?.audioContext.state === "suspended") {
    data.audioContext.resume();
  }
}
