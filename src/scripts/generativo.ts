import { escuchar } from '../lib/bus';

export function initGenerativo(): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pocaMemoria = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4;
  if (reduce || pocaMemoria) { document.body.classList.add('grano-estatico'); return; }

  const canvas = document.getElementById('lienzo-generativo') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const acento = (document.getElementById('experiencia')!.dataset.acento ?? '#f2ede4') + '18';

  function tamano() { canvas.width = innerWidth; canvas.height = innerHeight; }
  tamano(); addEventListener('resize', tamano);

  const TILE = 256;
  const tiles = Array.from({ length: 4 }, () => {
    const t = document.createElement('canvas'); t.width = t.height = TILE;
    const tc = t.getContext('2d')!;
    const d = tc.createImageData(TILE, TILE);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 14;
    }
    tc.putImageData(d, 0, 0);
    return t;
  });

  const motas = Array.from({ length: 36 }, () => ({
    x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8,
    vx: (Math.random() - 0.5) * 0.00012, vy: -0.00004 - Math.random() * 0.00012,
  }));

  let frame = 0, ultimo = 0;
  function pintar(t: number) {
    requestAnimationFrame(pintar);
    if (document.hidden || t - ultimo < 1000 / 24) return;
    ultimo = t;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tile = tiles[Math.floor(frame++ / 2) % 4];
    for (let x = 0; x < canvas.width; x += TILE) for (let y = 0; y < canvas.height; y += TILE) ctx.drawImage(tile, x, y);
    ctx.fillStyle = acento;
    for (const m of motas) {
      m.x = (m.x + m.vx + 1) % 1; m.y = (m.y + m.vy + 1) % 1;
      ctx.beginPath(); ctx.arc(m.x * canvas.width, m.y * canvas.height, m.r, 0, 7); ctx.fill();
    }
    const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.42, canvas.width / 2, canvas.height / 2, canvas.height * 0.95);
    g.addColorStop(0, 'transparent'); g.addColorStop(1, '#0a0a0aa8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  escuchar('experiencia:entrar', () => requestAnimationFrame(pintar));
}
