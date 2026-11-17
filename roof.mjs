export const roofShapes = {
  gable: { label: 'Deux pans', curve: (t) => t, icon: 'M2 20h3v-3h3v-3h3v-3h4v3h3v3h3v3h3' },
  bell: { label: 'Retroussé', curve: (t) => t ** 1.7, icon: 'M2 20h6v-2h3v-4h2v-5h2v5h2v4h3v2h4' },
  round: { label: 'Arrondi', curve: (t) => Math.sqrt(t * (2 - t)), icon: 'M2 20v-5h3v-3h4v-2h8v2h4v3h3v5' },
  mansard: { label: 'Mansardé', curve: (t) => t < .45 ? t * 1.6 : .72 + (t - .45) * .28 / .55, icon: 'M2 20h3v-5h3v-4h3V9h4v2h3v4h3v5h3' },
};

export function generateRoof(width, height, shape) {
  const { curve } = roofShapes[shape];
  const halfWidth = Math.floor(width / 2);
  const highestHalf = height * 2;
  const pieces = [];
  let previousTop = 1;

  // Heights are measured in half-blocks from the floor.
  function addColumn(x, outerTop, top, direction) {
    const bottomRow = Math.floor((outerTop - 1) / 2);
    const capRow = Math.floor((top - 1) / 2);
    for (let y = bottomRow; y < capRow; y += 1) {
      pieces.push({ x, y, kind: 'block', direction: 0 });
    }

    let kind = 'block';
    if (top % 2 !== 0) kind = 'slab';
    else if (direction && top > outerTop) kind = 'stair';
    pieces.push({ x, y: capRow, kind, direction: kind === 'stair' ? direction : 0 });
  }

  for (let x = 0; x < halfWidth; x += 1) {
    const progress = x / (width % 2 ? halfWidth : halfWidth - 1);
    const top = 1 + Math.round((highestHalf - 1) * curve(progress));
    addColumn(x, previousTop, top, 1);
    addColumn(width - 1 - x, previousTop, top, -1);
    previousTop = top;
  }

  if (width % 2) addColumn(halfWidth, previousTop, highestHalf, 0);
  return pieces;
}
