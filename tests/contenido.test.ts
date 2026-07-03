import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/content/obras';
const slugs = readdirSync(DIR);
const obras = slugs.map((s) => ({
  slug: s,
  data: JSON.parse(readFileSync(join(DIR, s, 'obra.json'), 'utf8')),
}));

describe('contenido de obras', () => {
  it.each(obras)('$slug: sin marcas RELLENAR', ({ data }) => {
    expect(JSON.stringify(data)).not.toMatch(/RELLENAR/);
  });
  it.each(obras)('$slug: carpeta coincide con slug', ({ slug, data }) => {
    expect(data.slug).toBe(slug);
  });
  it.each(obras)('$slug: imágenes referenciadas existen', ({ slug, data }) => {
    const refs = [data.cartel, ...data.escenas.flatMap((e: any) => [e.fondo.src, e.fondo.fondoMovil].filter(Boolean))];
    for (const f of refs) expect(existsSync(join('src/assets/obras', slug, f)), `${slug}/${f}`).toBe(true);
  });
  it.each(obras)('$slug: cierre.siguiente apunta a una obra existente', ({ data }) => {
    expect(slugs).toContain(data.cierre.siguiente);
  });
  it.each(obras)('$slug: toda escena escucha tiene timestamp > 0', ({ data }) => {
    for (const e of data.escenas.filter((e: any) => e.tipo === 'escucha')) expect(e.timestamp).toBeGreaterThan(0);
  });
});
