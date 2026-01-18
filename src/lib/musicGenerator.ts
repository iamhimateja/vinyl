// Enhanced Music Generator with realistic patterns and many genres
// Based on popular music production techniques

export type Genre = "lofi" | "techno" | "80s-synth" | "ambient" | "house" | "dnb" | "trap";

export interface EffectsState {
  reverb: boolean;
  delay: boolean;
  filter: boolean;
  vinyl: boolean;
}

// Popular chord progressions
const PROGRESSIONS: Record<Genre, number[][][]> = {
  lofi: [
    [[2, 5, 9], [7, 11, 2], [0, 4, 7], [9, 0, 4]],
    [[0, 4, 7], [9, 0, 4], [5, 9, 0], [7, 11, 2]],
    [[9, 0, 4], [5, 9, 0], [0, 4, 7], [7, 11, 2]],
    [[0, 4, 7, 11], [5, 9, 0, 4], [9, 0, 4, 7], [7, 11, 2, 5]],
  ],
  techno: [
    [[0, 7], [0, 7], [0, 7], [0, 7]],
    [[0, 7], [0, 7], [10, 5], [10, 5]],
    [[0, 3, 7], [0, 3, 7], [10, 2, 5], [10, 2, 5]],
    [[0], [3], [5], [3]],
  ],
  "80s-synth": [
    [[0, 4, 7], [7, 11, 2], [9, 0, 4], [5, 9, 0]],
    [[0, 4, 7], [9, 0, 4], [5, 9, 0], [7, 11, 2]],
    [[9, 0, 4], [5, 9, 0], [0, 4, 7], [7, 11, 2]],
    [[0, 4, 7], [10, 2, 5], [5, 9, 0], [0, 4, 7]],
  ],
  ambient: [
    [[0, 4, 7, 11], [0, 4, 7, 11], [5, 9, 0, 4], [5, 9, 0, 4]],
    [[0, 7, 11], [5, 9, 2], [7, 0, 4], [2, 7, 11]],
    [[0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]],
    [[9, 0, 4, 7], [5, 9, 0, 4], [2, 5, 9, 0], [7, 11, 2, 5]],
  ],
  house: [
    [[0, 4, 7], [5, 9, 0], [9, 0, 4], [7, 11, 2]],
    [[0, 3, 7], [5, 8, 0], [7, 10, 2], [0, 3, 7]],
    [[0, 4, 7], [0, 4, 7], [5, 9, 0], [5, 9, 0]],
    [[9, 0, 4], [9, 0, 4], [5, 9, 0], [7, 11, 2]],
  ],
  dnb: [
    [[0, 3, 7], [0, 3, 7], [5, 8, 0], [5, 8, 0]],
    [[0, 7], [3, 10], [5, 0], [7, 2]],
    [[0, 3, 7], [10, 2, 5], [8, 0, 3], [5, 8, 0]],
    [[0], [0], [5], [3]],
  ],
  trap: [
    [[0, 3, 7], [0, 3, 7], [5, 8, 0], [5, 8, 0]],
    [[0, 3, 7], [10, 2, 5], [8, 0, 3], [3, 7, 10]],
    [[0], [0], [3], [5]],
    [[0, 7], [0, 7], [3, 10], [5, 0]],
  ],
};

