import { generateRoof, roofShapes } from './roof.mjs';
import { materialGroups, materials } from './materials.mjs';
import { setupAppearance } from './appearance.mjs?v=seasons';
import { setupMenuSound } from './menu-sound.mjs?v=seasons';
import { importLocalTextures, readLocalTextures, textureName } from './vanilla-textures.mjs?v=seasons';

const form = document.querySelector('#settings');
const canvas = document.querySelector('#profile');
const exportDialog = document.querySelector('#export-dialog');
const exportForm = document.querySelector('#export-form');
const exportCanvas = document.querySelector('#export-preview');
const exportName = document.querySelector('#roof-name');
const exportColor = document.querySelector('#export-color');
const confirmExport = document.querySelector('#confirm-export');
const shapePicker = document.querySelector('#shapes');
const downloadButton = document.querySelector('#download');
const exportStatus = document.querySelector('#export-status');
const widthInput = document.querySelector('#width');
const heightInput = document.querySelector('#height');
let profile;

const settingsPanel = document.querySelector('#settings-panel');
const openSettings = document.querySelector('#open-settings');
const picker = document.querySelector('#material-picker');
const chooseMaterial = document.querySelector('#choose-material');
const materialSearch = document.querySelector('#material-search');
const materialList = document.querySelector('#material-list');
const ridgeInput = document.querySelector('#double-ridge');
const mobileLayout = matchMedia('(max-width: 760px), (orientation: landscape) and (max-height: 500px)');
const defaultMaterial = materials.get('oak');
let material = defaultMaterial;

function createTexture({ color, texture }) {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 16;
  const paint = tile.getContext('2d');
  paint.fillStyle = color;
  paint.fillRect(0, 0, 16, 16);

  const rows = texture === 'brick' ? 4 : texture === 'wood' ? 3 : 0;
  paint.fillStyle = '#13131447';
  for (let row = 1; row <= rows; row += 1) {
    paint.fillRect(0, row * 4 - 1, 16, 1);
    paint.fillRect(row % 2 ? 11 : 4, row * 4 - 4, 1, 3);
  }
  if (texture === 'tile') {
    paint.fillRect(15, 0, 1, 16);
    paint.fillRect(0, 15, 16, 1);
    paint.fillStyle = '#fff5da30';
    paint.fillRect(0, 0, 15, 1);
    paint.fillRect(0, 1, 1, 14);
  }

  const flecks = texture === 'wool' ? 56 : texture === 'concrete' ? 14 : 38;
  for (let i = 0; i < flecks; i += 1) {
    paint.fillStyle = i % 2 ? '#fff3da26' : '#12121933';
    paint.fillRect((i * 37 + Math.floor(i / 8)) % 16, (i * 23 + Math.floor(i / 5)) % 16, texture === 'wood' ? 3 : 1, 1);
  }
  return tile;
}

const tileUrls = new Map([...materials].map(([id, entry]) => [id, createTexture(entry).toDataURL()]));
let vanillaTextures = readLocalTextures();
const favicon = document.querySelector('link[rel=icon]');

function updateFavicon() {
  favicon.type = vanillaTextures.crafting_table_front ? 'image/png' : 'image/svg+xml';
  favicon.href = vanillaTextures.crafting_table_front || './crafting-table.svg';
}

updateFavicon();

function applySwatch(element, material) {
  element.style.setProperty('--swatch-color', material.color);
  element.style.setProperty('--swatch-texture', `url("${vanillaTextures[textureName(material)] || tileUrls.get(material.id)}")`);
}

