/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class CinematicSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private noiseSource: AudioWorkletNode | ScriptProcessorNode | null = null;
  private isActive = false;
  private currentVolume = 0.5;

  constructor() {
    // Initializer
  }

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.setupDrone();
    this.setupWind();
    this.isActive = true;
    
    // Ramp volume up slowly
    this.masterGain.gain.linearRampToValueAtTime(this.currentVolume, this.ctx.currentTime + 2.0);
  }

  private setupDrone() {
    if (!this.ctx || !this.masterGain) return;

    // We will create 3 oscillators for a deep minor pad chord
    const freqs = [65.41, 98.00, 130.81]; // C2, G2, C3 (C power chord)
    
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

      // Lowpass filter for smooth analog warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300 + idx * 50, this.ctx!.currentTime);

      // Slow breathing volume modulation using an LFO or slow intervals
      gain.gain.setValueAtTime(0.08, this.ctx!.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();
      this.oscillators.push({ osc, gain });

      // Start beautiful slow LFO volume breathing
      this.modulateGain(gain, 0.04, 0.12, 4 + idx * 2.5);
    });
  }

  private modulateGain(gainNode: GainNode, min: number, max: number, period: number) {
    if (!this.ctx) return;
    let up = true;
    const interval = setInterval(() => {
      if (!this.ctx || this.ctx.state === 'closed' || !this.isActive) {
        clearInterval(interval);
        return;
      }
      try {
        const target = up ? max : min;
        gainNode.gain.linearRampToValueAtTime(target, this.ctx.currentTime + period);
        up = !up;
      } catch (e) {
        clearInterval(interval);
      }
    }, period * 1000);
  }

  private setupWind() {
    if (!this.ctx || !this.masterGain) return;

    // Synthesize wind noise using a white noise generator
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);
    this.windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    whiteNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    whiteNoise.start();

    // Modulate wind frequency randomly to sound like gusts of wind
    this.modulateWind();
  }

  private modulateWind() {
    const run = () => {
      if (!this.ctx || !this.windFilter || !this.windGain || !this.isActive) return;
      try {
        const nextFreq = 300 + Math.random() * 600; // between 300Hz and 900Hz
        const nextGain = 0.01 + Math.random() * 0.04; // volume swell
        const duration = 3 + Math.random() * 5; // 3 to 8 seconds per gust

        this.windFilter.frequency.linearRampToValueAtTime(nextFreq, this.ctx.currentTime + duration);
        this.windGain.gain.linearRampToValueAtTime(nextGain, this.ctx.currentTime + duration);

        setTimeout(run, duration * 1000);
      } catch (e) {
        // Safe catch
      }
    };
    run();
  }

  // Chord presets for different mood/scenes
  public setSceneChord(sceneIndex: number) {
    if (!this.ctx || this.oscillators.length < 3) return;

    // Chords defined by frequencies (Root, Third, Fifth/Octave)
    let freqs = [65.41, 98.00, 130.81]; // default C2, G2, C3

    switch (sceneIndex) {
      case 0: // Scene 1 (Dark alley, mystery): C minor pad
        freqs = [65.41, 77.78, 98.00]; // C2 (65.41), Eb2 (77.78), G2 (98.00)
        break;
      case 1: // Scene 2 (Mother, sad boiling): F minor pad
        freqs = [55.00, 65.41, 82.41]; // A1 (55.00), C2 (65.41), E2 (82.41) -> A minor feel
        break;
      case 2: // Scene 3 (Empty Pot boiling): G minor dark tension
        freqs = [49.00, 58.27, 73.42]; // G1 (49.00), Bb1 (58.27), D2 (73.42)
        break;
      case 3: // Scene 4 (Umar crying): Emotional Eb minor
        freqs = [38.89, 46.25, 58.27]; // Eb1 (38.89), Gb1 (46.25), Bb1 (58.27) - ultra heavy bass
        break;
      case 4: // Scene 5 (Carrying heavy sack): C minor rising tension
        freqs = [65.41, 77.78, 110.00]; // C2, Eb2, A2 (diminished feel)
        break;
      case 5: // Scene 6 (Hopeful sunset dawn): G major or C major bright lift
        freqs = [65.41, 82.41, 98.00]; // C2 (65.41), E2 (82.41), G2 (98.00) - peaceful C Major
        break;
    }

    try {
      const now = this.ctx.currentTime;
      this.oscillators.forEach((oscObj, idx) => {
        if (freqs[idx]) {
          // Slide smoothly to the new note over 2 seconds
          oscObj.osc.frequency.exponentialRampToValueAtTime(freqs[idx], now + 2.0);
        }
      });
    } catch (e) {
      // safe fallback if exponential ramp fails
      this.oscillators.forEach((oscObj, idx) => {
        if (freqs[idx]) {
          oscObj.osc.frequency.setValueAtTime(freqs[idx], this.ctx!.currentTime);
        }
      });
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = vol;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.2);
    }
  }

  public pause() {
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    }
  }

  public resume() {
    if (this.ctx && this.masterGain) {
      this.ctx.resume().then(() => {
        this.masterGain!.gain.linearRampToValueAtTime(this.currentVolume, this.ctx!.currentTime + 0.5);
      });
    }
  }

  public stop() {
    this.isActive = false;
    try {
      if (this.ctx) {
        this.masterGain?.gain.setValueAtTime(0, this.ctx.currentTime);
        this.oscillators.forEach((o) => {
          try { o.osc.stop(); } catch (e) {}
        });
        this.oscillators = [];
        this.ctx.close();
        this.ctx = null;
      }
    } catch (e) {
      this.ctx = null;
    }
  }
}
