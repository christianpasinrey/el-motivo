// Uso: node scripts/fetch-imagenes.mjs <slug>
// Lee src/content/obras/<slug>/imagenes.json, descarga de Wikimedia Commons
// a src/assets/obras/<slug>/ y muestra el crédito de cada imagen.
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const slug = process.argv[2];
if (!slug) { console.error('Uso: node scripts/fetch-imagenes.mjs <slug>'); process.exit(1); }
const manifest = JSON.parse(readFileSync(join('src/content/obras', slug, 'imagenes.json'), 'utf8'));
const destino = join('src/assets/obras', slug);
mkdirSync(destino, { recursive: true });

const API = 'https://commons.wikimedia.org/w/api.php';
let fallos = 0;
for (const { archivo, commons } of manifest) {
  const ruta = join(destino, archivo);
  if (existsSync(ruta)) { console.log(`= ${archivo} ya existe, se reutiliza`); continue; }
  const url = `${API}?action=query&titles=${encodeURIComponent(commons)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1920&format=json&origin=*`;
  const res = await fetch(url, { headers: { 'User-Agent': 'ElMotivo/1.0 (sitio educativo)' } });
  const paginas = Object.values((await res.json()).query.pages);
  const info = paginas[0]?.imageinfo?.[0];
  if (!info) { console.error(`✗ ${archivo}: no encontrado "${commons}"`); fallos++; continue; }
  const img = await fetch(info.thumburl ?? info.url, { headers: { 'User-Agent': 'ElMotivo/1.0' } });
  writeFileSync(ruta, Buffer.from(await img.arrayBuffer()));
  const meta = info.extmetadata ?? {};
  const artista = (meta.Artist?.value ?? 'Desconocido').replace(/<[^>]+>/g, '');
  const licencia = meta.LicenseShortName?.value ?? '';
  console.log(`✓ ${archivo} — crédito: "${artista} — ${licencia}, vía Wikimedia Commons"`);
}
process.exit(fallos ? 1 : 0);
