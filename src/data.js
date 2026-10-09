/**
 * Rich Data, Crops, Craftables, NPCs, Goslings & Quests for Goose Valley 2D Deluxe
 */

export const TOOLS = [
  {
    id: 'hoe',
    key: '1',
    name: 'Git-Init Hoe',
    icon: '⛏️',
    desc: 'Till meadow grass into rich garden soil (or clear fences)',
  },
  {
    id: 'seeds',
    key: '2',
    name: 'Seed Satchel',
    icon: '🌱',
    desc: 'Plant selected crop (auto-tills grass & auto-buys seeds!)',
  },
  {
    id: 'water',
    key: '3',
    name: 'Cloud Watering Can',
    icon: '💧',
    desc: 'Water 3x3 crops at once for 4x faster growth',
  },
  {
    id: 'basket',
    key: '4',
    name: 'Harvest & Pet',
    icon: '🧺',
    desc: 'Harvest ripe crops, collect Eggs & Jam, or pet Geese & Goslings',
  },
  {
    id: 'bell',
    key: '5',
    name: 'Sudo Shoo Bell',
    icon: '🔔',
    desc: 'Ring sonic shockwave [Spacebar] to make thief geese drop loot!',
  },
  {
    id: 'fence',
    key: '6',
    name: 'Firewall Fence (15g)',
    icon: '🪵',
    desc: 'Place sturdy wooden fences to block sneaky geese',
  },
  {
    id: 'scarecrow',
    key: '7',
    name: 'Linter Scarecrow (65g)',
    icon: '🎃',
    desc: 'Automatically shoos sneaky geese within a 3.5-tile radius!',
  },
  {
    id: 'jam_press',
    key: '8',
    name: 'Artisan Jam Press (110g)',
    icon: '🍯',
    desc: 'Place on farm; turns harvested crops into 2.5x value Artisan Jam!',
  },
];

export const CROPS = {
  carrot: {
    id: 'carrot',
    name: 'localhost Carrot',
    icon: '🥕',
    seedCost: 10,
    sellPrice: 30,
    growTime: 13,
    leafColor: '#4ade80',
    fruitColor: '#fb923c',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Rust-Berry',
    icon: '🍓',
    seedCost: 18,
    sellPrice: 52,
    growTime: 17,
    leafColor: '#22c55e',
    fruitColor: '#ef4444',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Solaris Sunflower',
    icon: '🌻',
    seedCost: 30,
    sellPrice: 85,
    growTime: 22,
    leafColor: '#16a34a',
    fruitColor: '#facc15',
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Monolith Pumpkin',
    icon: '🎃',
    seedCost: 45,
    sellPrice: 130,
    growTime: 27,
    leafColor: '#15803d',
    fruitColor: '#f97316',
  },
  goldenberry: {
    id: 'goldenberry',
    name: '0-Day Goldenberry',
    icon: '🫐',
    seedCost: 75,
    sellPrice: 220,
    growTime: 34,
    leafColor: '#0d9488',
    fruitColor: '#eab308',
  },
};

export const GOOSE_PROFILES = [
  {
    name: 'Sir_Honks_a_Lot',
    title: 'Principal Chaos Architect',
    speed: 94,
    pitch: 0.92,
    hat: 'crown',
    goslingCount: 2,
  },
  {
    name: 'Merge_Conflict',
    title: 'Keyboard & Crop Bandit',
    speed: 104,
    pitch: 1.08,
    hat: 'bandana',
    goslingCount: 1,
  },
  {
    name: 'Null_Pointer',
    title: 'Pond Pirate & Berry Snacker',
    speed: 90,
    pitch: 0.85,
    hat: 'wizard',
    goslingCount: 2,
  },
  {
    name: 'CSS_Float_Left',
    title: 'Fence Inspector',
    speed: 98,
    pitch: 1.18,
    hat: 'straw',
    goslingCount: 1,
  },
  {
    name: 'Sudo_Quack',
    title: 'Root Access Forager',
    speed: 92,
    pitch: 0.98,
    hat: 'shades',
    goslingCount: 0,
  },
];

export const SHINY_ITEMS = [
  { id: 'keyboard', name: 'HHKB Mechanical Keyboard', icon: '⌨️', tileX: 8.5, tileY: 7.3 },
  { id: 'mug', name: '#1 Senior Farmer Espresso', icon: '☕', tileX: 11.4, tileY: 7.3 },
  { id: 'duck', name: 'Golden Debugging Duck', icon: '🦆', tileX: 22.5, tileY: 13.5 },
  { id: 'laptop', name: 'Closed Work MacBook (RIP)', icon: '💻', tileX: 7.2, tileY: 9.2 },
  { id: 'keys', name: 'Root SSH Keys', icon: '🔑', tileX: 12.8, tileY: 9.2 },
];

export const RETIREMENT_QUESTS = [
  {
    id: 'harvest_crops',
    text: 'Grow & harvest 5 ripe crops (or shake the Apple Orchard trees!)',
    target: 5,
    progress: 0,
    reward: 120,
    done: false,
  },
  {
    id: 'bark_or_bell',
    text: 'Call Byte the Dog [F] or Ring Bell [Space] to stop 3 sneaky geese',
    target: 3,
    progress: 0,
    reward: 100,
    done: false,
  },
  {
    id: 'make_jam',
    text: 'Build an Artisan Jam Press [8] or collect 3 Golden Eggs',
    target: 3,
    progress: 0,
    reward: 150,
    done: false,
  },
  {
    id: 'defend_farm',
    text: 'Place a Linter Scarecrow [7] or 4 Firewall Fences [6]',
    target: 4,
    progress: 0,
    reward: 140,
    done: false,
  },
  {
    id: 'feed_goslings',
    text: 'Toss Sourdough Breadcrumbs [Right-Click / Q] for the geese & goslings',
    target: 4,
    progress: 0,
    reward: 110,
    done: false,
  },
];
