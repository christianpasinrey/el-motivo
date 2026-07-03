import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { emitir } from '../lib/bus';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const KENBURNS: Record<string, gsap.TweenVars> = {
  'zoom-in': { scale: 1.05 }, 'zoom-out': { scale: 1 },
  'pan-izq': { xPercent: -2.5, scale: 1.04 }, 'pan-der': { xPercent: 2.5, scale: 1.04 },
};

export function initDirector(): void {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const escenas = [...document.querySelectorAll<HTMLElement>('.escena')];
  const rito = document.getElementById('rito')!;
  const botonCine = document.getElementById('boton-cine')!;
  let cine = false;
  let tweenCine: gsap.core.Tween | null = null;
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  document.getElementById('entrar')!.addEventListener('click', () => {
    emitir('experiencia:entrar');
    gsap.to(rito, { autoAlpha: 0, duration: 1.2, onComplete: () => (rito.style.display = 'none') });
    for (const id of ['lienzo-generativo', 'linea-vida', 'vinilo']) document.getElementById(id)!.style.display = 'block';
    botonCine.hidden = false;
    gsap.to(window, { scrollTo: escenas[0], duration: 1.6, ease: 'power2.inOut' });
  });

  for (const [i, escena] of escenas.entries()) {
    const fondo = escena.querySelector<HTMLElement>('.fondo')!;
    const contenido = escena.querySelector<HTMLElement>('.contenido')!;
    ScrollTrigger.create({
      trigger: escena, start: 'top 60%', end: 'bottom 40%',
      onEnter: () => emitir('escena:cambio', { indice: i }),
      onEnterBack: () => emitir('escena:cambio', { indice: i }),
    });
    if (!reduceMotion) {
      gsap.fromTo(fondo, { autoAlpha: 0.15 }, {
        autoAlpha: 1, duration: 1.6, ease: 'none',
        scrollTrigger: { trigger: escena, start: 'top 85%', end: 'top 35%', scrub: true },
      });
      gsap.to(fondo.querySelector('img'), {
        ...KENBURNS[escena.dataset.kenburns ?? 'zoom-in'], duration: 20, ease: 'none',
        scrollTrigger: { trigger: escena, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.from(contenido, {
        autoAlpha: 0, y: 20, duration: 1.4, ease: 'power2.out',
        scrollTrigger: { trigger: escena, start: 'top 62%' },
      });
    }
  }

  document.querySelectorAll<HTMLButtonElement>('.momento').forEach((b) =>
    b.addEventListener('click', () => emitir('player:seek', { segundos: Number(b.dataset.segundos) })),
  );

  function pararCine() {
    if (!cine) return;
    cine = false;
    tweenCine?.kill(); if (temporizador) clearTimeout(temporizador);
    document.body.classList.remove('modo-cine');
    botonCine.textContent = 'Modo cine';
    emitir('cine:cambio', { activo: false });
  }
  function avanzar(i: number) {
    if (!cine || i >= escenas.length) return pararCine();
    tweenCine = gsap.to(window, {
      scrollTo: escenas[i], duration: 1.8, ease: 'power2.inOut',
      onComplete: () => { temporizador = setTimeout(() => avanzar(i + 1), Number(escenas[i].dataset.duracionCine) * 1000); },
    });
  }
  botonCine.addEventListener('click', () => {
    if (cine || reduceMotion) return pararCine();
    cine = true;
    document.body.classList.add('modo-cine');
    botonCine.textContent = 'Salir';
    emitir('cine:cambio', { activo: true });
    avanzar(0);
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && pararCine());
  addEventListener('wheel', pararCine, { passive: true });
  addEventListener('touchmove', pararCine, { passive: true });
}
