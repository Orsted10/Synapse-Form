"use client";

// Singleton AudioContext
let audioCtx: AudioContext | null = null;

// Initialize on first interaction to bypass browser auto-play policies
export const initAudio = () => {
  if (typeof window !== "undefined" && !audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

// Extremely lightweight beep for hovering over elements
export const playHoverSound = () => {
  if (!audioCtx) return;
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch
  oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
  
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.01); // Very quiet
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.05);
};

// Solid mechanical click for selections
export const playClickSound = () => {
  if (!audioCtx) return;
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.type = "square"; // harsher sound
  oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); // Low pitch pop
  oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.1);
};

// A pleasant chime for success/submission
export const playSuccessSound = () => {
  if (!audioCtx) return;

  const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (A Major arpeggio)
  const startTime = audioCtx.currentTime;

  notes.forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime + index * 0.1);
    gain.gain.linearRampToValueAtTime(0.1, startTime + index * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.1 + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime + index * 0.1);
    osc.stop(startTime + index * 0.1 + 0.4);
  });
};