function normalizeSearch(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

const sections = materialGroups.map((group) => {
  const section = document.createElement('section');
  section.className = 'material-group';
  const heading = document.createElement('h3');
  heading.textContent = group.label;
  const swatches = document.createElement('div');
  swatches.className = 'swatches';
  const options = group.materials.map((entry) => {
    const button = document.createElement('button');
    button.className = 'swatch-option';
    button.type = 'button';
    button.dataset.material = entry.id;
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.setAttribute('aria-hidden', 'true');
    applySwatch(swatch, entry);
    button.append(swatch, entry.name);
    swatches.append(button);
    return { button, searchable: normalizeSearch(`${entry.name} ${group.label} ${entry.id.replaceAll('_', ' ')}`) };
  });
  section.append(heading, swatches);
  materialList.append(section);
  return { section, options };
});
const noMaterials = document.createElement('p');
noMaterials.className = 'no-materials';
noMaterials.textContent = 'Aucun matériau trouvé.';
noMaterials.setAttribute('role', 'status');
materialList.append(noMaterials);

function filterMaterials() {
  const words = normalizeSearch(materialSearch.value).split(/\s+/);
  let total = 0;
  for (const { section, options } of sections) {
    let groupCount = 0;
    for (const { button, searchable } of options) {
      button.hidden = !words.every((word) => searchable.includes(word));
      button.setAttribute('aria-pressed', String(button.dataset.material === material.id));
      if (!button.hidden) groupCount += 1;
    }
    section.hidden = groupCount === 0;
    total += groupCount;
  }
  noMaterials.hidden = total > 0;
  document.querySelector('#material-total').textContent = `${total} matériau${total === 1 ? '' : 'x'}`;
  materialList.scrollTop = 0;
}

openSettings.addEventListener('click', () => settingsPanel.showModal());
document.querySelector('#close-settings').addEventListener('click', () => settingsPanel.close());
mobileLayout.addEventListener('change', ({ matches }) => {
  if (!matches && settingsPanel.open) settingsPanel.close();
});

chooseMaterial.addEventListener('click', () => {
  materialSearch.value = '';
  filterMaterials();
  picker.showModal();
  document.querySelector('#close-picker').focus();
});
document.querySelector('#close-picker').addEventListener('click', () => picker.close());
materialSearch.addEventListener('input', filterMaterials);
materialList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-material]');
  if (!button) return;
  material = materials.get(button.dataset.material);
  update();
  picker.close();
});

for (const modal of [settingsPanel, picker, exportDialog]) {
  modal.addEventListener('click', (event) => {
    if (event.target !== modal || !modal.open) return;
    const bounds = modal.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      modal.close();
    }
  });
}


for (const [id, shape] of Object.entries(roofShapes)) {
  const option = document.createElement('label');
  option.className = 'shape';
  option.innerHTML = `
    <input class="sr-only" type="radio" name="shape" value="${id}" ${id === 'bell' ? 'checked' : ''}>
    <span>
      <svg viewBox="0 3 26 22" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><path d="${shape.icon}"/></svg>
      ${shape.label}
    </span>`;
  shapePicker.append(option);
}

function drawPiece(context, piece, x, y, size) {
  const half = size / 2;
  const { kind, direction } = piece;

  context.save();
  context.translate(x, y);
  if (direction === -1) {
    context.translate(size, 0);
    context.scale(-1, 1);
  }

  context.beginPath();
  if (kind === 'stair') {
    context.moveTo(0, half);
    context.lineTo(half, half);
    context.lineTo(half, 0);
    context.lineTo(size, 0);
    context.lineTo(size, size);
    context.lineTo(0, size);
    context.closePath();
  } else {
    const top = kind === 'slab' ? half : 0;
    context.rect(0, top, size, size - top);
  }
  context.fillStyle = material.color;
  context.fill();
  context.strokeStyle = '#293341';
  context.lineWidth = Math.max(1, size / 24);
  context.stroke();
  context.restore();
}

function drawProfile(context, viewportWidth, viewportHeight, {
  background = '#bfd9ed', ink = '#344e65', grid = '#8eafc7', axis = '#58728b', maxCell = 44,
} = {}) {
  const { width, height, showGrid, pieces } = profile;
  const bounds = { left: 36, right: 16, top: 23, bottom: 39 };
  const size = Math.min(maxCell, (viewportWidth - bounds.left - bounds.right) / width, (viewportHeight - bounds.top - bounds.bottom) / height);
  const gridWidth = width * size;
  const gridHeight = height * size;
  const left = Math.round((viewportWidth - gridWidth + bounds.left - bounds.right) / 2);
  const base = Math.round((viewportHeight + gridHeight + bounds.top - bounds.bottom) / 2);
  const top = base - gridHeight;

  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, viewportWidth, viewportHeight);
  }

  if (showGrid) {
    context.beginPath();
    for (let column = 0; column <= width; column += 1) {
      const x = left + column * size;
      context.moveTo(x, top);
      context.lineTo(x, base);
    }
    for (let row = 0; row <= height; row += 1) {
      const y = base - row * size;
      context.moveTo(left, y);
      context.lineTo(left + gridWidth, y);
    }
    context.strokeStyle = grid;
    context.lineWidth = 1;
    context.stroke();

    context.beginPath();
    context.setLineDash([3, 4]);
    context.moveTo(left + gridWidth / 2, top - 10);
    context.lineTo(left + gridWidth / 2, base);
    context.strokeStyle = axis;
    context.stroke();
    context.setLineDash([]);
  }

  for (const piece of pieces) {
    drawPiece(context, piece, left + piece.x * size, base - (piece.y + 1) * size, size);
  }

  context.strokeStyle = axis;
  context.beginPath();
  context.moveTo(left, base + 1);
  context.lineTo(left + gridWidth, base + 1);
  context.stroke();

  context.fillStyle = ink;
  context.font = '12px Monocraft, monospace';
  context.textBaseline = 'middle';
  context.textAlign = 'right';
  const rowInterval = Math.max(1, Math.ceil(22 / size));
  for (let row = 0; row <= height; row += 1) {
    if (row === height || (row % rowInterval === 0 && height - row >= rowInterval)) {
      context.fillText(String(row), left - 9, base - row * size);
    }
  }

  context.textAlign = 'center';
  const columnInterval = Math.max(1, Math.ceil(25 / size));
  for (let column = 1; column <= width; column += 1) {
    if (column === width || ((column - 1) % columnInterval === 0 && width - column >= columnInterval)) {
      context.fillText(String(column), left + (column - .5) * size, base + 15);
    }
  }
}