// Drum patterns
const DRUMS: Record<Genre, { kick: string; snare: string; hihat: string; perc: string }[]> = {
  lofi: [
    { kick: "x...x..x.x..x...", snare: "....x.......x...", hihat: "..x...x...x...x.", perc: "x.x.x.x.x.x.x.x." },
    { kick: "x..x..x...x..x..", snare: "....x.......x.x.", hihat: ".x.x.x.x.x.x.x.x", perc: "...x.......x...." },
    { kick: "x.....x.x.......", snare: "....x.......x...", hihat: "x.x.x.x.x.x.x.x.", perc: "..x.....x......." },
  ],
  techno: [
    { kick: "x...x...x...x...", snare: "................", hihat: ".x.x.x.x.x.x.x.x", perc: "....x.......x..." },
    { kick: "x...x...x...x...", snare: "................", hihat: "xxxxxxxxxxxxxxxx", perc: "..x...x...x...x." },
    { kick: "x..x..x.x..x..x.", snare: "....x.......x...", hihat: ".xxx.xxx.xxx.xxx", perc: ".x.x.x.x.x.x.x.x" },
  ],
  "80s-synth": [
    { kick: "x...x...x...x...", snare: "....x.......x...", hihat: "x.x.x.x.x.x.x.x.", perc: "..............x." },
    { kick: "x.......x.......", snare: "....x.......x...", hihat: "x.x.x.x.x.x.x.x.", perc: "......x.......x." },
    { kick: "x.x...x.x.x...x.", snare: "....x.......x...", hihat: "xxxxxxxxxxxxxxxx", perc: "................" },
  ],
  ambient: [
    { kick: "................", snare: "................", hihat: "................", perc: "x.............x." },
    { kick: "x...............", snare: "................", hihat: "................", perc: "........x......." },
    { kick: "................", snare: "................", hihat: "..x.....x.....x.", perc: "x..............." },
  ],
  house: [
    { kick: "x...x...x...x...", snare: "....x.......x...", hihat: ".x.x.x.x.x.x.x.x", perc: "x...x...x...x..." },
    { kick: "x...x...x...x...", snare: "....x.......x...", hihat: "x.x.x.x.x.x.x.x.", perc: "..x...x...x...x." },
    { kick: "x...x...x..xx...", snare: "....x.......x...", hihat: ".x.x.x.x.x.x.x.x", perc: "x.......x......." },
  ],
  dnb: [
    { kick: "x.....x...x.....", snare: "....x.......x...", hihat: "x.x.x.x.x.x.x.x.", perc: "..x...x...x...x." },
    { kick: "x.......x.x.....", snare: "....x.....x.x...", hihat: "xxxxxxxxxxxxxxxx", perc: ".x.x.x.x.x.x.x.x" },
    { kick: "x...x.....x.....", snare: "....x.......x.x.", hihat: "x.xxx.xxx.xxx.xx", perc: "...x...x...x...x" },
  ],
  trap: [
    { kick: "x..x....x..x....", snare: "....x.......x...", hihat: "x.xxx.xxx.xxx.xx", perc: "..x...x...x...x." },
    { kick: "x.......x..x....", snare: "....x.......x...", hihat: "xxxxxxxxxxxxxxxx", perc: ".x.x.x.x.x.x.x.x" },
    { kick: "x..x..x...x.....", snare: "....x.......x.x.", hihat: "x.x.xxxx.x.xxxxx", perc: "x...x...x...x..." },
  ],
};

// Bass patterns
const BASS: Record<Genre, string[]> = {
  lofi: ["x.....x.x.......", "x..x....x..x....", "x.......x.x....."],
  techno: ["x.x.x.x.x.x.x.x.", "x..x..x.x..x..x.", "xxxxxxxxxxxxxxxx"],
  "80s-synth": ["x...x...x...x...", "x..x..x.x..x..x.", "x.x.....x.x....."],
  ambient: ["x...............", "x.......x.......", "................"],
  house: ["x...x...x...x...", "x..x..x.x..x..x.", "x.x...x.x.x...x."],
  dnb: ["x.......x.......", "x...x.......x...", "x.....x.x......."],
  trap: ["x..x....x..x....", "x.......x.x.....", "x...x.x...x....."],
};

// Scales
const SCALES: Record<Genre, number[][]> = {
  lofi: [[0, 2, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 9, 10], [0, 3, 5, 7, 10]],
  techno: [[0, 2, 3, 5, 7, 8, 10], [0, 1, 3, 5, 7, 8, 10], [0, 3, 5, 6, 7, 10]],
  "80s-synth": [[0, 2, 4, 5, 7, 9, 11], [0, 2, 4, 6, 7, 9, 11], [0, 2, 3, 5, 7, 8, 10]],
  ambient: [[0, 2, 4, 7, 9], [0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 5, 7, 9, 10]],
  house: [[0, 2, 3, 5, 7, 8, 10], [0, 2, 4, 5, 7, 9, 11], [0, 3, 5, 7, 10]],
  dnb: [[0, 2, 3, 5, 7, 8, 10], [0, 3, 5, 6, 7, 10], [0, 2, 3, 5, 7, 10]],
  trap: [[0, 2, 3, 5, 7, 8, 10], [0, 3, 5, 6, 7, 10], [0, 1, 3, 5, 7, 8, 10]],
};

