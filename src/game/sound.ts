// === 1. Import 영역 ===

// === 2. 타입 및 상수 영역 ===
export type SoundCue = 'click' | 'send' | 'capture' | 'victory' | 'defeat'

const SOUND_CUES: Record<SoundCue, { frequency: number; duration: number }> = {
  click: { frequency: 520, duration: 0.045 },
  send: { frequency: 340, duration: 0.08 },
  capture: { frequency: 740, duration: 0.16 },
  victory: { frequency: 880, duration: 0.28 },
  defeat: { frequency: 220, duration: 0.28 },
}

let audioContext: AudioContext | null = null

// === 3. 효과음 유틸리티 ===
/**
 * Plays a short synthesized interface or battle cue when sound is enabled.
 */
export function playSoundEffect(isEnabled: boolean, cue: SoundCue): void {
  if (!isEnabled || typeof window.AudioContext === 'undefined') return

  audioContext ??= new window.AudioContext()
  if (audioContext.state === 'suspended') {
    void audioContext.resume().catch((error: unknown) => {
      console.error('Unable to resume DotWar audio.', error)
    })
  }

  const { frequency, duration } = SOUND_CUES[cue]
  const oscillator = audioContext.createOscillator()
  const volume = audioContext.createGain()
  const startAt = audioContext.currentTime

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, startAt)
  volume.gain.setValueAtTime(0.0001, startAt)
  volume.gain.exponentialRampToValueAtTime(0.035, startAt + 0.01)
  volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  oscillator.connect(volume)
  volume.connect(audioContext.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + duration)
}
