type Eventos = {
  'experiencia:entrar': void;
  'escena:cambio': { indice: number };
  'player:seek': { segundos: number };
  'player:estado': { sonando: boolean };
  'cine:cambio': { activo: boolean };
};

export function emitir<K extends keyof Eventos>(tipo: K, detalle?: Eventos[K]): void {
  document.dispatchEvent(new CustomEvent(tipo, { detail: detalle }));
}

export function escuchar<K extends keyof Eventos>(tipo: K, cb: (detalle: Eventos[K]) => void): () => void {
  const h = (e: Event) => cb((e as CustomEvent).detail);
  document.addEventListener(tipo, h);
  return () => document.removeEventListener(tipo, h);
}
