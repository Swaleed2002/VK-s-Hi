// Call audio generator using Web Audio API (zero external asset dependencies)

class CallSoundPlayer {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private isPlaying = false;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playIncoming() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    try {
      const ctx = this.getContext();
      const playBurst = () => {
        if (!this.isPlaying) return;
        try {
          const now = ctx.currentTime;
          // Standard ring: 2 tones (440Hz and 480Hz)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.setValueAtTime(0.2, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.3);
          osc2.stop(now + 1.3);
        } catch (e) {
          console.warn("Audio burst error:", e);
        }
      };

      playBurst();
      this.intervalId = setInterval(playBurst, 3000);
    } catch (e) {
      console.warn("Could not play ringtone:", e);
    }
  }

  playOutgoing() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    try {
      const ctx = this.getContext();
      const playTone = () => {
        if (!this.isPlaying) return;
        try {
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0.1, now);
          gain.gain.setValueAtTime(0.1, now + 1.5);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.6);
          osc2.stop(now + 1.6);
        } catch (e) {
          console.warn("Outgoing tone error:", e);
        }
      };

      playTone();
      this.intervalId = setInterval(playTone, 4000);
    } catch (e) {
      console.warn("Could not play ringback tone:", e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close().catch(() => {});
      } catch (e) {}
      this.ctx = null;
    }
  }
}

export const callSounds = new CallSoundPlayer();
