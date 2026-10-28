export type TypingSound = 'key' | 'destroy' | 'damage';

/** Short mechanical foley made from filtered noise and damped resonances. */
export class TypingAudio {
  constructor(private readonly createContext?: () => AudioContext) {}
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices = new Set<AudioScheduledSourceNode>();
  private enabled = true;
  private disposed = false;

  async unlock() {
    if (this.disposed || !this.enabled) return;
    try {
      if (!this.context) {
        const Audio = typeof window === 'undefined' ? undefined : window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const ctx = this.createContext ? this.createContext() : Audio ? new Audio() : null;
        if (!ctx) return;
        this.context = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = .32;
        this.master.connect(ctx.destination);
        this.noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .32), ctx.sampleRate);
        const samples = this.noise.getChannelData(0);
        let seed = 173;
        for (let i = 0; i < samples.length; i++) { seed = (seed * 16807) % 2147483647; samples[i] = (seed / 1073741823.5 - 1); }
      }
      if (this.context.state !== 'running' && this.context.state !== 'closed') await this.context.resume();
    } catch { /* Audio availability must never block the game. */ }
  }
  setEnabled(value: boolean) { this.enabled = value; if (!value) this.silence(); }
  silence() {
    for (const voice of this.voices) { try { voice.stop(); } catch { /* Already ended. */ } }
    this.voices.clear();
  }
  play(cue: TypingSound) {
    const ctx = this.context, master = this.master;
    if (!this.enabled || !ctx || !master || !this.noise || ctx.state !== 'running' || this.voices.size >= 12) return;
    const now = ctx.currentTime;
    const layers: [number, number, number, number, number][] = cue === 'key'
      ? [[1650, 5, .018, .48, 0], [630, 9, .045, .19, .009]]
      : cue === 'destroy'
        ? [[920, 11, .14, .62, 0], [2380, 15, .10, .23, .012], [390, 8, .17, .37, .025]]
        : [[230, 5, .21, .7, 0], [510, 7, .12, .23, .035]];
    for (const [frequency, resonance, duration, volume, delay] of layers) {
      if (this.voices.size >= 12) break;
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = this.noise;
      source.playbackRate.value = cue === 'destroy' ? .78 : 1;
      filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = resonance;
      const at = now + delay;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(volume, at + .002);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      source.connect(filter).connect(gain).connect(master);
      this.voices.add(source);
      source.onended = () => { this.voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(at); source.stop(at + duration + .005);
    }
  }
  dispose() {
    this.disposed = true;
    this.silence();
    void this.context?.close().catch(() => {});
    this.context = null; this.master = null; this.noise = null;
  }
}