function resizeCanvas() {
  const { width, height } = canvas.getBoundingClientRect();
  if (!profile || width < 60 || height < 70) return;
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  context.setTransform(scale, 0, 0, scale, 0, 0);
  const night = document.documentElement.dataset.time === 'night';
  const contrast = night ? { ink: '#dbe8ff', grid: '#90aac466', axis: '#b5c6e2' } : {};
  drawProfile(context, width, height, { ...contrast, background: null });
}

function update() {
  const doubleRidge = ridgeInput.checked;
  const min = doubleRidge ? 6 : 5;
  if (Number(widthInput.min) !== min) {
    const width = widthInput.valueAsNumber + (doubleRidge ? 1 : -1);
    widthInput.min = min;
    widthInput.max = min + 44;
    widthInput.value = width;
  }

  const width = widthInput.valueAsNumber;
  const height = heightInput.valueAsNumber;
  const shape = form.elements.shape.value;
  const showGrid = form.elements.grid.checked;
  const pieces = generateRoof(width, height, shape);
  profile = { width, height, shape, showGrid, pieces };
  canvas.style.setProperty('--plot-width', `${width * 12 + 52}px`);
  canvas.style.setProperty('--plot-height', `${height * 12 + 62}px`);
  document.querySelector('#current-material').textContent = material.name;
  applySwatch(document.querySelector('#current-swatch'), material);
  document.querySelector('.materials').style.setProperty('--piece-color', material.color);

  for (const [slider, count] of dimensions) {
    count.min = slider.min;
    count.max = slider.max;
    count.step = slider.step;
    if (count.value !== slider.value) count.value = slider.value;
    slider.setAttribute('aria-valuetext', `${slider.value} blocs`);
  }

  const summary = `${roofShapes[shape].label} · ${width} × ${height} blocs · ${material.name}`;
  document.querySelector('#profile-meta').textContent = summary;
  canvas.setAttribute('aria-label', `Profil du toit. ${summary}.`);

  for (const [kind, count] of Object.entries(countPieces(pieces))) {
    document.querySelector(`#${kind}s`).textContent = count;
  }
  resizeCanvas();
}

function countPieces(pieces) {
  const counts = { block: 0, slab: 0, stair: 0 };
  for (const { kind } of pieces) counts[kind] += 1;
  return counts;
}

const dimensions = [widthInput, heightInput].map(slider => [
  slider, document.querySelector(`#${slider.id}-value`),
]);
const countInputs = new Set(dimensions.map(([, count]) => count));
for (const [slider, count] of dimensions) {
  slider.addEventListener('wheel', event => {
    if (event.ctrlKey || !event.deltaY) return;
    event.preventDefault();
    if (event.deltaY < 0) slider.stepUp();
    else slider.stepDown();
    update();
  }, { passive: false });

  count.addEventListener('input', () => {
    if (count.value && count.validity.valid) {
      slider.value = count.value;
      update();
    }
  });
  count.addEventListener('blur', () => {
    if (Number.isFinite(count.valueAsNumber)) slider.value = String(count.valueAsNumber);
    update();
  });
  count.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    count.blur();
  });
}

