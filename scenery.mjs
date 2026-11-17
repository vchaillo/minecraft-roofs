// Draw the landscape at a low resolution so each pixel stays visible at any screen size.
const palettes = {
  spring: {
    sky: ['#719ecf', '#c9e7db'], sun: '#fff3be', cloud: '#eefaf0',
    mountain: ['#9ea8c1', '#729997'], earth: ['#765347', '#583c39'],
    grass: ['#7cb950', '#609653', '#4c7c49'], leaves: ['#ffb6ca', '#da7caa', '#995780'],
    flowers: ['#ffb1c7', '#fff2aa', '#e5c5ff'],
  },
  summer: {
    sky: ['#4b96d8', '#b2e7f4'], sun: '#fff19a', cloud: '#f6fbff',
    mountain: ['#779cba', '#568e87'], earth: ['#9c7047', '#71503d'],
    grass: ['#86bc3c', '#5b9939', '#3f7734'], leaves: ['#91ba43', '#538535', '#31572e'],
    flowers: ['#ffdc71', '#fff5cf', '#e87151'],
  },
  autumn: {
    sky: ['#77729c', '#ffc28f'], sun: '#fff0b5', cloud: '#efbba5',
    mountain: ['#aa7f85', '#8d766b'], earth: ['#8e6040', '#603e36'],
    grass: ['#ad963d', '#8a703d', '#675a38'], leaves: ['#ffc54c', '#d67b2e', '#a74332'],
    flowers: ['#e8b84d', '#c55734', '#e68a42'],
  },
  winter: {
    sky: ['#7393bd', '#d1e6ed'], sun: '#f9f6e8', cloud: '#f0f9ff',
    mountain: ['#adbedb', '#879fbb'], earth: ['#7996a4', '#607b93'],
    grass: ['#ebf7ff', '#c3dbec', '#a2c4db'], leaves: ['#718d8c', '#406e6e', '#36565b'],
    flowers: [],
  },
};

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function mix(from, to, amount) {
  const a = Number.parseInt(from.slice(1), 16);
  const b = Number.parseInt(to.slice(1), 16);
  const channels = [16, 8, 0].map(shift => {
    const start = (a >> shift) & 255;
    const end = (b >> shift) & 255;
    return Math.round(start + (end - start) * amount);
  });
  return `rgb(${channels.join(',')})`;
}

