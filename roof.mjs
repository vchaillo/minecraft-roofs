export const roofShapes = {
  gable: { label: 'Deux pans', curve: (t) => t, icon: 'M2 20h3v-3h3v-3h3v-3h4v3h3v3h3v3h3' },
  bell: { label: 'Retroussé', curve: (t) => t ** 1.7, icon: 'M2 20h6v-2h3v-4h2v-5h2v5h2v4h3v2h4' },
  round: { label: 'Arrondi', curve: (t) => Math.sqrt(t * (2 - t)), icon: 'M2 20v-5h3v-3h4v-2h8v2h4v3h3v5' },
  mansard: { label: 'Mansardé', curve: (t) => t < .45 ? t * 1.6 : .72 + (t - .45) * .28 / .55, icon: 'M2 20h3v-5h3v-4h3V9h4v2h3v4h3v5h3' },
  pagoda: { label: 'Pagode', curve: (t) => t < .22 ? .16 * (1 - t / .22) : ((t - .22) / .78) ** 1.35, icon: 'M2 16h3v3h4v-2h2v-4h2V9h2v4h2v4h2v2h4v-3h2' },
  terrace: { label: 'À paliers', curve: (t) => Math.floor(t * 4) / 4, icon: 'M2 20h5v-4h4v-4h2V8h2v4h2v4h4v4h5' },
  ogive: { label: 'En ogive', curve: (t) => Math.sqrt(t), icon: 'M2 20v-4h3v-3h3v-2h3V9h2V7h2v2h2v2h3v2h3v3h3v4' },
  spire: { label: 'En flèche', curve: (t) => t < .67 ? .3 * t / .67 : .3 + .7 * (t - .67) / .33, icon: 'M2 20h5v-2h3v-3h2V9h1V5h2v4h1v6h2v3h3v2h5' },
};

export function generateRoof(width, height, shape) {
  const { curve } = roofShapes[shape];
  const sideWidth = Math.floor((width - 1) / 2);
  const highestHalf = height * 2;
  const pieces = [];

  const samples = Array.from({ length: sideWidth }, (_, x) => curve(x / sideWidth));
  const lowest = Math.min(...samples);
  // Anchor the lowest sample at the floor and reserve the full height for the ridge.
  const flank = samples.map((sample) =>
    Math.min(highestHalf - 1, 1 + Math.round((highestHalf - 1) * (sample - lowest) / (1 - lowest)))
  );
  const ridgeWidth = width - sideWidth * 2;
  const heights = [...flank, ...Array(ridgeWidth).fill(highestHalf), ...flank.slice().reverse()];

  for (const [x, top] of heights.entries()) {
    const left = heights[x - 1] ?? top;
    const right = heights[x + 1] ?? top;
    const bottomRow = Math.floor((Math.min(left, top, right) - 1) / 2);
    const capRow = Math.floor((top - 1) / 2);

    for (let y = bottomRow; y < capRow; y += 1) {
      pieces.push({ x, y, kind: 'block', direction: 0 });
    }

    // Aim each stair toward the higher neighbor. Ridge pieces are full blocks.
    const isRidge = x >= sideWidth && x < sideWidth + ridgeWidth;
    const isOuterEdge = x === 0 || x === width - 1;
    const direction = isRidge || left === right || top <= Math.min(left, right)
      ? 0
      : left < right ? 1 : -1;
    const kind = top % 2 ? 'slab' : direction && !isOuterEdge ? 'stair' : 'block';
    pieces.push({ x, y: capRow, kind, direction: kind === 'stair' ? direction : 0 });
  }

  return pieces;
}
