/**
 * A soft paper rustle, synthesised with Web Audio (no audio file to download).
 * Off by default; the guest can switch it on from the ribbon menu.
 */
let ctx = null;

export function playPageTurn() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();

    const dur = 0.45;
    const rate = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.floor(rate * dur), rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      // Quick swell, long tail, with grainy flutter like paper fibres.
      const env = Math.sin(Math.PI * Math.min(1, t * 1.8)) * (1 - t) ** 1.4;
      const flutter = 0.55 + 0.45 * Math.random();
      data[i] = (Math.random() * 2 - 1) * env * flutter;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.6;
    band.frequency.setValueAtTime(1100, ctx.currentTime);
    band.frequency.exponentialRampToValueAtTime(3600, ctx.currentTime + dur);
    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.value = 0.16;

    src.connect(band).connect(high).connect(gain).connect(ctx.destination);
    src.start();
  } catch {
    /* audio is a nicety; ignore failures */
  }
}
