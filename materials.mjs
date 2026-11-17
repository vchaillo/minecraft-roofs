const woods = [
  ['oak', 'Chêne', '#ad8953'], ['spruce', 'Sapin', '#755139'],
  ['birch', 'Bouleau', '#c9b477'], ['jungle', 'Acajou', '#a07551'],
  ['acacia', 'Acacia', '#b8683c'], ['dark_oak', 'Chêne noir', '#513823'],
  ['mangrove', 'Palétuvier', '#8a3e37'], ['cherry', 'Cerisier', '#e5aea9'],
  ['pale_oak', 'Chêne pâle', '#cec6be'], ['poplar', 'Peuplier', '#9b8859'],
  ['bamboo', 'Bambou', '#c2ab58'], ['bamboo_mosaic', 'Mosaïque de bambou', '#baa24e'],
  ['crimson', 'Carmin', '#7d3b5c'], ['warped', 'Biscontourné', '#3c7f7a'],
];

const stones = [
  ['stone', 'Roche', '#858585'], ['cobblestone', 'Pierres', '#777a76'],
  ['mossy_cobblestone', 'Pierres moussues', '#657259'], ['stone_brick', 'Pierre taillée', '#81817c', 'brick'],
  ['mossy_stone_brick', 'Pierre taillée moussue', '#696f5d', 'brick'],
  ['granite', 'Granite', '#9a695b'], ['polished_granite', 'Granite poli', '#a97465', 'tile'],
  ['diorite', 'Diorite', '#bdbdbd'], ['polished_diorite', 'Diorite polie', '#ccccca', 'tile'],
  ['andesite', 'Andésite', '#848681'], ['polished_andesite', 'Andésite polie', '#92948f', 'tile'],
  ['cobbled_deepslate', 'Pierres des abîmes', '#515154'],
  ['polished_deepslate', 'Ardoise des abîmes polie', '#4a4a4e', 'tile'],
  ['deepslate_brick', 'Ardoise des abîmes taillée', '#47474c', 'brick'],
  ['deepslate_tile', 'Ardoise des abîmes carrelée', '#36363c', 'brick'],
  ['blackstone', 'Roche noire', '#413940'], ['polished_blackstone', 'Roche noire polie', '#413d46', 'tile'],
  ['polished_blackstone_brick', 'Roche noire taillée', '#38343b', 'brick'],
  ['tuff', 'Tuf', '#6d7168'], ['polished_tuff', 'Tuf poli', '#6c7164', 'tile'],
  ['tuff_brick', 'Briques de tuf', '#656a61', 'brick'],
  ['sandstone', 'Grès', '#d7c18b'], ['smooth_sandstone', 'Grès lisse', '#dfcb98', 'tile'],
  ['red_sandstone', 'Grès rouge', '#b76222'], ['smooth_red_sandstone', 'Grès rouge lisse', '#b96a30', 'tile'],
  ['prismarine', 'Prismarine', '#6b9a91'], ['prismarine_brick', 'Prismarine taillée', '#70afa0', 'brick'],
  ['dark_prismarine', 'Prismarine sombre', '#36574e', 'brick'],
  ['quartz', 'Bloc de quartz', '#e8e2d8', 'tile'], ['smooth_quartz', 'Quartz lisse', '#f0ece2', 'tile'],
  ['purpur', 'Purpur', '#aa7da9', 'tile'], ['end_stone_brick', 'Pierre de l’End taillée', '#d9da9e', 'brick'],
  ['cinnabar', 'Cinabre', '#b83a3b'], ['polished_cinnabar', 'Cinabre poli', '#b34241', 'tile'],
  ['sulfur', 'Soufre', '#d6c366'], ['polished_sulfur', 'Soufre poli', '#c7b358', 'tile'],
];

const bricks = [
  ['brick', 'Briques', '#a45645'], ['mud_brick', 'Briques de terre crue', '#90715f'],
  ['nether_brick', 'Briques du Nether', '#4b2a31'], ['red_nether_brick', 'Briques rouges du Nether', '#79252d'],
  ['resin_brick', 'Briques de résine', '#d96b19'], ['cinnabar_brick', 'Briques de cinabre', '#a03938'],
  ['sulfur_brick', 'Briques de soufre', '#c4aa55'],
];

const copper = [
  ['cut_copper', 'Cuivre taillé', '#bc724f'], ['exposed_cut_copper', 'Cuivre taillé exposé', '#a68467'],
  ['weathered_cut_copper', 'Cuivre taillé érodé', '#6b9c80'], ['oxidized_cut_copper', 'Cuivre taillé oxydé', '#518e82'],
];

const dyes = [
  ['white', 'blanc', 'blanche', '#ebebe4'], ['orange', 'orange', 'orange', '#d97826'],
  ['magenta', 'magenta', 'magenta', '#ac4b99'], ['light_blue', 'bleu clair', 'bleu clair', '#4f9ec6'],
  ['yellow', 'jaune', 'jaune', '#e7bd36'], ['lime', 'vert clair', 'vert clair', '#78a435'],
  ['pink', 'rose', 'rose', '#d788a4'], ['gray', 'gris', 'grise', '#44494c'],
  ['light_gray', 'gris clair', 'gris clair', '#858580'], ['cyan', 'cyan', 'cyan', '#2c7b83'],
  ['purple', 'violet', 'violette', '#783f9c'], ['blue', 'bleu', 'bleue', '#3b4f98'],
  ['brown', 'marron', 'marron', '#6e4e35'], ['green', 'vert', 'verte', '#5f7133'],
  ['red', 'rouge', 'rouge', '#a73d3c'], ['black', 'noir', 'noire', '#29282f'],
];

export const materialGroups = [
  { label: 'Bois', pattern: 'wood', entries: woods },
  { label: 'Roches et minéraux', pattern: 'stone', entries: stones },
  { label: 'Briques', pattern: 'brick', entries: bricks },
  { label: 'Cuivre', pattern: 'tile', entries: [
    ...copper,
    ...copper.map(([id, label, color]) => [`waxed_${id}`, `${label} ciré`, color]),
  ] },
  { label: 'Béton', pattern: 'concrete', entries: dyes.map(([id, colorName, , shade]) => [`${id}_concrete`, `Béton ${colorName}`, shade]) },
  { label: 'Laine', pattern: 'wool', entries: dyes.map(([id, , colorName, shade]) => [`${id}_wool`, `Laine ${colorName}`, shade]) },
].map(({ label, pattern, entries }) => ({
  label,
  materials: entries.map(([id, name, color, texture = pattern]) => ({ id, name, color, texture })),
}));

export const materials = new Map(materialGroups.flatMap(({ materials }) => materials.map((material) => [material.id, material])));