// Arpeggio patterns
const ARPS = [
  [0, 1, 2, 1], [0, 1, 2, 2, 1, 0], [0, 0, 1, 1, 2, 2], [2, 1, 0, 1], [0, 2, 1, 2],
];

// Melody patterns (scale degrees)
const MELODIES = [
  [0, 2, 4, 2, 0, -1, 0, 2], [4, 2, 0, 2, 4, 5, 4, 2], [0, 0, 2, 2, 4, 4, 2, 0], [7, 5, 4, 2, 0, 2, 4, 5],
];

const CONFIG: Record<Genre, { tempo: { min: number; max: number; def: number }; swing: number; base: number }> = {
  lofi: { tempo: { min: 65, max: 90, def: 75 }, swing: 0.12, base: 48 },
  techno: { tempo: { min: 125, max: 145, def: 132 }, swing: 0, base: 36 },
  "80s-synth": { tempo: { min: 105, max: 125, def: 118 }, swing: 0.02, base: 48 },
  ambient: { tempo: { min: 60, max: 80, def: 70 }, swing: 0, base: 48 },
  house: { tempo: { min: 118, max: 130, def: 124 }, swing: 0.05, base: 48 },
  dnb: { tempo: { min: 160, max: 180, def: 174 }, swing: 0, base: 36 },
  trap: { tempo: { min: 130, max: 160, def: 140 }, swing: 0, base: 36 },
};

function parse(s: string): number[] { return s.split("").map(c => c === "x" ? 1 : 0); }

export class MusicGenerator {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private comp: DynamicsCompressorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private delay: DelayNode | null = null;
  private delayFb: GainNode | null = null;
  private delayGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private playing = false;
  private genre: Genre = "lofi";
  private tempo = 75;
  private schedId: number | null = null;
  private nextT = 0;
  private step = 0;
  private bar = 0;

  private drums: { kick: number[]; snare: number[]; hihat: number[]; perc: number[] };
  private bass: number[];
  private chords: number[][];
  private arp: number[];
  private melody: number[];
  private scale: number[];
  private section = 0;
  private intensity = 0.7;

  private fx: EffectsState = { reverb: false, delay: false, filter: false, vinyl: false };
  public onStepChange?: (step: number, bar: number) => void;

  constructor() {
    const d = DRUMS.lofi[0];
    this.drums = { kick: parse(d.kick), snare: parse(d.snare), hihat: parse(d.hihat), perc: parse(d.perc) };
    this.bass = parse(BASS.lofi[0]);
    this.chords = PROGRESSIONS.lofi[0];
    this.arp = ARPS[0];
    this.melody = MELODIES[0];
    this.scale = SCALES.lofi[0];
  }

  private init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();

    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -18; this.comp.knee.value = 8; this.comp.ratio.value = 4;

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.75;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = this.fx.filter ? 2500 : 20000;

