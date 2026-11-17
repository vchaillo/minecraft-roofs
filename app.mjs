import { generateRoof, roofShapes } from './roof.mjs';

const form = document.querySelector('#settings');
const canvas = document.querySelector('#profile');
const shapePicker = document.querySelector('#shapes');
const downloadButton = document.querySelector('#download');
const exportStatus = document.querySelector('#export-status');
const colors = { block: '#d3a972', slab: '#f0cb82', stair: '#bc8358' };
const widthInput = document.querySelector('#width');
const heightInput = document.querySelector('#height');
let profile;

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
  context.fillStyle = colors[kind];
  context.fill();
  context.save();
  context.clip();

  const pixel = Math.max(1, Math.floor(size / 12));
  for (let row = 1; row <= 8; row += 1) {
    for (let column = 1; column <= 8; column += 1) {
      const hash = (row * 19 + column * 43 + piece.y * 7 + Math.min(piece.x, profile.width - 1 - piece.x) * 13) % 17;
      if (hash > 4) continue;
      context.fillStyle = hash < 2 ? '#fff0b547' : '#37241520';
      context.fillRect((column + (hash % 2) / 3) * size / 10, row * size / 9, pixel * (hash % 2 + 1), pixel);
    }
  }
  context.strokeStyle = '#ffedbf9e';
  context.lineWidth = Math.max(1.5, size / 9);
  context.stroke();
  context.restore();
  context.strokeStyle = '#362a23';
  context.lineWidth = Math.max(1, size / 24);
  context.stroke();
  context.restore();
}

function drawProfile(context, viewportWidth, viewportHeight) {
  const { width, height, showGrid, pieces } = profile;
  const bounds = { left: 36, right: 16, top: 23, bottom: 39 };
  const size = Math.min(44, (viewportWidth - bounds.left - bounds.right) / width, (viewportHeight - bounds.top - bounds.bottom) / height);
  const gridWidth = width * size;
  const gridHeight = height * size;
  const left = Math.round((viewportWidth - gridWidth + bounds.left - bounds.right) / 2);
  const base = Math.round((viewportHeight + gridHeight + bounds.top - bounds.bottom) / 2);
  const top = base - gridHeight;

  const backdrop = context.createLinearGradient(0, 0, 0, viewportHeight);
  backdrop.addColorStop(0, '#263228');
  backdrop.addColorStop(1, '#1e2722');
  context.fillStyle = backdrop;
  context.fillRect(0, 0, viewportWidth, viewportHeight);

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
    context.strokeStyle = '#455549';
    context.lineWidth = 1;
    context.stroke();

    context.beginPath();
    context.setLineDash([3, 4]);
    context.moveTo(left + gridWidth / 2, top - 10);
    context.lineTo(left + gridWidth / 2, base);
    context.strokeStyle = '#9aab7c';
    context.stroke();
    context.setLineDash([]);
  }

  for (const piece of pieces) {
    drawPiece(context, piece, left + piece.x * size, base - (piece.y + 1) * size, size);
  }

  context.strokeStyle = '#829177';
  context.beginPath();
  context.moveTo(left, base + 1);
  context.lineTo(left + gridWidth, base + 1);
  context.stroke();

  context.fillStyle = '#c5d2b5';
  context.font = '11px "Space Mono", monospace';
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
  drawProfile(context, width, height);
}

function update() {
  const width = widthInput.valueAsNumber;
  const height = heightInput.valueAsNumber;
  const shape = form.elements.shape.value;
  const showGrid = form.elements.grid.checked;
  const pieces = generateRoof(width, height, shape);
  profile = { width, height, shape, showGrid, pieces };
  canvas.style.setProperty('--plot-width', `${width * 12 + 52}px`);

  for (const slider of [widthInput, heightInput]) {
    document.querySelector(`#${slider.id}-value`).value = `${slider.value} blocs`;
    slider.setAttribute('aria-valuetext', `${slider.value} blocs`);
    const progress = (slider.valueAsNumber - Number(slider.min)) / (Number(slider.max) - Number(slider.min));
    slider.style.setProperty('--fill', `${progress * 100}%`);
  }

  const summary = `${roofShapes[shape].label} · ${width} × ${height} blocs`;
  document.querySelector('#profile-meta').textContent = summary;
  canvas.setAttribute('aria-label', `Profil du toit. ${summary}.`);
  canvas.setAttribute('aria-describedby', 'profile-instructions');

  const counts = { block: 0, slab: 0, stair: 0 };
  for (const { kind } of pieces) counts[kind] += 1;
  for (const [kind, count] of Object.entries(counts)) {
    document.querySelector(`#${kind}s`).textContent = count;
  }
  resizeCanvas();
}

form.addEventListener('input', update);
form.addEventListener('reset', () => requestAnimationFrame(update));
form.addEventListener('submit', (event) => event.preventDefault());
new ResizeObserver(resizeCanvas).observe(canvas);
document.fonts.ready.then(resizeCanvas);

downloadButton.addEventListener('click', () => {
  downloadButton.disabled = true;
  exportStatus.textContent = '';
  const { shape, width, height } = profile;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 1200;
  exportCanvas.height = Math.max(450, Math.min(1110, Math.ceil(height * 44 + 62)));
  drawProfile(exportCanvas.getContext('2d'), exportCanvas.width, exportCanvas.height);
  exportCanvas.toBlob((blob) => {
    downloadButton.disabled = false;
    if (!blob) {
      exportStatus.textContent = 'Impossible de générer le PNG.';
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `toit-${shape}-${width}x${height}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    exportStatus.textContent = 'PNG exporté.';
  }, 'image/png');
});

update();
