// WebAudio adapter: interprets sound-recipes voices. All output runs through
// master gain (capped) -> compressor, so mute is one value and nothing can
// ever spike someone's headphones.
import { RECIPES, SOUND_FOR_EVENT, MASTER_GAIN } from './sound-recipes.js'

export function createSound(rng) {
  const ctx = new AudioContext()
  const master = ctx.createGain()
  master.gain.value = MASTER_GAIN
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -24
  compressor.ratio.value = 8
  master.connect(compressor)
  compressor.connect(ctx.destination)

  // belt-and-suspenders next to the autoplay-policy switch
  if (ctx.state === 'suspended') ctx.resume()
  document.addEventListener('mousedown', () => {
    if (ctx.state === 'suspended') ctx.resume()
  })

  let muted = false
  let noiseBuffer = null

  function getNoise() {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    return noiseBuffer
  }

  function playVoice(v) {
    const t0 = ctx.currentTime + (v.delay ?? 0)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(v.gain, t0 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + v.dur)
    gain.connect(master)

    let source
    if (v.type === 'osc') {
      source = ctx.createOscillator()
      source.type = v.wave
      source.frequency.setValueAtTime(v.freqStart, t0)
      source.frequency.exponentialRampToValueAtTime(Math.max(v.freqEnd, 1), t0 + v.dur)
      source.connect(gain)
    } else {
      source = ctx.createBufferSource()
      source.buffer = getNoise()
      const filter = ctx.createBiquadFilter()
      filter.type = v.filter.type
      filter.frequency.value = v.filter.freq
      source.connect(filter)
      filter.connect(gain)
    }
    source.start(t0)
    source.stop(t0 + v.dur + 0.05)
  }

  return {
    playForEvent(event) {
      if (muted) return
      const recipe = RECIPES[SOUND_FOR_EVENT[event]]
      if (!recipe) return
      recipe(rng).voices.forEach(playVoice)
    },
    setMuted(m) {
      muted = m
      master.gain.value = m ? 0 : MASTER_GAIN
    },
  }
}
