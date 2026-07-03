import { describe, it, expect } from 'vitest';
import { indiceEscenaActiva, añoEnProgreso } from '../src/lib/escenas';

describe('indiceEscenaActiva', () => {
  const tops = [0, 800, 1600, 2400];
  it('al inicio es 0', () => expect(indiceEscenaActiva(tops, 0, 800)).toBe(0));
  it('activa cuando el top cruza el 40% del viewport', () => {
    // escena 1 (top 800): activa cuando scrollY + 0.4*800 >= 800 → scrollY >= 480
    expect(indiceEscenaActiva(tops, 479, 800)).toBe(0);
    expect(indiceEscenaActiva(tops, 480, 800)).toBe(1);
  });
  it('devuelve la última al final', () => expect(indiceEscenaActiva(tops, 99999, 800)).toBe(3));
  it('nunca negativa', () => expect(indiceEscenaActiva(tops, -50, 800)).toBe(0));
});

describe('añoEnProgreso', () => {
  it('extremos', () => {
    expect(añoEnProgreso(1906, 1975, 0)).toBe(1906);
    expect(añoEnProgreso(1906, 1975, 1)).toBe(1975);
  });
  it('interpola y redondea', () => expect(añoEnProgreso(1906, 1975, 0.5)).toBe(1941));
  it('clampa fuera de rango', () => {
    expect(añoEnProgreso(1906, 1975, -1)).toBe(1906);
    expect(añoEnProgreso(1906, 1975, 2)).toBe(1975);
  });
});