form.addEventListener('input', event => {
  if (!countInputs.has(event.target)) update();
});
form.addEventListener('reset', () => requestAnimationFrame(() => {
  material = defaultMaterial;
  widthInput.min = 5;
  widthInput.max = 49;
  widthInput.value = widthInput.defaultValue;
  update();
}));
form.addEventListener('submit', (event) => event.preventDefault());
new ResizeObserver(resizeCanvas).observe(canvas);
document.fonts.ready.then(resizeCanvas);

function exportTitle() {
  return exportName.value.trim() || 'Profil du toit';
}

function drawExport() {
  const ctx = exportCanvas.getContext('2d');
  const { width: imageWidth, height: imageHeight } = exportCanvas;
  const { width, height, shape, pieces } = profile;
  const background = exportColor.value;
  const [r, g, b] = background.slice(1).match(/../g).map(value => parseInt(value, 16));
  const dark = (r * 299 + g * 587 + b * 114) / 1000 < 141;
  const ink = dark ? '#f5f5f3' : '#182834';
  const grid = dark ? '#ffffff32' : '#14283930';
  const axis = dark ? '#ffffff80' : '#14283985';
  ctx.clearRect(0, 0, imageWidth, imageHeight);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, imageWidth, imageHeight);
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '26px Monocraft, monospace';
  if (exportName.value.trim()) ctx.fillText('Profil du toit', 60, 67);
  ctx.font = '48px Monocraft, monospace';
  ctx.fillText(exportTitle(), 60, 123, imageWidth - 120);
  ctx.font = '25px Monocraft, monospace';
  ctx.fillText(`${roofShapes[shape].label} · ${width} × ${height} blocs · ${material.name}`, 60, 171, imageWidth - 120);

  const counts = countPieces(pieces);
  const parts = [
    `${counts.block} bloc${counts.block === 1 ? '' : 's'}`,
    `${counts.slab} dalle${counts.slab === 1 ? '' : 's'}`,
    `${counts.stair} escalier${counts.stair === 1 ? '' : 's'}`,
  ];
  ctx.fillText(parts.join('   ·   '), 60, 218, imageWidth - 120);
  ctx.fillStyle = grid;
  ctx.fillRect(60, 247, imageWidth - 120, 2);
  ctx.save();
  ctx.translate(53, 275);
  drawProfile(ctx, imageWidth - 106, imageHeight - 305, { background, ink, grid, axis, maxCell: 76 });
  ctx.restore();
}

downloadButton.addEventListener('click', () => {
  exportStatus.textContent = '';
  drawExport();
  exportDialog.showModal();
  exportName.focus();
});
exportForm.addEventListener('input', drawExport);
document.querySelector('#close-export').addEventListener('click', () => exportDialog.close());
exportForm.addEventListener('submit', event => {
  event.preventDefault();
  drawExport();
  confirmExport.disabled = true;
  const slug = exportTitle().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const { shape, width, height } = profile;
  const filename = (exportName.value.trim() && slug ? slug : `toit-${shape}-${material.id}-${width}x${height}`) + '.png';
  exportCanvas.toBlob(blob => {
    confirmExport.disabled = false;
    if (!blob) {
      exportStatus.textContent = 'Impossible de générer le PNG.';
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    exportDialog.close();
    exportStatus.textContent = 'PNG exporté.';
  }, 'image/png');
});

const vanillaFile = document.querySelector('#vanilla-file');
const vanillaStatus = document.querySelector('#vanilla-status');
vanillaFile.addEventListener('change', async () => {
  const file = vanillaFile.files[0];
  vanillaFile.value = '';
  if (!file) return;
  vanillaFile.disabled = true;
  vanillaStatus.textContent = 'Lecture des textures…';
  try {
    vanillaTextures = await importLocalTextures(file, [...materials.values()].map(textureName));
    updateFavicon();
    for (const button of materialList.querySelectorAll('[data-material]'))
      applySwatch(button.querySelector('.swatch'), materials.get(button.dataset.material));
    update();
    vanillaStatus.textContent = `${Object.keys(vanillaTextures).length} textures chargées localement.`;
  } catch (error) {
    vanillaStatus.textContent = error instanceof RangeError ? 'Archive invalide.' : error.message;
  } finally {
    vanillaFile.disabled = false;
  }
});

setupAppearance(resizeCanvas);
setupMenuSound();
update();
