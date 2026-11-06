// Interactive dot grid behind the page: dots move away from the pointer,
// a click sends an expanding wave (with a subtle sound), and holding the button gathers nearby dots.
// Inspired by the hero background of premiostech.la; vanilla canvas 2D, no deps.

const GRID = 28; // px between dots
const BASE_RADIUS = 1.6;
const BASE_ALPHA = 0.5;

const REPULSION = { radius: 170, strength: 36 };
const WAVE = { speed: 1100, width: 110, strength: 22, swell: 0.9, glow: 0.55, life: 1.6, max: 3 };
const GATHER = { radius: 170, strength: 20, chargeTime: 0.9 };
const SPRING = 0.14; // how fast a dot follows its target offset

// Gradient across the viewport, using the site palette (primary, accent, accent-light).
const PALETTE: [number, number, number][] = [
  [139, 92, 246],
  [219, 39, 168],
  [28, 166, 191],
];

// Subtle "bloop" played with the click wave: a short sine that drops in pitch.
const SOUND = { volume: 0.05, attack: 0.008, decay: 0.32, startHz: 520, endHz: 260 };
// Clicks on controls keep their own meaning and stay silent.
const SILENT_TARGETS = 'a, button, input, textarea, select, summary, label, [role="button"]';

let audio: AudioContext | null = null;

function playWaveSound(power: number) {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    audio ??= new Ctx();
    if (audio.state === 'suspended') void audio.resume();
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    // A stronger (held) wave sounds a little deeper and slightly louder.
    const pitch = 1 / (1 + (power - 1) * 0.35);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(SOUND.startHz * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(SOUND.endHz * pitch, now + SOUND.decay);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(SOUND.volume * Math.min(power, 1.5), now + SOUND.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + SOUND.decay);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + SOUND.decay + 0.02);
  } catch {
    // Audio is decorative; never let it break the interaction.
  }
}

type Dot = { x: number; y: number; ox: number; oy: number; color: string };
type Wave = { x: number; y: number; t: number; power: number };

export function initDotField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const interactive = !reducedMotion && finePointer;

  let dots: Dot[] = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  const pointer = { x: -9999, y: -9999, active: false };
  let press: { x: number; y: number; start: number } | null = null;
  const waves: Wave[] = [];
  let frame = 0;
  let last = 0;

  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  function colorAt(x: number, y: number) {
    const t = Math.min(1, Math.max(0, (x / width) * 0.6 + (y / height) * 0.4));
    const rgb = t < 0.5 ? mix(PALETTE[0], PALETTE[1], t * 2) : mix(PALETTE[1], PALETTE[2], (t - 0.5) * 2);
    return `${rgb[0]},${rgb[1]},${rgb[2]}`;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    const offX = (width % GRID) / 2;
    const offY = (height % GRID) / 2;
    for (let y = offY; y <= height; y += GRID) {
      for (let x = offX; x <= width; x += GRID) {
        dots.push({ x, y, ox: 0, oy: 0, color: colorAt(x, y) });
      }
    }
    draw(performance.now(), false);
  }

  // Returns true while something is still moving, so the loop can sleep when idle.
  function draw(now: number, animate: boolean) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    for (const w of waves) w.t += dt;
    while (waves.length && waves[0].t > WAVE.life) waves.shift();

    const charge = press ? Math.min(1, (now - press.start) / 1000 / GATHER.chargeTime) : 0;
    ctx!.clearRect(0, 0, width, height);
    let moving = waves.length > 0 || press !== null;

    for (const d of dots) {
      let tx = 0;
      let ty = 0;
      let swell = 0;
      let glow = 0;

      if (animate && pointer.active) {
        const dx = d.x - pointer.x;
        const dy = d.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < REPULSION.radius && dist > 0.01) {
          const f = 1 - dist / REPULSION.radius;
          const push = press ? -GATHER.strength * charge : REPULSION.strength;
          const reach = press ? Math.max(f, 1 - dist / GATHER.radius) : f;
          tx += (dx / dist) * push * reach * reach;
          ty += (dy / dist) * push * reach * reach;
          glow += f * 0.6;
          swell += f * 0.6;
          if (press) {
            tx += (Math.random() - 0.5) * 1.4 * charge;
            ty += (Math.random() - 0.5) * 1.4 * charge;
          }
        }
      }

      for (const w of waves) {
        const dx = d.x - w.x;
        const dy = d.y - w.y;
        const dist = Math.hypot(dx, dy);
        const front = w.t * WAVE.speed;
        const band = Math.abs(dist - front);
        if (band < WAVE.width && dist > 0.01) {
          const crest = Math.cos((band / WAVE.width) * (Math.PI / 2));
          const fade = Math.pow(1 - w.t / WAVE.life, 1.3) * w.power;
          tx += (dx / dist) * WAVE.strength * crest * fade;
          ty += (dy / dist) * WAVE.strength * crest * fade;
          swell += WAVE.swell * crest * fade;
          glow += WAVE.glow * crest * fade;
        }
      }

      d.ox += (tx - d.ox) * SPRING;
      d.oy += (ty - d.oy) * SPRING;
      if (Math.abs(d.ox - tx) > 0.05 || Math.abs(d.oy - ty) > 0.05) moving = true;

      const alpha = Math.min(1, BASE_ALPHA + glow);
      ctx!.fillStyle = `rgba(${d.color},${alpha})`;
      ctx!.beginPath();
      ctx!.arc(d.x + d.ox, d.y + d.oy, BASE_RADIUS * (1 + swell), 0, Math.PI * 2);
      ctx!.fill();
    }
    return moving;
  }

  function loop(now: number) {
    const moving = draw(now, true);
    // Sleep as soon as every dot has settled; pointermove/pointerdown wake the loop again.
    frame = moving ? requestAnimationFrame(loop) : 0;
    if (!frame) last = 0;
  }

  function wake() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(loop);
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  });
  resize();
  canvas.classList.add('is-ready');

  if (!interactive) return;

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    wake();
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    pointer.active = false;
    press = null;
  });

  window.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    press = { x: e.clientX, y: e.clientY, start: performance.now() };
    wake();
  });

  window.addEventListener('pointerup', (e) => {
    if (!press) return;
    const held = Math.min(1, (performance.now() - press.start) / 1000 / GATHER.chargeTime);
    if (waves.length >= WAVE.max) waves.shift();
    const power = 1 + held * 0.8;
    waves.push({ x: e.clientX, y: e.clientY, t: 0, power });
    if (!(e.target instanceof Element && e.target.closest(SILENT_TARGETS))) playWaveSound(power);
    press = null;
    wake();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    } else {
      wake();
    }
  });
}
