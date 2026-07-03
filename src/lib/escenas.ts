export function indiceEscenaActiva(topsPx: number[], scrollY: number, altoViewport: number): number {
  const linea = scrollY + altoViewport * 0.4;
  let indice = 0;
  for (let i = 0; i < topsPx.length; i++) if (topsPx[i] <= linea) indice = i;
  return indice;
}

export function añoEnProgreso(desde: number, hasta: number, progreso01: number): number {
  const p = Math.min(1, Math.max(0, progreso01));
  return Math.round(desde + (hasta - desde) * p);
}
