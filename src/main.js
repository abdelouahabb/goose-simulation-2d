/**
 * Goose Valley 2D DELUXE — Rich Living World Engine
 * Features:
 *  - Lush multi-biome world (Cozy Cottage, Windmill, Apple Orchard, Dock & Boat, Stream & Bridge, Lanterns)
 *  - Adult Geese with Hats + Trailing Baby Gosling Trains!
 *  - "Byte" the Loyal Border Collie Sheepdog companion [Press F to whistle & herd!]
 *  - Linter Scarecrows, Artisan Jam Presses, Cloud Auto-Sprinklers, Firewall Fences
 *  - Dynamic Day / Sunset / Starry Night Fireflies + Cozy Rain Showers + Butterflies & Koi Fish
 */
import confetti from 'canvas-confetti';
import { sfx } from './audio.js';
import { CROPS, GOOSE_PROFILES, RETIREMENT_QUESTS, SHINY_ITEMS, TOOLS } from './data.js';

const TILE_SIZE = 56;
const MAP_COLS = 36;
const MAP_ROWS = 24;

export class GooseValleyGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Economy & Time
    this.gold = 220;
    this.zenScore = 150;
    this.selectedTool = 'hoe';
    this.selectedCrop = 'carrot';
    this.weather = 'sunny'; // 'sunny' | 'rain' | 'sunset' | 'night'

    this.inventory = {
      carrot: 6,
      strawberry: 3,
      sunflower: 2,
      pumpkin: 1,
      goldenberry: 1,
    };

    this.quests = JSON.parse(JSON.stringify(RETIREMENT_QUESTS));

    // Tile Grid: 0=grass, 1=water, 2=tilled, 3=cobble_path, 4=cottage_footprint, 5=wood_bridge, 6=sand_beach
    this.tiles = [];
    this.grassDecor = []; // Precomputed flowers, clover tufts, pebbles per tile

    // Interactive Farm Structures
    this.crops = new Map();       // `${c},${r}` -> { cropId, progress, watered }
    this.fences = new Map();      // `${c},${r}` -> { hp: 3 }
    this.sprinklers = new Map();  // `${c},${r}` -> { c, r, timer, angle }
    this.scarecrows = new Map();  // `${c},${r}` -> { c, r, pulse }
    this.jamPresses = new Map();  // `${c},${r}` -> { c, r, state: 'idle'|'brewing'|'ready', timer, jamValue }

    // Orchard Apple Trees (shakeable for free apples & gold!)
    this.trees = [];
    // Lamp posts that glow warmly at sunset/night
    this.lanterns = [
      { x: 10.5 * TILE_SIZE, y: 8.2 * TILE_SIZE },
      { x: 18.5 * TILE_SIZE, y: 8.2 * TILE_SIZE },
      { x: 18.5 * TILE_SIZE, y: 14.5 * TILE_SIZE },
      { x: 23.5 * TILE_SIZE, y: 11.5 * TILE_SIZE },
    ];

    // Farmer Player
    this.player = {
      x: 11.5 * TILE_SIZE,
      y: 9.5 * TILE_SIZE,
      vx: 0,
      vy: 0,
      speed: 235,
      facing: 1,
      walkCycle: 0,
      swingTimer: 0,
      targetDest: null,
    };

    // "Byte" the Loyal Border Collie Sheepdog!
    this.dog = {
      name: 'Byte (v1.0 Good Boy)',
      x: 13.2 * TILE_SIZE,
      y: 9.8 * TILE_SIZE,
      facing: 1,
      walkCycle: 0,
      state: 'follow', // 'follow' | 'patrol' | 'chase'
      stateTimer: 0,
      targetGoose: null,
      barkTimer: 0,
    };

    // Living Ambient Creatures & Entities
    this.geese = [];
    this.goslings = [];
    this.shinyItems = [];
    this.eggs = [];
    this.crumbs = [];
    this.butterflies = [];
    this.koiFish = [];
    this.rainDrops = [];
    this.waterRipples = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];

    this.keys = {};
    this.hoverTile = { c: -1, r: -1, worldX: 0, worldY: 0 };
    this.camera = { x: 0, y: 0 };

    this.buildRichMap();
    this.spawnInitialWorld();
    this.bindInput();
    this.initDOMUI();
    this.resize();

    // Center camera on player initially
    this.camera.x = Math.max(0, this.player.x - window.innerWidth / 2);
    this.camera.y = Math.max(0, this.player.y - window.innerHeight / 2);

    this.lastTime = performance.now();
    this.loop();
  }

  buildRichMap() {
    for (let r = 0; r < MAP_ROWS; r++) {
      const row = [];
      for (let c = 0; c < MAP_COLS; c++) {
        // 1. Winding River & Crystal Lake on East / South-East
        const distLake = Math.hypot((c - 26.5) * 0.9, r - 14.5);
        const riverCurve = Math.abs(c - (23.5 + Math.sin(r * 0.45) * 1.6));
        const isRiver = r < 14 && riverCurve < 1.35;

        if ((c >= 22 && c <= 25 && r === 10) || (c >= 21 && c <= 26 && r === 14 && c <= 22)) {
          row.push(5); // Wooden Bridge / Dock planks
        } else if (distLake < 5.2 || isRiver) {
          row.push(1); // Water
        } else if (distLake < 6.0) {
          row.push(6); // Sandy Lake Shore
        } else if (c >= 7 && c <= 12 && r >= 4 && r <= 6) {
          row.push(4); // Cozy Timber Cottage footprint
        } else if (
          (r === 8 && c >= 7 && c <= 25) ||
          (c === 18 && r >= 8 && r <= 16) ||
          (r === 10 && c >= 18 && c <= 26)
        ) {
          row.push(3); // Cobblestone Path
        } else {
          row.push(0); // Lush Meadow Grass
        }

        // Precompute charming wildflowers & grass blades on grass tiles
        if (row[c] === 0 && Math.random() < 0.42) {
          const colors = ['#fef08a', '#f472b6', '#c084fc', '#ffffff', '#fb923c'];
          this.grassDecor.push({
            x: (c + 0.2 + Math.random() * 0.6) * TILE_SIZE,
            y: (r + 0.2 + Math.random() * 0.6) * TILE_SIZE,
            type: Math.random() < 0.55 ? 'flower' : 'clover',
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
      this.tiles.push(row);
    }

    // Starter 4x4 Garden with crops already growing & 1 Auto-Sprinkler + 1 Jam Press!
    for (let r = 10; r <= 13; r++) {
      for (let c = 12; c <= 16; c++) {
        this.tiles[r][c] = 2; // Tilled Soil
        if (r === 10 && c <= 15) {
          this.crops.set(`${c},${r}`, {
            cropId: 'carrot',
            progress: c === 12 ? 1.0 : 0.75,
            watered: true,
          });
        } else if (r === 11 && c <= 14) {
          this.crops.set(`${c},${r}`, {
            cropId: 'strawberry',
            progress: c === 12 ? 1.0 : 0.65,
            watered: true,
          });
        } else if (r === 12 && c === 12) {
          this.crops.set(`${c},${r}`, {
            cropId: 'sunflower',
            progress: 1.0,
            watered: true,
          });
        }
      }
    }

    // Place a starter Linter Scarecrow & Artisan Jam Press so farm looks alive right away
    this.scarecrows.set('11,11', { c: 11, r: 11, pulse: 0 });
    this.jamPresses.set('15,7', {
      c: 15,
      r: 7,
      state: 'ready',
      timer: 0,
      jamValue: 95,
      icon: '🍓',
    });

    // Populate Lush Apple Orchard & Pine Perimeter Trees
    const orchardCoords = [
      [3, 4, true],
      [5, 5, true],
      [3, 7, true],
      [5, 9, true],
      [3, 12, true],
      [5, 14, true],
      [4, 17, true],
      [15, 3, true],
      [18, 4, true],
      [20, 3, false],
      [29, 4, false],
      [31, 6, true],
      [32, 10, false],
      [31, 19, true],
      [20, 19, true],
      [10, 19, false],
    ];
    orchardCoords.forEach(([tc, tr, hasApples]) => {
      this.trees.push({
        c: tc,
        r: tr,
        x: (tc + 0.5) * TILE_SIZE,
        y: (tr + 0.5) * TILE_SIZE,
        apples: hasApples ? 3 : 0,
        regrowTimer: 0,
        shakeTimer: 0,
      });
    });
  }

  spawnInitialWorld() {
    // 1. Shiny Developer Items around Cottage & Patio
    SHINY_ITEMS.forEach((item) => {
      this.shinyItems.push({
        ...item,
        x: item.tileX * TILE_SIZE,
        y: item.tileY * TILE_SIZE,
        carriedBy: null,
      });
    });

    // 2. Spawn 5 Mischievous Adult Geese + Their Trailing Baby Gosling Families!
    GOOSE_PROFILES.forEach((prof, idx) => {
      const gx = (23 + (idx % 3) * 2.4) * TILE_SIZE;
      const gy = (12 + Math.floor(idx / 2) * 2.2) * TILE_SIZE;
      const goose = {
        id: 'goose_' + idx,
        ...prof,
        x: gx,
        y: gy,
        facing: -1,
        state: 'wander',
        stateTimer: 1.5 + idx * 1.1,
        targetX: (15 + idx) * TILE_SIZE,
        targetY: (10 + idx) * TILE_SIZE,
        carriedLoot: null,
        walkPhase: Math.random() * 10,
        flapTimer: 0,
        eggTimer: 18 + idx * 5,
        thought: 'Peace was never an option 🪿',
      };
      this.geese.push(goose);

      // Spawn adorable fuzzy yellow Goslings that follow this parent goose in a train!
      let leader = goose;
      for (let k = 0; k < (prof.goslingCount || 0); k++) {
        const gosling = {
          id: `gosling_${idx}_${k}`,
          leader,
          x: gx + (k + 1) * 28,
          y: gy + (k + 1) * 16,
          facing: -1,
          walkPhase: k * 2.0,
        };
        this.goslings.push(gosling);
        leader = gosling;
      }
    });

    // 3. Spawn Swimming Koi Fish in the Crystal Lake
    for (let i = 0; i < 9; i++) {
      this.koiFish.push({
        x: (25 + Math.random() * 4) * TILE_SIZE,
        y: (12.5 + Math.random() * 4) * TILE_SIZE,
        angle: Math.random() * Math.PI * 2,
        speed: 22 + Math.random() * 18,
        color: i % 2 === 0 ? '#f97316' : '#fef08a',
      });
    }

    // 4. Spawn Fluttering Meadow Butterflies
    const bColors = ['#f472b6', '#facc15', '#c084fc', '#38bdf8', '#fb923c'];
    for (let i = 0; i < 16; i++) {
      this.butterflies.push({
        x: (4 + Math.random() * 26) * TILE_SIZE,
        y: (4 + Math.random() * 15) * TILE_SIZE,
        vx: (Math.random() - 0.5) * 45,
        vy: (Math.random() - 0.5) * 45,
        phase: Math.random() * 10,
        color: bColors[i % bColors.length],
      });
    }

    // 5. Pre-allocate Raindrops for Cozy Rain Mode
    for (let i = 0; i < 95; i++) {
      this.rainDrops.push({
        x: Math.random() * MAP_COLS * TILE_SIZE,
        y: Math.random() * MAP_ROWS * TILE_SIZE,
        len: 12 + Math.random() * 10,
        speed: 420 + Math.random() * 140,
      });
    }
  }

  bindInput() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      const toolMatch = TOOLS.find((t) => `Digit${t.key}` === e.code);
      if (toolMatch) this.selectTool(toolMatch.id);

      if (e.code === 'Space' && document.activeElement.tagName !== 'BUTTON') {
        e.preventDefault();
        this.ringShooBell();
      }
      if (e.code === 'KeyQ') {
        this.tossBreadcrumb(this.player.x + this.player.facing * 55, this.player.y);
      }
      if (e.code === 'KeyF') {
        this.whistleDog();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const worldX = e.clientX - rect.left + this.camera.x;
      const worldY = e.clientY - rect.top + this.camera.y;
      this.hoverTile = {
        c: Math.floor(worldX / TILE_SIZE),
        r: Math.floor(worldY / TILE_SIZE),
        worldX,
        worldY,
      };
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const worldX = e.clientX - rect.left + this.camera.x;
      const worldY = e.clientY - rect.top + this.camera.y;

      if (e.button === 2) {
        this.tossBreadcrumb(worldX, worldY);
        return;
      }
      this.handleWorldClick(worldX, worldY);
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  selectTool(toolId) {
    this.selectedTool = toolId;
    document.querySelectorAll('.tool-slot').forEach((el) => {
      el.classList.toggle('active', el.dataset.tool === toolId);
    });
    sfx.playSeed();
  }

  selectCrop(cropId) {
    this.selectedCrop = cropId;
    document.querySelectorAll('.seed-chip').forEach((el) => {
      el.classList.toggle('active', el.dataset.crop === cropId);
    });
    sfx.playSeed();
  }

  /**
   * Whistle for "Byte" the Border Collie to chase down any thief goose!
   */
  whistleDog() {
    sfx.playBell();
    this.dog.barkTimer = 1.2;
    this.dog.state = 'patrol';
    this.dog.stateTimer = 8.0;
    this.spawnParticles(this.dog.x, this.dog.y - 15, '#38bdf8', 10);
    this.addFloatingText(this.dog.x, this.dog.y - 34, '🐶 WOOF! Byte is on Goose Patrol!', '#38bdf8');

    // Startle nearby geese immediately
    this.geese.forEach((g) => {
      if (Math.hypot(g.x - this.dog.x, g.y - this.dog.y) < 300 || g.carriedLoot) {
        if (g.carriedLoot) {
          this.dropGooseLoot(g);
          this.advanceQuest('bark_or_bell', 1);
        }
        g.state = 'flee';
        g.stateTimer = 4.0;
        g.targetX = 26 * TILE_SIZE;
        g.targetY = 14 * TILE_SIZE;
      }
    });
  }

  handleWorldClick(worldX, worldY) {
    const c = Math.floor(worldX / TILE_SIZE);
    const r = Math.floor(worldY / TILE_SIZE);
    if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return;

    // 1. Check Golden Eggs click
    for (let i = this.eggs.length - 1; i >= 0; i--) {
      const egg = this.eggs[i];
      if (Math.hypot(egg.x - worldX, egg.y - worldY) < 36) {
        this.collectEgg(i);
        return;
      }
    }

    // 2. Check Orchard Tree click (shake for ripe apples!)
    for (const tree of this.trees) {
      if (Math.hypot(tree.x - worldX, tree.y - worldY) < 42) {
        tree.shakeTimer = 0.45;
        sfx.playHoe();
        if (tree.apples > 0) {
          const count = tree.apples;
          tree.apples = 0;
          tree.regrowTimer = 22;
          const appleGold = count * 18;
          this.gold += appleGold;
          this.zenScore += 15;
          sfx.playHarvest();
          this.spawnParticles(tree.x, tree.y - 20, '#ef4444', 12);
          this.addFloatingText(
            tree.x,
            tree.y - 36,
            `🍎 Shook ${count} Organic Apples! (+${appleGold}g)`,
            '#fca5a5'
          );
          this.advanceQuest('harvest_crops', 1);
          this.updateHUD();
        } else {
          this.addFloatingText(tree.x, tree.y - 30, 'Apples regrowing... 🌳', '#cbd5e1');
        }
        return;
      }
    }

    // 3. Check if clicked on Byte the Dog
    if (Math.hypot(this.dog.x - worldX, this.dog.y - worldY) < 36) {
      this.whistleDog();
      return;
    }

    // 4. Check if clicked on a Goose or Gosling
    for (const g of this.geese) {
      if (Math.hypot(g.x - worldX, g.y - worldY) < 38) {
        if (this.selectedTool === 'bell' || g.carriedLoot) {
          this.ringShooBell(g.x, g.y);
        } else {
          sfx.playHonk(g.pitch);
          g.flapTimer = 0.8;
          g.state = 'happy';
          g.stateTimer = 5.0;
          this.zenScore += 20;
          this.spawnParticles(g.x, g.y - 16, '#f43f5e', 10);
          this.addFloatingText(g.x, g.y - 30, `Pet ${g.name}! +20 Zen 💖`, '#fda4af');
          this.updateHUD();
        }
        return;
      }
    }

    // 5. Check Artisan Jam Press click
    const key = `${c},${r}`;
    if (this.jamPresses.has(key)) {
      const jp = this.jamPresses.get(key);
      if (jp.state === 'ready') {
        this.gold += jp.jamValue;
        this.zenScore += 35;
        jp.state = 'idle';
        sfx.playHarvest();
        this.spawnParticles(worldX, worldY, '#facc15', 14);
        this.addFloatingText(
          worldX,
          worldY - 24,
          `🍯 Collected Artisan Jam! (+${jp.jamValue}g)`,
          '#fde047'
        );
        this.advanceQuest('make_jam', 1);
        this.updateHUD();
      } else if (jp.state === 'idle') {
        jp.state = 'brewing';
        jp.timer = 10;
        jp.jamValue = 110;
        sfx.playSeed();
        this.addFloatingText(worldX, worldY - 20, '🍯 Brewing Artisan Gooseberry Jam...', '#fdba74');
      } else {
        this.addFloatingText(
          worldX,
          worldY - 20,
          `🍯 Brewing Jam (${Math.ceil(jp.timer)}s left)...`,
          '#fde68a'
        );
      }
      return;
    }

    if (this.selectedTool === 'bell') {
      this.ringShooBell(worldX, worldY);
      return;
    }

    const tileCenterX = (c + 0.5) * TILE_SIZE;
    const tileCenterY = (r + 0.5) * TILE_SIZE;
    const distToPlayer = Math.hypot(this.player.x - tileCenterX, this.player.y - tileCenterY);

    if (distToPlayer > TILE_SIZE * 3.0) {
      this.player.targetDest = { x: tileCenterX, y: tileCenterY, c, r, executeOnArrive: true };
    } else {
      this.useToolOnTile(c, r);
    }
  }

  useToolOnTile(c, r) {
    if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return;
    const key = `${c},${r}`;
    const tileType = this.tiles[r][c];
    const cx = (c + 0.5) * TILE_SIZE;
    const cy = (r + 0.5) * TILE_SIZE;

    this.player.swingTimer = 0.28;
    this.player.facing = cx >= this.player.x ? 1 : -1;

    if (this.selectedTool === 'hoe') {
      if (this.fences.has(key)) {
        this.fences.delete(key);
        sfx.playHoe();
        return;
      }
      if (tileType === 0) {
        this.tiles[r][c] = 2;
        sfx.playHoe();
        this.spawnParticles(cx, cy, '#78350f', 8);
      } else if (tileType === 2 && !this.crops.has(key)) {
        this.tiles[r][c] = 0;
        sfx.playHoe();
      }
    } else if (this.selectedTool === 'seeds') {
      if (tileType !== 2) {
        if (tileType === 0 && !this.fences.has(key)) {
          this.tiles[r][c] = 2;
        } else {
          this.addFloatingText(cx, cy, 'Plant on meadow grass or soil!', '#fca5a5');
          return;
        }
      }
      if (this.crops.has(key)) {
        this.addFloatingText(cx, cy, 'Plot already planted!', '#fde047');
        return;
      }
      const cropDef = CROPS[this.selectedCrop];
      if ((this.inventory[this.selectedCrop] || 0) <= 0) {
        if (this.gold >= cropDef.seedCost) {
          this.gold -= cropDef.seedCost;
          this.inventory[this.selectedCrop] = 1;
        } else {
          this.addFloatingText(cx, cy, `Need ${cropDef.seedCost}g for ${cropDef.name}!`, '#fca5a5');
          return;
        }
      }
      this.inventory[this.selectedCrop] -= 1;
      this.crops.set(key, {
        cropId: this.selectedCrop,
        progress: 0.06,
        watered: this.weather === 'rain',
      });
      sfx.playSeed();
      this.spawnParticles(cx, cy, '#4ade80', 7);
      this.addFloatingText(cx, cy - 14, `Planted ${cropDef.icon}`, '#86efac');
      this.updateHUD();
    } else if (this.selectedTool === 'water') {
      // Upgraded Cloud Watering Can waters a 3x3 area!
      sfx.playWater();
      let wateredCount = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const k = `${c + dc},${r + dr}`;
          const plot = this.crops.get(k);
          if (plot) {
            plot.watered = true;
            wateredCount++;
          }
          if (
            r + dr >= 0 &&
            r + dr < MAP_ROWS &&
            c + dc >= 0 &&
            c + dc < MAP_COLS &&
            this.tiles[r + dr][c + dc] === 2
          ) {
            this.spawnParticles(
              (c + dc + 0.5) * TILE_SIZE,
              (r + dr + 0.5) * TILE_SIZE,
              '#38bdf8',
              4
            );
          }
        }
      }
      this.addFloatingText(
        cx,
        cy - 16,
        wateredCount > 0 ? `Watered ${wateredCount} Crops! 💧` : 'Splash! 💧',
        '#7dd3fc'
      );
    } else if (this.selectedTool === 'basket') {
      const plot = this.crops.get(key);
      if (plot && plot.progress >= 1.0) {
        const cropDef = CROPS[plot.cropId];
        this.crops.delete(key);
        this.gold += cropDef.sellPrice;
        this.zenScore += 25;
        sfx.playHarvest();
        this.spawnParticles(cx, cy, '#facc15', 14);
        this.addFloatingText(
          cx,
          cy - 20,
          `Harvested ${cropDef.icon} +${cropDef.sellPrice}g!`,
          '#fde047'
        );

        // If any Artisan Jam Press is idle, automatically load it with this harvest!
        for (const jp of this.jamPresses.values()) {
          if (jp.state === 'idle') {
            jp.state = 'brewing';
            jp.timer = 9;
            jp.jamValue = Math.round(cropDef.sellPrice * 2.2);
            jp.icon = cropDef.icon;
            break;
          }
        }

        this.advanceQuest('harvest_crops', 1);
        this.updateHUD();
      }
    } else if (this.selectedTool === 'fence') {
      if (tileType === 1 || tileType === 4 || this.fences.has(key)) return;
      if (this.gold < 15) {
        this.addFloatingText(cx, cy, 'Need 15g for Firewall Fence!', '#fca5a5');
        return;
      }
      this.gold -= 15;
      this.fences.set(key, { hp: 3 });
      sfx.playHoe();
      this.spawnParticles(cx, cy, '#d97706', 8);
      this.addFloatingText(cx, cy - 14, 'Firewall Fence Built! 🪵', '#fde68a');
      this.advanceQuest('defend_farm', 1);
      this.updateHUD();
    } else if (this.selectedTool === 'scarecrow') {
      if (tileType === 1 || tileType === 4 || this.scarecrows.has(key)) return;
      if (this.gold < 65) {
        this.addFloatingText(cx, cy, 'Need 65g for Linter Scarecrow!', '#fca5a5');
        return;
      }
      this.gold -= 65;
      this.scarecrows.set(key, { c, r, pulse: 0 });
      sfx.playHarvest();
      this.spawnParticles(cx, cy, '#f97316', 12);
      this.addFloatingText(cx, cy - 18, '🎃 Linter Scarecrow Deployed!', '#fdba74');
      this.advanceQuest('defend_farm', 2);
      this.updateHUD();
    } else if (this.selectedTool === 'jam_press') {
      if (tileType === 1 || tileType === 4 || this.jamPresses.has(key)) return;
      if (this.gold < 110) {
        this.addFloatingText(cx, cy, 'Need 110g for Artisan Jam Press!', '#fca5a5');
        return;
      }
      this.gold -= 110;
      this.jamPresses.set(key, {
        c,
        r,
        state: 'brewing',
        timer: 8,
        jamValue: 115,
        icon: '🍓',
      });
      sfx.playHarvest();
      this.spawnParticles(cx, cy, '#ec4899', 14);
      this.addFloatingText(cx, cy - 18, '🍯 Artisan Jam Press Built!', '#f9a8d4');
      this.advanceQuest('make_jam', 2);
      this.updateHUD();
    }
  }

  ringShooBell(originX = this.player.x, originY = this.player.y) {
    sfx.playBell();
    this.shockwaves.push({ x: originX, y: originY, radius: 12, alpha: 0.95 });

    let count = 0;
    this.geese.forEach((g) => {
      if (Math.hypot(g.x - originX, g.y - originY) < 260) {
        count++;
        sfx.playHonk(g.pitch * 1.15);
        g.flapTimer = 1.0;
        g.state = 'flee';
        g.stateTimer = 3.5;
        const angle = Math.atan2(g.y - originY, g.x - originX);
        g.targetX = g.x + Math.cos(angle) * 280;
        g.targetY = g.y + Math.sin(angle) * 280;

        if (g.carriedLoot) {
          this.dropGooseLoot(g);
          this.advanceQuest('bark_or_bell', 1);
        }
      }
    });

    if (count > 0) {
      this.addFloatingText(originX, originY - 32, `🔔 SHOO! Startled ${count} Geese!`, '#fde047');
    }
  }

  dropGooseLoot(goose) {
    const loot = goose.carriedLoot;
    if (!loot) return;
    goose.carriedLoot = null;

    if (loot.type === 'shiny') {
      loot.ref.carriedBy = null;
      loot.ref.x = goose.x;
      loot.ref.y = goose.y + 14;
      this.addFloatingText(
        goose.x,
        goose.y - 26,
        `Recovered ${loot.ref.icon} ${loot.ref.name}!`,
        '#4ade80'
      );
    } else if (loot.type === 'crop') {
      this.gold += loot.sellPrice;
      this.addFloatingText(
        goose.x,
        goose.y - 26,
        `Saved Stolen ${loot.icon} (+${loot.sellPrice}g)!`,
        '#4ade80'
      );
      this.updateHUD();
    }
  }

  tossBreadcrumb(x, y) {
    sfx.playSeed();
    this.crumbs.push({ x, y, life: 15 });
    this.addFloatingText(x, y - 16, 'Tossed Sourdough Breadcrumb 🥖', '#fde68a');
    this.advanceQuest('feed_goslings', 1);
    this.geese.forEach((g) => {
      if (Math.hypot(g.x - x, g.y - y) < 350 && !g.carriedLoot) {
        g.state = 'eat_crumb';
        g.targetX = x;
        g.targetY = y;
      }
    });
  }

  spawnGoldenEgg(x, y) {
    if (this.eggs.length >= 15) return;
    sfx.playSeed();
    this.eggs.push({ x, y, bob: Math.random() * 6 });
    this.addFloatingText(x, y - 22, 'Golden Egg Laid! 🥚✨', '#facc15');
  }

  collectEgg(index) {
    const egg = this.eggs[index];
    if (!egg) return;
    this.eggs.splice(index, 1);
    this.gold += 55;
    this.zenScore += 35;
    sfx.playHarvest();
    this.spawnParticles(egg.x, egg.y, '#facc15', 14);
    this.addFloatingText(egg.x, egg.y - 22, '+55g Golden Egg! 🥚✨', '#fde047');
    this.advanceQuest('make_jam', 1);
    this.updateHUD();
  }

  advanceQuest(questId, amount = 1) {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || q.done) return;
    q.progress = Math.min(q.target, q.progress + amount);
    if (q.progress >= q.target) {
      q.done = true;
      this.gold += q.reward;
      this.zenScore += 60;
      sfx.playHarvest();
      confetti({ particleCount: 55, spread: 70, origin: { y: 0.65 } });
      this.addFloatingText(
        this.player.x,
        this.player.y - 42,
        `🎉 QUEST COMPLETE! +${q.reward}g`,
        '#4ade80'
      );
    }
    this.renderQuests();
    this.updateHUD();
  }

  initDOMUI() {
    const hotbar = document.getElementById('tool-hotbar');
    hotbar.innerHTML = '';
    TOOLS.forEach((t) => {
      const btn = document.createElement('button');
      btn.className = `tool-slot ${t.id === this.selectedTool ? 'active' : ''}`;
      btn.dataset.tool = t.id;
      btn.title = t.desc;
      btn.innerHTML = `
        <span class="slot-key">${t.key}</span>
        <span class="slot-icon">${t.icon}</span>
        <span class="slot-name">${t.name}</span>
      `;
      btn.addEventListener('click', () => this.selectTool(t.id));
      hotbar.appendChild(btn);
    });

    this.renderSeedBar();
    this.renderQuests();

    // Weather / Atmosphere Buttons
    document.querySelectorAll('[data-weather]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-weather]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.weather = btn.dataset.weather;
        if (this.weather === 'rain') {
          // Rain automatically waters all planted crops!
          this.crops.forEach((plot) => {
            plot.watered = true;
          });
          this.addFloatingText(
            this.player.x,
            this.player.y - 30,
            '🌧️ Cozy Rain Shower! All crops watered!',
            '#7dd3fc'
          );
        }
      });
    });

    // Buy Cloud Sprinkler
    document.getElementById('btn-buy-sprinkler').addEventListener('click', () => {
      if (this.gold < 85) {
        this.addFloatingText(this.player.x, this.player.y - 25, 'Need 85g for Cloud Sprinkler!', '#fca5a5');
        return;
      }
      const pc = Math.floor(this.player.x / TILE_SIZE);
      const pr = Math.floor(this.player.y / TILE_SIZE);
      this.gold -= 85;
      this.sprinklers.set(`${pc},${pr}`, { c: pc, r: pr, timer: 0, angle: 0 });
      sfx.playHarvest();
      this.addFloatingText(this.player.x, this.player.y - 30, '💦 Placed 3x3 Auto-Sprinkler!', '#38bdf8');
      this.updateHUD();
    });

    // Whistle Dog button
    document.getElementById('btn-whistle-dog').addEventListener('click', () => {
      this.whistleDog();
    });

    // Adopt Goose + Gosling Family button
    document.getElementById('btn-adopt-goose').addEventListener('click', () => {
      if (this.gold < 80) {
        this.addFloatingText(this.player.x, this.player.y - 25, 'Need 80g to adopt a Goose Family!', '#fca5a5');
        return;
      }
      this.gold -= 80;
      const prof = GOOSE_PROFILES[this.geese.length % GOOSE_PROFILES.length];
      const gx = 24 * TILE_SIZE;
      const gy = 13 * TILE_SIZE;
      const newGoose = {
        id: 'goose_' + Date.now(),
        ...prof,
        name: `${prof.name}_${this.geese.length + 1}`,
        x: gx,
        y: gy,
        facing: -1,
        state: 'wander',
        stateTimer: 1.5,
        targetX: 16 * TILE_SIZE,
        targetY: 11 * TILE_SIZE,
        carriedLoot: null,
        walkPhase: 0,
        flapTimer: 0.9,
        eggTimer: 15,
      };
      this.geese.push(newGoose);

      // Add 2 cute baby goslings trailing behind the new goose!
      let leader = newGoose;
      for (let k = 0; k < 2; k++) {
        const gosling = {
          id: `gosling_${Date.now()}_${k}`,
          leader,
          x: gx + (k + 1) * 26,
          y: gy + (k + 1) * 14,
          facing: -1,
          walkPhase: k,
        };
        this.goslings.push(gosling);
        leader = gosling;
      }

      sfx.playHonk(1.12);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      this.addFloatingText(
        this.player.x,
        this.player.y - 32,
        `🪿🐣 Adopted ${newGoose.name} + 2 Baby Goslings!`,
        '#fde047'
      );
      this.updateHUD();
    });

    document.getElementById('btn-mute').addEventListener('click', (e) => {
      const muted = sfx.toggleMute();
      e.currentTarget.textContent = muted ? '🔇 Muted' : '🔊 Audio On';
    });
  }

  renderSeedBar() {
    const bar = document.getElementById('seed-selector');
    bar.innerHTML = '';
    Object.values(CROPS).forEach((c) => {
      const count = this.inventory[c.id] || 0;
      const chip = document.createElement('button');
      chip.className = `seed-chip ${this.selectedCrop === c.id ? 'active' : ''}`;
      chip.dataset.crop = c.id;
      chip.innerHTML = `
        <span>${c.icon} ${c.name}</span>
        <small>${count > 0 ? `In Bag: ${count}` : `Auto-Buy: ${c.seedCost}g`} → Sell: ${c.sellPrice}g</small>
      `;
      chip.addEventListener('click', () => {
        this.selectCrop(c.id);
        this.selectTool('seeds');
      });
      bar.appendChild(chip);
    });
  }

  renderQuests() {
    const list = document.getElementById('quest-list');
    list.innerHTML = '';
    this.quests.forEach((q) => {
      const li = document.createElement('div');
      li.className = `quest-item ${q.done ? 'done' : ''}`;
      li.innerHTML = `
        <span class="quest-check">${q.done ? '✅' : '⬜'}</span>
        <div class="quest-body">
          <p>${q.text}</p>
          <small>${q.progress}/${q.target} • Reward: +${q.reward}g</small>
        </div>
      `;
      list.appendChild(li);
    });
  }

  updateHUD() {
    document.getElementById('hud-gold').textContent = `${this.gold}g`;
    document.getElementById('hud-zen').textContent = this.zenScore;
    document.getElementById('hud-geese').textContent = `${this.geese.length} + ${this.goslings.length}🐣`;
    this.renderSeedBar();
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 25,
        color,
        life: 0.55 + Math.random() * 0.25,
      });
    }
  }

  addFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({ x, y, text, color, life: 1.4 });
  }

  update(dt, nowSec) {
    // 1. Update Farmer Movement
    let moveX = 0;
    let moveY = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      this.player.targetDest = null;
      const mag = Math.hypot(moveX, moveY);
      this.player.vx = (moveX / mag) * this.player.speed;
      this.player.vy = (moveY / mag) * this.player.speed;
      if (moveX !== 0) this.player.facing = moveX > 0 ? 1 : -1;
      this.player.walkCycle += dt * 13;
    } else if (this.player.targetDest) {
      const dx = this.player.targetDest.x - this.player.x;
      const dy = this.player.targetDest.y - this.player.y;
      const d = Math.hypot(dx, dy);
      if (d < TILE_SIZE * 1.4) {
        if (this.player.targetDest.executeOnArrive) {
          this.useToolOnTile(this.player.targetDest.c, this.player.targetDest.r);
        }
        this.player.targetDest = null;
        this.player.vx = 0;
        this.player.vy = 0;
      } else {
        this.player.vx = (dx / d) * this.player.speed;
        this.player.vy = (dy / d) * this.player.speed;
        this.player.facing = dx >= 0 ? 1 : -1;
        this.player.walkCycle += dt * 13;
      }
    } else {
      this.player.vx = 0;
      this.player.vy = 0;
    }

    const nextX = this.player.x + this.player.vx * dt;
    const nextY = this.player.y + this.player.vy * dt;
    const tc = Math.floor(nextX / TILE_SIZE);
    const tr = Math.floor(nextY / TILE_SIZE);
    if (
      tc >= 0 &&
      tc < MAP_COLS &&
      tr >= 0 &&
      tr < MAP_ROWS &&
      this.tiles[tr][tc] !== 1 // Walk on bridges (5), grass (0), sand (6), paths (3), soil (2)
    ) {
      this.player.x = nextX;
      this.player.y = nextY;
    }

    if (this.player.swingTimer > 0) this.player.swingTimer -= dt;

    // Camera follow
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    const maxCamX = Math.max(0, MAP_COLS * TILE_SIZE - this.canvas.width);
    const maxCamY = Math.max(0, MAP_ROWS * TILE_SIZE - this.canvas.height);
    this.camera.x += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.camera.x) * Math.min(1, dt * 8);
    this.camera.y += (Math.max(0, Math.min(maxCamY, targetCamY)) - this.camera.y) * Math.min(1, dt * 8);

    // 2. Update "Byte" the Loyal Border Collie Sheepdog AI!
    this.updateDogAI(dt);

    // 3. Update Sprinklers, Scarecrows, Jam Presses & Orchard Trees
    this.sprinklers.forEach((sp) => {
      sp.angle += dt * 5;
      sp.timer += dt;
      if (sp.timer >= 2.5) {
        sp.timer = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const k = `${sp.c + dc},${sp.r + dr}`;
            const plot = this.crops.get(k);
            if (plot) plot.watered = true;
          }
        }
        this.spawnParticles((sp.c + 0.5) * TILE_SIZE, (sp.r + 0.5) * TILE_SIZE, '#38bdf8', 5);
      }
    });

    this.jamPresses.forEach((jp) => {
      if (jp.state === 'brewing') {
        jp.timer -= dt;
        if (jp.timer <= 0) {
          jp.state = 'ready';
          this.spawnParticles((jp.c + 0.5) * TILE_SIZE, (jp.r + 0.5) * TILE_SIZE, '#facc15', 10);
        }
      }
    });

    this.trees.forEach((tree) => {
      if (tree.shakeTimer > 0) tree.shakeTimer -= dt;
      if (tree.apples === 0) {
        tree.regrowTimer -= dt;
        if (tree.regrowTimer <= 0) tree.apples = 3;
      }
    });

    // 4. Update Crops Growth
    this.crops.forEach((plot) => {
      if (this.weather === 'rain') plot.watered = true;
      if (plot.progress < 1.0) {
        const def = CROPS[plot.cropId];
        const rate = plot.watered ? 1 / def.growTime : 0.3 / def.growTime;
        plot.progress = Math.min(1.0, plot.progress + rate * dt);
      }
    });

    // 5. Update Geese & Gosling Family Trains
    this.updateGeeseAndGoslings(dt, nowSec);

    // 6. Update Koi Fish, Butterflies & Rain
    this.koiFish.forEach((fish) => {
      fish.angle += (Math.random() - 0.5) * dt * 2.2;
      const nx = fish.x + Math.cos(fish.angle) * fish.speed * dt;
      const ny = fish.y + Math.sin(fish.angle) * fish.speed * dt;
      const fc = Math.floor(nx / TILE_SIZE);
      const fr = Math.floor(ny / TILE_SIZE);
      if (fc >= 0 && fc < MAP_COLS && fr >= 0 && fr < MAP_ROWS && this.tiles[fr][fc] === 1) {
        fish.x = nx;
        fish.y = ny;
      } else {
        fish.angle += Math.PI * 0.8;
      }
    });

    this.butterflies.forEach((b) => {
      b.phase += dt * 12;
      b.x += b.vx * dt;
      b.y += b.vy * dt + Math.sin(b.phase) * 0.4;
      if (b.x < 2 * TILE_SIZE || b.x > (MAP_COLS - 2) * TILE_SIZE) b.vx *= -1;
      if (b.y < 2 * TILE_SIZE || b.y > (MAP_ROWS - 2) * TILE_SIZE) b.vy *= -1;
    });

    if (this.weather === 'rain') {
      this.rainDrops.forEach((rd) => {
        rd.y += rd.speed * dt;
        rd.x -= 85 * dt;
        if (rd.y > MAP_ROWS * TILE_SIZE) {
          rd.y = 0;
          rd.x = Math.random() * MAP_COLS * TILE_SIZE;
          if (Math.random() < 0.25) {
            this.waterRipples.push({
              x: rd.x,
              y: Math.random() * MAP_ROWS * TILE_SIZE,
              r: 2,
              alpha: 0.7,
            });
          }
        }
      });
    }

    // 7. Update Ripples, Particles, Shockwaves & Floating Texts
    for (let i = this.waterRipples.length - 1; i >= 0; i--) {
      const rp = this.waterRipples[i];
      rp.r += dt * 28;
      rp.alpha -= dt * 1.1;
      if (rp.alpha <= 0) this.waterRipples.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += dt * 450;
      sw.alpha -= dt * 1.8;
      if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 34;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  updateDogAI(dt) {
    if (this.dog.barkTimer > 0) this.dog.barkTimer -= dt;

    // Detect if Byte the Dog is swimming in the Lake or River!
    const dc = Math.floor(this.dog.x / TILE_SIZE);
    const dr = Math.floor(this.dog.y / TILE_SIZE);
    const dogInWater =
      dc >= 0 && dc < MAP_COLS && dr >= 0 && dr < MAP_ROWS && this.tiles[dr][dc] === 1;

    if (dogInWater && !this.dog.inWater) {
      // Byte just splashed into the water!
      sfx.playWater();
      this.spawnParticles(this.dog.x, this.dog.y + 4, '#e0f2fe', 10);
      this.spawnParticles(this.dog.x, this.dog.y + 4, '#38bdf8', 8);
      this.waterRipples.push({ x: this.dog.x, y: this.dog.y + 6, r: 7, alpha: 0.95, thick: true });
      this.waterRipples.push({ x: this.dog.x, y: this.dog.y + 6, r: 16, alpha: 0.65, thick: false });
    }
    this.dog.inWater = dogInWater;

    if (dogInWater) {
      this.dog.rippleTimer = (this.dog.rippleTimer || 0) - dt;
      if (this.dog.rippleTimer <= 0) {
        this.dog.rippleTimer = 0.22;
        this.waterRipples.push({
          x: this.dog.x - this.dog.facing * 8,
          y: this.dog.y + 5,
          r: 8,
          alpha: 0.85,
          thick: true,
        });
      }
    }

    // Look for any goose that is stealing loot or sneaking into the garden!
    let culprit = this.geese.find(
      (g) => g.carriedLoot || g.state === 'sneak_crop' || g.state === 'sneak_shiny'
    );

    let targetX = this.player.x - this.player.facing * 58;
    let targetY = this.player.y + 24;
    let speed = 195;

    if (culprit) {
      targetX = culprit.x;
      targetY = culprit.y;
      speed = 250;
      if (Math.hypot(this.dog.x - culprit.x, this.dog.y - culprit.y) < 42) {
        // Byte intercepts the sneaky goose!
        this.dog.barkTimer = 0.8;
        sfx.playHonk(culprit.pitch * 1.2);
        if (culprit.carriedLoot) {
          this.dropGooseLoot(culprit);
          this.advanceQuest('bark_or_bell', 1);
        }
        culprit.state = 'flee';
        culprit.stateTimer = 4.0;
        culprit.targetX = 27 * TILE_SIZE;
        culprit.targetY = 14 * TILE_SIZE;
        this.addFloatingText(this.dog.x, this.dog.y - 28, '🐶 WOOF! Byte guarded the farm!', '#38bdf8');
      }
    }

    // Slow down dog movement speed when doggy-paddling in the lake! (52% speed in water)
    const waterSpeedFactor = dogInWater ? 0.52 : 1.0;
    const effectiveDogSpeed = speed * waterSpeedFactor;

    const dx = targetX - this.dog.x;
    const dy = targetY - this.dog.y;
    const d = Math.hypot(dx, dy);
    if (d > 16) {
      this.dog.x += (dx / d) * effectiveDogSpeed * dt;
      this.dog.y += (dy / d) * effectiveDogSpeed * dt;
      this.dog.facing = dx >= 0 ? 1 : -1;
      this.dog.walkCycle += dt * (dogInWater ? 9 : 15);
    }
  }

  updateGeeseAndGoslings(dt) {
    this.geese.forEach((g) => {
      if (g.flapTimer > 0) g.flapTimer -= dt;

      // Detect entering/swimming in the Lake & River
      const gc = Math.floor(g.x / TILE_SIZE);
      const gr = Math.floor(g.y / TILE_SIZE);
      const inWater =
        gc >= 0 && gc < MAP_COLS && gr >= 0 && gr < MAP_ROWS && this.tiles[gr][gc] === 1;

      if (inWater && !g.inWater) {
        // Just splashed into the lake!
        sfx.playWater();
        this.spawnParticles(g.x, g.y + 4, '#e0f2fe', 10);
        this.spawnParticles(g.x, g.y + 4, '#38bdf8', 8);
        this.waterRipples.push({ x: g.x, y: g.y + 6, r: 6, alpha: 0.95, thick: true });
        this.waterRipples.push({ x: g.x, y: g.y + 6, r: 16, alpha: 0.65, thick: false });
      }
      g.inWater = inWater;

      if (inWater) {
        g.rippleTimer = (g.rippleTimer || 0) - dt;
        if (g.rippleTimer <= 0) {
          g.rippleTimer = 0.22; // Continuous trailing wake waves!
          this.waterRipples.push({
            x: g.x - g.facing * 8,
            y: g.y + 6,
            r: 8,
            alpha: 0.85,
            thick: true,
          });
        }
      }

      // Lay Golden Eggs periodically
      g.eggTimer -= dt;
      if (g.eggTimer <= 0) {
        g.eggTimer = 24 + Math.random() * 18;
        if (!inWater) this.spawnGoldenEgg(g.x, g.y);
      }

      // Check Linter Scarecrow protection radius!
      if (g.state === 'sneak_crop') {
        for (const sc of this.scarecrows.values()) {
          const scX = (sc.c + 0.5) * TILE_SIZE;
          const scY = (sc.r + 0.5) * TILE_SIZE;
          if (Math.hypot(g.x - scX, g.y - scY) < TILE_SIZE * 3.4) {
            sc.pulse = 1.0;
            sfx.playHonk(g.pitch);
            g.state = 'flee';
            g.stateTimer = 3.0;
            g.targetX = 25 * TILE_SIZE;
            g.targetY = 13 * TILE_SIZE;
            this.addFloatingText(scX, scY - 26, '🎃 Linter Scarecrow Repelled Goose!', '#fdba74');
            break;
          }
        }
      }

      // Check Breadcrumbs
      if (this.crumbs.length > 0 && g.state !== 'flee' && !g.carriedLoot) {
        const crumb = this.crumbs[0];
        g.state = 'eat_crumb';
        g.targetX = crumb.x;
        g.targetY = crumb.y;
        if (Math.hypot(g.x - crumb.x, g.y - crumb.y) < 26) {
          this.crumbs.shift();
          sfx.playHonk(g.pitch);
          g.flapTimer = 0.6;
          g.state = 'happy';
          g.stateTimer = 5.0;
          this.spawnGoldenEgg(g.x, g.y);
        }
      }

      g.stateTimer -= dt;
      if (g.stateTimer <= 0) {
        if (g.carriedLoot) {
          g.targetX = 26.5 * TILE_SIZE;
          g.targetY = 14.5 * TILE_SIZE;
          g.stateTimer = 3.0;
        } else {
          const roll = Math.random();
          if (roll < 0.34 && this.crops.size > 0) {
            const keys = Array.from(this.crops.keys());
            const targetKey = keys[Math.floor(Math.random() * keys.length)];
            const [tc, tr] = targetKey.split(',').map(Number);
            g.state = 'sneak_crop';
            g.targetKey = targetKey;
            g.targetX = (tc + 0.5) * TILE_SIZE;
            g.targetY = (tr + 0.5) * TILE_SIZE;
            g.stateTimer = 6.0;
          } else if (roll < 0.58) {
            const freeShiny = this.shinyItems.filter((s) => !s.carriedBy);
            if (freeShiny.length > 0) {
              const targetS = freeShiny[Math.floor(Math.random() * freeShiny.length)];
              g.state = 'sneak_shiny';
              g.targetShiny = targetS;
              g.targetX = targetS.x;
              g.targetY = targetS.y;
              g.stateTimer = 6.0;
            }
          } else {
            g.state = 'wander';
            g.targetX = (6 + Math.random() * 24) * TILE_SIZE;
            g.targetY = (5 + Math.random() * 14) * TILE_SIZE;
            g.stateTimer = 3.5 + Math.random() * 3.5;
          }
        }
      }

      const dx = g.targetX - g.x;
      const dy = g.targetY - g.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        let dirX = dx / dist;
        let dirY = dy / dist;

        // Flock separation steering
        this.geese.forEach((other) => {
          if (other === g) return;
          const ox = g.x - other.x;
          const oy = g.y - other.y;
          const od = Math.hypot(ox, oy);
          if (od > 0.1 && od < 64) {
            const repel = ((64 - od) / 64) * 1.5;
            dirX += (ox / od) * repel;
            dirY += (oy / od) * repel;
          }
        });

        const mag = Math.hypot(dirX, dirY) || 1;
        dirX /= mag;
        dirY /= mag;

        // Slow down geese when swimming in the lake! (58% speed in water)
        const baseMult = g.state === 'flee' ? 1.55 : g.carriedLoot ? 1.15 : 1.0;
        const waterMult = inWater ? 0.58 : 1.0;
        const step = g.speed * baseMult * waterMult * dt;
        const nextX = g.x + dirX * step;
        const nextY = g.y + dirY * step;

        const nextKey = `${Math.floor(nextX / TILE_SIZE)},${Math.floor(nextY / TILE_SIZE)}`;
        if (this.fences.has(nextKey)) {
          sfx.playHonk(g.pitch);
          g.state = 'wander';
          g.targetX = g.x - dirX * 150;
          g.targetY = g.y - dirY * 150;
          this.addFloatingText(nextX, nextY - 16, '🪵 Blocked by Firewall Fence!', '#fde68a');
        } else {
          g.x = nextX;
          g.y = nextY;
          g.facing = dirX >= 0 ? 1 : -1;
          g.walkPhase += dt * (inWater ? 7 : 12);
        }
      }

      // Steal crop check
      if (g.state === 'sneak_crop' && g.targetKey && this.crops.has(g.targetKey)) {
        if (dist < 28) {
          const plot = this.crops.get(g.targetKey);
          const cropDef = CROPS[plot.cropId];
          this.crops.delete(g.targetKey);
          g.carriedLoot = {
            type: 'crop',
            icon: cropDef.icon,
            sellPrice: cropDef.sellPrice,
          };
          sfx.playHonk(g.pitch);
          g.flapTimer = 0.8;
          g.targetX = 26.5 * TILE_SIZE;
          g.targetY = 14.5 * TILE_SIZE;
          this.addFloatingText(
            g.x,
            g.y - 28,
            `🪿 Stole ${cropDef.icon}! Press [Space] or [F]!`,
            '#f87171'
          );
        }
      }

      // Steal shiny gadget check
      if (g.state === 'sneak_shiny' && g.targetShiny && !g.targetShiny.carriedBy) {
        if (Math.hypot(g.x - g.targetShiny.x, g.y - g.targetShiny.y) < 28) {
          g.targetShiny.carriedBy = g;
          g.carriedLoot = {
            type: 'shiny',
            icon: g.targetShiny.icon,
            ref: g.targetShiny,
          };
          sfx.playHonk(g.pitch);
          g.flapTimer = 0.8;
          g.targetX = 26.5 * TILE_SIZE;
          g.targetY = 14.5 * TILE_SIZE;
          this.addFloatingText(
            g.x,
            g.y - 28,
            `🪿 Stole ${g.targetShiny.icon}! Press [Space] or [F]!`,
            '#fb923c'
          );
        }
      }

      if (g.carriedLoot && g.carriedLoot.type === 'shiny') {
        g.carriedLoot.ref.x = g.x + g.facing * 22;
        g.carriedLoot.ref.y = g.y - 14;
      }
    });

    // Hard Pairwise Circle Collision Solver for Geese
    const minGooseDist = 48;
    for (let iter = 0; iter < 3; iter++) {
      for (let i = 0; i < this.geese.length; i++) {
        for (let j = i + 1; j < this.geese.length; j++) {
          const g1 = this.geese[i];
          const g2 = this.geese[j];
          let dx = g2.x - g1.x;
          let dy = g2.y - g1.y;
          let d = Math.hypot(dx, dy);
          if (d < minGooseDist) {
            if (d < 0.01) {
              dx = 1;
              dy = 0;
              d = 1;
            }
            const push = (minGooseDist - d) * 0.5;
            g1.x -= (dx / d) * push;
            g1.y -= (dy / d) * push;
            g2.x += (dx / d) * push;
            g2.y += (dy / d) * push;
          }
        }
      }
    }

    // Update Trailing Baby Goslings (Follow their parent or sibling in a cute line, slowing down in water!)
    this.goslings.forEach((baby) => {
      const bc = Math.floor(baby.x / TILE_SIZE);
      const br = Math.floor(baby.y / TILE_SIZE);
      baby.inWater =
        bc >= 0 && bc < MAP_COLS && br >= 0 && br < MAP_ROWS && this.tiles[br][bc] === 1;

      const dx = baby.leader.x - baby.x;
      const dy = baby.leader.y - baby.y;
      const d = Math.hypot(dx, dy);
      if (d > 30) {
        const goslingSpeed = baby.inWater ? 68 : 115;
        const step = Math.min(d - 28, goslingSpeed * dt);
        baby.x += (dx / d) * step;
        baby.y += (dy / d) * step;
        baby.facing = dx >= 0 ? 1 : -1;
        baby.walkPhase += dt * (baby.inWater ? 9 : 16);

        if (baby.inWater && Math.random() < 0.14) {
          this.waterRipples.push({ x: baby.x, y: baby.y + 4, r: 5, alpha: 0.7, thick: false });
        }
      }
    });
  }

  render() {
    const ctx = this.ctx;
    const nowSec = performance.now() / 1000;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // 1. Draw Rich Multi-Biome Terrain
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const t = this.tiles[r][c];

        // Base Lush Grass
        ctx.fillStyle = (c + r) % 2 === 0 ? '#5c9c14' : '#538d10';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        if (t === 1) {
          // Shimmering Water
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          // Animated water wave glint
          const waveOffset = Math.sin(nowSec * 2.5 + c + r) * 6;
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 12 + waveOffset, y + 26);
          ctx.lineTo(x + 34 + waveOffset, y + 26);
          ctx.stroke();
        } else if (t === 6) {
          // Sandy Lake Shore
          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4, 10);
          ctx.fill();
        } else if (t === 5) {
          // Wooden Bridge / Dock Over Water
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(x, y + 4, TILE_SIZE, TILE_SIZE - 8);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          for (let px = 8; px < TILE_SIZE; px += 12) {
            ctx.beginPath();
            ctx.moveTo(x + px, y + 4);
            ctx.lineTo(x + px, y + TILE_SIZE - 4);
            ctx.stroke();
          }
        } else if (t === 2) {
          // Rich Tilled Soil Plot
          const key = `${c},${r}`;
          const plot = this.crops.get(key);
          ctx.fillStyle = plot && plot.watered ? '#3b1506' : '#713f12';
          ctx.beginPath();
          ctx.roundRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8, 9);
          ctx.fill();
          ctx.strokeStyle = plot && plot.watered ? '#1e0a02' : '#854d0e';
          ctx.lineWidth = 2;
          ctx.stroke();

          if (plot) {
            this.drawCropPlot(ctx, x + TILE_SIZE / 2, y + TILE_SIZE / 2, plot, nowSec);
          }
        } else if (t === 3) {
          // Cobblestone Path Stones
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.roundRect(x + 7, y + 7, 20, 18, 6);
          ctx.roundRect(x + 30, y + 9, 19, 17, 6);
          ctx.roundRect(x + 10, y + 29, 22, 19, 6);
          ctx.roundRect(x + 34, y + 30, 15, 17, 6);
          ctx.fill();
        }
      }
    }

    // 2. Draw Meadow Wildflowers & Clover Tufts
    this.grassDecor.forEach((d) => {
      if (d.type === 'flower') {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#84cc16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 3, d.y - 5);
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 3, d.y - 5);
        ctx.stroke();
      }
    });

    // 3. Draw Swimming Koi Fish & Water Ripples in Lake
    this.koiFish.forEach((fish) => {
      ctx.save();
      ctx.translate(fish.x, fish.y);
      ctx.rotate(fish.angle);
      ctx.fillStyle = fish.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-14, -4);
      ctx.lineTo(-14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    this.waterRipples.forEach((rp) => {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${rp.alpha * 0.9})`;
      ctx.lineWidth = rp.thick ? 2.6 : 1.8;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.58, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary inner cyan wave ring
      if (rp.r > 10) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${rp.alpha * 0.55})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r * 0.65, rp.r * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 4. Draw Hovered Tile Cursor
    if (
      this.hoverTile.c >= 0 &&
      this.hoverTile.c < MAP_COLS &&
      this.hoverTile.r >= 0 &&
      this.hoverTile.r < MAP_ROWS
    ) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        this.hoverTile.c * TILE_SIZE + 2,
        this.hoverTile.r * TILE_SIZE + 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4
      );
    }

    // 5. Draw Cozy Retirement Cottage + Spinning Dutch Windmill + Wooden Rowboat
    this.drawCozyCottage(ctx, 7 * TILE_SIZE, 3.2 * TILE_SIZE, nowSec);
    this.drawDutchWindmill(ctx, 20.5 * TILE_SIZE, 4.8 * TILE_SIZE, nowSec);
    this.drawRowboat(ctx, 23.2 * TILE_SIZE, 14.3 * TILE_SIZE, nowSec);

    // 6. Draw Fences, Sprinklers, Scarecrows & Artisan Jam Presses
    this.fences.forEach((_, key) => {
      const [c, r] = key.split(',').map(Number);
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 8, y + 10, 10, 38);
      ctx.fillRect(x + 38, y + 10, 10, 38);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + 4, y + 18, 48, 8);
      ctx.fillRect(x + 4, y + 32, 48, 8);
    });

    this.sprinklers.forEach((sp) => {
      const cx = (sp.c + 0.5) * TILE_SIZE;
      const cy = (sp.r + 0.5) * TILE_SIZE;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(sp.angle);
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.restore();
    });

    this.scarecrows.forEach((sc) => {
      const cx = (sc.c + 0.5) * TILE_SIZE;
      const cy = (sc.r + 0.5) * TILE_SIZE;
      // Subtle protection ring
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, TILE_SIZE * 3.4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎃', cx, cy + 8);
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = '#fed7aa';
      ctx.fillText('LINTER GUARD', cx, cy + 24);
    });

    this.jamPresses.forEach((jp) => {
      const cx = (jp.c + 0.5) * TILE_SIZE;
      const cy = (jp.r + 0.5) * TILE_SIZE;
      ctx.fillStyle = '#831843';
      ctx.beginPath();
      ctx.roundRect(cx - 20, cy - 18, 40, 36, 8);
      ctx.fill();
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🍯', cx, cy + 7);

      ctx.font = 'bold 10px Fredoka, sans-serif';
      ctx.fillStyle = jp.state === 'ready' ? '#4ade80' : '#fbcfe8';
      ctx.fillText(
        jp.state === 'ready' ? 'JAM READY! ✨' : jp.state === 'brewing' ? 'BREWING...' : 'IDLE',
        cx,
        cy - 22
      );
    });

    // 7. Draw Breadcrumbs, Golden Eggs & Shiny Gadgets
    this.crumbs.forEach((cr) => {
      ctx.font = '19px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🥖', cr.x, cr.y);
    });

    this.eggs.forEach((egg) => {
      const by = Math.sin(nowSec * 4 + egg.bob) * 3.5;
      ctx.save();
      ctx.translate(egg.x, egg.y + by);
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 13, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();
      ctx.restore();
    });

    this.shinyItems.forEach((item) => {
      if (item.carriedBy) return;
      ctx.font = '25px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, item.x, item.y);
    });

    // 8. Y-Sorted Living Entities (Player, Byte the Dog, Adult Geese, Baby Goslings, Orchard Trees)
    const entities = [
      { type: 'player', y: this.player.y, obj: this.player },
      { type: 'dog', y: this.dog.y, obj: this.dog },
      ...this.geese.map((g) => ({ type: 'goose', y: g.y, obj: g })),
      ...this.goslings.map((b) => ({ type: 'gosling', y: b.y, obj: b })),
      ...this.trees.map((t) => ({ type: 'tree', y: t.y, obj: t })),
    ].sort((a, b) => a.y - b.y);

    entities.forEach((ent) => {
      if (ent.type === 'player') this.drawFarmer(ctx, ent.obj, nowSec);
      else if (ent.type === 'dog') this.drawDog(ctx, ent.obj, nowSec);
      else if (ent.type === 'goose') this.drawGoose(ctx, ent.obj, nowSec);
      else if (ent.type === 'gosling') this.drawGosling(ctx, ent.obj, nowSec);
      else if (ent.type === 'tree') this.drawOrchardTree(ctx, ent.obj, nowSec);
    });

    // 9. Draw Lantern Posts & Fluttering Butterflies
    this.lanterns.forEach((lt) => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(lt.x - 3, lt.y - 34, 6, 36);
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(lt.x, lt.y - 36, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    this.butterflies.forEach((b) => {
      const wingSpan = 4 + Math.abs(Math.sin(b.phase)) * 4;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.ellipse(b.x - 3, b.y, wingSpan, 3.5, 0.3, 0, Math.PI * 2);
      ctx.ellipse(b.x + 3, b.y, wingSpan, 3.5, -0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 10. Draw Weather Overlay (Rain / Sunset / Starry Night + Warm Lantern Glow!)
    if (this.weather === 'rain') {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      this.rainDrops.forEach((rd) => {
        ctx.moveTo(rd.x, rd.y);
        ctx.lineTo(rd.x - 4, rd.y + rd.len);
      });
      ctx.stroke();
    }

    // 11. Draw Shockwaves, Particles & Floating Popups
    this.shockwaves.forEach((sw) => {
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(250, 204, 21, ${sw.alpha})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    this.floatingTexts.forEach((ft) => {
      ctx.font = 'bold 14px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.shadowBlur = 0;
    });

    ctx.restore();

    // Screen-Space Atmosphere Tint & Warm Lantern Halos for Sunset / Night
    if (this.weather === 'sunset' || this.weather === 'night') {
      ctx.save();
      ctx.fillStyle =
        this.weather === 'sunset' ? 'rgba(234, 88, 12, 0.18)' : 'rgba(15, 23, 42, 0.52)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Additive warm glow around lanterns and cottage windows
      ctx.globalCompositeOperation = 'lighter';
      this.lanterns.forEach((lt) => {
        const sx = lt.x - this.camera.x;
        const sy = lt.y - 36 - this.camera.y;
        const grad = ctx.createRadialGradient(sx, sy, 6, sx, sy, 125);
        grad.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
        grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, 125, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  drawCropPlot(ctx, cx, cy, plot, nowSec) {
    const def = CROPS[plot.cropId];
    const sway = Math.sin(nowSec * 3.5 + cx) * 2;
    if (plot.progress < 0.4) {
      ctx.fillStyle = def.leafColor;
      ctx.beginPath();
      ctx.arc(cx - 5 + sway, cy, 5, 0, Math.PI * 2);
      ctx.arc(cx + 5 + sway, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (plot.progress < 1.0) {
      ctx.fillStyle = def.leafColor;
      ctx.beginPath();
      ctx.arc(cx + sway, cy - 3, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = '#dcfce7';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(plot.progress * 100)}%`, cx, cy + 19);
    } else {
      ctx.font = '29px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(def.icon, cx + sway, cy + 8);
      ctx.font = 'bold 10px Fredoka, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('RIPE ✨', cx, cy - 16);
    }
  }

  drawCozyCottage(ctx, x, y, nowSec) {
    const w = 5.5 * TILE_SIZE;
    const h = 3.2 * TILE_SIZE;

    // Chimney & Puffs of Cozy Smoke
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + w - 65, y - 22, 26, 48);
    for (let i = 0; i < 3; i++) {
      const smokeT = (nowSec * 0.7 + i * 0.33) % 1;
      ctx.fillStyle = `rgba(248, 250, 252, ${(1 - smokeT) * 0.55})`;
      ctx.beginPath();
      ctx.arc(
        x + w - 52 + Math.sin(nowSec * 2 + i) * 8,
        y - 26 - smokeT * 48,
        8 + smokeT * 12,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 18, w, h, 12);
    ctx.fill();

    // Warm Cream Timber Walls
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.fillRect(x, y + 42, w, h - 42);
    ctx.strokeRect(x, y + 42, w, h - 42);

    // Glowing Windows
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 32, y + 72, 44, 38);
    ctx.strokeRect(x + 32, y + 72, 44, 38);
    ctx.fillRect(x + w - 76, y + 72, 44, 38);
    ctx.strokeRect(x + w - 76, y + 72, 44, 38);

    // Gable Shingle Roof
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 50);
    ctx.lineTo(x + w / 2, y - 16);
    ctx.lineTo(x + w + 16, y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arch Door
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(x + w / 2 - 22, y + h - 62, 44, 62, [16, 16, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏡 POST-IT RETIREMENT COTTAGE', x + w / 2, y + 34);
  }

  drawDutchWindmill(ctx, x, y, nowSec) {
    // Tower
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 32, y + 55);
    ctx.lineTo(x - 20, y - 45);
    ctx.lineTo(x + 20, y - 45);
    ctx.lineTo(x + 32, y + 55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dome
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x, y - 45, 22, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Rotating Sails
    ctx.save();
    ctx.translate(x, y - 35);
    ctx.rotate(nowSec * 1.1);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.fillRect(-5, 0, 10, 62);
      ctx.strokeRect(-5, 0, 10, 62);
    }
    ctx.restore();
  }

  drawRowboat(ctx, x, y, nowSec) {
    const bob = Math.sin(nowSec * 2.5) * 3;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawOrchardTree(ctx, tree, nowSec) {
    const shake = tree.shakeTimer > 0 ? Math.sin(nowSec * 55) * 6 : Math.sin(nowSec * 1.8 + tree.x) * 1.5;
    ctx.save();
    ctx.translate(tree.x + shake, tree.y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 26, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, -18, 16, 34);

    // Lush Canopy Puffs
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(-16, -34, 22, 0, Math.PI * 2);
    ctx.arc(16, -34, 22, 0, Math.PI * 2);
    ctx.arc(0, -50, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(-10, -38, 18, 0, Math.PI * 2);
    ctx.arc(12, -40, 18, 0, Math.PI * 2);
    ctx.arc(0, -52, 20, 0, Math.PI * 2);
    ctx.fill();

    // Ripe Red Apples on Tree (Click to shake!)
    if (tree.apples > 0) {
      const appleOffsets = [
        [-14, -36],
        [14, -34],
        [0, -52],
      ];
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < tree.apples; i++) {
        const [ax, ay] = appleOffsets[i];
        ctx.beginPath();
        ctx.arc(ax, ay, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawFarmer(ctx, p, nowSec = 0) {
    const isMoving = Math.hypot(p.vx, p.vy) > 5;
    const bob = isMoving ? Math.abs(Math.sin(p.walkCycle)) * 4.5 : Math.sin(nowSec * 3) * 1.5;
    const legSwing = isMoving ? Math.sin(p.walkCycle) * 6 : 0;
    const dir = p.facing;

    ctx.save();
    ctx.translate(p.x, p.y - bob);

    // Ground Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.beginPath();
    ctx.ellipse(0, 20 + bob, 18, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flowing Red Cozy Scarf (flutters behind farmer!)
    const scarfWave = Math.sin(nowSec * 7 + (isMoving ? p.walkCycle : 0)) * 4;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-dir * 6, -12);
    ctx.quadraticCurveTo(-dir * 22, -10 + scarfWave, -dir * 26, -2 + scarfWave);
    ctx.lineTo(-dir * 22, 4 + scarfWave);
    ctx.quadraticCurveTo(-dir * 14, -4 + scarfWave * 0.5, -dir * 4, -7);
    ctx.closePath();
    ctx.fill();

    // Brown Farmer Boots (animated walking stride!)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(-10 + legSwing, 10, 8, 10, 3);
    ctx.roundRect(2 - legSwing, 10, 8, 10, 3);
    ctx.fill();

    // Cozy Plaid Flannel Shirt Sleeves
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-16, -11, 32, 20, 8);
    ctx.fill();

    // Classic Blue Denim Overalls + Brass Buttons
    ctx.fillStyle = '#2563eb';
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-12, -8, 24, 22, 6);
    ctx.fill();
    ctx.stroke();

    // Overalls Straps & Golden Buttons
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-10, -13, 5, 8);
    ctx.fillRect(5, -13, 5, 8);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-7.5, -7, 2.2, 0, Math.PI * 2);
    ctx.arc(7.5, -7, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Neck & Scarf Collar
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-11, -15, 22, 6, 3);
    ctx.fill();

    // Joyful Expressive Head
    ctx.fillStyle = '#ffedd5';
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -24, 13.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rosy Happy Cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath();
    ctx.ellipse(dir * 9 - 5, -21, 3.2, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(dir * 2 + 6, -21, 3.2, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sparkling Joyful Eyes (with white shine!)
    const eyeCenterX = dir * 3;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeCenterX - 4.5, -25, 2.3, 0, Math.PI * 2);
    ctx.arc(eyeCenterX + 4.5, -25, 2.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeCenterX - 5.2, -25.8, 0.9, 0, Math.PI * 2);
    ctx.arc(eyeCenterX + 3.8, -25.8, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Big Cheerful Smile! :D
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(eyeCenterX, -20.5, 4.2, 0, Math.PI);
    ctx.fill();

    // Cute Green Leaf Sprout in mouth / side
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(dir * 7, -20);
    ctx.quadraticCurveTo(dir * 14, -22, dir * 16, -18);
    ctx.stroke();

    // Sunlit Straw Hat with Red Ribbon & Daisy Flower
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -34, 22, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(-11, -43, 22, 10, [6, 6, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Hat Red Ribbon
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-11, -36, 22, 3.5);

    // Daisy on Hat
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -38, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-8, -38, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Floating Whistling Musical Note when happy!
    const noteY = (nowSec * 18) % 16;
    const noteAlpha = 1 - noteY / 16;
    ctx.fillStyle = `rgba(254, 240, 138, ${noteAlpha * 0.85})`;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('♪', dir * 18 + Math.sin(nowSec * 4) * 4, -36 - noteY);

    // Active Tool in Hand
    const toolObj = TOOLS.find((t) => t.id === this.selectedTool);
    if (toolObj) {
      ctx.save();
      ctx.translate(dir * 19, -3);
      if (p.swingTimer > 0) {
        ctx.rotate(dir * Math.sin(p.swingTimer * 22) * 0.95);
      }
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(toolObj.icon, 0, 0);
      ctx.restore();
    }

    // Joyful Name Tag
    ctx.font = 'bold 11px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 4;
    ctx.fillText('😊 Retired Dev (0 Tickets!)', 0, 32 + bob);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  drawDog(ctx, d, nowSec) {
    const bounce = d.inWater
      ? Math.sin(nowSec * 5 + d.walkCycle * 0.3) * 2.5
      : Math.abs(Math.sin(d.walkCycle)) * 4;
    ctx.save();
    ctx.translate(d.x, d.y + (d.inWater ? 5 : 0) - bounce);

    if (!d.inWater) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 11 + bounce, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Border Collie Black & White Body
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Collar Fur
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(d.facing * 6, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // If Byte is doggy-paddling in the lake: Draw animated water-line foam waves!
    if (d.inWater) {
      const wavePulse = Math.sin(nowSec * 6.5 + d.x) * 2;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.92)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 2, 17 + wavePulse, 0.08 * Math.PI, 0.92 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 4, 22 - wavePulse, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    // Head & Floppy Ears
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(d.facing * 12, -9, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Bright Eye & Pink Tongue
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(d.facing * 14, -10, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(d.facing * 16, -4, 2.5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Wagging Tail
    const wag = Math.sin(nowSec * 18) * 5;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-d.facing * 13, -2);
    ctx.lineTo(-d.facing * 21, -10 + wag);
    ctx.stroke();

    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText(
      d.barkTimer > 0 ? '🐶 WOOF! WOOF!' : d.inWater ? '🐶 Byte (Swimming!)' : '🐶 Byte',
      0,
      23
    );
    ctx.restore();
  }

  drawGoose(ctx, g, nowSec) {
    const bob = g.inWater
      ? Math.sin(nowSec * 4.5 + g.walkPhase * 0.3) * 2.5
      : Math.abs(Math.sin(g.walkPhase)) * 3;
    ctx.save();
    ctx.translate(g.x, g.y + (g.inWater ? 4 : 0) - bob);

    if (!g.inWater) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 13 + bob, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Webbed Feet on Land
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-8, 8, 6, 5);
      ctx.fillRect(3, 8, 6, 5);
    }

    // Plump White Goose Body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // If Swimming in Lake: Draw Animated Water-Line Foam Waves & Bow Wake around body!
    if (g.inWater) {
      const wavePulse = Math.sin(nowSec * 6 + g.x) * 2.2;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.92)';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 2, 19 + wavePulse, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 4, 24 - wavePulse, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    if (g.flapTimer > 0) {
      const wingY = Math.sin(nowSec * 30) * 9;
      ctx.beginPath();
      ctx.ellipse(0, -6 + wingY, 12, 16, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.stroke();
    }

    const dir = g.facing;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(dir * 7 - 4, -22, 9, 20, 4);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(dir * 9, -22, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Cute Goose Hat / Accessory!
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    const hatIcons = {
      crown: '👑',
      wizard: '🧙‍♂️',
      straw: '👒',
      shades: '🕶️',
      bandana: '🧣',
    };
    if (hatIcons[g.hat]) {
      ctx.fillText(hatIcons[g.hat], dir * 9, -30);
    }

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(dir * 18, -21, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(dir * 11, -24, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (g.carriedLoot) {
      ctx.font = '21px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.carriedLoot.icon, dir * 25, -14);
    }

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = g.carriedLoot ? '#fca5a5' : '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 4;
    ctx.fillText(g.carriedLoot ? `🚨 ${g.name}` : g.name, 0, 26);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  drawGosling(ctx, baby, nowSec = 0) {
    const bob = baby.inWater
      ? Math.sin(nowSec * 5.5 + baby.walkPhase) * 2
      : Math.abs(Math.sin(baby.walkPhase)) * 2.5;
    ctx.save();
    ctx.translate(baby.x, baby.y + (baby.inWater ? 3 : 0) - bob);

    if (!baby.inWater) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(0, 7 + bob, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fuzzy Yellow Gosling Body & Head
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cute mini water-line wave when gosling swims!
    if (baby.inWater) {
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, 11 + Math.sin(nowSec * 7 + baby.x) * 1.5, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(baby.facing * 5, -8, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(baby.facing * 11, -7, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(baby.facing * 6.5, -9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const nowSec = now / 1000;

    this.update(dt, nowSec);
    this.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GooseValleyGame();
});
