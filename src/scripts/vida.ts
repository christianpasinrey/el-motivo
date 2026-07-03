import { añoEnProgreso } from '../lib/escenas';

export function initVida(): void {
  const linea = document.getElementById('linea-vida')!;
  const marcador = document.getElementById('marcador')!;
  const año = document.getElementById('año-vida')!;
  const main = document.getElementById('experiencia')!;
  const desde = Number(main.dataset.vidaDesde), hasta = Number(main.dataset.vidaHasta);

  addEventListener('scroll', () => {
    const progreso = scrollY / (document.documentElement.scrollHeight - innerHeight);
    const pct = Math.min(1, Math.max(0, progreso)) * 100;
    marcador.style.top = `calc(${pct}% - ${pct * 0.6}px)`;
    año.style.top = marcador.style.top;
    año.textContent = String(añoEnProgreso(desde, hasta, progreso));
  }, { passive: true });
  void linea;
}
