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
const ESPERAS_REINTENTO = [5000, 15000, 30000]; // 5s / 15s / 30s
const ESPERA_CORTESIA = 1000; // ~1s entre descargas para no gatillar 429

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Valida que los bytes sean realmente una imagen (JPEG/PNG/WebP), no una
// página de error HTML devuelta por un rate-limit de Wikimedia.
function esImagenValida(buffer) {
  if (buffer.length < 12) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true; // JPEG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true; // PNG
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true; // WebP (RIFF....WEBP)
  return false;
}

// Descarga la imagen con reintentos y backoff si la respuesta no es OK o
// los bytes no son una imagen válida (posible página de error por rate-limit).
async function descargarImagen(url) {
  for (let intento = 0; intento <= ESPERAS_REINTENTO.length; intento++) {
    const img = await fetch(url, { headers: { 'User-Agent': 'ElMotivo/1.0' } });
    if (img.ok) {
      const buffer = Buffer.from(await img.arrayBuffer());
      if (esImagenValida(buffer)) return buffer;
    }
    if (intento < ESPERAS_REINTENTO.length) await esperar(ESPERAS_REINTENTO[intento]);
  }
  return null;
}

let fallos = 0;
for (const { archivo, commons } of manifest) {
  const ruta = join(destino, archivo);
  if (existsSync(ruta)) { console.log(`= ${archivo} ya existe, se reutiliza`); continue; }
  const url = `${API}?action=query&titles=${encodeURIComponent(commons)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1920&format=json&origin=*`;
  const res = await fetch(url, { headers: { 'User-Agent': 'ElMotivo/1.0 (sitio educativo)' } });
  const paginas = Object.values((await res.json()).query.pages);
  const info = paginas[0]?.imageinfo?.[0];
  if (!info) { console.error(`✗ ${archivo}: no encontrado "${commons}"`); fallos++; continue; }
  const buffer = await descargarImagen(info.thumburl ?? info.url);
  if (!buffer) {
    console.error(`✗ ${archivo}: respuesta no es imagen (posible rate-limit)`);
    fallos++;
    await esperar(ESPERA_CORTESIA);
    continue;
  }
  writeFileSync(ruta, buffer);
  const meta = info.extmetadata ?? {};
  const artista = (meta.Artist?.value ?? 'Desconocido').replace(/<[^>]+>/g, '');
  const licencia = meta.LicenseShortName?.value ?? '';
  console.log(`✓ ${archivo} — crédito: "${artista} — ${licencia}, vía Wikimedia Commons"`);
  await esperar(ESPERA_CORTESIA);
}
process.exit(fallos ? 1 : 0);