    const len = this.ctx.sampleRate * 2.5;
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2); }
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = buf;
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = this.fx.reverb ? 0.35 : 0;

    this.delay = this.ctx.createDelay(1);
    this.delay.delayTime.value = 60 / this.tempo * 0.75;
    this.delayFb = this.ctx.createGain();
    this.delayFb.gain.value = 0.4;
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.value = this.fx.delay ? 0.25 : 0;

    this.filter.connect(this.comp);
    this.filter.connect(this.reverb); this.reverb.connect(this.reverbGain); this.reverbGain.connect(this.comp);
    this.filter.connect(this.delay); this.delay.connect(this.delayFb); this.delayFb.connect(this.delay);
    this.delay.connect(this.delayGain); this.delayGain.connect(this.comp);
    // Create analyser for visualization
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.comp.connect(this.master);
    this.master.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  // Get frequency data for visualizer
  getFrequencyData(): Uint8Array {
    const data = new Uint8Array(this.analyser?.frequencyBinCount || 128);
    this.analyser?.getByteFrequencyData(data);
    return data;
  }

  // Get waveform data for visualizer
  getWaveformData(): Uint8Array {
    const data = new Uint8Array(this.analyser?.fftSize || 256);
    this.analyser?.getByteTimeDomainData(data);
    return data;
  }

  // Check if audio context is active
  isAudioContextActive(): boolean {
    return this.ctx?.state === 'running';
  }

  private freq(m: number) { return 440 * Math.pow(2, (m - 69) / 12); }

  private kick(t: number, v = 1) {
    if (!this.ctx || !this.filter) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    g.gain.setValueAtTime(0.9 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g); g.connect(this.filter); o.start(t); o.stop(t + 0.35);
    // click
    const c = this.ctx.createOscillator(), cg = this.ctx.createGain();
    c.type = "square"; c.frequency.setValueAtTime(1000, t); c.frequency.exponentialRampToValueAtTime(200, t + 0.02);
    cg.gain.setValueAtTime(0.2 * v, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    c.connect(cg); cg.connect(this.filter); c.start(t); c.stop(t + 0.02);
  }

  private snare(t: number, v = 1) {
    if (!this.ctx || !this.filter) return;
    const n = this.ctx.createBufferSource(), nb = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
    const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    n.buffer = nb; const nf = this.ctx.createBiquadFilter(); nf.type = "highpass"; nf.frequency.value = 2500;
    const ng = this.ctx.createGain(); ng.gain.setValueAtTime(0.35 * v, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    n.connect(nf); nf.connect(ng); ng.connect(this.filter); n.start(t); n.stop(t + 0.15);
    const o = this.ctx.createOscillator(), og = this.ctx.createGain();
    o.type = "triangle"; o.frequency.value = 180;
    og.gain.setValueAtTime(0.4 * v, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(og); og.connect(this.filter); o.start(t); o.stop(t + 0.08);
  }

  private hat(t: number, open = false, v = 1) {
    if (!this.ctx || !this.filter) return;
    const dur = open ? 0.25 : 0.06;
    const n = this.ctx.createBufferSource(), nb = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    n.buffer = nb; const f = this.ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 8000;
    const g = this.ctx.createGain(); g.gain.setValueAtTime((open ? 0.12 : 0.08) * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(f); f.connect(g); g.connect(this.filter); n.start(t); n.stop(t + dur);
  }

  private clap(t: number, v = 1) {
    if (!this.ctx || !this.filter) return;
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.01;
      const n = this.ctx.createBufferSource(), nb = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
      const nd = nb.getChannelData(0); for (let j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
      n.buffer = nb; const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1200;
      const g = this.ctx.createGain(); g.gain.setValueAtTime(0.2 * v * (1 - i * 0.2), tt); g.gain.exponentialRampToValueAtTime(0.001, tt + 0.04);
      n.connect(f); f.connect(g); g.connect(this.filter); n.start(tt); n.stop(tt + 0.04);
    }
  }

  private perc(t: number, v = 1) {
    if (!this.ctx || !this.filter) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = "triangle"; o.frequency.value = 600 + Math.random() * 400;
    g.gain.setValueAtTime(0.15 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    o.connect(g); g.connect(this.filter); o.start(t); o.stop(t + 0.04);
  }

  private playBass(t: number, note: number, dur: number, v = 1) {
    if (!this.ctx || !this.filter) return;
    const type: OscillatorType = (this.genre === "techno" || this.genre === "dnb" || this.genre === "trap") ? "sawtooth" : "triangle";
    const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(), g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(1000, t); lp.frequency.exponentialRampToValueAtTime(150, t + dur);
    o1.type = type; o2.type = "sine"; o1.frequency.value = this.freq(note); o2.frequency.value = this.freq(note - 12);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.45 * v, t + 0.008); g.gain.setValueAtTime(0.4 * v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.filter);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  private playPad(t: number, notes: number[], dur: number, v = 1) {
    if (!this.ctx || !this.filter) return;
    notes.forEach((n, i) => {
      const o1 = this.ctx!.createOscillator(), o2 = this.ctx!.createOscillator(), g = this.ctx!.createGain();
      const type: OscillatorType = this.genre === "ambient" ? "sine" : this.genre === "80s-synth" ? "sawtooth" : "triangle";
      o1.type = type; o2.type = type; o1.frequency.value = this.freq(n); o2.frequency.value = this.freq(n) * 1.004;
      const st = t + i * 0.015;
      const att = this.genre === "ambient" ? 0.8 : 0.2;
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.06 * v, st + att); g.gain.setValueAtTime(0.05 * v, st + dur - 0.3); g.gain.linearRampToValueAtTime(0.001, st + dur);
      o1.connect(g); o2.connect(g); g.connect(this.filter!);
      o1.start(st); o2.start(st); o1.stop(st + dur + 0.1); o2.stop(st + dur + 0.1);
    });
  }

  private playLead(t: number, note: number, dur: number, v = 1) {
    if (!this.ctx || !this.filter) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = this.genre === "lofi" || this.genre === "ambient" ? "sine" : "sawtooth";
    o.frequency.value = this.freq(note); o.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12 * v, t + 0.015); g.gain.setValueAtTime(0.1 * v, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.filter); o.start(t); o.stop(t + dur + 0.05);
  }

  private playArp(t: number, note: number, dur: number, v = 1) {
    if (!this.ctx || !this.filter) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = "square"; o.frequency.value = this.freq(note);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.filter); o.start(t); o.stop(t + dur + 0.05);
  }

  private vinyl(t: number) {
    if (!this.fx.vinyl || this.genre !== "lofi" || Math.random() > 0.1) return;
    if (!this.ctx || !this.filter) return;
    const n = this.ctx.createBufferSource(), nb = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.012, this.ctx.sampleRate);
    const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.2;
    n.buffer = nb; const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3500; f.Q.value = 5;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
    n.connect(f); f.connect(g); g.connect(this.filter); n.start(t); n.stop(t + 0.012);
  }

  private scheduleStep() {
    if (!this.ctx || !this.playing) return;
    const cfg = CONFIG[this.genre];
    const stepDur = 60 / this.tempo / 4;
    let t = this.nextT;
    if (this.step % 2 === 1) t += stepDur * cfg.swing;
    t += (Math.random() - 0.5) * 0.006;

    const s = this.step;
    const v = 0.75 + Math.random() * 0.25;

    // Drums (skip some for ambient)
    const drumProb = this.genre === "ambient" ? 0.4 : 0.95;
    if (this.drums.kick[s] && Math.random() < drumProb) this.kick(t, v);
    if (this.drums.snare[s] && Math.random() < drumProb) {
      if (this.genre === "80s-synth" || this.genre === "house" || Math.random() > 0.4) this.clap(t, v);
      else this.snare(t, v);
    }
    if (this.drums.hihat[s] && Math.random() < drumProb) this.hat(t, s % 8 === 7 && Math.random() > 0.5, v * 0.75);
    if (this.drums.perc[s] && Math.random() > 0.25) this.perc(t, v * 0.5);

    // Bass
    const chordIdx = this.bar % 4;
    const chord = this.chords[chordIdx] || this.chords[0];
    if (this.bass[s] && Math.random() > 0.06) {
      const bassNote = cfg.base + chord[0];
      this.playBass(t, bassNote, stepDur * 1.5, v);
    }

    // Pad
    if (s === 0) {
      const padDur = this.genre === "ambient" ? stepDur * 32 : stepDur * 15;
      const padNotes = chord.map(n => cfg.base + 12 + n);
      this.playPad(t, padNotes, padDur, this.intensity * 0.8);
    }

    // Melody
    if (s % 4 === 0 && Math.random() > (this.genre === "ambient" ? 0.6 : 0.35)) {
      const mi = Math.floor((this.bar * 4 + s / 4) % this.melody.length);
      const deg = this.melody[mi];
      const sn = this.scale[Math.abs(deg) % this.scale.length] || 0;
      const oct = deg < 0 ? 0 : 12;
      const note = cfg.base + 24 + sn + oct;
      const dur = stepDur * (Math.random() > 0.5 ? 2 : 4);
      this.playLead(t, note, dur, v * this.intensity);
    }

    // Arpeggio
    const arpGenres: Genre[] = ["80s-synth", "techno", "house", "dnb", "trap"];
    if (arpGenres.includes(this.genre) && s % 2 === 0 && Math.random() > 0.2) {
      const ai = (s / 2) % this.arp.length;
      const cn = chord[this.arp[ai] % chord.length] || 0;
      const note = cfg.base + 24 + cn;
      this.playArp(t, note, stepDur * 1.1, v * 0.65);
    }

    this.vinyl(t);
    if (this.onStepChange) this.onStepChange(this.step, this.bar);

    this.nextT += stepDur;
    this.step++;
    if (this.step >= 16) {
      this.step = 0;
      this.bar++;
      if (this.bar % (4 + Math.floor(Math.random() * 6)) === 0) { this.section++; this.shuffle(); }
      this.intensity = 0.5 + Math.sin(this.bar * 0.12) * 0.3 + Math.random() * 0.2;
    }
  }

  private shuffle() {
    const ds = DRUMS[this.genre], bs = BASS[this.genre], ps = PROGRESSIONS[this.genre], ss = SCALES[this.genre];
    const d = ds[Math.floor(Math.random() * ds.length)];
    this.drums = { kick: parse(d.kick), snare: parse(d.snare), hihat: parse(d.hihat), perc: parse(d.perc) };
    this.bass = parse(bs[Math.floor(Math.random() * bs.length)]);
    this.chords = ps[Math.floor(Math.random() * ps.length)];
    this.arp = ARPS[Math.floor(Math.random() * ARPS.length)];
    this.melody = MELODIES[Math.floor(Math.random() * MELODIES.length)];
    this.scale = ss[Math.floor(Math.random() * ss.length)];
  }

  private scheduler() { if (!this.ctx || !this.playing) return; while (this.nextT < this.ctx.currentTime + 0.12) this.scheduleStep(); }

  setGenre(g: Genre) { const was = this.playing; if (was) this.stop(); this.genre = g; this.tempo = CONFIG[g].tempo.def; this.shuffle(); if (was) this.play(); }
  setTempo(b: number) { const c = CONFIG[this.genre]; this.tempo = Math.max(c.tempo.min, Math.min(c.tempo.max, b)); if (this.delay) this.delay.delayTime.value = 60 / this.tempo * 0.75; }
  getTempo() { return this.tempo; }
  getTempoRange() { const c = CONFIG[this.genre]; return { min: c.tempo.min, max: c.tempo.max, default: c.tempo.def }; }
  getGenre() { return this.genre; }
  isCurrentlyPlaying() { return this.playing; }
  getEffects() { return { ...this.fx }; }
  setEffect(e: keyof EffectsState, v: boolean) {
    this.fx[e] = v; const t = this.ctx?.currentTime || 0;
    if (e === "reverb" && this.reverbGain) this.reverbGain.gain.setValueAtTime(v ? 0.35 : 0, t);
    if (e === "delay" && this.delayGain) this.delayGain.gain.setValueAtTime(v ? 0.25 : 0, t);
    if (e === "filter" && this.filter) this.filter.frequency.setValueAtTime(v ? 2500 : 20000, t);
  }
  toggleEffect(e: keyof EffectsState) { this.setEffect(e, !this.fx[e]); }

  play() {
    this.init(); if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.playing = true; this.step = 0; this.bar = 0; this.shuffle(); this.nextT = this.ctx.currentTime + 0.08;
    this.schedId = window.setInterval(() => this.scheduler(), 20);
  }
  stop() { this.playing = false; if (this.schedId) { clearInterval(this.schedId); this.schedId = null; } this.step = 0; this.bar = 0; }
  dispose() { this.stop(); if (this.ctx) { this.ctx.close(); this.ctx = null; } }
}

export const GENRES: { id: Genre; name: string; description: string }[] = [
  { id: "lofi", name: "Lofi", description: "Chill beats, jazzy chords" },
  { id: "house", name: "House", description: "Classic 4/4, funky grooves" },
  { id: "techno", name: "Techno", description: "Hypnotic, minimal, driving" },
  { id: "dnb", name: "Drum & Bass", description: "Fast breaks, rolling bass" },
  { id: "trap", name: "Trap", description: "Hard 808s, rapid hi-hats" },
  { id: "80s-synth", name: "80s Synth", description: "Retro arps, gated drums" },
  { id: "ambient", name: "Ambient", description: "Atmospheric, dreamy pads" },
];