export function paintScenery(canvas, season, time, aspect) {
  const palette = palettes[season];
  const winter = season === 'winter';
  const night = time === 'night';
  const width = Math.max(104, Math.min(640, Math.round(224 * aspect)));
  const height = 224;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const random = seededRandom(708);
  const integer = (low, high) => low + Math.floor(random() * (high - low + 1));
  const pick = values => values[integer(0, values.length - 1)];

  function rect(x, y, w, h, color, shade = true) {
    ctx.fillStyle = night && shade ? mix(color, '#121f42', 0.53) : color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  const sky = night ? ['#10132d', '#3e507d'] : palette.sky;
  for (let y = 0; y < height; y += 3)
    rect(0, y, width, 3, mix(...sky, Math.min(1, y / 145)), false);

  const sunX = Math.round(width * 0.78);
  const sunY = 42;
  if (night) {
    const stars = seededRandom(993);
    const starColors = ['#eff3ff', '#abb8dc', '#727ca7'];
    for (let i = 0; i < Math.round(width / 3); i++) {
      rect(1 + stars() * (width - 3), 4 + stars() * 106, i % 9 === 0 ? 2 : 1, 1,
        starColors[Math.floor(stars() * starColors.length)], false);
    }
  }

  const disk = night ? 15 : season === 'summer' ? 30 : 23;
  const orb = night ? '#dce6ff' : palette.sun;
  for (let halo = 18; halo >= 6; halo -= 6) {
    ctx.globalAlpha = night ? 0.075 : 0.10;
    rect(sunX - halo, sunY - halo, disk + halo * 2, disk + halo * 2, orb, false);
  }
  ctx.globalAlpha = 1;
  rect(sunX + 2, sunY + 2, disk, disk, night ? '#7888b8' : '#e8a75a', false);
  rect(sunX, sunY, disk, disk, orb, false);
  if (night) {
    rect(sunX + 3, sunY + 5, 3, 2, '#aebcdd', false);
    rect(sunX + 9, sunY + 9, 2, 3, '#aebcdd', false);
  }

  const cloud = night ? '#323f67' : palette.cloud;
  for (const [fraction, y, size] of [[.14, 45, 36], [.44, 29, 22], [.63, 83, 38], [.95, 27, 25]]) {
    const x = width * fraction - size / 2;
    ctx.globalAlpha = night ? 0.6 : 0.83;
    rect(x + 6, y - 4, size - 13, 5, cloud, false);
    rect(x, y, size, 5, cloud, false);
    rect(x + 10, y + 5, size - 5, 3, cloud, false);
    ctx.globalAlpha = 1;
  }

  function ridge(base, amplitude, period, step, color, phase) {
    const yAt = x => Math.round((base + Math.sin(x / period + phase) * amplitude +
      Math.sin(x / (period * .39) + phase) * amplitude * .37) / step) * step;
    for (let x = 0; x < width; x += step) {
      const y = yAt(x);
      rect(x, y, step, height - y, color);
    }
    return yAt;
  }

  ridge(107, 21, 34, 6, palette.mountain[0], 3.5);
  ridge(126, 16, 24, 5, palette.mountain[1], 2);

  function tree(x, ground, size, distant = false) {
    const y = ground - size * 4;
    const bark = distant ? '#655e51' : season === 'winter' ? '#655d59' : '#70503c';
    rect(x - size / 2, y + size, size, size * 3, bark);
    if (!distant) rect(x, y + size, Math.max(1, Math.floor(size / 3)), size * 3, '#503a32');

    if (winter) {
      for (let tier = 0; tier < 4; tier++) {
        const crown = size * (tier + 1);
        const top = y + tier * size * .77;
        rect(x - crown / 2, top, crown, size, palette.leaves[tier % 2 + 1]);
        rect(x - crown / 2, top, crown, Math.max(1, Math.floor(size / 3)), palette.grass[tier % 2]);
      }
      return;
    }

    const canopy = season === 'autumn' ? size * 2.8 : size * 3.5;
    rect(x - canopy / 2, y + size * .5, canopy, size * 1.9, palette.leaves[2]);
    rect(x - canopy / 2 + size * .3, y + size * .2, canopy - size * .25, size * 1.7, palette.leaves[1]);
    rect(x - canopy / 2 + size * .72, y - size * .42, canopy - size * 1.3, size * .88, palette.leaves[0]);
    rect(x - canopy / 2 - size * .33, y + size * 1.04, size * 1.1, size * .86, palette.leaves[1]);
    for (let i = 0; i < (distant ? 5 : 18); i++) {
      rect(x - canopy / 2 + integer(2, Math.floor(canopy) - 2), y + integer(1, Math.floor(size * 1.75)),
        integer(1, Math.max(1, Math.floor(size / 2))), integer(1, 2), pick(palette.leaves));
    }
  }

  const rearGround = ridge(155, 15, 32, 6, palette.grass[2], 1);
  for (let x = 4; x < width; x += integer(11, 21))
    tree(x, rearGround(x) + 5, integer(3, 5), true);

  const nearGround = ridge(176, 15, 31, 7, palette.earth[1], 5.1);
  for (let x = 0; x < width; x += 7) {
    const y = nearGround(x);
    rect(x, y, 7, 6, palette.grass[1]);
    rect(x, y, 7, 2, palette.grass[0]);
    rect(x, y + 6, 6, 3, palette.earth[0]);
  }
  for (let x = 6; x < width; x += integer(25, 42))
    tree(x, nearGround(x) + 4, integer(6, 10));

  const front = ridge(199, 14, 39, 8, palette.grass[1], 2.6);
  for (let x = 0; x < width; x += 8)
    rect(x, front(x), 8, 3, palette.grass[0]);

  for (let i = 0; i < width * 1.1; i++) {
    const x = integer(0, width - 1);
    const y = integer(front(x), height - 1);
    rect(x, y, integer(1, 4), 1, pick(palette.grass));
  }
  if (!winter) {
    for (let i = 0; i < width / (season === 'spring' ? 5 : 13); i++) {
      const x = integer(0, width - 1);
      const y = integer(front(x) + 2, height);
      const stem = season === 'autumn' ? 0 : integer(2, 4);
      if (stem) rect(x, y - stem, 1, stem, '#48713c');
      rect(x - 1, y - stem - 1, integer(2, 3), 1, pick(palette.flowers));
      if (season === 'spring') rect(x, y - stem - 2, 1, 3, pick(palette.flowers));
    }
  } else {
    ctx.globalAlpha = night ? 0.40 : 0.67;
    for (let i = 0; i < width / 3; i++)
      rect(integer(0, width - 1), integer(19, height - 5), i % 9 === 0 ? 2 : 1, 1, '#e2f0ff', false);
    ctx.globalAlpha = 1;
  }
}
