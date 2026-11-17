const prefix = 'assets/minecraft/textures/block/';
const storageKey = 'roofs.vanilla-textures';
const aliases = {
  quartz: 'quartz_block_side',
  smooth_quartz: 'quartz_block_bottom',
  purpur: 'purpur_block',
  sandstone: 'sandstone',
  smooth_sandstone: 'sandstone_top',
  red_sandstone: 'red_sandstone',
  smooth_red_sandstone: 'red_sandstone_top',
  deepslate_tile: 'deepslate_tiles',
};

export function textureName(material) {
  const { id, texture } = material;
  if (aliases[id]) return aliases[id];
  if (texture === 'wood' && id !== 'bamboo_mosaic') return id + '_planks';
  if (id.endsWith('_brick') || id === 'brick') return id + 's';
  return id.replace(/^waxed_/, '');
}

function readDirectory(bytes) {
  const view = new DataView(bytes);
  const decoder = new TextDecoder();
  const entries = new Map();
  let end = view.byteLength - 22;
  const floor = Math.max(0, end - 65535);
  while (end >= floor && (view.getUint32(end, true) !== 0x06054b50 ||
    end + 22 + view.getUint16(end + 20, true) !== view.byteLength)) end--;
  if (end < floor) throw new Error('Archive ZIP invalide.');
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('Archive ZIP invalide.');
    const length = view.getUint16(offset + 28, true);
    const path = decoder.decode(new Uint8Array(bytes, offset + 46, length));
    if (path.startsWith(prefix)) {
      entries.set(path, {
        method: view.getUint16(offset + 10, true),
        compressed: view.getUint32(offset + 20, true),
        size: view.getUint32(offset + 24, true),
        start: view.getUint32(offset + 42, true),
      });
    }
    offset += 46 + length + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  return { entries, view };
}

async function extractImage(view, entry) {
  const { start, compressed, size, method } = entry;
  if (size < 24 || size > 32 * 1024 || compressed > 64 * 1024 || ![0, 8].includes(method)) return null;
  if (view.getUint32(start, true) !== 0x04034b50) return null;
  const offset = start + 30 + view.getUint16(start + 26, true) + view.getUint16(start + 28, true);
  const bytes = new Uint8Array(view.buffer, offset, compressed);
  const raw = method === 0 ? bytes : await inflate(bytes, size);
  if (!raw || raw.length !== size || raw[0] !== 137 || raw[1] !== 80 || raw[2] !== 78 || raw[3] !== 71) return null;
  const image = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  if (image.getUint32(16) > 256 || image.getUint32(20) > 4096) return null;
  return 'data:image/png;base64,' + btoa(String.fromCharCode(...raw));
}

async function inflate(bytes, size) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const result = new Uint8Array(size);
  let offset = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return offset === size ? result : null;
    if (offset + value.length > size) {
      await reader.cancel();
      return null;
    }
    result.set(value, offset);
    offset += value.length;
  }
}

export function readLocalTextures() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey)) || {};
    return Object.fromEntries(Object.entries(saved).filter(([, value]) =>
      typeof value === 'string' && /^data:image\/png;base64,[a-z0-9+/=]+$/i.test(value)));
  } catch {
    return {};
  }
}

export async function importLocalTextures(file, names) {
  if (file.size > 160 * 1024 * 1024) throw new Error('L’archive dépasse 160 Mio.');
  const { entries, view } = readDirectory(await file.arrayBuffer());
  const textures = {};
  for (const name of new Set([...names, 'crafting_table_front'])) {
    const entry = entries.get(prefix + name + '.png');
    if (!entry) continue;
    const url = await extractImage(view, entry);
    if (url) textures[name] = url;
  }
  if (!Object.keys(textures).length) throw new Error('Aucune texture compatible trouvée.');
  try { localStorage.setItem(storageKey, JSON.stringify(textures)); } catch {}
  return textures;
}
