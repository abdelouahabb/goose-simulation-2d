# 🌾🪿 Goose Valley 2D Deluxe — Stardew Farming × Mischievous Geese

> *"Retire from IT to a living 2D sanctuary where you grow organic developer crops, shake apple trees, brew artisan jam, and team up with Byte the Border Collie to stop mischievous geese (and their baby gosling trains!) from stealing your harvest and your HHKB Mechanical Keyboard."*

**Goose Valley 2D Deluxe** is a rich, joyful 2D top-down farming & chaos-goose simulation built for modern browsers (Google Chrome) with **HTML5 Canvas**, **Vite**, and a **100% Procedural Web Audio API Sound Engine** (zero external audio files required!).

---

## ✨ Highlights & Features

### 😊 Joyful Retired Dev Farmer & Multi-Biome Sanctuary
- **Expressive Character Art**: Play as a beaming Retired Developer with sparkling eyes, rosy cheeks, a big cheerful smile, a fluttering red scarf, denim overalls with golden brass buttons, a daisy straw hat, and floating musical whistle notes (`♪`).
- **Rich Living World Map**:
  - **🏡 Interactive Post-IT Retirement Cottage**: Walk inside (or click the cottage) to turn the sanctuary to starry night, play a soothing **5-second procedural music-box lullaby** while `💤 Zzz...` & `🎵 ♪` float above the glowing roof, and wake up the next sunny morning with ripened crops, regrown orchard apples, brewed jam, a fresh Golden Egg, and `+60 Cozy Zen`!
  - **🌬️ Spinning Dutch Windmill** on the eastern hill.
  - **🍎 Shakeable Apple Orchard**: Click any apple tree to shake down ripe organic apples for instant Gold!
  - **🛶 Winding River, Wooden Bridges, Sandy Shore & Bobbing Rowboat** on the crystal lake.
- **🦋 Dynamic Weather & Ecosystem**:
  - Swimming **Koi Fish**, **16 fluttering butterflies**, and wildflowers.
  - Switch live between **☀️ Sunny**, **🌧️ Cozy Rain** (falling raindrops that automatically water all your crops!), **🌅 Sunset**, and **🌙 Lantern Night** (with warm radial light halos around farm lamp posts).

### 🪿🐣 Mischievous Geese, Baby Gosling Trains & Realistic Water Waves
- **Adult Geese with Hats**: Meet `Sir_Honks_a_Lot` (`👑`), `Merge_Conflict` (`🧣`), `Null_Pointer` (`🧙‍♂️`), `CSS_Float_Left` (`👒`), and `Sudo_Quack` (`🕶️`).
- **Trailing Baby Goslings**: Fuzzy yellow baby goslings waddle and swim in a synchronized family line right behind their parents!
- **Lake Entry Splashes & Swimming Physics**:
  - When geese, goslings, or your sheepdog enter the river or lake, they trigger water splash sounds, droplet particles, animated white/cyan bow-wake foam waves around their bodies, expanding concentric water ripples, and realistic **water speed slowdown** (`58%` for geese, `52%` doggy-paddle speed for Byte).

### 🐶 "Byte" the Loyal Border Collie & Farm Defenses
- **🐶 Byte the Sheepdog (`[F]` Key)**: Follows you around the meadow with a wagging tail and automatically chases down sneaky geese trying to steal your crops or developer gadgets (`⌨️ HHKB Keyboard`, `☕ Espresso Mug`, `🦆 Golden Debugging Duck`, `💻 Closed Work MacBook`, `🔑 Root SSH Keys`).
- **🔔 Sudo Shoo Bell (`[5]` or `Spacebar`)**: Emit a sonic shockwave that startles nearby thief geese and forces them to drop stolen loot.
- **🎃 Linter Scarecrow (`[7]`)**: Projects a 3.4-tile protective aura that automatically repels sneaky geese.
- **🪵 Firewall Fences (`[6]`)**: Build physical wooden fences around your garden.
- **🍯 Artisan Jam Press (`[8]`) & 💦 Cloud Auto-Sprinklers**: Automate 3×3 crop watering and turn harvested crops into `2.2×` value Artisan Jam!

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- Google Chrome or any modern HTML5 Canvas / Web Audio browser

### Installation & Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/goose-valley-2d.git
cd goose-valley-2d

# 2. Install dependencies
npm install

# 3. Start the Vite dev server (runs on port 5174 by default)
npm run dev
```

Open **[http://localhost:5174/](http://localhost:5174/)** in Chrome!

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🎮 Controls & Hotbar Reference

| Input / Key | Action |
| :--- | :--- |
| **`WASD` / `Arrow Keys`** | Walk around the sanctuary |
| **Left-Click Tile / Entity** | Walk to tile & use active tool, shake Apple Trees, pet Geese, or collect Eggs/Jam |
| **`[1]` ⛏️ Git-Init Hoe** | Till grass into soil (or clear fences) |
| **`[2]` 🌱 Seed Satchel** | Plant selected crop (auto-tills grass & auto-buys seeds!) |
| **`[3]` 💧 Cloud Watering Can** | Water a 3×3 area of crops at once (`4×` growth speed) |
| **`[4]` 🧺 Harvest & Pet** | Harvest `RIPE ✨` crops, collect Golden Eggs, or pet Geese |
| **`[5]` 🔔 Sudo Shoo Bell / `Space`** | Ring sonic bell wave to startle thief geese & recover loot |
| **`[6]` 🪵 Firewall Fence (15g)** | Build wooden fences that block geese |
| **`[7]` 🎃 Linter Scarecrow (65g)** | Deploy automated goose-repelling scarecrow |
| **`[8]` 🍯 Artisan Jam Press (110g)** | Brew harvested crops into high-value Artisan Jam |
| **`[F]` Key** | Whistle **Byte the Sheepdog** to patrol & intercept sneaky geese |
| **`Right-Click` / `[Q]` Key** | Toss Sourdough Breadcrumb (`🥖`) to distract geese & get Golden Eggs |

---

## 📁 Project Structure

```text
goose-2d/
├── index.html          # Game HUD, Weather Bar, Seed Satchel, Quest Clipboard & 8-Slot Hotbar
├── package.json        # Vite & Canvas-Confetti configuration
└── src/
    ├── main.js         # 2D Canvas Engine, Multi-Biome Map, Farmer/Dog/Geese/Gosling AI & Water Physics
    ├── data.js         # Tools, Crops, Goose Profiles, Shiny Developer Gadgets & Quests
    ├── audio.js        # 100% Procedural Web Audio API sound & melody synthesizer
    └── style.css       # Cozy glassmorphism HUD styling
```

---

## 📜 License

Released under the **MIT License**. Happy farming & honking! 🌾🪿
