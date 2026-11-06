'use strict';

// ============================================================
//  Battle Arena: a top-down battle royale
//  Made by Grant Zhang
// ============================================================

// ---------- Configuration ----------
const CONFIG = {
    WORLD_SIZE: 12000,
    PLAYER_SPEED: 300,
    BOT_SPEED: 220,
    RADIUS: 20,
    MAX_HEALTH: 100,
    MAX_ARMOR: 100,
    ARMOR_ABSORB: 1,  // armor takes the whole hit until it runs out, then health
    BASE_SLOTS: 2,
    TREES: 1500,
    ROCKS: 420,
    BUSHES: 700,
    BOT_SIGHT: 650,
    HIDDEN_SIGHT: 140,
    PICKUP_RANGE: 60,
    DEMO_BOTS: 90
};
// The maps used to be 8000 across; everything placed by count or measured in world units scales with this
const MAP_SCALE = CONFIG.WORLD_SIZE / 8000, MAP_AREA = MAP_SCALE * MAP_SCALE;

const RARITY = {
    common: { color: '#c9ced6', rank: 0 },
    uncommon: { color: '#5ee08a', rank: 1 },
    rare: { color: '#4cb6ff', rank: 2 },
    epic: { color: '#c77dff', rank: 3 },
    legendary: { color: '#ffc23d', rank: 4 },
    mythic: { color: '#ff5a5f', rank: 5 },
    hyper: { color: '#00f5d4', rank: 6 }  // only from hyper drops
};

const WEAPONS = {
    'Fist': { damage: 10, range: 60, rate: 450, melee: true, rarity: 'common' },
    'Claws': { damage: 30, range: 64, rate: 380, melee: true, rarity: 'common' },  // zombies only
    'Pistol': { damage: 15, range: 1000, rate: 300, speed: 1100, spread: 0.04, mag: 12, rarity: 'common', len: 16, w: 6, sound: 'light', shake: 1.5 },
    'Mac10': { damage: 8, range: 800, rate: 80, speed: 1150, spread: 0.15, mag: 30, rarity: 'uncommon', len: 20, w: 7, sound: 'light', shake: 1 },
    'Shotgun': { damage: 10, count: 5, range: 620, rate: 1000, speed: 1000, spread: 0.25, mag: 8, rarity: 'uncommon', len: 34, w: 8, sound: 'heavy', shake: 6 },
    'Double Barrel': { damage: 15, count: 6, range: 480, rate: 200, speed: 1000, spread: 0.3, mag: 2, rarity: 'rare', len: 30, w: 10, sound: 'heavy', shake: 7 },
    'Breacher': { damage: 12, count: 8, range: 400, rate: 800, speed: 950, spread: 0.4, mag: 5, rarity: 'rare', len: 28, w: 11, sound: 'heavy', shake: 8 },
    'Machine Gun': { damage: 12, range: 1300, rate: 100, speed: 1400, spread: 0.1, mag: 100, rarity: 'epic', len: 40, w: 9, sound: 'mid', shake: 2 },
    'Sniper': { damage: 80, range: Infinity, rate: 1500, speed: 2200, spread: 0, mag: 5, rarity: 'epic', len: 50, w: 6, sound: 'sniper', shake: 7 },
    'AWP': { damage: 150, range: Infinity, rate: 2000, speed: 2600, spread: 0, mag: 5, rarity: 'legendary', len: 56, w: 7, sound: 'sniper', shake: 10 },
    // Airdrop-only
    'Vector': { damage: 11, range: 1000, rate: 55, speed: 1350, spread: 0.08, mag: 33, rarity: 'mythic', len: 24, w: 8, sound: 'light', shake: 1.2 },
    'Heavy MG': { damage: 16, range: 1800, rate: 85, speed: 1900, spread: 0.06, mag: 150, rarity: 'mythic', len: 48, w: 10, sound: 'mid', shake: 2.5 },
    // War mode heavy weapons (supply crates, and now and then a war-mode box)
    'Assault Rifle': { damage: 14, range: 1400, rate: 110, speed: 1600, spread: 0.07, mag: 30, rarity: 'epic', len: 36, w: 8, sound: 'mid', shake: 2 },
    'Minigun': { damage: 11, range: 1300, rate: 45, speed: 1600, spread: 0.13, mag: 200, rarity: 'mythic', len: 46, w: 13, sound: 'mid', shake: 1.6 },
    'Rocket Launcher': { damage: 40, range: 1500, rate: 1200, speed: 800, spread: 0.01, mag: 1, rarity: 'mythic', len: 50, w: 12, sound: 'heavy', shake: 9, rocket: true },
    'Barrett': { damage: 200, range: Infinity, rate: 1800, speed: 3000, spread: 0, mag: 6, rarity: 'mythic', len: 62, w: 8, sound: 'sniper', shake: 12 },
    // Hyper drop weapons
    'Plasma Rifle': { damage: 24, range: 1500, rate: 105, speed: 1800, spread: 0.03, mag: 45, rarity: 'hyper', len: 38, w: 9, sound: 'mid', shake: 1.5, hyper: true },
    'Railgun': { damage: 220, range: Infinity, rate: 1800, speed: 4200, spread: 0, mag: 4, rarity: 'hyper', len: 64, w: 9, sound: 'sniper', shake: 10, hyper: true, pierce: true },  // goes through everyone in a line
    'Tesla Cannon': { damage: 32, range: 900, rate: 420, speed: 1300, spread: 0.02, mag: 12, rarity: 'hyper', len: 34, w: 13, sound: 'heavy', shake: 4, hyper: true, chain: 3 },  // arcs to 3 more enemies
    'Laser Beam': { damage: 7, range: 950, rate: 50, speed: 0, spread: 0, mag: 120, rarity: 'hyper', len: 36, w: 9, sound: 'mid', shake: 0.3, hyper: true, beam: true },  // hold it on them
    'Freeze Ray': { damage: 2, range: 800, rate: 50, speed: 0, spread: 0, mag: 120, rarity: 'hyper', len: 34, w: 10, sound: 'mid', shake: 0.2, hyper: true, beam: true, freeze: 0.09 },  // chills, then freezes solid
    'Homing Launcher': { damage: 45, range: 1100, rate: 900, speed: 480, spread: 0.02, mag: 4, rarity: 'hyper', len: 52, w: 13, sound: 'heavy', shake: 7, hyper: true, rocket: true, homing: true },
    'Minigun of Doom': { damage: 12, range: 1300, rate: 40, speed: 1600, spread: 0.12, mag: 300, rarity: 'hyper', len: 50, w: 15, sound: 'mid', shake: 2, hyper: true, explosive: true },  // every round explodes
    'Sonic Cannon': { damage: 55, range: 480, rate: 1100, speed: 0, spread: 0, mag: 6, rarity: 'hyper', len: 40, w: 16, sound: 'heavy', shake: 6, hyper: true, sonic: true },  // a cone of force
    // Ordinary finds
    'Crossbow': { damage: 85, range: 1400, rate: 600, speed: 1500, spread: 0.005, mag: 1, rarity: 'rare', len: 34, w: 12, sound: 'light', shake: 2, silent: true, string: true, quiver: 6 },  // firing it doesn't give you away
    // Early Warfare: blades, and arrows that you nock one at a time (quiver: arrows a pickup gives you)
    'Sword': { damage: 38, range: 84, rate: 520, melee: true, blade: 'sword', rarity: 'uncommon', len: 40 },
    'Spear': { damage: 30, range: 128, rate: 720, melee: true, blade: 'spear', rarity: 'uncommon', len: 72 },  // the longest reach
    'Dagger': { damage: 22, range: 64, rate: 260, melee: true, blade: 'dagger', rarity: 'common', len: 18 },  // quick little stabs
    'Axe': { damage: 50, range: 80, rate: 820, melee: true, blade: 'axe', rarity: 'uncommon', len: 36, chop: 2.5 },  // fells trees fast
    'Mace': { damage: 42, range: 76, rate: 700, melee: true, blade: 'mace', rarity: 'rare', len: 32, crush: 35 },  // smashes armor off
    'War Hammer': { damage: 72, range: 86, rate: 1200, melee: true, blade: 'hammer', rarity: 'epic', len: 44, knock: 700 },  // slow, knocks them flying
    'Halberd': { damage: 46, range: 124, rate: 980, melee: true, blade: 'halberd', rarity: 'rare', len: 70 },  // spear reach, axe bite
    'Longbow': { damage: 74, range: 1700, rate: 900, speed: 1500, spread: 0.008, mag: 1, rarity: 'epic', len: 30, w: 12, sound: 'light', shake: 1.5, silent: true, string: true, shape: 'bow', bowR: 27, quiver: 10 },
    'Bow': { damage: 48, range: 1200, rate: 650, speed: 1150, spread: 0.02, mag: 1, rarity: 'rare', len: 26, w: 12, sound: 'light', shake: 1, silent: true, string: true, shape: 'bow', quiver: 12 },
    'Revolver': { damage: 42, range: 1100, rate: 420, speed: 1500, spread: 0.02, mag: 6, rarity: 'uncommon', len: 20, w: 7, sound: 'heavy', shake: 5 }
};

const ITEMS = {
    'bandage': { type: 'heal', val: 15, time: 1500, name: 'Bandage', rarity: 'common' },
    'medkit': { type: 'heal', val: 50, time: 4000, name: 'Medkit', rarity: 'rare' },
    'meat': { type: 'heal', val: 10, food: 45, time: 1500, name: 'Meat', rarity: 'common' },  // Survival: from hunting
    'water': { type: 'heal', val: 0, drink: 40, time: 1200, name: 'Bucket of Water', rarity: 'common' },  // drinking gives the bucket back
    'bucket': { type: 'heal', container: true, name: 'Empty Bucket', rarity: 'common' },  // fill it at a pond
    'grenade': { type: 'throwable', name: 'Grenade', rarity: 'uncommon' },
    'smoke': { type: 'throwable', name: 'Smoke Grenade', rarity: 'rare' },
    'strobe': { type: 'throwable', name: 'Strobe', rarity: 'legendary' },
    'mine': { type: 'throwable', name: 'Land Mine', rarity: 'epic' },
    'cure': { type: 'throwable', name: 'Cure', rarity: 'legendary' },
    'nuke': { type: 'throwable', name: 'Doomsday Nuke', rarity: 'mythic' },  // wipes out everything in a huge circle
    'emissile': { type: 'throwable', name: 'Electricity Missile', rarity: 'mythic' },  // throw it to call down an electric missile
    // Hyper drop grenades, shields and backpacks
    'shock': { type: 'throwable', name: 'Electric Grenade', rarity: 'hyper' },  // stuns, fries shields
    'cluster': { type: 'throwable', name: 'Cluster Bomb', rarity: 'hyper' },  // splits into a dozen bomblets
    'fire': { type: 'throwable', name: 'Fire Grenade', rarity: 'uncommon' },
    'freeze': { type: 'throwable', name: 'Freeze Grenade', rarity: 'rare' },
    'gravity': { type: 'throwable', name: 'Gravity Grenade', rarity: 'rare' },
    'sticky': { type: 'throwable', name: 'Sticky Bomb', rarity: 'uncommon' },
    'decoy': { type: 'throwable', name: 'Decoy', rarity: 'uncommon' },
    'flash': { type: 'throwable', name: 'Flashbang', rarity: 'uncommon' },
    'poison': { type: 'throwable', name: 'Poison Gas', rarity: 'rare' },
    'shockwave': { type: 'throwable', name: 'Shockwave', rarity: 'epic' },
    'teleport': { type: 'throwable', name: 'Teleport Grenade', rarity: 'epic' },
    'heal': { type: 'throwable', name: 'Healing Grenade', rarity: 'rare' },
    'drone': { type: 'throwable', name: 'Drone Grenade', rarity: 'legendary' },
    'megafrag': { type: 'throwable', name: 'Mega Frag', rarity: 'legendary' },
    'shield1': { type: 'shield', val: 150, regen: 15, name: 'Energy Shield', rarity: 'hyper' },
    'shield2': { type: 'shield', val: 120, reflect: 0.35, name: 'Reflector Shield', rarity: 'hyper' },
    'shield3': { type: 'shield', val: 300, name: 'Overshield', rarity: 'hyper' },
    'medpack': { type: 'gear', slots: 5, perk: 'heal', name: 'Medic Pack', rarity: 'hyper' },
    'jetpack': { type: 'gear', slots: 5, perk: 'jet', name: 'Jet Pack', rarity: 'hyper' },
    'ammopack': { type: 'gear', slots: 5, perk: 'ammo', name: 'Ammo Pack', rarity: 'hyper' },  // Zombies and Virus only
    'armor': { type: 'armor', val: 50, name: 'Body Armor', rarity: 'rare' },
    'ammo': { type: 'ammo', name: 'Ammo Box', rarity: 'common' },
    'backpack1': { type: 'gear', slots: 3, name: 'Backpack Lvl 1', rarity: 'uncommon' },
    'backpack2': { type: 'gear', slots: 4, name: 'Backpack Lvl 2', rarity: 'rare' },
    'backpack3': { type: 'gear', slots: 5, name: 'Backpack Lvl 3', rarity: 'epic' }
};

// Guns only come out of cardboard boxes; the ground just has supplies
const GUN_TABLE = [
    ['Mac10', 10], ['Shotgun', 10], ['Revolver', 8], ['Double Barrel', 6], ['Breacher', 5],
    ['Machine Gun', 4], ['Sniper', 4], ['Crossbow', 3], ['AWP', 1.2]
];
const GROUND_TABLE = [
    ['bandage', 12], ['medkit', 4], ['grenade', 7], ['armor', 6], ['ammo', 10],
    ['backpack1', 4], ['backpack2', 2], ['backpack3', 0.7],
    ['smoke', 3], ['strobe', 0.5], ['mine', 0.6]
];
// The camera's zoom on a reference 1400x850 screen
const BASE_ZOOM = 1.35;
// How far out the camera sits (Early Warfare's a little closer in)
const viewScale = () => (G && G.early ? 1 : 1.3);
// The boss strike's view, and a castle cannon's: a whole castle across the short side of the screen
const wideZoom = (w = viewW, h = viewH) => Math.min(w, h) / (REVO.base.width + 700);
const inCannon = f => !!(f && !f.dead && f.car && f.car.type === 'bigtower');
// The usual view (scaled to the screen so every window size sees the same amount), wide while you man a castle cannon
const normalZoom = (w = viewW, h = viewH, f = G && G.player) => (inCannon(f) ? wideZoom(w, h) : BASE_ZOOM * Math.hypot(w, h) / Math.hypot(1400, 850) / viewScale());
const AIRDROP_GUNS = ['Vector', 'Heavy MG'];
// Early Warfare: every gun anywhere is swapped for one of these
const EARLY_TABLE = [['Sword', 10], ['Spear', 8], ['Bow', 8], ['Crossbow', 4], ['Dagger', 9], ['Axe', 7], ['Mace', 5], ['Halberd', 4], ['War Hammer', 2.5], ['Longbow', 2.5]];
// Blades that swing across the front, and long ones that thrust straight ahead
const THRUST = { spear: true, halberd: true };
const gunFrom = table => (G && G.early ? weightedPick(EARLY_TABLE) : weightedPick(table));
// How many arrows / rounds a pickup or an ammo box gives
const ammoUnit = w => w.quiver || w.mag;

// War mode: teams, heavier guns and big supply crates that arm a whole squad
const TEAMS = [
    { name: 'Blue', color: '#3d8bff' },
    { name: 'Red', color: '#ff4b4b' },
    { name: 'Green', color: '#3ecf6e' },
    { name: 'Gold', color: '#ffc23d' }
];
// Red is the strong team in every war game: its bots aim better, hit harder and take less damage,
// so left alone Red usually wins and it's up to you to turn the fight
// Every other enemy team gets a smaller edge too, so all team games are a real fight
const RED_EDGE = { team: 1, aim: 0.75, hits: 1.12, takes: 0.85 };
const ENEMY_EDGE = { aim: 0.82, hits: 1.08, takes: 0.9 };
const NO_EDGE = { aim: 1, hits: 1, takes: 1 };
// A person playing (you, or a friend on your game) rather than a bot
const isHuman = f => !!(f && (f.isPlayer || f.remote));
const edgeOf = f => !G.war || !f || isHuman(f) || f.team === null || f.team === 0 ? NO_EDGE : f.team === RED_EDGE.team ? RED_EDGE : ENEMY_EDGE;
const WAR_GUN_TABLE = [...GUN_TABLE, ['Assault Rifle', 8], ['Minigun', 0.6], ['Rocket Launcher', 0.6], ['Barrett', 0.4]];
const SUPPLY_TABLE = [
    ['Mac10', 6], ['Shotgun', 6], ['Double Barrel', 4], ['Breacher', 4], ['Machine Gun', 5], ['Sniper', 4], ['AWP', 2],
    ['Assault Rifle', 9], ['Vector', 3], ['Heavy MG', 2], ['Minigun', 2], ['Rocket Launcher', 2], ['Barrett', 1.5]
];
const SUPPLY_HP = 220;

// Zombies: a horde starts out on the map and everyone they take down gets back up as a zombie
const ZOMBIE = { color: '#7fa63a', speed: 1.35, hp: 30, regen: 4, min: 30 };
const SURVIVOR_COLOR = '#3d8bff';
// The Commander on the HQ roof
const COMMANDER = { hp: 200, armor: 200, dmgMul: 0.9 };
// Escape: 20 people cross a city held by an army to the HQ tower, then fight up its floors to a helicopter on the roof
const ESCAPE = { people: 20, soldier: '#5f6b3c', guns: ['Pistol', 'Pistol', 'Mac10', 'Mac10', 'Shotgun', 'Assault Rifle', 'Sniper'], clear: 1600, hqFloors: 12, heliR: 110, armor: 3, squad: [5, 8], soldierDmg: 0.75, soldierAim: 1.3, reinforceEvery: [90000, 120000], hunters: 0.1, doorGuards: 8,
    regen: { after: 6000, rate: 4 }, ambient: 0.5,
    // The maze is the hard one: more soldiers who hit harder and aim better, machine-gun nests, minefields,
    // faster reinforcements, less armor, and the map only shows what you've explored
    maze: { soldiers: 1.6, dmg: 1.05, aim: 0.95, hunters: 0.35, reinforce: [30000, 45000], armor: 2, nests: Math.round(18 * MAP_AREA), mines: Math.round(45 * MAP_AREA) } };
const CITY = { block: 800, street: 150 };
const CAR_COLORS = ['#c0392b', '#2e86de', '#f1c40f', '#ecf0f1', '#27ae60', '#34495e', '#e67e22', '#8e44ad'];
const CITY_ROOFS = ['#7d7f86', '#6b6f78', '#8a857c', '#5f646d', '#958d80', '#70675e'];
const ROCKET = { radius: 150, damage: 110 };

// How many consumables you can carry, by backpack level (index 0 = no backpack)
const CARRY = [
    { bandage: 4, medkit: 1, meat: 4, water: 3, bucket: 2, grenade: 3, smoke: 2, strobe: 1, mine: 1, cure: 1, nuke: 1, emissile: 1, shock: 1, cluster: 1, fire: 1, freeze: 1, gravity: 1, sticky: 1, decoy: 1, flash: 1, poison: 1, shockwave: 1, teleport: 1, heal: 1, drone: 1, megafrag: 1 },
    { bandage: 5, medkit: 3, meat: 6, water: 4, bucket: 3, grenade: 7, smoke: 3, strobe: 1, mine: 2, cure: 1, nuke: 1, emissile: 1, shock: 1, cluster: 1, fire: 2, freeze: 2, gravity: 2, sticky: 2, decoy: 2, flash: 2, poison: 2, shockwave: 1, teleport: 1, heal: 2, drone: 1, megafrag: 1 },
    { bandage: 8, medkit: 3, meat: 8, water: 5, bucket: 4, grenade: 10, smoke: 4, strobe: 2, mine: 3, cure: 2, nuke: 1, emissile: 1, shock: 2, cluster: 2, fire: 2, freeze: 2, gravity: 2, sticky: 2, decoy: 2, flash: 2, poison: 2, shockwave: 1, teleport: 1, heal: 2, drone: 1, megafrag: 1 },
    { bandage: 15, medkit: 5, meat: 12, water: 6, bucket: 5, grenade: 15, smoke: 6, strobe: 2, mine: 4, cure: 2, nuke: 1, emissile: 1, shock: 2, cluster: 2, fire: 3, freeze: 3, gravity: 3, sticky: 3, decoy: 3, flash: 3, poison: 3, shockwave: 2, teleport: 2, heal: 3, drone: 2, megafrag: 2 }
];
const THROWABLES = ['grenade', 'smoke', 'strobe', 'mine', 'nuke', 'emissile', 'shock', 'cluster', 'fire', 'freeze', 'gravity', 'sticky', 'decoy', 'flash', 'poison', 'shockwave', 'teleport', 'heal', 'drone', 'megafrag', 'cure'];
const STACKABLE = ['bandage', 'medkit', 'meat', 'water', 'bucket', ...THROWABLES];
const LOOT_COUNT = { bandage: 2, grenade: 2 };  // how many come in one ground pickup
const GRENADE = { radius: 170, damage: 100, range: 480, cooldown: 700 };
const FUSE = { grenade: 3.2, smoke: 2.6, strobe: 2.6, cure: 1.6, nuke: 2.6, emissile: 2.6, shock: 2.2, cluster: 2.6,
    fire: 2.6, freeze: 2.6, gravity: 2.4, sticky: 3, decoy: 1.5, flash: 1.8, poison: 2.4, shockwave: 2.6, teleport: 1.4, heal: 2, drone: 1.8, megafrag: 3.2 };  // seconds from pulling the pin
const SMOKE = { radius: 190, life: 14 };
// Cure (Zombies only): for a few seconds it pulls in every zombie nearby, and any that reach the middle are cured
const CURE = { radius: 150, pull: 600, life: 5 };
const STRIKE = { delay: 3.5, radius: 300, damage: 230 };
const MINE = { radius: 210, damage: 150, trigger: 26, armTime: 1500 };
const LOOT_DRAG = 4;      // how fast thrown items slow down
const LOOT_SPACING = 50;  // items push apart until they're at least this far from each other
const BOX_HP = 50;
const TREE_HP = 300;
const BUSH_HP = 100;
const GROUND_LOOT_CHANCE = 0.15;  // chance a non-box loot spot actually has an item
const AIRDROP_HP = 150;

// Bigger maps give a little longer to get to the next circle
const ZONE_PHASES = [
    { wait: 60, shrink: 58, radius: 3600 * MAP_SCALE, dmg: 1 },
    { wait: 48, shrink: 52, radius: 2200 * MAP_SCALE, dmg: 2 },
    { wait: 42, shrink: 46, radius: 1300 * MAP_SCALE, dmg: 4 },
    { wait: 36, shrink: 39, radius: 700 * MAP_SCALE, dmg: 7 },
    { wait: 30, shrink: 32, radius: 350 * MAP_SCALE, dmg: 12 },
    { wait: 24, shrink: 32, radius: 0, dmg: 20 }
];

const BOT_COLORS = ['#ff5e57', '#ff9f43', '#e84393', '#c56cf0', '#ffb142', '#ff6b81', '#cd6133', '#b33771', '#f8a5c2', '#e1b12c', '#ff7f50', '#a29bfe'];
const BOT_NAMES = ['Viper', 'Ghost', 'Rex', 'Nova', 'Blaze', 'Kodiak', 'Raven', 'Spike', 'Echo', 'Jinx', 'Talon', 'Moose',
    'Pixel', 'Bolt', 'Saber', 'Rook', 'Maverick', 'Juno', 'Onyx', 'Vex', 'Dusty', 'Frost', 'Kraken', 'Lynx', 'Mako', 'Nitro',
    'Orbit', 'Pike', 'Quill', 'Rogue', 'Sly', 'Tank', 'Umbra', 'Vortex', 'Wasp', 'Yeti', 'Zed', 'Ace', 'Bandit', 'Cobra',
    'Diesel', 'Ember', 'Fang', 'Grizzly', 'Havoc', 'Ion', 'Jackal', 'Karma', 'Loki', 'Mamba'];
const PLAYER_COLOR = '#3d8bff';

// ---------- Utilities ----------
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function angleDiff(a, b) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
}

function weightedPick(table) {
    let total = 0;
    for (const [, w] of table) total += w;
    let r = Math.random() * total;
    for (const [k, w] of table) {
        r -= w;
        if (r <= 0) return k;
    }
    return table[0][0];
}

function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round(r + (t - r) * p);
    g = Math.round(g + (t - g) * p);
    b = Math.round(b + (t - b) * p);
    return `rgb(${r},${g},${b})`;
}

function fmtTime(s) {
    s = Math.max(0, Math.ceil(s));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d')];
}

const lootName = key => (ITEMS[key] ? ITEMS[key].name : key);
const held = f => f.inv[f.slot] || (f.zombie ? 'Claws' : 'Fist');
const carryLimit = (f, key) => CARRY[f.maxSlots - CONFIG.BASE_SLOTS][key];
const lootRarity = key => (WEAPONS[key] || ITEMS[key]).rarity;
const rarityRank = key => RARITY[lootRarity(key)].rank;

// ---------- Spatial hash grid ----------
// Objects are bucketed by their center; `pad` widens queries to cover each object's radius.
// Large boxes (walls) are inserted into every cell they touch, and queries de-duplicate them.
class Grid {
    constructor(size, pad = 0) {
        this.size = size;
        this.pad = pad;
        this.cells = new Map();
        this.stamp = 0;
    }
    key(x, y) { return Math.floor(x / this.size) + Math.floor(y / this.size) * 4096; }
    insert(o) {
        const k = this.key(o.x, o.y);
        let c = this.cells.get(k);
        if (!c) this.cells.set(k, (c = []));
        c.push(o);
    }
    insertBox(o) {
        const s = this.size;
        for (let cy = Math.floor((o.y - o.hh) / s); cy <= Math.floor((o.y + o.hh) / s); cy++) {
            for (let cx = Math.floor((o.x - o.hw) / s); cx <= Math.floor((o.x + o.hw) / s); cx++) {
                const k = cx + cy * 4096;
                let c = this.cells.get(k);
                if (!c) this.cells.set(k, (c = []));
                c.push(o);
            }
        }
    }
    removeBox(o) {
        const s = this.size;
        for (let cy = Math.floor((o.y - o.hh) / s); cy <= Math.floor((o.y + o.hh) / s); cy++) {
            for (let cx = Math.floor((o.x - o.hw) / s); cx <= Math.floor((o.x + o.hw) / s); cx++) {
                const c = this.cells.get(cx + cy * 4096);
                const i = c ? c.indexOf(o) : -1;
                if (i >= 0) c.splice(i, 1);
            }
        }
    }
    remove(o) {
        const c = this.cells.get(this.key(o.x, o.y));
        if (!c) return;
        const i = c.indexOf(o);
        if (i >= 0) c.splice(i, 1);
    }
    reset() { for (const c of this.cells.values()) c.length = 0; }
    query(x, y, r, fn) {
        const s = this.size, R = r + this.pad;
        const x0 = Math.floor((x - R) / s), x1 = Math.floor((x + R) / s);
        const y0 = Math.floor((y - R) / s), y1 = Math.floor((y + R) / s);
        const st = ++this.stamp;
        for (let cy = y0; cy <= y1; cy++) {
            for (let cx = x0; cx <= x1; cx++) {
                const c = this.cells.get(cx + cy * 4096);
                if (!c) continue;
                for (let i = 0; i < c.length; i++) {
                    const o = c[i];
                    if (o._s === st) continue;
                    o._s = st;
                    fn(o);
                }
            }
        }
    }
}

// ---------- Obstacle geometry ----------
// Circles: trees (trunk), rocks, bushes (no collision). Boxes: walls, crates.
const isBox = o => o.type === 'wall' || o.type === 'crate' || o.type === 'box';
const blocksMove = o => o.type !== 'bush';
const blocksSight = o => o.type === 'wall' || o.type === 'crate' || o.type === 'box' || o.type === 'rock';

function overlapsObstacle(x, y, r, o) {
    if (isBox(o)) {
        const nx = clamp(x, o.x - o.hw, o.x + o.hw), ny = clamp(y, o.y - o.hh, o.y + o.hh);
        return (x - nx) ** 2 + (y - ny) ** 2 < r * r;
    }
    return Math.hypot(x - o.x, y - o.y) < o.r + r;
}

function pointInObstacle(x, y, o) {
    if (isBox(o)) return Math.abs(x - o.x) <= o.hw && Math.abs(y - o.y) <= o.hh;
    const r = o.type === 'rock' ? o.r * 0.95 : o.r;
    return (x - o.x) ** 2 + (y - o.y) ** 2 < r * r;
}

function segHitsBox(x0, y0, x1, y1, o) {
    let tmin = 0, tmax = 1;
    const dx = x1 - x0, dy = y1 - y0;
    for (const [p, d, lo, hi] of [[x0, dx, o.x - o.hw, o.x + o.hw], [y0, dy, o.y - o.hh, o.y + o.hh]]) {
        if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return false; continue; }
        let t1 = (lo - p) / d, t2 = (hi - p) / d;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return false;
    }
    return true;
}

function segHitsCircle(x0, y0, x1, y1, cx, cy, r) {
    const dx = x1 - x0, dy = y1 - y0;
    const l2 = dx * dx + dy * dy || 1;
    const t = clamp(((cx - x0) * dx + (cy - y0) * dy) / l2, 0, 1);
    return (x0 + dx * t - cx) ** 2 + (y0 + dy * t - cy) ** 2 < r * r;
}

function lineOfSight(a, b) {
    // Up on a base's deck: you can't see whoever's in the rooms under you (or they you), but you see over the walls
    const up = a.up || b.up;
    if (up && (a.up || null) !== (b.up || null) && (isMid(a.up) || isMid(b.up) || underRing(up, a.up ? b : a))) return false;
    const half = Math.hypot(a.x - b.x, a.y - b.y) / 2;
    let blocked = false;
    G.world.grid.query((a.x + b.x) / 2, (a.y + b.y) / 2, half, o => {
        if (blocked || !blocksSight(o)) return;
        if (levelSkips(o, up)) return;
        if (o.base && ((a.tower && o.base === a.tower) || (b.tower && o.base === b.tower))) return;  // a guard tower sees over its own walls
        blocked = isBox(o) ? segHitsBox(a.x, a.y, b.x, b.y, o) : segHitsCircle(a.x, a.y, b.x, b.y, o.x, o.y, o.r * 0.85);
    });
    if (!blocked) {
        for (const s of G.smokes) {
            const r = smokeRadius(s) * 0.8;
            if (r > 0 && segHitsCircle(a.x, a.y, b.x, b.y, s.x, s.y, r)) return false;
        }
    }
    return !blocked;
}

function blockedAt(grid, x, y, r) {
    let hit = false;
    grid.query(x, y, r, o => { if (!hit && blocksMove(o) && overlapsObstacle(x, y, r, o)) hit = true; });
    return hit;
}

function buildingAt(x, y, pad = 0) {
    for (const b of G.world.buildings) {
        if (!b.collapsed && x > b.x0 - pad && x < b.x1 + pad && y > b.y0 - pad && y < b.y1 + pad) return b;
    }
    return null;
}

// ---------- Canvas & input ----------
const canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');  // let: menu previews borrow the vehicle drawing code with their own canvas
let viewW = 0, viewH = 0, dpr = 1;
let vignette = null, hurtVignette = null;

function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    canvas.style.width = viewW + 'px';
    canvas.style.height = viewH + 'px';
    vignette = makeVignette('rgba(10,4,24,0.55)');
    hurtVignette = makeVignette('rgba(220,20,60,0.75)');
}

function makeVignette(color) {
    const [c, g] = makeCanvas(Math.max(1, viewW), Math.max(1, viewH));
    const grad = g.createRadialGradient(viewW / 2, viewH / 2, Math.min(viewW, viewH) * 0.35, viewW / 2, viewH / 2, Math.hypot(viewW, viewH) * 0.6);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, color);
    g.fillStyle = grad;
    g.fillRect(0, 0, viewW, viewH);
    return c;
}

const keys = new Set();
const mouse = { x: 0, y: 0, down: false };
// Whose keys and mouse: yours, or (for a friend playing on your game) theirs, sent over the network
const LOCAL_INPUT = { keys, mouse, world: () => mouseWorld() };
const inputOf = p => (p && p.remote ? p.remote.input : LOCAL_INPUT);

window.addEventListener('keydown', e => {
    // (typing into a box, like the boss strike's ammo amount, doesn't move you or switch guns)
    if (e.target && e.target.tagName === 'INPUT') {
        if (e.code === 'Enter') closeStrikeLoad(true);
        if (e.code === 'Escape') closeStrikeLoad(false);
        return;
    }
    keys.add(e.code);
    onKeyPress(e.code, e.shiftKey || (e.getModifierState && e.getModifierState('CapsLock')));
});
window.addEventListener('keyup', e => {
    keys.delete(e.code);
    if (e.code === 'KeyG') playerRelease();
});
window.addEventListener('blur', () => { keys.clear(); mouse.down = false; playerRelease(); });
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => {
    const car = G && G.mode === 'playing' && G.player && !G.player.dead && G.player.car;
    if (car && !vt(car).fixed && (e.button === 2 || (e.button === 0 && !(vt(car).gun || vt(car).cannon || vt(car).rockets)))) {
        const m = mouseWorld();
        setDriveGoal(car, m.x, m.y);
        return;
    }
    if (e.button === 0) mouse.down = true;
    if (e.button === 2 && canScope(G && G.player)) { G.player.scoped = true; return; }
    if (e.button === 2) playerCook();
});
window.addEventListener('mouseup', e => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2 && G && G.player && G.player.scoped) { G.player.scoped = false; return; }
    if (e.button === 2) playerRelease();
});

function playerCook(p = G && G.player) {
    if (!G || G.mode !== 'playing' || !p || p.dead || p.downed || p.cook) return;
    if (p.throwSel === 'nuke' && p.items.nuke > 0 && openNukeMap(p)) return;
    // Fall back to whatever throwable you actually have
    if (!(p.items[p.throwSel] > 0)) {
        const next = THROWABLES.find(k => p.items[k] > 0);
        if (!next) return;
        p.throwSel = next;
    }
    startCook(p, p.throwSel);
}

function playerRelease(p = G && G.player) {
    if (!G || !p || !p.cook) return;
    const m = inputOf(p).world();
    releaseCook(p, m.x, m.y);
}

// Take a grenade in hand (and the next kind you're carrying if one's already in hand): then the trigger throws it
function cycleThrowable(p) {
    if (!p.nadeReady && p.items[p.throwSel] > 0) { p.nadeReady = true; return; }
    p.nadeReady = THROWABLES.some(k => p.items[k] > 0);
    const i = THROWABLES.indexOf(p.throwSel);
    for (let k = 1; k <= THROWABLES.length; k++) {
        const next = THROWABLES[(i + k) % THROWABLES.length];
        if (p.items[next] > 0 || k === THROWABLES.length) { p.throwSel = next; break; }
    }
}
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => {
    if (!G || G.mode !== 'playing' || G.player.dead) return;
    const p = G.player;
    const n = p.inv.length;
    switchSlot(p, (p.slot + (e.deltaY > 0 ? 1 : -1) + n) % n);
}, { passive: true });

let cheatKeys = '';
let secretKeys = '';
function onKeyPress(code, caps = false, who = null) {
    if (!G) return;
    // (a friend's key presses: only the ones that act in the game)
    if (who) { if (G.mode === 'playing' && !who.dead) playerAction(who, code); return; }
    if (nukeMap.open) { if (code === 'Escape') closeNukeMap(null); return; }
    if (code === 'Escape') {
        if (G.mode === 'playing') setPaused(true);
        else if (G.mode === 'paused') setPaused(false);
        return;
    }
    if (code === 'KeyM') Sound.toggle();
    if (G.mode === 'demo' && !screens.menu.classList.contains('hidden')) {
        if (code === 'ArrowLeft') setMenuMode(menuMode - 1, -1);
        if (code === 'ArrowRight') setMenuMode(menuMode + 1, 1);
        return;
    }
    if (G.mode !== 'playing' || G.player.dead) return;
    const p = G.player;
    // Escape shortcut: type X, Y, Z in a row to jump your group straight to the HQ's 10th floor
    cheatKeys = (cheatKeys + ((!caps && { KeyX: 'x', KeyY: 'y', KeyZ: 'z' }[code]) || '-')).slice(-3);
    secretKeys = (secretKeys + ((caps && { KeyX: 'X', KeyY: 'Y', KeyZ: 'Z' }[code]) || '-')).slice(-3);
    if (secretKeys === 'XYZ' && G.mode === 'playing' && !p.dead) { secretKeys = ''; if (secretGrenades(p)) return; }
    if (cheatKeys === 'xyz' && G.escape && G.hq && !(G.world.floor && G.world.floor.b.hq && G.world.floor.level === 10)) {
        cheatKeys = '';
        for (const f of G.fighters) if (!f.soldier && !f.dead) { f.x = p.x + rand(-50, 50); f.y = p.y + rand(-50, 50); }
        G.hq.R = G.hq.R || floorRect(G.hq);
        travel({ b: G.hq, to: 10, dir: 'up', ...floorStairs(G.hq.R, 9) });
        return;
    }
    playerAction(p, code);
}
// What a key does for someone in the game (you, or a friend playing on your game)
function playerAction(p, code) {
    if (code.startsWith('Digit')) {
        const i = parseInt(code.slice(5), 10) - 1;
        if (i >= 0 && i < 5) switchSlot(p, i);
    }
    if (code === 'Space' && p.isPlayer && G.strikeCam) { G.strikeCam = null; return; }
    if (code === 'KeyF') {
        // F: launch the boss strike, get out of the car, pick up what's at your feet, or get into a car nearby
        // (up on the castle walkway, the only thing to get into is a corner gun)
        if (tryLaunchStrike(p)) return;
        if (nearOwnPad(p)) { if (p.remote) loadAllAmmo(p); else openStrikeLoad(p); return; }
        if (p.car) exitCar(p);
        else if (!nearestLoot(p.x, p.y, CONFIG.PICKUP_RANGE) && nearestCar(p, 90) && !p.zombie && (!p.up || nearestCar(p, 90).tower === p.up) && !(nearestCar(p, 90).type === 'bigtower' && nearestCar(p, 90).tower && !nearestCar(p, 90).tower.fallen && p.up !== nearestCar(p, 90).tower)) enterCar(p, nearestCar(p, 90));
        else playerPickup(p);
    }
    if (code === 'KeyQ') startHeal(p, 'bandage');
    if (code === 'KeyE') startHeal(p, 'medkit');
    if (code === 'KeyC' && G.survival) startHeal(p, 'meat');
    if (code === 'KeyV' && G.survival) playerDrink(p);
    if (code === 'KeyB' && G.survival) toggleRest(p);
    if (code === 'KeyG') playerCook(p);
    if (code === 'KeyT') cycleThrowable(p);
    if (code === 'KeyZ' && p.isPlayer && !p.remote && canScope(p)) p.scoped = !p.scoped;
}

// ---------- Audio (synthesized, no files) ----------
const SHOT_SOUNDS = {
    light: { freq: 3200, dur: 0.12, gain: 0.5 },
    mid: { freq: 2400, dur: 0.14, gain: 0.55 },
    heavy: { freq: 1400, dur: 0.3, gain: 0.8, thump: true },
    sniper: { freq: 2600, dur: 0.5, gain: 0.9, thump: true }
};

const Sound = {
    ctx: null,
    master: null,
    noise: null,
    muted: false,
    budget: 0,
    init() {
        if (this.ctx) { this.ctx.resume(); return; }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
        const len = Math.floor(this.ctx.sampleRate * 0.8);
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    },
    toggle() {
        this.muted = !this.muted;
        if (this.master) this.master.gain.value = this.muted ? 0 : 0.3;
        showBanner(this.muted ? 'SOUND OFF' : 'SOUND ON');
    },
    volAt(x, y) {
        if (!G || G.mode === 'demo') return 0;
        return clamp(1 - Math.hypot(x - G.cam.x, y - G.cam.y) / 1100, 0, 1);
    },
    shot(kind, vol) {
        if (!this.ctx || this.muted || vol < 0.03 || this.budget > 10) return;
        this.budget++;
        const S = SHOT_SOUNDS[kind] || SHOT_SOUNDS.light;
        const c = this.ctx, t = c.currentTime;
        const src = c.createBufferSource();
        src.buffer = this.noise;
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(S.freq, t);
        f.frequency.exponentialRampToValueAtTime(S.freq * 0.2, t + S.dur);
        const g = c.createGain();
        g.gain.setValueAtTime(S.gain * vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + S.dur);
        src.connect(f).connect(g).connect(this.master);
        src.start(t, rand(0, 0.2));
        src.stop(t + S.dur);
        if (S.thump) this.tone(130, 0.15, 'sine', 0.6 * vol, 40);
    },
    tone(freq, dur, type = 'square', gain = 0.12, slideTo = 0) {
        if (!this.ctx || this.muted || gain <= 0) return;
        const c = this.ctx, t = c.currentTime;
        const o = c.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        const g = c.createGain();
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(this.master);
        o.start(t);
        o.stop(t + dur);
    },
    hit() { this.tone(1400, 0.05, 'square', 0.06); },
    hurt() { this.tone(220, 0.15, 'sawtooth', 0.12, 90); },
    pickup() { this.tone(660, 0.07, 'triangle', 0.15); setTimeout(() => this.tone(990, 0.09, 'triangle', 0.15), 60); },
    empty() { this.tone(300, 0.03, 'square', 0.05); },
    // Kill chime rises in pitch with each kill in a streak
    kill(streak = 1) {
        const k = 1 + Math.min(streak - 1, 5) * 0.12;
        this.tone(110, 0.3, 'sine', 0.5, 40);
        this.noiseBurst(1800, 0.15, 0.35);
        this.tone(660 * k, 0.12, 'triangle', 0.22);
        setTimeout(() => this.tone(990 * k, 0.14, 'triangle', 0.22), 70);
        setTimeout(() => this.tone(1320 * k, 0.28, 'triangle', 0.2), 140);
    },
    healed() { [660, 880, 1100].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, 'sine', 0.14), i * 70)); },
    throw(vol) { this.noiseBurst(3000, 0.12, 0.25 * vol); },
    boom(vol, big = 1) {
        this.tone(70 / Math.sqrt(big), 0.9 * big, 'sine', Math.min(1, 0.9 * vol * big), 25);
        this.noiseBurst(1200, 0.9 * big, Math.min(1, 0.9 * vol * big));
        setTimeout(() => this.noiseBurst(400, 1.2 * big, 0.5 * vol), 60);
        if (big > 1.1) setTimeout(() => this.noiseBurst(250, 1.8, 0.6 * vol), 200);
    },
    pin() { this.tone(1800, 0.04, 'square', 0.08); setTimeout(() => this.tone(900, 0.05, 'triangle', 0.1), 50); },
    beep(left) { this.tone(left < 1 ? 1600 : 1100, 0.05, 'square', left < 1 ? 0.14 : 0.08); },
    hiss(vol) { this.noiseBurst(5000, 1.6, 0.35 * vol); },
    siren(vol) { this.tone(880, 0.18, 'sawtooth', 0.08 * vol, 660); },
    timber(vol) { this.tone(90, 0.5, 'sawtooth', 0.25 * vol, 40); this.noiseBurst(1500, 0.6, 0.6 * vol); },
    death() { this.tone(160, 0.8, 'sawtooth', 0.18, 40); this.noiseBurst(600, 0.6, 0.4); },
    fanfare() {
        [[523, 0], [659, 140], [784, 280], [1047, 420], [784, 640], [1047, 780], [1319, 920]].forEach(([f, t], i) =>
            setTimeout(() => { this.tone(f, i === 6 ? 0.9 : 0.22, 'triangle', 0.25); this.tone(f / 2, i === 6 ? 0.9 : 0.2, 'square', 0.05); }, t));
    },
    // A tiny tink when a death cube hits the ground, and the crackle of one fizzling away
    tink(vol) { if (vol < 0.05 || this.budget > 10) return; this.budget++; this.tone(rand(1500, 2600), 0.07, 'sine', 0.04 * vol); },
    crackle(vol) { if (vol < 0.03 || this.budget > 10) return; this.budget++; this.noiseBurst(5000, 0.08, 0.22 * vol); },
    pop() { this.noiseBurst(2500, 0.25, 0.25); this.tone(rand(500, 900), 0.3, 'sine', 0.06, 200); },
    crunch(vol) { this.noiseBurst(900, 0.22, 0.6 * vol); },
    thud(vol) { this.tone(80, 0.5, 'sine', 0.7 * vol, 30); this.noiseBurst(500, 0.4, 0.5 * vol); },
    noiseBurst(freq, dur, gain) {
        if (!this.ctx || this.muted || gain < 0.02) return;
        const c = this.ctx, t = c.currentTime;
        const src = c.createBufferSource();
        src.buffer = this.noise;
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = freq;
        const g = c.createGain();
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f).connect(g).connect(this.master);
        src.start(t, rand(0, 0.2));
        src.stop(t + dur);
    },
    punch(vol) { this.tone(160, 0.08, 'sine', 0.4 * vol, 60); }
};

// ---------- Pre-rendered sprites ----------
const SPR = {};

function buildSprites() {
    SPR.grass = makeGrassPattern();
    SPR.patches = [
        makePatch('rgba(60,120,50,0.35)'),
        makePatch('rgba(140,170,70,0.25)'),
        makePatch('rgba(150,120,70,0.35)'),
        makePatch('rgba(40,95,45,0.4)'),
        makePatch('rgba(30,70,32,0.55)'),   // 4: forest floor
        makePatch('rgba(150,142,120,0.55)'), // 5: gravel
        makePatch('rgba(170,135,85,0.55)')   // 6: packed dirt
    ];
    SPR.floors = [makeWoodFloor(), makeTileFloor()];
    SPR.puff = makeCanvas(128, 128)[0];
    const pg = SPR.puff.getContext('2d');
    const pgrad = pg.createRadialGradient(64, 64, 4, 64, 64, 64);
    pgrad.addColorStop(0, 'rgba(196,198,206,0.95)');
    pgrad.addColorStop(0.55, 'rgba(170,172,182,0.75)');
    pgrad.addColorStop(1, 'rgba(160,162,172,0)');
    pg.fillStyle = pgrad;
    pg.fillRect(0, 0, 128, 128);
    SPR.canopies = [];
    for (let i = 0; i < 8; i++) SPR.canopies.push(makeCanopy(rand(95, 135)));
    SPR.rocks = [];
    for (let i = 0; i < 6; i++) SPR.rocks.push(makeRock());
    SPR.bushes = [];
    for (let i = 0; i < 4; i++) SPR.bushes.push(makeBush(rand(85, 125)));
    SPR.loot = {};
    for (const k of [...Object.keys(WEAPONS), ...Object.keys(ITEMS)]) if (!WEAPONS[k] || !WEAPONS[k].melee || WEAPONS[k].blade) SPR.loot[k] = makeLootSprite(k);
}

function makeGrassPattern() {
    const S = 512;
    const [c, g] = makeCanvas(S, S);
    g.fillStyle = '#5b9a45';
    g.fillRect(0, 0, S, S);
    // Draws a shape at every wrapped offset so the tile repeats seamlessly
    const wrap = fn => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) fn(ox, oy); };
    for (let i = 0; i < 70; i++) {
        const x = rand(0, S), y = rand(0, S), r = rand(20, 70);
        const col = Math.random() < 0.5 ? 'rgba(120,180,80,0.12)' : 'rgba(40,90,35,0.12)';
        wrap((ox, oy) => { g.fillStyle = col; g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); });
    }
    g.lineCap = 'round';
    g.lineWidth = 1.6;
    for (let i = 0; i < 1600; i++) {
        const x = rand(0, S), y = rand(0, S), l = rand(3, 8), a = rand(-0.6, 0.6) - Math.PI / 2;
        const col = Math.random() < 0.5 ? 'rgba(140,200,90,0.45)' : 'rgba(45,100,40,0.4)';
        g.strokeStyle = col;
        wrap((ox, oy) => {
            g.beginPath();
            g.moveTo(x + ox, y + oy);
            g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l);
            g.stroke();
        });
    }
    for (let i = 0; i < 40; i++) {
        const x = rand(0, S), y = rand(0, S);
        const col = pick(['#fff6d5', '#ffd166', '#ff9fb2', '#d7c4ff']);
        wrap((ox, oy) => { g.fillStyle = col; g.beginPath(); g.arc(x + ox, y + oy, 2, 0, TAU); g.fill(); });
    }
    return ctx.createPattern(c, 'repeat');
}

function makePatch(color) {
    const [c, g] = makeCanvas(256, 256);
    const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return c;
}

function makeWoodFloor() {
    const [c, g] = makeCanvas(128, 128);
    for (let row = 0; row < 8; row++) {
        const off = (row % 2) * 40;
        for (let x = -off; x < 128; x += 80) {
            g.fillStyle = `hsl(28,${rand(30, 40)}%,${rand(36, 44)}%)`;
            g.fillRect(x, row * 16, 80, 16);
            g.fillStyle = 'rgba(0,0,0,0.25)';
            g.fillRect(x, row * 16, 1, 16);
        }
        g.fillStyle = 'rgba(0,0,0,0.3)';
        g.fillRect(0, row * 16 + 15, 128, 1);
    }
    return ctx.createPattern(c, 'repeat');
}

function makeTileFloor() {
    const [c, g] = makeCanvas(64, 64);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
        g.fillStyle = (x + y) % 2 ? '#b9b2a6' : '#a59d90';
        g.fillRect(x * 32, y * 32, 32, 32);
    }
    g.strokeStyle = 'rgba(0,0,0,0.18)';
    g.strokeRect(0.5, 0.5, 63, 63);
    g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 64); g.moveTo(0, 32); g.lineTo(64, 32); g.stroke();
    return ctx.createPattern(c, 'repeat');
}

// Canopy sprites are drawn at radius 100 and scaled per tree
function makeCanopy(hue) {
    const S = 240, R = 100;
    const [c, g] = makeCanvas(S, S);
    g.translate(S / 2, S / 2);
    const lumps = [];
    const n = randInt(7, 10);
    for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + rand(-0.2, 0.2);
        lumps.push([Math.cos(a) * R * 0.58, Math.sin(a) * R * 0.58, R * rand(0.4, 0.5)]);
    }
    const blob = (grow, dx, dy, col) => {
        g.fillStyle = col;
        g.beginPath();
        g.arc(dx, dy, R * 0.68 + grow, 0, TAU);
        for (const [x, y, r] of lumps) { g.moveTo(x + dx + r + grow, y + dy); g.arc(x + dx, y + dy, r + grow, 0, TAU); }
        g.fill();
    };
    blob(5, 0, 0, `hsl(${hue},45%,16%)`);
    blob(0, 0, 0, `hsl(${hue},42%,27%)`);
    blob(-10, -6, -8, `hsl(${hue},46%,34%)`);
    blob(-26, -14, -18, `hsl(${hue},50%,41%)`);
    for (let i = 0; i < 14; i++) {
        const a = rand(0, TAU), d = rand(0, R * 0.7);
        g.fillStyle = `hsla(${hue + 10},60%,55%,0.35)`;
        g.beginPath();
        g.arc(Math.cos(a) * d - 14, Math.sin(a) * d - 14, rand(5, 12), 0, TAU);
        g.fill();
    }
    return c;
}

function makeRock() {
    const S = 140, R = 50;
    const [c, g] = makeCanvas(S, S);
    g.translate(S / 2, S / 2);
    const pts = [];
    const n = randInt(7, 10);
    for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const r = R * rand(0.85, 1.08);
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const path = (scale, dx = 0, dy = 0) => {
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x * scale + dx, y * scale + dy) : g.moveTo(x * scale + dx, y * scale + dy)));
        g.closePath();
    };
    path(1.04);
    g.fillStyle = '#3b3f4a';
    g.fill();
    path(1);
    const grad = g.createLinearGradient(-R, -R, R, R);
    grad.addColorStop(0, '#b9bec8');
    grad.addColorStop(1, '#6b707c');
    g.fillStyle = grad;
    g.fill();
    path(0.6, -10, -12);
    g.fillStyle = 'rgba(255,255,255,0.14)';
    g.fill();
    g.strokeStyle = 'rgba(40,44,54,0.5)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-R * 0.2, -R * 0.1);
    g.lineTo(R * 0.15, R * 0.2);
    g.lineTo(R * 0.4, R * 0.15);
    g.stroke();
    return c;
}

function makeBush(hue) {
    const S = 100, R = 40;
    const [c, g] = makeCanvas(S, S);
    g.translate(S / 2, S / 2);
    const lumps = [];
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + rand(-0.3, 0.3);
        lumps.push([Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, R * rand(0.45, 0.55)]);
    }
    for (const [grow, col, off] of [[4, `hsl(${hue},40%,18%)`, 0], [0, `hsl(${hue},45%,32%)`, 0], [-8, `hsl(${hue},50%,42%)`, -5]]) {
        g.fillStyle = col;
        g.beginPath();
        for (const [x, y, r] of lumps) { g.moveTo(x + off + r + grow, y + off); g.arc(x + off, y + off, r + grow, 0, TAU); }
        g.fill();
    }
    for (let i = 0; i < 5; i++) {
        g.fillStyle = Math.random() < 0.5 ? '#ff6b81' : '#ffd166';
        g.beginPath();
        g.arc(rand(-R * 0.6, R * 0.6), rand(-R * 0.6, R * 0.6), 2.5, 0, TAU);
        g.fill();
    }
    return c;
}

function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
}

function drawGrenadeIcon(g, x, y, s) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.fillStyle = '#1f2614';
    g.beginPath(); g.arc(0, 2, 10, 0, TAU); g.fill();
    g.fillStyle = '#5b6b32';
    g.beginPath(); g.arc(0, 2, 8.5, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.3)';
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-8, 2); g.lineTo(8, 2); g.moveTo(0, -6); g.lineTo(0, 10); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.beginPath(); g.arc(-3, -1, 3, 0, TAU); g.fill();
    g.fillStyle = '#a7adb8';
    g.fillRect(-3, -10, 6, 5);
    g.fillRect(2, -10, 7, 2.5);
    g.strokeStyle = '#d6dae2';
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(-5, -9, 3, 0, TAU); g.stroke();
    g.restore();
}

function drawSmokeIcon(g, x, y, s) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    roundRect(g, -8, -10, 16, 22, 4); g.fillStyle = '#1e2230'; g.fill();
    roundRect(g, -6.5, -8.5, 13, 19, 3); g.fillStyle = '#8d94a3'; g.fill();
    g.fillStyle = '#e8ecf2'; g.fillRect(-6.5, -1, 13, 4);
    g.fillStyle = '#a7adb8'; g.fillRect(-3, -13, 6, 4);
    g.strokeStyle = '#d6dae2'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(-5, -12, 3, 0, TAU); g.stroke();
    g.restore();
}

function drawStrobeIcon(g, x, y, s, lit) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    if (lit) {
        g.fillStyle = 'rgba(255,60,60,0.35)';
        g.beginPath(); g.arc(0, -10, 12, 0, TAU); g.fill();
    }
    roundRect(g, -7, -8, 14, 20, 3); g.fillStyle = '#1a1424'; g.fill();
    roundRect(g, -5.5, -6.5, 11, 17, 2); g.fillStyle = '#2b2b33'; g.fill();
    g.fillStyle = '#ff3b3b'; g.fillRect(-5.5, 2, 11, 3);
    g.fillStyle = lit ? '#ffd0d0' : '#ff5a5f';
    g.beginPath(); g.arc(0, -9, 5, Math.PI, 0); g.fill();
    g.restore();
}

function drawMineIcon(g, x, y, s, light) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.fillStyle = '#1d1c14';
    g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.fill();
    g.fillStyle = '#545232';
    g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.stroke();
    g.fillStyle = '#8a8a7a';
    g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fill();
    g.fillStyle = light || '#ff3b3b';
    g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill();
    g.restore();
}

// Cure: a glass vial of glowing green serum with a white cross
function drawCureIcon(g, x, y, s) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    roundRect(g, -7, -9, 14, 21, 4); g.fillStyle = '#16301c'; g.fill();
    roundRect(g, -5.5, -7.5, 11, 18, 3); g.fillStyle = 'rgba(220,240,230,0.9)'; g.fill();
    roundRect(g, -5.5, -1, 11, 11.5, 3); g.fillStyle = '#5ee08a'; g.fill();
    g.fillStyle = '#fff'; g.fillRect(-1.2, 0.5, 2.4, 8); g.fillRect(-4, 3.3, 8, 2.4);
    g.fillStyle = '#d6dae2'; g.fillRect(-4, -12.5, 8, 4);
    g.restore();
}

function drawThrowable(g, key, x, y, s) {
    if (key === 'cure') drawCureIcon(g, x, y, s);
    else if (key === 'smoke') drawSmokeIcon(g, x, y, s);
    else if (key === 'strobe') drawStrobeIcon(g, x, y, s);
    else if (key === 'mine') drawMineIcon(g, x, y, s);
    else if (key === 'nuke') drawNukeIcon(g, x, y, s);
    else if (key === 'emissile') drawEmissileIcon(g, x, y, s);
    else if (key === 'shock') drawShockIcon(g, x, y, s);
    else if (key === 'cluster') drawClusterIcon(g, x, y, s);
    else if (key === 'bomblet') drawGrenadeIcon(g, x, y, s * 0.6);
    else if (NADES2[key]) drawNade2Icon(g, key, x, y, s);
    else drawGrenadeIcon(g, x, y, s);
}

// Loot icons for the Early Warfare weapons: a sword, a spear and a bow, laid diagonally in the tile
// The business end of an old-time weapon, drawn pointing along +x from a handle ending at x = 0
function drawWeaponHead(g, kind) {
    const steel = '#dfe4ec', dark = '#8d95a3';
    if (kind === 'dagger') {
        g.fillStyle = '#c9a24a'; g.fillRect(-2, -5, 3, 10);
        g.fillStyle = steel; g.beginPath(); g.moveTo(1, -2.5); g.lineTo(14, -1); g.lineTo(18, 0); g.lineTo(14, 1); g.lineTo(1, 2.5); g.closePath(); g.fill();
    } else if (kind === 'axe') {
        g.fillStyle = dark; g.fillRect(-6, -3, 8, 6);
        g.fillStyle = steel; g.beginPath(); g.moveTo(-5, -3); g.quadraticCurveTo(-2, -16, 6, -17); g.quadraticCurveTo(4, -9, 2, -3); g.closePath(); g.fill();
    } else if (kind === 'mace') {
        g.fillStyle = dark; g.beginPath(); g.arc(3, 0, 7, 0, TAU); g.fill();
        g.fillStyle = steel;
        for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.beginPath(); g.moveTo(3 + Math.cos(a) * 6, Math.sin(a) * 6); g.lineTo(3 + Math.cos(a) * 11, Math.sin(a) * 11); g.lineTo(3 + Math.cos(a + 0.35) * 6, Math.sin(a + 0.35) * 6); g.closePath(); g.fill(); }
    } else if (kind === 'hammer') {
        g.fillStyle = dark; g.fillRect(-6, -13, 13, 26);
        g.fillStyle = steel; g.fillRect(-4, -11, 9, 22);
        g.fillStyle = dark; g.beginPath(); g.moveTo(7, -3); g.lineTo(13, 0); g.lineTo(7, 3); g.closePath(); g.fill();
    } else if (kind === 'halberd') {
        g.fillStyle = steel;
        g.beginPath(); g.moveTo(0, -4); g.lineTo(16, 0); g.lineTo(0, 4); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(-14, -2); g.quadraticCurveTo(-10, -15, -1, -14); g.quadraticCurveTo(-3, -7, -2, -2); g.closePath(); g.fill();
        g.fillStyle = dark; g.beginPath(); g.moveTo(-12, 2); g.lineTo(-8, 10); g.lineTo(-5, 2); g.closePath(); g.fill();
    }
}

const EARLY_ICON_HANDLE = { Dagger: 8, Axe: 30, Mace: 28, 'War Hammer': 32, Halberd: 40 };
function drawEarlyIcon(g, key) {
    if (EARLY_ICON_HANDLE[key]) {
        const L = EARLY_ICON_HANDLE[key], w = WEAPONS[key];
        g.save(); g.rotate(-0.75); g.translate(-L / 2 + (key === 'Dagger' ? -4 : -4), 0);
        g.fillStyle = key === 'Dagger' ? '#3a2614' : '#8a5a2e'; g.fillRect(0, -2, L, 4);
        g.translate(L, 0);
        if (key === 'Halberd') g.scale(0.85, 0.85);
        drawWeaponHead(g, w.blade);
        g.restore();
        return;
    }
    g.save(); g.rotate(-0.75);
    if (key === 'Sword') {
        g.fillStyle = '#5a3a1e'; g.fillRect(-20, -2.5, 9, 5);
        g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(-21, 0, 3, 0, TAU); g.fill(); g.fillRect(-11, -8, 3.5, 16);
        g.fillStyle = '#e4e8ef'; g.beginPath(); g.moveTo(-7.5, -3); g.lineTo(15, -2.5); g.lineTo(21, 0); g.lineTo(15, 2.5); g.lineTo(-7.5, 3); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(120,130,150,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-6, 0); g.lineTo(15, 0); g.stroke();
    } else if (key === 'Spear') {
        g.fillStyle = '#8a5a2e'; g.fillRect(-24, -1.8, 36, 3.6);
        g.fillStyle = '#d8dde6'; g.beginPath(); g.moveTo(11, -5); g.lineTo(24, 0); g.lineTo(11, 5); g.closePath(); g.fill();
        g.fillStyle = '#c9a24a'; g.fillRect(9, -2.6, 3, 5.2);
    } else {
        g.rotate(0.75 + Math.PI / 4);
        g.strokeStyle = '#8a5a2e'; g.lineWidth = 4; g.beginPath(); g.arc(-6, 0, 18, -1.15, 1.15); g.stroke();
        const ex = -6 + Math.cos(1.15) * 18, ey = Math.sin(1.15) * 18;
        g.strokeStyle = '#efe6d0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ex, -ey); g.lineTo(ex, ey); g.stroke();
        g.strokeStyle = '#5a3a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(ex - 4, 0); g.lineTo(16, 0); g.stroke();
        g.fillStyle = '#d8dde6'; g.beginPath(); g.moveTo(20, 0); g.lineTo(14, -3.5); g.lineTo(14, 3.5); g.closePath(); g.fill();
        g.fillStyle = '#d64545'; g.beginPath(); g.moveTo(ex - 4, 0); g.lineTo(ex - 9, -4); g.lineTo(ex - 7, 0); g.lineTo(ex - 9, 4); g.closePath(); g.fill();
    }
    g.restore();
}

function makeLootSprite(key) {
    const S = 64;
    const [c, g] = makeCanvas(S, S);
    const col = RARITY[lootRarity(key)].color;
    g.translate(S / 2, S / 2);
    roundRect(g, -22, -22, 44, 44, 9);
    g.fillStyle = 'rgba(22,14,40,0.9)';
    g.fill();
    g.lineWidth = 2.5;
    g.strokeStyle = col;
    g.stroke();
    const w = WEAPONS[key];
    if (w && (w.blade || w.shape === 'bow')) { drawEarlyIcon(g, key); return c; }
    if (w) {
        g.rotate(-0.5);
        const L = Math.min(34, 12 + w.len * 0.45);
        g.fillStyle = '#e8e3f0';
        roundRect(g, -L / 2, -4, L * 0.6, 8, 2); g.fill();
        g.fillRect(-L / 2 + L * 0.55, -2.5, L * 0.5, 5);
        g.fillStyle = col;
        roundRect(g, -L / 2 + 3, 2, 6, 9, 2); g.fill();
        if (w.range === Infinity) { g.fillStyle = '#e8e3f0'; g.fillRect(-4, -8, 12, 3); }
        if (w.rocket) { g.fillStyle = '#e8e3f0'; roundRect(g, -L / 2, -6, L, 12, 5); g.fill(); g.fillStyle = '#ff5a5f'; g.beginPath(); g.moveTo(L / 2, -6); g.lineTo(L / 2 + 7, 0); g.lineTo(L / 2, 6); g.fill(); }
        if (w.count) { g.fillStyle = col; g.fillRect(-L / 2 + L * 0.3, -5, 4, 10); }
        return c;
    }
    const it = ITEMS[key];
    if (key === 'meat') {
        drawMeatIcon(g, 1.1);
    } else if (key === 'water' || key === 'bucket') {
        drawBucketIcon(g, key === 'water');
    } else if (key === 'bandage') {
        g.rotate(0.6);
        roundRect(g, -14, -6, 28, 12, 4); g.fillStyle = '#f5ead8'; g.fill();
        g.fillStyle = '#d9c3a3'; g.fillRect(-4, -6, 8, 12);
    } else if (key === 'medkit') {
        roundRect(g, -14, -11, 28, 22, 4); g.fillStyle = '#f7f3fb'; g.fill();
        g.fillStyle = '#ff4f6d'; g.fillRect(-3, -8, 6, 16); g.fillRect(-8, -3, 16, 6);
    } else if (key === 'armor') {
        g.beginPath();
        g.moveTo(0, -14); g.lineTo(12, -9); g.lineTo(10, 5); g.quadraticCurveTo(6, 12, 0, 15);
        g.quadraticCurveTo(-6, 12, -10, 5); g.lineTo(-12, -9); g.closePath();
        g.fillStyle = '#4cc3ff'; g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-2, -10, 4, 20);
    } else if (it.type === 'throwable') {
        drawThrowable(g, key, 0, 2, 1.25);
    } else if (key === 'ammo') {
        for (let i = -1; i <= 1; i++) {
            g.fillStyle = '#ffd166'; roundRect(g, i * 8 - 3, -6, 6, 16, 2); g.fill();
            g.fillStyle = '#ff8a3d'; g.beginPath(); g.arc(i * 8, -6, 3, Math.PI, 0); g.fill();
        }
    } else if (it.type === 'shield') {
        drawShieldIcon(g, key);
    } else if (it.perk) {
        drawPackIcon(g, key);
    } else if (it.type === 'gear') {
        roundRect(g, -11, -10, 22, 24, 6); g.fillStyle = '#a5714a'; g.fill();
        roundRect(g, -11, -10, 22, 10, 5); g.fillStyle = '#7d5235'; g.fill();
        g.fillStyle = col; g.font = 'bold 12px Rajdhani, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(it.slots - 2), 0, 7);
    }
    return c;
}

// ---------- World generation ----------
const ROOF_COLORS = [['#c0583f', '#8e3b2a'], ['#3f7a9c', '#2c5068'], ['#7a68a8', '#4d4170'], ['#5a8f5c', '#38603a'], ['#b07a44', '#76502b'], ['#c99a3f', '#8f6a24']];
const WALL_COLORS = ['#5b5266', '#6a5a4a', '#4f5a63', '#5f4f58'];
const WALL_T = 16;
const DOOR_W = 76;

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// city = true builds the Virus map: a grid of streets and blocks instead of countryside
// Every building gets its own look: roof shape, rooftop extras and colors
const BUILDING_STYLES = {
    house: ['gable', 'gable', 'hip', 'hip', 'garden', 'shop', 'flat'],
    hotel: ['pool', 'tiers', 'glass'],
    hospital: ['cross', 'helipad'],
    town: ['gable', 'hip'],
    // Rusty: corrugated sheds, sawtooth factory roofs and a grimy clinic
    rustyhouse: ['rustshed', 'rustshed', 'rustshed', 'flat'],
    rustyhotel: ['factory'],
    rustyhospital: ['clinic']
};
const RUST_CAR_COLORS = ['#6b3a24', '#5a4a3a', '#4a4f44', '#7a5530', '#3f3a36', '#6a5a48'];
const RUST_CONTAINERS = ['#8a3b26', '#9a5a2a', '#3f5a6a', '#4f6a3a', '#7a2e2e'];
const RUSTY_LABELS = { hotel: 'FACTORY', hospital: 'CLINIC', house: 'WAREHOUSE' };
const AWNINGS = [['#c0392b', '#f4ede1'], ['#2e7d5b', '#f4ede1'], ['#2e5d9c', '#f4ede1'], ['#d9a13a', '#5a3b22']];
const HOTEL_ROOFS = { pool: ['#b9b2a6', '#8d877c'], tiers: ['#6a6f7a', '#4a4e57'], glass: ['#4f6f8c', '#2f4459'] };
const FLOOR_PALETTES = {
    hotel: [['#7a6656', '#d8c8b0'], ['#5a6470', '#cfd6dc'], ['#6e4f4f', '#e2cfc4'], ['#4f5e52', '#d6dcc8']],
    hospital: [['#d6dadf', '#e4e7ea'], ['#c3d6d1', '#e0ece8'], ['#d2cfe0', '#e8e6f0']],
    house: [['#8a7a68', '#cbb89c'], ['#7a5e4e', '#d8c2a8'], ['#5e6a74', '#c8ccd0'], ['#7c6a52', '#e0d4b8']],
    hq: [['#4a525c', '#5d6670']],
    rusty: [['#5e564c', '#8a8072'], ['#4f4a44', '#7a7266'], ['#665044', '#8f7a68']]
};

function styleBuilding(b, rusty) {
    const style = b.style = pick(BUILDING_STYLES[!b.flat ? 'town' : rusty ? 'rusty' + b.kind : b.kind]);
    b.pal = randInt(0, 9);
    if (rusty) {
        b.rusty = true;
        b.label = RUSTY_LABELS[b.kind];
        b.seed = randInt(1, 1e9);
        [b.roof, b.roofDark] = style === 'factory' ? ['#6a5a4a', '#43392f'] : style === 'clinic' ? ['#b8b4aa', '#85807a'] : style === 'flat' ? ['#6b665e', '#4a463f'] : pick([['#8a4a2a', '#5a2e1a'], ['#7a5a3a', '#4e3a24'], ['#6a6a5a', '#44443a'], ['#9a5a30', '#633a1e']]);
        if (style === 'flat') { b.skylights = randInt(0, 2); b.tank = { x: rand(0.25, 0.75), y: rand(0.25, 0.75) }; }
        return;
    }
    if (style === 'gable' || style === 'hip') {
        if (b.flat) [b.roof, b.roofDark] = pick(ROOF_COLORS);
        b.chimney = Math.random() < 0.7 ? { x: rand(0.2, 0.8), y: rand(0.25, 0.75) } : null;
        b.solar = Math.random() < 0.35;
    } else if (style === 'garden') {
        b.roof = '#9a9488'; b.roofDark = '#6e695f';
        b.planters = [];
        for (let i = randInt(3, 6); i > 0; i--) b.planters.push({ x: rand(0.15, 0.85), y: rand(0.15, 0.85), w: rand(0.12, 0.28), h: rand(0.06, 0.1), flip: Math.random() < 0.5 });
        b.deck = { x: rand(0.2, 0.4), y: rand(0.2, 0.4), w: rand(0.3, 0.45), h: rand(0.3, 0.45) };
    } else if (style === 'shop') {
        b.awning = { side: randInt(0, 3), cols: pick(AWNINGS) };
    } else if (style === 'flat') {
        b.skylights = randInt(1, 3);
        b.tank = { x: rand(0.25, 0.75), y: rand(0.25, 0.75) };
    } else if (HOTEL_ROOFS[style]) {
        [b.roof, b.roofDark] = HOTEL_ROOFS[style];
        if (style === 'pool') b.poolSide = Math.random() < 0.5;
    } else if (style === 'helipad') {
        b.roof = '#e6e8ea'; b.roofDark = '#b5bcc4';
    }
}

// type: 'ordinary' (fields, forests and towns), 'city' (streets and towers), 'rusty' (a ruined, abandoned facility),
// 'maze' or 'mountain' (see generateTerrain).
// floors: whether the tall buildings have upper floors you can climb (Escape only).
function generateWorld(type = 'ordinary', opts = {}) {
    if (type === 'maze' || type === 'mountain') return generateTerrain(type);
    if (type === 'cavern') return generateCavern();
    if (type === 'haunted') return generateHaunted();
    // Wasteland (Assassin's map): open ground with long sightlines, a few lone trees and wreckage strewn about
    const waste = type === 'wasteland';
    const city = type !== 'ordinary' && !waste, rusty = type === 'rusty';
    const W = CONFIG.WORLD_SIZE;
    const grid = new Grid(256, 90);
    const obstacles = [], buildings = [], biomes = [], roads = [], decor = [], lootSpots = [], parks = [], streets = [], stairs = [];
    const addCircle = o => { obstacles.push(o); grid.insert(o); };
    const addBox = o => { obstacles.push(o); grid.insertBox(o); };
    const inBuilding = (x, y, m) => buildings.some(b => x > b.x0 - m && x < b.x1 + m && y > b.y0 - m && y < b.y1 + m);
    const clear = (x, y, r) => x > r && y > r && x < W - r && y < W - r && !inBuilding(x, y, r) && !blockedAt(grid, x, y, r);
    const nearRoad = (x, y, d) => roads.some(pts => pts.some((p, i) => i > 0 && segHitsCircle(pts[i - 1].x, pts[i - 1].y, p.x, p.y, x, y, d)));
    const biomeAt = (x, y) => biomes.find(b => Math.hypot(b.x - x, b.y - y) < b.r) || null;
    const randIn = (c, r) => { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * r; return { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d }; };

    // --- Regions: towns, rocky areas, forests. Everything else is open field ---
    const placeRegions = (type, count, rmin, rmax) => {
        for (let i = 0; i < count; i++) {
            for (let tries = 0; tries < 60; tries++) {
                const r = rand(rmin, rmax);
                const x = rand(r + 300, W - r - 300), y = rand(r + 300, W - r - 300);
                const spacing = type === 'town' ? 1.25 : 0.85;
                if (biomes.every(b => Math.hypot(b.x - x, b.y - y) > (r + b.r) * spacing)) { biomes.push({ type, x, y, r }); break; }
            }
        }
    };
    if (!city && !waste) {
        placeRegions('town', Math.round(5 * MAP_AREA), 650, 850);
        placeRegions('rocks', Math.round(5 * MAP_AREA), 450, 750);
        placeRegions('forest', Math.round(8 * MAP_AREA), 600, 1000);
    }
    const towns = biomes.filter(b => b.type === 'town');

    // --- Roads linking towns (minimum spanning tree) ---
    const linked = towns.slice(0, 1);
    while (linked.length < towns.length) {
        let best = null;
        for (const a of linked) for (const b of towns) {
            if (linked.includes(b)) continue;
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (!best || d < best.d) best = { a, b, d };
        }
        const { a, b } = best;
        const pts = [];
        const nx = -(b.y - a.y) / best.d, ny = (b.x - a.x) / best.d;
        for (let i = 0; i <= 6; i++) {
            const t = i / 6, j = i === 0 || i === 6 ? 0 : rand(-140, 140);
            pts.push({ x: lerp(a.x, b.x, t) + nx * j, y: lerp(a.y, b.y, t) + ny * j });
        }
        roads.push(pts);
        linked.push(b);
    }

    // Rusty: a fenced-off scrapyard instead of a park, piled with wrecks, drums and tyres
    const scrapyard = (x0, y0, x1, y1) => {
        for (let i = 0; i < 7; i++) {
            const x = rand(x0 + 60, x1 - 60), y = rand(y0 + 60, y1 - 60), horiz = Math.random() < 0.5;
            if (clear(x, y, 50)) addBox({ type: 'crate', car: true, rust: true, x, y, hw: horiz ? 40 : 19, hh: horiz ? 19 : 40, color: pick(RUST_CAR_COLORS), horiz, seed: randInt(1, 1e9) });
        }
        for (let i = 0; i < 8; i++) { const x = rand(x0 + 30, x1 - 30), y = rand(y0 + 30, y1 - 30); if (clear(x, y, 18)) addBox({ type: 'crate', barrel: true, x, y, hw: 14, hh: 14, color: pick(['#7a3b22', '#5a5f3a', '#8a6a2a']) }); }
        for (let i = 0; i < 4; i++) { const x = rand(x0 + 40, x1 - 40), y = rand(y0 + 40, y1 - 40); if (clear(x, y, 22)) lootSpots.push({ x, y, box: Math.random() < 0.6 }); }
    };

    // --- Buildings ---
    const makeBuilding = (cx, cy, w, h, kind = 'house') => {
        const T = WALL_T, D = DOOR_W;
        const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
        const [roof, roofDark] = city ? [kind === 'hospital' ? '#d9dde2' : kind === 'hotel' ? pick(['#5d4f6e', '#4f5d6e', '#6e5a4f']) : pick(CITY_ROOFS), null] : pick(ROOF_COLORS);
        const b = { id: buildings.length, x0, y0, x1, y1, cx, cy, w, h, roof, roofDark: roofDark || shade(roof, -0.3), wall: pick(WALL_COLORS), floor: randInt(0, 1), doors: [], roofAlpha: 1, kind: 'house', floors: 1 };
        // City buildings get flat roofs with a few AC units on top, and many have upper floors you can climb to
        if (city) {
            b.flat = true;
            b.ac = [];
            for (let i = randInt(1, 3); i > 0; i--) b.ac.push({ x: rand(0.2, 0.8), y: rand(0.2, 0.8), s: rand(14, 24) });
            b.kind = kind;
            // Every building in the city or the facility has at least two floors
            b.floors = kind === 'hotel' ? (rusty ? randInt(3, 6) : randInt(10, 14)) : kind === 'hospital' ? randInt(rusty ? 2 : 4, rusty ? 4 : 6) : randInt(2, rusty ? 4 : 3);
            styleBuilding(b, rusty);
            if (b.floors > 1 && opts.floors) { b.stairs = floorStairs(b, 1); stairs.push({ ...b.stairs, dir: 'up', b, to: 2 }); }
        }
        if (!city) styleBuilding(b, false);
        // How much punishment it takes before it comes down (every mode, every map)
        b.hp = b.maxHp = 300 + (b.w * b.h) / 400 + b.floors * 60;
        buildings.push(b);
        const hWall = (xa, xb, y) => { if (xb - xa > 2) addBox({ type: 'wall', x: (xa + xb) / 2, y, hw: (xb - xa) / 2, hh: T / 2, color: b.wall }); };
        const vWall = (ya, yb, x) => { if (yb - ya > 2) addBox({ type: 'wall', x, y: (ya + yb) / 2, hw: T / 2, hh: (yb - ya) / 2, color: b.wall }); };

        // (rooms and furniture go in once the outside walls and doors are up: see furnishHouse)
        const divX = null, divY = null;

        const doorSides = shuffle(['top', 'bottom', 'left', 'right']).slice(0, randInt(2, 3));
        const side = (name, horizontal, fixed, a0, a1, nx, ny) => {
            if (!doorSides.includes(name)) { horizontal ? hWall(a0, a1, fixed) : vWall(a0, a1, fixed); return; }
            let m;
            const avoid = horizontal ? divX : divY;
            for (let t = 0; t < 12; t++) {
                m = lerp(a0 + D, a1 - D, rand(0.1, 0.9));
                if (avoid === null || Math.abs(m - avoid) > D) break;
            }
            const dx = horizontal ? m : fixed, dy = horizontal ? fixed : m;
            if (horizontal) { hWall(a0, m - D / 2, fixed); hWall(m + D / 2, a1, fixed); }
            else { vWall(a0, m - D / 2, fixed); vWall(m + D / 2, a1, fixed); }
            b.doors.push({ x: dx, y: dy, outer: { x: dx + nx * 55, y: dy + ny * 55 }, inner: { x: dx - nx * 55, y: dy - ny * 55 } });
        };
        side('top', true, y0 + T / 2, x0, x1, 0, -1);
        side('bottom', true, y1 - T / 2, x0, x1, 0, 1);
        side('left', false, x0 + T / 2, y0 + T, y1 - T, -1, 0);
        side('right', false, x1 - T / 2, y0 + T, y1 - T, 1, 0);

        // Its own floor plan, rooms and furniture
        const api = { addBox, grid, T, rusty, city, placed: [], removed: [] };
        furnishHouse(b, api);
        // Anything pulled out to keep a room reachable comes off the obstacle list too
        if (api.removed.length) { const gone = new Set(api.removed); for (let i = obstacles.length - 1; i >= 0; i--) if (gone.has(obstacles[i])) obstacles.splice(i, 1); }

        // Loot inside
        const n = randInt(2, 4);
        for (let i = 0, tries = 0; i < n && tries < 30; tries++) {
            const x = rand(x0 + 40, x1 - 40), y = rand(y0 + 40, y1 - 40);
            if (blockedAt(grid, x, y, 22)) continue;
            lootSpots.push({ x, y, good: true, box: i === 0 || Math.random() < 0.3 });
            i++;
        }
    };

    for (const t of towns) {
        decor.push({ x: t.x, y: t.y, s: t.r / 105, spr: 6 });
        const n = randInt(6, 10);
        for (let placed = 0, tries = 0; placed < n && tries < 120; tries++) {
            const w = Math.round(rand(240, 480)), h = Math.round(rand(220, 400));
            const p = randIn(t, t.r - 150);
            if (p.x - w / 2 < 200 || p.y - h / 2 < 200 || p.x + w / 2 > W - 200 || p.y + h / 2 > W - 200) continue;
            if (buildings.some(b => p.x + w / 2 + 130 > b.x0 && p.x - w / 2 - 130 < b.x1 && p.y + h / 2 + 130 > b.y0 && p.y - h / 2 - 130 < b.y1)) continue;
            if (nearRoad(p.x, p.y, Math.max(w, h) / 2 + 30)) continue;
            makeBuilding(p.x, p.y, w, h);
            placed++;
        }
    }

    // --- Structures out in the open: supply crate stacks and ruined walls ---
    const crateStack = (cx, cy) => {
        const n = randInt(3, 6);
        for (let i = 0; i < n; i++) {
            const s = rand(20, 28);
            const x = cx + rand(-60, 60), y = cy + rand(-60, 60);
            if (clear(x, y, s + 4)) addBox({ type: 'crate', x, y, hw: s, hh: s });
        }
        for (let i = 0; i < 2; i++) {
            const a = rand(0, TAU), x = cx + Math.cos(a) * 95, y = cy + Math.sin(a) * 95;
            if (clear(x, y, 22)) lootSpots.push({ x, y, good: true, box: i === 0 });
        }
    };
    const ruin = (cx, cy) => {
        const T = 22, len = rand(160, 280);
        const horizontal = Math.random() < 0.5;
        // An L-shape, broken into chunks with gaps so it looks crumbled
        const pieces = [];
        for (let s = 0; s < len; s += rand(50, 90)) {
            const l = Math.min(len - s, rand(40, 80));
            pieces.push(horizontal ? { x: cx - len / 2 + s + l / 2, y: cy, hw: l / 2, hh: T / 2 } : { x: cx, y: cy - len / 2 + s + l / 2, hw: T / 2, hh: l / 2 });
        }
        const arm = rand(90, 150), sign = Math.random() < 0.5 ? 1 : -1;
        pieces.push(horizontal ? { x: cx - len / 2 + T / 2, y: cy + sign * arm / 2, hw: T / 2, hh: arm / 2 } : { x: cx + sign * arm / 2, y: cy - len / 2 + T / 2, hw: arm / 2, hh: T / 2 });
        if (pieces.some(p => !clear(p.x, p.y, Math.max(p.hw, p.hh) + 10))) return;
        for (const p of pieces) addBox({ type: 'wall', ...p, color: '#8f897d', ruin: true });
        lootSpots.push({ x: cx + (horizontal ? 0 : sign * 50), y: cy + (horizontal ? sign * 50 : 0), good: Math.random() < 0.5 });
    };
    for (const t of towns) for (let i = 0; i < 3; i++) { const p = randIn(t, t.r); if (!nearRoad(p.x, p.y, 70)) crateStack(p.x, p.y); }
    if (!city) for (let i = 0; i < (waste ? 8 : 26) * MAP_AREA; i++) { const x = rand(300, W - 300), y = rand(300, W - 300); if (!biomeAt(x, y) && !nearRoad(x, y, 90)) crateStack(x, y); }
    if (!city) for (let i = 0; i < (waste ? 22 : 30) * MAP_AREA; i++) { const x = rand(300, W - 300), y = rand(300, W - 300); const bm = biomeAt(x, y); if ((!bm || bm.type === 'rocks') && !nearRoad(x, y, 120)) ruin(x, y); }

    // --- Natural cover ---
    const tree = (x, y) => {
        const canopy = rand(58, 90);
        const o = { type: 'tree', x, y, r: canopy * 0.27, canopy, spr: randInt(0, 7), rot: rand(0, TAU), hp: TREE_HP, maxHp: TREE_HP, hitAt: -9999 };
        if (clear(x, y, o.r + 40) && !nearRoad(x, y, 50)) addCircle(o);
    };
    const rock = (x, y, rmin, rmax) => {
        const o = { type: 'rock', x, y, r: rand(rmin, rmax), spr: randInt(0, 5), rot: rand(0, TAU) };
        if (clear(x, y, o.r + 25) && !nearRoad(x, y, o.r + 30)) addCircle(o);
    };
    const bush = (x, y) => {
        const o = { type: 'bush', x, y, r: rand(30, 44), spr: randInt(0, 3), rot: rand(0, TAU), hp: BUSH_HP, maxHp: BUSH_HP, hitAt: -9999 };
        if (clear(x, y, o.r * 0.5)) addCircle(o);
    };

    for (const bm of biomes) {
        const area = Math.PI * bm.r * bm.r;
        if (bm.type === 'forest') {
            for (let i = 0; i < 10; i++) { const p = randIn(bm, bm.r); decor.push({ ...p, s: rand(2, 3.5), spr: 4 }); }
            for (let i = 0; i < area / 11000; i++) { const p = randIn(bm, bm.r); tree(p.x, p.y); }
            for (let i = 0; i < area / 22000; i++) { const p = randIn(bm, bm.r); bush(p.x, p.y); }
            for (let i = 0; i < 4; i++) { const p = randIn(bm, bm.r); rock(p.x, p.y, 25, 45); }
            for (let i = 0; i < 8; i++) { const p = randIn(bm, bm.r * 0.9); if (clear(p.x, p.y, 22)) lootSpots.push({ ...p, box: Math.random() < 0.35 }); }
        } else if (bm.type === 'rocks') {
            for (let i = 0; i < 12; i++) { const p = randIn(bm, bm.r); decor.push({ ...p, s: rand(1.6, 3), spr: 5 }); }
            for (let i = 0; i < area / 20000; i++) { const p = randIn(bm, bm.r); rock(p.x, p.y, 22, 80); }
            for (let i = 0; i < 6; i++) { const p = randIn(bm, bm.r); tree(p.x, p.y); }
            for (let i = 0; i < 6; i++) { const p = randIn(bm, bm.r * 0.9); if (clear(p.x, p.y, 22)) lootSpots.push({ ...p, good: Math.random() < 0.4, box: Math.random() < 0.35 }); }
        } else if (bm.type === 'town') {
            for (let i = 0; i < 8; i++) { const p = randIn(bm, bm.r + 100); tree(p.x, p.y); }
            for (let i = 0; i < 14; i++) { const p = randIn(bm, bm.r + 100); bush(p.x, p.y); }
        }
    }

    // Open fields: sparse trees, bushes and boulders
    const field = (n, fn) => { if (city) return; for (let i = 0; i < n; i++) { const x = rand(150, W - 150), y = rand(150, W - 150); if (!biomeAt(x, y)) fn(x, y); } };

    // --- City: a grid of streets; each block holds buildings or a little park, with cars parked at the curb ---
    if (city) {
        const P = CITY.block, S = CITY.street, n = Math.round(W / P);
        for (let k = 0; k <= n; k++) streets.push(k * P);
        for (let bx = 0; bx < n; bx++) for (let by = 0; by < n; by++) {
            const x0 = bx * P + S / 2 + 30, y0 = by * P + S / 2 + 30, x1 = (bx + 1) * P - S / 2 - 30, y1 = (by + 1) * P - S / 2 - 30;
            if (Math.random() < 0.16) {
                parks.push({ x0, y0, x1, y1 });
                if (rusty) { scrapyard(x0, y0, x1, y1); continue; }
                for (let i = 0; i < 12; i++) tree(rand(x0 + 30, x1 - 30), rand(y0 + 30, y1 - 30));
                for (let i = 0; i < 8; i++) bush(rand(x0 + 20, x1 - 20), rand(y0 + 20, y1 - 20));
                for (let i = 0; i < 3; i++) { const x = rand(x0 + 40, x1 - 40), y = rand(y0 + 40, y1 - 40); if (clear(x, y, 22)) lootSpots.push({ x, y, box: Math.random() < 0.5 }); }
                continue;
            }
            // One big building, two halves or four corner lots
            const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
            const split = pick([1, 2, 2, 4, 4]);
            const lots = split === 1 ? [[x0, y0, x1, y1]]
                : split === 4 ? [[x0, y0, mx, my], [mx, y0, x1, my], [x0, my, mx, y1], [mx, my, x1, y1]]
                : Math.random() < 0.5 ? [[x0, y0, mx, y1], [mx, y0, x1, y1]] : [[x0, y0, x1, my], [x0, my, x1, y1]];
            // Whole blocks are hotels or hospitals, half blocks are sometimes hospitals, the rest are houses and shops
            const kind = split === 1 ? (Math.random() < 0.65 ? 'hotel' : 'hospital') : split === 2 && Math.random() < 0.12 ? 'hospital' : 'house';
            for (const [lx0, ly0, lx1, ly1] of lots) {
                const lw = lx1 - lx0, lh = ly1 - ly0, big = split === 1;
                const w = Math.round(lw * rand(big ? 0.78 : 0.66, big ? 0.9 : 0.86)), h = Math.round(lh * rand(big ? 0.78 : 0.66, big ? 0.9 : 0.86));
                makeBuilding((lx0 + lx1) / 2 + rand(-0.4, 0.4) * (lw - w), (ly0 + ly1) / 2 + rand(-0.4, 0.4) * (lh - h), w, h, kind);
            }
        }
        // Parked cars along both curbs of every street, skipping the intersections
        const car = (x, y, horiz) => {
            const o = { type: 'crate', car: true, x, y, hw: horiz ? 40 : 19, hh: horiz ? 19 : 40, color: pick(rusty ? RUST_CAR_COLORS : CAR_COLORS), horiz, rust: rusty, seed: randInt(1, 1e9) };
            if (!blockedAt(grid, x, y, 46)) addBox(o);
        };
        for (const at of streets) for (let k = 0; k < n; k++) {
            for (let i = randInt(0, 3); i > 0; i--) {
                const along = k * P + S / 2 + 60 + Math.random() * (P - S - 120), side = (Math.random() < 0.5 ? -1 : 1) * (S / 2 - 24);
                if (at + side < 60 || at + side > W - 60) continue;
                Math.random() < 0.5 ? car(along, at + side, true) : car(at + side, along, false);
            }
        }
        // Rusty: shipping containers, oil drums and old sandbag lines all over the place
        if (rusty) for (let i = 0; i < 220 * MAP_AREA; i++) {
            const x = rand(200, W - 200), y = rand(200, W - 200), r = Math.random();
            if (r < 0.35) { const horiz = Math.random() < 0.5, o = { type: 'wall', container: true, x, y, hw: horiz ? 60 : 24, hh: horiz ? 24 : 60, color: pick(RUST_CONTAINERS) }; if (clear(x, y, 70)) addBox(o); }
            else if (r < 0.7) { if (clear(x, y, 20)) addBox({ type: 'crate', barrel: true, x, y, hw: 14, hh: 14, color: pick(['#7a3b22', '#5a5f3a', '#3b4a5a', '#8a6a2a']) }); }
            else { const horiz = Math.random() < 0.5; if (clear(x, y, 60)) addBox({ type: 'wall', sandbags: true, x, y, hw: horiz ? 50 : 13, hh: horiz ? 13 : 50, color: '#8d7d5a' }); }
        }
        // Concrete barriers and dumpsters on the sidewalks give a bit of cover between buildings
        for (let i = 0; i < 160 * MAP_AREA; i++) {
            const x = rand(200, W - 200), y = rand(200, W - 200);
            if (!clear(x, y, 40)) continue;
            if (Math.random() < 0.5) addBox({ type: 'wall', x, y, hw: Math.random() < 0.5 ? 34 : 9, hh: Math.random() < 0.5 ? 9 : 34, color: '#a8a39a' });
            else addBox({ type: 'crate', x, y, hw: 18, hh: 18 });
        }
    }
    if (waste) {
        // Broken stuff scattered thin across open ground (no cars): oil drums, rubble and smashed crates
        const scatter = (n, fn) => { for (let i = 0; i < n; i++) fn(rand(200, W - 200), rand(200, W - 200)); };
        scatter(70 * MAP_AREA, (x, y) => { for (let k = randInt(1, 3); k > 0; k--) { const bx = x + rand(-40, 40), by = y + rand(-40, 40); if (clear(bx, by, 18)) addBox({ type: 'crate', barrel: true, x: bx, y: by, hw: 14, hh: 14, color: pick(['#7a3b22', '#5a5f3a', '#3b4a5a', '#8a6a2a']) }); } });
        scatter(60 * MAP_AREA, (x, y) => { const l = rand(18, 40), horiz = Math.random() < 0.5; if (clear(x, y, l + 10)) addBox({ type: 'wall', x, y, hw: horiz ? l : 10, hh: horiz ? 10 : l, color: '#8f897d', ruin: true }); });
        scatter(35 * MAP_AREA, (x, y) => { const sz = rand(14, 20); if (clear(x, y, sz + 6)) addBox({ type: 'crate', x, y, hw: sz, hh: sz }); });
        scatter(40 * MAP_AREA, (x, y) => { if (clear(x, y, 22)) lootSpots.push({ x, y, good: Math.random() < 0.3 }); });
    }
    field((waste ? 22 : 320) * MAP_AREA, tree);
    field((waste ? 20 : 360) * MAP_AREA, bush);
    field((waste ? 30 : 130) * MAP_AREA, (x, y) => rock(x, y, 24, waste ? 40 : 55));
    field(420 * MAP_AREA, (x, y) => decor.push({ x, y, s: rand(1.2, 3.2), spr: waste ? 5 : randInt(0, 3) }));

    const decorGrid = new Grid(512, 900);
    if (city) decor.length = 0;
    for (const d of decor) decorGrid.insert(d);

    // --- Minimap background ---
    const [mm, g] = makeCanvas(200, 200);
    const k = 200 / W;
    g.fillStyle = rusty ? '#7d7262' : city ? '#9a958c' : '#5b9a45';
    g.fillRect(0, 0, 200, 200);
    if (city) {
        g.fillStyle = rusty ? '#5d4f3e' : '#5b9a45';
        for (const pk of parks) g.fillRect(pk.x0 * k, pk.y0 * k, (pk.x1 - pk.x0) * k, (pk.y1 - pk.y0) * k);
        g.fillStyle = '#45454c';
        for (const at of streets) { g.fillRect(at * k - CITY.street * k / 2, 0, CITY.street * k, 200); g.fillRect(0, at * k - CITY.street * k / 2, 200, CITY.street * k); }
    }
    for (const bm of biomes) {
        g.fillStyle = bm.type === 'forest' ? 'rgba(30,80,32,0.55)' : bm.type === 'rocks' ? 'rgba(150,142,120,0.5)' : 'rgba(170,135,85,0.45)';
        g.beginPath(); g.arc(bm.x * k, bm.y * k, bm.r * k, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(190,160,110,0.9)';
    g.lineWidth = 2;
    for (const pts of roads) { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x * k, p.y * k) : g.moveTo(p.x * k, p.y * k))); g.stroke(); }
    for (const o of obstacles) {
        if (o.type === 'tree') { g.fillStyle = '#2a5626'; g.fillRect(o.x * k - 1, o.y * k - 1, 2.2, 2.2); }
        else if (o.type === 'rock') { g.fillStyle = '#b4b8c0'; g.fillRect(o.x * k - 1, o.y * k - 1, 2, 2); }
        else if (o.car) { g.fillStyle = o.color; g.fillRect(o.x * k - 1, o.y * k - 1, 2, 2); }
        else if (o.type === 'crate') { g.fillStyle = '#c98f52'; g.fillRect(o.x * k - 1, o.y * k - 1, 2, 2); }
        else if (o.ruin) { g.fillStyle = '#d6d0c4'; g.fillRect((o.x - o.hw) * k, (o.y - o.hh) * k, Math.max(1, o.hw * 2 * k), Math.max(1, o.hh * 2 * k)); }
    }
    for (const b of buildings) {
        g.fillStyle = b.roof;
        g.fillRect(b.x0 * k, b.y0 * k, b.w * k, b.h * k);
    }
    if (rusty) { g.fillStyle = 'rgba(120,70,30,0.28)'; g.fillRect(0, 0, 200, 200); }

    return { obstacles, grid, decorGrid, buildings, biomes, roads, lootSpots, minimap: mm, city: city ? { streets, parks } : null, rusty, stairs, floor: null };
}

// ---------- Upper floors ----------
// Each floor above the street is its own map, centered on its building but a lot roomier than the footprint
// (interiors are drawn at a bigger scale than the city). Stairs alternate ends, so you cross every floor going up.
const FLOOR = { minSize: 1300, maxSize: 2100, corridor: 150, lobby: 230, wall: 22, inner: 12, margin: 70 };
const FACE_ROT = { n: 0, s: Math.PI, w: -Math.PI / 2, e: Math.PI / 2 };

// The floor plan's bounds for a building
function floorRect(b) {
    const W = CONFIG.WORLD_SIZE;
    let s = Math.max(b.kind === 'house' ? 1.7 : 2, FLOOR.minSize / Math.min(b.w, b.h));
    s = Math.min(s, FLOOR.maxSize / Math.max(b.w, b.h));
    const w = Math.round(b.w * s), h = Math.round(b.h * s);
    const cx = clamp(b.cx, w / 2 + 80, W - w / 2 - 80), cy = clamp(b.cy, h / 2 + 80, W - h / 2 - 80);
    return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2, w, h, cx, cy, inset: 110 };
}

// k is the floor the stairs leave from (1 = street level). Works on a building (street) or a floor rect.
function floorStairs(r, k) {
    const far = k % 2 === 0, d = r.inset || 62;
    return r.w >= r.h ? { x: far ? r.x1 - d : r.x0 + d, y: r.cy } : { x: r.cx, y: far ? r.y1 - d : r.y0 + d };
}

// Small seeded random generator so a floor's look can be redrawn identically later
function seededRand(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Local coordinates for furnishing a room: lx runs along the back wall, ly from the back wall (0) to the door wall (D)
function roomFrame(r, door) {
    const horiz = door === 'n' || door === 's';
    const W = horiz ? r.x1 - r.x0 : r.y1 - r.y0, D = horiz ? r.y1 - r.y0 : r.x1 - r.x0;
    const at = door === 's' ? (lx, ly) => ({ x: r.x0 + lx, y: r.y0 + ly })
        : door === 'n' ? (lx, ly) => ({ x: r.x1 - lx, y: r.y1 - ly })
        : door === 'e' ? (lx, ly) => ({ x: r.x0 + ly, y: r.y1 - lx })
        : (lx, ly) => ({ x: r.x1 - ly, y: r.y0 + lx });
    return { W, D, at, horiz, rot: FACE_ROT[{ s: 'n', n: 's', e: 'w', w: 'e' }[door]] };
}

const ROOM_TYPES = {
    hotel: [['suite', 6], ['twin', 2], ['storage', 1], ['kitchen', 1], ['conference', 1], ['gym', 0.7], ['bathroom', 0.7]],
    hospital: [['ward', 5], ['pharmacy', 2], ['surgery', 1.5], ['office', 1.5], ['lab', 1.5], ['bathroom', 0.8], ['security', 0.6]],
    hq: [['office', 3], ['armory', 2], ['server', 1.5], ['briefing', 1.2], ['barracks', 1.2], ['control', 2], ['security', 1], ['comms', 1], ['kitchen', 0.6]],
    house: [['bedroom', 3], ['living', 2], ['kitchen', 1.5], ['bathroom', 1], ['study', 1], ['storage', 0.6]],
    rusty: [['workshop', 3], ['storage', 2], ['control', 1.5], ['armory', 1.2], ['lab', 1], ['barracks', 1], ['comms', 1], ['security', 0.8], ['office', 1]]
};
const ROOM_FLOORS = {
    suite: 'carpet', twin: 'carpet', storage: 'concrete', ward: 'lino', pharmacy: 'lino', surgery: 'surgery', office: 'office', armory: 'concrete', server: 'raised', briefing: 'office', barracks: 'concrete', bedroom: 'wood',
    control: 'raised', lab: 'lino', kitchen: 'lino', conference: 'carpet', gym: 'concrete', bathroom: 'lino', security: 'office', comms: 'raised', workshop: 'concrete', living: 'wood', study: 'wood'
};
const ROOM_NAMES = {
    pharmacy: 'PHARMACY', surgery: 'SURGERY', office: 'OFFICE', armory: 'ARMORY', server: 'SERVERS', briefing: 'BRIEFING', barracks: 'BARRACKS', storage: 'STORAGE', bedroom: 'BEDROOM',
    control: 'CONTROL ROOM', lab: 'LAB', kitchen: 'KITCHEN', conference: 'CONFERENCE', gym: 'GYM', bathroom: 'WC', security: 'SECURITY', comms: 'COMMS', workshop: 'WORKSHOP'
};

// Open-plan halls: the floor is split into cells and each cell gets a cluster of furniture that suits the building
const OPEN_THEMES = {
    hotel: ['lounge', 'lounge', 'dining', 'dining', 'gym', 'plants'],
    hospital: ['beds', 'beds', 'waiting', 'desks', 'plants'],
    hq: ['console', 'desks', 'maptable', 'crates', 'armory'],
    house: ['lounge', 'dining', 'shelves', 'desks'],
    rusty: ['machines', 'machines', 'shelves', 'crates', 'console', 'wreck']
};
const OPEN_FLOORS = { hotel: 'marble', hospital: 'lino', hq: 'office', house: 'wood', rusty: 'concrete' };

function furnishOpen(theme, F, ctx2) {
    const { solid, deco, lootSpots } = ctx2;
    const { W, D, at, rot } = F;
    const put = (furn, lx, ly, lw, lh, extra) => { const p = at(lx, ly); return solid(furn, p.x, p.y, lw, lh, rot, extra); };
    const dec = (d, lx, ly, lw, lh, extra) => { const p = at(lx, ly); deco(d, p.x, p.y, lw, lh, rot, extra); };
    const loot = (lx, ly, extra) => { const p = at(lx, ly); lootSpots.push({ ...p, ...extra }); };
    // Keep a walkway along the corridor side
    const cols = Math.max(1, Math.floor((W - 40) / 240)), rows = Math.max(1, Math.floor((D - 90) / 210));
    const cw = (W - 40) / cols, rh = (D - 90) / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const x = 20 + (i + 0.5) * cw, y = 20 + (j + 0.5) * rh;
        switch (pick(OPEN_THEMES[theme])) {
            case 'desks':
                // Four desks back to back with a low divider, each with a computer and a chair
                put('partition', x, y, 150, 6);
                put('partition', x, y, 6, 110);
                for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                    put('desk', x + sx * 40, y + sy * 26, 70, 38, { monitor: true });
                    dec('chair', x + sx * 40, y + sy * 62, 26, 26);
                }
                if (Math.random() < 0.35) loot(x + 90, y);
                break;
            case 'console':
                put('monitorwall', x, y - 70, 180, 14);
                put('console', x, y - 10, 170, 40);
                for (let k = -1; k <= 1; k++) dec('chair', x + k * 55, y + 28, 26, 26);
                put('rack', x + 100, y + 50, 36, 50);
                dec('cables', x, y + 30, 160, 60);
                if (Math.random() < 0.4) loot(x - 80, y + 60);
                break;
            case 'maptable':
                put('maptable', x, y, 120, 76);
                put('radio', x + 95, y - 50, 46, 32);
                if (Math.random() < 0.5) loot(x - 90, y + 50, { ammo: true });
                break;
            case 'crates':
                put('milcrate', x - 40, y - 20, 46, 46);
                put('milcrate', x + 12, y - 24, 46, 46);
                put('ammo', x - 20, y + 36, 44, 26);
                put('pallet', x + 60, y + 30, 60, 50);
                loot(x + 70, y - 60, { box: Math.random() < 0.5, ammo: true });
                break;
            case 'armory':
                put('weaponrack', x, y - 50, 150, 20);
                put('gunbench', x, y + 10, 110, 46);
                put('ammo', x + 90, y + 50, 40, 26);
                loot(x - 80, y + 50, { box: true });
                break;
            case 'lounge':
                dec('rug', x, y, 200, 150, { color: pick(['#7a3b3b', '#3b4f7a', '#5a7a3b', '#6b5a3a']) });
                put('sofa', x, y - 50, 120, 40);
                put('coffeetable', x, y + 2, 80, 44);
                put('armchair', x - 80, y + 10, 40, 40);
                put('armchair', x + 80, y + 10, 40, 40);
                put('plant', x + 100, y - 60, 30, 30);
                if (Math.random() < 0.35) loot(x, y + 60);
                break;
            case 'dining':
                put('roundtable', x - 55, y - 30, 88, 88);
                put('roundtable', x + 55, y + 40, 88, 88);
                if (Math.random() < 0.3) loot(x + 70, y - 60);
                break;
            case 'gym':
                put('treadmill', x - 60, y - 30, 44, 70);
                put('treadmill', x, y - 30, 44, 70);
                put('weights', x + 70, y, 30, 110);
                put('bench', x - 30, y + 60, 70, 26);
                break;
            case 'plants':
                for (const [sx, sy] of [[-60, -40], [60, -40], [-60, 40], [60, 40]]) put('plant', x + sx, y + sy, 34, 34);
                put('bench', x, y, 90, 26);
                break;
            case 'beds':
                for (const sx of [-50, 50]) { put('bed', x + sx, y - 10, 50, 92, { hospital: true }); dec('ivstand', x + sx + 34, y - 46, 10, 10); }
                dec('curtain', x, y, 6, 120);
                if (Math.random() < 0.5) loot(x, y + 70, { med: true });
                break;
            case 'waiting':
                for (let k = 0; k < 3; k++) put('bench', x - 60 + k * 60, y - 30, 50, 24);
                for (let k = 0; k < 3; k++) put('bench', x - 60 + k * 60, y + 30, 50, 24);
                put('cooler', x + 105, y - 60, 24, 24);
                put('vending', x + 105, y + 40, 48, 32);
                break;
            case 'shelves':
                put('shelf', x, y - 45, 180, 24);
                put('shelf', x, y + 25, 180, 24);
                put('pallet', x + 100, y + 70, 50, 40);
                loot(x - 80, y - 5, { box: Math.random() < 0.5 });
                break;
            case 'machines':
                put('lathe', x - 40, y - 40, 90, 44);
                put('workbench', x + 30, y + 30, 120, 34);
                put('toolrack', x + 100, y - 40, 16, 90);
                put('drum', x - 90, y + 50, 30, 30, { color: pick(['#7a3b22', '#5a5f3a', '#3b4a5a']) });
                dec('oil', x - 20, y + 10, 90, 50);
                if (Math.random() < 0.4) loot(x - 90, y - 70, { box: true });
                break;
            case 'wreck':
                put('engine', x, y, 80, 50);
                for (let k = 0; k < 3; k++) put('drum', x - 70 + k * 30, y + 60, 28, 28, { color: '#7a3b22' });
                put('generator', x + 80, y - 50, 56, 40);
                dec('oil', x, y + 20, 140, 80);
                dec('papers', x - 60, y - 50, 80, 60);
                break;
        }
    }
}

function generateFloor(b, level) {
    const R = b.R || (b.R = floorRect(b));
    const grid = new Grid(256, 90), obstacles = [], lootSpots = [], decor = [], lights = [], zones = [];
    const top = level === b.floors, roof = top && !!b.hq, kind = b.hq ? 'hq' : b.kind;
    // Which set of rooms and halls this building has (the rusty facility has its own)
    const theme = b.hq ? 'hq' : b.rusty ? 'rusty' : kind;
    const T = FLOOR.wall, t = FLOOR.inner;
    const pals = FLOOR_PALETTES[b.rusty && !b.hq ? 'rusty' : kind], pal = pals[(b.pal || 0) % pals.length];
    const shell = roof ? '#a19b90' : pal[0], innerCol = pal[1];
    const addBox = o => { o.baked = true; obstacles.push(o); grid.insertBox(o); return o; };
    const wall = (x0, y0, x1, y1, color, extra) => {
        if (x1 - x0 < 2 || y1 - y0 < 2) return;
        addBox({ type: 'wall', x: (x0 + x1) / 2, y: (y0 + y1) / 2, hw: (x1 - x0) / 2, hh: (y1 - y0) / 2, color, ...extra });
    };
    // Outer shell (windows all round, parapet on the roof)
    wall(R.x0, R.y0, R.x1, R.y0 + T, shell, { windows: !roof });
    wall(R.x0, R.y1 - T, R.x1, R.y1, shell, { windows: !roof });
    wall(R.x0, R.y0 + T, R.x0 + T, R.y1 - T, shell, { windows: !roof });
    wall(R.x1 - T, R.y0 + T, R.x1, R.y1 - T, shell, { windows: !roof });
    const stairs = [{ ...floorStairs(R, level - 1), dir: 'down', b, to: level - 1 }];
    if (!top) stairs.push({ ...floorStairs(R, level), dir: 'up', b, to: level + 1 });
    for (const st of stairs) zones.push({ x0: st.x - 70, y0: st.y - 70, x1: st.x + 70, y1: st.y + 70 });

    // Anything solid (furniture, cover) goes through here so it never blocks a doorway or the stairs
    const free = (x, y, hw, hh) => {
        if (x - hw < R.x0 + T || x + hw > R.x1 - T || y - hh < R.y0 + T || y + hh > R.y1 - T) return false;
        if (zones.some(z => x + hw > z.x0 && x - hw < z.x1 && y + hh > z.y0 && y - hh < z.y1)) return false;
        let hit = false;
        grid.query(x, y, Math.max(hw, hh) + 8, o => {
            if (!hit && Math.abs(o.x - x) < o.hw + hw + 2 && Math.abs(o.y - y) < o.hh + hh + 2) hit = true;
        });
        return !hit;
    };
    const solid = (furn, x, y, lw, lh, rot, extra) => {
        const side = Math.abs(Math.sin(rot)) > 0.5;
        const hw = (side ? lh : lw) / 2, hh = (side ? lw : lh) / 2;
        if (!free(x, y, hw, hh)) return null;
        return addBox({ type: 'crate', furn, x, y, hw, hh, lw, lh, rot, seed: randInt(1, 1e9), ...extra });
    };
    const deco = (d, x, y, lw, lh, rot, extra) => decor.push({ d, x, y, lw, lh, rot, ...extra });

    let heli = null;
    const regions = [];  // floor finishes: { x0, y0, x1, y1, floor }
    if (roof) {
        // The helicopter waits at the far end of the roof from the stairs, so you have to fight all the way across
        const sd0 = stairs[0], wideRoof = R.w >= R.h, inset = 240;
        heli = wideRoof ? { x: sd0.x < R.cx ? R.x1 - inset : R.x0 + inset, y: R.cy } : { x: R.cx, y: sd0.y < R.cy ? R.y1 - inset : R.y0 + inset };
        zones.push({ x0: heli.x - 230, y0: heli.y - 230, x1: heli.x + 230, y1: heli.y + 230 });
        regions.push({ x0: R.x0, y0: R.y0, x1: R.x1, y1: R.y1, floor: 'roof' });
        // A stairwell hut around the way down, open toward the middle of the roof
        const sd = stairs[0], hs = 95, wide = R.w >= R.h, toward = wide ? Math.sign(R.cx - sd.x) : Math.sign(R.cy - sd.y);
        const hx0 = sd.x - hs, hy0 = sd.y - hs, hx1 = sd.x + hs, hy1 = sd.y + hs;
        if (wide) {
            wall(hx0, hy0, hx1, hy0 + t, shell); wall(hx0, hy1 - t, hx1, hy1, shell);
            toward > 0 ? wall(hx0, hy0, hx0 + t, hy1, shell) : wall(hx1 - t, hy0, hx1, hy1, shell);
        } else {
            wall(hx0, hy0, hx0 + t, hy1, shell); wall(hx1 - t, hy0, hx1, hy1, shell);
            toward > 0 ? wall(hx0, hy0, hx1, hy0 + t, shell) : wall(hx0, hy1 - t, hx1, hy1, shell);
        }
        zones.push({ x0: hx0 - 10, y0: hy0 - 10, x1: hx1 + 10, y1: hy1 + 10 });
        // Rooftop machinery, plus the sandbag nests the soldiers dug in behind
        const n = Math.round((R.w * R.h) / 70000);
        for (let i = 0; i < n * 4; i++) {
            const x = rand(R.x0 + 80, R.x1 - 80), y = rand(R.y0 + 80, R.y1 - 80), r = Math.random(), rot = pick([0, Math.PI / 2]);
            if (r < 0.25) solid('acunit', x, y, 80, 56, rot);
            else if (r < 0.4) solid('vent', x, y, 30, 30, 0);
            else if (r < 0.48) solid('tank', x, y, 90, 90, 0);
            else if (r < 0.52) solid('antenna', x, y, 18, 18, 0);
            else if (r < 0.8) solid('sandbags', x, y, 110, 26, rot);
            else solid('milcrate', x, y, 46, 46, rand(-0.2, 0.2));
        }
        for (let i = 0; i < 8; i++) deco('puddle', rand(R.x0 + 60, R.x1 - 60), rand(R.y0 + 60, R.y1 - 60), rand(40, 120), rand(30, 70), rand(0, TAU));
        for (let x = R.x0 + 200; x < R.x1 - 100; x += 320) lights.push({ x, y: R.y0 + 60, r: 160 }), lights.push({ x, y: R.y1 - 60, r: 160 });
    } else {
        const wide = R.w >= R.h, cw = FLOOR.corridor;
        // Axis terms: u runs along the corridor, v across it
        const P = (u, v) => (wide ? { x: u, y: v } : { x: v, y: u });
        const rectUV = (u0, v0, u1, v1) => { const a = P(u0, v0), c = P(u1, v1); return { x0: Math.min(a.x, c.x), y0: Math.min(a.y, c.y), x1: Math.max(a.x, c.x), y1: Math.max(a.y, c.y) }; };
        const wallUV = (u0, v0, u1, v1, color = innerCol) => { const r = rectUV(u0, v0, u1, v1); wall(r.x0, r.y0, r.x1, r.y1, color); };
        const uS = (wide ? R.x0 : R.y0) + T, uE = (wide ? R.x1 : R.y1) - T;
        // The corridor doesn't always run down the exact middle
        const C = (wide ? R.cy : R.cx) + Math.round(rand(-0.1, 0.1) * (wide ? R.h : R.w));
        const A0 = (wide ? R.y0 : R.x0) + T, A1 = (wide ? R.y1 : R.x1) - T;
        const U0 = uS + FLOOR.lobby, U1 = uE - FLOOR.lobby;
        const lobbyFloor = b.rusty && !b.hq ? 'concrete' : kind === 'hotel' ? 'marble' : kind === 'hospital' ? 'lino' : kind === 'hq' ? 'office' : 'wood';
        regions.push({ ...rectUV(uS, A0, uE, A1), floor: lobbyFloor });
        regions.push({ ...rectUV(U0, C - cw / 2, U1, C + cw / 2), floor: kind === 'hotel' ? 'runner' : kind === 'hospital' ? 'lino' : kind === 'hq' ? 'office' : 'wood' });
        // Ceiling lights down the corridor
        for (let u = U0; u <= U1; u += 230) lights.push({ ...P(u, C), r: 170 });
        // Lobbies at both ends: elevators, plants, seating, and a front desk of some kind
        for (const [la, lb] of [[uS, U0], [U1, uE]]) {
            const um = (la + lb) / 2;
            lights.push({ ...P(um, C), r: 230 });
            deco('elevator', ...Object.values(P(um, A0 + 6)), 90, 12, wide ? 0 : -Math.PI / 2);
            deco('elevator', ...Object.values(P(um, A1 - 6)), 90, 12, wide ? Math.PI : Math.PI / 2);
            for (const [u, v] of [[la + 34, A0 + 34], [la + 34, A1 - 34], [lb - 34, A0 + 34], [lb - 34, A1 - 34]]) { const q = P(u, v); solid('plant', q.x, q.y, 32, 32, 0); }
            const s1 = P(um + 70, A0 + 40), s2 = P(um - 70, A1 - 40);
            if (kind === 'hospital') { solid('counter', s1.x, s1.y, 130, 30, wide ? 0 : -Math.PI / 2); deco('sign', s1.x, s1.y + (wide ? 40 : 0), 0, 0, 0, { text: 'RECEPTION' }); }
            else if (kind === 'hq') { solid('desk', s1.x, s1.y, 80, 40, wide ? 0 : -Math.PI / 2); solid('vending', s2.x, s2.y, 50, 34, wide ? Math.PI : Math.PI / 2); }
            else { solid('sofa', s1.x, s1.y, 110, 40, wide ? 0 : -Math.PI / 2); solid('sofa', s2.x, s2.y, 110, 40, wide ? Math.PI : Math.PI / 2); }
            const fl = P(um, C + (wide ? 0 : 0));
            deco('floortext', fl.x + (wide ? 0 : 0), fl.y, 0, 0, 0, { text: `${level}F` });
        }
        // Rooms off both sides of the corridor
        const cuts = [U0];
        while (U1 - cuts[cuts.length - 1] > 420) cuts.push(cuts[cuts.length - 1] + rand(240, 320));
        cuts.push(U1);
        let num = 1;
        // Every floor is laid out its own way: rooms both sides, rooms one side and an open hall on the other, or one big hall
        const layout = pick(kind === 'house' ? ['rooms', 'open'] : b.hq ? ['rooms', 'rooms', 'open'] : ['rooms', 'open', 'hall']), openSgn = pick([-1, 1]);
        for (const sgn of [-1, 1]) {
            const v = C + sgn * cw / 2, vo = sgn < 0 ? A0 : A1;
            const door = wide ? (sgn < 0 ? 's' : 'n') : (sgn < 0 ? 'e' : 'w');
            if (layout === 'hall' || (layout === 'open' && sgn === openSgn)) {
                const area = rectUV(U0, Math.min(v, vo), U1, Math.max(v, vo));
                regions.push({ ...area, floor: OPEN_FLOORS[theme] });
                for (let u = U0 + 150; u < U1; u += 300) lights.push({ ...P(u, (v + vo) / 2), r: 280 });
                furnishOpen(theme, roomFrame(area, door), { solid, deco, lootSpots });
                continue;
            }
            for (const u of cuts) wallUV(u - t / 2, Math.min(v, vo), u + t / 2, Math.max(v, vo));
            for (let i = 0; i < cuts.length - 1; i++) {
                const ua = cuts[i] + t / 2, ub = cuts[i + 1] - t / 2;
                const room = rectUV(ua, Math.min(v, vo) + (sgn > 0 ? t / 2 : 0), ub, Math.max(v, vo) - (sgn < 0 ? t / 2 : 0));
                const F = roomFrame(room, door);
                // Door near one end of the room's corridor wall
                const dl = Math.random() < 0.5 ? rand(70, 110) : F.W - rand(70, 110);
                const dw = F.at(dl, F.D);
                const du = wide ? dw.x : dw.y;
                wallUV(ua - t / 2, v - t / 2, du - 46, v + t / 2);
                wallUV(du + 46, v - t / 2, ub + t / 2, v + t / 2);
                const inside = F.at(dl, F.D - 55);
                zones.push({ x0: inside.x - 60, y0: inside.y - 60, x1: inside.x + 60, y1: inside.y + 60 });
                const out = P(du, C + (sgn < 0 ? -1 : 1) * (cw / 2 - 30));
                zones.push({ x0: out.x - 50, y0: out.y - 50, x1: out.x + 50, y1: out.y + 50 });
                deco('door', dw.x, dw.y, 92, t, F.rot, { swing: dl < F.W / 2 ? 1 : -1 });
                const type = weightedPick(ROOM_TYPES[theme]);
                regions.push({ ...room, floor: ROOM_FLOORS[type] });
                lights.push({ ...F.at(F.W / 2, F.D / 2), r: Math.max(F.W, F.D) * 0.62 });
                const label = type === 'suite' || type === 'twin' ? `${level}${String(num).padStart(2, '0')}` : type === 'ward' ? `WARD ${level}${'ABCDEFGH'[num % 8]}` : ROOM_NAMES[type];
                const sp = P(du + 70, C + (sgn < 0 ? -1 : 1) * (cw / 2 - 18));
                if (label) deco('sign', sp.x, sp.y, 0, 0, 0, { text: label });
                num++;
                furnishRoom(type, F, dl, { solid, deco, lootSpots, wall, innerCol, t, kind, zones });
            }
        }
        // The HQ's soldiers barricaded the corridor with sandbags
        if (kind === 'hq') for (let i = 0; i < 2; i++) {
            const u = rand(U0 + 100, U1 - 100), side = Math.random() < 0.5 ? -1 : 1, q = P(u, C + side * 35);
            solid('sandbags', q.x, q.y, wide ? 90 : 24, wide ? 24 : 90, 0);
        }
        // Fire extinguishers and paintings along the corridor walls
        for (let u = U0 + 120; u < U1 - 60; u += 260) {
            const side = Math.random() < 0.5 ? -1 : 1, q = P(u, C + side * (cw / 2 - 8));
            deco(Math.random() < 0.5 ? 'extinguisher' : 'painting', q.x, q.y, 0, 0, wide ? (side < 0 ? 0 : Math.PI) : (side < 0 ? -Math.PI / 2 : Math.PI / 2));
        }
    }

    // Minimap zoomed in on this floor
    const [mm, g] = makeCanvas(200, 200);
    const k = 176 / Math.max(R.w, R.h), ox = R.cx - 100 / k, oy = R.cy - 100 / k;
    g.fillStyle = '#0d0b14';
    g.fillRect(0, 0, 200, 200);
    g.fillStyle = roof ? '#8d8a84' : '#55505e';
    g.fillRect((R.x0 - ox) * k, (R.y0 - oy) * k, R.w * k, R.h * k);
    for (const o of obstacles) {
        g.fillStyle = o.type === 'wall' ? '#e2d9ca' : 'rgba(170,150,130,0.6)';
        g.fillRect((o.x - o.hw - ox) * k, (o.y - o.hh - oy) * k, Math.max(1, o.hw * 2 * k), Math.max(1, o.hh * 2 * k));
    }
    return {
        obstacles, grid, decorGrid: new Grid(512, 900), buildings: [], biomes: [], roads: [], lootSpots, minimap: mm, mmT: { ox, oy, k }, city: null, stairs,
        floor: { b, R, level, top, roof, heli, kind, decor, lights, regions, seed: b.id * 7919 + level * 104729, baked: null }
    };
}

// Furnish one room in its local frame (back wall at ly = 0, door wall at ly = D, door centered at lx = dl)
function furnishRoom(type, F, dl, ctx2) {
    const { solid, deco, lootSpots, wall, innerCol, t, kind } = ctx2;
    const { W, D, at, rot } = F;
    const put = (furn, lx, ly, lw, lh, extra) => { const p = at(lx, ly); return solid(furn, p.x, p.y, lw, lh, rot, extra); };
    const dec = (d, lx, ly, lw, lh, extra) => { const p = at(lx, ly); deco(d, p.x, p.y, lw, lh, rot, extra); };
    const loot = (lx, ly, extra) => { const p = at(lx, ly); lootSpots.push({ ...p, ...extra }); };
    const wallL = (lx0, ly0, lx1, ly1) => { const a = at(lx0, ly0), c = at(lx1, ly1); wall(Math.min(a.x, c.x), Math.min(a.y, c.y), Math.max(a.x, c.x), Math.max(a.y, c.y), innerCol); };
    const doorLeft = dl < W / 2;
    const M = lx => (doorLeft ? lx : W - lx);  // mirror so "near the door" is always the low-lx side
    const bathroom = () => {
        // En-suite in the front corner away from the door: tub, toilet, sink
        const bw = 130, bd = 150;
        const xa = W - bw, ya = D - bd;
        wallL(M(xa) - t / 2, ya, M(xa) + t / 2, D);
        const g0 = M(xa + 18), g1 = M(xa + 78);
        wallL(Math.min(M(xa), M(W)), ya - t / 2, Math.min(g0, g1), ya + t / 2);
        wallL(Math.max(g0, g1), ya - t / 2, Math.max(M(xa), M(W)), ya + t / 2);
        dec('tiles', M(W - bw / 2), D - bd / 2, bw, bd);
        put('tub', M(W - 22), D - 75, 36, 96);
        put('toilet', M(xa + 30), D - 26, 26, 32);
        put('sink', M(xa + 85), D - 20, 30, 22);
    };
    switch (type) {
        case 'suite': {
            bathroom();
            const bx = M(Math.max(110, W * 0.42));
            dec('rug', bx, 120, 170, 130, { color: pick(['#7a3b3b', '#3b4f7a', '#5a7a3b', '#7a5f3b']) });
            put('bed', bx, 56, 92, 104, { color: pick(['#c0583f', '#3f7a9c', '#7a68a8', '#b07a44']) });
            put('nightstand', bx - 64, 20, 28, 28);
            put('nightstand', bx + 64, 20, 28, 28);
            put('desk', M(22), D * 0.5, 40, 84, { side: true });
            dec('chair', M(58), D * 0.5, 30, 30);
            put('armchair', M(W - 40), 140, 40, 40);
            put('plant', M(W - 24), 24, 30, 30);
            loot(bx, 150);
            break;
        }
        case 'twin': {
            bathroom();
            for (const f of [0.28, 0.62]) put('bed', M(W * f), 50, 52, 96, { color: pick(['#c0583f', '#3f7a9c', '#5a8f5c']) });
            put('nightstand', M(W * 0.45), 18, 28, 28);
            put('wardrobe', M(22), D * 0.45, 30, 90, { side: true });
            loot(M(W * 0.45), 130);
            break;
        }
        case 'storage': {
            put('shelf', W / 2, 16, W - 40, 24);
            put('shelf', 16, D * 0.4, 24, D * 0.45);
            put('shelf', W - 16, D * 0.4, 24, D * 0.45);
            put('milcrate', W * 0.4, D * 0.45, 46, 46);
            loot(W * 0.62, D * 0.42, { box: true });
            loot(W * 0.3, D * 0.7);
            break;
        }
        case 'ward': {
            const n = Math.max(1, Math.floor((W - 30) / 82));
            const gap = (W - n * 50) / (n + 1);
            for (let i = 0; i < n; i++) {
                const x = gap + 25 + i * (50 + gap);
                put('bed', x, 50, 50, 92, { hospital: true });
                dec('ivstand', x + 34, 18, 10, 10);
                if (i < n - 1) dec('curtain', x + 25 + gap / 2, 60, 6, 120);
                if (Math.random() < 0.5) loot(x, 120, { med: true });
            }
            put('cabinet', M(W - 22), D - 120, 34, 26);
            dec('wheelchair', M(W - 60), D - 60, 34, 34);
            break;
        }
        case 'pharmacy': {
            put('shelf', W / 2, 16, W - 40, 26, { meds: true });
            put('shelf', W / 2, D * 0.42, W - 130, 26, { meds: true });
            put('counter', M(W - 90), D - 80, 120, 28);
            for (let i = 0; i < 3; i++) loot(rand(40, W - 40), i === 0 ? 50 : rand(D * 0.5, D * 0.7), { med: true });
            break;
        }
        case 'surgery': {
            put('optable', W / 2, D * 0.4, 50, 100);
            dec('surglamp', W / 2, D * 0.4, 120, 120);
            put('cabinet', 30, 18, 46, 26);
            put('cabinet', W - 30, 18, 46, 26);
            put('trolley', W / 2 + 60, D * 0.4, 30, 44);
            put('sink', M(W - 22), D * 0.7, 30, 24);
            loot(W / 2 - 60, D * 0.4, { med: true });
            break;
        }
        case 'office': {
            for (let ly = 70; ly < D - 110; ly += 100) for (let lx = 60; lx < W - 50; lx += 120) {
                put('desk', lx, ly, 76, 40, { monitor: true });
                dec('chair', lx, ly + 34, 28, 28);
            }
            put('filing', 26, 16, 40, 26);
            put('filing', W - 26, 16, 40, 26);
            put('plant', M(W - 24), D - 120, 30, 30);
            loot(rand(40, W - 40), D - 140);
            break;
        }
        case 'armory': {
            put('weaponrack', W / 2, 14, W - 60, 22);
            put('weaponrack', 14, D * 0.42, 22, D * 0.5);
            put('milcrate', W / 2, D * 0.45, 70, 46);
            dec('hazard', W / 2, D - 20, W - 40, 16);
            for (let i = 0; i < 3; i++) loot(rand(60, W - 60), rand(50, D * 0.65), { box: true });
            loot(W * 0.7, D * 0.6, { ammo: true });
            break;
        }
        case 'server': {
            for (let ly = 50; ly < D - 110; ly += 90) for (let lx = 50; lx < W - 40; lx += 50) put('rack', lx, ly, 40, 52);
            loot(W / 2, D - 130);
            break;
        }
        case 'briefing': {
            const tw = Math.min(W * 0.7, 220), th = Math.min(D * 0.35, 90);
            put('tv', W / 2, 10, 120, 14);
            put('longtable', W / 2, D * 0.42, tw, th);
            for (let i = 0; i < 4; i++) {
                dec('chair', W / 2 - tw / 2 + (i + 0.5) * (tw / 4), D * 0.42 - th / 2 - 18, 26, 26);
                dec('chair', W / 2 - tw / 2 + (i + 0.5) * (tw / 4), D * 0.42 + th / 2 + 18, 26, 26);
            }
            loot(W / 2, D - 130);
            break;
        }
        case 'barracks': {
            const n = Math.max(1, Math.floor((W - 20) / 72));
            for (let i = 0; i < n; i++) put('bunk', 40 + i * 72, 48, 48, 90);
            put('locker', M(W - 18), D * 0.55, 28, 100);
            loot(W / 2, D * 0.55, { ammo: true });
            break;
        }
        case 'control': {
            // Wall of screens, two rows of consoles facing it, server racks down one side
            put('monitorwall', W / 2, 10, W - 40, 16);
            for (const ly of [86, 196]) {
                if (ly > D - 160) break;
                put('console', W / 2 - (doorLeft ? -14 : 14), ly, Math.min(W - 90, 230), 40);
                for (let x = W / 2 - 80; x <= W / 2 + 80; x += 52) dec('chair', x, ly + 38, 26, 26);
            }
            for (let ly = 270; ly < D - 150; ly += 58) put('rack', M(W - 26), ly, 36, 50);
            if (D > 420) put('maptable', M(W * 0.38), D * 0.64, 96, 60);
            dec('cables', W / 2, D * 0.5, W - 60, D * 0.5);
            loot(M(70), D * 0.55);
            break;
        }
        case 'lab': {
            put('labbench', W / 2, 18, W - 40, 30);
            put('fumehood', M(26), 110, 36, 80, {});
            for (let ly = 130; ly < D - 160; ly += 120) {
                put('labbench', W * 0.55, ly, Math.min(W - 120, 170), 34);
                dec('stool', W * 0.55 - 40, ly + 32, 18, 18); dec('stool', W * 0.55 + 40, ly + 32, 18, 18);
            }
            put('fridge', M(W - 24), D - 160, 36, 40);
            put('sink', M(W - 22), 70, 30, 24);
            dec('hazard', W / 2, D - 40, W - 40, 14);
            loot(M(W * 0.3), D * 0.55, { med: true });
            break;
        }
        case 'kitchen': {
            // Cooking line along the back wall, an island, and tables if there's room
            put('fridge', M(24), 22, 40, 40);
            put('stove', M(78), 20, 50, 36);
            put('counter', W / 2 + (doorLeft ? 40 : -40), 18, Math.max(60, W - 210), 30);
            put('sink', M(W - 28), 20, 34, 26);
            put('counter', W / 2, 120, Math.min(W - 100, 150), 40);
            for (let ly = 230; ly < D - 140; ly += 120) put('roundtable', W * (ly % 240 ? 0.35 : 0.62), ly, 90, 90);
            loot(W / 2, 175, { med: false });
            break;
        }
        case 'conference': {
            put('whiteboard', W / 2, 8, Math.min(W - 60, 160), 10);
            put('tv', M(W - 20), D * 0.35, 12, 90);
            const tw = Math.min(W - 110, 140), th = Math.min(D - 220, 300);
            put('longtable', W / 2, 60 + th / 2 + 20, tw, th);
            for (let ly = 90; ly < 60 + th; ly += 52) { dec('chair', W / 2 - tw / 2 - 18, ly, 26, 26); dec('chair', W / 2 + tw / 2 + 18, ly, 26, 26); }
            put('plant', M(26), 26, 30, 30);
            put('cooler', M(26), D - 120, 24, 24);
            loot(W / 2, D - 110);
            break;
        }
        case 'gym': {
            for (let x = 40; x < W - 40; x += 62) put('treadmill', x, 40, 46, 72);
            put('weights', M(W - 20), D * 0.45, 26, 120);
            put('bench', W * 0.4, D * 0.45, 30, 70);
            dec('rug', W * 0.4, D * 0.6, W * 0.5, 110, { color: '#2b3a4a' });
            put('locker', M(18), D * 0.5, 26, 120);
            loot(W * 0.5, D - 120);
            break;
        }
        case 'bathroom': {
            // Stalls along the back, a row of sinks down one side
            dec('tiles', W / 2, D / 2, W, D);
            const n = Math.max(2, Math.floor((W - 20) / 70));
            for (let i = 0; i < n; i++) {
                const x0 = 10 + i * ((W - 20) / n);
                if (i > 0) wallL(x0 - 3, 0, x0 + 3, 110);
                put('toilet', x0 + (W - 20) / n / 2, 22, 26, 32);
            }
            for (let ly = 170; ly < D - 140; ly += 52) put('sink', M(W - 18), ly, 26, 32);
            loot(M(W * 0.35), D * 0.6, { med: true });
            break;
        }
        case 'security': {
            put('monitorwall', W / 2, 10, W - 50, 16);
            put('console', W / 2, 70, Math.min(W - 90, 200), 40);
            dec('chair', W / 2, 108, 26, 26);
            for (let ly = 150; ly < 350 && ly < D - 160; ly += 50) put('locker', M(18), ly, 26, 46);
            put('weaponrack', M(W - 16), 200, 22, 120);
            // A holding cell at the back corner
            if (D > 440) {
                const cy = D - 190;
                put('bars', M(W - 75), cy, 130, 8);
                put('cot', M(W - 50), cy + 60, 30, 70);
            }
            loot(M(W * 0.4), D * 0.5, { ammo: true });
            break;
        }
        case 'comms': {
            put('radio', M(30), 24, 50, 34);
            put('radio', M(90), 24, 50, 34);
            put('console', M(W - 70), 24, 110, 38);
            put('maptable', W / 2, D * 0.38, Math.min(W - 100, 150), 90);
            put('rack', M(W - 24), D * 0.65, 36, 50);
            put('generator', M(36), D * 0.66, 56, 40);
            dec('cables', W / 2, D * 0.55, W - 40, D * 0.45);
            loot(W / 2, D - 120, { ammo: true });
            break;
        }
        case 'workshop': {
            put('workbench', W / 2, 18, W - 40, 32);
            put('toolrack', M(16), 150, 16, 120);
            put('lathe', W * 0.55, 140, 90, 44);
            put('engine', W * 0.45, D * 0.5, 70, 46);
            for (let i = 0; i < 3; i++) put('drum', M(W - 26 - (i % 2) * 34), D * 0.36 + i * 40, 30, 30, { color: pick(['#7a3b22', '#5a5f3a', '#3b4a5a']) });
            put('generator', M(W - 40), D - 160, 56, 40);
            dec('oil', W * 0.45, D * 0.6, 110, 70);
            loot(W * 0.3, D * 0.68, { box: true });
            break;
        }
        case 'living': {
            put('tv', W / 2, 10, 120, 14);
            put('bookshelf', M(18), D * 0.34, 24, 130);
            dec('rug', W / 2, D * 0.42, W * 0.7, D * 0.4, { color: pick(['#7a3b3b', '#3b4f7a', '#6b5a3a']) });
            put('coffeetable', W / 2, D * 0.38, 90, 50);
            put('sofa', W / 2, D * 0.38 + 80, 120, 42);
            put('armchair', M(W - 40), D * 0.38, 40, 40);
            put('plant', M(W - 24), 24, 30, 30);
            put('nightstand', M(W - 24), D * 0.38 + 80, 26, 26);
            loot(W / 2, D * 0.62);
            break;
        }
        case 'study': {
            put('bookshelf', W / 2, 12, W - 60, 22);
            put('desk', M(W * 0.4), 110, 90, 46, { monitor: true });
            dec('chair', M(W * 0.4), 150, 28, 28);
            put('bookshelf', M(W - 16), D * 0.45, 22, 120);
            put('armchair', M(40), D * 0.48, 40, 40);
            dec('rug', W / 2, D * 0.5, W * 0.6, 120, { color: '#5a4a3a' });
            put('printer', M(30), 40, 34, 28);
            loot(M(W * 0.6), D * 0.58);
            break;
        }
        case 'bedroom': {
            put('bed', W * 0.45, 52, 80, 100, { color: pick(['#c0583f', '#3f7a9c', '#7a68a8']) });
            put('wardrobe', M(W - 18), D * 0.45, 30, 100, { side: true });
            dec('rug', W * 0.45, 140, 140, 90, { color: '#6b4a3a' });
            loot(W * 0.45, 150);
            break;
        }
    }
}

// First visit to a floor: soldiers (lots in the HQ) and supplies. Hospitals are full of medical gear, hotels of guns.
function populateFloor(b, level) {
    const F = G.world.floor, R = F.R, scale = G.cpuCount / 100;
    if (!G.escape) {
        // Outside Escape the building isn't empty: a few of the other players (or zombies) are already up here
        const street = G.layers.street ? G.layers.street.fighters : [];
        const arrive = G.world.stairs.find(s => s.dir === 'down');
        const movers = street.filter(f => !f.dead && !isHuman(f) && (!G.player || dist(f, G.player) > 1500));
        for (let i = randInt(0, Math.min(3, movers.length)); i > 0; i--) {
            const f = movers.splice(randInt(0, movers.length - 1), 1)[0];
            street.splice(street.indexOf(f), 1);
            for (let tries = 0; tries < 60; tries++) {
                const x = rand(R.x0 + 60, R.x1 - 60), y = rand(R.y0 + 60, R.y1 - 60);
                if (blockedAt(G.world.grid, x, y, 26) || (arrive && Math.hypot(arrive.x - x, arrive.y - y) < 450)) continue;
                f.x = x; f.y = y; f.mode = 'wander'; f.target = null; f.nextThink = G.time;
                break;
            }
            G.fighters.push(f);
        }
    }
    const n = !G.escape ? 0 : b.hq ? (F.roof ? 10 + Math.round(3 * scale) : Math.min(8, 2 + Math.floor(level * 0.45) + Math.round(scale)))
        : b.kind === 'hotel' ? randInt(1, 4) : b.kind === 'hospital' ? randInt(0, 3) : randInt(0, 1);
    const arrive = G.world.stairs.find(s => s.dir === 'down');
    for (let i = 0; i < n; i++) {
        for (let tries = 0; tries < 60; tries++) {
            const x = rand(R.x0 + 50, R.x1 - 50), y = rand(R.y0 + 50, R.y1 - 50);
            if (blockedAt(G.world.grid, x, y, 26) || (arrive && Math.hypot(arrive.x - x, arrive.y - y) < 320)) continue;
            addSoldier({ x, y }, i, true);
            break;
        }
    }
    if (F.roof) spawnCommander(F.heli);
    for (const sp of G.world.lootSpots) {
        if (blockedAt(G.world.grid, sp.x, sp.y, 24)) continue;
        const r = Math.random();
        if (sp.box) addLootBox(sp.x, sp.y);
        else if (sp.med) spawnLoot(sp.x, sp.y, pick(['medkit', 'medkit', 'bandage', 'bandage', 'armor']));
        else if (sp.ammo) spawnLoot(sp.x, sp.y, pick(['ammo', 'ammo', 'armor', 'grenade']));
        else if (b.kind === 'hospital') r < 0.7 ? spawnLoot(sp.x, sp.y, pick(['medkit', 'bandage', 'bandage'])) : addLootBox(sp.x, sp.y);
        else if (b.kind === 'hotel' || b.hq) r < 0.45 ? addLootBox(sp.x, sp.y) : r < 0.85 && spawnLoot(sp.x, sp.y, pick(['ammo', 'armor', 'bandage', 'grenade', 'backpack1']));
        else if (r < 0.6) spawnLoot(sp.x, sp.y, weightedPick(GROUND_TABLE));
    }
}

// The HQ's Commander guards the helicopter himself: tougher, quicker to react, deadlier aim, harder hitting
function spawnCommander(heli) {
    const R = G.world.floor.R, d = Math.hypot(R.cx - heli.x, R.cy - heli.y) || 1;
    const s = spawnNear({ x: heli.x + ((R.cx - heli.x) / d) * 200, y: heli.y + ((R.cy - heli.y) / d) * 200 }, 60, 26);
    addSoldier(s, 0, true);
    const f = G.fighters[G.fighters.length - 1];
    Object.assign(f, { boss: true, name: 'Commander', r: 24, hp: COMMANDER.hp, maxHp: COMMANDER.hp, armor: COMMANDER.armor, dmgMul: COMMANDER.dmgMul, color: '#3a4230' });
    f.dark = shade(f.color, -0.45); f.light = shade(f.color, 0.35);
    f.inv = [G.early ? 'Sword' : 'Pistol', null];
    f.slot = 0;
    if (G.early) equipNew(f, 'Sword');
    applyLoot(f, G.early ? 'Crossbow' : 'Assault Rifle', -1);
    switchSlot(f, 1, true);
    f.items.grenade = G.early ? 0 : 4;
}

// ---------- House interiors (street level) ----------
// Every building gets its own floor plan (one open room, two, three, four or five rooms, or a hallway with rooms
// off it), its own mix of rooms for what kind of place it is, its own floors, paint and rugs, and furniture laid out
// differently every time. Furniture is real cover and can be broken open like on the upper floors.
const HOUSE = { inner: 10, gap: 64, keep: 42, minRoom: 105 };
const RUG_COLORS = ['#7a3b3b', '#3b4f7a', '#5a7a3b', '#7a5f3b', '#6b3b6b', '#3b6b6b', '#8a6a3a', '#4a4a5a', '#9a4a2a', '#2e5a4a'];
const BED_COLORS = ['#c0583f', '#3f7a9c', '#7a68a8', '#b07a44', '#5a8f5c', '#c06a8a', '#d4a24a', '#4a5f8a'];
const SOFA_COLORS = ['#5a4a6a', '#6a3b3b', '#3b5a6a', '#7a6a4a', '#4a6a4a', '#8a8a8a', '#a0603a', '#2e3e5e'];
// What floor each kind of room tends to have (paintFinish kinds), and a wash of colour so two wood floors still differ
const HOME_FLOORS = {
    living: ['wood', 'carpet', 'wood', 'marble'], kitchen: ['lino', 'marble', 'lino'], bed: ['carpet', 'wood', 'carpet'], bath: ['lino'],
    dining: ['wood', 'marble'], study: ['wood', 'carpet'], kids: ['carpet', 'wood'], laundry: ['lino', 'concrete'], garage: ['concrete'],
    studio: ['wood', 'carpet'], hall: ['runner', 'wood', 'marble'], shop: ['lino', 'office', 'marble'], cafe: ['wood', 'marble'],
    office: ['office', 'carpet'], gym: ['raised', 'concrete'], clinic: ['surgery', 'lino'], bar: ['wood'], laundromat: ['lino'],
    lobby: ['marble', 'carpet'], reception: ['lino', 'marble'], storage: ['concrete'], workshop: ['concrete'], barracks: ['concrete'], ruin: ['concrete', 'wood']
};

function furnishHouse(b, api) {
    const { addBox, grid, T, rusty, city } = api;
    const t = HOUSE.inner, innerCol = shade(b.wall, rusty ? -0.25 : 0.12);
    const ix0 = b.x0 + T, iy0 = b.y0 + T, ix1 = b.x1 - T, iy1 = b.y1 - T;
    b.rooms = []; b.decor = [];
    // Spots that must stay walkable: every doorway (inside and out) and the stairs
    const zones = b.doors.map(d => ({ x: d.inner.x, y: d.inner.y, r: HOUSE.keep }));
    if (b.stairs) zones.push({ x: b.stairs.x, y: b.stairs.y, r: 85 });
    const wallAt = (x0, y0, x1, y1) => { if (x1 - x0 > 2 && y1 - y0 > 2) addBox({ type: 'wall', x: (x0 + x1) / 2, y: (y0 + y1) / 2, hw: (x1 - x0) / 2, hh: (y1 - y0) / 2, color: innerCol, inner: true }); };
    // A wall across a room with a doorway in it (never in line with an outside door or over the stairs)
    const badCut = (vertical, c, a0, a1) => b.doors.some(d => vertical ? Math.abs(d.x - c) < 70 && d.y >= a0 - 40 && d.y <= a1 + 40 : Math.abs(d.y - c) < 70 && d.x >= a0 - 40 && d.x <= a1 + 40)
        || (b.stairs && (vertical ? Math.abs(b.stairs.x - c) < 95 : Math.abs(b.stairs.y - c) < 95));
    const cutWall = (vertical, c, a0, a1) => {
        const g = HOUSE.gap, m = rand(a0 + g / 2 + 12, a1 - g / 2 - 12);
        if (vertical) { wallAt(c - t / 2, a0, c + t / 2, m - g / 2); wallAt(c - t / 2, m + g / 2, c + t / 2, a1); zones.push({ x: c, y: m, r: 40 }); }
        else { wallAt(a0, c - t / 2, m - g / 2, c + t / 2); wallAt(m + g / 2, c - t / 2, a1, c + t / 2); zones.push({ x: m, y: c, r: 40 }); }
    };
    // Floor plan: carve a hallway in some, then keep splitting the biggest room until there are enough
    const area = (ix1 - ix0) * (iy1 - iy0);
    const want = b.kind === 'hotel' || b.kind === 'hospital' ? (Math.random() < 0.6 ? 1 : 2) : clamp(Math.round(area / 30000 * rand(0.7, 1.4)), 1, 6);
    let rooms = [{ x0: ix0, y0: iy0, x1: ix1, y1: iy1 }];
    if (want >= 4 && Math.random() < 0.45 && !b.stairs) {
        // A hallway down the long side, rooms off both sides of it
        const wide = ix1 - ix0 >= iy1 - iy0, hw = 46, c = wide ? rand(iy0 + 0.4 * (iy1 - iy0), iy0 + 0.6 * (iy1 - iy0)) : rand(ix0 + 0.4 * (ix1 - ix0), ix0 + 0.6 * (ix1 - ix0));
        if (wide && !badCut(false, c - hw, ix0, ix1) && !badCut(false, c + hw, ix0, ix1)) {
            rooms = [{ x0: ix0, y0: iy0, x1: ix1, y1: c - hw - t / 2 }, { x0: ix0, y0: c + hw + t / 2, x1: ix1, y1: iy1 }];
            b.rooms.push({ x0: ix0, y0: c - hw + t / 2, x1: ix1, y1: c + hw - t / 2, theme: 'hall' });
            for (const [cc, r] of [[c - hw, rooms[0]], [c + hw, rooms[1]]]) splitRun(r, true, cc);
        } else if (!wide && !badCut(true, c - hw, iy0, iy1) && !badCut(true, c + hw, iy0, iy1)) {
            rooms = [{ x0: ix0, y0: iy0, x1: c - hw - t / 2, y1: iy1 }, { x0: c + hw + t / 2, y0: iy0, x1: ix1, y1: iy1 }];
            b.rooms.push({ x0: c - hw + t / 2, y0: iy0, x1: c + hw - t / 2, y1: iy1, theme: 'hall' });
            for (const [cc, r] of [[c - hw, rooms[0]], [c + hw, rooms[1]]]) splitRun(r, false, cc);
        }
    }
    // A strip of rooms along the hallway: its hallway wall gets a door into each room, and it splits crossways
    function splitRun(r, wide, c) {
        const len = wide ? r.x1 - r.x0 : r.y1 - r.y0, n = clamp(Math.floor(len / rand(170, 260)), 1, 3);
        const cuts = [];
        for (let i = 1; i < n; i++) { const p = (wide ? r.x0 : r.y0) + (len * i) / n + rand(-0.08, 0.08) * len; if (!badCut(wide, p, wide ? r.y0 : r.x0, wide ? r.y1 : r.x1)) cuts.push(p); }
        const edges = [wide ? r.x0 : r.y0, ...cuts, wide ? r.x1 : r.y1];
        for (let i = 0; i < edges.length - 1; i++) {
            const a0 = edges[i], a1 = edges[i + 1];
            if (i > 0) wide ? wallAt(a0 - t / 2, r.y0, a0 + t / 2, r.y1) : wallAt(r.x0, a0 - t / 2, r.x1, a0 + t / 2);
            cutWall(!wide, c, a0 + t, a1 - t);
            rooms.push(wide ? { x0: a0, y0: r.y0, x1: a1, y1: r.y1, sub: true } : { x0: r.x0, y0: a0, x1: r.x1, y1: a1, sub: true });
        }
        rooms.splice(rooms.indexOf(r), 1);
    }
    for (let guard = 0; rooms.length < want && guard < 20; guard++) {
        rooms.sort((p, q) => (q.x1 - q.x0) * (q.y1 - q.y0) - (p.x1 - p.x0) * (p.y1 - p.y0));
        const r = rooms[0], rw = r.x1 - r.x0, rh = r.y1 - r.y0;
        const vertical = rw > rh * rand(0.8, 1.25);
        const span = vertical ? rw : rh;
        if (span < HOUSE.minRoom * 2 + t) { if (rooms.length > 1) rooms.push(rooms.shift()); continue; }
        let c = null;
        const lo = Math.max(0.3, (HOUSE.minRoom + t) / span), hi = Math.min(0.7, 1 - (HOUSE.minRoom + t) / span);
        for (let k = 0; k < 10 && c === null && lo <= hi; k++) {
            const p = (vertical ? r.x0 : r.y0) + span * rand(lo, hi);
            if (!badCut(vertical, p, vertical ? r.y0 : r.x0, vertical ? r.y1 : r.x1)) c = p;
        }
        if (c === null) { rooms.push(rooms.shift()); continue; }
        cutWall(vertical, c, vertical ? r.y0 : r.x0, vertical ? r.y1 : r.x1);
        rooms.shift();
        rooms.push(vertical ? { x0: r.x0, y0: r.y0, x1: c - t / 2, y1: r.y1 } : { x0: r.x0, y0: r.y0, x1: r.x1, y1: c - t / 2 });
        rooms.push(vertical ? { x0: c + t / 2, y0: r.y0, x1: r.x1, y1: r.y1 } : { x0: r.x0, y0: c + t / 2, x1: r.x1, y1: r.y1 });
    }
    // What each room is: biggest first, by the kind of building
    rooms.sort((p, q) => (q.x1 - q.x0) * (q.y1 - q.y0) - (p.x1 - p.x0) * (p.y1 - p.y0));
    let plan;
    if (b.kind === 'hotel') plan = ['lobby', 'bar', 'office'];
    else if (b.kind === 'hospital') plan = ['reception', 'clinic', 'storage'];
    else if (rusty) plan = shuffle(['workshop', 'storage', 'barracks', 'ruin', 'office', 'garage']);
    else if (city && Math.random() < 0.55) plan = [pick(['shop', 'cafe', 'office', 'gym', 'bar', 'laundromat', 'clinic', 'shop', 'cafe']), ...shuffle(['storage', 'bath', 'office', 'kitchen'])];
    else if (rooms.length === 1) plan = ['studio'];
    else if (rooms.length === 2) plan = ['great', 'bed'];
    else if (rooms.length === 3) plan = ['living', 'bed', pick(['kitchen', 'kitchen', 'bath'])];
    else plan = ['living', 'kitchen', 'bed', 'bath', ...shuffle(['bed', 'study', 'dining', 'kids', 'laundry', 'garage', 'bed'])];
    if (rooms.length >= 3 && plan.includes('bath') && plan.indexOf('bath') > rooms.length - 1) plan[rooms.length - 1] = 'bath';
    rooms.forEach((r, i) => { r.theme = plan[i] || pick(['storage', 'bed', 'study']); b.rooms.push(r); });
    // The smallest room of a home is the bathroom if there is one
    if (!city && !rusty && rooms.length >= 3) { const s = rooms[rooms.length - 1], bi = rooms.findIndex(r => r.theme === 'bath'); if (bi >= 0 && rooms[bi] !== s) { rooms[bi].theme = s.theme; s.theme = 'bath'; } }
    for (const r of b.rooms) {
        r.floor = pick(HOME_FLOORS[r.theme] || ['wood']);
        r.tint = `hsla(${randInt(0, 360)},${randInt(10, 35)}%,${randInt(30, 60)}%,${rand(0.06, 0.16)})`;
    }

    // ----- Placing furniture -----
    const rnd = Math.random;
    const free = (x, y, hw, hh, r) => {
        if (x - hw < r.x0 + 1 || x + hw > r.x1 - 1 || y - hh < r.y0 + 1 || y + hh > r.y1 - 1) return false;
        for (const z of zones) { const nx = clamp(z.x, x - hw, x + hw), ny = clamp(z.y, y - hh, y + hh); if (Math.hypot(nx - z.x, ny - z.y) < z.r) return false; }
        return !blockedAt(grid, x, y, 0) && !boxHits(x, y, hw, hh);
    };
    const boxHits = (x, y, hw, hh) => { let hit = false; grid.query(x, y, Math.max(hw, hh) + 4, o => { if (!hit && o.hw !== undefined && Math.abs(o.x - x) < o.hw + hw + 1 && Math.abs(o.y - y) < o.hh + hh + 1) hit = true; }); return hit; };
    const solid = (r, furn, x, y, lw, lh, rot, extra) => {
        const side = Math.abs(Math.sin(rot)) > 0.5, hw = (side ? lh : lw) / 2, hh = (side ? lw : lh) / 2;
        if (!free(x, y, hw, hh, r)) return null;
        const o = { type: 'crate', furn, x, y, hw, hh, lw, lh, rot: rot + (rusty ? rand(-0.12, 0.12) : 0), seed: randInt(1, 1e9), house: b, ...extra };
        addBox(o);
        api.placed.push(o);
        return o;
    };
    const dec = (d, x, y, lw, lh, rot = 0, extra) => b.decor.push({ d, x, y, lw, lh, rot, ...extra });
    const ROT = { top: 0, right: Math.PI / 2, bottom: Math.PI, left: -Math.PI / 2 };
    const sideLen = (r, s) => (s === 'top' || s === 'bottom' ? r.x1 - r.x0 : r.y1 - r.y0);
    const opposite = s => ({ top: 'bottom', bottom: 'top', left: 'right', right: 'left' })[s];
    // Back against a wall of the room, at a fraction along it (nudged along if that spot is taken)
    const wallPos = (r, s, f, lh, off = 0) => {
        const d = lh / 2 + 3 + off;
        return s === 'top' ? { x: lerp(r.x0, r.x1, f), y: r.y0 + d } : s === 'bottom' ? { x: lerp(r.x0, r.x1, f), y: r.y1 - d }
            : s === 'left' ? { x: r.x0 + d, y: lerp(r.y0, r.y1, f) } : { x: r.x1 - d, y: lerp(r.y0, r.y1, f) };
    };
    // (sweeps along the wall from the spot it wanted, then tries the room's other walls)
    const wallPut = (r, s, f, furn, lw0, lh, extra, off = 0) => {
        for (const ss of [s, ...shuffle(['top', 'bottom', 'left', 'right'].filter(x => x !== s))]) {
            const len = sideLen(r, ss), lw = Math.min(lw0, len - 12);
            if (lw < Math.min(lw0, 24)) continue;
            for (const df of [0, 0.08, -0.08, 0.16, -0.16, 0.25, -0.25, 0.34, -0.34, 0.45, -0.45]) {
                const ff = clamp(f + df, (lw / 2 + 4) / len, 1 - (lw / 2 + 4) / len);
                const p = wallPos(r, ss, ff, lh, off), o = solid(r, furn, p.x, p.y, lw, lh, ROT[ss], extra);
                if (o) return o;
            }
        }
        return null;
    };
    const at = (r, fx, fy) => ({ x: lerp(r.x0, r.x1, fx), y: lerp(r.y0, r.y1, fy) });
    const midPut = (r, fx, fy, furn, lw, lh, rot = 0, extra) => { const p = at(r, fx, fy); return solid(r, furn, p.x, p.y, lw, lh, rot, extra); };
    const sides = r => shuffle(['top', 'bottom', 'left', 'right']);
    const longSides = r => (r.x1 - r.x0 >= r.y1 - r.y0 ? shuffle(['top', 'bottom']) : shuffle(['left', 'right']));
    const corners = r => shuffle([[r.x0 + 16, r.y0 + 16], [r.x1 - 16, r.y0 + 16], [r.x0 + 16, r.y1 - 16], [r.x1 - 16, r.y1 - 16]]);
    const plants = (r, n) => { for (const [x, y] of corners(r).slice(0, n)) solid(r, 'plant', x, y, 22, 22, 0); };
    const rug = (r, w, h, fx = 0.5, fy = 0.5, color) => { const p = at(r, fx, fy); dec('rug', p.x, p.y, Math.min(w, r.x1 - r.x0 - 30), Math.min(h, r.y1 - r.y0 - 30), 0, { color: color || pick(RUG_COLORS) }); };
    const chairsAround = (o, n, spread) => {
        if (!o) return;
        const horiz = o.hw >= o.hh;
        for (let i = 0; i < n; i++) {
            const k = (i % (n / 2 || 1)) / Math.max(1, n / 2 - 1 || 1) - 0.5, top = i < n / 2;
            if (horiz) dec('chair', o.x + (n > 2 ? k * o.hw * 1.4 : 0), o.y + (top ? -1 : 1) * (o.hh + 11), 20, 20, top ? 0 : Math.PI);
            else dec('chair', o.x + (top ? -1 : 1) * (o.hw + 11), o.y + (n > 2 ? k * o.hh * 1.4 : 0), 20, 20, top ? -Math.PI / 2 : Math.PI / 2);
        }
    };
    // A cooking run along one wall: fridge at one end, then the stove, sink and counters, sometimes round a corner
    const kitchenRun = (r, s) => {
        const len = sideLen(r, s), horiz = s === 'top' || s === 'bottom', flip = rnd() < 0.5;
        const items = shuffle([['stove', 36], ['sink', 30]]);
        items.unshift(['fridge', 32]);
        if (flip) items.reverse();
        let pos = 8;
        const place = (furn, lw) => { const f = (pos + lw / 2) / len; const p = wallPos(r, s, f, 26); solid(r, furn, p.x, p.y, lw, furn === 'fridge' ? 32 : 26, ROT[s]); pos += lw + 2; };
        for (const [furn, lw] of items) { if (pos + lw > len - 8) break; place(furn, lw); if (rnd() < 0.6 && pos + 40 < len - 8) place('counter', randInt(30, 60)); }
        if (pos < len - 40) place('counter', Math.min(len - pos - 10, 90));
        void horiz;
    };

    const RECIPES = {
        living(r) {
            const s = pick(longSides(r)), o = opposite(s), w = sideLen(r, s);
            rug(r, w * rand(0.5, 0.75), (r.y1 - r.y0) * rand(0.4, 0.6));
            const sofa = wallPut(r, s, rand(0.35, 0.65), 'sofa', Math.min(110, w * 0.55), 34, { color: pick(SOFA_COLORS) });
            wallPut(r, o, sofa ? (s === 'top' || s === 'bottom' ? (sofa.x - r.x0) / (r.x1 - r.x0) : (sofa.y - r.y0) / (r.y1 - r.y0)) : 0.5, rnd() < 0.7 ? 'tv' : 'console', Math.min(80, w * 0.4), 10);
            midPut(r, 0.5, s === 'top' ? 0.42 : s === 'bottom' ? 0.58 : 0.5, 'coffeetable', 54, 30, s === 'left' || s === 'right' ? Math.PI / 2 : 0);
            for (let i = randInt(0, 2); i > 0; i--) { const ss = pick(sides(r).filter(x => x !== s && x !== o)); wallPut(r, ss, rand(0.3, 0.7), 'armchair', 32, 32, { color: pick(SOFA_COLORS) }); }
            if (rnd() < 0.6) wallPut(r, pick(sides(r).filter(x => x !== s)), rand(0.15, 0.85), 'bookshelf', randInt(50, 90), 16);
            if (rnd() < 0.5 && sofa) wallPut(r, s, rnd() < 0.5 ? 0.12 : 0.88, 'nightstand', 18, 18);
            plants(r, randInt(0, 2));
            if (rnd() < 0.6) { const p = wallPos(r, o, rand(0.2, 0.8), 6, -4); dec('painting', p.x, p.y, 48, 10, ROT[o]); }
        },
        // Open-plan living room and kitchen in one
        great(r) {
            const ss = sides(r);
            kitchenRun(r, ss[0]);
            const s = ss[1] === opposite(ss[0]) ? ss[1] : opposite(ss[0]);
            rug(r, sideLen(r, s) * 0.5, 100, 0.5, s === 'top' ? 0.35 : s === 'bottom' ? 0.65 : 0.5);
            wallPut(r, s, rand(0.3, 0.7), 'sofa', Math.min(100, sideLen(r, s) * 0.5), 32, { color: pick(SOFA_COLORS) });
            midPut(r, 0.5, 0.5, 'coffeetable', 50, 28, s === 'left' || s === 'right' ? Math.PI / 2 : 0);
            const rest = ss.filter(x => x !== ss[0] && x !== s);
            if (rest[0]) wallPut(r, rest[0], 0.5, rnd() < 0.6 ? 'tv' : 'bookshelf', 70, 12);
            if (rnd() < 0.7) chairsAround(midPut(r, rand(0.3, 0.7), rand(0.3, 0.7), 'roundtable', 42, 42), 2);
            plants(r, randInt(0, 2));
        },
        kitchen(r) {
            const ss = sides(r);
            kitchenRun(r, ss[0]);
            if (rnd() < 0.45) kitchenRun(r, ss[1] === opposite(ss[0]) ? ss[2] : ss[1]);
            if ((r.x1 - r.x0) > 190 && (r.y1 - r.y0) > 170) {
                const tbl = rnd() < 0.5 ? midPut(r, rand(0.45, 0.6), rand(0.45, 0.6), 'roundtable', 48, 48) : midPut(r, 0.55, 0.55, 'longtable', 70, 38, (r.x1 - r.x0) > (r.y1 - r.y0) ? 0 : Math.PI / 2);
                chairsAround(tbl, rnd() < 0.5 ? 2 : 4);
            } else if (rnd() < 0.5) midPut(r, 0.55, 0.55, 'counter', 60, 30, 0);
        },
        bed(r) {
            const s = pick(sides(r)), w = sideLen(r, s), f = rand(0.3, 0.7), dbl = w > 160 && rnd() < 0.7, bw = dbl ? 60 : 40;
            if (rnd() < 0.7) { const p = wallPos(r, s, f, 70); dec('rug', p.x, p.y, bw + 50, 90, ROT[s], { color: pick(RUG_COLORS) }); }
            const bed = wallPut(r, s, f, 'bed', bw, 78, { color: pick(BED_COLORS) });
            if (bed) { const fr = s === 'top' || s === 'bottom' ? (bed.x - r.x0) / w : (bed.y - r.y0) / w, gap = (bw / 2 + 14) / w; for (const dd of rnd() < 0.7 ? [-gap, gap] : [pick([-gap, gap])]) { const p = wallPos(r, s, fr + dd, 18); solid(r, 'nightstand', p.x, p.y, 18, 18, ROT[s]); } }
            const rest = sides(r).filter(x => x !== s);
            wallPut(r, rest[0], rand(0.2, 0.8), 'wardrobe', randInt(56, 80), 22, { side: true });
            if (rnd() < 0.5) { const d = wallPut(r, rest[1], rand(0.2, 0.8), 'desk', 58, 30, { monitor: rnd() < 0.5 }); if (d) dec('chair', d.x + Math.sin(d.rot) * -24, d.y + Math.cos(d.rot) * 24, 20, 20, d.rot + Math.PI); }
            else if (rnd() < 0.6) wallPut(r, rest[1], rand(0.2, 0.8), 'cabinet', 46, 20);
            if (rnd() < 0.4) plants(r, 1);
        },
        kids(r) {
            const s = pick(sides(r));
            rug(r, 120, 90, 0.5, 0.5, pick(['#e0607a', '#5ac0e0', '#f0c040', '#7ad070', '#b080e0']));
            wallPut(r, s, rand(0.25, 0.75), rnd() < 0.5 ? 'bunk' : 'bed', 40, 74, { color: pick(BED_COLORS) });
            const rest = sides(r).filter(x => x !== s);
            wallPut(r, rest[0], rand(0.3, 0.7), 'bookshelf', 50, 14);
            wallPut(r, rest[1], rand(0.3, 0.7), 'desk', 48, 26);
            midPut(r, rand(0.4, 0.6), rand(0.4, 0.6), 'coffeetable', 36, 36, 0);
            if (rnd() < 0.6) wallPut(r, rest[2] || rest[0], rand(0.2, 0.8), 'drum', 22, 22, { color: pick(['#e0607a', '#5ac0e0', '#f0c040']) });
        },
        bath(r) {
            dec('tiles', (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, r.x1 - r.x0, r.y1 - r.y0);
            const ss = sides(r);
            if (sideLen(r, ss[0]) > 90) wallPut(r, ss[0], rnd() < 0.5 ? 0.2 : 0.8, 'tub', 70, 30);
            wallPut(r, ss[1], rand(0.2, 0.8), 'toilet', 20, 24);
            wallPut(r, ss[2], rand(0.2, 0.8), 'sink', 26, 20);
            if (rnd() < 0.4) wallPut(r, ss[3], rand(0.2, 0.8), 'cabinet', 34, 16);
        },
        dining(r) {
            const horiz = r.x1 - r.x0 > r.y1 - r.y0;
            rug(r, (r.x1 - r.x0) * 0.7, (r.y1 - r.y0) * 0.6);
            const tbl = midPut(r, 0.5, 0.5, 'longtable', Math.min(120, (horiz ? r.x1 - r.x0 : r.y1 - r.y0) * 0.5), 44, horiz ? 0 : Math.PI / 2);
            chairsAround(tbl, rnd() < 0.5 ? 4 : 6);
            wallPut(r, pick(longSides(r)), rand(0.3, 0.7), 'cabinet', 60, 20);
            plants(r, randInt(1, 2));
            const s = pick(sides(r)), p = wallPos(r, s, rand(0.3, 0.7), 6, -4); dec('painting', p.x, p.y, 48, 10, ROT[s]);
        },
        study(r) {
            const ss = sides(r);
            const d = wallPut(r, ss[0], rand(0.3, 0.7), 'desk', 64, 32, { monitor: true });
            if (d) dec('chair', d.x - Math.sin(d.rot) * 26, d.y + Math.cos(d.rot) * 26, 20, 20, d.rot + Math.PI);
            wallPut(r, ss[1], rand(0.3, 0.7), 'bookshelf', randInt(60, 100), 16);
            if (rnd() < 0.6) wallPut(r, ss[2], rand(0.3, 0.7), 'bookshelf', randInt(50, 80), 16);
            if (rnd() < 0.6) wallPut(r, ss[3], rand(0.3, 0.7), 'armchair', 32, 32, { color: pick(SOFA_COLORS) });
            if (rnd() < 0.5) wallPut(r, ss[0], d ? 0.1 : 0.5, 'filing', 28, 20);
            rug(r, 110, 80, 0.5, 0.55);
        },
        laundry(r) {
            const s = pick(longSides(r));
            for (const f of [0.2, 0.4]) wallPut(r, s, f, 'fridge', 28, 28);
            wallPut(r, s, 0.7, 'sink', 26, 20);
            wallPut(r, opposite(s), 0.5, 'shelf', Math.min(100, sideLen(r, s) * 0.6), 18);
            if (rnd() < 0.5) midPut(r, 0.5, 0.5, 'drum', 22, 22, 0, { color: '#4a6a8a' });
        },
        garage(r) {
            const ss = sides(r);
            wallPut(r, ss[0], 0.5, 'workbench', Math.min(110, sideLen(r, ss[0]) * 0.6), 24);
            wallPut(r, ss[1], rand(0.3, 0.7), 'toolrack', 70, 12);
            for (let i = randInt(1, 3); i > 0; i--) wallPut(r, ss[2], rand(0.15, 0.85), 'drum', 24, 24, { color: pick(['#7a3b22', '#5a5f3a', '#3b4a5a']) });
            if (rnd() < 0.5) midPut(r, 0.5, 0.55, 'engine', 46, 30, 0);
            dec('oil', (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 70, 44);
        },
        studio(r) {
            const ss = sides(r);
            kitchenRun(r, ss[0]);
            const bed = wallPut(r, ss[1], rnd() < 0.5 ? 0.25 : 0.75, 'bed', 56, 78, { color: pick(BED_COLORS) });
            if (bed && rnd() < 0.7) { const p = wallPos(r, ss[1], (ss[1] === 'top' || ss[1] === 'bottom' ? (bed.x - r.x0) / sideLen(r, ss[1]) : (bed.y - r.y0) / sideLen(r, ss[1])) + 0.18, 18); solid(r, 'nightstand', p.x, p.y, 18, 18, ROT[ss[1]]); }
            wallPut(r, ss[2], 0.5, 'sofa', 90, 32, { color: pick(SOFA_COLORS) });
            if (ss[3]) wallPut(r, ss[3], 0.5, 'tv', 70, 10);
            rug(r, 120, 90, 0.5, 0.5);
            chairsAround(midPut(r, rand(0.4, 0.6), rand(0.4, 0.6), 'roundtable', 42, 42), 2);
            plants(r, 1);
        },
        hall(r) {
            const horiz = r.x1 - r.x0 > r.y1 - r.y0;
            dec('rug', (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, horiz ? (r.x1 - r.x0) * 0.8 : 40, horiz ? 40 : (r.y1 - r.y0) * 0.8, 0, { color: pick(RUG_COLORS) });
            for (let i = randInt(1, 3); i > 0; i--) { const s = horiz ? pick(['top', 'bottom']) : pick(['left', 'right']), p = wallPos(r, s, rand(0.15, 0.85), 6, -4); dec('painting', p.x, p.y, 48, 10, ROT[s]); }
        },
        shop(r) {
            // Rows of shelves with aisles between, a till by the door and fridges along the back
            const horiz = r.x1 - r.x0 >= r.y1 - r.y0, len = horiz ? r.x1 - r.x0 : r.y1 - r.y0, across = horiz ? r.y1 - r.y0 : r.x1 - r.x0;
            const rows = clamp(Math.floor((across - 80) / 90), 1, 4);
            for (let i = 0; i < rows; i++) { const f = (i + 1) / (rows + 1); horiz ? midPut(r, 0.55, f, 'rack', len * 0.55, 20, 0) : midPut(r, f, 0.55, 'rack', len * 0.55, 20, Math.PI / 2); }
            const ss = sides(r);
            wallPut(r, ss[0], 0.2, 'counter', 70, 28);
            wallPut(r, ss[0], 0.2, 'console', 30, 14, null, 30);
            for (let i = randInt(2, 4); i > 0; i--) wallPut(r, ss[1], rand(0.1, 0.9), rnd() < 0.5 ? 'cooler' : 'vending', 30, 24);
        },
        cafe(r) {
            const ss = sides(r);
            wallPut(r, ss[0], 0.5, 'counter', Math.min(130, sideLen(r, ss[0]) * 0.6), 28);
            wallPut(r, ss[0], 0.5, 'shelf', Math.min(120, sideLen(r, ss[0]) * 0.55), 14, null, 40);
            for (let i = 0; i < 8; i++) chairsAround(midPut(r, rand(0.2, 0.8), rand(0.3, 0.85), 'roundtable', 40, 40), 2);
            plants(r, randInt(2, 4));
        },
        bar(r) {
            const s = pick(sides(r));
            const ctr = wallPut(r, s, 0.5, 'counter', Math.min(160, sideLen(r, s) * 0.7), 28, null, 36);
            wallPut(r, s, 0.5, 'shelf', Math.min(150, sideLen(r, s) * 0.65), 14);
            if (ctr) for (let i = -2; i <= 2; i++) { const horiz = s === 'top' || s === 'bottom', sg = s === 'top' || s === 'left' ? 1 : -1; dec('stool', ctr.x + (horiz ? i * 28 : sg * (ctr.hw + 14)), ctr.y + (horiz ? sg * (ctr.hh + 14) : i * 28), 18, 18); }
            for (let i = 0; i < 5; i++) chairsAround(midPut(r, rand(0.2, 0.8), rand(0.2, 0.8), 'roundtable', 42, 42), rnd() < 0.5 ? 2 : 4);
            rug(r, 140, 100);
        },
        office(r) {
            const cols = clamp(Math.floor((r.x1 - r.x0 - 40) / 90), 1, 4), rows = clamp(Math.floor((r.y1 - r.y0 - 60) / 90), 1, 3);
            for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
                if (rnd() < 0.2) continue;
                const d = midPut(r, (i + 0.5) / cols, (j + 0.4) / rows, 'desk', 56, 30, 0, { monitor: true });
                if (d) dec('chair', d.x, d.y + 26, 20, 20, Math.PI);
            }
            const ss = sides(r);
            wallPut(r, ss[0], rand(0.1, 0.9), 'filing', 32, 22);
            if (rnd() < 0.6) wallPut(r, ss[1], rand(0.1, 0.9), 'printer', 26, 22);
            if (rnd() < 0.5) wallPut(r, ss[2], 0.5, 'whiteboard', 90, 8);
            if (rnd() < 0.5) wallPut(r, ss[3], rand(0.1, 0.9), 'cooler', 20, 20);
            plants(r, randInt(1, 2));
        },
        gym(r) {
            const s = pick(longSides(r)), len = sideLen(r, s);
            for (let f = 50 / len; f < 1 - 40 / len; f += 52 / len) wallPut(r, s, f, 'treadmill', 34, 56);
            wallPut(r, opposite(s), 0.5, 'weights', 80, 20);
            midPut(r, 0.45, 0.55, 'bench', 22, 52, 0);
            midPut(r, 0.65, 0.55, 'bench', 22, 52, 0);
            const side = pick(sides(r).filter(x => x !== s && x !== opposite(s)));
            for (const f of [0.3, 0.5, 0.7]) wallPut(r, side, f, 'locker', 20, 20);
            rug(r, 130, 90, 0.55, 0.55, '#2b3a4a');
        },
        laundromat(r) {
            for (const s of longSides(r)) { const len = sideLen(r, s); for (let f = 30 / len; f < 1 - 25 / len; f += 34 / len) wallPut(r, s, f, 'fridge', 30, 28); }
            midPut(r, 0.5, 0.5, 'bench', 70, 22, (r.x1 - r.x0) > (r.y1 - r.y0) ? 0 : Math.PI / 2);
        },
        clinic(r) {
            const ss = sides(r);
            for (const f of [0.25, 0.65]) wallPut(r, ss[0], f, 'bed', 40, 76, { hospital: true });
            wallPut(r, ss[1], 0.5, 'trolley', 40, 24);
            wallPut(r, ss[2], rand(0.3, 0.7), 'cabinet', 50, 20);
            wallPut(r, ss[3] || ss[2], rand(0.3, 0.7), 'sink', 26, 20);
            const p = at(r, 0.5, 0.6); dec('ivstand', p.x, p.y, 16, 16);
        },
        lobby(r) {
            // A reception desk, sofas facing each other round low tables, plants, rugs and art on the walls
            const s = pick(sides(r));
            wallPut(r, s, 0.5, 'counter', Math.min(180, sideLen(r, s) * 0.4), 32, null, 40);
            wallPut(r, s, 0.5, 'console', 40, 14, null, 10);
            for (let i = 0; i < 3; i++) {
                const fx = rand(0.25, 0.75), fy = rand(0.3, 0.75), p = at(r, fx, fy);
                dec('rug', p.x, p.y, 170, 120, 0, { color: pick(RUG_COLORS) });
                if (midPut(r, fx, fy, 'coffeetable', 54, 30, 0)) { midPut(r, fx, fy - 50 / (r.y1 - r.y0), 'sofa', 90, 32, Math.PI, { color: pick(SOFA_COLORS) }); midPut(r, fx, fy + 50 / (r.y1 - r.y0), 'sofa', 90, 32, 0, { color: pick(SOFA_COLORS) }); }
            }
            plants(r, 4);
            for (let i = 0; i < 3; i++) { const ss = pick(sides(r)), p = wallPos(r, ss, rand(0.2, 0.8), 6, -4); dec('painting', p.x, p.y, 48, 10, ROT[ss]); }
        },
        reception(r) {
            const s = pick(sides(r));
            wallPut(r, s, 0.5, 'counter', Math.min(160, sideLen(r, s) * 0.4), 30, null, 36);
            for (let i = 0; i < 3; i++) midPut(r, rand(0.25, 0.75), rand(0.4, 0.8), 'bench', 80, 22, 0);
            wallPut(r, opposite(s), rand(0.2, 0.8), 'vending', 34, 26);
            plants(r, 2);
            const p = at(r, rand(0.2, 0.8), rand(0.3, 0.7)); dec('wheelchair', p.x, p.y, 26, 26, rand(0, TAU));
        },
        storage(r) {
            for (const s of sides(r).slice(0, randInt(2, 3))) wallPut(r, s, 0.5, 'shelf', sideLen(r, s) * rand(0.5, 0.8), 20);
            for (let i = randInt(1, 3); i > 0; i--) midPut(r, rand(0.3, 0.7), rand(0.3, 0.7), rnd() < 0.5 ? 'pallet' : 'milcrate', 40, 40, 0);
        },
        workshop(r) { RECIPES.garage(r); if (rnd() < 0.6) midPut(r, 0.4, 0.4, 'lathe', 60, 30, 0); },
        barracks(r) {
            const s = pick(longSides(r)), len = sideLen(r, s);
            for (let f = 40 / len; f < 1 - 30 / len; f += 50 / len) wallPut(r, s, f, rnd() < 0.5 ? 'cot' : 'bunk', 32, 66);
            for (const f of [0.3, 0.6]) wallPut(r, opposite(s), f, 'locker', 20, 20);
        },
        ruin(r) {
            for (let i = randInt(2, 4); i > 0; i--) midPut(r, rand(0.2, 0.8), rand(0.2, 0.8), pick(['desk', 'cabinet', 'filing', 'shelf', 'drum']), 50, 26, rand(0, TAU) < 3 ? 0 : Math.PI / 2);
        }
    };
    for (const r of b.rooms) {
        (RECIPES[r.theme] || RECIPES.storage)(r);
        // The facility: paper, oil and water all over the floors
        if (rusty) for (let i = randInt(1, 3); i > 0; i--) { const p = at(r, rand(0.2, 0.8), rand(0.2, 0.8)); dec(pick(['papers', 'oil', 'puddle']), p.x, p.y, rand(40, 90), rand(30, 60), rand(0, TAU)); }
    }
    // Make sure every room can be walked into: flood out from the doors, and clear out whatever cuts a room off
    for (let pass = 0; pass < 6; pass++) {
        const cut = unreachableRooms(b, grid);
        if (!cut.length) break;
        const mine = api.placed.filter(o => !o.gone);
        // First the furniture in the cut-off rooms, then in the rooms next to them
        const victims = mine.filter(o => cut.some(r => o.x > r.x0 - (pass ? 60 : 0) && o.x < r.x1 + (pass ? 60 : 0) && o.y > r.y0 - (pass ? 60 : 0) && o.y < r.y1 + (pass ? 60 : 0)));
        for (const o of victims.slice(0, pass ? 3 : 99)) { o.gone = true; grid.removeBox(o); api.removed.push(o); }
    }
}

// Rooms nobody could walk into from outside (a grid flood from the doorways, as wide as a person)
function unreachableRooms(b, grid) {
    const C = 16, nx = Math.ceil(b.w / C), ny = Math.ceil(b.h / C), seen = new Uint8Array(nx * ny), q = [];
    const free = (i, j) => !blockedAt(grid, b.x0 + (i + 0.5) * C, b.y0 + (j + 0.5) * C, 17);
    for (const d of b.doors) { const i = Math.floor((d.inner.x - b.x0) / C), j = Math.floor((d.inner.y - b.y0) / C); if (i >= 0 && j >= 0 && i < nx && j < ny && !seen[j * nx + i]) { seen[j * nx + i] = 1; q.push(i, j); } }
    while (q.length) {
        const j = q.pop(), i = q.pop();
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const a = i + di, c = j + dj;
            if (a < 0 || c < 0 || a >= nx || c >= ny || seen[c * nx + a]) continue;
            seen[c * nx + a] = 2;
            if (!free(a, c)) continue;
            seen[c * nx + a] = 1;
            q.push(a, c);
        }
    }
    return b.rooms.filter(r => {
        for (let x = r.x0 + C / 2; x < r.x1; x += C) for (let y = r.y0 + C / 2; y < r.y1; y += C) { const i = Math.floor((x - b.x0) / C), j = Math.floor((y - b.y0) / C); if (seen[j * nx + i] === 1) return false; }
        return true;
    });
}

// The inside of a building, painted once when you first look in: each room's floor, rugs, tiles, chairs and art
const FLOOR_DECOR_FIRST = new Set(['tiles', 'rug', 'puddle', 'oil', 'papers']);
const houseArt = [];
function houseFloorArt(b) {
    if (b.floorArt) return b.floorArt;
    const [c, g] = makeCanvas(Math.ceil(b.w), Math.ceil(b.h));
    const rnd = seededRand(b.id * 131 + 17);
    g.translate(-b.x0, -b.y0);
    g.fillStyle = SPR.floors[b.floor]; g.fillRect(b.x0, b.y0, b.w, b.h);
    for (const r of b.rooms) {
        paintFinish(g, r, r.floor, rnd);
        g.fillStyle = r.tint; g.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
        // Skirting along the walls and a soft shadow where the floor meets them
        g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.strokeRect(r.x0 + 2, r.y0 + 2, r.x1 - r.x0 - 4, r.y1 - r.y0 - 4);
    }
    for (const d of b.decor) if (FLOOR_DECOR_FIRST.has(d.d)) paintDecor(g, d, rnd);
    for (const d of b.decor) if (!FLOOR_DECOR_FIRST.has(d.d)) paintDecor(g, d, rnd);
    // Ceiling lights: a warm pool in the middle of each room
    g.globalCompositeOperation = 'lighter';
    for (const r of b.rooms) {
        const x = (r.x0 + r.x1) / 2, y = (r.y0 + r.y1) / 2, rad = Math.max(r.x1 - r.x0, r.y1 - r.y0) * 0.6, gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,236,200,0.12)'); gr.addColorStop(1, 'rgba(255,236,200,0)');
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    b.floorArt = c;
    houseArt.push(b);
    // Only keep a handful painted at once
    while (houseArt.length > 24) houseArt.shift().floorArt = null;
    return c;
}

// ---------- Revolution ----------
// Two sides, the Rebels and the Regime, each with a walled base: healing rooms that patch you up, an armory whose
// chests refill with guns, a command room, barracks where you come back after you fall, cannons on the walls and
// tanks in the yard. Chests are scattered everywhere and refill too. Everyone is tougher, and each side has a pool
// No respawns and no reviving: whoever dies stays dead, lying where they fell, for the rest of the match. It ends
// when one side is wiped out, or on the clock (most fighters left wins).
const REVO = {
    hp: 250, ticketsPer: 9, respawn: 7000, protect: 3000, heal: 30, ammoEvery: 2000,
    timeLimit: 30 * 60000, chests: 230, chestRefill: 75000, armoryRefill: 15000,
    base: { court: 700, depth: 700 + 2 * (44 + 360 + 110 + 18), width: 700 + 2 * (44 + 360 + 110 + 18), rooms: 360, corridor: 110, wall: 44, balcony: 170, gate: 220, edge: 260 }, cannons: 8, tanks: 24, tankers: 0.35, bayEvery: 60000,
    shellEvery: [4000, 9000],
    sides: [{ name: 'Rebels', flag: '#3d8bff', wall: '#66789a' }, { name: 'Regime', flag: '#ff4b4b', wall: '#a2675f' }],
    // Every section of base wall takes 3000 damage; lose 75% of them and the whole base comes down
    wallHp: 3000, collapseAt: 0.75, raiders: 0.4,
    // The boss strike: load 5000 ammo into the pad in the middle of your castle and it rains 500 shots on the
    // enemy castle; each one knocks down a fifth of what it takes to bring their castle down
    strike: { cost: 5000, shots: 500, over: 15000, fall: 1300, strikes: 5, padR: 110, botWait: 20000, keep: 1 }
};
// What the corner towers fire, by type of warfare
const TOWER_ARMS = {
    catapult: { name: 'Catapult', rate: 1700, speed: 1100, dmg: 150, blastR: 170, blastDmg: 200, range: 2400, boulder: true },
    cannon: null,  // the ordinary cannon (VTYPES)
    boom: { name: 'Exploding Cannon', rate: 950, speed: 1800, dmg: 190, blastR: 320, blastDmg: 340, range: 2800 },
    tesla: { name: 'Tesla Tower', rate: 550, speed: 2800, dmg: 130, blastR: 150, blastDmg: 150, range: 2600, zap: 6 }
};
// What the boss strike drops, by type of warfare
const STRIKE_KINDS = {
    early: { name: 'boulders', R: 120, dmg: 55 },
    normal: { name: 'cannonballs', R: 140, dmg: 60 },
    heavy: { name: 'shells', R: 180, dmg: 70 },
    hightech: { name: 'missiles', R: 160, dmg: 65 }
};
const warfareKind = () => G.hightech ? 'hightech' : G.early ? 'early' : G.heavy ? 'heavy' : 'normal';
const revoName = t => REVO.sides[t] ? REVO.sides[t].name : TEAMS[t].name;
const inRect = (p, r, pad = 0) => p.x > r.x0 - pad && p.x < r.x1 + pad && p.y > r.y0 - pad && p.y < r.y1 + pad;
// Castle floors: the ground (up = null) and the balcony on top (up = base).
// Whether someone on a floor walks and shoots over an obstacle (or, for one on the middle floor, never meets it)
function levelSkips(o, up) {
    if (o.ring) return up === o.ring;  // a guard tower's round wall: on the ground and the middle floor, not the balcony
    if (o.on) return o.on !== up;
    if (!up) return false;
    const top = up.midFloor ? up.base : up;
    return o.under === top || o.parapet === top;
}
const isMid = up => !!(up && up.midFloor);
// The castle's walkway is a ring of four strips: which ones a point is on
const onDeck = (base, p) => base.decks.some(r => inRect(p, r));
// Under the castle's upper floors: anywhere over the ring of rooms (whichever floor `up` is)
const underRing = (up, p) => (up.midFloor ? up.base : up).ring.some(r => inRect(p, r));
const deckStrips = (base, p) => base.decks.map((r, i) => inRect(p, r) ? i : -1).filter(i => i >= 0);
// Walking the walkway: round the corners rather than straight across the courtyard
function deckWaypoint(base, from, goal) {
    const fs = deckStrips(base, from), gs = deckStrips(base, goal);
    if (!fs.length || !gs.length || fs.some(i => gs.includes(i))) return goal;
    const near = list => list.reduce((a, c) => (dist(from, c) < dist(from, a) ? c : a));
    // A corner that joins a strip we're on to one the goal's on, or failing that, the nearest corner on our strip
    const direct = base.deckCorners.filter(c => c.strips.some(i => fs.includes(i)) && c.strips.some(i => gs.includes(i)));
    if (direct.length) return near(direct);
    return near(base.deckCorners.filter(c => c.strips.some(i => fs.includes(i))));
}
// Keep someone up on the walkway: back onto the nearest strip if they step off its edge
function clampToDeck(f) {
    const base = f.up, pad = f.r + 6;
    if (base.decks.some(r => f.x > r.x0 + pad && f.x < r.x1 - pad && f.y > r.y0 + pad && f.y < r.y1 - pad)) return;
    let best = null, bd = Infinity;
    for (const r of base.decks) { const x = clamp(f.x, r.x0 + pad, r.x1 - pad), y = clamp(f.y, r.y0 + pad, r.y1 - pad), d = Math.hypot(x - f.x, y - f.y); if (d < bd) { bd = d; best = { x, y }; } }
    f.x = best.x; f.y = best.y;
}

function buildRevolution() {
    const W = CONFIG.WORLD_SIZE, R = G.revolution, B = REVO.base;
    // The two castles stand at opposite sides of the arena, their backs to the edge of the map
    const alongX = Math.random() < 0.5, off = W / 2 - B.edge - B.depth / 2;
    for (let t = 0; t < 2; t++) {
        const s = t === 0 ? -1 : 1;
        const c = alongX ? { x: W / 2 + s * off, y: W / 2 } : { x: W / 2, y: W / 2 + s * off };
        // Front of the base faces the middle of the map
        R.bases.push(buildBase(t, c, alongX ? { x: -s, y: 0 } : { x: 0, y: -s }));
    }
    // The corner guns reach right across the map to the far side of the enemy castle
    for (const c of G.world.cars) if (c.type === 'bigtower' && c.tower) {
        const foeBase = R.bases.find(b => b !== c.tower);
        c.foeBase = foeBase;
        c.reach = Math.hypot(foeBase.c.x - c.x, foeBase.c.y - c.y) + B.width / 2 + 300;
    }
    // Chests everywhere outside the bases
    for (let i = 0, n = Math.round(REVO.chests * MAP_AREA); i < n; i++) {
        const s = findSpawn(null, 0);
        if (R.bases.some(b => inRect(s, b.rect, 150)) || buildingAt(s.x, s.y, 20)) continue;
        placeChest(s.x, s.y, false, 0);
    }
    // Cannons dug in at open spots around the map, and tanks parked about
    for (let i = 0, placed = 0; i < 300 && !G.early && placed < REVO.cannons * MAP_SCALE; i++) {
        const s = findSpawn(null, 0);
        if (R.bases.some(b => inRect(s, b.rect, 400)) || blockedAt(G.world.grid, s.x, s.y, 70) || buildingAt(s.x, s.y, 80)) continue;
        spawnVehicle('cannon', s.x, s.y, rand(0, TAU));
        placed++;
    }
    // Tanks out in the field (each castle's own wait in the bay outside its gate)
    for (let i = 0, placed = 0; i < 300 && placed < (REVO.tanks - 8) * MAP_SCALE; i++) {
        const s = findSpawn(null, 0);
        if (R.bases.some(b => inRect(s, b.rect, 200)) || blockedAt(G.world.grid, s.x, s.y, 90) || buildingAt(s.x, s.y, 90)) continue;
        spawnVehicle(G.early ? (Math.random() < 0.7 ? 'horse' : 'wagon') : 'tank', s.x, s.y, rand(0, TAU));
        placed++;
    }
    revoWarzone();
}

// No man's land between the bases: shell craters, burnt-out tanks still smoking, tank traps and sandbag lines
function revoWarzone() {
    const R = G.revolution, A = R.bases[0], B = R.bases[1], grid = G.world.grid;
    const ax = B.c.x - A.c.x, ay = B.c.y - A.c.y, len = Math.hypot(ax, ay), ux = ax / len, uy = ay / len, vx = -uy, vy = ux;
    const front = REVO.base.depth / 2 + 150, span = len - front * 2, wide = 2200 * MAP_SCALE;
    const at = (t, s) => ({ x: A.c.x + ux * (front + t * span) + vx * s, y: A.c.y + uy * (front + t * span) + vy * s });
    const clearOf = (p, r) => !blockedAt(grid, p.x, p.y, r) && !buildingAt(p.x, p.y, r) && !R.bases.some(b => inRect(p, b.rect, r + 60));
    // Nothing that gets in the way goes anywhere near a base: barriers only out in the middle of no man's land
    const farOff = p => !R.bases.some(b => inRect(p, b.rect, 900));
    for (let i = 0; i < 70; i++) { const p = at(Math.random(), rand(-wide, wide)); addDecal({ kind: 'scorch', x: p.x, y: p.y, r: rand(50, 150), life: 1e12 }); }
    G.world.smokers = G.world.smokers || [];
    for (let i = 0; i < 12; i++) {
        const p = at(rand(0.25, 0.75), rand(-wide * 0.7, wide * 0.7));
        if (!clearOf(p, 70) || !farOff(p)) continue;
        const side = Math.random() < 0.5, T = VTYPES[G.early ? 'wagon' : 'tank'], wa = side ? (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (Math.random() < 0.5 ? 0 : Math.PI);
        const w = { type: 'crate', car: true, wreck: true, x: p.x, y: p.y, hw: (side ? T.wid : T.len) / 2, hh: (side ? T.len : T.wid) / 2, color: G.early ? '#cdbb92' : '#4f5d33', horiz: !side, burnUntil: Infinity, driven: G.early ? 'wagon' : 'tank', wa };
        G.world.obstacles.push(w); grid.insertBox(w);
        G.world.smokers.push({ x: p.x, y: p.y });
        addDecal({ kind: 'scorch', x: p.x, y: p.y, r: 110, life: 1e12 });
    }
    // Rows of steel tank traps and sandbag walls across the field
    for (let row = 0; row < 3; row++) {
        const t = 0.32 + row * 0.18;
        for (let s = -wide; s < wide; s += rand(90, 160)) {
            const p = at(t + rand(-0.02, 0.02), s);
            if (Math.random() < 0.35 || !clearOf(p, 30) || !farOff(p)) continue;
            if (row % 2) { const o = { type: 'crate', hedgehog: true, x: p.x, y: p.y, hw: 16, hh: 16, rot: rand(0, TAU) }; G.world.obstacles.push(o); grid.insertBox(o); }
            else if (Math.random() < 0.5) { const horiz = Math.abs(vx) > Math.abs(vy); const o = { type: 'crate', sandbags: true, x: p.x, y: p.y, hw: horiz ? 60 : 14, hh: horiz ? 14 : 60 }; if (clearOf(p, 64)) { G.world.obstacles.push(o); grid.insertBox(o); } }
        }
    }
    R.field = { at, span, wide };
    R.nextShell = G.time + 8000;
}

// A steel tank trap: three crossed girders
function drawHedgehog(o) {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-14, -3 + 6, 28, 6);
    for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.rotate((i * Math.PI) / 3);
        ctx.fillStyle = '#3a3f46'; ctx.fillRect(-18, -3.5, 36, 7);
        ctx.fillStyle = '#5d636c'; ctx.fillRect(-18, -3.5, 36, 2);
        ctx.restore();
    }
    ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
    ctx.restore();
}

// Artillery keeps falling on no man's land: a whistle, then the shell lands
function updateArtillery() {
    const R = G.revolution;
    if (!R.field) return;
    if (G.time >= R.nextShell) {
        R.nextShell = G.time + rand(...REVO.shellEvery);
        const p = R.field.at(rand(0.05, 0.95), rand(-R.field.wide, R.field.wide));
        (R.shells || (R.shells = [])).push({ x: p.x, y: p.y, at: G.time + 1300 });
        if (inView(p.x, p.y, 900)) Sound.tone(1400, 1.2, 'sine', 0.05 * Sound.volAt(p.x, p.y), 300);
    }
    if (R.shells && R.shells.length) {
        const due = R.shells.filter(q => G.time >= q.at);
        R.shells = R.shells.filter(q => G.time < q.at);
        for (const q of due) {
            blast(q.x, q.y, q.owner || null, q.R || 150, q.dmg || 70, q.owner ? 'Boss Strike' : 'Artillery');
            // (some of a boss strike's shots are aimed right at sections of wall, and bring them down)
            if (q.wall && !q.wall.broken) damageBaseWall(q.wall, 1e9, q.owner);
            if (q.owner && q.kind === 'hightech') burst(q.x, q.y, 8, '#7fe9ff', 260, 'glow');
            if (q.owner && Math.random() > 0.3) continue;
            if (inView(q.x, q.y, 300)) { G.particles.push({ type: 'boom', x: q.x, y: q.y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 160 }); for (let i = 0; i < 18; i++) { const a = rand(0, TAU), sp = rand(150, 420); G.particles.push({ type: 'chunk', x: q.x, y: q.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 1), max: 1, size: rand(4, 9), color: pick(['#6b5a3a', '#4a3f2a', '#8a7a5a']), rot: rand(0, TAU), spin: rand(-12, 12) }); } }
            Sound.boom(Sound.volAt(q.x, q.y), 1.2);
        }
    }
}

// The shadow of an incoming shell on the ground, growing as it falls
function drawShells() {
    const R = G.revolution;
    if (!R.shells) return;
    for (const q of R.shells) {
        if (!inView(q.x, q.y, 60)) continue;
        const k = 1 - (q.at - G.time) / 1300;
        if (k < 0) continue;
        ctx.fillStyle = `rgba(0,0,0,${0.1 + k * 0.35})`; ctx.beginPath(); ctx.arc(q.x, q.y, 10 + k * 30, 0, TAU); ctx.fill();
        if (!q.kind) continue;
        // A boss strike's shots come down from the sky onto their shadows
        const y = q.y - (1 - k) * 520, x = q.x - (1 - k) * 160;
        if (q.kind === 'hightech') {
            ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(520, 160));
            ctx.fillStyle = 'rgba(127,233,255,0.8)'; ctx.beginPath(); ctx.ellipse(-22, 0, 12, 5, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#d8dde6'; roundRect(ctx, -14, -5, 26, 10, 4); ctx.fill(); ctx.fillStyle = '#ff5a5f'; ctx.beginPath(); ctx.moveTo(12, -5); ctx.lineTo(20, 0); ctx.lineTo(12, 5); ctx.closePath(); ctx.fill();
            ctx.restore();
        } else {
            const r = q.kind === 'early' ? 15 : q.kind === 'heavy' ? 13 : 10;
            ctx.fillStyle = q.kind === 'early' ? '#7d7468' : '#1e2025'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
            ctx.fillStyle = q.kind === 'early' ? '#9a9083' : '#4a4f58'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU); ctx.fill();
            if (q.kind === 'heavy') { ctx.fillStyle = 'rgba(255,179,71,0.8)'; ctx.beginPath(); ctx.arc(x + 4, y - 10, 5, 0, TAU); ctx.fill(); }
        }
    }
}

// A chest goes at the first free spot near (x, y): never on top of another chest, a wall or furniture.
// (it looks up to `reach` away; with nothing free it isn't placed at all)
function placeChest(x, y, armory, reach = 60) {
    const free = (px, py) => !blockedAt(G.world.grid, px, py, 38) && !G.revolution.chests.some(o => Math.abs(o.x - px) < o.hw * 2 + 8 && Math.abs(o.y - py) < o.hh * 2 + 8);
    if (free(x, y)) return addChest(x, y, armory);
    for (let i = 1; i <= 24 && reach > 0; i++) {
        const a = i * 2.4, d = reach * Math.sqrt(i / 24), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
        if (free(px, py)) return addChest(px, py, armory);
    }
    return null;
}

function addChest(x, y, armory) {
    const o = { type: 'box', chest: true, armory, x, y, hw: 26, hh: 18, hp: 60, maxHp: 60, hitAt: -9999, rot: 0, seed: randInt(1, 1e9) };
    G.world.grid.insertBox(o);
    G.revolution.chests.push(o);
    return o;
}

// What's in a chest: always a gun (the armory's are better), usually ammo, sometimes armour, meds or a grenade
function chestItems(o) {
    const items = [G.hightech ? pick(HYPER_LOOT.weapons) : gunFrom(G.supplies || o.armory ? WAR_GUN_TABLE : GUN_TABLE), 'ammo'];
    if (o.armory) { if (Math.random() < 0.35) items.push(Math.random() < 0.5 ? 'armor' : 'grenade'); }
    else {
        if (Math.random() < 0.45) items.push(pick(['bandage', 'bandage', 'medkit']));
        if (Math.random() < 0.3) items.push('armor');
        if (Math.random() < 0.25) items.push(Math.random() < 0.85 ? 'grenade' : weightedPick(NADE2_TABLE));
    }
    return items;
}

// A castle: a walled square with an empty courtyard in the middle and a ring of rooms all the way round
// inside the walls (medical rooms, chest rooms, barracks, the armory, command, and the main hangar full of gun
// racks). Over the ring, and only the ring, is the second floor: a walkway all the way round where you can look
// out over the walls and shoot, like a balcony, with the castle's big guns on its four corners.
// Local frame: u runs back (-) to front (+, toward the enemy), v across. Each side of the ring has its own frame:
// `al` along the wall, `d` how far in from the outside of the castle.
function buildBase(team, c, fwd) {
    const B = REVO.base, grid = G.world.grid, side = { x: -fwd.y, y: fwd.x };
    const P = (u, v) => ({ x: c.x + fwd.x * u + side.x * v, y: c.y + fwd.y * u + side.y * v });
    const rectOf = (u0, v0, u1, v1) => { const a = P(u0, v0), b = P(u1, v1); return { x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) }; };
    const D = B.depth / 2, Wd = B.width / 2, T = B.wall, RD = B.rooms, CD = B.corridor, RW = T + RD + CD + 18;
    const base = { team, c, fwd, rect: rectOf(-D, -Wd, D, Wd), regions: [], decor: [], labels: [], deckDecor: [], decks: [], heal: [], spawns: [], spawn: null, armory: null, roofAlpha: 0, walls: [], down: 0, fallen: false, target: P(D - 40, 0), stairs: [] };
    // Clear the ground: anything standing there goes (houses too), with a ring of open ground all round it
    const clearR = { x0: base.rect.x0 - 320, y0: base.rect.y0 - 320, x1: base.rect.x1 + 320, y1: base.rect.y1 + 320 };
    const hitsR = o => o.hw !== undefined ? o.x + o.hw > clearR.x0 && o.x - o.hw < clearR.x1 && o.y + o.hh > clearR.y0 && o.y - o.hh < clearR.y1 : inRect(o, clearR, o.r || 0);
    G.world.obstacles = G.world.obstacles.filter(o => { if (!hitsR(o)) return true; o.hw !== undefined ? grid.removeBox(o) : grid.remove(o); return false; });
    G.world.buildings = G.world.buildings.filter(b => !(b.x1 > clearR.x0 && b.x0 < clearR.x1 && b.y1 > clearR.y0 && b.y0 < clearR.y1));
    G.world.stairs = G.world.stairs.filter(s => G.world.buildings.includes(s.b));
    G.world.cars = (G.world.cars || []).filter(car => { if (!inRect(car, clearR)) return true; unparkCar(car); return false; });
    const stray = []; grid.query((clearR.x0 + clearR.x1) / 2, (clearR.y0 + clearR.y1) / 2, Math.max(clearR.x1 - clearR.x0, clearR.y1 - clearR.y0), o => { if (o.type === 'box' && inRect(o, clearR)) stray.push(o); });
    for (const o of stray) { o.broken = true; grid.removeBox(o); }
    G.lootGrid.query((clearR.x0 + clearR.x1) / 2, (clearR.y0 + clearR.y1) / 2, Math.max(clearR.x1 - clearR.x0, clearR.y1 - clearR.y0), l => { if (inRect(l, clearR)) l.gone = true; });
    const add = o => { G.world.obstacles.push(o); grid.insertBox(o); return o; };
    const wallCol = REVO.sides[team].wall, innerCol = shade(wallCol, 0.2);
    const wall = (u0, v0, u1, v1, color = wallCol, extra) => { const r = rectOf(u0, v0, u1, v1); if (r.x1 - r.x0 > 2 && r.y1 - r.y0 > 2) return base.walls.push(add({ type: 'wall', x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2, hw: (r.x1 - r.x0) / 2, hh: (r.y1 - r.y0) / 2, color, baseWall: true, base, hp: REVO.wallHp, maxHp: REVO.wallHp, hitAt: -9999, ...extra })); };
    const sandbags = r => add({ type: 'crate', sandbags: true, x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2, hw: (r.x1 - r.x0) / 2, hh: (r.y1 - r.y0) / 2 });
    const gate = B.gate / 2;
    base.regions.push({ ...base.rect, floor: 'concrete' });

    // The four sides of the ring, each with its own frame
    const SIDES = {
        back: { Q: (al, d) => [-D + d, al], out: { x: -fwd.x, y: -fwd.y }, half: Wd },
        front: { Q: (al, d) => [D - d, al], out: { x: fwd.x, y: fwd.y }, half: Wd },
        left: { Q: (al, d) => [al, -Wd + d], out: { x: -side.x, y: -side.y }, half: D },
        right: { Q: (al, d) => [al, Wd - d], out: { x: side.x, y: side.y }, half: D }
    };
    const at = (S, al, d) => { const [u, v] = S.Q(al, d); return P(u, v); };
    const rectS = (S, a0, d0, a1, d1) => { const [u0, v0] = S.Q(a0, d0), [u1, v1] = S.Q(a1, d1); return rectOf(Math.min(u0, u1), Math.min(v0, v1), Math.max(u0, u1), Math.max(v0, v1)); };
    const wallS = (S, a0, d0, a1, d1, color, extra) => { const [u0, v0] = S.Q(a0, d0), [u1, v1] = S.Q(a1, d1); wall(Math.min(u0, u1), Math.min(v0, v1), Math.max(u0, u1), Math.max(v0, v1), color, extra); };
    // A wall running along a side at depth d, with gaps cut in it (gaps as [from, to] along it)
    const along = (S, d, t, a0, a1, gaps, color, extra) => { let a = a0; for (const [g0, g1] of [...gaps].sort((x, y) => x[0] - y[0])) { if (g0 > a) wallS(S, a, d - t / 2, g0, d + t / 2, color, extra); a = Math.max(a, g1); } if (a1 > a) wallS(S, a, d - t / 2, a1, d + t / 2, color, extra); };
    // A wall across the ring at `al`, from depth d0 to d1 (with an optional doorway [from, to] in depth)
    const across = (S, al, t, d0, d1, color, door) => { if (door) { wallS(S, al - t / 2, d0, al + t / 2, door[0], color); wallS(S, al - t / 2, door[1], al + t / 2, d1, color); } else wallS(S, al - t / 2, d0, al + t / 2, d1, color); };
    const furnRot = (kind, p, lw, lh, rot, extra) => {
        const sideways = Math.abs(Math.sin(rot)) > 0.5, hw = (sideways ? lh : lw) / 2, hh = (sideways ? lw : lh) / 2;
        return add({ type: 'crate', furn: kind, x: p.x, y: p.y, hw, hh, lw, lh, rot, seed: randInt(1, 1e9), house: base, ...extra });
    };
    // Furniture with its back to the castle wall (or facing away from it)
    const furn = (S, kind, al, d, lw, lh, extra, faceIn = true) => furnRot(kind, at(S, al, d), lw, lh, Math.atan2(S.out.y, S.out.x) + (faceIn ? -Math.PI / 2 : Math.PI / 2), extra);
    const chest = (S, al, d, armory) => { const p = at(S, al, d); return placeChest(p.x, p.y, armory, 50); };
    const label = (text, p) => base.labels.push({ text, x: p.x, y: p.y });

    // Gates through the outer wall: the main gate and the tank gate in front, one in each side wall
    // (the courtyard is only a screen across: the vehicle bay is outside, in front of the main gate)
    const sideGate = [-75, 75];
    const passes = { back: [], front: [[-gate, gate]], left: [sideGate], right: [sideGate] };
    // (the outer walls stop at the big corner towers: the towers themselves are the castle's corners)
    const TC = 170, cut = TC + 150;
    for (const k in SIDES) along(SIDES[k], T / 2, T, -SIDES[k].half + cut, SIDES[k].half - cut, passes[k], wallCol);
    base.gates = [];
    const gateAt = r => base.gates.push(add({ type: 'wall', gate: true, base, x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2, hw: (r.x1 - r.x0) / 2, hh: (r.y1 - r.y0) / 2, color: '#3a3f46', open: 0, shut: true, horiz: (r.x1 - r.x0) > (r.y1 - r.y0) }));
    for (const k in passes) for (const [g0, g1] of passes[k]) gateAt(rectS(SIDES[k], g0, 0, g1, T));

    // Room plans for each side, between the corner rooms. 'pass' is a passage through the ring to a gate
    const L = Wd - T - RD, Ls = D - T - RD;
    const split = (a0, a1, kinds) => { const n = kinds.length, out = []; for (let i = 0; i < n; i++) out.push([a0 + (i * (a1 - a0)) / n, a0 + ((i + 1) * (a1 - a0)) / n, kinds[i]]); return out; };
    // The back is the main hangar; chest rooms either side of the main gate; medical, barracks, armory and
    // command either side of the side gates; chest rooms in all four corners
    // (lots of rooms under the balcony: medical rooms on three sides, chest rooms everywhere)
    const plans = {
        back: [[-L, -260, 'heal'], [-260, 260, 'hangar'], [260, L, 'chests']],
        front: [[-L, -300, 'chests'], [-300, -gate - 20, 'store'], [-gate - 20, gate + 20, 'pass'], [gate + 20, 300, 'store'], [300, L, 'chests']],
        left: [[-Ls, -260, 'heal'], [-260, sideGate[0] - 20, 'chests'], [sideGate[0] - 20, sideGate[1] + 20, 'pass'], [sideGate[1] + 20, 260, 'chests'], [260, Ls, 'barracks']],
        right: [[-Ls, -260, 'armory'], [-260, sideGate[0] - 20, 'chests'], [sideGate[0] - 20, sideGate[1] + 20, 'pass'], [sideGate[1] + 20, 260, 'command'], [260, Ls, 'heal']]
    };
    // Corner rooms (chest rooms), at both ends of the back and front
    for (const k of ['back', 'front']) { plans[k].unshift([-Wd + T, -L, 'corner']); plans[k].push([L, Wd - T, 'corner']); }

    // The four round guard towers stand on the corners: each is a round room on the ground floor and another on
    // the middle floor (the gun sits on top, on the balcony). The door faces the next room along
    const TR = 222;
    base.towerRooms = [];
    for (const k of ['back', 'front']) for (const sg of [-1, 1]) {
        const S = SIDES[k], ctr = at(S, sg * (Wd - TC), TC), dp = at(S, sg * L, T + RD * 0.5), door = Math.atan2(dp.y - ctr.y, dp.x - ctr.x);
        base.towerRooms.push({ x: ctr.x, y: ctr.y, R: TR, door, S, sg });
        const N = 44;
        for (let i = 0; i < N; i++) {
            const a = (i / N) * TAU;
            if (Math.abs(angleDiff(a, door)) < 0.27) continue;
            add({ type: 'wall', x: ctr.x + Math.cos(a) * TR, y: ctr.y + Math.sin(a) * TR, hw: 17, hh: 17, color: wallCol, base, ring: base, towerWall: true });
        }
    }
    const towerRoomOf = (S, m) => base.towerRooms.find(t => t.S === S && t.sg === Math.sign(m));

    // The rooms' front walls (with a door into each room), the corridor behind them, and the inner wall: the
    // courtyard side of the ring and the parapet of the walkway above
    const dDoor = T + RD + 7, dIn = RW - 9;
    const inner = { back: [-Wd + RW - 18, Wd - RW + 18], front: [-Wd + RW - 18, Wd - RW + 18], left: [-D + RW, D - RW], right: [-D + RW, D - RW] };
    for (const k in SIDES) {
        const S = SIDES[k], plan = plans[k];
        const doors = [], opens = [];
        for (const [a0, a1, kind] of plan) {
            const m = (a0 + a1) / 2;
            if (kind === 'pass') { doors.push([a0 + 9, a1 - 9]); opens.push([a0 + 9, a1 - 9]); }
            else if (kind === 'hangar') { const q = (a1 - a0) / 4; doors.push([m - q - 50, m - q + 50], [m + q - 50, m + q + 50]); }
            else if (kind !== 'corner') doors.push([m - 45, m + 45]);
        }
        // (front walls of the back and front rooms run right across: at the corners they close off the corner rooms)
        const span = k === 'back' || k === 'front' ? [-Wd + T, Wd - T] : [-Ls, Ls];
        along(S, dDoor, 14, span[0], span[1], doors, innerCol);
        // Ways from the corridor out into the courtyard
        const extra = k === 'back' ? [0] : [];
        for (const f of extra) { const m = f * (inner[k][1] - 40); if (!opens.some(([o0, o1]) => m > o0 - 150 && m < o1 + 150)) opens.push([m - 55, m + 55]); }
        along(S, dIn, 18, inner[k][0], inner[k][1], opens, wallCol, { parapet: base });
        // Room dividers (the corner rooms open into the room next to them)
        for (let i = 1; i < plan.length; i++) {
            const a = plan[i][0], corner = plan[i - 1][2] === 'corner' || plan[i][2] === 'corner';
            across(S, a, 14, T, T + RD, innerCol, corner ? [T + RD * 0.35, T + RD * 0.65] : null);
        }
        // The corridor's floor
        base.regions.push({ ...rectS(S, -inner[k][1] + 18, T + RD + 14, inner[k][1] - 18, RW - 18), floor: 'lino' });
        // Fill the rooms
        for (const [a0, a1, kind] of plan) fillRoom(S, kind, a0 + 7, a1 - 7);
    }
    function fillRoom(S, kind, a0, a1) {
        const room = rectS(S, a0, T, a1, T + RD), m = (a0 + a1) / 2, w = a1 - a0, d = k => T + RD * k;
        switch (kind) {
            case 'heal':
                base.heal.push(room);
                base.regions.push({ ...room, floor: 'surgery' });
                for (const f of [0.2, 0.5, 0.8]) furn(S, 'bed', lerp(a0, a1, f), T + 44, 40, 80, { hospital: true });
                { const p = at(S, m, d(0.7)); base.decor.push({ d: 'cross', x: p.x, y: p.y }); }
                break;
            case 'corner': {
                // The guard tower's ground-floor room: chests round its wall
                const tr = towerRoomOf(S, m);
                base.regions.push({ ...room, floor: 'wood' });
                for (const da of [Math.PI / 2, Math.PI, -Math.PI / 2]) for (const rr of [95, 165]) { const a = tr.door + da + (rr > 100 ? 0.35 : 0); placeChest(tr.x + Math.cos(a) * rr, tr.y + Math.sin(a) * rr, rr < 100, 30); }
                label('TOWER', { x: tr.x, y: tr.y });
                break;
            }
            case 'chests':
                // A chest room: rows of chests, the back row the armory's olive-green ones with the better guns
                base.regions.push({ ...room, floor: 'wood' });
                for (const k of [0.2, 0.48, 0.76]) for (const f of [0.25, 0.75]) chest(S, lerp(a0, a1, f), d(k), k < 0.3);
                label('CHESTS', at(S, m, d(0.62)));
                break;
            case 'armory':
                base.armory = room;
                base.regions.push({ ...room, floor: 'concrete' });
                for (const f of [0.25, 0.75]) furn(S, 'weaponrack', lerp(a0, a1, f), T + 14, 64, 22);
                furn(S, 'gunbench', m, T + 100, 76, 32);
                for (const k of [0.55, 0.82]) for (const f of [0.22, 0.78]) chest(S, lerp(a0, a1, f), d(k), true);
                label('ARMORY', at(S, m, d(0.68)));
                break;
            case 'command':
                base.regions.push({ ...room, floor: 'office' });
                furn(S, 'monitorwall', m, T + 10, Math.min(150, w - 30), 14);
                for (const f of [0.28, 0.72]) furn(S, 'console', lerp(a0, a1, f), T + 56, 56, 24);
                furn(S, 'maptable', m, T + 160, 76, 52);
                break;
            case 'barracks':
                base.spawns.push(room);
                base.regions.push({ ...room, floor: 'wood' });
                for (const f of [0.2, 0.5, 0.8]) furn(S, 'bunk', lerp(a0, a1, f), T + 40, 38, 74);
                for (const f of [0.3, 0.7]) furn(S, 'locker', lerp(a0, a1, f), T + RD - 36, 22, 22, undefined, false);
                break;
            case 'hangar':
                // The main hangar: rows and rows of gun racks to smash open
                base.hangar = room;
                base.regions.push({ ...room, floor: 'concrete' });
                for (let dd = T + 50; dd <= T + RD - 90; dd += 105) for (let aa = a0 + 90; aa <= a1 - 90; aa += 165) furn(S, 'weaponrack', aa, dd, 130, 22);
                label('HANGAR', at(S, m, T + RD - 40));
                break;
            case 'store':
                base.regions.push({ ...room, floor: 'concrete' });
                if (w > 120) for (const k of [0.3, 0.7]) chest(S, m, d(k), false);
                label('STORE', at(S, m, d(0.5)));
                break;
        }
    }
    base.spawn = base.spawns[0];

    // The walkway on top of the ring: four strips (the long ones run right across, the short ones meet them at the corners)
    // (the ring: the whole footprint of the rooms; the middle floor covers all of it, the balcony on top only its outer edge)
    const ringStrips = w => [rectS(SIDES.back, -Wd, 0, Wd, w), rectS(SIDES.front, -Wd, 0, Wd, w), rectS(SIDES.left, -D, 0, D, w), rectS(SIDES.right, -D, 0, D, w)];
    const ringCorners = w => { const out = []; for (const su of [-1, 1]) for (const sv of [-1, 1]) out.push({ ...P(su * (D - w / 2), sv * (Wd - w / 2)), strips: [su < 0 ? 0 : 1, sv < 0 ? 2 : 3] }); return out; };
    const BW = B.balcony;
    base.ring = ringStrips(RW);
    base.decks = ringStrips(BW);
    base.deckSides = ['back', 'front', 'left', 'right'];
    base.deckCorners = ringCorners(BW);
    base.lower = null;
    // Up on the balcony: sandbag nests along the outer edge to shoot from (no medical stations up here: the medical
    // rooms are below)
    for (const k of base.deckSides) {
        const S = SIDES[k], H = S.half - 330, n = 7;
        for (let i = 0; i < n; i++) { const al = lerp(-H, H, (i + 0.5) / n); if (Math.abs(al - 300) < 110) continue; base.deckDecor.push({ d: 'nest', ...at(S, al, T + 40), face: Math.atan2(S.out.y, S.out.x), strip: base.deckSides.indexOf(k) }); }
    }
    // Staircases up from the courtyard, two on each side
    const stairsAt = { back: [-0.6, 0.6], front: [-0.7, 0.7], left: [-0.6, 0.6], right: [-0.6, 0.6] };
    for (const k in SIDES) {
        const S = SIDES[k];
        // (from the courtyard straight up onto the balcony, over the roof of the rooms)
        for (const f of stairsAt[k]) {
            const al = f * (inner[k][1] - 80);
            base.stairs.push({ b: at(S, al, RW + 50), t: at(S, al, BW - 55), up: at(S, al, BW - 95), down: at(S, al, RW + 95), face: Math.atan2(-S.out.y, -S.out.x) });
        }
    }

    // ---- Outside the main gate the vehicle bay; in the courtyard sandbags by the gate, the flag and the boss strike pad ----
    // (the vehicles park in the courtyard, nose to the main gate)
    base.bay = [];
    for (const [u, v] of [[170, -200], [170, 200], [-110, -200], [-110, 200]]) {
        const p = P(u, v);
        base.bay.push(rectOf(u - 75, v - 50, u + 75, v + 50));
        spawnVehicle(G.early ? 'horse' : 'tank', p.x, p.y, Math.atan2(fwd.y, fwd.x));
    }
    for (const [va, vb] of [[-gate - 140, -gate - 20], [gate + 20, gate + 140]]) sandbags(rectOf(D - RW - 130, va, D - RW - 100, vb));
    base.flag = P(-250, 0);
    base.strike = { ...P(0, 0), ammo: 0, fullAt: 0, launched: 0 };
    // Who the castle's own guns and boss strikes count as (for the kill feed)
    base.crew = { name: `${revoName(team)} castle`, team, isPlayer: false, dead: false, kills: 0, x: c.x, y: c.y, r: 30, hp: 1, hidden: false, color: REVO.sides[team].flag };

    // The big guns on the walkway's four corners (Early Warfare: catapults); two smaller cannon towers by the main gate
    const arm = { early: 'catapult', normal: 'cannon', heavy: 'boom', hightech: 'tesla' }[warfareKind()];
    const tower = (type, u, v, a) => { const p = P(u, v), tw = spawnVehicle(type, p.x, p.y, Math.atan2(fwd.y, fwd.x)); tw.color = REVO.sides[team].flag; tw.base = base; tw.tower = base; tw.arm = a; };
    for (const su of [-1, 1]) for (const sv of [-1, 1]) tower('bigtower', su * (D - TC), sv * (Wd - TC), arm);
    if (!G.early) for (const vv of [-gate - 70, gate + 70]) tower('tower', D - T / 2, vv, 'cannon');

    // Everything in the ring sits under the walkway: people up there walk (and shoot) over it
    const onDeckR = o => base.ring.some(r => inRect(o, r));
    for (const o of G.world.obstacles) if (!o.parapet && o.hw !== undefined && (o.house === base || o.base === base) && onDeckR(o)) o.under = base;
    for (const o of G.revolution.chests) if (!o.on && (onDeckR(o) || base.towerRooms.some(t => Math.hypot(o.x - t.x, o.y - t.y) < t.R))) o.under = base;

    // Floor art, painted once (at half resolution: the castle is huge)
    const AS = 0.5, bw = base.rect.x1 - base.rect.x0, bh = base.rect.y1 - base.rect.y0;
    const [cv, g] = makeCanvas(Math.ceil(bw * AS), Math.ceil(bh * AS));
    const rnd = seededRand(team * 7919 + 3);
    g.scale(AS, AS); g.translate(-base.rect.x0, -base.rect.y0);
    for (const r of base.regions) paintFinish(g, r, r.floor, rnd);
    for (const r of base.regions.slice(1)) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.strokeRect(r.x0 + 2, r.y0 + 2, r.x1 - r.x0 - 4, r.y1 - r.y0 - 4); }
    // The guard towers' round stone floors
    for (const tr of base.towerRooms) towerFloor(g, tr, '#8b8f96');
    for (const d of base.decor) { g.fillStyle = 'rgba(220,40,50,0.8)'; g.fillRect(d.x - 30, d.y - 9, 60, 18); g.fillRect(d.x - 9, d.y - 30, 18, 60); }
    g.strokeStyle = 'rgba(255,214,90,0.7)'; g.lineWidth = 4;
    for (const r of base.bay) g.strokeRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    { const h = base.hangar; g.strokeStyle = 'rgba(255,200,40,0.6)'; g.lineWidth = 12; g.setLineDash([30, 30]); g.strokeRect(h.x0 + 14, h.y0 + 14, h.x1 - h.x0 - 28, h.y1 - h.y0 - 28); g.setLineDash([]); }
    // The strike pad: a big hazard-striped circle
    { const s = base.strike, R0 = REVO.strike.padR; g.fillStyle = '#2b2f36'; g.beginPath(); g.arc(s.x, s.y, R0, 0, TAU); g.fill(); g.strokeStyle = '#ffb347'; g.lineWidth = 12; g.setLineDash([24, 18]); g.beginPath(); g.arc(s.x, s.y, R0 - 8, 0, TAU); g.stroke(); g.setLineDash([]); }
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.font = '900 40px "Black Ops One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const l of base.labels) g.fillText(l.text, l.x, l.y);
    const tag = (gg, text, p0, col) => { gg.font = '900 22px "Black Ops One", sans-serif'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillStyle = 'rgba(0,0,0,0.55)'; gg.fillRect(p0.x - gg.measureText(text).width / 2 - 8, p0.y - 52, gg.measureText(text).width + 16, 28); gg.fillStyle = col; gg.fillText(text, p0.x, p0.y - 38); };
    for (const st of base.stairs) { paintStairsA(g, st.b, st.face + Math.PI); tag(g, 'UP', st.b, '#ffd166'); }
    base.art = cv;

    // The walkway's art: concrete slabs, battlements along the outside, medical stations, ammo crates and nests
    const [dc, dg] = makeCanvas(Math.ceil(bw * AS), Math.ceil(bh * AS));
    dg.scale(AS, AS); dg.translate(-base.rect.x0, -base.rect.y0);
    // (the roof over the inner part of the ring: slate, not for walking on; the balcony runs along the outside)
    dg.fillStyle = shade(wallCol, -0.35);
    for (const r of base.ring) dg.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    dg.strokeStyle = 'rgba(0,0,0,0.25)'; dg.lineWidth = 3;
    for (const r of base.ring) { const hz = r.x1 - r.x0 > r.y1 - r.y0; for (let q = (hz ? r.x0 : r.y0); q < (hz ? r.x1 : r.y1); q += 36) { dg.beginPath(); hz ? (dg.moveTo(q, r.y0), dg.lineTo(q, r.y1)) : (dg.moveTo(r.x0, q), dg.lineTo(r.x1, q)); dg.stroke(); } }
    // The balcony up on top of the wall: warm sandstone flagstones, quite unlike anything down on the ground
    for (const r of base.decks) {
        dg.fillStyle = '#cdb88f'; dg.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
        const hz = r.x1 - r.x0 > r.y1 - r.y0, A0 = hz ? r.x0 : r.y0, A1 = hz ? r.x1 : r.y1, B0 = hz ? r.y0 : r.x0, B1 = hz ? r.y1 : r.x1;
        for (let b = B0, row = 0; b < B1; b += 42, row++) for (let a = A0 - (row % 2) * 34; a < A1; a += 68) {
            const v = rnd(); dg.fillStyle = `rgba(${v < 0.5 ? '90,70,40' : '255,245,220'},${0.05 + rnd() * 0.12})`;
            const x = hz ? a : b, y = hz ? b : a, w = hz ? 68 : 42, h = hz ? 42 : 68;
            dg.fillRect(x, y, w, h); dg.strokeStyle = 'rgba(70,55,35,0.45)'; dg.lineWidth = 2.5; dg.strokeRect(x, y, w, h);
        }
    }
    // the low wall along the balcony's inside edge, throwing a shadow down onto the roof below
    for (const k of base.deckSides) {
        const S = SIDES[k], ins = k === 'back' || k === 'front' ? 0 : BW;
        const sh = rectS(S, -S.half + ins, BW, S.half - ins, BW + 46); const gr = dg.createLinearGradient(...(() => { const p0 = at(S, 0, BW), p1 = at(S, 0, BW + 46); return [p0.x, p0.y, p1.x, p1.y]; })()); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(sh.x0, sh.y0, sh.x1 - sh.x0, sh.y1 - sh.y0);
        const rr = rectS(S, -S.half + ins, BW - 14, S.half - ins, BW); dg.fillStyle = shade(wallCol, 0.3); dg.fillRect(rr.x0, rr.y0, rr.x1 - rr.x0, rr.y1 - rr.y0);
        const tp = rectS(S, -S.half + ins, BW - 14, S.half - ins, BW - 10); dg.fillStyle = 'rgba(255,255,255,0.3)'; dg.fillRect(tp.x0, tp.y0, tp.x1 - tp.x0, tp.y1 - tp.y0);
    }
    // the battlements round the outside: a thick parapet with merlons standing up off it
    const R0 = base.rect, PT = 26;
    dg.fillStyle = shade(wallCol, 0.05);
    dg.fillRect(R0.x0, R0.y0, R0.x1 - R0.x0, PT); dg.fillRect(R0.x0, R0.y1 - PT, R0.x1 - R0.x0, PT); dg.fillRect(R0.x0, R0.y0, PT, R0.y1 - R0.y0); dg.fillRect(R0.x1 - PT, R0.y0, PT, R0.y1 - R0.y0);
    const merlon = (x, y, w, h) => { dg.fillStyle = 'rgba(0,0,0,0.35)'; dg.fillRect(x + 4, y + 5, w, h); dg.fillStyle = shade(wallCol, 0.35); dg.fillRect(x, y, w, h); dg.fillStyle = 'rgba(255,255,255,0.25)'; dg.fillRect(x, y, w, 3); };
    for (let x = R0.x0 + 6; x < R0.x1 - 30; x += 44) { merlon(x, R0.y0, 26, PT); merlon(x, R0.y1 - PT, 26, PT); }
    for (let y = R0.y0 + 6; y < R0.y1 - 30; y += 44) { merlon(R0.x0, y, PT, 26); merlon(R0.x1 - PT, y, PT, 26); }
    for (const n of base.deckDecor) for (let i = 0; i < 7; i++) { const a = n.face - Math.PI / 2 + (i / 6) * Math.PI; dg.save(); dg.translate(n.x + Math.cos(a) * 34, n.y + Math.sin(a) * 34); dg.rotate(a + Math.PI / 2); dg.fillStyle = i % 2 ? '#a8925f' : '#b9a26c'; roundRect(dg, -11, -6, 22, 12, 5); dg.fill(); dg.restore(); }
    for (const st of base.stairs) { paintStairsA(dg, st.t, st.face + Math.PI, true); tag(dg, 'DOWN', st.t, '#d9c7a3'); }
    base.deckArt = dc;
    return base;
}

// A guard tower's round stone floor (rings and spokes of flagstones)
function towerFloor(gg, tr, col) {
    gg.fillStyle = col; gg.beginPath(); gg.arc(tr.x, tr.y, tr.R, 0, TAU); gg.fill();
    gg.strokeStyle = 'rgba(0,0,0,0.18)'; gg.lineWidth = 3;
    for (let k = 1; k < 4; k++) { gg.beginPath(); gg.arc(tr.x, tr.y, tr.R * k / 4, 0, TAU); gg.stroke(); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; gg.beginPath(); gg.moveTo(tr.x + Math.cos(a) * tr.R / 4, tr.y + Math.sin(a) * tr.R / 4); gg.lineTo(tr.x + Math.cos(a) * tr.R, tr.y + Math.sin(a) * tr.R); gg.stroke(); }
}
// A flight of stairs drawn with its arrow pointing along angle a
function paintStairsA(g, p, a, down = false) {
    // A stone flight seen from above, climbing along angle a: walled sides with a handrail, eleven treads that catch
    // more light the higher they are, each with a bright nosing and a shadow under it. Seen from the top (down), it's
    // a stairwell: the treads fall away into the dark, with a railing round the opening
    const len = 104, wid = 72, n = 11, step = len / n, sw = 9;
    g.save(); g.translate(p.x, p.y); g.rotate(a);
    // shadow the flight casts
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-len / 2 + 6, -wid / 2 + 8, len, wid);
    for (let i = 0; i < n; i++) {
        const x = -len / 2 + i * step, t = i / (n - 1), lit = down ? 1 - t * 0.85 : 0.3 + t * 0.7;
        const c = Math.round(80 + lit * 120), cc = `rgb(${c},${c - 4},${c - 12})`;
        g.fillStyle = cc; g.fillRect(x, -wid / 2 + sw, step + 0.5, wid - sw * 2);
        // riser shadow on the lower side, bright nosing on the upper edge of each tread
        g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x, -wid / 2 + sw, 2.5, wid - sw * 2);
        g.fillStyle = `rgba(255,250,235,${0.15 + lit * 0.35})`; g.fillRect(x + step - 2, -wid / 2 + sw, 2, wid - sw * 2);
        // worn middle of each tread
        g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(x + 1, -wid * 0.18, step - 3, wid * 0.36);
    }
    if (down) { const gr = g.createLinearGradient(len / 2, 0, -len / 2, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = gr; g.fillRect(-len / 2, -wid / 2 + sw, len, wid - sw * 2); }
    // side walls (stringers), lighter on top, and the handrails on posts
    for (const sy of [-1, 1]) {
        const y0 = sy < 0 ? -wid / 2 : wid / 2 - sw;
        g.fillStyle = '#6e6a62'; g.fillRect(-len / 2, y0, len, sw);
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-len / 2, y0, len, 2);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-len / 2, y0 + sw - 2, len, 2);
        g.strokeStyle = '#3b2a1c'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-len / 2 + 4, y0 + sw / 2); g.lineTo(len / 2 - 4, y0 + sw / 2); g.stroke();
        g.fillStyle = '#2a1d13'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(-len / 2 + 8 + k * (len - 16) / 3, y0 + sw / 2, 3, 0, TAU); g.fill(); }
    }
    if (down) {
        // the railing round the stairwell's opening (open on the side you step in from)
        g.strokeStyle = '#3b2a1c'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(len / 2, -wid / 2 - 3); g.lineTo(-len / 2 - 4, -wid / 2 - 3); g.lineTo(-len / 2 - 4, wid / 2 + 3); g.lineTo(len / 2, wid / 2 + 3); g.stroke();
    } else {
        // the top landing where it meets the wall
        g.fillStyle = '#b9b2a4'; g.fillRect(len / 2, -wid / 2, 8, wid);
    }
    g.restore();
}

// A flight of stairs (pointing up toward the deck, or down from it)
function paintStairs(g, p, fwd, top) {
    const a = Math.atan2(fwd.y, fwd.x) + (top ? 0 : Math.PI);
    g.save(); g.translate(p.x, p.y); g.rotate(a);
    g.fillStyle = '#3a3f46'; g.fillRect(-40, -30, 80, 60);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#8a9098' : '#a8aeb6'; g.fillRect(-36 + i * 12, -26, 11, 52); }
    g.fillStyle = '#ffd166'; g.beginPath(); g.moveTo(top ? -24 : 24, 0); g.lineTo(top ? -6 : 6, -12); g.lineTo(top ? -6 : 6, 12); g.closePath(); g.fill();
    g.restore();
}

// A fighter dying: in Revolution that's for good (tickets are always 0, so nobody's queued to come back)
function revoDeath(t, killer, weapon) {
    const R = G.revolution;
    G.teamAlive[t.team]--;
    const back = R.tickets[t.team] > 0;
    if (back) { R.tickets[t.team]--; R.queue.push({ f: t, at: G.time + REVO.respawn }); }
    if (t.isPlayer && G.mode === 'playing') {
        G.killedBy = killer && killer !== t ? killer.name : killer === t ? `your own ${weapon.toLowerCase()}` : null;
        G.timeScale = 0.25; G.flash = 0.5; G.flashColor = '255,40,70';
        Sound.death();
        showBanner('YOU ARE DEAD', true, 'No respawns in Revolution');
    }
    revoCheckEnd();
}

const revoLeft = t => G.teamAlive[t] + G.revolution.tickets[t] + G.revolution.queue.filter(q => q.f.team === t).length;
function revoCheckEnd() {
    if (G.result || G.mode !== 'playing') return;
    const R = G.revolution, out = [0, 1].filter(t => G.teamAlive[t] === 0 && R.tickets[t] === 0 && !R.queue.some(q => q.f.team === t));
    const timeUp = G.time > REVO.timeLimit;
    if (!out.length && !timeUp) return;
    const won = out.length ? !out.includes(G.player.team) : revoLeft(G.player.team) >= revoLeft(1 - G.player.team);
    G.result = { won, place: won ? 1 : 2, killer: G.killedBy, sub: timeUp && !out.length ? `Time's up: ${revoName(0)} ${revoLeft(0)} vs ${revoName(1)} ${revoLeft(1)} left` : null };
    G.overAt = G.time + 2200;
    if (won) startVictory(); else canvas.classList.add('dead');
}

function respawnFighter(f) {
    const base = G.revolution.bases[f.team], r = pick(base.spawns);
    let s = null;
    for (let i = 0; i < 40 && !s; i++) { const x = rand(r.x0 + 26, r.x1 - 26), y = rand(r.y0 + 26, r.y1 - 26); if (!blockedAt(G.world.grid, x, y, 22)) s = { x, y }; }
    s = s || { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 };
    const fresh = createFighter(s.x, s.y, { isPlayer: f.isPlayer, name: f.name, color: f.color, team: f.team });
    // (everything from the last life is reset: on the deck, stunned, frozen, mid-throw, in a car...)
    Object.assign(f, fresh, { downed: false, finishing: false, reviveRegen: false, reviveT: 0, helper: null, up: null, car: null, riding: false, stunUntil: 0, frozenUntil: 0, chill: 0, cook: null, healing: null, hidden: false, post: null, path: null, deckTrip: false, wasHealing: false, deckDuty: undefined, tanker: Math.random() < REVO.tankers, raider: Math.random() < REVO.raiders, kills: f.kills, hp: REVO.hp, maxHp: REVO.hp, protectUntil: G.time + REVO.protect, chasesDrops: f.chasesDrops, likesCars: f.likesCars, nextThink: G.time });
    G.fighters.push(f);
    G.alive++;
    G.teamAlive[f.team]++;
    burst(f.x, f.y, 20, REVO.sides[f.team].flag, 220, 'glow');
    if (f.isPlayer) { canvas.classList.remove('dead'); G.timeScale = 1; G.cam.x = f.x; G.cam.y = f.y; showBanner('BACK IN THE FIGHT', false, 'Grab a gun from the armory chests'); }
}

function updateRevolution(dt) {
    const R = G.revolution;
    // Respawns that are due
    if (R.queue.length) {
        const due = R.queue.filter(q => G.time >= q.at);
        R.queue = R.queue.filter(q => G.time < q.at);
        for (const q of due) respawnFighter(q.f);
    }
    // Chests that have refilled
    if (G.time >= (R.chestCheck || 0)) {
        R.chestCheck = G.time + 1000;
        // (not while the gun it dropped last time is still lying there; leftover odds and ends are cleared away)
        for (const o of R.chests) {
            if (!o.broken || G.time < (o.refillAt || 0)) continue;
            const near = [];
            G.lootGrid.query(o.x, o.y, 140, l => { if (!l.gone) near.push(l); });
            if (near.some(l => WEAPONS[l.key] && G.time - l.born < 60000)) { o.refillAt = G.time + 8000; continue; }
            for (const l of near) l.gone = true;
            o.broken = false; o.hp = o.maxHp; G.world.grid.insertBox(o);
        }
    }
    // Healing rooms patch up your own side; the armory tops up ammo for the guns you carry
    const ammoTick = G.time >= (R.ammoAt || 0);
    if (ammoTick) R.ammoAt = G.time + REVO.ammoEvery;
    for (const f of G.fighters) {
        if (f.dead || f.team === null || f.team > 1) continue;
        const base = R.bases[f.team];
        if (base.fallen || !inRect(f, base.rect)) { if (f.isPlayer) f.wasHealing = false; continue; }
        // Walk into a medical room and you start healing straight away
        const inMed = !f.up && base.heal.some(r => inRect(f, r));
        if (f.hp < f.maxHp && inMed) {
            const before = f.hp;
            f.hp = Math.min(f.maxHp, f.hp + REVO.heal * dt);
            f.healGlow = G.time;
            if (inView(f.x, f.y, 40) && Math.random() < dt * 12) G.particles.push({ type: 'glow', x: f.x + rand(-16, 16), y: f.y + rand(-12, 12), vx: 0, vy: -50, life: 0.7, max: 0.7, size: 6, color: '#5ee08a' });
            if (f.isPlayer) {
                f.healShown = (f.healShown || 0) + (f.hp - before);
                if (f.healShown >= 15 || f.hp >= f.maxHp) { addFloat(f.x, f.y - 36, `+${Math.round(f.healShown)}`, '#5ee08a', false); f.healShown = 0; }
                if (!f.wasHealing) showBanner('HEALING', false, f.up ? 'Medical station' : 'Medical room');
            }
        }
        if (f.isPlayer) f.wasHealing = f.hp < f.maxHp && inMed;
        if (ammoTick && !f.up && base.armory && inRect(f, base.armory)) for (const n of f.inv) if (n && !WEAPONS[n].melee && WEAPONS[n].mag) f.ammo[n] = Math.min((f.ammo[n] || 0) + ammoUnit(WEAPONS[n]), ammoUnit(WEAPONS[n]) * 4);
    }
    updateDeckStairs(dt);
    updateGates(dt);
    updateArtillery();
    // The vehicle bay gets a fresh tank now and then while it has room
    for (const base of R.bases) {
        if (base.fallen || G.time < (base.nextTank || REVO.bayEvery)) continue;
        base.nextTank = G.time + REVO.bayEvery;
        const free = base.bay.find(r => !G.world.cars.some(c => !c.dead && inRect(c, r)) && !blockedAt(G.world.grid, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 50));
        if (free) spawnVehicle(G.early ? 'horse' : 'tank', (free.x0 + free.x1) / 2, (free.y0 + free.y1) / 2, Math.atan2(base.fwd.y, base.fwd.x));
    }
    updateBossStrikes(ammoTick);
    updateCastleGuns();
    if (G.time > REVO.timeLimit) revoCheckEnd();
}

// The boss strike pads: your side's spare ammo goes in (you, by standing on the pad; your bots hand theirs in
// whenever they're home), and at 10000 it's ready to launch on the enemy castle
function updateBossStrikes(ammoTick) {
    const S = REVO.strike, R = G.revolution, p = G.player;
    for (const base of R.bases) {
        const st = base.strike, enemy = R.bases[1 - base.team];
        if (!st || base.fallen) continue;
        if (ammoTick && st.ammo < S.cost) for (const f of G.fighters) {
            if (f.dead || f.team !== base.team || f.car || f.up) continue;
            // (bots hand theirs in at the pad; you load yours by pressing F there)
            if (isHuman(f) || Math.hypot(f.x - st.x, f.y - st.y) > S.padR + 40) continue;
            const got = takeAmmo(f, Math.min(botSpare(f), S.cost - st.ammo), 2);
            if (!got) continue;
            st.ammo = Math.min(S.cost, st.ammo + got);
            f.strikeRun = false;
            if (inView(f.x, f.y, 40)) addFloat(f.x, f.y - 40, `+${got}`, '#ffb347');
        }
        if (st.ammo >= S.cost && !st.fullAt) {
            st.fullAt = G.time;
            if (p && G.mode === 'playing' && p.team === base.team) showBanner('BOSS STRIKE READY', true, 'Stand on the pad in the middle of the courtyard and press F to launch');
        }
        // The other side launches straight away; yours launches it for you if you haven't after a while
        const mine = p && G.mode === 'playing' && p.team === base.team && !p.dead;
        if (st.ammo >= S.cost && !enemy.fallen && (!mine || G.time - st.fullAt > S.botWait)) launchStrike(base);
    }
}

// Launch: 500 shots rain down on the enemy castle over the next 15 seconds. Enough of them are aimed straight
// at its walls to knock down a fifth of what it takes to bring it down, so about five strikes finish it
function launchStrike(base) {
    const S = REVO.strike, R = G.revolution, enemy = R.bases[1 - base.team], st = base.strike;
    st.ammo = 0; st.fullAt = 0; st.launched++;
    const kind = warfareKind(), K = STRIKE_KINDS[kind];
    const need = Math.ceil(Math.ceil(enemy.walls.length * REVO.collapseAt) / S.strikes);
    const standing = enemy.walls.filter(o => !o.broken);
    for (let i = standing.length - 1; i > 0; i--) { const j = randInt(0, i); [standing[i], standing[j]] = [standing[j], standing[i]]; }
    const targets = standing.slice(0, need), every = Math.floor(S.shots / Math.max(1, targets.length));
    R.shells = R.shells || [];
    const r = enemy.rect;
    for (let i = 0; i < S.shots; i++) {
        const at = G.time + S.fall + (i / S.shots) * S.over;
        const wallShot = i % every === 0 && targets.length ? targets.pop() : null;
        const x = wallShot ? wallShot.x : rand(r.x0 - 150, r.x1 + 150), y = wallShot ? wallShot.y : rand(r.y0 - 150, r.y1 + 150);
        R.shells.push({ x, y, at, kind, R: K.R, dmg: K.dmg, owner: base.crew, wall: wallShot });
    }
    const p = G.player;
    // Everyone gets to watch: the camera pulls back over the castle that's being hit (Space or getting hurt brings it back)
    // (only your own team's strike, and only if you're in your castle when it goes off; a strike on your castle
    // is just a warning banner)
    if (p && !p.dead && G.mode === 'playing' && p.team === base.team && (p.up || p.towerUp || inRect(p, base.rect, 100))) G.strikeCam = { x: enemy.c.x, y: enemy.c.y, until: G.time + S.fall + S.over + 1500, base: enemy };
    if (p && G.mode === 'playing') {
        if (p.team === base.team) showBanner('BOSS STRIKE LAUNCHED', false, `${S.shots} ${K.name} raining down on the ${revoName(enemy.team)} castle${G.strikeCam ? ' · Space to stop watching' : ''}`);
        else showBanner('INCOMING BOSS STRIKE!', true, `${S.shots} ${K.name} are about to hit your castle. Take cover!`);
    }
    Sound.tone(90, 1.6, 'sawtooth', 0.14, 40);
}

// Spare ammo: everything for the guns you carry, past `keep` boxes' worth of each
const AMMO_BOX_ROUNDS = 40;  // what an ammo box holds when there's no gun to load it into
function spareAmmo(f, keep = 0) {
    let n = f.ammoBank || 0;
    for (const k of f.inv) { const w = k && WEAPONS[k]; if (w && !w.melee && w.mag && f.ammo[k] !== Infinity) n += Math.max(0, (f.ammo[k] || 0) - ammoUnit(w) * keep); }
    return n;
}
const botSpare = f => spareAmmo(f, 2);
// Take up to n rounds out of someone's ammo (keeping `keep` boxes' worth for each gun); returns how many came out
function takeAmmo(f, n, keep = 0) {
    let got = Math.min(n, f.ammoBank || 0);
    if (got) f.ammoBank -= got;
    for (const k of f.inv) {
        const w = k && WEAPONS[k];
        if (got >= n || !w || w.melee || !w.mag || f.ammo[k] === Infinity) continue;
        const t = Math.min(n - got, Math.max(0, (f.ammo[k] || 0) - ammoUnit(w) * keep));
        f.ammo[k] -= t; got += t;
    }
    return got;
}
const nearOwnPad = p => { const base = G.revolution && G.revolution.bases[p.team], st = base && base.strike; return !!(st && !base.fallen && !p.car && !p.up && !p.dead && Math.hypot(p.x - st.x, p.y - st.y) < REVO.strike.padR + 70); };

// At your castle's pad, F asks how much of your ammo to load into the boss strike
function openStrikeLoad(p) {
    const st = G.revolution.bases[p.team].strike, room = REVO.strike.cost - Math.floor(st.ammo), have = spareAmmo(p);
    $('sl-sub').textContent = `${Math.floor(st.ammo)} / ${REVO.strike.cost} loaded. You have ${have} spare rounds. How many do you want to load?`;
    const box = $('sl-amount');
    box.max = Math.min(have, room); box.value = Math.min(have, room);
    $('strike-load').classList.remove('hidden');
    document.body.classList.remove('playing');
    keys.clear(); mouse.down = false;
    G.mode = 'paused';
    setTimeout(() => { box.focus(); box.select(); }, 0);
}
// A friend at the pad loads all their spare ammo
function loadAllAmmo(p) {
    const st = G.revolution && G.revolution.bases[p.team] && G.revolution.bases[p.team].strike;
    if (!st) return;
    const n = takeAmmo(p, REVO.strike.cost - Math.floor(st.ammo));
    if (!n) return;
    st.ammo = Math.min(REVO.strike.cost, st.ammo + n);
    addFloat(p.x, p.y - 40, `+${n} ammo loaded`, '#ffb347');
}
function closeStrikeLoad(load) {
    const panel = $('strike-load');
    if (!panel || panel.classList.contains('hidden')) return;
    panel.classList.add('hidden');
    $('sl-amount').blur();
    if (!G || G.mode !== 'paused') return;
    G.mode = 'playing';
    document.body.classList.add('playing');
    const p = G.player, st = G.revolution && G.revolution.bases[p.team].strike;
    if (!load || !st || p.dead) return;
    const want = Math.floor(+$('sl-amount').value || 0), n = takeAmmo(p, clamp(want, 0, REVO.strike.cost - Math.floor(st.ammo)));
    if (!n) return;
    st.ammo = Math.min(REVO.strike.cost, st.ammo + n);
    addFloat(p.x, p.y - 40, `+${n} ammo loaded`, '#ffb347');
    Sound.tone(520, 0.12, 'square', 0.07, 700);
}

// The player at their own pad with the strike ready: F launches it
function tryLaunchStrike(p) {
    if (!G.revolution || p.car || p.up || p.dead) return false;
    const base = G.revolution.bases[p.team], st = base && base.strike;
    if (!st || !nearOwnPad(p) || st.ammo < REVO.strike.cost) return false;
    launchStrike(base);
    return true;
}

const CASTLE_AUTO = { range: 2600, miss: 180, slower: 2 };
// The big guns on the castle's corners fire on their own at any enemy in range when nobody's manning them
function updateCastleGuns() {
    for (const c of G.world.cars) {
        if (c.dead || c.type !== 'bigtower' || c.driver || !c.tower || c.tower.fallen || G.time < (c.fireAt || 0)) continue;
        // (left to themselves they're slower, shorter-ranged and rougher than with someone manning them)
        const range = Math.min(c.reach || 2400, CASTLE_AUTO.range), crew = c.tower.crew;
        let best = null, bd = range;
        G.fgrid.query(c.x, c.y, range, f => { if (f.dead || f.hidden || !foe(crew, f)) return; const d = Math.hypot(f.x - c.x, f.y - c.y); if (d < bd) { bd = d; best = f; } });
        if (!best) { c.fireAt = G.time + 600; continue; }
        // (aimed where they'll be when the shell comes down)
        const lead = lobTime(c, bd) / 1000, miss = CASTLE_AUTO.miss * bd / range;
        c.aimAt = { x: best.x + (best.vx || 0) * lead + rand(-miss, miss), y: best.y + (best.vy || 0) * lead + rand(-miss, miss) };
        c.turret = Math.atan2(c.aimAt.y - c.y, c.aimAt.x - c.x);
        vehicleFire(c, crew);
        c.fireAt = G.time + lobArm(c).rate * CASTLE_AUTO.slower;
    }
}

// ----- Castle cannon shots: fired up into the sky, they arc over and come down where you aimed -----
// (a quick, heavy thump at the muzzle, a smoking shell climbing and falling over its shadow, then a big impact)
function lobArm(c) {
    const A = TOWER_ARMS[c.arm], C = vt(c).cannon;
    if (c.arm === 'catapult') return { kind: 'boulder', name: A.name, dmg: A.dmg, R: A.blastR, blast: A.blastDmg, rate: A.rate, muzzle: 100, slow: 1.35 };
    if (c.arm === 'boom') return { kind: 'boom', name: A.name, dmg: A.dmg, R: A.blastR, blast: A.blastDmg, rate: A.rate, muzzle: 372, slow: 1 };
    if (c.arm === 'tesla') return { kind: 'tesla', name: A.name, dmg: A.dmg, R: A.blastR, blast: A.blastDmg, rate: A.rate, muzzle: 124, slow: 0.8, zap: A.zap };
    return { kind: 'ball', name: 'Cannon', dmg: C.dmg, R: C.blastR, blast: C.blastDmg, rate: C.rate, muzzle: 395, slow: 1 };
}
const lobTime = (c, d) => (280 + d * 0.08) * lobArm(c).slow;
function lobShot(c, p) {
    const A = lobArm(c), T = vt(c);
    let tx, ty;
    if (c.aimAt) { tx = c.aimAt.x; ty = c.aimAt.y; c.aimAt = null; }
    else if (isHuman(p)) { const m = inputOf(p).world(); tx = m.x; ty = m.y; }
    else { tx = c.x + Math.cos(c.turret) * 1500; ty = c.y + Math.sin(c.turret) * 1500; }
    // (no further than the gun reaches, and not right on top of itself)
    let d = Math.hypot(tx - c.x, ty - c.y);
    const reach = c.reach || 3000, near = T.len * 0.8, a = Math.atan2(ty - c.y, tx - c.x);
    if (d > reach || d < near) { d = clamp(d, near, reach); tx = c.x + Math.cos(a) * d; ty = c.y + Math.sin(a) * d; }
    c.turret = a;
    const mx = c.x + Math.cos(a) * A.muzzle, my = c.y + Math.sin(a) * A.muzzle;
    c.fireAt = G.time + A.rate; c.firedAt = G.time;
    (G.lobs || (G.lobs = [])).push({ sx: mx, sy: my, tx, ty, t0: G.time, dur: lobTime(c, d), peak: clamp(d * 0.2, 140, 900), A, owner: p, base: c.tower, smokeAt: 0 });
    // The shot: a blinding flash, a ring of smoke blown out of the muzzle, and the whole gun kicks back
    const vol = Sound.volAt(c.x, c.y);
    if (inView(mx, my, 500)) {
        if (A.kind === 'tesla') { burst(mx, my, 18, '#7fe9ff', 420, 'glow'); G.particles.push({ type: 'ring', x: mx, y: my, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 90, color: '#7fe9ff' }); }
        else {
            G.particles.push({ type: 'flash', x: mx, y: my, vx: 0, vy: 0, life: 0.16, max: 0.16, size: A.kind === 'boulder' ? 40 : 150, angle: a });
            if (A.kind !== 'boulder') G.particles.push({ type: 'boom', x: mx + Math.cos(a) * 30, y: my + Math.sin(a) * 30, vx: 0, vy: 0, life: 0.22, max: 0.22, size: 90 });
            for (let i = 0; i < (A.kind === 'boulder' ? 6 : 20); i++) {
                const s = a + rand(-0.9, 0.9), sp = rand(80, 420) * (1 - Math.abs(s - a) * 0.6);
                G.particles.push({ type: 'smoke', x: mx, y: my, vx: Math.cos(s) * sp + Math.cos(a) * 120, vy: Math.sin(s) * sp + Math.sin(a) * 120, life: rand(0.9, 1.8), max: 1.8, size: rand(14, 26), color: '200,195,185' });
            }
            G.particles.push({ type: 'ring', x: mx, y: my, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 110, color: '#fff7ec' });
        }
    }
    if (A.kind === 'tesla') Sound.tone(160, 0.3, 'sawtooth', 0.14 * vol, 1600);
    else if (A.kind === 'boulder') { Sound.thud(vol); Sound.tone(90, 0.25, 'triangle', 0.1 * vol, 60); }
    else { Sound.boom(vol * 0.9, 0.7); Sound.shot('heavy', vol); }
    if (p === G.player) G.shake = Math.max(G.shake, A.kind === 'boulder' ? 4 : 9);
}
function updateLobs() {
    if (!G.lobs || !G.lobs.length) return;
    const keep = [];
    for (const q of G.lobs) {
        const k = (G.time - q.t0) / q.dur;
        if (k < 1) {
            keep.push(q);
            // a trail of smoke behind the shell as it flies (sparks behind a tesla bolt)
            if (G.time >= q.smokeAt) {
                q.smokeAt = G.time + 35;
                const x = lerp(q.sx, q.tx, k), y = lerp(q.sy, q.ty, k) - q.peak * 4 * k * (1 - k);
                if (inView(x, y, 200)) G.particles.push(q.A.kind === 'tesla'
                    ? { type: 'glow', x, y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.3, max: 0.3, size: 10, color: '#7fe9ff' }
                    : { type: 'smoke', x, y, vx: rand(-15, 15), vy: rand(-15, 15), life: 0.7, max: 0.7, size: q.A.kind === 'boulder' ? 6 : 9, color: q.A.kind === 'boom' ? '255,170,90' : '170,165,160' });
            }
            continue;
        }
        lobImpact(q);
    }
    G.lobs = keep;
}
function lobImpact(q) {
    const A = q.A, x = q.tx, y = q.ty;
    blast(x, y, q.owner, A.R, A.blast, A.name);
    // a direct hit hurts most
    G.fgrid.query(x, y, 60, f => { if (!f.dead && Math.hypot(f.x - x, f.y - y) < 50 + f.r && (!q.owner || foe(q.owner, f))) damage(f, A.dmg, q.owner, A.name); });
    if (A.zap) { let near = null, nd = 260; G.fgrid.query(x, y, 260, f => { const d = Math.hypot(f.x - x, f.y - y); if (!f.dead && (!q.owner || foe(q.owner, f)) && d < nd) { nd = d; near = f; } }); if (near) chainLightning(near, q.owner, A.zap, 45, A.name); }
    if (!inView(x, y, 400)) return;
    // Dirt and stones thrown up, a wave of dust rolling out, and the ground shakes
    const dirt = A.kind === 'tesla' ? 0 : A.kind === 'boulder' ? 14 : 26;
    for (let i = 0; i < dirt; i++) { const a = rand(0, TAU), sp = rand(180, 620); G.particles.push({ type: 'chunk', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 1.1), max: 1.1, size: rand(4, 11), color: pick(['#6b5a3a', '#4a3f2a', '#8a7a5a', '#5b5f66']), rot: rand(0, TAU), spin: rand(-14, 14) }); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + rand(-0.2, 0.2), sp = rand(260, 380); G.particles.push({ type: 'smoke', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.7, 1.2), max: 1.2, size: rand(16, 26), color: A.kind === 'tesla' ? '150,220,255' : '150,135,115' }); }
    if (A.kind === 'tesla') { burst(x, y, 26, '#7fe9ff', 460, 'glow'); G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: A.R * 1.4, color: '#7fe9ff' }); }
    G.flash = Math.max(G.flash, A.kind === 'boulder' ? 0.05 : 0.12); G.flashColor = A.kind === 'tesla' ? '127,233,255' : '255,200,120';
    const close = 1 - clamp(Math.hypot(x - G.cam.x, y - G.cam.y) / 2500, 0, 1);
    G.shake = Math.max(G.shake, (A.kind === 'boulder' ? 8 : A.kind === 'boom' ? 18 : 13) * (0.4 + 0.6 * close));
}
// The shells in the air: each one's shadow on the ground, and the shell itself up above it, bigger the higher it is
function drawLobs() {
    if (!G.lobs || !G.lobs.length) return;
    for (const q of G.lobs) {
        const k = clamp((G.time - q.t0) / q.dur, 0, 1), gx = lerp(q.sx, q.tx, k), gy = lerp(q.sy, q.ty, k), h = q.peak * 4 * k * (1 - k);
        if (!inView(gx, gy - h, 120)) continue;
        const s = 1 + h / 500;
        ctx.fillStyle = `rgba(0,0,0,${0.18 + 0.2 * (1 - h / q.peak)})`; ctx.beginPath(); ctx.ellipse(gx + h * 0.15, gy, 12 * s, 7 * s, 0, 0, TAU); ctx.fill();
        // (and a ring on the ground where it's going to land, tightening as it comes down)
        if (k > 0.45) { ctx.strokeStyle = `rgba(255,90,60,${(k - 0.45) * 1.2})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(q.tx, q.ty, q.A.R * (1.25 - k * 0.5), 0, TAU); ctx.stroke(); }
        const x = gx, y = gy - h;
        if (q.A.kind === 'tesla') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(127,233,255,0.45)'; ctx.beginPath(); ctx.arc(x, y, 22 * s, 0, TAU); ctx.fill();
            ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.arc(x, y, 9 * s, 0, TAU); ctx.fill();
            ctx.restore();
        } else if (q.A.kind === 'boulder') {
            ctx.fillStyle = '#7d7468'; ctx.beginPath(); ctx.arc(x, y, 15 * s, 0, TAU); ctx.fill();
            ctx.fillStyle = '#9a9083'; ctx.beginPath(); ctx.arc(x - 5 * s, y - 5 * s, 6 * s, 0, TAU); ctx.fill();
        } else {
            const r = (q.A.kind === 'boom' ? 13 : 10) * s;
            ctx.fillStyle = '#16181c'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
            ctx.fillStyle = '#4a4f58'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.4, 0, TAU); ctx.fill();
            if (q.A.kind === 'boom') { ctx.fillStyle = `rgba(255,${150 + Math.sin(G.time / 40) * 60},60,0.95)`; ctx.beginPath(); ctx.arc(x + r * 0.6, y - r * 0.6, 4 * s, 0, TAU); ctx.fill(); }
        }
    }
}

// Base gates: they slide open when anyone (or any vehicle) comes near and shut again once the way is clear
function updateGates(dt) {
    for (const base of G.revolution.bases) {
        if (base.fallen) continue;
        for (const g of base.gates) {
            let near = false;
            G.fgrid.query(g.x, g.y, 170, f => { if (!near && !f.dead && !f.up && Math.hypot(f.x - g.x, f.y - g.y) < 170) near = true; });
            if (!near) for (const c of G.world.cars) if (!c.dead && c.driver && Math.hypot(c.x - g.x, c.y - g.y) < 260) { near = true; break; }
            const was = g.open;
            g.open = clamp(g.open + (near ? 1 : -1) * dt * 2.2, 0, 1);
            if (g.shut && g.open > 0.35) { g.shut = false; G.world.grid.removeBox(g); }
            else if (!g.shut && g.open < 0.35) {
                // Never shut on someone standing in the gateway
                let blocked = false;
                G.fgrid.query(g.x, g.y, Math.max(g.hw, g.hh) + 30, f => { if (!f.dead && !f.up && Math.abs(f.x - g.x) < g.hw + f.r && Math.abs(f.y - g.y) < g.hh + f.r) blocked = true; });
                for (const c of G.world.cars) if (!c.dead && Math.abs(c.x - g.x) < g.hw + 40 && Math.abs(c.y - g.y) < g.hh + 40) blocked = true;
                if (blocked) g.open = 0.36; else { g.shut = true; G.world.grid.insertBox(g); }
            }
            if (inView(g.x, g.y, 300) && (was === 0) !== (g.open === 0)) Sound.tone(90, 0.4, 'sawtooth', 0.04 * Sound.volAt(g.x, g.y), 70);
        }
    }
}

// Two steel leaves that slide apart into the wall, hazard-striped, with the team colour along the edge
function drawGates() {
    for (const base of G.revolution.bases) {
        if (base.fallen) continue;
        for (const g of base.gates) {
            if (!inView(g.x, g.y, 200)) continue;
            const leaf = (1 - g.open) * 0.5, L = (g.horiz ? g.hw : g.hh) * 2, Wt = (g.horiz ? g.hh : g.hw) * 2;
            ctx.save(); ctx.translate(g.x, g.y); if (!g.horiz) ctx.rotate(Math.PI / 2);
            for (const s of [-1, 1]) {
                const w = L * leaf, x0 = s < 0 ? -L / 2 : L / 2 - w;
                if (w < 1) continue;
                ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x0 + 4, -Wt / 2 + 5, w, Wt);
                ctx.fillStyle = '#3a3f46'; ctx.fillRect(x0, -Wt / 2, w, Wt);
                ctx.save(); ctx.beginPath(); ctx.rect(x0, -Wt / 2, w, Wt); ctx.clip();
                ctx.fillStyle = '#ffc23d'; for (let k = -Wt; k < L; k += 16) { ctx.beginPath(); ctx.moveTo(x0 + k, -Wt / 2); ctx.lineTo(x0 + k + 8, -Wt / 2); ctx.lineTo(x0 + k + 8 + Wt, Wt / 2); ctx.lineTo(x0 + k + Wt, Wt / 2); ctx.fill(); }
                ctx.restore();
                ctx.fillStyle = REVO.sides[base.team].flag; ctx.fillRect(s < 0 ? x0 + w - 4 : x0, -Wt / 2, 4, Wt);
            }
            ctx.restore();
        }
    }
}

// Stand on the stairs for a moment to go up to a base's deck, or back down to the yard (either side can use them)
// Stairs between the castle's floors: each flight goes from the floor below (lvl.lower: null = the ground) up to lvl
const FLOOR_NAME = ['GROUND FLOOR', 'MIDDLE FLOOR', 'BALCONY'];
const floorOf = f => !f.up ? 0 : f.up.midFloor ? 1 : 2;
function updateDeckStairs(dt) {
    for (const f of G.fighters) {
        if (f.dead || f.car) continue;
        let on = null, goingUp = false, lvl = null;
        for (const b of G.revolution.bases) {
            if (b.fallen) continue;
            for (const L of [b]) for (const st of L.stairs) {
                // (bots only climb when they mean to: you go up whenever you stand on the stairs)
                if ((f.up || null) === L.lower && (isHuman(f) || f.deckTrip) && Math.hypot(f.x - st.b.x, f.y - st.b.y) < 30) { on = st; goingUp = true; lvl = L; }
                else if (f.up === L && Math.hypot(f.x - st.t.x, f.y - st.t.y) < 30) { on = st; lvl = L; }
            }
        }
        if (!on || G.time < (f.stairCool || 0)) { f.stairT = 0; continue; }
        f.stairT = (f.stairT || 0) + dt;
        if (f.stairT < 0.45) continue;
        f.stairT = 0; f.stairCool = G.time + 900;
        f.up = goingUp ? lvl : lvl.lower;
        const to = goingUp ? on.up : on.down;
        f.x = to.x; f.y = to.y; f.vx = f.vy = 0; f.path = null;
        const top = f.up && !f.up.midFloor;
        if (!isHuman(f)) { f.nextThink = G.time; if (top) f.deckUntil = G.time + rand(60000, 120000); if (top && f.deckTrip) { f.deckTrip = false; f.mode = 'wander'; } if (!goingUp) { f.deckDuty = false; f.deckTrip = false; f.post = null; } }
        if (f.isPlayer) {
            const n = floorOf(f);
            showBanner(FLOOR_NAME[n], false, n === 2 ? 'Up on the balcony: look out over the walls and shoot. The big guns are on the corners' : 'Back down on the ground');
            Sound.tone(goingUp ? 330 : 220, 0.2, 'triangle', 0.08, goingUp ? 440 : 165);
        }
    }
}

// The castle's balcony, drawn over the ground-floor rooms with whoever's up there. You only see your own floor:
// under the roof the balcony disappears, and on the ground in a castle you don't see who's up on its balcony
// (from the balcony, the roof hides who's in the rooms below)
function drawDecks(L, T, R, B) {
    const p = G.player, inView4 = f => f.x > L - 80 && f.x < R + 80 && f.y > T - 80 && f.y < B + 80;
    const hideUp = new Set();
    for (const base of G.revolution.bases) {
        if (base.fallen) continue;
        const r0 = base.rect;
        if (r0.x1 < L || r0.x0 > R || r0.y1 < T || r0.y0 > B) continue;
        const gunner = p && !p.dead && p.car && p.car.type === 'bigtower' && p.car.tower === base;
        const me = gunner || (p && !p.dead && p.up === base) ? 2 : p && !p.dead && !p.up && !p.car && underRing(base, p) ? 0 : -1;
        if (p && !p.dead && !p.up && !gunner && inRect(p, r0, 60)) hideUp.add(base);
        // Under the roof: a dark ceiling shadow, and the balcony above is gone
        base.deckAlpha = lerp(base.deckAlpha ?? 1, me === 0 ? 0 : 1, 0.2);
        if (me === 0) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; for (const d of base.ring) ctx.fillRect(d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0); }
        if (base.deckAlpha < 0.02) continue;
        ctx.globalAlpha = base.deckAlpha;
        // (a shadow into the courtyard: the ring stands tall)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (const d of base.ring) ctx.fillRect(d.x0 + 30, d.y0 + 40, d.x1 - d.x0, d.y1 - d.y0);
        ctx.drawImage(base.deckArt, r0.x0, r0.y0, r0.x1 - r0.x0, r0.y1 - r0.y0);
        ctx.globalAlpha = 1;
        // The big guns on the balcony's corners (the one you're manning goes see-through so it doesn't hide the view)
        for (const c of G.world.cars) if (c.tower === base && c.type === 'bigtower' && !c.dead) { ctx.globalAlpha = c === (p && p.car) ? 0.25 : base.deckAlpha; drawCars(c); ctx.globalAlpha = 1; }
    }
    const up = G.fighters.filter(f => f.up && !hideUp.has(f.up) && !f.dead && !f.car && inView4(f));
    for (const f of up) drawFighter(f);
    for (const f of up) { drawShieldBubble(f); drawStun(f); drawFrozen(f); }
}

// A bot up on a deck: hold a spot along the front edge and shoot over the walls; go to the medical station when
// hurt, and head down when out of guns
function deckBotPlan(b, enemy, bestD) {
    const base = b.up;
    // Off the other side's deck, off your own when your watch is over (or if you're needed in a tank)
    const leave = base.team !== b.team || G.time > (b.deckUntil || 0) || b.tanker;
    if (leave && (!enemy || bestD > 300)) { const st = base.stairs.reduce((p, s) => (dist(b, s.t) < dist(b, p.t) ? s : p), base.stairs[0]); if (b.mode !== 'zone' || b.goal !== st.t) { b.mode = 'zone'; b.goal = st.t; } return true; }
    if (!b.inv.some(Boolean)) { const st = base.stairs.reduce((p, s) => (dist(b, s.t) < dist(b, p.t) ? s : p), base.stairs[0]); b.mode = 'zone'; b.goal = st.t; return true; }
    // (hurt: down the stairs to a medical room)
    if (base.team === b.team && b.hp < b.maxHp * 0.5 && (!enemy || bestD > 400)) { const st = base.stairs.reduce((p, s) => (dist(b, s.t) < dist(b, p.t) ? s : p), base.stairs[0]); if (b.mode !== 'zone' || b.goal !== st.t) { b.mode = 'zone'; b.goal = st.t; } return true; }
    if (enemy) return false;
    // (a post on the strip you're on, or the front one: that's where the enemy comes from)
    if (!b.post || !onDeck(base, b.post)) { const mine = deckStrips(base, b), opts = base.deckDecor.filter(n => mine.includes(n.strip) || n.strip === 1); const n = pick(opts.length ? opts : base.deckDecor); b.post = { x: n.x - Math.cos(n.face) * 30 + rand(-20, 20), y: n.y - Math.sin(n.face) * 30 + rand(-20, 20), face: n.face }; }
    if (dist(b, b.post) < 24) { b.mode = 'rest'; b.angle = b.post.face ?? Math.atan2(base.fwd.y, base.fwd.x); return true; }
    if (b.mode !== 'zone' || b.goal !== b.post) { b.mode = 'zone'; b.goal = b.post; }
    return true;
}

// Bots on a Revolution side: hurt ones go home to heal, and anyone without a gun heads for the armory chests
function revoBotPlan(b, enemy, bestD) {
    const R = G.revolution, base = R.bases[b.team];
    if (b.up) return deckBotPlan(b, enemy, bestD);
    // Tank crews make for the nearest free tank and fight from it until it's knocked out
    if (b.tanker === undefined) b.tanker = Math.random() < REVO.tankers;
    if (b.tanker && !b.car && (!enemy || bestD > 350) && G.time > (b.carCool || 0) - 6000) {
        let best = null, bd = 3000;
        for (const c of G.world.cars) if (!c.dead && !c.driver && (c.type === 'tank' || c.type === 'hovertank')) { const d = dist(b, c); if (d < bd) { bd = d; best = c; } }
        if (best) { if (b.mode !== 'tocar' || b.goal !== best) { b.mode = 'tocar'; b.goal = best; } return true; }
    }
    if (!base || base.fallen) return false;
    // Some defenders take a post up on the deck when things are quiet near home
    if (b.deckDuty === undefined) b.deckDuty = !b.raider && !b.tanker && Math.random() < 0.25;
    // (no more than five on a deck at once)
    if (b.deckDuty && G.fighters.filter(f => f.up === base && f.team === b.team).length >= 5) b.deckDuty = false;
    if (b.deckDuty && !enemy && b.inv.some(Boolean) && b.hp > b.maxHp * 0.6 && inRect(b, base.rect, 400)) {
        const st = base.stairs.reduce((p, s) => (dist(b, s.b) < dist(b, p.b) ? s : p), base.stairs[0]);
        if (b.mode !== 'zone' || b.goal !== st.b) { b.mode = 'zone'; b.goal = st.b; }
        b.deckTrip = true;
        return true;
    }
    // Everyone's eager to fill the boss strike: spare ammo goes straight to the pad when it's quiet, and the
    // haulers among them keep fetching more from the armory (it tops up your ammo) to bring it over
    const st = base.strike;
    if (st && st.ammo < REVO.strike.cost && !b.raider && !b.tanker && (!enemy || bestD > 600) && b.inv.some(n => n && WEAPONS[n] && !WEAPONS[n].melee)) {
        if (b.hauler === undefined) b.hauler = Math.random() < 0.5;
        const spare = botSpare(b);
        if (spare >= (b.hauler ? 30 : 60) || (b.strikeRun && spare > 0)) {
            b.strikeRun = true;
            const g = { x: st.x + rand(-40, 40), y: st.y + rand(-40, 40) };
            if (b.mode !== 'zone' || !b.goal || Math.hypot(b.goal.x - st.x, b.goal.y - st.y) > 80) { b.mode = 'zone'; b.goal = g; }
            return true;
        }
        if (b.hauler && base.armory && inRect(b, base.rect, 300)) {
            if (inRect(b, base.armory)) { b.mode = 'rest'; return true; }
            const g = { x: (base.armory.x0 + base.armory.x1) / 2, y: (base.armory.y0 + base.armory.y1) / 2 };
            if (b.mode !== 'zone' || !b.goal || Math.hypot(b.goal.x - g.x, b.goal.y - g.y) > 10) { b.mode = 'zone'; b.goal = g; }
            return true;
        }
    }
    const healing = base.heal.find(r => inRect(b, r));
    if (healing && b.hp < b.maxHp * 0.95 && (!enemy || bestD > 450)) { b.mode = 'rest'; return true; }
    if (b.hp < b.maxHp * 0.4 && (!enemy || bestD > 500)) {
        const r = base.heal.reduce((a, c) => (dist(b, { x: (a.x0 + a.x1) / 2, y: (a.y0 + a.y1) / 2 }) < dist(b, { x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 }) ? a : c));
        const g = { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 };
        if (b.mode !== 'zone' || !b.goal || Math.hypot(b.goal.x - g.x, b.goal.y - g.y) > 10) { b.mode = 'zone'; b.goal = g; }
        return true;
    }
    if (!b.inv.some(Boolean) && !enemy) {
        let best = null, bd = Infinity;
        for (const o of R.chests) if (!o.broken && !o.on && o.armory && inRect(o, base.rect) && crateTakers(o, b) < 2) { const d = dist(b, o); if (d < bd) { bd = d; best = o; } }
        if (best && bd > 200) { b.mode = 'box'; b.goal = claimBox(best, b); return true; }
    }
    return false;
}

// A section of base wall taking a hit (your own side can't knock its walls down)
function damageBaseWall(o, dmg, attacker) {
    const base = o.base;
    if (o.broken || base.fallen || (attacker && attacker.team === base.team)) return;
    o.hp -= dmg;
    o.hitAt = G.time;
    if (o.hp > 0) return;
    breakBaseWall(o);
    base.down++;
    const p = G.player;
    if (base.down >= Math.ceil(base.walls.length * REVO.collapseAt)) collapseBase(base);
    else if (p && G.mode === 'playing' && base.down % 3 === 1) showBanner(base.team === p.team ? 'YOUR BASE IS UNDER ATTACK' : `${revoName(base.team).toUpperCase()} WALL DOWN`, base.team === p.team, `${Math.round(baseHealth(base) * 100)}% of the base still standing`);
}

// Gone: the wall caves in as a scatter of concrete chunks, rebar and twisted metal on the ground
function breakBaseWall(o) {
    o.broken = true;
    G.world.grid.removeBox(o);
    const i = G.world.obstacles.indexOf(o);
    if (i >= 0) G.world.obstacles.splice(i, 1);
    const len = Math.max(o.hw, o.hh) * 2;
    for (let k = 0; k < len / 14; k++) addDecal({ kind: 'debris', x: o.x + rand(-o.hw - 20, o.hw + 20), y: o.y + rand(-o.hh - 20, o.hh + 20), r: rand(8, 22), a: rand(0, TAU), m: Math.random() < 0.3 ? 'wood' : 'metal', s: randInt(0, 3), seed: randInt(1, 1e9), life: 1e12 });
    if (inView(o.x, o.y, len)) for (let k = 0; k < 24; k++) { const a = rand(0, TAU), sp = rand(80, 360); G.particles.push({ type: 'chunk', x: o.x + rand(-o.hw, o.hw), y: o.y + rand(-o.hh, o.hh), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.6, 1.2), max: 1.2, size: rand(4, 10), color: pick([o.color, shade(o.color, -0.3), '#6b7178']), rot: rand(0, TAU), spin: rand(-12, 12) }); }
    Sound.crunch(Sound.volAt(o.x, o.y));
}

// How much of the base is left before it falls (1 = untouched, 0 = coming down)
const baseHealth = base => base.fallen ? 0 : clamp(1 - base.down / Math.ceil(base.walls.length * REVO.collapseAt), 0, 1);

// The base falls: every wall and room caves in, the armory's guns and supplies spill out for anyone to take,
// and that side has no more healing or armory. Whoever's still alive fights on to the end.
function collapseBase(base) {
    const R = G.revolution, B = REVO.base;
    base.fallen = true;
    for (const o of base.walls) if (!o.broken) breakBaseWall(o);
    for (const g of base.gates) { if (g.shut) G.world.grid.removeBox(g); g.shut = false; g.open = 1; const i = G.world.obstacles.indexOf(g); if (i >= 0) G.world.obstacles.splice(i, 1); }
    // The furniture goes down with it, into wreckage
    for (const o of G.world.obstacles.filter(o => o.house === base)) {
        G.world.grid.removeBox(o); o.broken = true;
        const w = makeWreck(o.x + rand(-20, 20), o.y + rand(-20, 20));
        if (!blockedAt(G.world.grid, w.x, w.y, 30)) { G.world.grid.insertBox(w); G.world.obstacles.push(w); }
    }
    G.world.obstacles = G.world.obstacles.filter(o => o.house !== base);
    // Supplies spill out: every armory chest bursts, and the stores go with them
    for (const o of R.chests) {
        if (!o.armory || !inRect(o, base.rect)) continue;
        if (!o.broken) { o.broken = true; G.world.grid.removeBox(o); dropItems(o.x, o.y, chestItems(o)); }
        o.refillAt = Infinity;
    }
    const mid = { x: (base.rect.x0 + base.rect.x1) / 2, y: (base.rect.y0 + base.rect.y1) / 2 };
    const stores = [];
    for (let i = 0; i < 10; i++) stores.push(gunFrom(WAR_GUN_TABLE));
    stores.push('ammo', 'ammo', 'ammo', 'ammo', 'armor', 'armor', 'medkit', 'medkit', { key: 'bandage', count: 4 }, { key: 'grenade', count: 3 });
    dropItems(mid.x, mid.y, stores, 1.6);
    base.heal = [];
    for (const f of G.fighters) if (f.up === base && !f.dead) { f.up = null; damage(f, 60, null, 'Collapse'); }
    R.tickets[base.team] = 0;
    R.queue = R.queue.filter(q => q.f.team !== base.team);
    if (inView(mid.x, mid.y, 800)) for (let i = 0; i < 60; i++) { const a = rand(0, TAU), sp = rand(100, 450); G.particles.push({ type: 'chunk', x: mid.x + rand(-B.width / 3, B.width / 3), y: mid.y + rand(-B.depth / 3, B.depth / 3), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.7, 1.4), max: 1.4, size: rand(5, 12), color: pick(WRECK.metal.concat(WRECK.wood)), rot: rand(0, TAU), spin: rand(-12, 12) }); }
    Sound.boom(Sound.volAt(mid.x, mid.y), 2.6);
    Sound.thud(Sound.volAt(mid.x, mid.y));
    const p = G.player;
    if (p && G.mode === 'playing') {
        if (base.team === p.team) showBanner('YOUR BASE HAS FALLEN', true, 'No more healing or armory. Fight on to the last!');
        else showBanner(`THE ${revoName(base.team).toUpperCase()} BASE HAS FALLEN`, true, 'Their supplies are spilled for the taking. Finish them!');
    }
    revoCheckEnd();
}

// The nearest standing section of the other side's base wall within range
function nearestEnemyWall(b, range) {
    let best = null, bd = range;
    for (const base of G.revolution.bases) {
        if (base.team === b.team || base.fallen || Math.hypot(base.c.x - b.x, base.c.y - b.y) > range + Math.hypot(REVO.base.depth, REVO.base.width) / 2) continue;
        for (const o of base.walls) {
            if (o.broken) continue;
            const nx = clamp(b.x, o.x - o.hw, o.x + o.hw), ny = clamp(b.y, o.y - o.hh, o.y + o.hh), d = Math.hypot(nx - b.x, ny - b.y);
            if (d < bd) { bd = d; best = { o, x: nx, y: ny, d }; }
        }
    }
    return best;
}

function drawBases(L, T, R, B) {
    for (const base of G.revolution.bases) {
        const r = base.rect;
        if (r.x1 < L || r.x0 > R || r.y1 < T || r.y0 > B) continue;
        ctx.drawImage(base.art, r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
        if (base.fallen) { ctx.fillStyle = 'rgba(30,26,22,0.45)'; ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0); continue; }
        // Healing rooms glow softly
        const pulse = 0.08 + Math.sin(G.time / 400) * 0.03;
        ctx.fillStyle = `rgba(94,224,138,${pulse})`;
        for (const h of base.heal) ctx.fillRect(h.x0, h.y0, h.x1 - h.x0, h.y1 - h.y0);
        // The boss strike pad: how full it is, round the edge
        const st = base.strike;
        if (st && inView(st.x, st.y, 200)) {
            const k = st.ammo / REVO.strike.cost, ready = k >= 1, R0 = REVO.strike.padR;
            ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(st.x, st.y, R0 + 14, 0, TAU); ctx.stroke();
            ctx.strokeStyle = ready ? `rgba(255,90,95,${0.7 + Math.sin(G.time / 150) * 0.3})` : '#ffb347';
            ctx.beginPath(); ctx.arc(st.x, st.y, R0 + 14, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(k, 0, 1)); ctx.stroke();
            ctx.fillStyle = '#fff7ec'; ctx.font = '900 22px "Black Ops One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(ready ? 'READY' : 'BOSS STRIKE', st.x, st.y - 12);
            ctx.font = '700 18px Rajdhani, sans-serif'; ctx.fillText(`${Math.floor(st.ammo)} / ${REVO.strike.cost}`, st.x, st.y + 14);
        }
    }
}

function drawBaseFlags() {
    for (const base of G.revolution.bases) {
        const f = base.flag;
        if (!inView(f.x, f.y, 120)) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(f.x + 6, f.y + 8, 10, 6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d0d4da'; ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, TAU); ctx.fill();
        const wave = Math.sin(G.time / 180) * 6;
        ctx.fillStyle = REVO.sides[base.team].flag;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + 54, f.y - 14 + wave * 0.4); ctx.lineTo(f.x + 50 + wave * 0.3, f.y + 18); ctx.lineTo(f.x, f.y + 28); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '700 11px Rajdhani, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(revoName(base.team).toUpperCase(), f.x + 6, f.y + 8);
    }
}

// A treasure chest: dark wood with iron bands and a brass lock (the armory's are olive green)
function drawChest(o) {
    const hit = clamp(1 - (G.time - o.hitAt) / 220, 0, 1), wob = hit * Math.sin(G.time * 0.09) * 0.1;
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(wob);
    const w = o.hw * 2, h = o.hh * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-w / 2 + 4, -h / 2 + 6, w, h);
    const wood = o.armory ? '#4f5d33' : '#7a4a24', dark = o.armory ? '#323b20' : '#4a2c14';
    ctx.fillStyle = dark; roundRect(ctx, -w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 5); ctx.fill();
    ctx.fillStyle = wood; roundRect(ctx, -w / 2, -h / 2, w, h, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h * 0.35);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(-w / 2 + 2, -h / 2 + (h * i) / 4); ctx.lineTo(w / 2 - 2, -h / 2 + (h * i) / 4); } ctx.stroke();
    ctx.fillStyle = '#5a5f66'; ctx.fillRect(-w / 2 + 6, -h / 2, 4, h); ctx.fillRect(w / 2 - 10, -h / 2, 4, h); ctx.fillRect(-w / 2, -1.5, w, 3);
    ctx.fillStyle = '#e0b84a'; ctx.fillRect(-4, -4, 8, 8); ctx.fillStyle = '#7a5a1a'; ctx.fillRect(-1, -2, 2, 4);
    ctx.restore();
    if (o.hp < o.maxHp) drawPlantHealth(o, o.y - o.hh - 12);
}

// ---------- Floor art ----------
// The whole floor (finishes, walls, furniture, lighting) is painted once into a canvas; only loot, boxes and people
// are drawn live on top. The canvas is dropped when you leave and repainted (identically) if you come back.
function bakeFloor(F, obstacles) {
    const R = F.R, M = FLOOR.margin;
    const [c, g] = makeCanvas(Math.ceil(R.w + M * 2), Math.ceil(R.h + M * 2));
    const rnd = seededRand(F.seed);
    g.translate(M - R.x0, M - R.y0);
    // Drop shadow of the building onto the void
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(R.x0 + 26, R.y0 + 34, R.w, R.h);
    for (const r of F.regions) paintFinish(g, r, r.floor, rnd);
    // The rusty facility: water stains, cracked concrete and rubble everywhere
    if (F.b.rusty && !F.roof) {
        for (let i = 0; i < (R.w * R.h) / 9000; i++) {
            const x = R.x0 + rnd() * R.w, y = R.y0 + rnd() * R.h, r = 20 + rnd() * 70, gr = g.createRadialGradient(x, y, 0, x, y, r);
            gr.addColorStop(0, rnd() < 0.5 ? 'rgba(50,35,20,0.35)' : 'rgba(110,60,25,0.25)'); gr.addColorStop(1, 'rgba(50,35,20,0)');
            g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        g.strokeStyle = 'rgba(20,16,12,0.45)'; g.lineWidth = 1.5;
        for (let i = 0; i < (R.w * R.h) / 25000; i++) {
            let x = R.x0 + rnd() * R.w, y = R.y0 + rnd() * R.h, a = rnd() * TAU;
            g.beginPath(); g.moveTo(x, y);
            for (let k = 0; k < 5; k++) { a += (rnd() - 0.5) * 1.4; x += Math.cos(a) * (12 + rnd() * 20); y += Math.sin(a) * (12 + rnd() * 20); g.lineTo(x, y); }
            g.stroke();
        }
        for (let i = 0; i < (R.w * R.h) / 6000; i++) { g.fillStyle = ['#6a645c', '#4a453f', '#8a847a', '#7a5a3a'][i % 4]; g.fillRect(R.x0 + rnd() * R.w, R.y0 + rnd() * R.h, 2 + rnd() * 6, 2 + rnd() * 4); }
    }
    for (const d of F.decor) if (d.d === 'tiles' || d.d === 'rug' || d.d === 'hazard' || d.d === 'puddle' || d.d === 'floortext' || d.d === 'surglamp' || d.d === 'cables' || d.d === 'oil' || d.d === 'papers') paintDecor(g, d, rnd);
    if (F.heli) paintHelipad(g, F.heli.x, F.heli.y);
    // Furniture first (with soft shadows), then walls on top so they read as tall
    for (const o of obstacles) if (o.furn) o.broken ? paintDebris(g, o) : paintFurniture(g, o, seededRand(o.seed || 1));
    for (const d of F.decor) if (!(d.d === 'tiles' || d.d === 'rug' || d.d === 'hazard' || d.d === 'puddle' || d.d === 'floortext' || d.d === 'surglamp' || d.d === 'cables' || d.d === 'oil' || d.d === 'papers')) paintDecor(g, d, rnd);
    for (const o of obstacles) if (o.type === 'wall') { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(o.x - o.hw + 5, o.y - o.hh + 7, o.hw * 2, o.hh * 2); }
    for (const o of obstacles) if (o.type === 'wall') paintWall(g, o);
    // Lighting: dim the whole floor, then pools of light from the ceiling and the windows
    g.fillStyle = F.roof ? 'rgba(20,24,40,0.12)' : 'rgba(12,8,24,0.32)';
    g.fillRect(R.x0, R.y0, R.w, R.h);
    g.globalCompositeOperation = 'lighter';
    for (const l of F.lights) {
        const grad = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
        grad.addColorStop(0, F.roof ? 'rgba(255,200,120,0.14)' : 'rgba(255,236,200,0.2)');
        grad.addColorStop(1, 'rgba(255,236,200,0)');
        g.fillStyle = grad;
        g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    if (!F.roof) {
        const T = FLOOR.wall, s = 90;
        for (const [x0, y0, x1, y1, dx, dy] of [[R.x0, R.y0 + T, R.x1, R.y0 + T, 0, 1], [R.x0, R.y1 - T, R.x1, R.y1 - T, 0, -1], [R.x0 + T, R.y0, R.x0 + T, R.y1, 1, 0], [R.x1 - T, R.y0, R.x1 - T, R.y1, -1, 0]]) {
            const grad = g.createLinearGradient(x0, y0, x0 + dx * s, y0 + dy * s);
            grad.addColorStop(0, 'rgba(150,190,255,0.12)');
            grad.addColorStop(1, 'rgba(150,190,255,0)');
            g.fillStyle = grad;
            g.fillRect(Math.min(x0, x0 + dx * s), Math.min(y0, y0 + dy * s), dx ? s : x1 - x0, dy ? s : y1 - y0);
        }
    }
    g.globalCompositeOperation = 'source-over';
    return c;
}

function paintFinish(g, r, kind, rnd) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0;
    const grid = (size, color, lw = 1) => {
        g.strokeStyle = color; g.lineWidth = lw; g.beginPath();
        for (let x = r.x0 + size; x < r.x1; x += size) { g.moveTo(x, r.y0); g.lineTo(x, r.y1); }
        for (let y = r.y0 + size; y < r.y1; y += size) { g.moveTo(r.x0, y); g.lineTo(r.x1, y); }
        g.stroke();
    };
    const speckle = (n, color, size) => { g.fillStyle = color; for (let i = 0; i < n; i++) g.fillRect(r.x0 + rnd() * w, r.y0 + rnd() * h, size, size); };
    const area = (w * h) / 10000;
    switch (kind) {
        case 'carpet':
            g.fillStyle = '#b8a587'; g.fillRect(r.x0, r.y0, w, h);
            speckle(area * 40, 'rgba(90,70,40,0.12)', 3); speckle(area * 30, 'rgba(255,255,255,0.06)', 2);
            break;
        case 'runner': {
            g.fillStyle = '#6e1f26'; g.fillRect(r.x0, r.y0, w, h);
            g.strokeStyle = 'rgba(214,170,90,0.5)'; g.lineWidth = 3;
            g.strokeRect(r.x0 + 14, r.y0 + 14, w - 28, h - 28);
            g.fillStyle = 'rgba(214,170,90,0.28)';
            for (let x = r.x0 + 40; x < r.x1 - 20; x += 40) for (let y = r.y0 + 40; y < r.y1 - 20; y += 40) {
                g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 7, y); g.lineTo(x, y + 7); g.lineTo(x - 7, y); g.fill();
            }
            break;
        }
        case 'marble':
            g.fillStyle = '#e4ddd2'; g.fillRect(r.x0, r.y0, w, h);
            grid(80, 'rgba(120,110,100,0.22)', 1.5);
            g.strokeStyle = 'rgba(150,140,130,0.18)'; g.lineWidth = 1;
            for (let i = 0; i < area * 3; i++) { const x = r.x0 + rnd() * w, y = r.y0 + rnd() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rnd() * 40, y + rnd() * 20, x + rnd() * 70, y + rnd() * 30); g.stroke(); }
            break;
        case 'lino':
            g.fillStyle = '#c9d3cd'; g.fillRect(r.x0, r.y0, w, h);
            grid(40, 'rgba(90,110,100,0.18)');
            speckle(area * 50, 'rgba(60,80,70,0.15)', 2);
            break;
        case 'surgery':
            g.fillStyle = '#9cc7c1'; g.fillRect(r.x0, r.y0, w, h);
            grid(30, 'rgba(255,255,255,0.35)');
            break;
        case 'office':
            g.fillStyle = '#4a5462'; g.fillRect(r.x0, r.y0, w, h);
            for (let x = r.x0; x < r.x1; x += 50) for (let y = r.y0; y < r.y1; y += 50) {
                g.fillStyle = ((x + y) / 50) % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
                g.fillRect(x, y, Math.min(50, r.x1 - x), Math.min(50, r.y1 - y));
            }
            speckle(area * 30, 'rgba(255,255,255,0.05)', 2);
            break;
        case 'raised':
            g.fillStyle = '#9ea4ad'; g.fillRect(r.x0, r.y0, w, h);
            grid(60, 'rgba(50,55,65,0.5)', 2);
            g.fillStyle = 'rgba(40,45,55,0.5)';
            for (let x = r.x0 + 60; x < r.x1; x += 60) for (let y = r.y0 + 60; y < r.y1; y += 60) g.fillRect(x - 3, y - 3, 6, 6);
            break;
        case 'concrete':
            g.fillStyle = '#8f8c86'; g.fillRect(r.x0, r.y0, w, h);
            speckle(area * 70, 'rgba(40,40,40,0.14)', 3); speckle(area * 40, 'rgba(255,255,255,0.08)', 2);
            grid(160, 'rgba(50,48,44,0.25)', 2);
            break;
        case 'wood': {
            g.fillStyle = '#9a6b45'; g.fillRect(r.x0, r.y0, w, h);
            g.strokeStyle = 'rgba(60,35,20,0.35)'; g.lineWidth = 1.5;
            for (let y = r.y0; y < r.y1; y += 18) {
                g.beginPath(); g.moveTo(r.x0, y); g.lineTo(r.x1, y); g.stroke();
                for (let x = r.x0 + rnd() * 120; x < r.x1; x += 120) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 18); g.stroke(); }
            }
            break;
        }
        case 'roof':
            g.fillStyle = '#86837d'; g.fillRect(r.x0, r.y0, w, h);
            speckle(area * 120, 'rgba(30,30,30,0.18)', 3); speckle(area * 60, 'rgba(255,255,255,0.08)', 2);
            g.strokeStyle = 'rgba(30,28,26,0.4)'; g.lineWidth = 3;
            for (let x = r.x0 + 240; x < r.x1; x += 240) { g.beginPath(); g.moveTo(x, r.y0); g.lineTo(x + rnd() * 20 - 10, r.y1); g.stroke(); }
            break;
    }
}

function paintWall(g, o) {
    const x = o.x - o.hw, y = o.y - o.hh, w = o.hw * 2, h = o.hh * 2;
    g.fillStyle = shade(o.color, -0.4);
    g.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    g.fillStyle = o.color;
    g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,0.16)';
    g.fillRect(x, y, w, Math.min(h, 4));
    if (o.windows) {
        // Glass panes with frames
        g.fillStyle = 'rgba(150,205,255,0.7)';
        g.strokeStyle = 'rgba(30,40,60,0.8)'; g.lineWidth = 2;
        if (w > h) for (let xx = x + 40; xx < x + w - 80; xx += 90) { g.fillRect(xx, y + 5, 60, h - 10); g.strokeRect(xx, y + 5, 60, h - 10); }
        else for (let yy = y + 40; yy < y + h - 80; yy += 90) { g.fillRect(x + 5, yy, w - 10, 60); g.strokeRect(x + 5, yy, w - 10, 60); }
    }
}

function paintHelipad(g, x, y) {
    const R = ESCAPE.heliR + 40;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(x + 6, y + 8, R, 0, TAU); g.fill();
    g.fillStyle = '#2f3a33'; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
    g.strokeStyle = '#ffd166'; g.lineWidth = 8; g.beginPath(); g.arc(x, y, R - 14, 0, TAU); g.stroke();
    g.strokeStyle = '#e8f5ec'; g.lineWidth = 3; g.setLineDash([18, 14]); g.beginPath(); g.arc(x, y, R - 32, 0, TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(232,245,236,0.85)';
    g.fillRect(x - 46, y - 56, 20, 112); g.fillRect(x + 26, y - 56, 20, 112); g.fillRect(x - 26, y - 10, 52, 20);
    // Perimeter lights
    g.fillStyle = '#7dffb0';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.beginPath(); g.arc(x + Math.cos(a) * (R - 4), y + Math.sin(a) * (R - 4), 4, 0, TAU); g.fill(); }
}

function paintDecor(g, d, rnd) {
    g.save();
    g.translate(d.x, d.y);
    g.rotate(d.rot || 0);
    const w = d.lw, h = d.lh;
    switch (d.d) {
        case 'tiles':
            g.fillStyle = '#e9eef0'; g.fillRect(-w / 2, -h / 2, w, h);
            g.strokeStyle = 'rgba(120,140,150,0.35)'; g.lineWidth = 1; g.beginPath();
            for (let x = -w / 2 + 20; x < w / 2; x += 20) { g.moveTo(x, -h / 2); g.lineTo(x, h / 2); }
            for (let y = -h / 2 + 20; y < h / 2; y += 20) { g.moveTo(-w / 2, y); g.lineTo(w / 2, y); }
            g.stroke();
            break;
        case 'rug':
            g.fillStyle = d.color; roundRect(g, -w / 2, -h / 2, w, h, 6); g.fill();
            g.strokeStyle = 'rgba(255,230,180,0.45)'; g.lineWidth = 3; g.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
            g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 1; g.strokeRect(-w / 2 + 18, -h / 2 + 18, w - 36, h - 36);
            break;
        case 'hazard':
            g.fillStyle = '#ffc23d'; g.fillRect(-w / 2, -h / 2, w, h);
            g.fillStyle = '#1f1b2b';
            for (let x = -w / 2; x < w / 2; x += 24) { g.beginPath(); g.moveTo(x, h / 2); g.lineTo(x + 12, -h / 2); g.lineTo(x + 24, -h / 2); g.lineTo(x + 12, h / 2); g.fill(); }
            break;
        case 'puddle':
            g.fillStyle = 'rgba(60,70,90,0.35)'; g.beginPath(); g.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU); g.fill();
            g.fillStyle = 'rgba(200,220,255,0.12)'; g.beginPath(); g.ellipse(-w * 0.1, -h * 0.1, w * 0.25, h * 0.15, 0, 0, TAU); g.fill();
            break;
        case 'surglamp':
            g.globalCompositeOperation = 'lighter';
            { const gr = g.createRadialGradient(0, 0, 0, 0, 0, w / 2); gr.addColorStop(0, 'rgba(220,255,250,0.35)'); gr.addColorStop(1, 'rgba(220,255,250,0)'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h); }
            break;
        case 'floortext':
            g.font = '700 70px "Black Ops One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillText(d.text, 0, 0);
            break;
        case 'door':
            // Door frame and a door standing open into the room
            g.fillStyle = '#5a4030'; g.fillRect(-w / 2 - 4, -h / 2 - 2, 6, h + 4); g.fillRect(w / 2 - 2, -h / 2 - 2, 6, h + 4);
            g.save(); g.translate(d.swing > 0 ? -w / 2 : w / 2, 0); g.rotate(d.swing > 0 ? -1.2 : 1.2);
            g.fillStyle = '#8a6142'; g.fillRect(d.swing > 0 ? 0 : -w * 0.9, -4, w * 0.9, 8);
            g.restore();
            g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1.5; g.setLineDash([4, 4]);
            g.beginPath();
            if (d.swing > 0) g.arc(-w / 2, 0, w * 0.9, -1.2, 0); else g.arc(w / 2, 0, w * 0.9, Math.PI, Math.PI + 1.2);
            g.stroke(); g.setLineDash([]);
            break;
        case 'elevator':
            g.fillStyle = '#3a3f48'; g.fillRect(-w / 2 - 6, -h / 2 - 2, w + 12, h + 8);
            g.fillStyle = '#b8bec8'; g.fillRect(-w / 2, -h / 2, w, h + 4);
            g.fillStyle = '#7d848f'; g.fillRect(-1, -h / 2, 2, h + 4);
            g.fillStyle = '#ffb347'; g.beginPath(); g.arc(w / 2 + 14, h / 2, 3, 0, TAU); g.fill();
            break;
        case 'cables': {
            // Bundles of cable snaking across the floor
            g.lineWidth = 2.5;
            for (let i = 0; i < 4; i++) {
                g.strokeStyle = ['#1b1e26', '#2a2a2a', '#3a2a1a', '#1f3a2a'][i];
                g.beginPath(); g.moveTo(-w / 2, -h / 2 + rnd() * h);
                for (let k = 1; k <= 4; k++) g.quadraticCurveTo(-w / 2 + (k - 0.5) * w / 4, -h / 2 + rnd() * h, -w / 2 + k * w / 4, -h / 2 + rnd() * h);
                g.stroke();
            }
            break;
        }
        case 'oil':
            g.fillStyle = 'rgba(15,12,10,0.4)'; g.beginPath(); g.ellipse(0, 0, w / 2, h / 2, 0.3, 0, TAU); g.fill();
            g.fillStyle = 'rgba(15,12,10,0.3)'; g.beginPath(); g.ellipse(w * 0.3, h * 0.2, w / 5, h / 5, 0, 0, TAU); g.fill();
            g.fillStyle = 'rgba(120,90,200,0.1)'; g.beginPath(); g.ellipse(-w * 0.1, -h * 0.1, w / 6, h / 8, 0, 0, TAU); g.fill();
            break;
        case 'papers':
            for (let i = 0; i < 9; i++) { g.save(); g.translate((rnd() - 0.5) * w, (rnd() - 0.5) * h); g.rotate(rnd() * TAU); g.fillStyle = rnd() < 0.8 ? '#ecebe4' : '#d8c9a0'; g.fillRect(-6, -8, 12, 16); g.restore(); }
            break;
        case 'stool':
            g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(2, 3, w / 2, 0, TAU); g.fill();
            g.fillStyle = '#3a3f48'; g.beginPath(); g.arc(0, 0, w / 2, 0, TAU); g.fill();
            g.fillStyle = '#5a616c'; g.beginPath(); g.arc(0, 0, w / 2 - 3, 0, TAU); g.fill();
            break;
        case 'chair':
            g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
            g.fillStyle = '#3b3550'; roundRect(g, -w / 2, -h / 2, w, h, 6); g.fill();
            g.fillStyle = '#2b2640'; g.fillRect(-w / 2, -h / 2, w, 7);
            break;
        case 'curtain':
            g.fillStyle = 'rgba(140,190,220,0.55)'; g.fillRect(-w / 2, -h / 2, w, h);
            g.strokeStyle = 'rgba(80,120,150,0.5)'; g.lineWidth = 1;
            for (let y = -h / 2; y < h / 2; y += 10) { g.beginPath(); g.moveTo(-w / 2, y); g.lineTo(w / 2, y + 5); g.stroke(); }
            break;
        case 'ivstand':
            g.fillStyle = '#9aa2ad'; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill();
            g.fillStyle = 'rgba(200,230,255,0.85)'; g.fillRect(-4, -9, 8, 10);
            break;
        case 'wheelchair':
            g.fillStyle = '#2b2b33'; g.fillRect(-w / 2, -h / 2, 6, h); g.fillRect(w / 2 - 6, -h / 2, 6, h);
            g.fillStyle = '#4b5a8a'; g.fillRect(-w / 2 + 6, -h / 2 + 4, w - 12, h - 10);
            break;
        case 'sign':
            g.font = '700 15px Rajdhani, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            { const tw = g.measureText(d.text).width + 14; g.fillStyle = 'rgba(20,16,30,0.75)'; roundRect(g, -tw / 2, -10, tw, 20, 4); g.fill(); }
            g.fillStyle = '#ffe9b0'; g.fillText(d.text, 0, 1);
            break;
        case 'extinguisher':
            g.fillStyle = '#d23a3a'; roundRect(g, -6, -4, 12, 16, 4); g.fill();
            g.fillStyle = '#222'; g.fillRect(-2, -8, 4, 5);
            break;
        case 'painting':
            g.fillStyle = '#b08a3a'; g.fillRect(-24, -5, 48, 10);
            g.fillStyle = pick(['#3f7a9c', '#7a68a8', '#5a8f5c', '#c0583f']); g.fillRect(-20, -3, 40, 6);
            break;
    }
    g.restore();
}

// Every piece of furniture, drawn in its own frame: the top edge (-lh/2) is the side against the back wall
function paintFurniture(g, o, rnd) {
    const w = o.lw, h = o.lh;
    g.save();
    g.translate(o.x, o.y);
    g.rotate(o.rot || 0);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    if (o.furn === 'tank' || o.furn === 'plant') { g.beginPath(); g.arc(4, 6, w / 2, 0, TAU); g.fill(); }
    else g.fillRect(-w / 2 + 4, -h / 2 + 6, w, h);
    const box = (x, y, bw, bh, c, edge) => { if (edge) { g.fillStyle = edge; g.fillRect(x - 1.5, y - 1.5, bw + 3, bh + 3); } g.fillStyle = c; g.fillRect(x, y, bw, bh); };
    switch (o.furn) {
        case 'bed': {
            box(-w / 2, -h / 2, w, h, o.hospital ? '#9aa2ad' : '#4a3324', '#2a1d14');
            g.fillStyle = o.hospital ? '#f4f7fa' : '#f1e9dc'; roundRect(g, -w / 2 + 4, -h / 2 + 6, w - 8, h - 10, 5); g.fill();
            g.fillStyle = '#ffffff';
            if (w > 70) { roundRect(g, -w / 2 + 8, -h / 2 + 10, w / 2 - 12, 20, 6); g.fill(); roundRect(g, 4, -h / 2 + 10, w / 2 - 12, 20, 6); g.fill(); }
            else { roundRect(g, -w / 2 + 8, -h / 2 + 10, w - 16, 18, 6); g.fill(); }
            g.fillStyle = o.hospital ? '#7fb6e0' : o.color || '#3f7a9c';
            roundRect(g, -w / 2 + 4, -h / 2 + h * 0.38, w - 8, h * 0.58, 4); g.fill();
            g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-w / 2 + 4, -h / 2 + h * 0.38, w - 8, 6);
            break;
        }
        case 'bunk':
            box(-w / 2, -h / 2, w, h, '#5a6070', '#2b2f38');
            g.fillStyle = '#6b7a4f'; g.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
            g.fillStyle = '#e8e3d0'; g.fillRect(-w / 2 + 6, -h / 2 + 6, w - 12, 14);
            g.strokeStyle = '#2b2f38'; g.lineWidth = 2; g.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
            break;
        case 'nightstand':
            box(-w / 2, -h / 2, w, h, '#7a5236', '#3b2a1e');
            g.fillStyle = 'rgba(255,220,150,0.35)'; g.beginPath(); g.arc(0, 0, w * 0.6, 0, TAU); g.fill();
            g.fillStyle = '#f2e3c0'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
            break;
        case 'desk':
            box(-w / 2, -h / 2, w, h, '#8a6142', '#4a3324');
            if (o.monitor) {
                g.fillStyle = '#1b1e26'; g.fillRect(-14, -h / 2 + 4, 28, 6);
                g.fillStyle = 'rgba(110,190,255,0.6)'; g.fillRect(-12, -h / 2 + 5, 24, 3);
                g.fillStyle = '#2b2f38'; g.fillRect(-12, -h / 2 + 16, 24, 7);
                g.fillStyle = '#f2f2f2'; g.fillRect(w / 2 - 20, -4, 12, 14);
            } else {
                g.fillStyle = '#f2f2f2'; g.fillRect(-w * 0.25, -h * 0.2, w * 0.25, h * 0.3);
                g.fillStyle = '#1b1e26'; g.fillRect(w * 0.05, -h * 0.3, w * 0.3, h * 0.25);
            }
            break;
        case 'wardrobe':
            box(-w / 2, -h / 2, w, h, '#6b4a33', '#3b2a1e');
            g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-1, -h / 2 + 4, 2, h - 8);
            g.fillStyle = '#d6b36a'; g.fillRect(-5, -4, 3, 8); g.fillRect(2, -4, 3, 8);
            break;
        case 'armchair':
        case 'sofa': {
            const c = o.furn === 'sofa' ? '#5b4a7a' : '#7a4a3b';
            box(-w / 2, -h / 2, w, h, shade(c, -0.25), shade(c, -0.5));
            g.fillStyle = shade(c, 0.1);
            const n = o.furn === 'sofa' ? 3 : 1, cw = (w - 16) / n;
            for (let i = 0; i < n; i++) { roundRect(g, -w / 2 + 8 + i * cw + 1, -h / 2 + 12, cw - 2, h - 16, 4); g.fill(); }
            g.fillStyle = shade(c, -0.1); g.fillRect(-w / 2, -h / 2, w, 10);
            break;
        }
        case 'plant':
            g.fillStyle = '#7a4a2a'; g.beginPath(); g.arc(0, 0, w * 0.42, 0, TAU); g.fill();
            for (let i = 0; i < 7; i++) {
                const a = (i / 7) * TAU + (o.x % 1), r = w * 0.32;
                g.fillStyle = i % 2 ? '#3f8a3a' : '#2e6b2c';
                g.beginPath(); g.ellipse(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r, r * 0.45, a, 0, TAU); g.fill();
            }
            break;
        case 'counter':
            box(-w / 2, -h / 2, w, h, '#d9d2c4', '#6a6156');
            g.fillStyle = '#2b2f38'; g.fillRect(-w / 4, -h / 2 + 4, 26, 10);
            g.fillStyle = 'rgba(110,190,255,0.6)'; g.fillRect(-w / 4 + 2, -h / 2 + 6, 22, 5);
            break;
        case 'shelf': {
            box(-w / 2, -h / 2, w, h, '#8d939c', '#4a4f57');
            const horiz = w >= h, L = horiz ? w : h;
            for (let s = 6; s < L - 8; s += 12) {
                g.fillStyle = o.meds ? pick(['#ffffff', '#ff6b6b', '#5ec3ff', '#ffd166', '#7dffb0']) : pick(['#b08a5a', '#8a6a4a', '#6a7a8a']);
                const len = 8 + rnd() * 3;
                horiz ? g.fillRect(-w / 2 + s, -h / 2 + 4, len, h - 8) : g.fillRect(-w / 2 + 4, -h / 2 + s, w - 8, len);
            }
            break;
        }
        case 'cabinet':
        case 'filing':
        case 'locker': {
            box(-w / 2, -h / 2, w, h, '#9aa2ad', '#4a4f57');
            g.strokeStyle = 'rgba(40,44,52,0.6)'; g.lineWidth = 1.5;
            const horiz = w >= h, n = Math.max(2, Math.round((horiz ? w : h) / 22));
            for (let i = 1; i < n; i++) { g.beginPath(); horiz ? (g.moveTo(-w / 2 + (i * w) / n, -h / 2), g.lineTo(-w / 2 + (i * w) / n, h / 2)) : (g.moveTo(-w / 2, -h / 2 + (i * h) / n), g.lineTo(w / 2, -h / 2 + (i * h) / n)); g.stroke(); }
            break;
        }
        case 'toilet':
            g.fillStyle = '#f4f6f8'; g.fillRect(-w / 2, -h / 2, w, h * 0.32);
            g.beginPath(); g.ellipse(0, h * 0.12, w * 0.42, h * 0.36, 0, 0, TAU); g.fill();
            g.strokeStyle = '#b8c0c8'; g.lineWidth = 1.5; g.stroke();
            g.fillStyle = '#d6e6ee'; g.beginPath(); g.ellipse(0, h * 0.14, w * 0.24, h * 0.2, 0, 0, TAU); g.fill();
            break;
        case 'tub':
            g.fillStyle = '#f4f6f8'; roundRect(g, -w / 2, -h / 2, w, h, 10); g.fill();
            g.strokeStyle = '#b8c0c8'; g.lineWidth = 1.5; g.stroke();
            g.fillStyle = '#9ccfe6'; roundRect(g, -w / 2 + 5, -h / 2 + 6, w - 10, h - 12, 8); g.fill();
            g.fillStyle = '#c0c6cc'; g.beginPath(); g.arc(0, -h / 2 + 10, 3, 0, TAU); g.fill();
            break;
        case 'sink':
            g.fillStyle = '#f4f6f8'; g.fillRect(-w / 2, -h / 2, w, h);
            g.fillStyle = '#c9dbe4'; g.beginPath(); g.ellipse(0, 2, w * 0.32, h * 0.32, 0, 0, TAU); g.fill();
            g.fillStyle = '#9aa2ad'; g.fillRect(-2, -h / 2 + 1, 4, 6);
            break;
        case 'optable':
            box(-w / 2, -h / 2, w, h, '#b8c0c8', '#6a727c');
            g.fillStyle = '#4f9e8c'; roundRect(g, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 5); g.fill();
            g.fillStyle = '#ffffff'; roundRect(g, -w / 2 + 8, -h / 2 + 8, w - 16, 16, 5); g.fill();
            break;
        case 'trolley':
            box(-w / 2, -h / 2, w, h, '#c9d0d8', '#6a727c');
            g.fillStyle = '#8a929c'; g.fillRect(-w / 2 + 4, -h / 2 + 6, w - 8, 3); g.fillRect(-w / 2 + 4, h / 2 - 10, w - 8, 3);
            break;
        case 'weaponrack': {
            // Rifles standing in the rack, butts down, a magazine beside each
            box(-w / 2, -h / 2, w, h, '#4a4f45', '#22261f');
            const horiz = w >= h, L = horiz ? w : h;
            for (let s2 = 10; s2 < L - 8; s2 += 18) {
                const long = rnd() < 0.7;
                g.fillStyle = '#16181d';
                horiz ? g.fillRect(-w / 2 + s2, -h / 2 + 2, 5, (h - 4) * (long ? 1 : 0.7)) : g.fillRect(-w / 2 + 2, -h / 2 + s2, (w - 4) * (long ? 1 : 0.7), 5);
                g.fillStyle = '#5a4430';
                horiz ? g.fillRect(-w / 2 + s2 - 1, h / 2 - 7, 7, 5) : g.fillRect(w / 2 - 7, -h / 2 + s2 - 1, 5, 7);
                g.fillStyle = '#c9a060';
                horiz ? g.fillRect(-w / 2 + s2 + 7, -h / 2 + 4, 3, 4) : g.fillRect(-w / 2 + 4, -h / 2 + s2 + 7, 4, 3);
            }
            break;
        }
        case 'milcrate':
            box(-w / 2, -h / 2, w, h, '#5b6b32', '#2c3418');
            g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.strokeRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10);
            g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = '700 9px sans-serif'; g.textAlign = 'center'; g.fillText('AMMO', 0, 3);
            break;
        case 'sandbags': {
            const horiz = w >= h, L = horiz ? w : h, n = Math.max(2, Math.round(L / 24));
            for (let i = 0; i < n; i++) {
                const c = -L / 2 + (i + 0.5) * (L / n);
                g.fillStyle = i % 2 ? '#b8a27a' : '#a8926a';
                g.beginPath(); horiz ? g.ellipse(c, 0, L / n / 2 + 2, h / 2, 0, 0, TAU) : g.ellipse(0, c, w / 2, L / n / 2 + 2, 0, 0, TAU); g.fill();
                g.strokeStyle = 'rgba(70,55,35,0.5)'; g.lineWidth = 1.5; g.stroke();
            }
            break;
        }
        case 'rack':
            box(-w / 2, -h / 2, w, h, '#1f232b', '#0d0f14');
            for (let y = -h / 2 + 6; y < h / 2 - 4; y += 7) {
                g.fillStyle = '#2f3540'; g.fillRect(-w / 2 + 3, y, w - 6, 4);
                g.fillStyle = rnd() < 0.5 ? '#7dffb0' : '#5ec3ff'; g.fillRect(w / 2 - 8, y + 1, 2, 2);
            }
            break;
        case 'tv':
            g.fillStyle = '#111'; g.fillRect(-w / 2, -h / 2, w, h);
            g.fillStyle = 'rgba(110,190,255,0.35)'; g.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
            break;
        case 'longtable':
            box(-w / 2, -h / 2, w, h, '#6b4a33', '#3b2a1e');
            g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(-w / 2 + 6, -h / 2 + 6, w - 12, h * 0.3);
            g.fillStyle = '#f2f2f2'; for (let i = 0; i < 4; i++) g.fillRect(-w / 2 + 20 + i * (w - 40) / 4, -6, 14, 10);
            break;
        case 'vending':
            box(-w / 2, -h / 2, w, h, '#c0392b', '#5a1a14');
            g.fillStyle = 'rgba(200,230,255,0.55)'; g.fillRect(-w / 2 + 5, -h / 2 + 4, w * 0.6, h - 8);
            break;
        case 'acunit':
            box(-w / 2, -h / 2, w, h, '#b8bcc4', '#5a5f68');
            for (const fx of [-w / 4, w / 4]) {
                g.fillStyle = '#5a5f68'; g.beginPath(); g.arc(fx, 0, h * 0.36, 0, TAU); g.fill();
                g.strokeStyle = '#8f949c'; g.lineWidth = 2; g.beginPath(); g.moveTo(fx - h * 0.3, 0); g.lineTo(fx + h * 0.3, 0); g.moveTo(fx, -h * 0.3); g.lineTo(fx, h * 0.3); g.stroke();
            }
            break;
        case 'vent':
            box(-w / 2, -h / 2, w, h, '#9aa2ad', '#4a4f57');
            g.strokeStyle = '#4a4f57'; g.lineWidth = 2;
            for (let y = -h / 2 + 6; y < h / 2 - 3; y += 6) { g.beginPath(); g.moveTo(-w / 2 + 4, y); g.lineTo(w / 2 - 4, y); g.stroke(); }
            break;
        case 'tank':
            g.fillStyle = '#6a727c'; g.beginPath(); g.arc(0, 0, w / 2, 0, TAU); g.fill();
            g.strokeStyle = '#4a4f57'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, w / 2 - 8, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, w / 4, 0, TAU); g.stroke();
            break;
        case 'antenna':
            g.fillStyle = '#4a4f57'; g.fillRect(-w / 2, -h / 2, w, h);
            g.strokeStyle = '#2b2f38'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(60, 80); g.stroke();
            g.fillStyle = '#ff3b3b'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
            break;
        case 'console': {
            // Control desk: a row of glowing screens, keyboards and a scatter of lit buttons
            box(-w / 2, -h / 2, w, h, '#3a3f4a', '#16181e');
            g.fillStyle = '#2a2e37'; g.fillRect(-w / 2 + 3, h / 2 - 12, w - 6, 9);
            const n = Math.max(1, Math.floor(w / 34));
            for (let i = 0; i < n; i++) {
                const x = -w / 2 + (i + 0.5) * (w / n);
                g.fillStyle = '#0d0f14'; g.fillRect(x - 13, -h / 2 + 3, 26, 9);
                g.fillStyle = pick(['rgba(110,190,255,0.85)', 'rgba(125,255,176,0.8)', 'rgba(255,209,102,0.75)']); g.fillRect(x - 11, -h / 2 + 4, 22, 6);
                g.fillStyle = '#c9ced8'; g.fillRect(x - 10, -1, 20, 6);
            }
            for (let i = 0; i < 10; i++) { g.fillStyle = pick(['#ff4f6d', '#7dffb0', '#ffd166', '#5ec3ff']); g.fillRect(-w / 2 + 6 + rnd() * (w - 12), h / 2 - 10 + rnd() * 5, 2, 2); }
            break;
        }
        case 'monitorwall': {
            box(-w / 2, -h / 2, w, h, '#111318', '#050608');
            const n = Math.max(2, Math.floor(w / 30));
            for (let i = 0; i < n; i++) {
                const x = -w / 2 + 3 + i * ((w - 6) / n), sw = (w - 6) / n - 3;
                g.fillStyle = pick(['#123a5a', '#0f4a2c', '#4a3a10', '#3a1420']); g.fillRect(x, -h / 2 + 2, sw, h - 4);
                g.strokeStyle = pick(['#5ec3ff', '#7dffb0', '#ffd166']); g.lineWidth = 1;
                g.beginPath(); g.moveTo(x + 2, h / 2 - 4); for (let k = 1; k < 5; k++) g.lineTo(x + 2 + (k * (sw - 4)) / 4, -h / 2 + 3 + rnd() * (h - 7)); g.stroke();
            }
            break;
        }
        case 'labbench': {
            box(-w / 2, -h / 2, w, h, '#e8ecef', '#7a828c');
            g.fillStyle = '#2b2f38'; g.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
            g.fillStyle = '#c9dbe4'; g.beginPath(); g.ellipse(-w / 2 + 16, 0, 8, h * 0.28, 0, 0, TAU); g.fill();
            for (let i = 0; i < Math.floor(w / 18); i++) { g.fillStyle = pick(['rgba(125,255,176,0.8)', 'rgba(255,79,109,0.8)', 'rgba(94,195,255,0.8)', 'rgba(255,209,102,0.8)']); g.beginPath(); g.arc(-w / 2 + 34 + i * 16, -h * 0.15 + rnd() * h * 0.3, 3.5, 0, TAU); g.fill(); }
            g.fillStyle = '#9aa2ad'; g.fillRect(w / 2 - 22, -6, 10, 12); g.fillStyle = '#1b1e26'; g.beginPath(); g.arc(w / 2 - 17, -8, 3, 0, TAU); g.fill();
            break;
        }
        case 'fumehood':
            box(-w / 2, -h / 2, w, h, '#c9ced8', '#5a616c');
            g.fillStyle = 'rgba(150,200,230,0.55)'; g.fillRect(-w / 2 + 5, h / 2 - 12, w - 10, 8);
            g.fillStyle = '#7a828c'; g.fillRect(-6, -h / 2 + 3, 12, 6);
            break;
        case 'fridge':
            box(-w / 2, -h / 2, w, h, '#e9edf0', '#8a929c');
            g.fillStyle = '#b8c0c8'; g.fillRect(-w / 2 + 3, -2, w - 6, 2);
            g.fillStyle = '#6a727c'; g.fillRect(w / 2 - 8, -h / 2 + 6, 3, h * 0.3); g.fillRect(w / 2 - 8, 4, 3, h * 0.3);
            break;
        case 'stove':
            box(-w / 2, -h / 2, w, h, '#2b2e34', '#111');
            for (const [bx, by] of [[-w / 4, -h / 4], [w / 4, -h / 4], [-w / 4, h / 4], [w / 4, h / 4]]) { g.strokeStyle = '#6a6f78'; g.lineWidth = 2; g.beginPath(); g.arc(bx, by, Math.min(w, h) * 0.17, 0, TAU); g.stroke(); }
            g.fillStyle = 'rgba(255,120,40,0.5)'; g.beginPath(); g.arc(-w / 4, -h / 4, 3, 0, TAU); g.fill();
            break;
        case 'roundtable': {
            // Table with its chairs drawn round it
            const r = Math.min(w, h) / 2 - 12;
            for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; g.fillStyle = '#4a3a2e'; roundRect(g, Math.cos(a) * (r + 9) - 8, Math.sin(a) * (r + 9) - 8, 16, 16, 4); g.fill(); }
            g.fillStyle = '#3b2a1e'; g.beginPath(); g.arc(0, 0, r + 2, 0, TAU); g.fill();
            g.fillStyle = '#8a6142'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
            g.fillStyle = '#f2f2f2'; g.beginPath(); g.arc(-r * 0.3, -r * 0.2, 4, 0, TAU); g.arc(r * 0.35, r * 0.25, 4, 0, TAU); g.fill();
            break;
        }
        case 'workbench':
            box(-w / 2, -h / 2, w, h, '#8a6a42', '#3b2a1a');
            g.fillStyle = 'rgba(0,0,0,0.2)'; for (let x = -w / 2 + 10; x < w / 2; x += 18) g.fillRect(x, -h / 2 + 2, 2, h - 4);
            g.fillStyle = '#6a727c'; g.fillRect(-w / 2 + 6, -h / 2 + 4, 14, 10);
            g.strokeStyle = '#9aa2ad'; g.lineWidth = 3; g.beginPath(); g.moveTo(-4, -4); g.lineTo(14, 4); g.moveTo(w / 4, -6); g.lineTo(w / 4 + 6, 6); g.stroke();
            g.fillStyle = '#c0392b'; g.fillRect(w / 2 - 18, -4, 10, 8);
            break;
        case 'lathe':
            box(-w / 2, -h / 2, w, h, '#4f6a5a', '#1f2a24');
            g.fillStyle = '#2b2f38'; g.fillRect(-w / 2 + 6, -3, w - 12, 6);
            g.fillStyle = '#9aa2ad'; g.beginPath(); g.arc(-w / 2 + 14, 0, h * 0.32, 0, TAU); g.fill();
            g.fillStyle = '#ffd166'; g.fillRect(w / 2 - 14, -h / 2 + 4, 8, 8);
            break;
        case 'toolrack':
            box(-w / 2, -h / 2, w, h, '#a89878', '#4a3f2a');
            g.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = -w / 2 + 4; x < w / 2; x += 6) for (let y = -h / 2 + 3; y < h / 2; y += 6) g.fillRect(x, y, 1.5, 1.5);
            g.strokeStyle = '#2b2f38'; g.lineWidth = 2.5;
            for (let x = -w / 2 + 10; x < w / 2 - 6; x += 16) { g.beginPath(); g.moveTo(x, -h / 2 + 3); g.lineTo(x + rnd() * 4 - 2, h / 2 - 3); g.stroke(); }
            break;
        case 'drum':
            g.fillStyle = '#3a1a10'; g.beginPath(); g.arc(0, 0, w / 2 + 1.5, 0, TAU); g.fill();
            g.fillStyle = o.color || '#7a3b22'; g.beginPath(); g.arc(0, 0, w / 2, 0, TAU); g.fill();
            g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, w * 0.32, 0, TAU); g.stroke();
            g.fillStyle = 'rgba(140,70,30,0.5)'; g.beginPath(); g.arc(-3, 3, 4, 0, TAU); g.fill();
            break;
        case 'engine':
            box(-w / 2, -h / 2, w, h, '#5a5f68', '#22252b');
            for (let i = 0; i < 4; i++) { g.fillStyle = '#3a3f46'; g.beginPath(); g.arc(-w / 2 + 12 + i * ((w - 24) / 3), 0, h * 0.22, 0, TAU); g.fill(); }
            g.fillStyle = 'rgba(20,15,10,0.4)'; g.beginPath(); g.ellipse(w * 0.2, h * 0.3, w * 0.3, h * 0.18, 0, 0, TAU); g.fill();
            break;
        case 'generator':
            box(-w / 2, -h / 2, w, h, '#d9a13a', '#5a3f10');
            g.fillStyle = '#2b2f38'; g.fillRect(-w / 2 + 6, -h / 2 + 6, w * 0.4, h - 12);
            g.fillStyle = '#1b1e26'; g.beginPath(); g.arc(w / 4, 0, h * 0.25, 0, TAU); g.fill();
            break;
        case 'treadmill':
            box(-w / 2, -h / 2, w, h, '#2b2f38', '#0f1115');
            g.fillStyle = '#16181d'; g.fillRect(-w / 2 + 6, -h / 2 + 14, w - 12, h - 18);
            g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1; for (let y = -h / 2 + 18; y < h / 2 - 4; y += 6) { g.beginPath(); g.moveTo(-w / 2 + 6, y); g.lineTo(w / 2 - 6, y); g.stroke(); }
            g.fillStyle = 'rgba(110,190,255,0.7)'; g.fillRect(-8, -h / 2 + 3, 16, 7);
            break;
        case 'weights':
            box(-w / 2, -h / 2, w, h, '#3a3f46', '#16181d');
            for (let x = -w / 2 + 10; x < w / 2 - 6; x += 14) { g.fillStyle = '#111'; g.beginPath(); g.arc(x, 0, h * 0.3, 0, TAU); g.fill(); g.fillStyle = '#6a6f78'; g.beginPath(); g.arc(x, 0, 2, 0, TAU); g.fill(); }
            break;
        case 'bench':
            box(-w / 2, -h / 2, w, h, '#8a6a42', '#3b2a1a');
            g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = -h / 2 + 4; y < h / 2; y += 6) g.fillRect(-w / 2 + 2, y, w - 4, 1.5);
            break;
        case 'coffeetable':
            box(-w / 2, -h / 2, w, h, '#6b4a33', '#2b1d14');
            g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h * 0.3);
            g.fillStyle = pick(['#c0392b', '#2e86de', '#e9c46a']); g.save(); g.rotate(0.3); g.fillRect(-10, -6, 18, 12); g.restore();
            g.fillStyle = '#f2ece2'; g.beginPath(); g.arc(w * 0.25, 0, 4, 0, TAU); g.fill();
            break;
        case 'bookshelf': {
            box(-w / 2, -h / 2, w, h, '#5a3e2a', '#2a1d14');
            const horiz = w >= h, L = horiz ? w : h;
            for (let s2 = 4; s2 < L - 4; s2 += 5) { g.fillStyle = pick(['#8a2e2e', '#2e4a8a', '#2e6a3a', '#c9a060', '#6a4a8a', '#d8d0c0']); horiz ? g.fillRect(-w / 2 + s2, -h / 2 + 3, 4, h - 6) : g.fillRect(-w / 2 + 3, -h / 2 + s2, w - 6, 4); }
            break;
        }
        case 'printer':
            box(-w / 2, -h / 2, w, h, '#d6d9de', '#6a6f78');
            g.fillStyle = '#2b2f38'; g.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h * 0.3);
            g.fillStyle = '#ffffff'; g.fillRect(-w / 4, h / 2 - 8, w / 2, 6);
            break;
        case 'cooler':
            g.fillStyle = '#e9edf0'; g.fillRect(-w / 2, -h / 2, w, h);
            g.fillStyle = 'rgba(80,170,240,0.75)'; g.beginPath(); g.arc(0, 0, w * 0.36, 0, TAU); g.fill();
            g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(-3, -3, 3, 0, TAU); g.fill();
            break;
        case 'radio':
            box(-w / 2, -h / 2, w, h, '#5b6b32', '#2c3418');
            g.fillStyle = '#1b1e26'; g.fillRect(-w / 2 + 4, -h / 2 + 4, w * 0.45, h - 8);
            g.fillStyle = 'rgba(125,255,176,0.8)'; g.fillRect(-w / 2 + 6, -h / 2 + 6, w * 0.3, 4);
            for (let i = 0; i < 3; i++) { g.fillStyle = '#c9ced8'; g.beginPath(); g.arc(w * 0.1 + i * 9, 0, 3, 0, TAU); g.fill(); }
            g.strokeStyle = '#2b2f38'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2 - 6, -h / 2); g.lineTo(w / 2 + 6, -h / 2 - 16); g.stroke();
            break;
        case 'maptable': {
            box(-w / 2, -h / 2, w, h, '#3d5a3a', '#1a2a18');
            g.strokeStyle = 'rgba(230,220,170,0.55)'; g.lineWidth = 1.5;
            g.beginPath(); g.moveTo(-w / 2 + 8, 0); g.quadraticCurveTo(0, -h / 3, w / 2 - 8, h / 6); g.moveTo(-w / 4, -h / 2 + 6); g.lineTo(-w / 6, h / 2 - 6); g.stroke();
            for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#ff4f6d' : '#5ec3ff'; g.beginPath(); g.arc(-w / 2 + 12 + rnd() * (w - 24), -h / 2 + 10 + rnd() * (h - 20), 3, 0, TAU); g.fill(); }
            for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.fillStyle = '#2a2e37'; g.beginPath(); g.arc(Math.cos(a) * (w / 2 + 12), Math.sin(a) * (h / 2 + 12), 7, 0, TAU); g.fill(); }
            break;
        }
        case 'ammo':
            box(-w / 2, -h / 2, w, h, '#4f5d33', '#22281a');
            g.fillStyle = '#ffd166'; g.fillRect(-w / 2 + 4, -2, w - 8, 4);
            g.fillStyle = '#2b311f'; g.fillRect(-4, -h / 2 + 2, 8, 4);
            break;
        case 'gunbench':
            box(-w / 2, -h / 2, w, h, '#5a5f68', '#22252b');
            for (let i = 0; i < 2; i++) { const y = -h / 4 + i * h / 2; g.fillStyle = '#16181d'; g.fillRect(-w / 2 + 10, y - 2.5, w * 0.6, 5); g.fillRect(-w / 2 + 10 + w * 0.15, y, 6, 8); }
            g.fillStyle = '#c9a060'; for (let i = 0; i < 6; i++) g.fillRect(w / 2 - 22 + (i % 3) * 5, -6 + Math.floor(i / 3) * 7, 3, 5);
            break;
        case 'partition':
            g.fillStyle = '#4a5866'; g.fillRect(-w / 2, -h / 2, w, h);
            g.fillStyle = '#6a7a8a'; g.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
            break;
        case 'whiteboard':
            box(-w / 2, -h / 2, w, h, '#f4f6f8', '#8a929c');
            g.strokeStyle = 'rgba(40,80,200,0.6)'; g.lineWidth = 1;
            g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(-w / 2 + 8 + i * w / 5, -h / 2 + 3); g.lineTo(-w / 2 + 20 + i * w / 5, h / 2 - 3); } g.stroke();
            break;
        case 'pallet':
            box(-w / 2, -h / 2, w, h, '#a8865a', '#5a4428');
            g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = -h / 2 + 6; y < h / 2; y += 10) g.fillRect(-w / 2, y, w, 3);
            g.fillStyle = '#c99a5a'; g.fillRect(-w / 2 + 6, -h / 2 + 6, w * 0.45, h * 0.45); g.fillRect(2, 0, w * 0.4, h * 0.42);
            break;
        case 'bars':
            // Cell bars: a row of thin posts
            g.fillStyle = '#2b2f38';
            if (w >= h) for (let x = -w / 2; x <= w / 2; x += 10) g.fillRect(x - 1.5, -h / 2, 3, h);
            else for (let y = -h / 2; y <= h / 2; y += 10) g.fillRect(-w / 2, y - 1.5, w, 3);
            g.fillRect(-w / 2, -1, w, 2);
            break;
        case 'cot':
            box(-w / 2, -h / 2, w, h, '#6a727c', '#2b2f38');
            g.fillStyle = '#5a6a4a'; g.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
            break;
        default:
            box(-w / 2, -h / 2, w, h, '#b8803f', '#5a3a1e');
    }
    g.restore();
}

// ---------- Game state ----------
let G = null;
let bestKills = parseInt(localStorage.getItem('ba_highscore'), 10) || 0;

function createFighter(x, y, opts) {
    const color = opts.color;
    const f = {
        x, y, vx: 0, vy: 0, r: CONFIG.RADIUS, angle: rand(0, TAU),
        isPlayer: !!opts.isPlayer, name: opts.name, color, team: opts.team === undefined ? null : opts.team, dark: shade(color, -0.45), light: shade(color, 0.35),
        hp: CONFIG.MAX_HEALTH, armor: 0, dead: false,
        // Weapon slots: null = empty, which means fists. Everyone starts with nothing and loots everything
        inv: [null, null], slot: 0, maxSlots: CONFIG.BASE_SLOTS,
        items: { bandage: 0, medkit: 0, meat: 0, water: 0, bucket: 0, grenade: 0, smoke: 0, strobe: 0, mine: 0, cure: 0, nuke: 0, emissile: 0, shock: 0, cluster: 0, fire: 0, freeze: 0, gravity: 0, sticky: 0, decoy: 0, flash: 0, poison: 0, shockwave: 0, teleport: 0, heal: 0, drone: 0, megafrag: 0 },
        healing: null, lastThrow: -9999, kx: 0, ky: 0, cook: null, throwSel: 'grenade',
        ammo: {},
        lastShot: -9999, recoil: 0, punch: 0, punchHand: 0, hitFlash: 0, lastHurt: -9999,
        kills: 0, hidden: false,
        // Gun settle
        bloom: 0, likesCars: Math.random() < 0.45, shield: 0, shieldMax: 0, shieldKind: null, perk: null, hunger: 100, thirst: 100, energy: 100, resting: false,
        // Bot brain
        mode: 'wander', target: null, goal: null, nextThink: rand(0, 400), heading: rand(0, TAU),
        strafe: 1, engageAt: 0, aimErr: 0, stuck: 0, detour: 0, detourAngle: 0, hasLOS: false, lastSeen: 0, chasesDrops: Math.random() < 0.5, alert: Math.random() < 0.35,
        // Steering around obstacles
        steerOff: 0, steerHold: 0, nextProbe: 0, avoidSide: Math.random() < 0.5 ? 1 : -1, headingHold: 0,
        // Zombies / Virus
        zombie: false, soldier: false, escaped: false, exit: null, maxHp: CONFIG.MAX_HEALTH
    };
    return f;
}

// Teammates never count as enemies; in free for all everyone else does.
// Things with no owner (airstrikes, car explosions, fire) are a danger to everyone
const foe = (a, b) => a !== b && !(G && G.fort && G.fort.build) && (!a || !b || a.team === null || a.team !== b.team);

function findSpawn(avoid, minDist) {
    const W = CONFIG.WORLD_SIZE;
    for (let tries = 0; tries < 60; tries++) {
        const x = rand(200, W - 200), y = rand(200, W - 200);
        let ok = !blockedAt(G.world.grid, x, y, 40) && (!G.world.cave || G.world.cave.inside(x, y, 200));
        if (ok && avoid) for (const a of avoid) if (Math.hypot(a.x - x, a.y - y) < minDist) { ok = false; break; }
        if (ok) return { x, y };
    }
    return { x: rand(200, W - 200), y: rand(200, W - 200) };
}

// setup: { type: 'ffa' | 'epic' | 'escape', count }, { type: 'zombies', count, zombies } or { type: 'war' | 'hightech', teams, size }
function newState(mode, setup) {
    const W = CONFIG.WORLD_SIZE;
    const zombies = setup.type === 'zombies', escape = setup.type === 'escape', survival = setup.type === 'survival';
    const hightech = setup.type === 'hightech' || setup.warfare === 'hightech', heavy = setup.warfare === 'heavy', early = setup.warfare === 'early' && !hightech;
    const revolution = setup.type === 'revolution', assassin = setup.type === 'assassin', bossFight = setup.type === 'boss';
    const murder = setup.type === 'murder', ghostMode = setup.type === 'ghost', fort = setup.type === 'fort';
    const war = setup.type === 'war' || setup.type === 'hightech' || revolution || fort ? { teams: setup.teams, size: setup.size, out: [], centers: [], nextCenter: 0 } : null;
    const cpuCount = war ? war.teams * war.size - (mode === 'playing' ? 1 : 0) : setup.count;
    G = {
        mode, cpuCount, war,
        revolution: revolution ? { tickets: [0, 0], queue: [], bases: [], chests: [] } : null,
        // War and Epic Free For All both have supply crates and the heavy guns
        epic: setup.type === 'epic' || (heavy && !war && !zombies && !escape), supplies: !!war || setup.type === 'epic' || heavy, hightech, heavy, early, warfare: setup.warfare || 'normal', ai: aiSkill(setup.ai || 5),
        teamAlive: war ? new Array(war.teams).fill(0) : null,
        // Zombies and Virus have no zone: the game ends when one side is gone
        zombies, escape, survival, animals: [], agrid: new Grid(128, 0), nextAnimal: 0, noZone: zombies || escape || assassin || bossFight, assassin, bossFight, bossF: null, murder, ghostMode, fort: null, ghostSteps: [], sides: { a: 0, b: 0 }, prey: [], nextPrey: 0, escaped: 0,
        // Survival: day turns to night (and back) while you play
        dayCycle: mode === 'playing' && setup.type === 'survival', dayPhase: rand(0.02, 0.25),
        // Escape: every floor you've visited is kept as its own layer; only the one you're on is simulated
        layers: {}, layerKey: 'street', hq: null, nextReinf: 45000, squads: [], nextSquads: 0,
        traffic: [], fires: [], jets: [], bombs: [], pendingBooms: [],
        world: generateWorld(setup.map || (escape ? 'city' : 'ordinary'), { floors: true }),
        map: setup.map || (escape ? 'city' : 'ordinary'),
        time: 0,
        fighters: [],
        bullets: [],
        particles: [],
        floats: [],
        lootGrid: new Grid(200, 0),
        fgrid: new Grid(128, 0),
        player: null,
        alive: 0,
        cam: { x: W / 2, y: W / 2 },
        shake: 0,
        hurt: 0,
        hitMarker: 0,
        overAt: 0,
        result: null,
        demoFollow: null,
        movingLoot: [],
        stumps: [],
        grenades: [],
        smokes: [],
        cures: [],
        strikes: [],
        mines: [],
        scorches: [],
        airdrops: [],
        nextHyper: rand(...HYPER.first), nextTech: rand(...TECH_DROP.first),
        timeScale: 1,
        zoom: 1,
        viewZoom: 0,
        zoomKick: 0,
        winZoom: 0,
        flash: 0,
        flashColor: '255,209,102',
        streak: 0,
        streakUntil: 0,
        victory: false,
        victoryAge: 0,
        confetti: [],
        zone: { cx: W / 2, cy: W / 2, r: W * 0.72, phase: 0, state: 'wait', timer: ZONE_PHASES[0].wait, dmg: 1, sx: 0, sy: 0, sr: 0, tcx: W / 2, tcy: W / 2, tr: 0 }
    };
    setNextZoneTarget(G.zone);
    // (no red zone at all in Survival or Murder Mystery)
    if (G.noZone || revolution || survival || murder) Object.assign(G.zone, { r: W, tr: W, state: 'final', dmg: 0 });
    // Ghost and Fort Wars are played in one fixed circle in the middle of the map
    const arena = ghostMode ? GHOST.arena : fort ? FORT.arena : 0;
    if (arena) Object.assign(G.zone, { cx: W / 2, cy: W / 2, tcx: W / 2, tcy: W / 2, r: arena, tr: arena, state: 'final', dmg: 2 });
    // (the haunted house has its iron fence instead)
    if (G.world.terrain === 'haunted') Object.assign(G.zone, { r: W, tr: W, state: 'final', dmg: 0 });
    // Early Warfare: no cars parked at the curbs or piled in scrapyards (the map is built before G.early exists)
    if (early) G.world.obstacles = G.world.obstacles.filter(o => { if (!o.car || o.wreck) return true; G.world.grid.removeBox(o); return false; });

    // Cardboard boxes (the only source of guns) in buildings, supply stacks and out in the wild
    // (Murder Mystery has none: the knife and the sheriff's gun are the only weapons)
    if (!murder) for (const s of G.world.lootSpots) {
        if (s.box && !blockedAt(G.world.grid, s.x, s.y, 34)) { addLootBox(s.x, s.y); continue; }
        if (Math.random() > GROUND_LOOT_CHANCE) continue;
        let key = weightedPick(GROUND_TABLE);
        if (s.good) { const k2 = weightedPick(GROUND_TABLE); if (rarityRank(k2) > rarityRank(key)) key = k2; }
        spawnLoot(s.x, s.y, key);
    }
    const caveK = G.world.cave ? 0.12 : 1;  // (the cavern is a lot smaller than the whole world)
    const boxes = murder ? 0 : Math.min(800, 220 + cpuCount * 0.6) * caveK;
    for (let i = 0; i < boxes; i++) {
        const s = findSpawn(null, 0);
        if (!blockedAt(G.world.grid, s.x, s.y, 34) && !buildingAt(s.x, s.y, 30)) addLootBox(s.x, s.y);
    }
    // Supplies lying out in the open are rare; most loot comes from boxes, airdrops and kills
    const scatter = murder ? 0 : Math.min(150, 30 + cpuCount * 0.12) * caveK;
    for (let i = 0; i < scatter; i++) {
        const s = findSpawn(null, 0);
        spawnLoot(s.x, s.y, survival && Math.random() < 0.25 ? pick(['water', 'bucket', 'meat']) : weightedPick(GROUND_TABLE));
    }

    // Buildings can be blown apart in every mode; the rusty facility starts out half wrecked
    initChaos();
    if (G.world.rusty) ruinWorld();
    if (survival) { makePonds(); spawnAnimals(); }
    // (no vehicles at all on the Assassin's wasteland)
    if (setup.map !== 'wasteland' && setup.map !== 'cavern' && !murder && !ghostMode && !fort) spawnCars(); else G.world.cars = [];
    if (revolution) buildRevolution();
    if (fort) spawnFortTeams(W / 2);
    else if (war) {
        spawnTeams(W / 2, setup.baseDist || W * 0.33);
    } else if (escape) {
        // (the title screen sets up its own small breakout instead)
        if (mode === 'playing') spawnEscape(cpuCount, ESCAPE.people);
    } else {
        if (mode === 'playing') addPlayer(findSpawn(null, 0), null);
        const avoid = G.player ? [G.player] : null;
        if (G.player && (zombies || assassin || bossFight || ghostMode)) G.player.team = 0;
        for (let i = 0; i < cpuCount; i++) {
            const s = findSpawn(avoid, 600);
            const same = zombies || assassin || bossFight || ghostMode;
            const b = createFighter(s.x, s.y, { name: botName(i), color: same ? SURVIVOR_COLOR : pick(BOT_COLORS), team: same ? 0 : null });
            if (G.epic) b.chasesDrops = Math.random() < 0.8;
            G.fighters.push(b);
        }
        if (G.epic) scatterSupply(clamp(Math.round(8 + cpuCount / 10), 8, 50), { x: W / 2, y: W / 2 }, W * 0.46);
        if (zombies) spawnHorde(setup.zombies || 0, avoid);
        // Survival: everyone starts scattered across the map
        if (survival && mode === 'playing') arrangeStart();
    }
    if (hightech && setup.map !== 'wasteland' && setup.map !== 'cavern') gearUpHighTech();
    if (revolution) for (const f of G.fighters) f.hp = f.maxHp = REVO.hp;
    if (assassin && mode === 'playing') { spreadOut(); pickAssassin(setup.role === 'assassin' ? G.player : null); }
    if (bossFight) setupBossFight();
    if (murder && mode === 'playing') setupMurder(setup.role);
    if (ghostMode && mode === 'playing') setupGhost(setup.role === 'ghost' ? G.player : null);
    G.alive = G.fighters.length;
}

// Everyone scattered round the circle the game is played in
function placeInArena(R, apart) {
    const W = CONFIG.WORLD_SIZE, c = W / 2, placed = [];
    for (const f of G.fighters) {
        let best = null, bestD = -1;
        for (let t = 0; t < 40; t++) {
            const a = rand(0, TAU), d = Math.sqrt(Math.random()) * (R - 150), x = c + Math.cos(a) * d, y = c + Math.sin(a) * d;
            if (blockedAt(G.world.grid, x, y, 36)) continue;
            let m = Infinity;
            for (const q of placed) m = Math.min(m, Math.hypot(q.x - x, q.y - y));
            if (m > bestD) { bestD = m; best = { x, y }; }
            if (m >= apart) break;
        }
        if (!best) continue;
        placed.push(best);
        f.x = best.x; f.y = best.y; f.vx = f.vy = 0;
    }
    if (G.player) { G.cam.x = G.player.x; G.cam.y = G.player.y; }
}
const arenaR = () => (G.murder ? MURDER.arena : G.world.terrain === 'haunted' ? HAUNT.half + 50 : G.zone.r) - 200;
const arenaPoint = (R = arenaR()) => { const c = CONFIG.WORLD_SIZE / 2; for (let t = 0; t < 20; t++) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * R, x = c + Math.cos(a) * d, y = c + Math.sin(a) * d; if (!blockedAt(G.world.grid, x, y, 30)) return { x, y }; } return { x: c, y: c }; };
// A bot strolling about the circle: a new spot every so often
function strollArena(b) {
    if (b.mode !== 'zone' || !b.goal || b.goal.huntOf || dist(b, b.goal) < 60 || G.time > (b.strollUntil || 0)) {
        b.mode = 'zone'; b.goal = arenaPoint(); b.strollUntil = G.time + rand(5000, 11000);
    }
}

// ---------- Murder Mystery ----------
// One murderer with a knife, one sheriff with a gun, everyone else innocent - and nobody knows who's who.
// The knife kills in one stab and the sheriff's gun in one shot. Anyone who sees the knife out knows who the murderer is.
// If the sheriff shoots an innocent, the sheriff dies too and drops the gun: whoever picks it up is the new sheriff.
// Innocents win if the murderer goes down or the time runs out; the murderer wins if nobody else is left.
const MURDER = { arena: 1500, time: 180000, sight: 560, cool: [4000, 8000], lonely: 380, maxPlayers: 40 };
const MURDER_ROLE = { murderer: 'MURDERER', sheriff: 'SHERIFF', innocent: 'INNOCENT' };
function setupMurder(role) {
    placeInArena(MURDER.arena, 260);
    const p = G.player, others = G.fighters.filter(f => f !== p);
    if (role === 'random') role = pick(['murderer', 'sheriff', ...Array(Math.max(1, G.fighters.length - 2)).fill('innocent')]);
    const m = role === 'murderer' ? p : pick(others);
    const s = role === 'sheriff' ? p : pick(others.filter(f => f !== m));
    m.murderer = true; m.inv = [null, 'Dagger']; m.slot = 0;
    if (s) { s.sheriff = true; s.inv = [null, 'Pistol']; s.slot = 1; equipNew(s, 'Pistol'); }
    G.murdererF = m;
    G.murderEnd = MURDER.time;
}
const murderRole = f => f.murderer ? 'murderer' : f.sheriff ? 'sheriff' : 'innocent';
// The knife kills in one stab and the sheriff's gun in one shot; punches barely hurt
function murderDamage(t, amount, attacker, weapon) {
    if (!attacker || attacker === t) return amount;
    if (weapon === 'Dagger' && attacker.murderer) return 999;
    if (weapon === 'Pistol') return 999;
    if (weapon === 'Fist') return Math.min(amount, 3);
    return amount;
}
function murderDeath(t, killer) {
    // The gun falls to the ground when the sheriff goes down
    if (t.inv.includes('Pistol')) {
        const [l] = dropItems(t.x, t.y, [{ key: 'Pistol' }], 0.4);
        G.murderGun = l;
        if (G.mode === 'playing' && !G.result) showBanner('THE SHERIFF IS DOWN', true, 'The gun is on the ground. Whoever picks it up is the new sheriff!');
    }
    // Shot an innocent: the sheriff pays for it
    if (killer && killer !== t && killer.sheriff && !t.murderer && !killer.dead) G.guilty = killer;
}
function updateMurder(dt) {
    if (G.mode !== 'playing') return;
    const m = G.murdererF;
    if (G.guilty) {
        const k = G.guilty; G.guilty = null;
        if (!k.dead) { addFloat(k.x, k.y - 40, 'SHOT AN INNOCENT!', '#ff5a5f', true); k.guiltyDeath = true; killFighter(k, null, 'Shot an innocent'); }
    }
    // Whoever picks up the gun becomes the sheriff
    for (const f of G.fighters) if (!f.dead && !f.sheriff && !f.murderer && f.inv.includes('Pistol')) {
        f.sheriff = true; f.knows = false;
        if (f.isPlayer) showBanner("YOU'RE THE SHERIFF NOW", true, 'One shot kills. Shoot the murderer, but if you shoot an innocent, you die too!');
        else if (G.player && !G.player.dead) addFloat(f.x, f.y - 40, 'NEW SHERIFF', '#7fd4ff', true);
    }
    // Anyone who sees the knife out knows who the murderer is
    if (m && !m.dead && held(m) === 'Dagger' && G.time >= (G.nextWitness || 0)) {
        G.nextWitness = G.time + 200;
        G.fgrid.query(m.x, m.y, MURDER.sight, f => { if (f !== m && !f.dead && !f.knows && Math.hypot(f.x - m.x, f.y - m.y) < MURDER.sight && lineOfSight(f, m)) f.knows = true; });
    }
    if (G.result) return;
    const p = G.player, left = G.fighters.filter(f => !f.dead && !f.murderer).length;
    let won = null, title, sub;
    if (!m || m.dead) { won = !p.murderer; title = p.murderer ? 'YOU WERE STOPPED' : 'THE MURDERER IS DOWN!'; sub = m && m.killedBy ? `${m.killedBy === p ? 'You' : m.killedBy.name} took out the murderer${p.murderer ? '' : ` (${m.name})`}.` : 'The murderer is gone.'; }
    else if (left === 0) { won = !!p.murderer; title = p.murderer ? 'NOBODY IS LEFT' : 'THE MURDERER WINS'; sub = p.murderer ? 'You got every last one of them.' : `It was ${m.name}.`; }
    else if (G.time >= G.murderEnd) { won = !p.murderer; title = p.murderer ? "TIME'S UP" : 'SURVIVED!'; sub = p.murderer ? `${left} got away.` : `The murderer was ${m.name}. ${left} made it.`; }
    if (won === null) return;
    if (!won && p.dead) return;  // (you already lost)
    G.result = { won, place: won ? 1 : 2, title, sub };
    G.overAt = G.time + 2400;
    if (won) startVictory(sub); else { G.timeScale = 0.3; canvas.classList.add('dead'); Sound.death(); }
}
// The bots: the murderer stalks anyone on their own, the sheriff hunts the murderer once spotted,
// innocents stroll about, run from a murderer they've seen and go for a dropped gun
function murderBot(b) {
    b.nextThink = G.time + rand(150, 300);
    const m = G.murdererF, gun = G.murderGun;
    if (!b.murderer && !b.sheriff && gun && !gun.gone && dist(b, gun) < 900 && !(b.knows && m && !m.dead && dist(m, gun) < 250)) { b.mode = 'loot'; b.goal = gun; return; }
    if (b.murderer) {
        const v = b.victim;
        if (v && !v.dead && G.time < b.huntUntil) {
            const d = dist(b, v);
            if (d < 170 && lineOfSight(b, v)) {
                if (b.slot !== 1) switchSlot(b, 1);
                if (b.target !== v) b.engageAt = G.time + 120;
                b.mode = 'fight'; b.target = v; b.hasLOS = true;
            } else {
                if (b.slot !== 0) switchSlot(b, 0);
                b.mode = 'zone'; b.goal = { x: v.x, y: v.y, huntOf: v };
            }
            return;
        }
        if (v) { b.victim = null; b.nextKill = G.time + rand(...MURDER.cool); }
        if (b.slot !== 0) switchSlot(b, 0);
        if (G.time >= (b.nextKill || 0)) {
            // Someone on their own, with nobody else close enough to see
            let best = null, bd = 900;
            for (const f of G.fighters) {
                if (f === b || f.dead) continue;
                const d = dist(b, f);
                if (d > bd) continue;
                let lonely = true;
                G.fgrid.query(f.x, f.y, MURDER.lonely, q => { if (q !== f && q !== b && !q.dead && Math.hypot(q.x - f.x, q.y - f.y) < MURDER.lonely) lonely = false; });
                if (lonely) { bd = d; best = f; }
            }
            if (best) { b.victim = best; b.huntUntil = G.time + 9000; return; }
        }
        strollArena(b);
        return;
    }
    if (b.sheriff && m && !m.dead && b.knows) {
        const d = dist(b, m);
        if (d < 600 && lineOfSight(b, m) && clearShot(b, m)) {
            if (b.target !== m) b.engageAt = G.time + rand(250, 500);
            b.mode = 'fight'; b.target = m; b.hasLOS = true; b.lastSeen = G.time;
        } else { b.mode = 'zone'; b.goal = { x: m.x, y: m.y, huntOf: m }; b.target = null; }
        return;
    }
    if (b.knows && m && !m.dead && dist(b, m) < 650) { b.mode = 'flee'; b.target = m; b.fleeUntil = G.time + 3000; return; }
    strollArena(b);
}

// A bot sheriff only fires with nobody else in the way or right beside the murderer
function clearShot(b, m) {
    const dx = m.x - b.x, dy = m.y - b.y, L2 = dx * dx + dy * dy || 1;
    for (const f of G.fighters) {
        if (f === b || f === m || f.dead) continue;
        const t = clamp(((f.x - b.x) * dx + (f.y - b.y) * dy) / L2, 0, 1.15);
        if (Math.hypot(b.x + dx * t - f.x, b.y + dy * t - f.y) < f.r + 26) return false;
    }
    return true;
}

// ---------- Ghost ----------
// One ghost nobody can see: it only shows for a moment when it shoots or gets hit, and leaves glowing footprints.
// Pitch dark; the hunters have flashlights and guns. The ghost is quick and tough, with a shotgun that never runs out.
const GHOST = { arena: 2300, hp: 500, hpPer: 55, regen: 20, speed: 1.22, reveal: 600, step: 34, stepLife: 7000, track: 420, maxPlayers: 60 };
const ghostSeen = f => G.time - (f.lastShot || -1e9) < GHOST.reveal;
function setupGhost(who) {
    placeInArena(GHOST.arena, 500);
    const g = who || pick(G.fighters.filter(f => !f.isPlayer));
    if (!g) return;
    g.ghost = true; g.team = 1; if (!g.isPlayer) g.name = 'The Ghost'; g.color = '#d8f4ff'; g.dark = shade(g.color, -0.45); g.light = shade(g.color, 0.35);
    // (tougher the more hunters there are)
    g.hp = g.maxHp = GHOST.hp + GHOST.hpPer * (G.fighters.length - 1);
    g.inv[0] = 'Shotgun'; g.slot = 0; g.ammo.Shotgun = 9999;
    G.ghostF = g;
    // The hunters start armed
    for (const f of G.fighters) if (f !== g) { applyLoot(f, pick(['Assault Rifle', 'Shotgun', 'Mac10', 'Machine Gun']), -1); f.items.bandage = 3; }
}
function updateGhost(dt) {
    const g = G.ghostF;
    if (g && !g.dead) {
        g.ammo.Shotgun = 9999;
        // Out of the fight for a moment, it heals
        if (G.time - g.lastHurt > 3000) g.hp = Math.min(g.maxHp, g.hp + GHOST.regen * dt);
        // Footprints, left and right, wherever it walks
        if (!g.lastStep) g.lastStep = { x: g.x, y: g.y, side: 1 };
        if (Math.hypot(g.x - g.lastStep.x, g.y - g.lastStep.y) > GHOST.step) {
            const a = Math.atan2(g.y - g.lastStep.y, g.x - g.lastStep.x), side = -g.lastStep.side;
            G.ghostSteps.push({ x: g.x - Math.sin(a) * 6 * side, y: g.y + Math.cos(a) * 6 * side, a, t: G.time });
            g.lastStep = { x: g.x, y: g.y, side };
        }
    }
    if (G.ghostSteps.length && G.time - G.ghostSteps[0].t > GHOST.stepLife) G.ghostSteps = G.ghostSteps.filter(s => G.time - s.t < GHOST.stepLife);
    if (G.mode !== 'playing' || G.result) return;
    const p = G.player, left = G.fighters.filter(f => !f.dead && !f.ghost).length;
    let won = null, title, sub;
    if (!g || g.dead) { won = !p.ghost; title = p.ghost ? 'BANISHED!' : 'GHOST BANISHED!'; sub = g && g.killedBy ? `${g.killedBy === p ? 'You' : g.killedBy.name} got the ghost.` : 'The ghost is gone.'; }
    else if (left === 0) { won = !!p.ghost; title = p.ghost ? 'THE HAUNTING IS COMPLETE' : 'THE GHOST WINS'; sub = p.ghost ? 'Not one hunter is left.' : 'Every hunter is gone.'; }
    if (won === null) return;
    if (!won && p.dead) return;
    G.result = { won, place: won ? 1 : 2, title, sub };
    G.overAt = G.time + 2400;
    if (won) startVictory(sub); else { G.timeScale = 0.3; canvas.classList.add('dead'); Sound.death(); }
}
// The ghost bot haunts: it creeps up on a hunter who's on their own, blasts them up close,
// and slips away to heal when it's hurt or too many hunters are round it
function ghostBot(b) {
    b.nextThink = G.time + rand(150, 280);
    if (G.time < (b.slipUntil || 0) && b.goal) { b.mode = 'zone'; return; }
    let crowd = 0;
    G.fgrid.query(b.x, b.y, 450, f => { if (!f.dead && !f.ghost && Math.hypot(f.x - b.x, f.y - b.y) < 450) crowd++; });
    if (b.hp < b.maxHp * 0.45 || crowd >= 4) {
        // slip away: somewhere in the circle well away from here
        let best = null, bd = -1;
        for (let i = 0; i < 6; i++) { const q = arenaPoint(); const d = dist(q, b); if (d > bd) { bd = d; best = q; } }
        b.mode = 'zone'; b.goal = best; b.slipUntil = G.time + rand(4000, 7000); b.victim = null;
        return;
    }
    let v = b.victim;
    if (!v || v.dead || G.time > (b.huntUntil || 0)) {
        v = null; let bd = Infinity;
        for (const f of G.fighters) {
            if (f.dead || f.ghost) continue;
            let near = 0;
            G.fgrid.query(f.x, f.y, 350, q => { if (q !== f && !q.dead && !q.ghost && Math.hypot(q.x - f.x, q.y - f.y) < 350) near++; });
            const d = dist(b, f) * (1 + near * 0.8);
            if (d < bd) { bd = d; v = f; }
        }
        b.victim = v; b.huntUntil = G.time + 10000;
    }
    if (!v) { strollArena(b); return; }
    const d = dist(b, v);
    if (d < 230 && lineOfSight(b, v)) {
        if (b.target !== v) b.engageAt = G.time + 150;
        b.mode = 'fight'; b.target = v; b.hasLOS = true;
    } else { b.mode = 'zone'; b.goal = { x: v.x, y: v.y, huntOf: v }; }
}
// The freshest footprint a hunter is close enough to notice
function freshStep(b) {
    let best = null;
    for (let i = G.ghostSteps.length - 1; i >= 0 && i > G.ghostSteps.length - 120; i--) {
        const s = G.ghostSteps[i];
        if (G.time - s.t > GHOST.stepLife * 0.6) break;
        if (Math.hypot(s.x - b.x, s.y - b.y) < GHOST.track) { best = s; break; }
    }
    return best;
}
// Footprints glow pale blue in the dark (drawn on top of the darkness)
function drawGhostSteps(camX, camY, zoom) {
    if (!G.ghostSteps.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of G.ghostSteps) {
        const sx = (s.x - camX) * zoom, sy = (s.y - camY) * zoom;
        if (sx < -20 || sy < -20 || sx > viewW + 20 || sy > viewH + 20) continue;
        const k = 1 - (G.time - s.t) / GHOST.stepLife;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(s.a);
        ctx.fillStyle = `rgba(120,200,255,${0.35 * k})`;
        ctx.beginPath(); ctx.ellipse(0, 0, 9 * zoom, 5 * zoom, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(210,240,255,${0.8 * k})`;
        ctx.beginPath(); ctx.ellipse(1.5 * zoom, 0, 5 * zoom, 2.6 * zoom, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(-4 * zoom, 0, 1.8 * zoom, 0, TAU); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
}

// ---------- Fort Wars ----------
// Two teams, a glowing wall down the middle. For the first 2 minutes nobody can fight: everyone builds a fort out of
// wooden walls and crates. Everyone has an axe: chop trees for wood, then spend it on walls (your team's bots chop and build too).
// Then the wall drops and it's war - and the forts can be shot and blown apart.
const FORT = { build: 120000, dist: 950, arena: 2300, hp: 320, crateHp: 220, reach: 190, gap: 30, chop: 2, fell: 8, fist: 1, wall: 4, crate: 6, startWood: 8, trees: 26 };
function spawnFortTeams(cx) {
    const { size } = G.war, bases = [{ x: cx - FORT.dist, y: cx }, { x: cx + FORT.dist, y: cx }];
    let n = 0;
    for (let t = 0; t < 2; t++) {
        const base = bases[t];
        for (let i = 0; i < size; i++) {
            const s = spawnNear(base, 160 + Math.sqrt(size) * 40, 30);
            if (t === 0 && i === 0 && G.mode === 'playing') { addPlayer(s, 0); continue; }
            const b = createFighter(s.x, s.y, { name: botName(n++), color: TEAMS[t].color, team: t });
            G.fighters.push(b);
        }
        G.teamAlive[t] = size;
        scatterSupply(G.mode === 'demo' ? 2 : Math.min(10, 3 + Math.floor(size / 8)), base, 260);
    }
    G.fort = { build: true, cx, bases, plans: bases.map((b, t) => fortPlan(b, t)), next: [0, 0], placed: [0, 0], wood: [FORT.startWood * 2, FORT.startWood * 2] };
    // Everyone starts holding an axe
    for (const f of G.fighters) { f.inv[1] = 'Axe'; f.slot = 1; f.wood = FORT.startWood; }
    // A wood behind each base to chop (plus whatever trees the map already has on your side)
    G.fort.trees = bases.map((b, t) => fortGrove(b, t));
}
function fortGrove(base, t) {
    const F = G.fort, s = t === 0 ? 1 : -1;
    for (let i = 0, made = 0; i < FORT.trees * 6 && made < FORT.trees; i++) {
        const behind = Math.random() < 0.65;
        const x = behind ? base.x - s * rand(380, 900) : base.x + s * rand(-300, 330);
        const y = base.y + (behind ? rand(-850, 850) : (Math.random() < 0.5 ? -1 : 1) * rand(480, 850));
        const canopy = rand(70, 100), r = canopy * 0.27;
        if (Math.hypot(x - F.cx, y - F.cx) > FORT.arena - 160 || blockedAt(G.world.grid, x, y, r + 45) || buildingAt(x, y, 40)) continue;
        const o = { type: 'tree', x, y, r, canopy, spr: randInt(0, 7), rot: rand(0, TAU), hp: TREE_HP, maxHp: TREE_HP, hitAt: -9999 };
        G.world.obstacles.push(o); G.world.grid.insert(o);
        made++;
    }
    // Every tree on this side near the base: the bots' woodpile
    return G.world.obstacles.filter(o => o.type === 'tree' && !o.broken && (t === 0 ? o.x < F.cx - 60 : o.x > F.cx + 60) && Math.hypot(o.x - base.x, o.y - base.y) < 1300);
}
// Chopping a tree during the build gives wood: the player keeps their own, bots put theirs in the team's pile
function fortChopped(f, o) {
    const w = WEAPONS[held(f)], n = (w && w.blade === 'axe' ? FORT.chop : FORT.fist) + (o.hp <= 0 ? FORT.fell : 0);
    if (f.isPlayer) { f.wood = (f.wood || 0) + n; addFloat(o.x, o.y - o.r - 10, `+${n} wood`, '#e6b97a'); }
    else G.fort.wood[f.team] += n;
}
// Is there a tree right in front of you, close enough to chop?
function fortTreeAhead(f) {
    let found = null;
    G.world.grid.query(f.x, f.y, 140, o => {
        if (found || o.type !== 'tree' || o.broken) return;
        if (Math.hypot(f.x - o.x, f.y - o.y) - o.r > 86) return;
        if (Math.abs(angleDiff(f.angle, Math.atan2(o.y - f.y, o.x - f.x))) <= 1.1) found = o;
    });
    return found;
}
// What each team's bots build: a front wall with two doorways, a second wall behind the doors, side walls, crates for cover
function fortPlan(base, t) {
    const s = t === 0 ? 1 : -1, out = [];
    for (let i = -4; i <= 4; i++) if (i !== -2 && i !== 2) out.push({ x: base.x + s * 300, y: base.y + i * 80, hw: 12, hh: 40 });
    for (const y of [-160, 160]) out.push({ x: base.x + s * 190, y: base.y + y, hw: 12, hh: 40 });
    for (const side of [-1, 1]) for (let k = 0; k < 5; k++) out.push({ x: base.x + s * (260 - k * 80), y: base.y + side * 380, hw: 40, hh: 12 });
    for (let i = 0; i < 6; i++) out.push({ x: base.x + s * rand(-60, 220), y: base.y + rand(-300, 300), hw: 20, hh: 20, crate: true });
    // then an outer front wall, the side walls carried round the back, and a back wall (with two back doors)
    for (let i = -6; i <= 6; i++) if (i !== -3 && i !== 3) out.push({ x: base.x + s * 430, y: base.y + i * 80, hw: 12, hh: 40 });
    for (const side of [-1, 1]) for (let k = 5; k < 9; k++) out.push({ x: base.x + s * (260 - k * 80), y: base.y + side * 380, hw: 40, hh: 12 });
    for (let i = -4; i <= 4; i++) if (i !== -2 && i !== 2) out.push({ x: base.x - s * 340, y: base.y + i * 80, hw: 12, hh: 40 });
    for (let i = 0; i < 6; i++) out.push({ x: base.x + s * rand(-280, 380), y: base.y + rand(-330, 330), hw: 20, hh: 20, crate: true });
    return out;
}
// Can a block go here? false = never (wrong side, in a wall...), 'busy' = someone's standing there right now
function fortSpot(x, y, hw, hh, team) {
    const F = G.fort;
    if (team === 0 ? x + hw > F.cx - FORT.gap : x - hw < F.cx + FORT.gap) return false;
    if (Math.hypot(x - F.cx, y - F.cx) > FORT.arena - 80) return false;
    for (const [px, py] of [[x, y], [x - hw, y - hh], [x + hw, y + hh], [x - hw, y + hh], [x + hw, y - hh]]) if (blockedAt(G.world.grid, px, py, 4)) return false;
    let hit = false;
    G.fgrid.query(x, y, Math.max(hw, hh) + 30, f => { if (!f.dead && Math.abs(f.x - x) < hw + f.r && Math.abs(f.y - y) < hh + f.r) hit = true; });
    return hit ? 'busy' : true;
}
const fortSpotOk = (x, y, hw, hh, team) => fortSpot(x, y, hw, hh, team) === true;
function addFortBlock(x, y, hw, hh, team, crate) {
    const o = crate
        ? { type: 'crate', fortBlock: true, x, y, hw, hh, hp: FORT.crateHp, maxHp: FORT.crateHp, hitAt: -9999, team }
        : { type: 'wall', planks: true, fortBlock: true, x, y, hw, hh, color: '#8a5a32', seed: randInt(1, 1e9), hp: FORT.hp, maxHp: FORT.hp, hitAt: -9999, team };
    G.world.obstacles.push(o);
    G.world.grid.insertBox(o);
    if (inView(x, y, 100)) { burst(x, y, 8, '#c08a55', 120); G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: Math.max(hw, hh) * 1.3, color: '#fff2c8' }); }
    return o;
}
function damageFortBlock(o, dmg) {
    if (o.broken) return;
    o.hp -= dmg; o.hitAt = G.time;
    if (o.hp > 0) return;
    o.broken = true;
    G.world.grid.removeBox(o);
    const i = G.world.obstacles.indexOf(o);
    if (i >= 0) G.world.obstacles.splice(i, 1);
    if (inView(o.x, o.y, 100)) {
        const cols = o.type === 'crate' ? ['#c89b6d', '#a87b4f', '#e6cfa3'] : ['#8a5a32', '#a8743f', '#5e3a1e', '#c08a55'];
        for (let k = 0; k < 14; k++) { const a = rand(0, TAU), sp = rand(80, 260); G.particles.push({ type: 'chunk', x: o.x + rand(-o.hw, o.hw), y: o.y + rand(-o.hh, o.hh), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 0.9), max: 0.9, size: rand(4, 8), color: pick(cols), rot: rand(0, TAU), spin: rand(-12, 12) }); }
        Sound.crunch(Sound.volAt(o.x, o.y));
    }
}
// Where your next block would go: in front of you where you're aiming, turned across your aim
function fortAim(p, m) {
    const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy) || 1, r = Math.min(FORT.reach, Math.max(60, d));
    const x = p.x + dx / d * r, y = p.y + dy / d * r, across = Math.abs(dx) > Math.abs(dy);
    return { x, y, hw: across ? 12 : 40, hh: across ? 40 : 12 };
}
function placeFortBlock(p, m) {
    if (G.time < (p.nextBuild || 0)) return;
    p.nextBuild = G.time + 220;
    if (!((p.wood || 0) >= FORT.wall)) { p.nextBuild = G.time + 900; addFloat(p.x, p.y - 34, `Need ${FORT.wall} wood: chop a tree`, '#ff8fa3'); Sound.empty(); return; }
    const a = fortAim(p, m);
    if (!fortSpotOk(a.x, a.y, a.hw, a.hh, p.team)) { Sound.empty(); return; }
    addFortBlock(a.x, a.y, a.hw, a.hh, p.team, false);
    p.wood -= FORT.wall;
    Sound.thud(0.25);
}
function updateFort(dt) {
    const F = G.fort;
    if (!F || !F.build) return;
    // Felled trees grow back so there's always wood to chop
    if (F.regrow) for (let i = F.regrow.length - 1; i >= 0; i--) {
        const g = F.regrow[i], o = g.o;
        if (G.time < g.at) continue;
        let busy = false;
        G.fgrid.query(o.x, o.y, o.r + 30, f => { if (!f.dead && Math.hypot(f.x - o.x, f.y - o.y) < o.r + f.r) busy = true; });
        if (busy || blockedAt(G.world.grid, o.x, o.y, o.r)) { g.at = G.time + 2000; continue; }
        F.regrow.splice(i, 1);
        o.broken = false; o.hp = o.maxHp; o.hitAt = -9999;
        G.world.grid.insert(o);
        const si = G.stumps.findIndex(q => q.x === o.x && q.y === o.y);
        if (si >= 0) G.stumps.splice(si, 1);
        if (inView(o.x, o.y, 200)) for (let k = 0; k < 14; k++) { const a = rand(0, TAU), sp = rand(30, 120); G.particles.push({ type: 'leaf', x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 1), max: 1, size: rand(3, 6), color: pick(['#5ea84a', '#77c25a']), rot: rand(0, TAU), spin: rand(-8, 8) }); }
    }
    // Nobody crosses the glowing wall while building
    for (const f of G.fighters) {
        if (f.dead) continue;
        if (f.team === 0 && f.x > F.cx - FORT.gap + 6) { f.x = F.cx - FORT.gap + 6; f.vx = Math.min(0, f.vx); }
        if (f.team === 1 && f.x < F.cx + FORT.gap - 6) { f.x = F.cx + FORT.gap - 6; f.vx = Math.max(0, f.vx); }
    }
    // The bots put their fort up, a piece at a time
    for (let t = 0; t < 2; t++) {
        const plan = F.plans[t];
        if (F.next[t] >= plan.length || G.time < (F.at || (F.at = [0, 0]))[t]) continue;
        const q = plan[F.next[t]], cost = q.crate ? FORT.crate : FORT.wall;
        if (F.wood[t] < cost) continue;
        const ok = fortSpot(q.x, q.y, q.hw, q.hh, t);
        // (someone in the way: try again in a moment, and shoo them off it)
        if (ok === 'busy') { F.at[t] = G.time + 400; G.fgrid.query(q.x, q.y, 90, f => { if (!f.isPlayer && f.team === t && !f.dead) { f.mode = 'zone'; f.goal = { x: F.bases[t].x + rand(-120, 120), y: F.bases[t].y + rand(-150, 150) }; f.strollUntil = G.time + 2500; } }); continue; }
        F.next[t]++;
        F.at[t] = G.time + FORT.build * 0.75 / plan.length;
        if (!ok) continue;
        F.wood[t] -= cost;
        addFortBlock(q.x, q.y, q.hw, q.hh, t, q.crate);
        // (the nearest builder runs over to it)
        let bb = null, bd = Infinity;
        for (const f of G.fighters) if (!f.dead && !f.isPlayer && f.team === t) { const d = dist(f, q); if (d < bd) { bd = d; bb = f; } }
        if (bb) { bb.mode = 'zone'; bb.goal = { x: q.x - (t === 0 ? 50 : -50), y: q.y }; bb.strollUntil = G.time + 2500; }
    }
    const left = FORT.build - G.time;
    if (left <= 10000 && !F.warned && G.mode === 'playing') { F.warned = true; showBanner('10 SECONDS!', true, 'The wall is about to drop. Get behind your fort!'); }
    if (left <= 0) {
        F.build = false;
        if (G.mode === 'playing') { showBanner('FIGHT!', true, 'The wall is down. Destroy their fort and wipe them out!'); Sound.tone(220, 0.6, 'sawtooth', 0.12, 110); }
        for (const f of G.fighters) if (!f.isPlayer && f.mode === 'zone') { f.mode = 'wander'; f.nextThink = G.time; }
    }
}
// While building, bots stay in their own half round their base
function fortBot(b) {
    const F = G.fort, base = F.bases[b.team];
    if (b.mode === 'zone' && b.goal && G.time < (b.strollUntil || 0) && dist(b, b.goal) > 40 && !b.chopTree) return;
    // Until the fort's done, most of the team are off chopping wood
    if (F.next[b.team] < F.plans[b.team].length && (b.lumberjack ?? (b.lumberjack = Math.random() < Math.min(0.8, 10 / G.war.size)))) {
        let tr = b.chopTree;
        if (!tr || tr.broken) {
            const near = F.trees[b.team].filter(o => !o.broken).sort((p, q) => dist(b, p) - dist(b, q)).slice(0, 5);
            tr = b.chopTree = near.length ? pick(near) : null;
        }
        if (tr) {
            const d = Math.hypot(b.x - tr.x, b.y - tr.y) || 1;
            b.nextThink = G.time + rand(150, 260);
            if (d - tr.r < 70) {
                b.mode = 'zone'; b.goal = { x: b.x, y: b.y }; b.strollUntil = 0;
                const ax = b.inv.indexOf('Axe');
                if (ax >= 0) b.slot = ax;
                b.angle = Math.atan2(tr.y - b.y, tr.x - b.x);
                tryAttack(b);
            } else {
                b.mode = 'zone'; b.goal = { x: tr.x + (b.x - tr.x) / d * (tr.r + b.r + 12), y: tr.y + (b.y - tr.y) / d * (tr.r + b.r + 12) };
                b.strollUntil = G.time + 4000;
            }
            return;
        }
    }
    b.chopTree = null;
    // (behind where the front wall goes, inside the side walls)
    const s = b.team === 0 ? 1 : -1;
    b.mode = 'zone'; b.goal = { x: base.x + s * rand(-260, 130), y: base.y + rand(-300, 300) };
    b.strollUntil = G.time + rand(3000, 7000);
}
// The glowing wall down the middle, the build preview, and the health of blocks under fire
function drawFort() {
    const F = G.fort;
    if (!F) return;
    if (F.build) {
        const top = F.cx - FORT.arena, bot = F.cx + FORT.arena, pu = 0.6 + 0.4 * Math.sin(G.time / 300);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(F.cx - 30, 0, F.cx + 30, 0);
        g.addColorStop(0, 'rgba(80,200,255,0)'); g.addColorStop(0.5, `rgba(120,220,255,${0.45 * pu})`); g.addColorStop(1, 'rgba(80,200,255,0)');
        ctx.fillStyle = g; ctx.fillRect(F.cx - 30, top, 60, bot - top);
        ctx.fillStyle = `rgba(220,245,255,${0.7 * pu})`; ctx.fillRect(F.cx - 1.5, top, 3, bot - top);
        ctx.restore();
        const p = G.player;
        if (p && !p.dead && G.mode === 'playing' && (p.wood || 0) >= FORT.wall && !fortTreeAhead(p)) {
            const a = fortAim(p, inputOf(p).world()), ok = fortSpotOk(a.x, a.y, a.hw, a.hh, p.team);
            ctx.fillStyle = ok ? 'rgba(120,255,150,0.3)' : 'rgba(255,90,90,0.3)';
            ctx.strokeStyle = ok ? 'rgba(160,255,180,0.9)' : 'rgba(255,120,120,0.9)'; ctx.lineWidth = 2;
            ctx.fillRect(a.x - a.hw, a.y - a.hh, a.hw * 2, a.hh * 2); ctx.strokeRect(a.x - a.hw, a.y - a.hh, a.hw * 2, a.hh * 2);
        }
    }
    for (const o of G.world.obstacles) if (o.fortBlock && G.time - o.hitAt < 2000) drawPlantHealth(o, o.y - o.hh - 12);
}

// ---------- Assassin ----------
// One fighter is the assassin: a Barrett with 2000 rounds (a Railgun in High Tech) and a medkit.
// He looks just like everyone else in the dark. Any survivor that touches him catches him.
const ASSASSIN = { ammo: 2000, catchGap: 10, apart: 650, spawnApart: 900 };
function pickAssassin(who) {
    const a = who || pick(G.fighters.filter(f => !f.isPlayer));
    if (!a) return;
    a.assassin = true;
    a.team = 1;
    const gun = G.hightech ? 'Railgun' : 'Barrett';
    a.inv[0] = gun; a.slot = 0;
    a.ammo[gun] = ASSASSIN.ammo;
    a.items.medkit = 1;
    G.assassinF = a;
}
// Everyone starts well apart from everyone else, all over the map
function spreadOut() {
    const placed = [], W = CONFIG.WORLD_SIZE;
    for (const f of G.fighters) {
        let best = null, bestD = -1;
        for (let t = 0; t < 30; t++) {
            const x = rand(250, W - 250), y = rand(250, W - 250);
            if (blockedAt(G.world.grid, x, y, 40) || buildingAt(x, y)) continue;
            let d = Infinity;
            for (const q of placed) { d = Math.min(d, Math.hypot(q.x - x, q.y - y)); if (d < bestD) break; }
            if (d > bestD) { bestD = d; best = { x, y }; }
            if (d >= ASSASSIN.spawnApart) break;
        }
        if (!best) continue;
        placed.push(best);
        f.x = best.x; f.y = best.y; f.vx = f.vy = 0;
    }
    if (G.player) { G.cam.x = G.player.x; G.cam.y = G.player.y; }
}
// A survivor right up against the assassin catches him
function checkAssassinCaught() {
    const a = G.assassinF;
    if (!a || a.dead) return;
    let by = null;
    G.fgrid.query(a.x, a.y, a.r * 2 + ASSASSIN.catchGap + 10, f => { if (!by && f !== a && !f.dead && f.team === 0 && Math.hypot(f.x - a.x, f.y - a.y) < f.r + a.r + ASSASSIN.catchGap) by = f; });
    if (!by) return;
    a.caughtBy = by;
    addFloat(a.x, a.y - 40, 'CAUGHT!', '#ffd166', true);
    burst(a.x, a.y, 24, '#ffd166', 240, 'glow');
    killFighter(a, by, 'Caught');
}

// ---------- Boss Fight ----------
// Everyone against one giant: a minigun and a rocket launcher, a stomp that throws you back, and lots of health.
// At half health he calls in helpers and gets angry; at a quarter he calls in more.
const BOSS = {
    r: 46, hpBase: 3000, hpPer: 600, armor: 400, takes: 0.35, dmgMul: 0.25, speed: 0.95, rageSpeed: 1.2, color: '#5a1620',
    guns: { normal: ['Minigun', 'Rocket Launcher'], heavy: ['Minigun', 'Rocket Launcher'], hightech: ['Minigun of Doom', 'Homing Launcher'], early: ['War Hammer', 'Longbow'] },
    spray: 4500, rockets: 2600,  // how long he sprays the minigun, then how long he fires rockets
    stomp: { every: 5000, reach: 190, dmg: 22, push: 900 },
    waves: [{ at: 0.5, n: 4, title: 'HE CALLED FOR HELP!', sub: 'Guards are coming, and he\'s angry now!' },
            { at: 0.25, n: 5, title: 'LAST STAND!', sub: 'More guards! Finish him off!' }],
    allyGuns: ['Assault Rifle', 'Machine Gun', 'Shotgun', 'Sniper', 'Vector', 'Heavy MG', 'Mac10'],
    allyHigh: ['Plasma Rifle', 'Tesla Cannon', 'Laser Beam', 'Railgun'], allyEarly: ['Longbow', 'Crossbow', 'Spear', 'Sword', 'Bow'],
    ring: [700, 1300]
};
const ALLY_COLOR = '#3d8bff';
function setupBossFight() {
    const W = CONFIG.WORLD_SIZE, c = spawnNear({ x: W / 2, y: W / 2 }, 400, BOSS.r + 30, true);
    const allies = G.fighters.filter(f => !f.isPlayer);
    const b = createFighter(c.x, c.y, { name: 'THE BOSS', color: BOSS.color, team: 1 });
    const hp = BOSS.hpBase + BOSS.hpPer * (allies.length + 1);
    Object.assign(b, { boss: true, giant: true, r: BOSS.r, hp, maxHp: hp, armor: BOSS.armor, dmgMul: BOSS.dmgMul, rage: 0, nextStomp: 0, chasesDrops: false, likesCars: false });
    b.dark = shade(b.color, -0.45); b.light = shade(b.color, 0.35);
    const guns = BOSS.guns[G.warfare] || BOSS.guns.normal;
    b.inv = guns.slice(); b.maxSlots = 2; b.slot = 0;
    for (const g of guns) equipNew(b, g);
    b.items.grenade = G.early ? 0 : 3;
    G.fighters.push(b);
    G.bossF = b;
    // You and your team start in a ring round him, armed and ready
    const team = G.fighters.filter(f => f.team === 0);
    const pool = G.hightech ? BOSS.allyHigh : G.early ? BOSS.allyEarly : BOSS.allyGuns;
    team.forEach((f, i) => {
        const a = (i / team.length) * TAU + rand(-0.15, 0.15), d = rand(...BOSS.ring);
        const s = spawnNear({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d }, 150, 30, true);
        f.x = s.x; f.y = s.y; f.vx = f.vy = 0;
        f.angle = Math.atan2(c.y - s.y, c.x - s.x);
        if (f.inv.length < 3) { f.maxSlots = Math.max(f.maxSlots, 3); while (f.inv.length < 3) f.inv.push(null); }
        applyLoot(f, f.isPlayer ? (G.hightech ? 'Plasma Rifle' : G.early ? 'Longbow' : 'Assault Rifle') : pick(pool), -1);
        f.armor = Math.max(f.armor, 50);
        if (!f.isPlayer) f.likesCars = false;  // (bots on bikes just ride into him and blow up)
        f.items.bandage = Math.max(f.items.bandage, 3);
        f.items.medkit = Math.max(f.items.medkit, 1);
        if (!G.early) f.items.grenade = Math.max(f.items.grenade, 2);
    });
    // Ammo and medkits lying round the arena (outside his reach at the start)
    for (let i = 0; i < 26 + team.length; i++) {
        const a = rand(0, TAU), d = rand(500, 1600);
        const s = spawnNear({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d }, 120, 30, true);
        spawnLoot(s.x, s.y, pick(['ammo', 'ammo', 'ammo', 'bandage', 'medkit', 'armor', G.early ? 'ammo' : 'grenade']));
    }
    if (G.player) { G.cam.x = G.player.x; G.cam.y = G.player.y; }
}
// The boss picks his gun: minigun bursts, then a run of rockets (and the hammer when you're right on him)
function bossWeapon(b, d) {
    const cyc = BOSS.spray + BOSS.rockets, t = (G.time + (b.cycOff || 0)) % cyc;
    let i = t < BOSS.spray ? 0 : 1;
    if (G.early) i = d < 140 ? 0 : 1;
    else if (i === 1 && d < ROCKET.radius + 60) i = 0;  // (no rockets in his own face)
    switchSlot(b, i);
}
// Who the boss goes after with nobody in sight: the nearest of the team. His team goes after him
function bossHunt(b) {
    const boss = G.bossF;
    if (!boss || boss.dead) return false;
    let t = null;
    if (b === boss) {
        let bd = Infinity;
        for (const f of G.fighters) if (!f.dead && f.team === 0 && !f.downed) { const d = dist(b, f); if (d < bd) { bd = d; t = f; } }
    } else if (b.team === 0) t = boss;
    else return false;
    if (!t || dist(b, t) < 380) return false;
    b.mode = 'zone';
    if (!b.goal || b.goal.huntOf !== t) b.goal = { x: t.x, y: t.y, huntOf: t };
    else { b.goal.x = t.x; b.goal.y = t.y; }
    return true;
}
function updateBossFight(dt) {
    const b = G.bossF;
    if (!b) return;
    if (b.dead) {
        if (G.mode === 'demo' && G.time - b.diedAt > 4000) newDemo();
        return;
    }
    for (const g of b.inv) if (g && !WEAPONS[g].melee) b.ammo[g] = 999;  // (he never runs out)
    if (!G.early) b.items.grenade = Math.max(b.items.grenade, 1);
    // The stomp: anyone right up against him is hurt and thrown back
    if (G.time >= b.nextStomp) {
        let hit = 0;
        G.fgrid.query(b.x, b.y, BOSS.stomp.reach + 30, f => {
            if (f.dead || f === b || !foe(b, f)) return;
            const d = Math.hypot(f.x - b.x, f.y - b.y);
            if (d > BOSS.stomp.reach + f.r) return;
            hit++;
            const k = (d || 1);
            f.vx += ((f.x - b.x) / k) * BOSS.stomp.push; f.vy += ((f.y - b.y) / k) * BOSS.stomp.push;
            damage(f, BOSS.stomp.dmg * (b.rage ? 1.3 : 1), b, 'Stomp');
        });
        if (hit) {
            b.nextStomp = G.time + BOSS.stomp.every * (b.rage ? 0.65 : 1);
            G.particles.push({ type: 'ring', x: b.x, y: b.y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: BOSS.stomp.reach, color: '#ffb347' });
            burst(b.x, b.y, 26, '#c9a46a', 260);
            if (inView(b.x, b.y, 200)) G.shake = Math.max(G.shake, 14);
            Sound.tone(55, 0.5, 'sawtooth', 0.09, 30);
        } else b.nextStomp = G.time + 400;
    }
    // Hurt enough, he calls in his soldiers
    const frac = b.hp / b.maxHp;
    while (b.rage < BOSS.waves.length && frac <= BOSS.waves[b.rage].at) {
        const w = BOSS.waves[b.rage];
        b.rage++;
        const n = Math.min(w.n + Math.floor(G.fighters.filter(f => f.team === 0 && !f.dead).length / 6), 12);
        for (let i = 0; i < n; i++) {
            const s = spawnNear(b, 320, 30, true);
            addSoldier(s, i);
            const f = G.fighters[G.fighters.length - 1];
            f.name = `Guard ${i + 1}`; f.dmgMul = 0.45; f.helper = true;
            burst(s.x, s.y, 12, '#ff4f6d', 200, 'glow');
        }
        G.alive += n;
        b.cycOff = rand(0, 3000);
        burst(b.x, b.y, 40, '#ff4f6d', 320, 'glow');
        G.particles.push({ type: 'ring', x: b.x, y: b.y, vx: 0, vy: 0, life: 0.8, max: 0.8, size: 260, color: '#ff4f6d' });
        if (G.mode === 'playing') { showBanner(w.title, true, w.sub); Sound.tone(70, 1.4, 'sawtooth', 0.08, 40); G.flash = 0.35; G.flashColor = '255,60,60'; }
    }
}

// Drops n supply crates (already landed) at open outdoor spots within r of c
function scatterSupply(n, c, r) {
    for (let i = 0; i < n; i++) {
        const s = spawnNear(c, r, 60, true);
        const kind = G.hightech ? 'hyper' : 'supply';
        G.airdrops.push({ x: s.x, y: s.y, kind, landed: true, box: addLootBox(s.x, s.y, kind) });
    }
}

const botName = i => BOT_NAMES[i % BOT_NAMES.length] + (i >= BOT_NAMES.length ? ` ${Math.floor(i / BOT_NAMES.length) + 1}` : '');

function addPlayer(s, team) {
    G.player = createFighter(s.x, s.y, { isPlayer: true, name: 'You', color: PLAYER_COLOR, team });
    G.player.angle = 0;
    G.fighters.push(G.player);
    G.cam.x = s.x;
    G.cam.y = s.y;
}

// A random open spot within r of c (falls back to c itself)
function spawnNear(c, r, pad = 40, outdoors = false) {
    const W = CONFIG.WORLD_SIZE;
    for (let tries = 0; tries < 40; tries++) {
        const a = rand(0, TAU), d = Math.sqrt(Math.random()) * r;
        const x = clamp(c.x + Math.cos(a) * d, 200, W - 200), y = clamp(c.y + Math.sin(a) * d, 200, W - 200);
        if (!blockedAt(G.world.grid, x, y, pad) && !(outdoors && buildingAt(x, y, 40)) && (!G.world.cave || G.world.cave.inside(x, y, 150))) return { x, y };
    }
    return { x: c.x, y: c.y };
}

// War mode: each team starts together in its own base, spread evenly around the map,
// with a few supply crates nearby so the squad can arm up
function spawnTeams(cx, baseDist) {
    const { teams, size } = G.war;
    const off = rand(0, TAU);
    let n = 0;
    for (let t = 0; t < teams; t++) {
        const a = off + (t / teams) * TAU;
        const R = G.revolution;
        // Revolution: everyone starts in their own base's yard
        const base = R ? { x: R.bases[t].c.x + R.bases[t].fwd.x * 260, y: R.bases[t].c.y + R.bases[t].fwd.y * 260 } : { x: cx + Math.cos(a) * baseDist, y: cx + Math.sin(a) * baseDist };
        const spread = R ? 300 : 160 + Math.sqrt(size) * 45;
        for (let i = 0; i < size; i++) {
            const s = spawnNear(base, spread, 30);
            if (t === 0 && i === 0 && G.mode === 'playing') { addPlayer(s, 0); continue; }
            const b = createFighter(s.x, s.y, { name: botName(n++), color: TEAMS[t].color, team: t });
            b.chasesDrops = Math.random() < 0.8;
            G.fighters.push(b);
        }
        G.teamAlive[t] = size;
        if (R) continue;
        // Crates sit a little toward the middle of the map, in front of the base
        const front = { x: base.x + (cx - base.x) * 0.12, y: base.y + (cx - base.y) * 0.12 };
        const crates = G.mode === 'demo' ? 2 : Math.min(12, 3 + Math.floor(size / 8));
        scatterSupply(crates, front, 150 + crates * 35);
    }
    // More crates out in the middle of the map to fight over
    if (G.mode !== 'demo') scatterSupply(Math.min(25, 4 + Math.floor((teams * size) / 30)), { x: cx, y: cx }, baseDist * 0.8);
}

const HIGHTECH = { drops: [50000, 80000], first: [15000, 25000], baseVehicles: 4 };
// High Tech: nobody spawns with anything; the map is stocked with tech vehicles (at every team base in War) and hyper drops come early
function gearUpHighTech() {
    if (!G.war) {
        for (let i = 0; i < Math.round(8 * MAP_AREA); i++) { const s2 = findSpawn(null, 0); if (!blockedAt(G.world.grid, s2.x, s2.y, 110)) spawnVehicle(pick(TECH_VEHICLES), s2.x, s2.y); }
        G.nextHyper = G.time + rand(...HIGHTECH.first);
        G.nextTech = G.time + rand(...HIGHTECH.first) + 15000;
        return;
    }
    for (let t = 0; t < G.war.teams; t++) {
        const team = G.fighters.filter(f => f.team === t);
        if (!team.length) continue;
        const base = { x: team.reduce((a, f) => a + f.x, 0) / team.length, y: team.reduce((a, f) => a + f.y, 0) / team.length };
        for (let i = 0; i < HIGHTECH.baseVehicles + Math.floor(team.length / 40); i++) {
            const s2 = spawnNear(base, 500, 110, true);
            spawnVehicle(TECH_VEHICLES[i % TECH_VEHICLES.length], s2.x, s2.y);
        }
    }
    G.nextHyper = G.time + rand(...HIGHTECH.first);
    G.nextTech = G.time + rand(...HIGHTECH.first) + 15000;
}

function updateTeamCenters() {
    const w = G.war, sum = [];
    for (let t = 0; t < w.teams; t++) sum.push({ x: 0, y: 0, n: 0 });
    for (const f of G.fighters) {
        if (f.dead) continue;
        const c = sum[f.team];
        c.x += f.x; c.y += f.y; c.n++;
    }
    w.centers = sum.map(c => (c.n ? { x: c.x / c.n, y: c.y / c.n } : null));
    w.nextCenter = G.time + 1000;
}

// ---------- Zombies & Virus ----------
// A survivor who goes down gets back up as one of the horde. hp: health for this zombie (patient zero is tougher).
function turnZombie(f, hp = ZOMBIE.hp) {
    f.zombie = true;
    f.team = 1;
    f.color = ZOMBIE.color;
    f.dark = shade(ZOMBIE.color, -0.5);
    f.light = shade(ZOMBIE.color, 0.25);
    f.hp = f.maxHp = hp;
    f.armor = 0;
    f.inv = f.inv.map(() => null);
    f.slot = 0;
    for (const k in f.items) f.items[k] = 0;
    f.healing = f.cook = null;
    f.mode = 'wander';
    f.target = f.goal = null;
    f.nextThink = G.time + 600;
    f.hitFlash = 1;
}

// Zombies: the starting horde comes in packs of about 10, well away from you
function spawnHorde(n, avoid) {
    for (let i = 0; i < n;) {
        const c = findSpawn(avoid, 1400);
        for (let k = 0; k < 10 && i < n; k++, i++) {
            const s = spawnNear(c, 220, 30);
            const z = createFighter(s.x, s.y, { name: botName(G.fighters.length), color: SURVIVOR_COLOR, team: 0 });
            G.fighters.push(z);
            turnZombie(z);
        }
    }
}

// Escape: the HQ is the hotel closest to a corner of the city, and the people start on the opposite side.
// Soldiers hold the streets (none right at the start), with a squad guarding the HQ's doors.
function spawnEscape(soldiers, people) {
    const W = CONFIG.WORLD_SIZE, mid = { x: W / 2, y: W / 2 }, maze = G.world.terrain === 'maze', MZ = ESCAPE.maze;
    let start, goal, hq = null;
    if (maze) soldiers = Math.round(soldiers * MZ.soldiers);
    if (G.world.terrain) {
        // Maze or mountains: run from one corner to the helicopter waiting in the other
        start = spawnNear(G.world.escapeStart, 200, 40, true);
        goal = G.extract = { ...G.world.escapeEnd };
    } else {
        const towers = G.world.buildings.filter(b => b.kind === 'hotel' && !b.collapsed);
        hq = towers.reduce((a, b) => (!a || dist({ x: b.cx, y: b.cy }, mid) > dist({ x: a.cx, y: a.cy }, mid) ? b : a), null);
        Object.assign(hq, { kind: 'hq', hq: true, style: 'hq', floors: ESCAPE.hqFloors, roof: '#3c4238', roofDark: '#272b24' });
        G.hq = hq;
        goal = { x: hq.cx, y: hq.cy };
        start = spawnNear({ x: W - hq.cx, y: W - hq.cy }, 300, 40, true);
    }
    for (let i = 0; i < people; i++) {
        const s = spawnNear(start, 240, 30);
        if (i === 0 && G.mode === 'playing') { addPlayer(s, 0); continue; }
        G.fighters.push(createFighter(s.x, s.y, { name: botName(i), color: pick(BOT_COLORS), team: 0 }));
    }
    // Everyone breaking out is in heavy armor (triple the normal maximum) with a minigun, and has their own place in the group
    let slot = 0;
    for (const f of G.fighters) {
        if (f.team !== 0) continue;
        if (!f.isPlayer) giveSlot(f, slot++, people - 1);
        f.armor = CONFIG.MAX_ARMOR * (maze ? MZ.armor : ESCAPE.armor);
        f.items.bandage = 2;
        f.inv[1] = null;
        if (G.early) { applyLoot(f, 'Sword', -1); applyLoot(f, 'Bow', -1); }  // Early Warfare: a sword and a bow instead
        else applyLoot(f, 'Minigun', -1);
        switchSlot(f, 1, true);
    }
    // The HQ keeps its big guard at the doors; everyone else is out in squads of 5 to 8, spread over the city
    const guards = Math.min(soldiers, ESCAPE.doorGuards);
    for (let i = 0; i < guards; i++) addSoldier(spawnNear(goal, hq ? Math.max(hq.w, hq.h) * 0.5 + 260 : 420, 30, true), i, true);
    const homes = [];
    for (let left = soldiers - guards, n = guards; left > 0;) {
        // Never leave a straggler group smaller than a squad at the end
        let size = Math.min(left, randInt(ESCAPE.squad[0], ESCAPE.squad[1]));
        if (left - size > 0 && left - size < ESCAPE.squad[0]) size = left <= ESCAPE.squad[1] ? left : left - ESCAPE.squad[0];
        let c = null;
        for (let tries = 0; tries < 40 && !c; tries++) {
            const q = findSpawn(null, 0);
            if (Math.hypot(q.x - start.x, q.y - start.y) > ESCAPE.clear && homes.every(h => dist(h, q) > 500)) c = q;
        }
        c = c || findSpawn([start], ESCAPE.clear);
        homes.push(c);
        spawnSquad(c, size, n, Math.random() < (maze ? MZ.hunters : ESCAPE.hunters));
        left -= size;
        n += size;
    }
    if (maze) {
        // A machine gunner dug in at every nest, and minefields down the corridors
        const extra = G.world.mazeExtra;
        extra.nests.forEach((q, i) => {
            addSoldier(q, 900 + i, true);
            const f = G.fighters[G.fighters.length - 1];
            f.inv[1] = null; applyLoot(f, 'Machine Gun', -1); switchSlot(f, 1, true);
        });
        const field = { name: 'Minefield', team: 1, soldier: true, isPlayer: false, dead: false, kills: 0, x: 0, y: 0, color: ESCAPE.soldier };
        for (const m of extra.mines) if (Math.hypot(m.x - start.x, m.y - start.y) > 1200 && !blockedAt(G.world.grid, m.x, m.y, 20)) G.mines.push({ x: m.x, y: m.y, owner: field, armAt: 0, triggerAt: 0 });
        drawMazeMap();
    }
}

// A squad: soldiers that move as a unit, each holding its own spot around the squad's current waypoint.
// Patrol squads wander their part of town; hunter squads go after the nearest runners.
function spawnSquad(c, size, n, hunter) {
    const sq = { home: { x: c.x, y: c.y }, goal: { x: c.x, y: c.y }, hunter, members: [], flank: rand(0, TAU) };
    G.squads.push(sq);
    for (let i = 0; i < size; i++) {
        addSoldier(spawnNear(c, 120, 26), n + i, false);
        const f = G.fighters[G.fighters.length - 1];
        f.squad = sq;
        const a = (i / size) * TAU;
        f.sqOff = { x: Math.cos(a) * rand(40, 110), y: Math.sin(a) * rand(40, 110) };
        sq.members.push(f);
    }
}

// Once a second: move each squad's waypoint along (toward the runners, or to a new spot on its patrol)
function updateSquads() {
    for (const sq of G.squads) {
        const lead = sq.members.find(f => !f.dead);
        if (!lead) continue;
        const prey = sq.hunter && nearestPrey(lead);
        // Hunters close in from their own side, so two squads don't merge into one big blob
        if (prey && dist(lead, prey) < 3000) { sq.goal = { x: prey.x + Math.cos(sq.flank) * 320, y: prey.y + Math.sin(sq.flank) * 320 }; continue; }
        // Next patrol stop: somewhere on our beat that isn't where another squad is heading
        if (dist(lead, sq.goal) < 160) {
            for (let tries = 0; tries < 8; tries++) {
                sq.goal = spawnNear(sq.home, 1100, 40, true);
                if (G.squads.every(o => o === sq || dist(o.goal, sq.goal) > 600)) break;
            }
        }
    }
    G.nextSquads = G.time + 1000;
}

// A spot in the group's formation, relative to the leader's direction of travel: a couple of people on point,
// some on the flanks, the rest covering the rear
function giveSlot(f, i, n) {
    if (i < 2) { f.slotA = (i ? 1 : -1) * rand(0.2, 0.45); f.slotR = rand(260, 340); }
    else { f.slotA = ((i - 2) / Math.max(1, n - 2)) * TAU * 0.8 + Math.PI * 0.6 + rand(-0.15, 0.15); f.slotR = rand(110, 260); }
    f.watch = rand(-0.6, 0.6);  // which way they tend to look while holding position
}

// Title screen version: a small breakout in the middle of the arena, soldiers all around
function spawnEscapeDemo(c) {
    for (let i = 0; i < 20; i++) {
        const s = spawnNear(c, 220, 30);
        const f = createFighter(s.x, s.y, { name: botName(i), color: pick(BOT_COLORS), team: 0 });
        f.inv[1] = null;
        applyLoot(f, 'Mac10', -1);
        if (i > 0) giveSlot(f, i - 1, 19);
        G.fighters.push(f);
    }
    for (let i = 0, n = 0; n < 40; i++) {
        const a = (i / 6) * TAU + rand(-0.3, 0.3), size = randInt(ESCAPE.squad[0], ESCAPE.squad[1]);
        spawnSquad(spawnNear({ x: c.x + Math.cos(a) * 850, y: c.y + Math.sin(a) * 850 }, 200, 30), size, n, Math.random() < 0.5);
        n += size;
    }
}

// Escape: step on the stairs and everyone in your group (people within reach of you) goes with you
function travel(st) {
    const p = G.player, b = st.b, from = G.world.floor ? G.world.floor.level : 1;
    // Escape: your group comes with you. Anywhere else you climb alone
    const group = G.escape ? G.fighters.filter(f => !f.dead && !f.soldier && (f === p || dist(f, p) < 900)) : [p];
    if (G.world.floor) G.world.floor.baked = null;  // repainted on return; saves memory across a dozen floors
    G.layers[G.layerKey] = { world: G.world, fighters: G.fighters.filter(f => !group.includes(f)), lootGrid: G.lootGrid, movingLoot: G.movingLoot, grenades: G.grenades, smokes: G.smokes, strikes: G.strikes, mines: G.mines, scorches: G.scorches, stumps: G.stumps, airdrops: G.airdrops, cures: G.cures };
    const key = st.to === 1 ? 'street' : `${b.id}:${st.to}`;
    let L = G.layers[key];
    const fresh = !L;
    if (fresh) L = { world: generateFloor(b, st.to), fighters: [], lootGrid: new Grid(200, 0), movingLoot: [], grenades: [], smokes: [], strikes: [], mines: [], scorches: [], stumps: [], airdrops: [], cures: [] };
    Object.assign(G, L);
    G.fighters = L.fighters.concat(group);
    G.bullets = [];
    G.particles = [];
    G.layerKey = key;
    G.nextPrey = 0;
    if (fresh) populateFloor(b, st.to);
    // Arrive next to the stairs that lead back the way we came, stepping toward the middle of the building
    const back = G.world.stairs.find(s => s.b === b && s.to === from) || G.world.stairs.find(s => s.dir === 'down') || st;
    const d = Math.hypot(b.cx - back.x, b.cy - back.y) || 1;
    const at = { x: back.x + ((b.cx - back.x) / d) * 80, y: back.y + ((b.cy - back.y) / d) * 80 };
    for (const f of group) {
        const s = f === p ? at : spawnNear(at, 110, 22);
        f.x = s.x; f.y = s.y; f.vx = f.vy = 0;
        f.mode = 'wander'; f.target = null; f.goal = null; f.nextThink = G.time;
    }
    p.stairLock = true;
    G.cam.x = p.x; G.cam.y = p.y;
    G.timeScale = 0.6;
    G.flash = 0.35;
    G.flashColor = '20,16,30';
    Sound.tone(220, 0.25, 'triangle', 0.1, 330);
    const name = b.hq ? 'HQ TOWER' : b.label || b.kind.toUpperCase();
    if (!G.escape) { showBanner(st.to === 1 ? 'BACK OUTSIDE' : `${name} · FLOOR ${st.to} OF ${b.floors}`, false, st.to === 1 ? '' : 'Search the rooms. Smash furniture for supplies. Someone else might be up here too.'); return; }
    if (st.to === 1) showBanner('BACK ON THE STREET', false, `${group.length - 1} people with you`);
    else if (G.world.floor.roof) showBanner('THE ROOF!', true, 'The Commander and his guards hold the helicopter. Fight your way to it!');
    else showBanner(`${name} · FLOOR ${st.to} OF ${b.floors}`, b.hq, b.hq ? 'Fight your way to the stairs up' : b.kind === 'hospital' ? 'Hospitals are stocked with medical supplies' : 'Hotels hide guns in their rooms');
}

function checkStairs(dt) {
    const p = G.player;
    const st = G.world.stairs.find(s => Math.abs(s.x - p.x) < 34 && Math.abs(s.y - p.y) < 34);
    if (!st) { p.stairLock = false; p.stairT = 0; return; }
    if (p.stairLock) return;
    p.stairT = (p.stairT || 0) + dt;
    if (p.stairT >= 0.7) { p.stairT = 0; travel(st); }
}

// Squads of soldiers keep arriving while you're out on the streets
function reinforce() {
    const p = G.player, a = rand(0, TAU), d = rand(1300, 1700);
    const c = spawnNear({ x: clamp(p.x + Math.cos(a) * d, 300, CONFIG.WORLD_SIZE - 300), y: clamp(p.y + Math.sin(a) * d, 300, CONFIG.WORLD_SIZE - 300) }, 200, 30, true);
    spawnSquad(c, randInt(ESCAPE.squad[0], ESCAPE.squad[1]), 0, true);
    showBanner('REINFORCEMENTS INBOUND', true, `A squad of ${G.squads[G.squads.length - 1].members.length} is hunting your group. Keep moving!`);
    Sound.tone(80, 1.2, 'sawtooth', 0.06, 60);
}

function addSoldier(s, i, guard) {
    const f = createFighter(s.x, s.y, { name: `Soldier ${i + 1}`, color: ESCAPE.soldier, team: 1 });
    f.soldier = true;
    f.dmgMul = G.world.terrain === 'maze' ? ESCAPE.maze.dmg : ESCAPE.soldierDmg;
    const gun = G.early ? gunFrom() : pick(ESCAPE.guns);
    if (gun !== 'Pistol') applyLoot(f, gun, -1);
    f.items.grenade = G.early ? 0 : 2;
    // Guards hold their pad; the rest patrol, and some sweep the city looking for the runners
    f.post = guard ? { x: s.x, y: s.y } : null;
    G.fighters.push(f);
}

// Escape: reaching the helicopter flies out you and everyone with you on the roof
function boardHelicopter() {
    const riders = G.fighters.filter(f => !f.dead && !f.soldier);
    G.escaped = riders.length;
    for (const f of riders) {
        f.escaped = true;
        f.dead = true;
        f.diedAt = G.time;
        burst(f.x, f.y, 16, '#7dffb0', 220, 'glow');
    }
    G.alive -= riders.length;
    G.result = { won: true, place: 1, title: 'ESCAPED!', sub: `The helicopter lifts off with you and ${riders.length - 1} other${riders.length === 2 ? '' : 's'}. ${ESCAPE.people - riders.length} didn't make it.` };
    G.overAt = G.time + 2600;
    startVictory(G.result.sub);
}

const isPrey = f => (G.zombies ? !f.zombie : f.team === 0);

function updateOutbreak(dt) {
    // Who the horde is hunting: a sample of the healthy, refreshed every second
    if (G.time >= G.nextPrey) {
        const prey = G.fighters.filter(f => !f.dead && isPrey(f));
        G.prey = prey.length > 60 ? Array.from({ length: 60 }, () => pick(prey)) : prey;
        G.nextPrey = G.time + 1000;
    }
    let a = 0, b = 0;
    for (const f of G.fighters) {
        if (f.dead) continue;
        if (G.zombies) {
            if (f.zombie) { b++; f.hp = Math.min(f.maxHp, f.hp + ZOMBIE.regen * dt); } else a++;
        } else if (f.soldier || f.assassin || f.giant) b++;
        else {
            a++;
            // Out of the fight for a while, the group patches itself up
            if (G.escape && G.time - (f.lastHurt || 0) > ESCAPE.regen.after) f.hp = Math.min(f.maxHp, f.hp + ESCAPE.regen.rate * dt);
        }
    }
    // People left behind on other floors still count as alive
    for (const k in G.layers) if (k !== G.layerKey) for (const f of G.layers[k].fighters) if (!f.dead) { if (G.zombies ? !f.zombie : !f.soldier) a++; else b++; }
    G.sides = { a, b };
    if (G.bossFight) updateBossFight(dt);
    if (G.mode !== 'playing' || G.result) return;
    const p = G.player;
    if (G.bossFight) {
        if (!G.bossF || !G.bossF.dead || p.dead) return;
        G.result = { won: true, place: 1, title: 'BOSS DEFEATED!', sub: G.bossF.killedBy === p ? 'You landed the final blow!' : 'Your team brought the giant down.' };
        G.overAt = G.time + 2600;
        startVictory(G.result.sub);
    } else if (G.escape) {
        const heli = G.world.floor ? G.world.floor.heli : G.extract;
        if (heli && !p.dead && dist(p, heli) < ESCAPE.heliR) boardHelicopter();
        else if (!G.world.floor && G.time >= G.nextReinf) { reinforce(); G.nextReinf = G.time + rand(...(G.world.maze ? ESCAPE.maze.reinforce : ESCAPE.reinforceEvery)); }
    } else if (G.assassin) {
        checkAssassinCaught();
        const p2 = G.player, caught = !G.assassinF || G.assassinF.dead;
        if (!caught && a > 0) return;
        if (p2.dead && !p2.assassin) return;  // (you already lost)
        const won = p2.assassin ? !caught : caught;
        const how = G.assassinF && G.assassinF.caughtBy ? `${G.assassinF.caughtBy === p2 ? 'You' : G.assassinF.caughtBy.name} caught the assassin.` : 'The assassin is down.';
        G.result = won
            ? { won: true, place: 1, title: p2.assassin ? 'MISSION COMPLETE' : 'ASSASSIN CAUGHT!', sub: p2.assassin ? 'Nobody is left. Nobody saw you.' : how }
            : { won: false, place: 2, title: p2.assassin ? 'CAUGHT!' : 'THE ASSASSIN WINS', sub: p2.assassin ? how : 'Every survivor has been taken out.' };
        G.overAt = G.time + 2200;
        if (won) startVictory(G.result.sub);
        else { G.timeScale = 0.3; canvas.classList.add('dead'); Sound.death(); }
    } else if (G.zombies && (a === 0 || b === 0)) {
        // You're on whichever side you're on now: the horde can win with you in it
        const zombieWin = a === 0;
        G.result = { won: true, place: 1, title: zombieWin ? 'THE HORDE WINS' : 'SURVIVED!', sub: zombieWin ? 'Every last survivor has been turned.' : 'The last zombie is down. The outbreak is over.' };
        G.overAt = G.time + 2200;
        startVictory(G.result.sub);
    }
}

// Demo mode packs bots into a small arena so the title screen always has action
function newDemo() {
    const W = CONFIG.WORLD_SIZE, c = W / 2;
    const id = MODES[menuMode].id;
    if (id === 'war' || id === 'hightech' || id === 'revolution') {
        // Two squads charge each other from opposite sides of the arena
        newState('demo', { type: id === 'revolution' ? 'war' : id, teams: 2, size: CONFIG.DEMO_BOTS / 2, baseDist: 750 });
        if (id !== 'hightech') for (const b of G.fighters) {
            b.maxSlots = 3;
            b.inv.push(null);
            applyLoot(b, pick(['Assault Rifle', 'Mac10', 'Shotgun', 'Machine Gun', 'Minigun', 'Rocket Launcher']), -1);
        }
        G.cam.x = c;
        G.cam.y = c;
        return;
    }
    const epic = id === 'epic', zombies = id === 'zombies';
    if (id === 'boss') {
        newState('demo', { type: 'boss', count: 24, map: 'cavern' });
        G.alive = G.fighters.length;
        G.cam.x = G.bossF.x; G.cam.y = G.bossF.y;
        return;
    }
    if (id === 'escape') {
        // A small breakout: the people in the middle, soldiers around them, pads at the arena edge
        newState('demo', { type: 'escape', count: 0 });
        spawnEscapeDemo({ x: c, y: c });
        G.alive = G.fighters.length;
        G.cam.x = c;
        G.cam.y = c;
        return;
    }
    newState('demo', { type: epic || zombies || id === 'survival' ? id : 'ffa', count: 0 });
    if (epic) scatterSupply(4, { x: c, y: c }, 900);
    for (let i = 0; i < CONFIG.DEMO_BOTS; i++) {
        let x, y, ok = false;
        for (let t = 0; t < 30 && !ok; t++) {
            x = c + rand(-1100, 1100);
            y = c + rand(-1100, 1100);
            ok = !blockedAt(G.world.grid, x, y, 30);
        }
        const b = createFighter(x, y, { name: pick(BOT_NAMES), color: zombies ? SURVIVOR_COLOR : pick(BOT_COLORS), team: zombies ? 0 : null });
        // Give demo bots some variety so the fights look interesting
        const extra = pick(epic ? ['Assault Rifle', 'Minigun', 'Rocket Launcher', 'Barrett', 'Vector', 'Heavy MG'] : ['Mac10', 'Shotgun', 'Machine Gun', 'Sniper', 'Breacher']);
        b.maxSlots = 3;
        b.inv.push(null);
        applyLoot(b, extra, -1);
        G.fighters.push(b);
    }
    // Start the outbreak a little way in so the demo gets going quickly
    if (zombies) for (let i = 0; i < 15; i++) turnZombie(G.fighters[i]);
    G.alive = G.fighters.length;
    G.cam.x = c;
    G.cam.y = c;
}

// ---------- Zone ----------
function setNextZoneTarget(z) {
    const ph = ZONE_PHASES[z.phase];
    const W = CONFIG.WORLD_SIZE;
    const maxOff = Math.max(0, z.r - ph.radius) * 0.8;
    const a = rand(0, TAU), d = rand(0, maxOff);
    z.tr = ph.radius;
    z.tcx = clamp(z.cx + Math.cos(a) * d, ph.radius, W - ph.radius);
    z.tcy = clamp(z.cy + Math.sin(a) * d, ph.radius, W - ph.radius);
}

function updateZone(dt) {
    const z = G.zone;
    if (z.state === 'final') return;
    z.timer -= dt;
    const ph = ZONE_PHASES[z.phase];
    if (z.state === 'wait' && z.timer <= 0) {
        z.state = 'shrink';
        z.timer = ph.shrink;
        z.sx = z.cx; z.sy = z.cy; z.sr = z.r;
        z.dmg = ph.dmg;
        showBanner('THE ZONE IS CLOSING', true);
    } else if (z.state === 'shrink') {
        const t = 1 - clamp(z.timer / ph.shrink, 0, 1);
        z.cx = lerp(z.sx, z.tcx, t);
        z.cy = lerp(z.sy, z.tcy, t);
        z.r = lerp(z.sr, z.tr, t);
        if (z.timer <= 0) {
            z.phase++;
            if (z.phase < ZONE_PHASES.length) {
                z.state = 'wait';
                z.timer = ZONE_PHASES[z.phase].wait;
                setNextZoneTarget(z);
            } else {
                z.state = 'final';
            }
        }
    }
}

// The circle a fighter should be heading for right now
function zoneGoal() {
    const z = G.zone;
    const soon = z.state === 'shrink' || (z.state === 'wait' && z.timer < 20);
    return soon ? { x: z.tcx, y: z.tcy, r: z.tr } : { x: z.cx, y: z.cy, r: z.r };
}

// ---------- Loot ----------
// Early Warfare: grenades (and every other throwable) hadn't been invented; something plain turns up instead
const earlyBanned = key => { const it = ITEMS[key]; return !!it && it.type === 'throwable'; };
function spawnLoot(x, y, key, mag, vx = 0, vy = 0, count) {
    if (G.early && earlyBanned(key)) { key = weightedPick([['bandage', 4], ['ammo', 4], ['armor', 2]]); count = undefined; }
    const l = { x, y, key, mag, vx, vy, count: count || LOOT_COUNT[key] || 1, t: rand(0, TAU), gone: false, born: G.time, moving: false };
    G.lootGrid.insert(l);
    if (vx || vy) { l.moving = true; G.movingLoot.push(l); }
    return l;
}

// Throws items out in an even ring so they glide apart and settle without piling up.
// `items` are loot keys, or { key, mag, count } for guns that keep their ammo / stacks of supplies.
function dropItems(x, y, items, spread = 1) {
    const n = items.length, out = [];
    const base = rand(0, TAU);
    // Big drops (supply crates) fan out in rings inside each other so they stay close but never pile up
    const rings = [];
    if (n > 12) {
        for (let r = 80; rings.length < n; r += 62) {
            const k = Math.min(Math.floor((TAU * r) / 62), n - rings.length), off = rand(0, TAU);
            for (let j = 0; j < k; j++) rings.push([off + (j / k) * TAU, r]);
        }
    }
    items.forEach((it, i) => {
        const key = typeof it === 'string' ? it : it.key;
        const a = rings.length ? rings[i][0] + rand(-0.08, 0.08) : base + (i / n) * TAU + rand(-0.2, 0.2);
        const d = (rings.length ? rings[i][1] : n === 1 ? rand(35, 55) : 55 + n * 9 + rand(0, 15)) * spread;
        out.push(spawnLoot(x, y, key, it.mag, Math.cos(a) * d * LOOT_DRAG, Math.sin(a) * d * LOOT_DRAG, it.count));
    });
    return out;
}

function updateLoot(dt) {
    const W = CONFIG.WORLD_SIZE;
    const decay = Math.exp(-LOOT_DRAG * dt);
    for (const l of G.movingLoot) {
        if (l.gone) { l.moving = false; continue; }
        G.lootGrid.remove(l);
        // Ease away from neighbors so drops spread out instead of stacking
        let crowded = false;
        G.lootGrid.query(l.x, l.y, LOOT_SPACING, o => {
            if (o.gone) return;
            const dx = l.x - o.x, dy = l.y - o.y, d = Math.hypot(dx, dy);
            if (d >= LOOT_SPACING) return;
            crowded = true;
            const nx = d > 0.5 ? dx / d : Math.cos(l.t), ny = d > 0.5 ? dy / d : Math.sin(l.t);
            const push = (LOOT_SPACING - d) * Math.min(1, dt * 6);
            if (!blockedAt(G.world.grid, l.x + nx * push, l.y + ny * push, 16)) {
                l.x += nx * push;
                l.y += ny * push;
            }
        });
        // Glide, bouncing softly off anything solid
        const nx = l.x + l.vx * dt, ny = l.y + l.vy * dt;
        if (!blockedAt(G.world.grid, nx, ny, 16)) { l.x = nx; l.y = ny; }
        else if (!blockedAt(G.world.grid, nx, l.y, 16)) { l.x = nx; l.vy *= -0.4; }
        else if (!blockedAt(G.world.grid, l.x, ny, 16)) { l.y = ny; l.vx *= -0.4; }
        else { l.vx *= -0.4; l.vy *= -0.4; }
        l.x = clamp(l.x, 20, W - 20);
        l.y = clamp(l.y, 20, W - 20);
        l.vx *= decay;
        l.vy *= decay;
        G.lootGrid.insert(l);
        const age = G.time - l.born;
        if ((Math.hypot(l.vx, l.vy) < 4 && !crowded) || age > 4000) { l.vx = l.vy = 0; l.moving = false; }
    }
    G.movingLoot = G.movingLoot.filter(l => l.moving);
}

// ---------- Cardboard boxes & airdrops ----------
// kind: undefined = cardboard box, 'airdrop' = rare gun drop, 'supply' = war-mode crate full of guns
function addLootBox(x, y, kind) {
    const o = kind === 'hyper'
        ? { type: 'box', airdrop: true, hyper: true, x, y, hw: 40, hh: 40, hp: HYPER.hp, maxHp: HYPER.hp, hitAt: -9999, rot: 0 }
        : kind === 'supply'
        ? { type: 'box', airdrop: true, supply: true, x, y, hw: 46, hh: 46, hp: SUPPLY_HP, maxHp: SUPPLY_HP, hitAt: -9999, rot: 0 }
        : kind === 'airdrop'
        ? { type: 'box', airdrop: true, x, y, hw: 34, hh: 34, hp: AIRDROP_HP, maxHp: AIRDROP_HP, hitAt: -9999, rot: 0 }
        : { type: 'box', x, y, hw: 22, hh: 22, hp: BOX_HP, maxHp: BOX_HP, hitAt: -9999, rot: rand(-0.08, 0.08) };
    G.world.grid.insertBox(o);
    return o;
}

function damageBox(o, amount, attacker) {
    if (o.broken) return;
    o.hp -= amount;
    o.hitAt = G.time;
    burst(o.x, o.y, 5, o.airdrop ? '#cfd6e0' : '#d8b07c', 160);
    if (attacker && attacker.isPlayer) Sound.tone(o.airdrop ? 260 : 150, 0.06, 'triangle', 0.18);
    if (o.hp <= 0) breakBox(o);
}

function breakBox(o) {
    o.broken = true;
    G.world.grid.removeBox(o);
    if (inView(o.x, o.y, 100)) {
        if (o.hyper) {
            burst(o.x, o.y, 50, HYPER.neon, 460, 'glow');
            burst(o.x, o.y, 30, HYPER.teal, 360, 'glow');
            G.particles.push({ type: 'ring', x: o.x, y: o.y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: 180, color: HYPER.neon });
        }
        const cols = o.hyper ? ['#0d2a3a', HYPER.neon, HYPER.teal, '#05121c'] : o.supply ? ['#4f5d33', '#ffc23d', '#2a2a24', '#8a6a3c'] : o.airdrop ? ['#4a5568', '#ff5a5f', '#e8edf3'] : ['#c89b6d', '#a87b4f', '#e6cfa3'];
        for (let i = 0; i < (o.supply ? 40 : o.airdrop ? 26 : 14); i++) {
            const a = rand(0, TAU), sp = rand(80, 280);
            G.particles.push({ type: 'chunk', x: o.x + rand(-10, 10), y: o.y + rand(-10, 10), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 0.9), max: 0.9, size: rand(4, 9), color: pick(cols), rot: rand(0, TAU), spin: rand(-12, 12) });
        }
        G.particles.push({ type: 'ring', x: o.x, y: o.y, vx: 0, vy: 0, life: 0.35, max: 0.35, size: o.supply ? 130 : o.airdrop ? 90 : 50, color: o.airdrop && !o.supply ? '#ff5a5f' : '#ffd166' });
        if (o.supply) burst(o.x, o.y, 40, '#ffd166', 420, 'glow');
    }
    Sound.crunch(Sound.volAt(o.x, o.y));
    if (o.hyper) {
        dropItems(o.x, o.y, hyperDropItems(), 1.2);
        Sound.tone(880, 0.6, 'sine', 0.14 * Sound.volAt(o.x, o.y), 1760);
    } else if (o.supply) {
        // Enough guns for the whole squad, plus ammo and patch-up gear
        const items = [];
        const n = randInt(15, 20);
        for (let i = 0; i < n; i++) items.push(gunFrom(SUPPLY_TABLE));
        items.push('ammo', 'ammo', 'ammo', 'armor', 'armor', 'medkit', { key: 'bandage', count: 4 }, { key: 'grenade', count: 3 });
        if (!G.early && Math.random() < 0.25) items.push(Math.random() < 0.5 ? 'nuke' : 'emissile');
        dropItems(o.x, o.y, items);
    } else if (o.airdrop) {
        const items = G.early ? [gunFrom(), gunFrom(), 'medkit', 'armor', 'ammo'] : [pick(AIRDROP_GUNS), pick([...AIRDROP_GUNS, 'AWP', 'Sniper', 'Machine Gun']), 'medkit', 'armor', 'ammo'];
        if (Math.random() < 0.5) items.push('backpack3');
        if (Math.random() < 0.6) items.push('strobe');
        if (!G.early && Math.random() < 0.12) items.push(Math.random() < 0.5 ? 'nuke' : 'emissile');
        if (G.zombies && Math.random() < 0.5) items.push('cure');
        dropItems(o.x, o.y, items, 1.2);
    } else if (o.chest) {
        dropItems(o.x, o.y, chestItems(o));
        o.refillAt = G.time + (o.armory ? REVO.armoryRefill : REVO.chestRefill);
    } else {
        const items = [G.hightech ? pick(HYPER_LOOT.weapons) : gunFrom(G.supplies ? WAR_GUN_TABLE : GUN_TABLE)];
        if (G.hightech && Math.random() < 0.5) items.push(Math.random() < 0.5 ? pick(HYPER_LOOT.grenades) : weightedPick(NADE2_TABLE));
        if (Math.random() < 0.55) items.push('ammo');
        if (Math.random() < 0.3) items.push(weightedPick(GROUND_TABLE));
        const extra = Math.random();
        if (extra < 0.004) items.push(extra < 0.002 ? 'nuke' : 'emissile'); else if (extra < 0.02) items.push('strobe'); else if (extra < 0.05) items.push('mine'); else if (extra < 0.15) items.push('smoke');
        // The cure is a rare find, and only exists where there's something to cure
        if (G.zombies && Math.random() < 0.03) items.push('cure');
        if (G.survival && Math.random() < 0.4) items.push(pick(['water', 'bucket', 'meat']));
        if (Math.random() < 0.12) items.push(weightedPick(NADE2_TABLE));
        dropItems(o.x, o.y, items);
    }
}

// ---------- Mining: furniture and crates inside buildings smash open for supplies ----------
const mineable = o => o.type === 'crate' && (o.furn || o.home) && !o.broken;
// What each piece of furniture is made of, how tough it is and what's hidden inside
const MINE_KINDS = {
    med: { furn: ['trolley', 'optable', 'sink', 'tub', 'toilet', 'labbench', 'fumehood'], color: '#e8eef2', chance: 0.7, table: [['bandage', 10], ['medkit', 4], ['armor', 1]] },
    arms: { furn: ['weaponrack', 'milcrate', 'locker', 'ammo', 'gunbench'], color: '#5f6b3c', chance: 1, guns: true, table: [['ammo', 8], ['grenade', 4], ['armor', 3], ['smoke', 1]] },
    gear: { furn: ['desk', 'filing', 'shelf', 'wardrobe', 'nightstand', 'counter', 'cabinet', 'console', 'printer', 'radio', 'bookshelf', 'workbench', 'toolrack', 'monitorwall', 'maptable', 'pallet'], color: '#8a6142', chance: 0.65, table: GROUND_TABLE },
    soft: { furn: ['bed', 'bunk', 'sofa', 'armchair', 'cot'], color: '#e6d8c4', chance: 0.45, table: [['bandage', 8], ['armor', 3], ['backpack1', 1], ['ammo', 3]] },
    snack: { furn: ['vending', 'fridge', 'stove', 'cooler'], color: '#c0392b', chance: 1, table: [['bandage', 1]], count: 3, food: true },
    junk: { furn: [], color: '#8f949c', chance: 0.25, table: [['ammo', 6], ['grenade', 2], ['bandage', 3]] }
};
const MINE_OF = {};
for (const k in MINE_KINDS) for (const f of MINE_KINDS[k].furn) MINE_OF[f] = MINE_KINDS[k];
const mineKind = o => (o.home ? MINE_KINDS.gear : MINE_OF[o.furn] || MINE_KINDS.junk);

function mineHit(o, amount, attacker) {
    if (!mineable(o)) return;
    if (!o.maxHp) {
        const a = (o.lw || o.hw * 2) * (o.lh || o.hh * 2);
        o.hp = o.maxHp = o.furn === 'sandbags' ? 260 : a < 1800 ? 45 : a < 5000 ? 90 : 150;
    }
    o.hp -= amount;
    o.hitAt = G.time;
    burst(o.x, o.y, 4, mineKind(o).color, 140);
    if (attacker && attacker.isPlayer) Sound.tone(130, 0.05, 'triangle', 0.15);
    if (o.hp <= 0) mineBreak(o);
}

function mineBreak(o) {
    o.broken = true;
    G.world.grid.removeBox(o);
    if (o.baked && G.world.floor) G.world.floor.dirty = true;
    const K = mineKind(o);
    if (inView(o.x, o.y, 100)) {
        const cols = [K.color, shade(K.color, -0.3), shade(K.color, 0.25), '#6a4a30'];
        for (let i = 0; i < 16; i++) {
            const a = rand(0, TAU), sp = rand(80, 260);
            G.particles.push({ type: 'chunk', x: o.x + rand(-o.hw, o.hw) * 0.6, y: o.y + rand(-o.hh, o.hh) * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 0.9), max: 0.9, size: rand(4, 9), color: pick(cols), rot: rand(0, TAU), spin: rand(-12, 12) });
        }
        G.particles.push({ type: 'smoke', x: o.x, y: o.y, vx: 0, vy: -20, life: 0.8, max: 0.8, size: Math.max(o.hw, o.hh), color: '150,140,130' });
    }
    Sound.crunch(Sound.volAt(o.x, o.y));
    const items = [];
    if (Math.random() < K.chance) {
        // Survival: kitchens and vending machines are where the food and water are
        for (let i = K.count || 1; i > 0; i--) items.push(G.survival && K.food ? pick(['meat', 'water', 'meat']) : weightedPick(K.table));
        if (K.guns || (o.home && Math.random() < 0.25)) items.push(G.hightech ? pick(HYPER_LOOT.weapons) : gunFrom(G.supplies ? WAR_GUN_TABLE : GUN_TABLE));
        if (Math.random() < 0.3) items.push('ammo');
    }
    if (items.length) dropItems(o.x, o.y, items, 0.7);
}

// What's left of a smashed piece of furniture, painted into the floor
function paintDebris(g, o) {
    const rnd = seededRand(o.seed || 1), col = mineKind(o).color;
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.beginPath(); g.ellipse(o.x, o.y, o.hw * 0.9, o.hh * 0.9, 0, 0, TAU); g.fill();
    for (let i = 0; i < 9; i++) {
        g.save();
        g.translate(o.x + (rnd() - 0.5) * o.hw * 1.6, o.y + (rnd() - 0.5) * o.hh * 1.6);
        g.rotate(rnd() * TAU);
        g.fillStyle = i % 3 ? shade(col, -0.2 + rnd() * 0.3) : '#5a4030';
        g.fillRect(-5 - rnd() * 6, -2, 10 + rnd() * 12, 4 + rnd() * 3);
        g.restore();
    }
}

// Trees and bushes can be chopped down with fists, shot (trees) or blown up
function damagePlant(o, amount, attacker) {
    if (o.broken) return;
    o.hp -= amount;
    o.hitAt = G.time;
    if (G.fort && G.fort.build && attacker && o.type === 'tree' && WEAPONS[held(attacker)] && WEAPONS[held(attacker)].melee) fortChopped(attacker, o);
    if (inView(o.x, o.y, 100)) {
        burst(o.x + rand(-o.r, o.r), o.y + rand(-o.r, o.r), 4, pick(['#3f7a34', '#5ea84a', '#2c5a28']), 140, 'leaf');
        if (o.type === 'tree') burst(o.x, o.y, 3, '#9a6b45', 120);
    }
    if (attacker && attacker.isPlayer) Sound.tone(o.type === 'tree' ? 120 : 220, 0.05, 'triangle', 0.14);
    if (o.hp <= 0) destroyPlant(o);
}

function destroyPlant(o) {
    o.broken = true;
    G.world.grid.remove(o);
    const size = o.type === 'tree' ? o.canopy : o.r;
    if (inView(o.x, o.y, size + 100)) {
        // The foliage bursts into a shower of leaves
        const n = o.type === 'tree' ? 50 : 22;
        for (let i = 0; i < n; i++) {
            const a = rand(0, TAU), d = rand(0, size * 0.8), sp = rand(60, 260);
            G.particles.push({ type: 'leaf', x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.8, 1.6), max: 1.6, size: rand(4, 8), color: pick(['#3f7a34', '#5ea84a', '#2c5a28', '#77c25a']), rot: rand(0, TAU), spin: rand(-8, 8) });
        }
        if (o.type === 'tree') {
            for (let i = 0; i < 12; i++) {
                const a = rand(0, TAU), sp = rand(80, 240);
                G.particles.push({ type: 'chunk', x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 0.9), max: 0.9, size: rand(4, 8), color: pick(['#7a5134', '#4a2f1d', '#9a6b45']), rot: rand(0, TAU), spin: rand(-12, 12) });
            }
            G.particles.push({ type: 'ring', x: o.x, y: o.y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: o.canopy, color: '#9fe07a' });
        }
    }
    if (o.type === 'tree') {
        G.stumps.push({ x: o.x, y: o.y, r: o.r });
        if (G.fort && G.fort.build) (G.fort.regrow || (G.fort.regrow = [])).push({ o, at: G.time + 18000 });
        Sound.timber(Sound.volAt(o.x, o.y));
    } else {
        Sound.noiseBurst(2500, 0.25, 0.3 * Sound.volAt(o.x, o.y));
    }
}

function spawnAirdrop(kind = 'airdrop') {
    const z = G.zone, W = CONFIG.WORLD_SIZE;
    for (let tries = 0; tries < 50; tries++) {
        const a = rand(0, TAU), d = Math.sqrt(Math.random()) * Math.max(100, Math.min(z.r * 0.7, W * 0.42));
        const x = clamp(z.cx + Math.cos(a) * d, 200, W - 200), y = clamp(z.cy + Math.sin(a) * d, 200, W - 200);
        if (blockedAt(G.world.grid, x, y, 70) || buildingAt(x, y, 60)) continue;
        const vtype = kind === 'vehicle' ? pick(TECH_VEHICLES) : null;
        if (kind === 'vehicle' && blockedAt(G.world.grid, x, y, 110)) continue;
        G.airdrops.push({ x, y, kind, vtype, t: 0, dur: 9, landed: false, box: null });
        if (kind === 'vehicle') showBanner('VEHICLE DROP INCOMING', true, `A ${VTYPES[vtype].name} is coming down (pink marker on your map)`);
        else if (kind === 'hyper') showBanner('QUANTUM DROP INCOMING', true, 'Super rare! Special weapons, shields, grenades and backpacks (teal marker on your map)');
        else if (kind === 'supply') showBanner('SUPPLY DROP INCOMING', false, G.war ? '15 to 20 guns: arm your team! (gold marker)' : '15 to 20 guns inside (gold marker)');
        else showBanner('AIRDROP INCOMING', false, 'Check your map for the red marker');
        Sound.tone(90, 1.6, 'sawtooth', 0.05, 70);
        return;
    }
}

function updateAirdrops(dt) {
    // The only thing that falls from the sky now: a hyper drop early in the match, then very rarely after
    if (G.murder || G.ghostMode || G.fort) return;
    if (G.time >= G.nextHyper && G.zone.r > 400 && !G.early) {
        spawnAirdrop('hyper');
        G.nextHyper = G.time + rand(...(G.hightech ? HIGHTECH.drops : HYPER.every));
    }
    // And now and then a high-tech vehicle, lowered on a big parachute
    if (G.time >= G.nextTech && G.zone.r > 400 && !G.early && G.map !== 'wasteland' && G.map !== 'cavern') {
        spawnAirdrop('vehicle');
        G.nextTech = G.time + rand(...(G.hightech ? HIGHTECH.drops : TECH_DROP.every));
    }
    for (const d of G.airdrops) {
        if (!d.landed) {
            d.t += dt;
            if (d.t < d.dur) continue;
            d.landed = true;
            // Shove anyone standing on the landing spot out of the way
            const clear = d.kind === 'supply' ? 76 : d.kind === 'hyper' ? 70 : 60;
            for (const f of G.fighters) if (Math.hypot(f.x - d.x, f.y - d.y) < clear) { const a = Math.atan2(f.y - d.y, f.x - d.x); f.x = d.x + Math.cos(a) * (clear + 2); f.y = d.y + Math.sin(a) * (clear + 2); }
            if (d.kind === 'vehicle') { spawnVehicle(d.vtype, d.x, d.y, rand(0, TAU)); d.box = { broken: true }; burst(d.x, d.y, 40, TECH_DROP.neon, 300, 'glow'); }
            else d.box = addLootBox(d.x, d.y, d.kind);
            burst(d.x, d.y, 30, '#d8cbb0', 260, 'smoke');
            Sound.thud(Sound.volAt(d.x, d.y));
        } else if (!d.box.broken && inView(d.x, d.y, 300) && Math.random() < dt * 14) {
            // Red smoke flare marks an unopened drop
            G.particles.push({ type: 'smoke', x: d.x + rand(-8, 8), y: d.y - 20, vx: rand(-15, 15), vy: rand(-60, -30), life: 2.2, max: 2.2, size: rand(6, 10), color: d.kind === 'supply' ? '255,209,102' : d.kind === 'hyper' ? (Math.random() < 0.5 ? '0,229,255' : '0,245,212') : '255,90,95' });
        }
    }
    G.airdrops = G.airdrops.filter(d => !d.landed || !d.box.broken);
}

function removeLoot(l) {
    l.gone = true;
    G.lootGrid.remove(l);
}

function nearestLoot(x, y, range, filter) {
    let best = null, bd = range;
    G.lootGrid.query(x, y, range, l => {
        if (l.gone) return;
        const d = Math.hypot(l.x - x, l.y - y);
        if (d < bd && (!filter || filter(l))) { bd = d; best = l; }
    });
    return best;
}

function equipNew(f, key, mag) {
    const w = WEAPONS[key];
    if (w.melee) return;  // a blade needs no ammo
    if (key === 'Pistol') f.ammo[key] = Infinity;
    else {
        // (a new gun comes with a box of ammo; one somebody dropped comes with what was left in it)
        f.ammo[key] = (f.ammo[key] || 0) + (mag !== undefined ? mag : w.mag + (w.quiver || w.mag * 2));
        // Ammo you picked up with no gun to use it goes into the new one
        if (f.ammoBank) { f.ammo[key] += f.ammoBank; f.ammoBank = 0; }
    }
}

// Returns how many units were taken (0 = refused). `swapIdx` = slot to replace when full (-1 = never swap).
function applyLoot(f, key, swapIdx, mag, count = 1) {
    const w = WEAPONS[key];
    if (w) {
        if (f.inv.includes(key)) {
            if (key === 'Pistol' || w.melee) return 0;
            f.ammo[key] += w.quiver || w.mag * 2;
            return 1;
        }
        // Fill the selected slot if it's empty, otherwise the first empty one, otherwise swap
        let idx = f.inv[f.slot] === null ? f.slot : f.inv.indexOf(null);
        if (idx < 0) {
            if (swapIdx < 0 || !f.inv[swapIdx]) return 0;
            idx = swapIdx;
            const old = f.inv[idx];
            dropItems(f.x, f.y, [{ key: old, mag: 0 }], 0.9);
        }
        f.inv[idx] = key;
        equipNew(f, key, mag);
        switchSlot(f, idx, true);
        return 1;
    }
    const it = ITEMS[key];
    switch (it.type) {
        case 'heal':
        case 'throwable': {
            const take = Math.min(count, carryLimit(f, key) - f.items[key]);
            if (take <= 0) return 0;
            f.items[key] += take;
            return take;
        }
        case 'armor':
            if (f.armor >= CONFIG.MAX_ARMOR) return 0;
            f.armor = Math.min(CONFIG.MAX_ARMOR, f.armor + it.val);
            return 1;
        case 'gear':
            // A perk pack is worth taking even if you already have five slots
            if (it.slots <= f.maxSlots && !(it.perk && f.perk !== it.perk)) return 0;
            while (f.inv.length < it.slots) f.inv.push(null);
            f.maxSlots = Math.max(f.maxSlots, it.slots);
            if (it.perk) f.perk = it.perk;
            return 1;
        case 'shield':
            f.shield = f.shieldMax = it.val;
            f.shieldKind = key;
            if (f.isPlayer) addFloat(f.x, f.y - 40, it.name.toUpperCase(), HYPER.neon, true);
            return 1;
        case 'ammo': {
            let used = 0;
            for (const n of f.inv) {
                if (!n || n === 'Pistol' || WEAPONS[n].melee) continue;
                f.ammo[n] = (f.ammo[n] || 0) + Math.ceil(ammoUnit(WEAPONS[n]) * 1.5);
                used = 1;
            }
            // Ammo can always be picked up: with no gun to load it into, it's kept for the next gun you find
            if (!used) {
                f.ammoBank = (f.ammoBank || 0) + AMMO_BOX_ROUNDS;
                if (f.isPlayer) addFloat(f.x, f.y - 40, `+${AMMO_BOX_ROUNDS} AMMO SAVED`, '#e0b84a');
            }
            return 1;
        }
    }
    return 0;
}

// When someone dies, the guns they were carrying fall where they died, with whatever ammo was left.
// (Not the free starting Pistol, and not from up on a castle balcony.) In team modes the dead come
// back with new gear, so these drops fade out after a while instead of piling up.
const DEATH_DROP_LIFE = 60000;
function dropDeathWeapons(t) {
    if (t.escaped || t.zombie || t.up || !t.inv) return;
    const guns = t.inv.filter(k => k && WEAPONS[k] && k !== 'Pistol')
        .map(k => ({ key: k, mag: WEAPONS[k].melee ? undefined : Math.max(0, Math.min(1e6, t.ammo[k] || 0)) }));
    if (!guns.length) return;
    const dropped = dropItems(t.x, t.y, guns, 0.8);
    if (G.war) (G.deathDrops || (G.deathDrops = [])).push(...dropped);
}
function expireDeathDrops() {
    if (!G.deathDrops || !G.deathDrops.length) return;
    G.deathDrops = G.deathDrops.filter(l => {
        if (l.gone) return false;
        if (G.time - l.born < DEATH_DROP_LIFE) return true;
        removeLoot(l);
        return false;
    });
}

// Picks up (part of) a loot pile; leftovers stay on the ground
function takeLoot(f, l, swapIdx) {
    if (G.murder && f.murderer && l.key === 'Pistol') return 0;
    const took = applyLoot(f, l.key, swapIdx, l.mag, l.count);
    if (took >= l.count) removeLoot(l);
    else l.count -= took;
    return took;
}

function lootRefusal(f, key) {
    if (WEAPONS[key]) return 'Already have a Pistol';
    const it = ITEMS[key];
    if (it.type === 'heal' || it.type === 'throwable') return `Can't carry more ${it.name.toLowerCase()}s. Find a bigger backpack`;
    if (it.type === 'armor') return 'Armor is full';
    if (it.type === 'gear') return 'You have a better backpack';
    return 'No guns that use ammo';
}

// Walk over something and it's yours: anything you have room for is picked up on its own.
// (A gun only goes into an empty slot; to swap one you're carrying, use F / the pick-up button.
// Picking up a gun doesn't switch you off the gun you're holding.)
const AUTO_PICKUP = { reach: 34, every: 120 };
function autoPickup(p) {
    if (p.dead || p.zombie || p.downed || G.mode !== 'playing' || G.time < (p.nextAuto || 0)) return;
    p.nextAuto = G.time + AUTO_PICKUP.every;
    const near = [];
    G.lootGrid.query(p.x, p.y, p.r + AUTO_PICKUP.reach + 10, l => { if (!l.gone && Math.hypot(l.x - p.x, l.y - p.y) < p.r + AUTO_PICKUP.reach) near.push(l); });
    for (const l of near) {
        if (l.gone) continue;
        const key = l.key, prev = p.slot, held = p.inv[prev], gun = !!WEAPONS[key];
        const took = takeLoot(p, l, -1);
        if (!took) continue;
        if (gun && held && p.slot !== prev) switchSlot(p, prev, true);
        if (!p.remote) { Sound.pickup(); addFloat(p.x, p.y - 34, `+ ${lootName(key)}${took > 1 ? ' x' + took : ''}`, RARITY[lootRarity(key)].color); }
    }
}

function playerPickup(p = G.player) {
    if (p.zombie) return;
    const l = nearestLoot(p.x, p.y, CONFIG.PICKUP_RANGE);
    if (!l) return;
    const key = l.key;
    const took = takeLoot(p, l, p.slot);
    if (took) {
        Sound.pickup();
        addFloat(p.x, p.y - 34, `+ ${lootName(key)}${took > 1 ? ' x' + took : ''}`, RARITY[lootRarity(key)].color);
    } else {
        addFloat(p.x, p.y - 34, lootRefusal(p, l.key), '#ff8fa3');
        Sound.empty();
    }
}

function botWants(b, key) {
    if (b.giant) return false;  // (the boss doesn't go shopping)
    const w = WEAPONS[key];
    if (w) {
        if (b.inv.includes(key)) return key !== 'Pistol' && b.ammo[key] < w.mag;
        if (b.inv.includes(null)) return true;
        return rarityRank(key) > rarityRank(b.inv[worstSlot(b)]);
    }
    const it = ITEMS[key];
    if (it.type === 'heal' || it.type === 'throwable') return b.items[key] < carryLimit(b, key);
    if (it.type === 'armor') return b.armor < 60;
    if (it.type === 'gear') return it.slots > b.maxSlots || (!!it.perk && !b.perk);
    if (it.type === 'shield') return (b.shield || 0) < it.val;
    return b.inv.some(n => n && n !== 'Pistol' && b.ammo[n] < WEAPONS[n].mag);
}

function worstSlot(b) {
    let idx = -1, rank = 99;
    b.inv.forEach((n, i) => {
        if (!n) return;
        const r = rarityRank(n);
        if (r < rank) { rank = r; idx = i; }
    });
    return idx;
}

// ---------- Combat ----------
function switchSlot(f, i, instant) {
    if (i >= 0 && i < f.inv.length) f.nadeReady = false;  // (going back to a gun puts the grenade away)
    if (i < 0 || i >= f.inv.length || (i === f.slot && !instant)) return;
    f.slot = i;
    const w = WEAPONS[held(f)];
    // Short draw delay so swapping can't skip a weapon's fire rate
    f.lastShot = Math.max(f.lastShot, G.time - w.rate + 180);
}

function canShoot(f) {
    const name = held(f);
    return WEAPONS[name].melee || f.ammo[name] > 0;
}

function tryAttack(f) {
    if (f.downed) return;
    if (f.cook || stunned(f) || f.car) return;
    const name = held(f), w = WEAPONS[name];
    if (G.time - f.lastShot < w.rate) return;
    if (f.healing) cancelHeal(f);

    if (w.melee) {
        f.lastShot = G.time;
        f.punch = 1;
        f.punchHand ^= 1;
        Sound.punch(Sound.volAt(f.x, f.y));
        G.fgrid.query(f.x, f.y, w.range + f.r * 2, t => {
            if (t.dead || !foe(f, t)) return;
            const d = dist(f, t);
            if (d > w.range + t.r) return;
            if (Math.abs(angleDiff(f.angle, Math.atan2(t.y - f.y, t.x - f.x))) > 0.9) return;
            if (w.crush && t.armor > 0) t.armor = Math.max(0, t.armor - w.crush);  // mace: dents the armor right off
            damage(t, w.damage, f, name);
            if (w.knock && !t.car) { const ka = Math.atan2(t.y - f.y, t.x - f.x); t.kx += Math.cos(ka) * w.knock; t.ky += Math.sin(ka) * w.knock; }
            burst(t.x, t.y, 6, '#a3121e', 120, 'blood');
            if (!(t.armor > 0)) bloodSplat(t.x, t.y, f.angle, 0.8);
        });
        if (G.survival) G.agrid.query(f.x, f.y, w.range + 30, a => {
            if (a.dead || Math.hypot(a.x - f.x, a.y - f.y) > w.range + a.r) return;
            if (Math.abs(angleDiff(f.angle, Math.atan2(a.y - f.y, a.x - f.x))) <= 0.9) damageAnimal(a, w.damage, f);
        });
        // Fists open cardboard boxes, chop trees and bushes, and smash furniture
        let prop = null, bd = Infinity;
        G.world.grid.query(f.x, f.y, w.range + 40, o => {
            if (o.broken || levelSkips(o, f.up || null) || (o.type !== 'box' && o.type !== 'tree' && o.type !== 'bush' && !mineable(o))) return;
            let d;
            if (o.type === 'box' || mineable(o)) {
                const nx = clamp(f.x, o.x - o.hw, o.x + o.hw), ny = clamp(f.y, o.y - o.hh, o.y + o.hh);
                d = Math.hypot(f.x - nx, f.y - ny);
            } else {
                d = Math.hypot(f.x - o.x, f.y - o.y) - (o.type === 'tree' ? o.r : o.r * 0.6);
            }
            if (d > w.range + 4 || Math.abs(angleDiff(f.angle, Math.atan2(o.y - f.y, o.x - f.x))) > 1.1) return;
            if (d < bd) { bd = d; prop = o; }
        });
        if (prop) prop.type === 'box' ? damageBox(prop, w.damage, f) : mineable(prop) ? mineHit(prop, w.damage * 1.5, f) : damagePlant(prop, w.damage * (w.chop || 1), f);
        return;
    }

    if (!(f.ammo[name] > 0)) {
        if (isHuman(f)) { Sound.empty(); f.lastShot = G.time; }
        return;
    }

    if (f.ammo[name] !== Infinity && f.perk !== 'ammo') f.ammo[name]--;  // (the ammo pack never runs dry)
    f.lastShot = G.time;
    if (!w.silent) f.lastLoud = G.time;  // the crossbow fires without giving you away
    if (w.beam || w.sonic) {
        if (w.beam) fireBeam(f, w, name); else { fireSonic(f, w, name); f.recoil = 1; }
        return;
    }
    f.recoil = 1;
    // Each shot kicks the gun off target a little more until it settles
    const spread = gunSpread(f, w);
    f.bloom = Math.min(1.2, (f.bloom || 0) + kickOf(w));
    const ca = Math.cos(f.angle), sa = Math.sin(f.angle);
    const mx = f.x + ca * (f.r + w.len + 4), my = f.y + sa * (f.r + w.len + 4);
    const count = w.count || 1;
    for (let i = 0; i < count; i++) {
        const a = f.angle + (spread ? rand(-spread, spread) : 0);
        const sp = w.speed * (count > 1 ? rand(0.9, 1.08) : 1);
        // Rounds leave from the edge of your body, not the end of the barrel: anything right up against you still gets hit
        // (and the barrel can't poke through a wall). Rockets launch from the barrel so they don't go off in your face
        const bx = w.rocket ? mx : f.x + ca * f.r, by = w.rocket ? my : f.y + sa * f.r;
        G.bullets.push({ x: bx, y: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: w.damage * (f.dmgMul || 1), owner: f, left: w.range, weapon: name, heavy: w.damage >= 80, rocket: !!w.rocket, homing: !!w.homing, explosive: !!w.explosive });
    }
    if (inView(mx, my, 100) && !w.string) {
        G.particles.push({ type: 'flash', x: mx, y: my, vx: 0, vy: 0, life: 0.06, max: 0.06, size: 10 + w.w * 1.4, angle: f.angle });
        for (let i = 0; i < 2; i++) G.particles.push({ type: 'smoke', x: mx, y: my, vx: ca * 40 + rand(-20, 20), vy: sa * 40 + rand(-20, 20), life: 0.5, max: 0.5, size: rand(4, 8) });
        G.particles.push({ type: 'shell', x: f.x + ca * 14, y: f.y + sa * 14, vx: -sa * rand(150, 300) + ca * rand(-90, 40), vy: ca * rand(150, 300) + sa * rand(-90, 40), life: 0.45, max: 0.45, size: 2, rot: rand(0, TAU), spin: rand(-30, 30) });
    }
    if (w.silent) Sound.tone(220, 0.08, 'triangle', 0.08 * Sound.volAt(f.x, f.y), 120); else Sound.shot(w.sound, Sound.volAt(f.x, f.y));
}

// ---------- Healing ----------
function startHeal(f, key) {
    if (f.healing || f.dead || f.downed || !(f.items[key] > 0)) return false;
    const { food, drink, container } = ITEMS[key];
    if (container) return false;
    if (food ? f.hunger >= 98 : drink ? f.thirst >= 98 : f.hp >= f.maxHp) {
        if (f.isPlayer) { addFloat(f.x, f.y - 34, food ? 'Not hungry' : drink ? 'Not thirsty' : 'Health is full', '#ff8fa3'); Sound.empty(); }
        return false;
    }
    f.healing = { key, start: G.time, end: G.time + ITEMS[key].time };
    if (f.isPlayer) Sound.tone(520, 0.12, 'sine', 0.12, 700);
    return true;
}

function cancelHeal(f) {
    f.healing = null;
    if (f.isPlayer) Sound.tone(300, 0.1, 'sine', 0.08, 200);
}

function updateHeal(f, dt) {
    const h = f.healing;
    if (!h) return;
    if (inView(f.x, f.y, 50) && Math.random() < dt * 10) {
        G.particles.push({ type: 'plus', x: f.x + rand(-18, 18), y: f.y + rand(-10, 14), vx: 0, vy: -50, life: 0.7, max: 0.7, size: rand(4, 6) });
    }
    if (G.time < h.end) return;
    const it = ITEMS[h.key];
    f.items[h.key]--;
    if (it.food) f.hunger = Math.min(100, f.hunger + it.food);
    if (it.drink) { f.thirst = Math.min(100, f.thirst + it.drink); if (f.items.bucket < carryLimit(f, 'bucket')) f.items.bucket++; }
    const gained = Math.min(it.val, f.maxHp - f.hp);
    f.hp = Math.min(f.maxHp, f.hp + it.val);
    f.healing = null;
    if (inView(f.x, f.y, 50)) {
        G.particles.push({ type: 'ring', x: f.x, y: f.y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: 60, color: '#5ee08a' });
        burst(f.x, f.y, 14, '#5ee08a', 160, 'glow');
    }
    if (f.isPlayer) {
        addFloat(f.x, f.y - 34, `+${Math.round(gained)}`, '#5ee08a', true);
        Sound.healed();
        G.flash = Math.max(G.flash, 0.15);
        G.flashColor = '94,224,138';
    }
}

// ---------- Throwables: frag grenades, smoke, strobes and land mines ----------
// Grenades are cooked: pulling the pin starts the fuse, so the longer you hold one
// the sooner it goes off after the throw. Hold it too long and it goes off in your hand.
function startCook(f, key) {
    if (G.frozen || f.dead || f.cook || G.time - f.lastThrow < GRENADE.cooldown || !(f.items[key] > 0)) return false;
    if (key === 'mine') return placeMine(f);
    if (f.healing) cancelHeal(f);
    f.items[key]--;
    f.cook = { key, start: G.time, fuse: FUSE[key], nextBeep: G.time };
    if (f.isPlayer) Sound.pin();
    return true;
}

function cookLeft(f) {
    return f.cook ? f.cook.fuse - (G.time - f.cook.start) / 1000 : 0;
}

function releaseCook(f, tx, ty) {
    if (!f.cook || f.dead) return;
    const { key } = f.cook, left = cookLeft(f);
    f.cook = null;
    launchThrowable(f, tx, ty, key, Math.max(0.05, left));
}

function updateCook(f) {
    if (!f.cook) return;
    const left = cookLeft(f);
    // Beeps speed up as the fuse runs down
    if (G.time >= f.cook.nextBeep) {
        if (f.isPlayer) Sound.beep(left);
        f.cook.nextBeep = G.time + clamp(left * 260, 70, 500);
    }
    if (left <= 0) {
        const key = f.cook.key;
        f.cook = null;
        detonate(key, f.x, f.y, f, true);
    }
}

// Bots throw straight away without cooking
function throwGrenade(f, tx, ty, key = 'grenade') {
    if (f.dead || f.downed || f.cook || !(f.items[key] > 0) || G.time - f.lastThrow < GRENADE.cooldown) return false;
    if (f.healing) cancelHeal(f);
    f.items[key]--;
    launchThrowable(f, tx, ty, key, FUSE[key]);
    return true;
}

function launchThrowable(f, tx, ty, key, fuse) {
    f.lastThrow = G.time;
    f.punch = 1;
    const a = Math.atan2(ty - f.y, tx - f.x);
    const d = clamp(Math.hypot(tx - f.x, ty - f.y), 60, GRENADE.range);
    const T = 0.45 + d / 1100;  // time in the air
    G.grenades.push({
        type: key,
        x: f.x + Math.cos(a) * (f.r + 6), y: f.y + Math.sin(a) * (f.r + 6),
        vx: Math.cos(a) * d / T, vy: Math.sin(a) * d / T,
        t: 0, T, H: 40 + d * 0.15, z: 0, fuse, owner: f, landed: false, spin: rand(0, TAU)
    });
    Sound.throw(Sound.volAt(f.x, f.y));
}

function updateGrenades(dt) {
    for (const g of G.grenades) {
        g.t += dt;
        g.fuse -= dt;
        if (g.type === 'sticky') {
            if (!g.stuck) G.fgrid.query(g.x, g.y, 34, f => { if (!g.stuck && !f.dead && f !== g.owner && Math.hypot(f.x - g.x, f.y - g.y) < f.r + 10) { g.stuck = f; Sound.tone(900, 0.08, 'square', 0.1); if (f.isPlayer) showBanner('STICKY BOMB ON YOU!', true, 'Get away from everyone!'); } });
            if (g.stuck) {
                if (g.stuck.dead) g.stuck = null;
                else { g.x = g.stuck.x; g.y = g.stuck.y; g.z = 0; g.landed = true; g.vx = g.vy = 0; if (g.fuse <= 0) detonate(g.type, g.x, g.y, g.owner, false); continue; }
            }
        }
        if (!g.landed) {
            const k = Math.min(1, g.t / g.T);
            g.z = 4 * g.H * k * (1 - k);
            g.spin += dt * 14;
            if (g.t >= g.T) {
                g.landed = true;
                g.z = 0;
                g.vx *= 0.3;
                g.vy *= 0.3;
                burst(g.x, g.y, 4, '#d8cbb0', 80, 'smoke');
                Sound.tone(700, 0.04, 'square', 0.08 * Sound.volAt(g.x, g.y));
            }
        } else {
            const decay = Math.exp(-3.5 * dt);
            g.vx *= decay;
            g.vy *= decay;
            g.spin += Math.hypot(g.vx, g.vy) * dt * 0.1;
        }
        // Low-flying and rolling grenades bounce off walls, rocks and crates
        const nx = g.x + g.vx * dt, ny = g.y + g.vy * dt;
        if (g.z > 45 || !blockedAt(G.world.grid, nx, ny, 6)) { g.x = nx; g.y = ny; }
        else if (!blockedAt(G.world.grid, nx, g.y, 6)) { g.x = nx; g.vy *= -0.5; }
        else if (!blockedAt(G.world.grid, g.x, ny, 6)) { g.y = ny; g.vx *= -0.5; }
        else { g.vx *= -0.5; g.vy *= -0.5; }
        g.x = clamp(g.x, 10, CONFIG.WORLD_SIZE - 10);
        g.y = clamp(g.y, 10, CONFIG.WORLD_SIZE - 10);
        if (g.fuse <= 0) detonate(g.type, g.x, g.y, g.owner, false);
    }
    G.grenades = G.grenades.filter(g => g.fuse > 0);
}

function detonate(key, x, y, owner, inHand) {
    if (key === 'grenade') {
        // Holding a frag until it blows is fatal
        if (inHand && !owner.dead) damage(owner, 9999, owner, 'Grenade');
        blast(x, y, owner, GRENADE.radius, GRENADE.damage, 'Grenade');
        if (inView(x, y, 200)) for (let i = 0; i < 26; i++) { const a = rand(0, TAU), sp = rand(500, 900); G.particles.push({ type: 'streak', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.18, 0.3), max: 0.3, size: 2 }); }
        if (!G.world.floor) addFire(x, y, 55, 4000);
    } else if (key === 'smoke') {
        popSmoke(x, y);
    } else if (key === 'strobe') {
        callStrike(x, y, owner, inHand);
    } else if (key === 'nuke') {
        armNuke(x, y, owner);
    } else if (key === 'emissile') {
        callStrike(x, y, owner, inHand, true);
    } else if (key === 'shock') {
        shockBlast(x, y, owner);
    } else if (key === 'cluster') {
        clusterBlast(x, y, owner);
    } else if (NADES2[key]) {
        detonate2(key, x, y, owner);
    } else if (key === 'bomblet') {
        blast(x, y, owner, 170, 90, 'Cluster Bomb');
        if (!G.world.floor && Math.random() < 0.4) addFire(x, y, 45, 3000);
    } else if (key === 'cure') {
        G.cures.push({ x, y, born: G.time });
        burst(x, y, 30, '#5ee08a', 260, 'glow');
        G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: CURE.radius, color: '#5ee08a' });
        Sound.tone(520, 0.5, 'sine', 0.12 * Sound.volAt(x, y), 900);
    }
}

// Cure: drag every zombie nearby into the cloud; reaching the middle cures them
function updateCures(dt) {
    G.cures = G.cures.filter(c => (G.time - c.born) / 1000 < CURE.life);
    for (const c of G.cures) {
        G.fgrid.query(c.x, c.y, CURE.pull, f => {
            if (f.dead || !f.zombie) return;
            const d = Math.hypot(c.x - f.x, c.y - f.y);
            if (d > CURE.pull) return;
            if (d < CURE.radius) { cureFighter(f); return; }
            // They can't resist it: walk them straight in
            f.cureAt = c;
            f.cureUntil = G.time + 300;
            if (f.isPlayer) { f.kx += ((c.x - f.x) / d) * 900 * dt; f.ky += ((c.y - f.y) / d) * 900 * dt; }
        });
    }
}

function cureFighter(f) {
    f.cureAt = null;
    if (f.zombie) {
        f.zombie = false;
        f.team = 0;
        f.color = f.isPlayer ? PLAYER_COLOR : SURVIVOR_COLOR;
        f.dark = shade(f.color, -0.45);
        f.light = shade(f.color, 0.35);
        f.hp = f.maxHp = CONFIG.MAX_HEALTH;
        f.inv[0] = 'Pistol';
        f.ammo.Pistol = Infinity;
        switchSlot(f, 0, true);
    }
    f.mode = 'wander';
    f.target = null;
    f.nextThink = G.time;
    if (inView(f.x, f.y, 100)) {
        burst(f.x, f.y, 18, '#bfffd0', 200, 'glow');
        addFloat(f.x, f.y - 30, 'CURED', '#5ee08a', false);
    }
    if (f.isPlayer) showBanner('YOU HAVE BEEN CURED', false, 'Back with the survivors!');
}

// --- Smoke: a thick cloud nobody can see into or through ---
function popSmoke(x, y) {
    const puffs = [];
    for (let i = 0; i < 18; i++) {
        const a = rand(0, TAU), d = Math.sqrt(Math.random()) * SMOKE.radius * 0.75;
        puffs.push({ ox: Math.cos(a) * d, oy: Math.sin(a) * d, s: rand(0.7, 1.15), drift: rand(0, TAU), spin: rand(-0.3, 0.3) });
    }
    G.smokes.push({ x, y, born: G.time, puffs });
    burst(x, y, 20, '200,200,210', 220, 'smoke');
    Sound.hiss(Sound.volAt(x, y));
}

// Current radius of a smoke cloud (it billows out, then thins away at the end)
function smokeRadius(s) {
    const age = (G.time - s.born) / 1000;
    if (age > SMOKE.life) return 0;
    const grow = Math.min(1, age / 1.2);
    const fade = clamp((SMOKE.life - age) / 2, 0, 1);
    return SMOKE.radius * grow * (0.6 + 0.4 * fade);
}

function inSmoke(x, y) {
    for (const s of G.smokes) {
        const r = smokeRadius(s) * 0.85;
        if (r > 0 && (x - s.x) ** 2 + (y - s.y) ** 2 < r * r) return true;
    }
    return false;
}

// --- Strobe: marks a spot for a missile strike ---
function callStrike(x, y, owner, inHand, electric = false) {
    G.strikes.push({ x, y, owner, t: 0, delay: inHand ? 1.6 : STRIKE.delay, electric });
    // Only the thrower gets told; everyone else just hears the missile at the last second
    const what = electric ? 'ELECTRIC MISSILE' : 'MISSILE';
    if (owner && owner.isPlayer) showBanner(inHand ? what + ' INCOMING' : what + ' CALLED', inHand, inHand ? 'RUN!' : 'Impact in a few seconds');
}

function updateStrikes(dt) {
    for (const s of G.strikes) {
        s.t += dt;
        if (inView(s.x, s.y, 300) && Math.random() < dt * 8) {
            G.particles.push({ type: 'smoke', x: s.x + rand(-6, 6), y: s.y - 10, vx: rand(-12, 12), vy: rand(-50, -25), life: 1.6, max: 1.6, size: rand(5, 9), color: s.electric ? '80,220,255' : '255,60,60' });
        }
        if (s.owner && s.owner.isPlayer && Math.floor(s.t * 3) !== Math.floor((s.t - dt) * 3)) Sound.siren(0.6);
        if (s.t >= s.delay) {
            s.done = true;
            if (s.electric) electricStrike(s.x, s.y, s.owner);
            else blast(s.x, s.y, s.owner, STRIKE.radius, STRIKE.damage, 'Missile');
        }
    }
    G.strikes = G.strikes.filter(s => !s.done);
}

// --- Land mines: hidden-ish, armed after a moment, set off by anyone who steps on them ---
function placeMine(f) {
    if (!(f.items.mine > 0)) return false;
    f.items.mine--;
    f.lastThrow = G.time;
    G.mines.push({ x: f.x, y: f.y, owner: f, armAt: G.time + MINE.armTime, triggerAt: 0 });
    if (f.isPlayer) { Sound.tone(400, 0.06, 'square', 0.12); addFloat(f.x, f.y - 34, 'Mine placed', '#c77dff'); }
    return true;
}

function triggerMine(m, delay) {
    if (m.triggerAt) return;
    m.triggerAt = G.time + delay;
    Sound.tone(1200, 0.12, 'square', 0.25 * Sound.volAt(m.x, m.y));
}

function updateMines() {
    for (const m of G.mines) {
        if (m.triggerAt) {
            if (G.time >= m.triggerAt) {
                m.done = true;
                blast(m.x, m.y, m.owner, MINE.radius, MINE.damage, 'Land Mine');
            }
            continue;
        }
        if (G.time < m.armAt) continue;
        G.fgrid.query(m.x, m.y, MINE.trigger + 20, f => {
            if (!m.triggerAt && !f.dead && (f === m.owner || foe(m.owner, f)) && Math.hypot(f.x - m.x, f.y - m.y) < MINE.trigger + f.r * 0.5) triggerMine(m, 220);
        });
    }
    G.mines = G.mines.filter(m => !m.done);
}

// --- Explosions (frag, mines and missiles share this; bigger radius = bigger show) ---
function blast(x, y, owner, R, dmg, weapon) {
    const big = R / GRENADE.radius;
    addDecal({ kind: 'scorch', x, y, r: R * 0.55, life: 180000 });
    const at = { x, y };
    // Fighters: damage falls off with distance, and cover (walls, rocks, crates) protects you
    const hits = [];
    G.fgrid.query(x, y, R + 20, f => { if (!f.dead) hits.push(f); });
    for (const f of hits) {
        const d = Math.hypot(f.x - x, f.y - y);
        if (d > R + f.r || !lineOfSight(at, f)) continue;
        if (owner && f !== owner && !foe(owner, f)) continue;
        const k = 1 - clamp((d - f.r) / R, 0, 1);
        const a = Math.atan2(f.y - y, f.x - x);
        f.kx += Math.cos(a) * 520 * k * big;
        f.ky += Math.sin(a) * 520 * k * big;
        damage(f, dmg * Math.pow(k, 0.7), owner, weapon);
    }
    const killed = hits.filter(f => f.dead).length;
    if (owner && owner.isPlayer && killed >= 2) {
        showBanner(`${killed}× MULTI KILL`, true, weapon.toUpperCase());
        G.timeScale = 0.3;
        Sound.tone(220, 0.5, 'square', 0.12, 440);
    }
    if (G.survival) for (const a of G.animals) { const d = Math.hypot(a.x - x, a.y - y); if (!a.dead && d < R) damageAnimal(a, dmg * (1 - d / R) + 20, owner); }
    if (G.world.cars) for (const c of G.world.cars) { const d = Math.hypot(c.x - x, c.y - y); if (!c.dead && d < R + 30) damageCar(c, dmg * 1.4 * (1 - d / (R + 30)) + 15, owner); }
    // Revolution: explosions chew through base walls (a cannon shell hardest of all)
    // (a boss strike's shots only bring down the walls they're aimed at)
    if (G.revolution && weapon !== 'Boss Strike') {
        const walls = [];
        G.world.grid.query(x, y, R + 40, o => { if (o.baseWall && !o.broken) walls.push(o); });
        for (const o of walls) {
            const d = Math.hypot(clamp(x, o.x - o.hw, o.x + o.hw) - x, clamp(y, o.y - o.hh, o.y + o.hh) - y);
            if (d < R) damageBaseWall(o, dmg * (weapon === 'Cannon' || (TOWER_ARMS.boom && weapon === TOWER_ARMS.boom.name) || weapon === 'Catapult' ? 5 : 2.5) * (1 - d / R * 0.6), owner);
        }
    }
    // Fort Wars: explosions blow fort walls and crates apart
    if (G.fort && !G.fort.build) {
        const fb = [];
        G.world.grid.query(x, y, R + 40, o => { if (o.fortBlock && !o.broken) fb.push(o); });
        for (const o of fb) { const d = Math.hypot(clamp(x, o.x - o.hw, o.x + o.hw) - x, clamp(y, o.y - o.hh, o.y + o.hh) - y); if (d < R) damageFortBlock(o, dmg * 3 * (1 - d / R * 0.6)); }
    }
    // Boxes get blown open, plants get shredded
    const props = [];
    G.world.grid.query(x, y, R, o => {
        if (o.broken) return;
        if (o.type === 'box' && Math.hypot(o.x - x, o.y - y) < R + o.hw) props.push(o);
        if ((o.type === 'tree' || o.type === 'bush') && Math.hypot(o.x - x, o.y - y) < R + o.r) props.push(o);
        if (mineable(o) && Math.hypot(o.x - x, o.y - y) < R + Math.max(o.hw, o.hh)) props.push(o);
    });
    for (const o of props) {
        if (o.type === 'box') damageBox(o, dmg * 1.3, owner);
        else if (mineable(o)) mineHit(o, dmg * 1.2, owner);
        else damagePlant(o, dmg * 1.5 * (1 - clamp(Math.hypot(o.x - x, o.y - y) / (R + o.r), 0, 1)) + 20, owner);
    }
    // Nearby loot gets flung outward
    const items = [];
    G.lootGrid.query(x, y, R, l => { if (!l.gone) items.push(l); });
    for (const l of items) {
        const d = Math.hypot(l.x - x, l.y - y) || 1;
        const k = 1 - d / R;
        if (k <= 0) continue;
        l.vx += ((l.x - x) / d) * 380 * k;
        l.vy += ((l.y - y) / d) * 380 * k;
        l.born = G.time;
        if (!l.moving) { l.moving = true; G.movingLoot.push(l); }
    }
    // Chain reaction: mines in the blast go off too
    for (const m of G.mines) if (!m.triggerAt && Math.hypot(m.x - x, m.y - y) < R) triggerMine(m, rand(120, 260));

    G.scorches.push({ x, y, r: rand(60, 80) * big, rot: rand(0, TAU), born: G.time });
    if (G.scorches.length > 40) G.scorches.shift();
    if (inView(x, y, R + 100)) {
        G.particles.push({ type: 'boom', x, y, vx: 0, vy: 0, life: 0.45 * Math.sqrt(big), max: 0.45 * Math.sqrt(big), size: R * 0.75 });
        // Bigger blasts roll out in several fireballs
        for (let i = 1; i < big * 2; i++) {
            const a = rand(0, TAU), d = rand(R * 0.2, R * 0.5);
            G.particles.push({ type: 'boom', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: 0, vy: 0, life: rand(0.35, 0.6), max: 0.6, size: R * rand(0.3, 0.45) });
        }
        G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.4, max: 0.4, size: R * 1.1, color: '#fff7ec' });
        G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: R * 0.8, color: '#ff8a3d' });
        burst(x, y, Math.round(40 * big), '#ffb347', 520 * big, 'glow');
        burst(x, y, Math.round(18 * big), '#ff5a36', 300 * big, 'glow');
        for (let i = 0; i < 16 * big; i++) {
            const a = rand(0, TAU), sp = rand(30, 140) * big;
            G.particles.push({ type: 'smoke', x: x + rand(-20, 20), y: y + rand(-20, 20), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(1.2, 2.2), max: 2.2, size: rand(12, 22) * Math.sqrt(big), color: '70,64,72' });
        }
        for (let i = 0; i < 12 * big; i++) {
            const a = rand(0, TAU), sp = rand(150, 400) * big;
            G.particles.push({ type: 'chunk', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 0.9), max: 0.9, size: rand(3, 6), color: pick(['#3a3328', '#5c5040', '#2a2622']), rot: rand(0, TAU), spin: rand(-14, 14) });
        }
    }
    // The city takes the hit too: buildings crumble, parked cars catch
    if (!G.world.floor) damageBuildings(x, y, R, dmg);
    if (G.world.city) { igniteCars(x, y, R, weapon === 'Car bomb' || weapon === 'Explosion' ? 0.2 : 0.5, dmg, owner); }
    const camD = Math.hypot(x - G.cam.x, y - G.cam.y);
    if (camD < 350 * big) { G.flash = Math.max(G.flash, 0.35 * (1 - camD / (350 * big))); G.flashColor = '255,180,90'; }
    Sound.boom(Sound.volAt(x, y), big);
}

function damage(t, amount, attacker, weapon) {
    if (t.dead || (attacker && attacker !== t && !foe(attacker, t))) return;
    // Inside a vehicle you're protected: it takes the hits (bullets, blasts and crashes all hit the vehicle itself)
    // until it's destroyed, and only then does anything get through to you
    if (t.car && !t.car.dead) return;
    if (G.time < (t.protectUntil || 0)) return;  // just respawned
    if (G.murder) amount = murderDamage(t, amount, attacker, weapon);
    if (t.downed) { t.downHp -= amount; t.hitFlash = 1; if (t.downHp <= 0) { t.downBy = attacker || t.downBy; t.downWeapon = weapon; finishDowned(t); } return; }
    let dmg = amount;
    if (t.isPlayer && G.strikeCam) G.strikeCam = null;  // (watching a boss strike: getting hurt brings the camera back)
    // Escape: stray airstrikes, bombs and burning cars only half hurt the group
    if (G.escape && !attacker && !t.soldier) dmg *= ESCAPE.ambient;
    if (G.time < (t.frozenUntil || 0)) dmg *= 1.5;  // frozen solid: hits shatter
    dmg *= edgeOf(t).takes;
    if (t.giant) dmg *= BOSS.takes;  // (his hide is thick)
    if (t.ghost) dmg *= 0.45;  // (bullets half pass through)
    if (attacker && attacker.ghost && attacker !== t) dmg *= 1.8;  // (and its blasts hit hard)
    if (attacker !== t) dmg *= edgeOf(attacker).hits;
    dmg = shieldAbsorb(t, dmg, attacker, weapon);
    if (t.armor > 0) {
        const absorb = Math.min(t.armor, dmg * CONFIG.ARMOR_ABSORB);
        t.armor -= absorb;
        dmg -= absorb;
    }
    t.hp -= dmg;
    t.hitFlash = 1;
    t.resting = false;
    t.lastHurt = G.time;

    if (attacker && attacker.isPlayer && attacker !== t) {
        addFloat(t.x + rand(-12, 12), t.y - 30, String(Math.round(amount)), t.armor > 0 ? '#8fd8ff' : amount >= 50 ? '#ffd166' : '#fff7ec', amount >= 50);
        G.hitMarker = 1;
        Sound.hit();
    }
    if (t.isPlayer) {
        G.hurt = Math.min(1, G.hurt + dmg / 40);
        Sound.hurt();
    }
    // Bots fight back against whoever hit them
    if (!t.isPlayer && attacker && attacker !== t && !attacker.dead) {
        if (t.target !== attacker) t.engageAt = G.time + (t.boss ? rand(30, 80) : rand(150, 350));
        t.target = attacker;
        t.mode = 'fight';
    }
    if (t.hp <= 0) killFighter(t, attacker, weapon);
}

function killFighter(t, killer, weapon) {
    if (t.cook) {
        const { key } = t.cook, left = cookLeft(t);
        t.cook = null;
        if (left > 0) launchThrowable(t, t.x + Math.cos(t.angle) * 60, t.y + Math.sin(t.angle) * 60, key, left);
    }
    // Zombies: survivors don't die, they turn. Zombies that go down stay down.
    if (G.zombies && !t.zombie) {
        if (killer && killer !== t) killer.kills++;
        turnZombie(t);
        bloodSplat(t.x, t.y, rand(0, TAU), 1.4);
        if (inView(t.x, t.y, 100)) {
            burst(t.x, t.y, 24, '#9be35a', 220, 'blood');
            G.particles.push({ type: 'ring', x: t.x, y: t.y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 60, color: ZOMBIE.color });
        }
        if (G.mode !== 'demo') addKillfeed(t, killer, 'infected');
        if (t.isPlayer && G.mode === 'playing') {
            G.timeScale = 0.3;
            G.flash = 0.6;
            G.flashColor = '120,200,60';
            Sound.death();
            showBanner('YOU HAVE BEEN INFECTED', true, 'You are a zombie now. Hunt down the survivors!');
        }
        return;
    }
    if (t.decoy) { t.dead = true; burst(t.x, t.y, 20, '#ffd166', 220, 'glow'); if (killer && killer.isPlayer === false) killer.target = null; return; }
    // Team modes: you go down first, and a teammate has a chance to get you back up
    if (G.war && !G.revolution && !t.downed && !t.finishing && !t.vaporized && weapon !== 'zone' && weapon !== 'Collapse' && G.fighters.some(f => f !== t && !f.dead && !f.downed && f.team === t.team)) { goDown(t, killer, weapon); return; }
    t.downed = false;
    t.hp = 0;
    t.dead = true;
    t.diedAt = G.time;
    t.killedBy = killer;
    G.alive--;
    if (killer && killer !== t) killer.kills++;

    // (in the menu's background battle people just fall as bodies; in a real game they break into cubes)
    if (!t.escaped && !t.vaporized && G.mode !== 'demo') { if (inView(t.x, t.y, 300)) cubeDeath(t); }
    else if (!t.escaped && !t.vaporized) addCorpse(t);
    dropDeathWeapons(t);
    if (G.mode === 'demo' && inView(t.x, t.y, 100)) {
        burst(t.x, t.y, 22, t.color, 260, 'blood');
        burst(t.x, t.y, 10, '#ff4f6d', 180, 'blood');
        G.particles.push({ type: 'ring', x: t.x, y: t.y, vx: 0, vy: 0, life: 0.4, max: 0.4, size: 50, color: t.color });
    }

    // (Murder Mystery: the feed never says who did it, or how)
    if (G.mode !== 'demo') { if (G.murder) addKillfeed(t, killer && killer.isPlayer ? killer : null, killer && killer.isPlayer ? weapon : weapon === 'Shot an innocent' ? 'shot an innocent' : 'murdered'); else addKillfeed(t, killer, weapon); }
    if (G.murder) murderDeath(t, killer);

    if (killer && killer.isPlayer && killer !== t) playerKillFx(t);
    if (G.war) { warDeath(t, killer, weapon); return; }
    if (t.isPlayer && G.result) return;
    if (t.isPlayer && t.assassin) return;  // (Assassin: caught or taken down, it's reported as a catch)
    if (t.isPlayer) {
        G.result = { won: false, place: G.escape ? G.sides.a + G.escaped : G.alive + 1, sub: G.escape ? `The army got you. ${G.escaped} of ${ESCAPE.people} people escaped.` : G.bossFight && G.bossF && !G.bossF.dead ? `The boss still has ${Math.ceil(G.bossF.hp / G.bossF.maxHp * 100)}% of his health left.` : null, killer: killer && killer !== t ? killer.name : killer === t ? `your own ${weapon.toLowerCase()}` : (weapon === 'zone' ? 'the zone' : null) };
        if (t.guiltyDeath) Object.assign(G.result, { sub: 'You shot an innocent, so you went down too.', killer: null });
        else if (G.murder) G.result.sub = t.murderer ? 'The murderer has been stopped.' : `The murderer was ${G.murdererF ? G.murdererF.name : 'someone'}.`;
        G.overAt = G.time + 1800;
        G.timeScale = 0.25;
        G.flash = 0.5;
        G.flashColor = '255,40,70';
        canvas.classList.add('dead');
        Sound.death();
    } else if (G.player && !G.player.dead && G.alive === 1 && !G.noZone) {
        G.result = { won: true, place: 1 };
        G.overAt = G.time + 2200;
        startVictory();
    }
}

// War mode: the game ends when only one team is left (or yours is wiped out)
// ---------- Downed and revived (team modes) ----------
const REVIVE = { bleed: 20000, time: 3000, reach: 52, hp: 25, regen: 6, downHp: 60, seek: 750 };

function goDown(t, killer, weapon) {
    t.downed = true;
    t.downAt = G.time;
    t.downBy = killer; t.downWeapon = weapon;
    t.hp = 1; t.downHp = REVIVE.downHp; t.reviveT = 0;
    t.healing = null; t.vx = t.vy = 0;
    if (t.cook) { const { key } = t.cook, left = cookLeft(t); t.cook = null; if (left > 0) launchThrowable(t, t.x + Math.cos(t.angle) * 40, t.y + Math.sin(t.angle) * 40, key, left); }
    if (t.up && !t.isPlayer) t.post = null;
    bloodSplat(t.x, t.y, rand(0, TAU), 1);
    if (G.mode !== 'demo') addKillfeed(t, killer, `${weapon || 'down'} · downed`);
    if (killer && killer.isPlayer && killer !== t) { addFloat(t.x, t.y - 30, 'DOWNED', '#ffd166', true); Sound.hit(); }
    if (t.isPlayer && G.mode === 'playing') { G.flash = 0.4; G.flashColor = '255,40,70'; Sound.hurt(); showBanner("YOU'RE DOWN", true, `Hang on: a teammate can revive you (${Math.round(REVIVE.bleed / 1000)} seconds)`); }
}

// Finished off, or bled out: now it's a real death
function finishDowned(t) {
    if (!t.downed || t.dead) return;
    t.downed = false;
    t.finishing = true;
    t.hp = 0;
    killFighter(t, t.downBy && !t.downBy.dead ? t.downBy : null, t.downWeapon || 'Bled out');
}

function reviveFighter(t, by) {
    t.downed = false;
    t.hp = REVIVE.hp; t.reviveRegen = true; t.reviveT = 0;
    t.protectUntil = G.time + 1500;
    burst(t.x, t.y, 18, '#5ee08a', 220, 'glow');
    G.particles.push({ type: 'ring', x: t.x, y: t.y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 60, color: '#5ee08a' });
    if (G.mode !== 'demo') addKillfeed(t, by, 'revived');
    if (t.isPlayer) showBanner('REVIVED', false, `${by.name} got you back up. Your health will build back up`);
    else if (by.isPlayer) { addFloat(t.x, t.y - 30, 'REVIVED', '#5ee08a', true); Sound.tone(660, 0.3, 'sine', 0.1, 990); }
}

function updateDowned(dt) {
    for (const f of G.fighters) {
        if (f.dead) continue;
        // Back on your feet with a sliver of health that builds back up to full
        if (f.reviveRegen) { f.hp = Math.min(f.maxHp, f.hp + REVIVE.regen * dt); if (f.hp >= f.maxHp) f.reviveRegen = false; }
        if (!f.downed) continue;
        if (G.time - f.downAt > REVIVE.bleed) { finishDowned(f); continue; }
        let helper = null;
        G.fgrid.query(f.x, f.y, REVIVE.reach, h => { if (!helper && h !== f && !h.dead && !h.downed && !h.car && h.team === f.team && (h.up || null) === (f.up || null) && Math.hypot(h.x - f.x, h.y - f.y) < REVIVE.reach) helper = h; });
        if (helper) { f.reviveT += dt * 1000; f.helper = helper; if (f.reviveT >= REVIVE.time) reviveFighter(f, helper); }
        else { f.reviveT = Math.max(0, f.reviveT - dt * 500); f.helper = null; }
    }
}

// A bot with nobody shooting at it goes to get a downed teammate nearby back up
function reviveTarget(b) {
    let best = null, bd = REVIVE.seek;
    for (const f of G.fighters) {
        if (!f.downed || f.dead || f === b || f.team !== b.team) continue;
        const d = Math.hypot(f.x - b.x, f.y - b.y);
        if (d < bd && (!f.helper || f.helper === b)) { bd = d; best = f; }
    }
    return best;
}

// Downed: lying on the ground, a bleed-out ring running down, and the revive ring filling up as a teammate helps
function drawDowned(f) {
    ctx.save(); ctx.translate(f.x, f.y);
    ctx.fillStyle = 'rgba(120,10,20,0.35)'; ctx.beginPath(); ctx.ellipse(4, 6, f.r * 1.5, f.r, 0, 0, TAU); ctx.fill();
    ctx.rotate(1.2);
    ctx.fillStyle = f.dark; ctx.beginPath(); ctx.ellipse(0, 0, f.r * 1.15, f.r * 0.75, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(0, 0, f.r, f.r * 0.62, 0, 0, TAU); ctx.fill();
    ctx.restore();
    const bleed = 1 - (G.time - f.downAt) / REVIVE.bleed;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,60,60,0.85)';
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r + 10, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(bleed, 0, 1)); ctx.stroke();
    if (f.reviveT > 0) { ctx.strokeStyle = '#5ee08a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(f.x, f.y, f.r + 18, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(f.reviveT / REVIVE.time, 0, 1)); ctx.stroke(); }
    if (G.player && f.team === G.player.team && !G.player.dead) {
        ctx.font = '700 12px Rajdhani, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff7ec';
        ctx.fillText(f.isPlayer ? 'DOWN' : f.reviveT > 0 ? 'REVIVING' : 'NEEDS REVIVE', f.x, f.y - f.r - 26);
    }
}

function warDeath(t, killer, weapon) {
    if (G.revolution) { revoDeath(t, killer, weapon); return; }
    const w = G.war;
    if (--G.teamAlive[t.team] === 0) w.out.push(t.team);
    if (G.mode === 'demo') return;
    if (t.isPlayer) {
        G.killedBy = killer && killer !== t ? killer.name : killer === t ? `your own ${weapon.toLowerCase()}` : (weapon === 'zone' ? 'the zone' : null);
        G.timeScale = 0.25;
        G.flash = 0.5;
        G.flashColor = '255,40,70';
        Sound.death();
        if (G.teamAlive[0] > 0) showBanner('YOU ARE DEAD', true, `${G.teamAlive[0]} of your team still fighting`);
    } else if (G.teamAlive[t.team] === 0 && !G.result) {
        showBanner(`${TEAMS[t.team].name.toUpperCase()} TEAM WIPED OUT`, t.team === 0, t.team === 0 ? '' : `${G.teamAlive.filter(n => n > 0).length} teams left`);
    }
    if (G.result) return;
    const left = G.teamAlive.filter(n => n > 0).length;
    if (G.teamAlive[0] === 0) {
        G.result = { won: false, place: left + 1, killer: G.killedBy };
        G.overAt = G.time + 1800;
        canvas.classList.add('dead');
    } else if (left === 1) {
        G.result = { won: true, place: 1 };
        G.overAt = G.time + 2200;
        startVictory();
    }
}

const STREAKS = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'QUAD KILL', 'RAMPAGE', 'UNSTOPPABLE'];

function playerKillFx(t) {
    G.streak = G.time < G.streakUntil ? G.streak + 1 : 1;
    G.streakUntil = G.time + 5000;
    // Brief slow-mo, camera punch and a gold flash
    G.timeScale = 0.3;
    G.zoomKick = 0.07;
    G.flash = 0.28;
    G.flashColor = '255,209,102';
    G.particles.push({ type: 'ring', x: t.x, y: t.y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 110, color: '#ffd166' });
    G.particles.push({ type: 'ring', x: t.x, y: t.y, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 70, color: '#fff7ec' });
    burst(t.x, t.y, 34, '#ffd166', 420, 'glow');
    G.particles.push({ type: 'skull', x: t.x, y: t.y - 10, vx: 0, vy: -70, life: 1.3, max: 1.3, size: 16 });
    Sound.kill(G.streak);
    const k = G.player.kills;
    showBanner(`ELIMINATED ${t.name.toUpperCase()}`, false, G.streak > 1 ? STREAKS[Math.min(G.streak, STREAKS.length - 1)] : `${k} KILL${k === 1 ? '' : 'S'}`);
    hud.kills.classList.remove('pop');
    void hud.kills.offsetWidth;
    hud.kills.classList.add('pop');
}

function startVictory(sub) {
    G.victory = true;
    G.victoryAge = 0;
    G.timeScale = 0.2;
    G.flash = 0.7;
    G.flashColor = '255,236,170';
    Sound.fanfare();
    showBanner('VICTORY!', false, sub || (G.war ? 'Your team won the war' : 'Last one standing'));
}

// Fireworks and confetti run on real time so they stay lively during slow-mo
function updateVictory(realDt) {
    if (!G.victory) return;
    G.victoryAge += realDt;
    G.winZoom = lerp(G.winZoom, 0.12, Math.min(1, realDt * 1.5));
    if (G.victoryAge < 7 && Math.random() < realDt * 3.5) {
        const x = G.cam.x + rand(-viewW * 0.4, viewW * 0.4), y = G.cam.y + rand(-viewH * 0.35, viewH * 0.3);
        const col = pick(['#ffd166', '#ff5a5f', '#3ee6c1', '#c77dff', '#4cb6ff', '#fff7ec']);
        burst(x, y, 46, col, 380, 'glow');
        G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 90, color: col });
        Sound.pop();
    }
    if (G.victoryAge < 5) {
        for (let i = 0; i < 6; i++) {
            G.confetti.push({ x: rand(0, viewW), y: rand(-60, -10), vx: rand(-40, 40), vy: rand(120, 260), rot: rand(0, TAU), spin: rand(-8, 8), w: rand(6, 11), h: rand(3, 6), sway: rand(0, TAU), color: pick(['#ffd166', '#ff5a5f', '#3ee6c1', '#c77dff', '#4cb6ff', '#ff8a3d', '#fff7ec']) });
        }
    }
    for (const c of G.confetti) {
        c.sway += realDt * 3;
        c.x += (c.vx + Math.sin(c.sway) * 60) * realDt;
        c.y += c.vy * realDt;
        c.rot += c.spin * realDt;
    }
    G.confetti = G.confetti.filter(c => c.y < viewH + 30);
}

// ---------- Effects ----------
// ---------- Death cubes ----------
// Someone killed breaks into 50 neon blue and yellow cubes that fall naturally, bounce once and come to a stop,
// sparkle for 3 seconds, then crackle, shrinking smaller and smaller until they're gone
const DCUBE = { n: 50, blue: [30, 200, 255], yellow: [255, 240, 60], grav: 1000, bounce: 0.42, sparkle: 3, crackle: 1.1, tilt: -0.6 };
// The six sides: three yellow (+x, +y, +z) and three blue
const CUBE_FACES = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1]].map((n, i) => {
    const [a, b, c] = n, k = a ? 0 : b ? 1 : 2, u = (k + 1) % 3, v = (k + 2) % 3, cs = [];
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = [0, 0, 0]; q[k] = a + b + c; q[u] = su; q[v] = sv; cs.push(q); }
    return [n, cs, i < 3 ? 0 : 1];
});
function cubeDeath(t) {
    const r = t.r || CONFIG.RADIUS, kd = t.killedBy && t.killedBy !== t ? Math.atan2(t.y - t.killedBy.y, t.x - t.killedBy.x) : rand(0, TAU);
    for (let i = 0; i < DCUBE.n; i++) {
        const a = rand(0, TAU), d = Math.sqrt(Math.random()) * r, sp = rand(55, 140);
        G.particles.push({ type: 'cube', x: t.x + Math.cos(a) * d, y: t.y + Math.sin(a) * d * 0.7, z: rand(4, r * 2.2),
            vx: Math.cos(a) * sp + Math.cos(kd) * rand(10, 60), vy: Math.sin(a) * sp * 0.7 + Math.sin(kd) * rand(10, 60), vz: rand(120, 260),
            ax: rand(0, TAU), ay: rand(0, TAU), az: rand(0, TAU), wx: rand(-9, 9), wy: rand(-9, 9), wz: rand(-6, 6),
            size: rand(3.2, 4.8), bounced: false, ground: false, rest: -1, fade: 0, seed: rand(0, 1),
            crackleAt: DCUBE.sparkle + rand(0, 0.5), life: 99, max: 99, color: i % 2 ? '#1ec8ff' : '#fff03c' });
    }
    // a light pop as they burst out
    G.particles.push({ type: 'ring', x: t.x, y: t.y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 40, color: '#bff4ff' });
    burst(t.x, t.y, 10, '#ffffff', 160, 'glow');
}
function updateCube(p, dt) {
    if (p.rest < 0) {
        // Falling, then one bounce, then sliding to a stop
        p.vz -= DCUBE.grav * dt; p.z += p.vz * dt;
        if (p.z <= 0) {
            p.z = 0;
            if (!p.bounced && p.vz < -60) {
                p.bounced = true; p.vz = -p.vz * DCUBE.bounce; p.vx *= 0.6; p.vy *= 0.6; p.wx *= 0.5; p.wy *= 0.5; p.wz *= 0.5;
                if (Math.random() < 0.15) Sound.tink(Sound.volAt(p.x, p.y));
            } else { p.vz = 0; p.ground = true; }
        }
        const f = Math.pow(p.ground ? 0.02 : 0.8, dt);
        p.vx *= f; p.vy *= f;
        if (p.ground) {
            // spin dies away and the cube settles flat on a side
            const sd = Math.pow(0.002, dt); p.wx *= sd; p.wy *= sd; p.wz *= sd;
            const flat = v => Math.round(v / (Math.PI / 2)) * (Math.PI / 2), k = Math.min(1, dt * 10);
            p.ax += (flat(p.ax) - p.ax) * k; p.ay += (flat(p.ay) - p.ay) * k;
            if (Math.hypot(p.vx, p.vy) < 4) { p.rest = 0; p.vx = p.vy = 0; }
        }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.ax += p.wx * dt; p.ay += p.wy * dt; p.az += p.wz * dt;
        if (p.z === 0 && p.ground && p.rest < 0 && G.time - (p.t0 || (p.t0 = G.time)) > 2500) p.rest = 0;
        return;
    }
    p.rest += dt;
    // every so often, find the cubes lying next to it, so shocks can jump between them
    if ((p.nbT = (p.nbT || 0) - dt) <= 0) {
        p.nbT = rand(0.25, 0.4); p.nb = [];
        for (const q of G.particles) if (q !== p && q.type === 'cube' && q.rest >= 0 && q.fade < 1 && Math.hypot(q.x - p.x, q.y - p.y) < 45) { p.nb.push(q); if (p.nb.length >= 3) break; }
    }
    // Electricity (like the old cube effects): little arcs keep jumping off it, and often across to a cube close by
    // (quick streaks: lots of them, each one flashes for only a frame or two and is gone)
    p.zapT = (p.zapT || 0) - dt;
    for (let n = 0; p.zapT <= 0 && n < 2; n++) {
        const hard = p.rest >= p.crackleAt;
        p.zapT += hard ? rand(0.01, 0.025) : rand(0.015, 0.04);
        if (G.particles.length > 3000) { p.zapT = 0.05; break; }
        const a = rand(0, TAU), Lz = rand(8, 22) * (1 - p.fade * 0.5), col = Math.random() < 0.25 ? '#e8ffff' : Math.random() < 0.6 ? '#1ec8ff' : p.color;
        const nb = (p.nb || []).filter(q => q.life > 0 && q.fade < 1), o = nb.length && Math.random() < 0.45 ? nb[(Math.random() * nb.length) | 0] : null;
        if (o) G.particles.push({ type: 'zap', x: p.x, y: p.y, x2: o.x, y2: o.y, vx: 0, vy: 0, life: rand(0.02, 0.04), max: 0.04, seed: Math.random(), color: col });
        else G.particles.push({ type: 'zap', x: p.x, y: p.y, x2: p.x + Math.cos(a) * Lz, y2: p.y + Math.sin(a) * Lz * 0.7, vx: 0, vy: 0, life: rand(0.02, 0.04), max: 0.04, seed: Math.random(), color: col });
    }
    if (p.rest < p.crackleAt) {
        // Sparkling on the ground
        if (Math.random() < dt * 2) Sound.crackle(Sound.volAt(p.x, p.y) * 0.35);
        if (Math.random() < dt * 3) G.particles.push({ type: 'twinkle', x: p.x + rand(-6, 6), y: p.y - rand(2, 10), vx: 0, vy: -8, life: 0.35, max: 0.35, size: rand(4, 7), color: Math.random() < 0.5 ? '#ffffff' : p.color });
        return;
    }
    // Crackling away: smaller and smaller, with electricity constantly and rapidly shocking every cube
    // (the arcs themselves are drawn fresh every frame in drawCube)
    p.fade = Math.min(1, (p.rest - p.crackleAt) / DCUBE.crackle);
    if (Math.random() < dt * 6) Sound.crackle(Sound.volAt(p.x, p.y) * 0.7);
    if (Math.random() < dt * 8) burst(p.x, p.y - 3, 1, Math.random() < 0.5 ? '#ffffff' : p.color, 90, 'spark');
    if (p.fade >= 1) { p.life = 0; burst(p.x, p.y - 2, 3, p.color, 60, 'glow'); }
}
function drawCube(p) {
    const s = p.size * (1 - p.fade) * (p.fade > 0 ? 0.7 + 0.5 * Math.random() : 1);
    if (s < 0.3) return;
    const cx = Math.cos(p.ax), sx = Math.sin(p.ax), cy = Math.cos(p.ay), sy = Math.sin(p.ay), cz = Math.cos(p.az), sz = Math.sin(p.az), ct = Math.cos(DCUBE.tilt), st = Math.sin(DCUBE.tilt);
    const rot = ([x, y, z]) => {
        let y1 = y * cx - z * sx, z1 = y * sx + z * cx;           // round x
        let x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;        // round y
        let x3 = x2 * cz - y1 * sz, y3 = x2 * sz + y1 * cz;       // round z
        return [x3, y3 * ct - z2 * st, y3 * st + z2 * ct];        // tipped towards the camera
    };
    const X = p.x, Y = p.y - p.z;
    // shadow on the ground while it's in the air
    if (p.z > 1) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, s * 1.3, s * 0.6, 0, 0, TAU); ctx.fill(); }
    // soft neon glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.22 * (1 - p.fade * 0.5);
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(X, Y, s * 2.6, 0, TAU); ctx.fill(); ctx.restore();
    ctx.lineJoin = 'round'; ctx.lineWidth = 0.8;
    for (const [n, cs, side] of CUBE_FACES) {
        const nn = rot(n);
        if (nn[2] <= 0.02) continue;
        const c = side ? DCUBE.blue : DCUBE.yellow, b = 0.65 + 0.35 * nn[2] + (p.fade > 0 ? 0.8 * Math.random() : 0);
        ctx.fillStyle = `rgb(${Math.min(255, c[0] * b + 40 * nn[2])},${Math.min(255, c[1] * b + 40 * nn[2])},${Math.min(255, c[2] * b + 40 * nn[2])})`;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        cs.forEach((q, i) => { const [a, bb] = rot(q); i ? ctx.lineTo(X + a * s, Y + bb * s) : ctx.moveTo(X + a * s, Y + bb * s); });
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }
}

function inView(x, y, pad = 0) {
    return Math.abs(x - G.cam.x) < viewW / 2 / G.zoom + pad && Math.abs(y - G.cam.y) < viewH / 2 / G.zoom + pad;
}

function burst(x, y, n, color, speed, type = 'spark') {
    if (!inView(x, y, 100) || G.particles.length > 1500) return;
    for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), s = rand(speed * 0.3, speed);
        G.particles.push({ type, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.25, 0.6), max: 0.6, size: rand(2, 4.5), color });
    }
}

function addFloat(x, y, text, color, big) {
    G.floats.push({ x, y, text, color, life: 0.9, max: 0.9, big: !!big });
}

// ---------- Player ----------
// ---------- 8x scope (sniper rifles only) ----------
// Scoped in, the view slides out 8 times as far as your mouse is from the middle of the screen,
// and you aim at the middle of the scope instead of the mouse.
const SCOPE = { mag: 8, guns: { 'Sniper': 1, 'AWP': 1, 'Barrett': 1, 'Railgun': 1 } };
const canScope = p => !!(G && G.mode === 'playing' && p && p.isPlayer && !p.dead && !p.downed && !p.car && !p.nadeReady && SCOPE.guns[p.inv[p.slot]]);
function scopeTarget(p) {
    const W = CONFIG.WORLD_SIZE, dx = (mouse.x - viewW / 2) / G.zoom, dy = (mouse.y - viewH / 2) / G.zoom;
    return { x: clamp(p.x + dx * SCOPE.mag, 0, W), y: clamp(p.y + dy * SCOPE.mag, 0, W) };
}
const scopedIn = () => !!(G && G.player && G.player.scoped && canScope(G.player));
function drawScope() {
    const t = G.player.scopeAt; if (!t) return;
    const zoom = G.zoom, cx = (t.x - G.cam.x) * zoom + viewW / 2, cy = (t.y - G.cam.y) * zoom + viewH / 2;
    const R = Math.min(viewW, viewH) * 0.42;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.beginPath(); ctx.rect(0, 0, viewW, viewH); ctx.arc(cx, cy, R, 0, TAU); ctx.fill('evenodd');
    ctx.strokeStyle = '#111'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx - 18, cy); ctx.moveTo(cx + 18, cy); ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy - 18); ctx.moveTo(cx, cy + 18); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx - R * 0.45, cy); ctx.moveTo(cx + R * 0.45, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy + R * 0.45); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    for (let i = 1; i <= 4; i++) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.beginPath(); ctx.arc(cx + ax * i * R * 0.09, cy + ay * i * R * 0.09, 2.2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, TAU); ctx.fill();
    // night vision in the pitch-dark modes
    if (pitchDark()) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(120,255,140)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    ctx.font = '800 16px Rajdhani, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#8fd8ff';
    ctx.fillText(`${SCOPE.mag}x · ${Math.round(Math.hypot(t.x - G.player.x, t.y - G.player.y) / 10)}m`, cx + R * 0.05, cy + R * 0.05);
    ctx.restore();
}

function mouseWorld() {
    if (G && G.player && G.player.scoped && G.player.scopeAt && canScope(G.player)) return { x: G.player.scopeAt.x, y: G.player.scopeAt.y };
    return { x: (mouse.x - viewW / 2) / G.zoom + G.cam.x, y: (mouse.y - viewH / 2) / G.zoom + G.cam.y };
}

function updatePlayer(p, dt) {
    const I = inputOf(p), keys = I.keys, mouse = I.mouse, mouseWorld = I.world;
    let mx = 0, my = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    let len = Math.hypot(mx, my) || 1;
    // (the touch joystick: as fast as you push it)
    if (I === LOCAL_INPUT && TOUCH.move.on) { mx = TOUCH.move.x; my = TOUCH.move.y; len = 1; }
    // Driving: the car handles the controls (see updateCars)
    if (p.car) return;
    autoPickup(p);
    // Survival: frozen on the platform until the countdown ends; resting until you move
    if (G.frozen || p.resting || stunned(p)) {
        if (p.resting && !stunned(p) && (mx || my || mouse.down)) p.resting = false;
        else { p.vx = p.vy = 0; const m = mouseWorld(); p.angle = Math.atan2(m.y - p.y, m.x - p.x); return; }
    }
    // (the jet pack makes you faster)
    const sp = CONFIG.PLAYER_SPEED * (p.zombie ? 1.08 : 1) * (p.perk === 'jet' ? 1.35 : 1) * (p.ghost ? GHOST.speed : 1);
    if (mx || my) p.moveHeading = Math.atan2(my, mx);
    p.vx = (mx / len) * sp;
    p.vy = (my / len) * sp;

    const m = mouseWorld();
    p.angle = Math.atan2(m.y - p.y, m.x - p.x);
    if (p.nadeReady && !(p.items[p.throwSel] > 0) && !p.cook) p.nadeReady = false;
    if (p.nadeReady) {
        // A grenade in hand: the trigger pulls the pin, and letting go throws it where you're aiming
        if (mouse.down && !p.cook) { playerCook(p); if (p.cook) p.cookByTrigger = true; }
        else if (!mouse.down && p.cook && p.cookByTrigger) { p.cookByTrigger = false; playerRelease(p); }
    } else if (mouse.down) {
        // Fort Wars build: swing at a tree in front of you to chop it, anywhere else puts down a wooden wall
        if (G.fort && G.fort.build && !fortTreeAhead(p)) placeFortBlock(p, m); else tryAttack(p);
    }
}

// ---------- Bot AI ----------
// The closest survivor from the horde's list (zombies hunt them across the map)
function nearestPrey(b) {
    let best = null, bd = Infinity;
    for (const f of G.prey) {
        if (f.dead || !isPrey(f) || f === b) continue;
        const d = (f.x - b.x) ** 2 + (f.y - b.y) ** 2;
        if (d < bd) { bd = d; best = f; }
    }
    return best;
}

// Zombies don't loot or heal: they charge anyone they can see and otherwise roam toward the nearest survivor
function zombieThink(b) {
    b.nextThink = G.time + rand(200, 400);
    let enemy = null, bd = CONFIG.BOT_SIGHT;
    G.fgrid.query(b.x, b.y, CONFIG.BOT_SIGHT, f => {
        if (f.dead || f.zombie) return;
        const d = Math.hypot(f.x - b.x, f.y - b.y);
        if (d < bd && (d < 260 || lineOfSight(b, f))) { bd = d; enemy = f; }
    });
    if (enemy) {
        if (b.target !== enemy) b.engageAt = G.time + (b.soldier && !b.boss ? rand(350, 650) : rand(100, 250));
        b.mode = 'fight';
        b.target = enemy;
        b.hasLOS = lineOfSight(b, enemy);
        return;
    }
    b.mode = 'hunt';
    b.goal = nearestPrey(b);
    b.hasLOS = false;
}

// Bots spread out over loot: each pile is called by one bot, each crate by a few
const claimedByOther = (o, b) => o.claim && o.claim !== b && !o.claim.dead && o.claim.goal === o && o.claim.mode === 'loot';
// Something a bot couldn't get to (walled off, round a corner it can't work out): it leaves it alone for a while
const gaveUpOn = (b, o) => b.skip && b.skip.has(o) && b.skip.get(o) > G.time;
function crateTakers(o, b) {
    if (!o.takers) return 0;
    o.takers = o.takers.filter(t => t !== b && !t.dead && t.goal === o && t.mode === 'box');
    return o.takers.length;
}
function claimBox(o, b) {
    (o.takers || (o.takers = [])).push(b);
    return o;
}

// AI level 1-10 (5 is the old normal): how wild the bots' aim is, how slow they are to open fire, how often they
// rethink, how fast they turn to aim, how far they notice people and how keen they are on grenades
function aiSkill(L) {
    return { level: L, aim: 2 ** ((5 - L) / 2.5), react: 2 ** ((5 - L) / 3), think: 1.3 - 0.06 * L, turn: 0.5 + 0.1 * L, sight: Math.min(1, 0.75 + 0.05 * L), nades: L / 5 };
}
const AIK = () => G.ai || AI_NORMAL;
const AI_NORMAL = aiSkill(5);

// Where an armed bot with nothing else to do should head to find a fight: in War, the nearest enemy team's main
// body (then the nearest enemy once it's there); elsewhere, once the field has thinned out, the nearest opponent.
// Kept inside the safe zone so nobody marches out into the storm
function marchTarget(b) {
    if (G.escape || b.zombie || b.soldier || G.mode !== 'playing') return null;
    let tx, ty;
    // Revolution: some of each side are raiders, who head straight for the other base to break it open
    if (G.revolution) {
        if (b.raider === undefined) b.raider = Math.random() < REVO.raiders;
        const eb = G.revolution.bases[1 - b.team];
        if (b.raider && eb && !eb.fallen) return { x: eb.target.x, y: eb.target.y };
    }
    if (G.war) {
        let best = null, bd = Infinity;
        G.war.centers.forEach((c, t) => { if (c && t !== b.team) { const d = Math.hypot(c.x - b.x, c.y - b.y); if (d < bd) { bd = d; best = c; } } });
        if (!best) return null;
        tx = best.x; ty = best.y;
        if (bd < 700) {
            let near = null, nd = Infinity;
            for (const f of G.fighters) if (!f.dead && foe(b, f)) { const d = Math.hypot(f.x - b.x, f.y - b.y); if (d < nd) { nd = d; near = f; } }
            if (!near) return null;
            tx = near.x; ty = near.y;
        }
    } else if (G.zombies) {
        // Survivors go after the zombies that are left
        let near = null, nd = Infinity;
        for (const f of G.fighters) if (!f.dead && f.zombie) { const d = Math.hypot(f.x - b.x, f.y - b.y); if (d < nd) { nd = d; near = f; } }
        if (!near) return null;
        tx = near.x; ty = near.y;
    } else if (G.alive <= 12) {
        let near = null, nd = Infinity;
        for (const f of G.fighters) if (!f.dead && foe(b, f)) { const d = Math.hypot(f.x - b.x, f.y - b.y); if (d < nd) { nd = d; near = f; } }
        if (!near) return null;
        tx = near.x; ty = near.y;
    } else return null;
    const g = zoneGoal(), d = Math.hypot(tx - g.x, ty - g.y), lim = Math.max(0, g.r - 150);
    if (d > lim && d > 0) { tx = g.x + (tx - g.x) / d * lim; ty = g.y + (ty - g.y) / d * lim; }
    return { x: tx, y: ty };
}

function botThink(b) {
    if (b.zombie) { zombieThink(b); return; }
    if (G.murder) { murderBot(b); return; }
    if (G.ghostMode && b.ghost) { ghostBot(b); return; }
    if (G.fort && G.fort.build) { b.nextThink = G.time + rand(300, 600); fortBot(b); return; }
    const K = AIK();
    b.nextThink = G.time + (b.boss ? rand(90, 160) : rand(220, 480) * K.think);
    // Escape: the group follows you (or, on the title screen, whoever's in front)
    if (G.escape && !b.soldier) b.lead = G.player && !G.player.dead ? G.player : G.fighters.find(f => !f.dead && !f.soldier);
    const goal = zoneGoal();
    const dZone = Math.hypot(b.x - goal.x, b.y - goal.y);
    const outside = G.mode !== 'demo' && dZone > Math.max(0, goal.r - 120);
    const urgent = outside && G.zone.state === 'shrink' && dZone > goal.r;

    // Find the closest enemy this bot can actually see (walls, crates and rocks block sight)
    const seen = [];
    G.fgrid.query(b.x, b.y, CONFIG.BOT_SIGHT, f => {
        if (f.dead || !foe(b, f)) return;
        const d = Math.hypot(f.x - b.x, f.y - b.y);
        if (f.downed && d > 220) return;  // a downed enemy isn't worth chasing
        if (f.ghost && !ghostSeen(f) && d > 70) return;  // (nobody can see the ghost unless it's just shot or been hit)
        if (d < (G.time < (b.blindUntil || 0) ? 110 : sightOf(f) * K.sight) && (!f.hidden || d < CONFIG.HIDDEN_SIGHT)) seen.push([d, f]);
    });
    seen.sort((p, q) => p[0] - q[0]);
    let enemy = null, bestD = CONFIG.BOT_SIGHT;
    for (let i = 0; i < seen.length && i < 3; i++) {
        if (lineOfSight(b, seen[i][1])) { [bestD, enemy] = seen[i]; break; }
    }
    // Escape: the group also opens up on army vehicles in view
    if (G.escape && b.team === 0 && !G.world.floor) for (const car of G.traffic) {
        const d = dist(b, car);
        if (car.state === 'drive' && d < bestD && lineOfSight(b, car)) { bestD = d; enemy = car.gunner; }
    }
    // Survival: a hungry bot with nobody to fight goes hunting
    if (!enemy && G.survival && b.hunger < 70) { const a = nearestAnimal(b, 700); if (a) { enemy = a; bestD = dist(b, a); } }
    // Survival: rest when worn out, drink when thirsty (a bucket, or walk to the nearest pond)
    if (G.survival) {
        if (b.resting) { if (enemy || b.energy >= 95) b.resting = false; else { b.mode = 'rest'; return; } }
        if (!enemy && !b.healing) {
            if (b.thirst < 45) {
                if (b.items.water > 0) startHeal(b, 'water');
                else if (inPond(b)) drinkFromPond(b);
                else { const pd = nearestPond(b); if (pd && !urgent) { b.mode = 'zone'; b.goal = { x: pd.x, y: pd.y }; return; } }
            } else if (b.energy < 30 && !outside) { b.resting = true; b.mode = 'rest'; return; }
            if (b.items.bucket > 0 && inPond(b)) drinkFromPond(b);
        }
    }
    // Ghost: with no ghost in sight, hunters follow fresh footprints
    if (!enemy && G.ghostMode && b.team === 0 && G.mode === 'playing') {
        const st = freshStep(b);
        if (st) { b.mode = 'zone'; b.goal = { x: st.x + Math.cos(st.a) * 140, y: st.y + Math.sin(st.a) * 140 }; return; }
    }
    // Nothing to fight and a vehicle nearby: some bots go for a drive
    if (!enemy && !urgent && b.mode !== 'loot' && b.mode !== 'box' && canDrive(b)) { const c = nearestCar(b, 380, true); if (c && !gaveUpOn(b, c)) { b.mode = 'tocar'; b.goal = c; return; } }
    // Stick with the current target unless someone is much closer; chase it briefly after losing sight
    if (b.target && !b.target.dead && b.mode === 'fight' && b.target !== enemy) {
        const d = dist(b, b.target);
        const visible = d < CONFIG.BOT_SIGHT * 1.2 && (!b.target.hidden || d < CONFIG.HIDDEN_SIGHT) && lineOfSight(b, b.target);
        if (visible && (!enemy || d < bestD + 150)) { enemy = b.target; bestD = d; }
        else if (!visible && !enemy && G.time - b.lastSeen < 3000) { enemy = b.target; bestD = d; }
    }
    // (the ghost can only be seen right after it shoots, or bumped into)
    if (enemy && enemy.ghost && !ghostSeen(enemy) && bestD > 60) { if (b.target === enemy && b.lastSpot) { b.mode = 'zone'; b.goal = { x: b.lastSpot.x, y: b.lastSpot.y }; b.target = null; return; } enemy = null; }
    // Someone hiding under a tree or in a bush can be hunted toward, but not shot at until they're spotted again
    b.hasLOS = !!enemy && (!enemy.hidden || bestD < CONFIG.HIDDEN_SIGHT) && lineOfSight(b, enemy);
    if (b.hasLOS) { b.lastSeen = G.time; b.lastSpot = { x: enemy.x, y: enemy.y }; }

    if (!canShoot(b)) chooseBotWeapon(b, bestD);

    // Patch up when nobody can see us
    if (!b.healing && (!enemy || !b.hasLOS)) {
        if (b.hp < 45 && b.items.heal > 0 && !enemy) throwGrenade(b, b.x + 20, b.y, 'heal');
        if (G.survival && b.hunger < 50 && b.items.meat > 0) startHeal(b, 'meat');
        else if (b.hp < 45 && b.items.medkit > 0) startHeal(b, 'medkit');
        else if (b.hp < 75 && b.items.bandage > 0) startHeal(b, 'bandage');
    }
    // Lob a grenade at mid-range targets, or over cover at someone we just lost sight of
    if (enemy && (b.hasLOS || !enemy.hidden) && b.items.grenade > 0 && bestD > 170 && bestD < GRENADE.range && G.time > b.engageAt) {
        if (Math.random() < (b.hasLOS ? 0.08 : 0.25) * K.nades) throwGrenade(b, enemy.x + enemy.vx * 0.5, enemy.y + enemy.vy * 0.5);
    }

    if (enemy && b.items.cure > 0 && enemy.zombie && bestD > 150 && bestD < GRENADE.range && Math.random() < 0.06) {
        throwGrenade(b, enemy.x, enemy.y, 'cure');
    }
    const special = ['shock', 'cluster', 'megafrag', 'fire', 'freeze', 'gravity', 'sticky', 'flash', 'poison', 'shockwave', 'drone'].find(k => b.items[k] > 0);
    if (enemy && special && b.hasLOS && bestD > (special === 'shock' ? 300 : 240) && bestD < GRENADE.range && Math.random() < 0.15 * K.nades) throwGrenade(b, enemy.x, enemy.y, special);
    if (enemy && b.hasLOS && b.items.strobe > 0 && bestD > 250 && bestD < GRENADE.range && Math.random() < 0.12) {
        throwGrenade(b, enemy.x, enemy.y, 'strobe');
    }

    // Team modes: a downed teammate nearby gets revived when it's safe enough
    if (G.war && (!enemy || bestD > 420)) { const d = reviveTarget(b); if (d) { if (b.mode !== 'zone' || b.goal !== d) { b.mode = 'zone'; b.goal = d; } return; } }
    // Revolution: go home to the healing rooms when hurt, to the armory when unarmed
    if (G.revolution && b.team !== null && G.mode === 'playing' && revoBotPlan(b, enemy, bestD)) return;
    // Once running, keep running for a few seconds rather than turning back every moment
    if (b.mode === 'flee' && G.time < (b.fleeUntil || 0) && b.target && !b.target.dead) return;
    if (enemy && b.hp < 30 && enemy.hp > b.hp + 25 && Math.random() < 0.5) {
        b.mode = 'flee';
        b.target = enemy;
        b.fleeUntil = G.time + rand(2500, 4000);
        if (b.items.smoke > 0) throwGrenade(b, b.x + Math.cos(b.angle) * 60, b.y + Math.sin(b.angle) * 60, 'smoke');
        return;
    }
    if (enemy && !urgent) {
        if (b.target !== enemy) {
            b.engageAt = G.time + (b.boss ? rand(40, 110) : rand(350, 750) * K.react);
            b.strafe = Math.random() < 0.5 ? 1 : -1;
        }
        b.mode = 'fight';
        b.target = enemy;
        chooseBotWeapon(b, bestD);
        return;
    }
    if (outside) {
        b.mode = 'zone';
        b.goal = goal;
        return;
    }
    // Boss Fight: the giant tracks down the team, and the team goes after him
    if (G.bossFight && (b.giant || b.team === 0) && (b.giant || b.inv.some(Boolean)) && bossHunt(b)) return;
    // Assassin: survivors can't stay together. Anyone too close to another survivor heads off on their own
    if (G.assassin && b.team === 0 && G.mode === 'playing') {
        let near = null, nd = ASSASSIN.apart;
        G.fgrid.query(b.x, b.y, ASSASSIN.apart, f => { if (f !== b && !f.dead && f.team === 0) { const d = Math.hypot(f.x - b.x, f.y - b.y); if (d < nd) { nd = d; near = f; } } });
        if (near) {
            const a = (nd > 1 ? Math.atan2(b.y - near.y, b.x - near.x) : rand(0, TAU)) + rand(-0.5, 0.5), W = CONFIG.WORLD_SIZE;
            b.mode = 'zone';
            b.goal = { x: clamp(b.x + Math.cos(a) * ASSASSIN.apart * 1.6, 150, W - 150), y: clamp(b.y + Math.sin(a) * ASSASSIN.apart * 1.6, 150, W - 150) };
            return;
        }
    }
    // Already on the way to some loot, a crate or a car: see it through instead of changing its mind as it walks
    if (b.mode === 'loot' && b.goal && !b.goal.gone && !claimedByOther(b.goal, b)) return;
    if (b.mode === 'box' && b.goal && !b.goal.broken) return;
    if (b.mode === 'tocar' && b.goal && !b.goal.dead && !b.goal.driver) return;
    // Escape: people stick with the group's leader (you), only stopping for loot that's right there;
    // soldiers hold their post, patrol, or sweep toward where the runners are
    if (G.escape) {
        if (!b.soldier) {
            const near = nearestLoot(b.x, b.y, 160, l => botWants(b, l.key) && !claimedByOther(l, b) && !gaveUpOn(b, l));
            if (near) { b.mode = 'loot'; b.goal = near; near.claim = b; return; }
            if (b.lead && b.lead !== b) {
                b.mode = 'follow';
                b.goal = b.lead;
                // Where my spot is right now; if it's inside a wall or round a corner from the leader, tuck in closer
                const t = b.lead, a0 = (t.moveHeading || 0) + (b.slotA || 0);
                let pt = null, a = a0;
                for (const off of [0, 0.5, -0.5, 1, -1]) {
                    for (const k of [1, 0.6]) {
                        const r = (b.slotR || 150) * k, q = { x: t.x + Math.cos(a0 + off) * r, y: t.y + Math.sin(a0 + off) * r };
                        if (!blockedAt(G.world.grid, q.x, q.y, b.r + 2) && lineOfSight(t, q)) { pt = q; a = a0 + off; break; }
                    }
                    if (pt) break;
                }
                // Nowhere sensible: hang back a little on my side of the leader rather than on top of them
                if (!pt) { const d = dist(b, t) || 1; pt = { x: t.x + ((b.x - t.x) / d) * 90, y: t.y + ((b.y - t.y) / d) * 90 }; }
                b.slotPt = pt;
                b.slotDir = a;
                return;
            }
        }
        if (b.post && dist(b, b.post) > 260) { b.mode = 'zone'; b.goal = b.post; return; }
        if (b.post) { b.mode = 'wander'; b.heading = Math.atan2(b.post.y - b.y, b.post.x - b.x) + rand(-2, 2); return; }
        if (b.squad) {
            // Keep my place in the squad around its waypoint; mill about once I'm there
            const g = b.squad.goal, spot = { x: g.x + b.sqOff.x, y: g.y + b.sqOff.y };
            if (dist(b, spot) > 70) { b.mode = 'zone'; b.goal = spot; return; }
            b.mode = 'wander';
            b.heading = rand(0, TAU);
            return;
        }
    }
    const armed = b.inv.some(Boolean), march = armed && marchTarget(b);
    // A soldier with a gun picks up what's close at hand on the way, but doesn't go wandering off for it
    const loot = nearestLoot(b.x, b.y, march ? 220 : 450, l => botWants(b, l.key) && !claimedByOther(l, b) && !gaveUpOn(b, l));
    if (loot) {
        b.mode = 'loot';
        b.goal = loot;
        loot.claim = b;
        return;
    }
    const box = findBoxFor(b);
    if (box) {
        b.mode = 'box';
        b.goal = box;
        return;
    }
    // Armed and nothing else to do: go and find the fight (the same goal object, so progress checks follow it)
    if (march) {
        if (b.mode !== 'march' || !b.goal) b.goal = { x: march.x, y: march.y };
        else { b.goal.x = march.x; b.goal.y = march.y; }
        b.mode = 'march';
        return;
    }
    b.mode = 'wander';
    if (b.items.mine > 0 && Math.random() < 0.03) placeMine(b);
    // Just got unstuck: keep walking the new way for a moment instead of turning straight back into the wall
    if (G.time < b.headingHold) return;
    // In war, squads push toward the closest enemy team
    if (G.war && Math.random() < 0.6) {
        let best = null, bd = Infinity;
        G.war.centers.forEach((c, t) => {
            if (!c || t === b.team) return;
            const d = Math.hypot(c.x - b.x, c.y - b.y);
            if (d < bd) { bd = d; best = c; }
        });
        if (best) { b.heading = Math.atan2(best.y - b.y, best.x - b.x) + rand(-0.6, 0.6); return; }
    }
    if (Math.random() < 0.3) b.heading = Math.atan2(goal.y - b.y, goal.x - b.x) + rand(-1.3, 1.3);
    else b.heading += rand(-0.8, 0.8);
}

function findBoxFor(b) {
    // Some bots will make a long trip for an airdrop
    // Each bot goes for its own nearby crate: a supply crate takes at most 3, an airdrop or box just 1
    const needGun = b.inv.includes(null);
    if (b.chasesDrops || (G.supplies && needGun)) {
        let best = null, bs = Infinity;
        for (const d of G.airdrops) {
            if (!d.landed || d.box.broken || gaveUpOn(b, d.box)) continue;
            const dd = dist(b, d.box), supply = d.kind === 'supply';
            if (dd > (supply ? 2200 : 1500)) continue;
            const n = crateTakers(d.box, b);
            if (n >= (supply ? 3 : 1)) continue;
            if (dd + n * 500 < bs) { bs = dd + n * 500; best = d.box; }
        }
        if (best) return claimBox(best, b);
    }
    if (!needGun) return null;
    let best = null, bd = 550;
    G.world.grid.query(b.x, b.y, 550, o => {
        if (o.type !== 'box' || o.broken || o.airdrop || o.on || crateTakers(o, b) > 0 || gaveUpOn(b, o)) return;
        const d = Math.hypot(o.x - b.x, o.y - b.y);
        if (d < bd) { bd = d; best = o; }
    });
    return best && claimBox(best, b);
}

function chooseBotWeapon(b, d) {
    if (b.giant) { bossWeapon(b, d); return; }
    let best = 0, score = -1;
    b.inv.forEach((slot, i) => {
        const n = slot || 'Fist', w = WEAPONS[n];
        if (!w.melee && !(b.ammo[n] > 0)) return;
        let s = w.melee ? (w.blade ? (w.damage / w.rate) * 100 * (d < w.range * 2.5 ? 1.6 : 0.4) : 0.5) : w.rocket ? (d > ROCKET.radius + 40 ? 14 : 0.1) : (w.damage * (w.count || 1)) / w.rate * 100;
        if (!w.melee && d > w.range * 0.9) s *= 0.2;
        if (s > score) { score = s; best = i; }
    });
    if (best !== b.slot) switchSlot(b, best);
}

// Next waypoint toward (gx, gy): bots use doorways to get into and out of buildings
function routeTo(b, gx, gy) {
    if (G.world.maze) return mazeRoute(b, gx, gy);
    // Up on a deck: straight there if it's up here too, otherwise to the nearest stairs down
    if (b.up) return onDeck(b.up, { x: gx, y: gy }) ? deckWaypoint(b.up, b, { x: gx, y: gy }) : deckWaypoint(b.up, b, b.up.stairs.reduce((p, s) => (dist(b, s.t) < dist(b, p) ? s.t : p), b.up.stairs[0].t));
    // Following a planned route round the walls
    if (b.path && b.path.length) {
        const g = b.pathGoal;
        if (g && Math.hypot(g.x - gx, g.y - gy) < 150) {
            while (b.path.length > 1 && Math.hypot(b.path[0].x - b.x, b.path[0].y - b.y) < 24) b.path.shift();
            // Reached the end of a part-way route: back to heading straight for the goal until it's needed again
            if (!(b.path.partial && b.path.length === 1 && Math.hypot(b.path[0].x - b.x, b.path[0].y - b.y) < 40)) return b.path[0];
        }
        b.path = null;
    }
    const from = buildingAt(b.x, b.y), to = buildingAt(gx, gy);
    if (from === to) return { x: gx, y: gy };
    const house = from || to;
    let door = null, bd = Infinity;
    for (const d of house.doors) {
        // Leaving: pick the door closest to the goal. Entering: the door closest to the bot.
        const dd = from ? Math.hypot(d.x - gx, d.y - gy) + Math.hypot(d.x - b.x, d.y - b.y) * 0.5 : Math.hypot(d.x - b.x, d.y - b.y);
        if (dd < bd) { bd = dd; door = d; }
    }
    if (!door) return { x: gx, y: gy };
    const near = Math.hypot(door.x - b.x, door.y - b.y) < 45;
    if (from) return near || Math.hypot(door.inner.x - b.x, door.inner.y - b.y) < 30 ? door.outer : door.inner;
    return near || Math.hypot(door.outer.x - b.x, door.outer.y - b.y) < 30 ? door.inner : door.outer;
}

// Feel ahead for walls, cars, rocks and trees and turn along them instead of walking straight into them
function steerAround(b, dx, dy) {
    if (G.time >= b.nextProbe) {
        b.nextProbe = G.time + 90;
        const base = Math.atan2(dy, dx), L = b.r + 24;
        const free = a => !blockedAt(G.world.grid, b.x + Math.cos(a) * L, b.y + Math.sin(a) * L, b.r * 0.7);
        if (!free(base + b.steerOff)) {
            b.steerOff = 0;
            // Keep going round the same side of it (flipping sides every probe is what makes bots shuffle back and forth)
            for (const k of [0.5, 1, 1.5, 2.1, 2.7]) if (free(base + k * b.avoidSide)) { b.steerOff = k * b.avoidSide; break; }
            if (!b.steerOff) for (const k of [0.5, 1, 1.5, 2.1, 2.7]) if (free(base - k * b.avoidSide)) { b.avoidSide = -b.avoidSide; b.steerOff = k * b.avoidSide; break; }
            b.steerHold = G.time + 900;
        } else if (b.steerOff && G.time > b.steerHold && free(base)) {
            b.steerOff = 0;
        }
    }
    if (!b.steerOff) return [dx, dy];
    const a = Math.atan2(dy, dx) + b.steerOff;
    return [Math.cos(a), Math.sin(a)];
}

// Where a bot is trying to get to right now (null when it's just milling about or has its target in sight)
function botDest(b) {
    if (b.mode === 'loot' || b.mode === 'box' || b.mode === 'tocar' || b.mode === 'zone' || b.mode === 'hunt' || b.mode === 'march') return b.goal;
    if (b.mode === 'fight' && !b.hasLOS && b.target) return b.target.hidden && b.lastSpot ? b.lastSpot : b.target;
    return null;
}

// Not getting any closer for a moment: plan a real route round the walls. Still stuck on that route, or no route
// at all: give up on loot, crates and cars for a while (and just head off another way for anything else)
function checkProgress(b) {
    const g = b.up ? null : botDest(b);
    if (!g) { b.progGoal = null; b.path = null; return; }
    const d = Math.hypot(g.x - b.x, g.y - b.y);
    // (a march target is a whole army on the move, so it only counts as a new goal if it's moved a long way)
    if (b.progGoal !== g || Math.hypot(g.x - b.progX, g.y - b.progY) > (b.mode === 'march' ? 900 : 150)) {
        b.progGoal = g; b.progX = g.x; b.progY = g.y; b.progBest = d; b.progAt = G.time; b.path = null; b.progPX = b.x; b.progPY = b.y;
        return;
    }
    if (b.mode === 'march') {
        // Marching: what counts is the bot actually getting somewhere, since the army it's after moves too
        if (b.progPX === undefined || Math.hypot(b.x - b.progPX, b.y - b.progPY) > 150) { b.progPX = b.x; b.progPY = b.y; b.progAt = G.time; return; }
    } else {
        if (d < b.progBest - 30) { b.progBest = d; b.progAt = G.time; return; }
        if (d > b.progBest + 400) { b.progBest = d; b.progAt = G.time; return; }  // the target moved away: fresh start
    }
    if (b.path ? G.time - b.progAt < 3500 : G.time - b.progAt < 1200) return;
    if (!b.path && !G.world.maze && G.time > (b.planAt || 0)) {
        b.planAt = G.time + 600;
        // A long way off: plan round the walls toward a point part of the way there, and carry on from that
        let px = g.x, py = g.y, reach = 50 + (b.mode === 'box' ? g.hw : b.mode === 'tocar' ? vt(g).len * 0.5 : 0);
        const partial = d > 1100;
        if (partial) { px = b.x + (g.x - b.x) / d * 1100; py = b.y + (g.y - b.y) / d * 1100; reach = 220; }
        b.path = findPath(b, px, py, reach);
        if (b.path) { b.path.partial = partial; b.pathGoal = g; }
        b.progAt = G.time;
        if (b.path) return;
    }
    b.path = null; b.progGoal = null;
    const pickup = b.mode === 'loot' || b.mode === 'box' || b.mode === 'tocar';
    if (pickup) {
        (b.skip || (b.skip = new Map())).set(g, G.time + 25000);
        if (b.skip.size > 30) for (const [o, t] of b.skip) if (t < G.time) b.skip.delete(o);
        if (g.claim === b) g.claim = null;
        b.goal = null;
        b.mode = 'wander';
    }
    // Off to one side rather than straight back the way it came
    b.heading = Math.atan2(g.y - b.y, g.x - b.x) + (b.avoidSide || 1) * rand(1.3, 1.9);
    b.headingHold = G.time + 1500;
    b.steerOff = 0;
    if (pickup) b.nextThink = G.time + 400;
}

// A* over a coarse grid round the bot and its goal; returns waypoints, or null when there's no way through nearby
const PATH = { cell: 30, pad: 450, max: 100, clear: 15 };
function findPath(b, gx, gy, reach = 50, opt = PATH) {
    const C = opt.cell, W = CONFIG.WORLD_SIZE;
    const x0 = Math.max(0, Math.min(b.x, gx) - opt.pad), y0 = Math.max(0, Math.min(b.y, gy) - opt.pad);
    const nx = Math.ceil((Math.min(W, Math.max(b.x, gx) + opt.pad) - x0) / C), ny = Math.ceil((Math.min(W, Math.max(b.y, gy) + opt.pad) - y0) / C);
    if (nx > opt.max || ny > opt.max) return null;
    const N = nx * ny, state = new Int8Array(N), cost = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const grid = G.world.grid;
    // (gates count as open: they open as you get there)
    const blockedCell = (x, y) => { let hit = false; grid.query(x, y, opt.clear, o => { if (!hit && !o.gate && blocksMove(o) && overlapsObstacle(x, y, opt.clear, o)) hit = true; }); return hit; };
    const free = i => { if (!state[i]) state[i] = blockedCell(x0 + (i % nx + 0.5) * C, y0 + (Math.floor(i / nx) + 0.5) * C) ? 2 : 1; return state[i] === 1; };
    const cellOf = (x, y) => clamp(Math.floor((y - y0) / C), 0, ny - 1) * nx + clamp(Math.floor((x - x0) / C), 0, nx - 1);
    const start = cellOf(b.x, b.y), gcx = (gx - x0) / C - 0.5, gcy = (gy - y0) / C - 0.5;
    const h = i => Math.hypot(i % nx - gcx, Math.floor(i / nx) - gcy);
    // A small binary heap keyed on cost + heuristic
    const heap = [], key = [];
    const push = (i, k) => { heap.push(i); key.push(k); let j = heap.length - 1; while (j > 0) { const p = (j - 1) >> 1; if (key[p] <= key[j]) break; [heap[p], heap[j]] = [heap[j], heap[p]]; [key[p], key[j]] = [key[j], key[p]]; j = p; } };
    const pop = () => { const top = heap[0], lh = heap.pop(), lk = key.pop(); if (heap.length) { heap[0] = lh; key[0] = lk; let j = 0; for (;;) { const l = j * 2 + 1, r = l + 1; let m = j; if (l < heap.length && key[l] < key[m]) m = l; if (r < heap.length && key[r] < key[m]) m = r; if (m === j) break; [heap[m], heap[j]] = [heap[j], heap[m]]; [key[m], key[j]] = [key[j], key[m]]; j = m; } } return top; };
    cost[start] = 0; state[start] = 1; push(start, h(start));
    let end = -1, expanded = 0, best = start, bestH = h(start);
    while (heap.length && expanded < (opt.budget || 2500)) {
        const i = pop();
        if (closed[i]) continue;
        closed[i] = 1; expanded++;
        if (opt.closest && h(i) < bestH) { bestH = h(i); best = i; }
        // Close enough to reach it directly (loot by a wall, a crate that is itself in the way)
        if (h(i) * C < reach) { end = i; break; }
        const cx = i % nx, cy = Math.floor(i / nx);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const x = cx + dx, y = cy + dy;
            if (x < 0 || y < 0 || x >= nx || y >= ny) continue;
            const j = y * nx + x;
            if (closed[j] || !free(j)) continue;
            if (dx && dy && (!free(cy * nx + x) || !free(y * nx + cx))) continue;
            const c = cost[i] + (dx && dy ? 1.414 : 1);
            if (c < cost[j]) { cost[j] = c; from[j] = i; push(j, c + h(j)); }
        }
    }
    if (end < 0 && opt.closest && best !== start) end = best;  // can't get all the way: as close as it gets
    else if (end < 0) return null;
    const pts = [];
    for (let i = end; i !== start && i >= 0; i = from[i]) pts.push({ x: x0 + (i % nx + 0.5) * C, y: y0 + (Math.floor(i / nx) + 0.5) * C });
    pts.reverse();
    // Thin it out: only keep the corners
    const out = [];
    for (let k = 0; k < pts.length; k++) {
        const p = pts[k], q = pts[k + 1], o = out[out.length - 1] || b;
        if (!q || Math.abs(angleDiff(Math.atan2(p.y - o.y, p.x - o.x), Math.atan2(q.y - p.y, q.x - p.x))) > 0.1) out.push(p);
    }
    if (h(end) * C < reach) out.push({ x: gx, y: gy });
    else if (!out.length) out.push(pts[pts.length - 1]);
    return out;
}

function updateBot(b, dt) {
    // Downed: lying there waiting for help
    if (b.downed) { b.vx = b.vy = 0; b._wantSpeed = 0; return; }
    if (G.time >= b.nextThink) botThink(b);
    checkProgress(b);
    let dx = 0, dy = 0, speed = CONFIG.BOT_SPEED * (b.zombie ? ZOMBIE.speed : 1) * (b.ghost ? GHOST.speed : 1) * (b.giant ? (b.rage ? BOSS.rageSpeed : BOSS.speed) : 1), faceMove = true;

    switch (b.mode) {
        case 'fight': {
            const t = b.target;
            if (!t || t.dead || !foe(b, t)) { b.mode = 'wander'; b.target = null; b.nextThink = G.time; break; }
            const d = Math.max(1, dist(b, t));
            const ax = (t.x - b.x) / d, ay = (t.y - b.y) / d;
            const w = WEAPONS[held(b)];
            const pref = w.melee ? 0 : Math.min(w.range * 0.55, 380);
            if (G.escape && b.lead && b.lead !== b && dist(b, b.lead) > 380) {
                // The group shoots on the move: nobody gets left behind
                const wp = routeTo(b, b.lead.x, b.lead.y);
                dx = wp.x - b.x; dy = wp.y - b.y;
            } else if (!b.hasLOS) {
                // Lost sight: head for where they were last seen (a hidden target's real position isn't known)
                const at = t.hidden && b.lastSpot ? b.lastSpot : t;
                const wp = routeTo(b, at.x, at.y);
                dx = wp.x - b.x; dy = wp.y - b.y;
            } else {
                if (d > pref + 60) { dx += ax; dy += ay; } else if (d < pref - 60) { dx -= ax; dy -= ay; }
                if (!w.melee) { dx += -ay * b.strafe * 0.8; dy += ax * b.strafe * 0.8; }
            }
            if (Math.random() < dt * 0.25) b.strafe *= -1;

            if (Math.random() < dt * 2.5) b.aimErr = rand(-1, 1) * (0.06 + d / 3500) * (b.boss ? 0.7 : b.soldier ? (G.world.maze ? ESCAPE.maze.aim : ESCAPE.soldierAim) : 1) * (G.time < (b.blindUntil || 0) ? 6 : 1) * AIK().aim * edgeOf(b).aim;
            const want = Math.atan2(t.y - b.y, t.x - b.x) + b.aimErr;
            b.angle += angleDiff(b.angle, want) * Math.min(1, dt * (b.boss ? 16 : 9 * AIK().turn));
            faceMove = false;
            const inRange = d < w.range + (w.melee ? t.r : 0);
            const unseen = t.ghost && !ghostSeen(t) && d > 60;  // (the ghost vanished again: hold fire)
            if (b.hasLOS && !unseen && G.time > b.engageAt && inRange && Math.abs(angleDiff(b.angle, want)) < 0.3) tryAttack(b);
            break;
        }
        case 'box': {
            const o = b.goal;
            if (!o || o.broken) { b.mode = 'wander'; b.nextThink = G.time; break; }
            const d = Math.hypot(o.x - b.x, o.y - b.y);
            if (d > b.r + o.hw + 20) {
                const wp = routeTo(b, o.x, o.y);
                dx = wp.x - b.x; dy = wp.y - b.y;
            } else {
                // Punch with an empty slot; if every slot has a gun, shoot it open
                const empty = b.inv.indexOf(null);
                if (empty >= 0 && b.slot !== empty) switchSlot(b, empty);
                b.angle += angleDiff(b.angle, Math.atan2(o.y - b.y, o.x - b.x)) * Math.min(1, dt * 12);
                faceMove = false;
                tryAttack(b);
            }
            break;
        }
        case 'rest':
            faceMove = false;
            break;
        case 'tocar': {
            const c = b.goal;
            if (!c || c.dead || c.driver) { b.mode = 'wander'; b.nextThink = G.time; break; }
            if (dist(b, c) < vt(c).len * 0.5 + 40) { enterCar(b, c); break; }
            const wp = routeTo(b, c.x, c.y);
            dx = wp.x - b.x; dy = wp.y - b.y;
            break;
        }
        case 'flee': {
            const t = b.target;
            if (!t || t.dead || dist(b, t) > CONFIG.BOT_SIGHT * 1.3) { b.mode = 'wander'; break; }
            const a = Math.atan2(b.y - t.y, b.x - t.x);
            dx = Math.cos(a); dy = Math.sin(a);
            break;
        }
        case 'march':
        case 'zone': {
            if (b.goal && b.goal.downed !== undefined && (b.goal.dead || !b.goal.downed)) { b.mode = 'wander'; b.nextThink = G.time; break; }
            const wp = routeTo(b, b.goal.x, b.goal.y);
            dx = wp.x - b.x; dy = wp.y - b.y;
            // Kneeling beside a downed teammate to get them up
            if (b.goal.downed && Math.hypot(b.goal.x - b.x, b.goal.y - b.y) < 34) { dx = 0; dy = 0; faceMove = false; }
            // Up against the enemy base with nobody to fight: open fire on its walls
            if (b.mode === 'march' && G.revolution && b.inv.some(Boolean)) {
                const w = nearestEnemyWall(b, 420);
                if (w) {
                    if (w.d < 260) { dx = 0; dy = 0; }
                    const want = Math.atan2(w.y - b.y, w.x - b.x);
                    b.angle += angleDiff(b.angle, want) * Math.min(1, dt * 8);
                    faceMove = false;
                    if (Math.abs(angleDiff(b.angle, want)) < 0.2) tryAttack(b);
                }
            }
            break;
        }
        case 'follow': {
            // Head for my own spot in the formation (not the leader), hurry if I've fallen behind,
            // and when I'm there, hold it and keep watch outward
            const t = b.goal, pt = b.slotPt;
            if (!t || t.dead || !pt) { b.mode = 'wander'; b.nextThink = G.time; break; }
            const dl = dist(b, t), d = dist(b, pt);
            const aim = dl > 650 ? t : pt;
            if (d > 45 || dl > 650) {
                const wp = routeTo(b, aim.x, aim.y);
                dx = wp.x - b.x; dy = wp.y - b.y;
                // A touch quicker than you while getting into position, much quicker if left behind
                speed *= dl > 360 ? 1.5 : d > 120 ? 1.3 : 1;
            } else {
                faceMove = false;
                const look = b.slotDir + (b.watch || 0) + Math.sin(G.time / 1400 + b.slotR) * 0.5;
                b.angle += angleDiff(b.angle, look) * Math.min(1, dt * 3);
            }
            break;
        }
        case 'hunt': {
            // The horde jogs toward the nearest survivor it knows about
            const t = b.goal;
            if (!t || t.dead || !isPrey(t)) { b.mode = 'wander'; b.nextThink = G.time; break; }
            const wp = routeTo(b, t.x, t.y);
            dx = wp.x - b.x; dy = wp.y - b.y;
            break;
        }
        case 'loot': {
            const l = b.goal;
            if (!l || l.gone) { b.mode = 'wander'; break; }
            const wp = routeTo(b, l.x, l.y);
            dx = wp.x - b.x; dy = wp.y - b.y;
            if (Math.hypot(l.x - b.x, l.y - b.y) < b.r + 16) {
                takeLoot(b, l, worstSlot(b));
                b.mode = 'wander';
                b.nextThink = G.time;
            }
            break;
        }
        default:
            dx = Math.cos(b.heading); dy = Math.sin(b.heading);
            speed *= 0.6;
    }

    // Caught in a cure's pull: nothing else matters
    if (b.cureAt && G.time < b.cureUntil) {
        dx = b.cureAt.x - b.x; dy = b.cureAt.y - b.y;
        speed = CONFIG.BOT_SPEED;
    }

    // Scramble away from live grenades, incoming missiles and mines they've noticed
    const flee = (x, y, r, w) => {
        const d = Math.hypot(b.x - x, b.y - y);
        if (d < r && d > 1) { dx += ((b.x - x) / d) * w; dy += ((b.y - y) / d) * w; speed = CONFIG.BOT_SPEED; }
    };
    if (b.alert) {
        for (const g of G.grenades) if (g.type === 'grenade' && (g.owner === b || foe(g.owner, b)) && (g.landed || g.t > g.T * 0.6)) flee(g.x, g.y, GRENADE.radius + 30, 3);
        for (const s of G.strikes) if (s.owner === b || foe(s.owner, b)) flee(s.x, s.y, STRIKE.radius + 50, 4);
        for (const m of G.mines) if (foe(m.owner, b)) flee(m.x, m.y, 80, 2);
    } else {
        // Everyone still runs from their own grenades and missiles
        for (const g of G.grenades) if (g.owner === b && g.type === 'grenade' && g.landed) flee(g.x, g.y, GRENADE.radius + 30, 3);
        for (const s of G.strikes) if (s.owner === b) flee(s.x, s.y, STRIKE.radius + 50, 4);
    }

    // Always lean toward safety when outside the circle
    if (G.mode !== 'demo' && b.mode !== 'zone') {
        const z = G.zone;
        const dz = Math.hypot(b.x - z.cx, b.y - z.cy);
        if (dz > z.r - 40 && dz > 1) { dx += ((z.cx - b.x) / dz) * 1.2; dy += ((z.cy - b.y) / dz) * 1.2; }
    }

    // Keep demo bots inside their little arena
    if (G.mode === 'demo') {
        const c = CONFIG.WORLD_SIZE / 2;
        const dc = Math.hypot(b.x - c, b.y - c);
        if (dc > 1200) { dx += (c - b.x) / dc; dy += (c - b.y) / dc; }
    }

    let len = Math.hypot(dx, dy);
    if (len > 0.01) { dx /= len; dy /= len; }
    // Steer around obstacles (but not around the box we're walking up to punch)
    const g = b.goal;
    // (a bot following a planned route already has its way round them)
    if (len > 0.01 && b.detour <= 0 && !b.path && !(b.mode === 'box' && g && Math.hypot(g.x - b.x, g.y - b.y) < g.hw + b.r + 60)) [dx, dy] = steerAround(b, dx, dy);
    if (b.detour > 0) {
        b.detour -= dt;
        dx = Math.cos(b.detourAngle); dy = Math.sin(b.detourAngle);
    }
    const tvx = dx * speed, tvy = dy * speed;
    b.vx += (tvx - b.vx) * Math.min(1, dt * 8);
    b.vy += (tvy - b.vy) * Math.min(1, dt * 8);
    if (faceMove && Math.hypot(b.vx, b.vy) > 20) {
        b.angle += angleDiff(b.angle, Math.atan2(b.vy, b.vx)) * Math.min(1, dt * 8);
    }
    b._wantSpeed = len > 0.01 ? speed : 0;
    if (Math.hypot(b.vx, b.vy) > 40) b.moveHeading = Math.atan2(b.vy, b.vx);
}

// ---------- City chaos (Escape) ----------
// The city is a war zone: missiles and bombing runs keep landing, buildings that take enough punishment come
// down in a crash of timber and steel, traffic panics and crashes, and parked cars go up in chain reactions.
const CHAOS = {
    strikeEvery: [2500, 5000], jetEvery: [22000, 40000], traffic: 16, laneOff: 15,
    carBoom: { radius: 140, damage: 80 }, bomb: { radius: 190, damage: 140 }, collapseDelay: 1300
};

function initChaos() {
    G.traffic = [];
    G.fires = [];
    G.jets = [];
    G.bombs = [];
    G.pendingBooms = [];
    G.nextStrike = 8000;
    G.nextJet = 30000;
}

// Where the chaos centers: you, or the camera on the title screen
const chaosCenter = () => (G.player && !G.player.dead ? G.player : G.cam);

function updateChaos(dt) {
    const c = chaosCenter(), W = CONFIG.WORLD_SIZE;
    // Missiles rain down around you; a third of them aim at buildings
    if (G.time >= G.nextStrike) {
        G.nextStrike = G.time + rand(...CHAOS.strikeEvery);
        const towers = G.world.buildings.filter(b => !b.collapsed && !b.hq && Math.hypot(b.cx - c.x, b.cy - c.y) < 2000);
        let x, y;
        if (towers.length && Math.random() < 0.35) { const b = pick(towers); x = b.cx + rand(-0.3, 0.3) * b.w; y = b.cy + rand(-0.3, 0.3) * b.h; }
        else { const a = rand(0, TAU), d = rand(750, 2200); x = clamp(c.x + Math.cos(a) * d, 100, W - 100); y = clamp(c.y + Math.sin(a) * d, 100, W - 100); }
        if (!G.hq || !(x > G.hq.x0 - 200 && x < G.hq.x1 + 200 && y > G.hq.y0 - 200 && y < G.hq.y1 + 200)) callStrike(x, y, null, false);
    }
    // Now and then a jet screams over and drops a line of bombs
    if (G.time >= G.nextJet) {
        G.nextJet = G.time + rand(...CHAOS.jetEvery);
        const a = rand(0, TAU), tx = c.x + rand(-700, 700), ty = c.y + rand(-700, 700);
        G.jets.push({ x: tx - Math.cos(a) * 2600, y: ty - Math.sin(a) * 2600, vx: Math.cos(a) * 1100, vy: Math.sin(a) * 1100, tx, ty, bombs: randInt(4, 7), next: 0 });
        Sound.tone(140, 2.4, 'sawtooth', 0.05, 60);
    }
    for (const j of G.jets) {
        j.x += j.vx * dt; j.y += j.vy * dt;
        if (j.bombs > 0 && Math.hypot(j.x - j.tx, j.y - j.ty) < 700 && G.time >= j.next) {
            j.bombs--;
            j.next = G.time + 160;
            G.bombs.push({ x: j.x + rand(-30, 30), y: j.y + rand(-30, 30), t: 0, T: 0.7 });
        }
    }
    G.jets = G.jets.filter(j => Math.hypot(j.x - j.tx, j.y - j.ty) < 3200);
    for (const bm of G.bombs) {
        bm.t += dt;
        if (bm.t >= bm.T) { bm.done = true; blast(bm.x, bm.y, null, CHAOS.bomb.radius, CHAOS.bomb.damage, 'Bomb'); }
    }
    G.bombs = G.bombs.filter(bm => !bm.done);
    updateTraffic(dt, c);
}

// Damage the world takes in every mode: delayed explosions, smoking and collapsing buildings, fires
function updateWreckage(dt) {
    // Delayed explosions (parked cars catching, wrecks cooking off)
    const due = G.pendingBooms.filter(pb => G.time >= pb.at);
    G.pendingBooms = G.pendingBooms.filter(pb => G.time < pb.at);
    for (const pb of due.slice(0, 3)) {
        blast(pb.x, pb.y, null, pb.r || CHAOS.carBoom.radius, pb.dmg || CHAOS.carBoom.damage, pb.small ? 'Explosion' : 'Car bomb');
        if (!pb.small) addFire(pb.x, pb.y, 60, 15000);
    }
    G.pendingBooms.push(...due.slice(3));
    // Buildings: smoke and flames from the badly damaged ones, and the ones on their way down
    for (const b of G.world.buildings) {
        if (b.collapsed || b.hp >= b.maxHp) continue;
        if (b.collapseAt && G.time >= b.collapseAt) { collapseBuilding(b); continue; }
        const hurt = 1 - b.hp / b.maxHp;
        if (hurt > 0.35 && inView(b.cx, b.cy, 400) && Math.random() < dt * 10 * hurt) {
            G.particles.push({ type: 'smoke', x: b.cx + rand(-0.4, 0.4) * b.w, y: b.cy + rand(-0.4, 0.4) * b.h, vx: rand(-15, 15), vy: rand(-70, -30), life: rand(2, 3.5), max: 3.5, size: rand(14, 26), color: '50,46,50' });
            if (hurt > 0.6) G.particles.push({ type: 'glow', x: b.cx + rand(-0.4, 0.4) * b.w, y: b.cy + rand(-0.4, 0.4) * b.h, vx: rand(-20, 20), vy: rand(-90, -40), life: 0.5, max: 0.5, size: rand(6, 12), color: '#ff8a3d' });
        }
        if (b.collapseAt && inView(b.cx, b.cy, 300)) {
            if (Math.random() < dt * 30) G.particles.push({ type: 'chunk', x: b.cx + rand(-0.5, 0.5) * b.w, y: b.cy + rand(-0.5, 0.5) * b.h, vx: rand(-60, 60), vy: rand(-60, 60), life: 0.7, max: 0.7, size: rand(3, 7), color: pick(WRECK.wood.concat(WRECK.metal)), rot: rand(0, TAU), spin: rand(-10, 10) });
        }
    }
    updateFires(dt);
    // Rusty: columns of smoke rising from old fires
    if (G.world.smokers) for (const sm of G.world.smokers) {
        if (!inView(sm.x, sm.y, 500) || Math.random() > dt * 6) continue;
        G.particles.push({ type: 'smoke', x: sm.x + rand(-12, 12), y: sm.y + rand(-12, 12), vx: rand(-15, 25), vy: rand(-70, -35), life: rand(3, 5), max: 5, size: rand(16, 30), color: '45,42,44' });
        if (Math.random() < 0.4) G.particles.push({ type: 'glow', x: sm.x + rand(-10, 10), y: sm.y + rand(-10, 10), vx: rand(-10, 10), vy: rand(-30, -10), life: 0.5, max: 0.5, size: rand(5, 9), color: '#ff8a3d' });
    }
}

// ----- Buildings -----
function damageBuildings(x, y, R, dmg) {
    for (const b of G.world.buildings) {
        if (b.collapsed || b.collapseAt || b.hq) continue;
        const nx = clamp(x, b.x0, b.x1), ny = clamp(y, b.y0, b.y1), d = Math.hypot(x - nx, y - ny);
        if (d > R * 0.8) continue;
        const hit = dmg * (R / 150) * (1 - d / R);
        b.hp -= hit;
        b.lastHit = { x, y };
        addImpact(b, nx, ny, hit / b.maxHp);
        if (b.hp <= 0) {
            // A moment of rumbling before it comes down: anyone inside gets a chance to run
            b.collapseAt = G.time + CHAOS.collapseDelay;
            const p = G.player;
            if (p && !p.dead && Math.hypot(p.x - b.cx, p.y - b.cy) < 1100) showBanner('BUILDING COLLAPSING!', true, buildingAt(p.x, p.y) === b ? 'GET OUT NOW!' : 'Stay clear!');
            Sound.timber(Sound.volAt(b.cx, b.cy));
        }
    }
}

// A scorch mark where the blast hit the roof, cracks running out from it, and for heavy hits a hole
// punched through to the beams. The shapes are worked out once so they don't flicker.
function addImpact(b, x, y, k) {
    b.hits = b.hits || [];
    const near = b.hits.find(h => Math.hypot(h.x - x, h.y - y) < 60);
    if (near) { near.k += k; if (near.k > 0.18 && !near.hole) near.hole = makeHole(near.r); return; }
    if (b.hits.length >= 10) return;
    const r = 35 + Math.min(1, k * 4) * 45;
    const cracks = [];
    for (let i = randInt(4, 7); i > 0; i--) {
        let a = rand(0, TAU), cx = x + Math.cos(a) * r * 0.4, cy = y + Math.sin(a) * r * 0.4;
        const line = [[cx, cy]];
        for (let s = randInt(3, 5); s > 0; s--) {
            a += rand(-0.6, 0.6);
            cx += Math.cos(a) * rand(10, 22); cy += Math.sin(a) * rand(10, 22);
            line.push([cx, cy]);
            if (Math.random() < 0.3) cracks.push([[cx, cy], [cx + Math.cos(a + 1) * rand(8, 16), cy + Math.sin(a + 1) * rand(8, 16)]]);
        }
        cracks.push(line);
    }
    b.hits.push({ x, y, r, k, cracks, hole: k > 0.18 ? makeHole(r) : null, debris: Array.from({ length: 8 }, () => [rand(0, TAU), rand(0.3, 1.1), rand(3, 7), rand(0, 3)]) });
}

function makeHole(r) {
    const pts = [], n = randInt(9, 13), hr = r * rand(0.35, 0.5);
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; pts.push([Math.cos(a) * hr * rand(0.6, 1.15), Math.sin(a) * hr * rand(0.6, 1.15)]); }
    return { pts, beam: rand(0, Math.PI) };
}

function drawImpacts(b, x0, y0, w, h) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    for (const hit of b.hits) {
        const soot = ctx.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, hit.r * 1.5);
        soot.addColorStop(0, 'rgba(18,14,12,0.6)');
        soot.addColorStop(0.5, 'rgba(30,24,20,0.3)');
        soot.addColorStop(1, 'rgba(30,24,20,0)');
        ctx.fillStyle = soot;
        ctx.beginPath(); ctx.arc(hit.x, hit.y, hit.r * 1.5, 0, TAU); ctx.fill();
        // Hairline cracks with a light edge so they read as broken concrete
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (const [col, lw, o] of [['rgba(255,255,255,0.14)', 1, 1], ['rgba(22,18,15,0.65)', 1.4, 0]]) {
            ctx.strokeStyle = col; ctx.lineWidth = lw;
            ctx.beginPath();
            for (const line of hit.cracks) line.forEach(([px, py], i) => (i ? ctx.lineTo(px + o, py + o) : ctx.moveTo(px + o, py + o)));
            ctx.stroke();
        }
        if (hit.hole) {
            ctx.save();
            ctx.translate(hit.x, hit.y);
            ctx.beginPath(); hit.hole.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
            ctx.fillStyle = '#16110e'; ctx.fill();
            ctx.save(); ctx.clip();
            // Exposed beams and a glow of fire inside
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, hit.r * 0.5);
            glow.addColorStop(0, 'rgba(255,120,40,0.45)'); glow.addColorStop(1, 'rgba(255,120,40,0)');
            ctx.fillStyle = glow; ctx.fillRect(-hit.r, -hit.r, hit.r * 2, hit.r * 2);
            ctx.rotate(hit.hole.beam);
            ctx.fillStyle = '#5a3d26';
            ctx.fillRect(-hit.r, -12, hit.r * 2, 5); ctx.fillRect(-hit.r, 8, hit.r * 2, 5);
            ctx.restore();
            ctx.strokeStyle = 'rgba(150,142,130,0.9)'; ctx.lineWidth = 3; ctx.stroke();
            ctx.restore();
        }
        // Loose chunks scattered round the impact
        for (const [a, d, sz, rr] of hit.debris) {
            ctx.save(); ctx.translate(hit.x + Math.cos(a) * hit.r * d, hit.y + Math.sin(a) * hit.r * d); ctx.rotate(rr);
            ctx.fillStyle = '#6a645c'; ctx.fillRect(-sz / 2, -sz / 3, sz, sz * 0.66);
            ctx.restore();
        }
    }
    ctx.restore();
}

// ----- Parked cars: a blast wrecks them, and they go up a moment later -----
// chance: how likely each wrecked car is to blow up too (lower for car explosions, so a street doesn't all go at once)
function igniteCars(x, y, R, chance = 0.5, dmg = 100, owner = null) {
    G.world.grid.query(x, y, R, o => {
        if (!o.car || o.wreck || Math.hypot(o.x - x, o.y - y) > R + 30) return;
        o.wreck = true;
        o.burnUntil = Infinity;  // a wrecked car burns for good
        if (Math.random() < chance) G.pendingBooms.push({ x: o.x, y: o.y, at: G.time + rand(250, 900) });
    });
    for (const car of G.traffic) {
        const d = Math.hypot(car.x - x, car.y - y);
        if (car.state === 'drive' && d < R + 30) damageVehicle(car, dmg * 1.6 * (1 - clamp(d / R, 0, 1)) + 30, owner);
    }
}

// ----- Fires -----
function addFire(x, y, r, life) {
    G.fires.push({ x, y, r, until: G.time + life, tick: 0 });
    if (G.fires.length > 40) G.fires.shift();
}

function updateFires(dt) {
    G.fires = G.fires.filter(f => G.time < f.until);
    for (const fr of G.fires) {
        if (inView(fr.x, fr.y, 100) && Math.random() < dt * 18) {
            G.particles.push({ type: 'glow', x: fr.x + rand(-fr.r, fr.r) * 0.6, y: fr.y + rand(-fr.r, fr.r) * 0.6, vx: rand(-15, 15), vy: rand(-90, -40), life: rand(0.35, 0.6), max: 0.6, size: rand(6, 12), color: pick(['#ff8a3d', '#ffb347', '#ff5a36']) });
            if (Math.random() < 0.4) G.particles.push({ type: 'smoke', x: fr.x + rand(-10, 10), y: fr.y - 10, vx: rand(-10, 10), vy: rand(-70, -40), life: 2.5, max: 2.5, size: rand(10, 18), color: '40,36,40' });
        }
        // Standing in the flames hurts
        fr.tick -= dt;
        if (fr.tick > 0) continue;
        fr.tick = 0.5;
        G.fgrid.query(fr.x, fr.y, fr.r, f => { if (!f.dead && Math.hypot(f.x - fr.x, f.y - fr.y) < fr.r) damage(f, 6, null, 'Fire'); });
    }
}

// ----- Military vehicles -----
// Army jeeps, humvees, APCs and troop trucks patrol the streets with 1 to 3 soldiers aboard shooting at the group.
// Drivers never crash on their own (they turn around when the road ahead is blocked); a vehicle only goes down
// when it's destroyed, and then it goes up in a big, multi-stage explosion and lands as a burning wreck.
const VEHICLES = {
    jeep: { len: 78, wid: 40, hp: 260, speed: [250, 330], crew: [1, 2], color: '#5d6a3a', gun: 'Machine Gun', name: 'Jeep' },
    humvee: { len: 90, wid: 48, hp: 380, speed: [210, 290], crew: [2, 3], color: '#6e6a46', gun: 'Machine Gun', name: 'Humvee' },
    apc: { len: 108, wid: 56, hp: 620, speed: [150, 210], crew: [2, 3], color: '#4c5a3a', gun: 'Heavy MG', name: 'APC' },
    truck: { len: 114, wid: 48, hp: 420, speed: [190, 250], crew: [2, 3], color: '#5e5c3c', gun: 'Assault Rifle', name: 'Troop truck' }
};
const VEHICLE_TABLE = [['jeep', 4], ['humvee', 4], ['apc', 1.5], ['truck', 2.5]];

function spawnCar(c) {
    if (G.early) return;  // Early Warfare: no army jeeps and trucks on the streets
    const P = CITY.block, W = CONFIG.WORLD_SIZE, n = Math.round(W / P);
    const ax = Math.random() < 0.5 ? 'h' : 'v';
    const at = clamp(Math.round((ax === 'h' ? c.y : c.x) / P) + randInt(-3, 3), 1, n - 1) * P;
    const sgn = Math.random() < 0.5 ? 1 : -1;
    const along = clamp((ax === 'h' ? c.x : c.y) - sgn * rand(1500, 2500), 100, W - 100);
    const type = weightedPick(VEHICLE_TABLE), V = VEHICLES[type];
    const car = { type, ax, at, sgn, along, speed: rand(...V.speed), hp: V.hp, maxHp: V.hp, color: V.color, state: 'drive', rot: 0, z: 0, vz: 0, spin: 0, seed: randInt(1, 1e9), hitAt: -9999 };
    // The gunners: each shoots on its own; together they're one target for the group to shoot at
    const crew = randInt(...V.crew);
    car.shooters = Array.from({ length: crew }, (_, i) => ({ seat: seatPos(type, i, crew), aim: 0, next: G.time + rand(400, 1200) }));
    car.gunner = { name: `${V.name} gunner`, team: 1, soldier: true, isPlayer: false, dead: false, x: 0, y: 0, vx: 0, vy: 0, r: 30, kills: 0, hp: 1, hidden: false, color: ESCAPE.soldier, vehicle: car };
    placeCar(car);
    if (blockedAt(G.world.grid, car.x, car.y, 13)) return;
    G.traffic.push(car);
}

// Where each gunner sits, in the vehicle's own frame (+x = forward)
function seatPos(type, i, n) {
    if (type === 'truck') return { x: -40 + i * 22, y: (i % 2 ? 12 : -12) };
    if (type === 'humvee' || type === 'apc') return i === 0 ? { x: -4, y: 0 } : { x: -30, y: i === 1 ? -14 : 14 };
    return i === 0 ? { x: -18, y: 0 } : { x: 6, y: 11 };
}

function placeCar(car) {
    const lane = car.at + car.sgn * (car.ax === 'h' ? CHAOS.laneOff : -CHAOS.laneOff);
    if (car.ax === 'h') { car.x = car.along; car.y = lane; car.rot = car.sgn > 0 ? 0 : Math.PI; }
    else { car.x = lane; car.y = car.along; car.rot = car.sgn > 0 ? Math.PI / 2 : -Math.PI / 2; }
    car.gunner.x = car.x; car.gunner.y = car.y;
}

function uTurn(car) { car.sgn = -car.sgn; placeCar(car); car.pause = G.time + 400; }

function updateTraffic(dt, c) {
    const P = CITY.block, W = CONFIG.WORLD_SIZE;
    G.traffic = G.traffic.filter(car => car.state === 'wreck' ? false : car.state === 'dying' || Math.hypot(car.x - c.x, car.y - c.y) < 3200);
    if (G.traffic.length < CHAOS.traffic && Math.random() < dt * 2) spawnCar(c);
    for (const car of G.traffic) {
        if (car.state === 'dying') { updateDying(car, dt); continue; }
        // Find something to shoot at: the closest member of the group in view
        let target = null, td = 760;
        G.fgrid.query(car.x, car.y, 760, f => {
            if (f.dead || f.team !== 0) return;
            const d = Math.hypot(f.x - car.x, f.y - car.y);
            if (d < td && lineOfSight(car, f)) { td = d; target = f; }
        });
        // Slow down to fight, keep rolling otherwise
        const sp = target ? car.speed * 0.35 : car.speed;
        if (G.time >= (car.pause || 0)) {
            const before = car.along;
            car.along += car.sgn * sp * dt;
            if (Math.floor(before / P) !== Math.floor(car.along / P) && Math.random() < 0.3) {
                const node = Math.round(car.along / P) * P;
                if (node > 0 && node < W) { car.along = car.at; car.at = node; car.ax = car.ax === 'h' ? 'v' : 'h'; car.sgn = Math.random() < 0.5 ? 1 : -1; }
            }
            placeCar(car);
            if (car.along < 80 || car.along > W - 80) { uTurn(car); continue; }
        }
        // The road ahead is blocked (wreck, rubble, another vehicle): turn around rather than ram it
        const V = VEHICLES[car.type], look = V.len / 2 + 60;
        const lx = car.x + Math.cos(car.rot) * look, ly = car.y + Math.sin(car.rot) * look;
        if (blockedAt(G.world.grid, lx, ly, 12) || G.traffic.some(o => o !== car && o.state === 'drive' && Math.hypot(o.x - lx, o.y - ly) < 50)) { uTurn(car); continue; }
        // Run over anyone in the road (they don't stop for you)
        const fx = car.x + Math.cos(car.rot) * V.len * 0.45, fy = car.y + Math.sin(car.rot) * V.len * 0.45;
        G.fgrid.query(car.x, car.y, V.len, f => {
            if (f.dead || f.soldier || Math.hypot(f.x - fx, f.y - fy) > V.wid / 2 + f.r) return;
            f.kx += Math.cos(car.rot) * sp * 1.5; f.ky += Math.sin(car.rot) * sp * 1.5;
            damage(f, 15 * (sp / 300), car.gunner, V.name);
        });
        // Gunners swing round and fire
        for (const s of car.shooters) {
            const sx = car.x + Math.cos(car.rot) * s.seat.x - Math.sin(car.rot) * s.seat.y;
            const sy = car.y + Math.sin(car.rot) * s.seat.x + Math.cos(car.rot) * s.seat.y;
            if (!target) { s.aim += angleDiff(s.aim, car.rot + (s.seat.y || 0.01) * 0.1) * Math.min(1, dt * 2); continue; }
            const want = Math.atan2(target.y - sy, target.x - sx);
            s.aim += angleDiff(s.aim, want) * Math.min(1, dt * 6);
            if (G.time < s.next || Math.abs(angleDiff(s.aim, want)) > 0.25) continue;
            const w = WEAPONS[V.gun];
            s.next = G.time + w.rate * rand(1.1, 1.8);
            const a = s.aim + rand(-0.09, 0.09);
            G.bullets.push({ x: sx + Math.cos(a) * 26, y: sy + Math.sin(a) * 26, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, dmg: w.damage * 0.4, owner: car.gunner, left: w.range, weapon: V.name });
            if (inView(sx, sy, 100)) G.particles.push({ type: 'flash', x: sx + Math.cos(a) * 26, y: sy + Math.sin(a) * 26, vx: 0, vy: 0, life: 0.06, max: 0.06, size: 16, angle: a });
            Sound.shot(w.sound, Sound.volAt(sx, sy) * 0.7);
        }
    }
}

// Damage from bullets and blasts. by: who did it (blasts from their own side don't count)
function damageVehicle(car, amount, by) {
    if (car.state !== 'drive' || (by && !foe(by, car.gunner))) return false;
    car.hp -= amount;
    car.hitAt = G.time;
    if (car.hp <= 0) destroyVehicle(car, by);
    return true;
}

// The big one: fireball, secondary blasts, parts flying everywhere, and the hull thrown into the air
function destroyVehicle(car, by) {
    const V = VEHICLES[car.type];
    car.state = 'dying';
    car.gunner.dead = true;
    car.vz = rand(520, 680);
    car.spin = rand(-6, 6);
    car.vx = rand(-60, 60); car.vy = rand(-60, 60);
    if (by && by.isPlayer) { by.kills += car.shooters.length; showBanner(`${V.name.toUpperCase()} DESTROYED`, false, `${car.shooters.length} gunner${car.shooters.length > 1 ? 's' : ''} down`); }
    blast(car.x, car.y, null, 210, 110, V.name);
    for (let i = 1; i <= 3; i++) G.pendingBooms.push({ x: car.x + rand(-50, 50), y: car.y + rand(-50, 50), at: G.time + i * rand(180, 320), r: 120, dmg: 40, small: true });
    if (inView(car.x, car.y, 400)) {
        // Wheels, doors and armor plates flung out
        for (let i = 0; i < 10; i++) {
            const a = rand(0, TAU), sp = rand(250, 600);
            G.particles.push({ type: 'chunk', x: car.x, y: car.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(1, 1.6), max: 1.6, size: rand(8, 13), color: i < 4 ? '#1d1d1d' : shade(car.color, -0.2), rot: rand(0, TAU), spin: rand(-18, 18) });
        }
        // Mushrooming smoke column
        for (let i = 0; i < 26; i++) G.particles.push({ type: 'smoke', x: car.x + rand(-30, 30), y: car.y + rand(-30, 30), vx: rand(-40, 40), vy: rand(-140, -40), life: rand(2.5, 4.5), max: 4.5, size: rand(18, 34), color: '30,26,28' });
        for (let i = 0; i < 4; i++) G.particles.push({ type: 'ring', x: car.x, y: car.y, vx: 0, vy: 0, life: 0.5 + i * 0.15, max: 0.5 + i * 0.15, size: 120 + i * 70, color: i % 2 ? '#ffb347' : '#fff7ec' });
        G.flash = Math.max(G.flash, 0.45);
        G.flashColor = '255,170,80';
    }
    Sound.boom(Sound.volAt(car.x, car.y), 2.4);
    Sound.thud(Sound.volAt(car.x, car.y));
}

// In the air, tumbling, then it slams down as a burning wreck
function updateDying(car, dt) {
    car.vz -= 1500 * dt;
    car.z = Math.max(0, car.z + car.vz * dt);
    car.x += car.vx * dt; car.y += car.vy * dt;
    car.rot += car.spin * dt;
    if (Math.random() < dt * 30) G.particles.push({ type: 'glow', x: car.x + rand(-20, 20), y: car.y - car.z * 0.3, vx: rand(-30, 30), vy: rand(-80, -20), life: 0.5, max: 0.5, size: rand(8, 14), color: '#ff8a3d' });
    if (car.z > 0 || car.vz > 0) return;
    car.state = 'wreck';
    burst(car.x, car.y, 24, '#5c5040', 300);
    Sound.thud(Sound.volAt(car.x, car.y));
    addFire(car.x, car.y, 85, 25000);
    const V = VEHICLES[car.type], side = Math.abs(Math.sin(car.rot)) > 0.7;
    const o = { type: 'crate', car: true, wreck: true, vtype: car.type, rot: car.rot, seed: car.seed, burnUntil: Infinity, x: car.x, y: car.y, hw: (side ? V.wid : V.len) / 2, hh: (side ? V.len : V.wid) / 2, color: car.color };
    G.world.grid.insertBox(o);
    G.world.obstacles.push(o);
}

// Bullets that hit a vehicle damage it (soldiers' own bullets pass harmlessly)
function bulletHitsCar(b) {
    for (const car of G.traffic) {
        if (car.state !== 'drive') continue;
        const V = VEHICLES[car.type], dx = b.x - car.x, dy = b.y - car.y;
        const lx = dx * Math.cos(-car.rot) - dy * Math.sin(-car.rot), ly = dx * Math.sin(-car.rot) + dy * Math.cos(-car.rot);
        if (Math.abs(lx) > V.len / 2 || Math.abs(ly) > V.wid / 2) continue;
        if (!damageVehicle(car, b.dmg, b.owner)) return false;
        burst(b.x, b.y, 4, '#ffd27a', 160);
        return true;
    }
    return false;
}

// ----- Drawing -----
function drawTraffic() {
    for (const car of G.traffic) {
        if (car.state === 'wreck' || !inView(car.x, car.y, 120)) continue;
        const V = VEHICLES[car.type], lift = car.z / 260;
        // Shadow on the ground (further away the higher it flies)
        ctx.fillStyle = `rgba(0,0,0,${0.32 - Math.min(0.2, lift * 0.1)})`;
        ctx.save(); ctx.translate(car.x + 6 + car.z * 0.25, car.y + 8 + car.z * 0.35); ctx.rotate(car.rot);
        ctx.fillRect(-V.len / 2, -V.wid / 2, V.len, V.wid); ctx.restore();
        ctx.save();
        ctx.translate(car.x, car.y - car.z * 0.3);
        ctx.scale(1 + lift * 0.4, 1 + lift * 0.4);
        ctx.rotate(car.rot);
        drawVehicleShape(car.type, car.color, car.seed, car.state === 'dying');
        if (car.state === 'drive') {
            for (const s of car.shooters) drawGunner(s.seat.x, s.seat.y, s.aim - car.rot, car.type === 'apc' && s === car.shooters[0]);
            if (G.time - car.hitAt < 120) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-V.len / 2, -V.wid / 2, V.len, V.wid); }
        } else {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(255,130,40,${0.5 + Math.random() * 0.3})`;
            ctx.beginPath(); ctx.arc(0, 0, V.wid * 0.7, 0, TAU); ctx.fill();
        }
        ctx.restore();
        // Health bar once it's been hit
        if (car.state === 'drive' && car.hp < car.maxHp) {
            const w = 60, x = car.x - w / 2, y = car.y - V.len / 2 - 18;
            ctx.fillStyle = 'rgba(18,10,38,0.75)'; roundRect(ctx, x - 2, y - 2, w + 4, 8, 3); ctx.fill();
            ctx.fillStyle = '#ffb347'; ctx.fillRect(x, y, w * (car.hp / car.maxHp), 4);
        }
    }
}

// A soldier riding in the vehicle, gun pointing where he's aiming (angle in the vehicle's frame)
function drawGunner(x, y, a, turret) {
    ctx.save();
    ctx.translate(x, y);
    if (turret) { ctx.fillStyle = '#2c3320'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill(); }
    ctx.rotate(a);
    ctx.fillStyle = '#1f1b2b';
    ctx.fillRect(4, -2.5, turret ? 34 : 22, turret ? 6 : 5);
    ctx.rotate(-a);
    ctx.fillStyle = shade(ESCAPE.soldier, -0.45); ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3d4526'; ctx.beginPath(); ctx.arc(-0.5, -0.5, 7, 0, TAU); ctx.fill();
    ctx.restore();
}

// Top-down military vehicles in their own frame (+x forward). charred = burnt-out wreck.
function drawVehicleShape(type, color, seed, charred, g = ctx) {
    const V = VEHICLES[type], L = V.len, Wd = V.wid, rnd = seededRand(seed || 1);
    const body = charred ? '#2a2622' : color, dark = charred ? '#141210' : shade(color, -0.35), light = charred ? '#3a3430' : shade(color, 0.18);
    // Wheels / tracks poking out the sides
    g.fillStyle = '#151515';
    const axles = type === 'apc' ? [-0.36, -0.12, 0.12, 0.36] : type === 'truck' ? [-0.34, -0.16, 0.32] : [-0.3, 0.3];
    for (const k of axles) { g.fillRect(L * k - 9, -Wd / 2 - 4, 18, 8); g.fillRect(L * k - 9, Wd / 2 - 4, 18, 8); }
    g.fillStyle = dark;
    roundRect(g, -L / 2 - 1.5, -Wd / 2 - 1.5, L + 3, Wd + 3, type === 'jeep' ? 8 : 5); g.fill();
    g.fillStyle = body;
    roundRect(g, -L / 2, -Wd / 2, L, Wd, type === 'jeep' ? 7 : 4); g.fill();
    // Camo blotches
    if (!charred) {
        g.fillStyle = 'rgba(35,40,22,0.45)';
        for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse((rnd() - 0.5) * L * 0.8, (rnd() - 0.5) * Wd * 0.7, 6 + rnd() * 10, 4 + rnd() * 6, rnd() * 3, 0, TAU); g.fill(); }
    }
    if (type === 'jeep') {
        g.fillStyle = light; g.fillRect(L * 0.14, -Wd / 2 + 4, L * 0.32, Wd - 8);   // hood
        g.fillStyle = 'rgba(20,30,40,0.8)'; g.fillRect(L * 0.08, -Wd / 2 + 3, 4, Wd - 6);  // windshield frame
        g.fillStyle = dark; g.fillRect(-L * 0.42, -Wd / 2 + 5, L * 0.46, Wd - 10);      // open back
        g.fillStyle = '#151515'; g.beginPath(); g.arc(-L / 2 - 3, 0, 8, 0, TAU); g.fill(); // spare tire
    } else if (type === 'humvee') {
        g.fillStyle = light; g.fillRect(L * 0.18, -Wd / 2 + 5, L * 0.3, Wd - 10);
        g.fillStyle = 'rgba(20,30,40,0.85)'; g.fillRect(L * 0.1, -Wd / 2 + 6, 6, Wd - 12);
        g.fillStyle = dark; g.fillRect(-L * 0.46, -Wd / 2 + 5, L * 0.5, Wd - 10);
        g.fillStyle = shade(body, -0.15); g.fillRect(-L * 0.44, -Wd / 2 + 7, L * 0.46, Wd - 14);
    } else if (type === 'apc') {
        g.fillStyle = light; g.beginPath(); g.moveTo(L / 2, -Wd / 2 + 6); g.lineTo(L * 0.3, -Wd / 2 + 2); g.lineTo(L * 0.3, Wd / 2 - 2); g.lineTo(L / 2, Wd / 2 - 6); g.closePath(); g.fill();
        g.strokeStyle = dark; g.lineWidth = 2;
        for (const k of [-0.3, 0.05]) { g.strokeRect(L * k, -Wd / 2 + 8, 18, 14); g.strokeRect(L * k, Wd / 2 - 22, 18, 14); }
    } else {
        g.fillStyle = light; g.fillRect(L * 0.18, -Wd / 2 + 2, L * 0.32, Wd - 4);   // cab
        g.fillStyle = 'rgba(20,30,40,0.85)'; g.fillRect(L * 0.42, -Wd / 2 + 6, 5, Wd - 12);
        g.fillStyle = charred ? '#2e2a26' : '#8a8460'; g.fillRect(-L / 2 + 2, -Wd / 2 + 2, L * 0.64, Wd - 4);  // canvas cargo cover
        g.strokeStyle = charred ? '#1a1714' : 'rgba(60,55,35,0.6)'; g.lineWidth = 2;
        for (let x = -L / 2 + 14; x < L * 0.12; x += 16) { g.beginPath(); g.moveTo(x, -Wd / 2 + 2); g.lineTo(x, Wd / 2 - 2); g.stroke(); }
    }
    if (!charred) {
        // White star and headlights
        g.fillStyle = 'rgba(240,240,230,0.75)';
        g.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7, a = (i / 10) * TAU - Math.PI / 2; g.lineTo(L * 0.3 + Math.cos(a) * r, Math.sin(a) * r); }
        g.fill();
        g.fillStyle = '#fff3c4'; g.fillRect(L / 2 - 3, -Wd / 2 + 4, 4, 6); g.fillRect(L / 2 - 3, Wd / 2 - 10, 4, 6);
    }
}

function drawFires(now) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const fr of G.fires) {
        if (!inView(fr.x, fr.y, fr.r + 40)) continue;
        const fade = clamp((fr.until - G.time) / 3000, 0, 1), flick = 0.8 + Math.sin(now * 13 + fr.x) * 0.2;
        const grad = ctx.createRadialGradient(fr.x, fr.y, 0, fr.x, fr.y, fr.r * 1.6);
        grad.addColorStop(0, `rgba(255,170,70,${0.55 * fade * flick})`);
        grad.addColorStop(1, 'rgba(255,90,30,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(fr.x, fr.y, fr.r * 1.6, 0, TAU); ctx.fill();
    }
    ctx.restore();
}

function drawBombs() {
    for (const bm of G.bombs) {
        const k = bm.t / bm.T;
        ctx.fillStyle = `rgba(0,0,0,${0.15 + k * 0.35})`;
        ctx.beginPath(); ctx.ellipse(bm.x, bm.y, 8 + k * 14, 5 + k * 9, 0, 0, TAU); ctx.fill();
    }
}

function drawJets() {
    for (const j of G.jets) {
        if (!inView(j.x, j.y, 400)) continue;
        const a = Math.atan2(j.vy, j.vx);
        // Shadow far below, then the jet
        for (const [ox, oy, col] of [[120, 160, 'rgba(0,0,0,0.25)'], [0, 0, '#5b6270']]) {
            ctx.save();
            ctx.translate(j.x + ox, j.y + oy);
            ctx.rotate(a);
            ctx.scale(1.6, 1.6);
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.moveTo(48, 0); ctx.lineTo(10, -8); ctx.lineTo(-6, -40); ctx.lineTo(-16, -40); ctx.lineTo(-10, -8);
            ctx.lineTo(-30, -6); ctx.lineTo(-40, -20); ctx.lineTo(-46, -20); ctx.lineTo(-42, 0);
            ctx.lineTo(-46, 20); ctx.lineTo(-40, 20); ctx.lineTo(-30, 6); ctx.lineTo(-10, 8); ctx.lineTo(-16, 40); ctx.lineTo(-6, 40); ctx.lineTo(10, 8);
            ctx.closePath(); ctx.fill();
            if (oy === 0) {
                ctx.fillStyle = 'rgba(150,210,255,0.8)'; ctx.beginPath(); ctx.ellipse(22, 0, 9, 3.5, 0, 0, TAU); ctx.fill();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(255,170,80,0.8)'; ctx.beginPath(); ctx.ellipse(-50, 0, 10 + Math.random() * 6, 4, 0, 0, TAU); ctx.fill();
            }
            ctx.restore();
        }
    }
}

// Rubble piles left by a collapsed building


// ---------- Realism: blood and bodies, brass, bullet holes, ground detail, day and night ----------
const REALISM = {
    headZone: 0.2,            // a hit this close to the middle (as a share of the body radius) is a headshot
    headMul: 1.6, helmetMul: 1.2, zombieHeadMul: 2,
    bloomDecay: 1.2,          // how fast the gun settles after firing
    moveSpread: 0.035,        // extra spread while moving
    decals: 900, casings: 260
};
const DAY = { length: 420000, dark: 0.74 };

// How much recoil one shot adds to the spread
const kickOf = w => clamp((w.shake || 2) * 0.05, 0.03, 0.4);
// Current spread of a fighter's gun: settles when you stop firing, grows while moving
function gunSpread(f, w) {
    const moving = Math.hypot(f.vx, f.vy) > 60 ? (f.isPlayer ? 1 : 0.5) : 0;
    return (w.spread || 0) * (0.7 + (f.bloom || 0)) + (w.count ? 0 : moving * REALISM.moveSpread);
}
// Hurt people move slower, and a hit makes you flinch for a moment
function hurtPace(f) {
    const max = f.maxHp || CONFIG.MAX_HEALTH;
    return (0.78 + 0.22 * clamp(f.hp / max, 0, 1)) * (G.time - f.lastHurt < 200 ? 0.8 : 1) * (1 - (f.chill || 0) * 0.55);
}

// ----- Decals: things left on the ground (per floor/street, so each layer keeps its own) -----
function addDecal(d) {
    const list = G.world.decals || (G.world.decals = []);
    d.born = G.time;
    list.push(d);
    // Over the limit: drop the oldest marks that fade anyway (ruin debris and craters stay for good)
    while (list.length > REALISM.decals) { const i = list.findIndex(q => q.life < 1e11); if (i < 0) break; list.splice(i, 1); }
    return d;
}
function addCasing(x, y) {
    const list = G.world.casings || (G.world.casings = []);
    list.push({ x, y, a: rand(0, TAU), born: G.time });
    if (list.length > REALISM.casings) list.shift();
}
// A splash of blood thrown out behind whoever got hit
function bloodSplat(x, y, ang, size = 1) {
    const blobs = [];
    for (let i = 0, n = randInt(4, 8); i < n; i++) {
        const d = rand(0, 26) * size, a = ang + rand(-0.6, 0.6);
        blobs.push([Math.cos(a) * d, Math.sin(a) * d, rand(2, 7) * size * (1 - d / (40 * size))]);
    }
    addDecal({ kind: 'blood', x, y, blobs, life: 120000 });
}
function addCorpse(f) {
    const a = f.angle + rand(-0.5, 0.5);
    // The pool spreads out from under the body, so it goes down first
    addDecal({ kind: 'pool', x: f.x - Math.cos(a) * 6, y: f.y - Math.sin(a) * 6, r: rand(28, 40), life: 90000 });
    f.corpse = addDecal({ kind: 'corpse', x: f.x, y: f.y, a, r: f.r, color: f.color, dark: f.dark, light: f.light, helmet: f.soldier, life: G.revolution ? Infinity : 70000, armL: rand(0.6, 1.4), armR: rand(0.6, 1.4) });
}

function decalAlpha(d) {
    const age = G.time - d.born, left = d.life - age;
    return left <= 0 ? 0 : Math.min(1, left / 15000);
}

function drawDecals(L, T, R, B, layer) {
    const list = G.world.decals;
    if (layer === 'ground' && G.world.casings && !lowDetail) {
        for (const c of G.world.casings) {
            if (c.x < L || c.x > R || c.y < T || c.y > B) continue;
            const t = 1 - (G.time - c.born) / 25000;
            if (t <= 0) continue;
            ctx.globalAlpha = Math.min(1, t * 3);
            ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
            ctx.fillStyle = '#b8862e'; ctx.fillRect(-3, -1.2, 6, 2.4);
            ctx.fillStyle = '#f0c968'; ctx.fillRect(-3, -1.2, 4, 1);
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }
    if (!list) return;
    let dead = 0;
    for (const d of list) {
        const a = decalAlpha(d);
        if (a <= 0) { dead++; continue; }
        const isWall = d.kind === 'hole' || d.kind === 'bolt';
        if ((layer === 'wall') !== isWall) continue;
        const m = (d.r || 0) + 80;
        if (d.x < L - m || d.x > R + m || d.y < T - m || d.y > B + m) continue;
        ctx.globalAlpha = a;
        switch (d.kind) {
            case 'blood':
                ctx.fillStyle = 'rgba(110,8,12,0.75)';
                ctx.beginPath();
                for (const [dx, dy, r] of d.blobs) { ctx.moveTo(d.x + dx + r, d.y + dy); ctx.arc(d.x + dx, d.y + dy, Math.max(0.5, r), 0, TAU); }
                ctx.fill();
                break;
            case 'pool': {
                const r = d.r * Math.min(1, (G.time - d.born) / 5000 + 0.2);
                ctx.fillStyle = 'rgba(95,6,12,0.62)';
                ctx.beginPath(); ctx.ellipse(d.x, d.y, r, r * 0.8, 0.4, 0, TAU); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.beginPath(); ctx.ellipse(d.x - r * 0.3, d.y - r * 0.25, r * 0.35, r * 0.18, 0.4, 0, TAU); ctx.fill();
                break;
            }
            case 'corpse': drawCorpse(d); break;
            case 'deadhorse': drawDeadHorse(d); break;
            case 'scorch': {
                const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
                g.addColorStop(0, 'rgba(15,12,10,0.75)'); g.addColorStop(0.6, 'rgba(25,20,15,0.45)'); g.addColorStop(1, 'rgba(30,25,20,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
                if (d.tint) {
                    const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
                    glow.addColorStop(0, `rgba(${d.tint},0.35)`); glow.addColorStop(1, `rgba(${d.tint},0)`);
                    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
                }
                break;
            }
            case 'crater': {
                const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
                g.addColorStop(0, 'rgba(12,10,8,0.85)'); g.addColorStop(0.25, 'rgba(30,24,18,0.8)'); g.addColorStop(0.8, 'rgba(45,38,30,0.6)'); g.addColorStop(1, 'rgba(50,42,34,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
                // Glowing embers in the middle for a while
                const heat = Math.max(0, 1 - (G.time - d.born) / 40000);
                if (heat > 0) { ctx.fillStyle = `rgba(255,110,40,${heat * 0.35})`; ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.2, 0, TAU); ctx.fill(); }
                break;
            }
            case 'stump':
                ctx.fillStyle = '#1a140f';
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.8, 0, TAU); ctx.fill();
                ctx.fillStyle = '#3a2a1c';
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.5, 0, TAU); ctx.fill();
                break;
            case 'debris': {
                // A loose plank, a scatter of splinters, a length of pipe or a torn scrap of sheet metal
                ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
                const r = d.r, wood = d.m !== 'metal', s = d.s || 0, c = (wood ? WRECK.wood : WRECK.metal)[(d.seed || 0) % 4];
                ctx.fillStyle = 'rgba(0,0,0,0.22)';
                if (wood && s < 2) {
                    ctx.fillRect(-r + 2, -r * 0.18 + 2, r * 2, r * 0.36);
                    ctx.fillStyle = c; ctx.fillRect(-r, -r * 0.18, r * 2, r * 0.36);
                    ctx.fillStyle = 'rgba(40,24,10,0.35)'; ctx.fillRect(-r + 2, -0.5, r * 2 - 4, 1);
                    ctx.fillStyle = '#c9a070'; ctx.beginPath(); ctx.moveTo(r, -r * 0.18); ctx.lineTo(r + 4, 0); ctx.lineTo(r, r * 0.18); ctx.fill();
                    if (s === 1) { ctx.fillStyle = '#9aa0a6'; ctx.fillRect(-r + 3, -r * 0.18 - 3, 1.5, 4); }
                } else if (wood) {
                    ctx.fillStyle = c;
                    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * 0.8 + s); ctx.fillRect(-r * 0.6, -1, r * (0.6 + i * 0.15), 2.2); ctx.restore(); }
                } else if (s < 2) {
                    ctx.fillRect(-r + 2, -2, r * 2, 6);
                    ctx.fillStyle = c; ctx.fillRect(-r, -3, r * 2, 6);
                    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-r, -3, r * 2, 1.5);
                    ctx.fillStyle = shade(c, -0.4); ctx.beginPath(); ctx.ellipse(r, 0, 1.5, 3, 0, 0, TAU); ctx.fill();
                } else {
                    ctx.beginPath(); ctx.moveTo(-r / 2 + 2, -r / 3 + 3); ctx.lineTo(r / 2 + 2, -r / 4 + 3); ctx.lineTo(r / 3 + 2, r / 3 + 3); ctx.lineTo(-r / 2.5 + 2, r / 3.5 + 3); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-r / 2, -r / 3); ctx.lineTo(r / 2, -r / 4); ctx.lineTo(r / 3, r / 3); ctx.lineTo(-r / 2.5, r / 3.5); ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = shade(c, 0.2); ctx.lineWidth = 1.2; ctx.beginPath();
                    for (let x = -r / 3; x < r / 3; x += 4) { ctx.moveTo(x, -r / 4); ctx.lineTo(x, r / 4); }
                    ctx.stroke();
                }
                ctx.restore();
                break;
            }
            case 'bolt':
                // A crossbow bolt stuck in the wall, fletching out
                ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
                ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(2, 0); ctx.stroke();
                ctx.fillStyle = '#e8e3d0'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-22, -4); ctx.lineTo(-19, 0); ctx.lineTo(-22, 4); ctx.closePath(); ctx.fill();
                ctx.restore();
                break;
            case 'hole':
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.beginPath(); ctx.arc(d.x + 0.8, d.y + 0.8, 3.2, 0, TAU); ctx.fill();
                ctx.fillStyle = '#1b1714';
                ctx.beginPath(); ctx.arc(d.x, d.y, 2.4, 0, TAU); ctx.fill();
                break;
        }
    }
    ctx.globalAlpha = 1;
    if (dead > 50) G.world.decals = list.filter(d => decalAlpha(d) > 0);
}

// A body lying where it fell, in the same round style as the living, hands flung out
// A horse lying on its side where it fell, legs out
function drawDeadHorse(d) {
    const L = VTYPES.horse.len, Wd = VTYPES.horse.wid, dark = shade(d.color, -0.45);
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
    ctx.fillStyle = dark;
    for (const [lx, a] of [[L * 0.2, 0.3], [L * 0.28, 0.6], [-L * 0.2, -0.3], [-L * 0.28, -0.1]]) { ctx.save(); ctx.translate(lx, Wd * 0.3); ctx.rotate(a); roundRect(ctx, -3.5, 0, 7, Wd * 0.75, 3); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(-L * 0.04, 0, L * 0.36, Wd * 0.52, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.ellipse(-L * 0.04, -1, L * 0.34, Wd * 0.48, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.ellipse(L * 0.36, Wd * 0.12, L * 0.16, Wd * 0.2, 0.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-L * 0.36, 0); ctx.lineTo(-L * 0.52, Wd * 0.15); ctx.stroke();
    ctx.restore();
}

function drawCorpse(d) {
    const r = d.r;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.a);
    for (const [hx, hy] of [[r * 0.5 * d.armL, -r * 1.25], [r * 0.3 * d.armR, r * 1.25]]) {
        ctx.fillStyle = d.dark; ctx.beginPath(); ctx.arc(hx, hy, 7.5, 0, TAU); ctx.fill();
        ctx.fillStyle = d.light; ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = d.dark;
    ctx.beginPath(); ctx.arc(0, 0, r + 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    if (d.helmet) { ctx.fillStyle = '#3d4526'; ctx.beginPath(); ctx.arc(-r * 0.05, -r * 0.1, r * 0.62, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(20,10,20,0.25)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.restore();
}

// ----- Ground detail: tufts, pebbles and dirt out in the wild; cracks, stains, manholes, litter and puddles in the city -----
function buildGroundDetail() {
    const W = CONFIG.WORLD_SIZE, grid = new Grid(400, 60), lamps = [];
    const city = G.world.city;
    const add = d => grid.insert(d);
    if (city) {
        const S = CITY.street, P = CITY.block;
        for (const at of city.streets) for (let k = 0; k < W; k += P) {
            // Along each stretch of road (both directions)
            for (const horiz of [true, false]) {
                const along = () => k + rand(S / 2 + 20, P - S / 2 - 20), across = () => at + rand(-S / 2 + 10, S / 2 - 10);
                const pt = () => (horiz ? { x: along(), y: across() } : { x: across(), y: along() });
                for (let i = randInt(1, 3); i > 0; i--) { const p = pt(); const pts = [[0, 0]]; let a = rand(0, TAU); for (let j = 0; j < randInt(3, 6); j++) { a += rand(-0.8, 0.8); const l = pts[pts.length - 1]; pts.push([l[0] + Math.cos(a) * rand(12, 30), l[1] + Math.sin(a) * rand(12, 30)]); } add({ k: 'crack', ...p, pts }); }
                if (Math.random() < 0.7) add({ k: 'oil', ...pt(), r: rand(10, 28), a: rand(0, TAU) });
                if (Math.random() < 0.25) add({ k: 'manhole', ...pt() });
                if (Math.random() < 0.3) add({ k: 'puddle', ...pt(), r: rand(18, 46), a: rand(0, TAU) });
                // Street lamps on the corner of every block, on the sidewalk
                const lp = horiz ? { x: k + P / 2, y: at + (Math.random() < 0.5 ? -1 : 1) * (S / 2 + 14) } : { x: at + (Math.random() < 0.5 ? -1 : 1) * (S / 2 + 14), y: k + P / 2 };
                if (lp.x > 50 && lp.y > 50 && lp.x < W - 50 && lp.y < W - 50) lamps.push(lp);
            }
        }
        if (G.world.rusty) {
            for (let i = lamps.length - 1; i >= 0; i--) if (Math.random() < 0.7) lamps.splice(i, 1);  // most lamps are dead
            for (let i = 0; i < 1800 * MAP_AREA; i++) {
                const x = rand(0, W), y = rand(0, W), r = Math.random();
                if (r < 0.5) add({ k: 'rubble', x, y, s: rand(3, 9), a: rand(0, TAU), c: pick(['#6a645c', '#8a847a', '#4a453f', '#7a5a3a']) });
                else if (r < 0.75) add({ k: 'oil', x, y, r: rand(14, 40), a: rand(0, TAU) });
                else if (r < 0.9) add({ k: 'tire', x, y });
                else { const pts = [[0, 0]]; let a = rand(0, TAU); for (let j = 0; j < 6; j++) { a += rand(-0.8, 0.8); const l = pts[pts.length - 1]; pts.push([l[0] + Math.cos(a) * rand(15, 35), l[1] + Math.sin(a) * rand(15, 35)]); } add({ k: 'crack', x, y, pts }); }
            }
        }
        // Litter on the sidewalks
        for (let i = 0; i < 2500 * MAP_AREA; i++) {
            const x = rand(0, W), y = rand(0, W);
            add({ k: 'litter', x, y, a: rand(0, TAU), c: pick(['#e9e4d8', '#d8d0c0', '#c0392b', '#2e86de', '#7f8c8d', '#e9c46a']), s: rand(3, 7) });
        }
    } else if (G.world.terrain === 'cavern') {
        // Loose stones and cracks across the cave floor
        const cave = G.world.cave;
        for (let i = 0; i < 4000 * MAP_AREA; i++) {
            const x = rand(0, W), y = rand(0, W), r = Math.random();
            if (!cave.inside(x, y)) continue;
            if (r < 0.6) add({ k: 'pebble', x, y, s: rand(2, 6), c: pick(['#6e655b', '#7d7368', '#544c44', '#8a8075']) });
            else if (r < 0.85) add({ k: 'rubble', x, y, s: rand(3, 8), a: rand(0, TAU), c: pick(['#5a524a', '#6a6158', '#3e3832']) });
            else { const pts = [[0, 0]]; let a = rand(0, TAU); for (let j = 0; j < 6; j++) { a += rand(-0.8, 0.8); const l = pts[pts.length - 1]; pts.push([l[0] + Math.cos(a) * rand(15, 35), l[1] + Math.sin(a) * rand(15, 35)]); } add({ k: 'crack', x, y, pts }); }
        }
    } else if (G.world.terrain === 'haunted') {
        // Dead grass, dry leaves and stones over the grounds (nothing inside the house)
        const h = G.world.haunt;
        for (let i = 0; i < 9000; i++) {
            const x = W / 2 + rand(-HAUNT.half - 600, HAUNT.half + 600), y = W / 2 + rand(-HAUNT.half - 600, HAUNT.half + 600), r = Math.random();
            if (x > h.X0 - 10 && x < h.X1 + 10 && y > h.Y0 - 10 && y < h.Y1 + 10) continue;
            if (r < 0.5) add({ k: 'tuft', x, y, s: rand(0.7, 1.3), c: pick(['#5a5a3a', '#4a4a32', '#6a6044', '#3e4430']) });
            else if (r < 0.8) add({ k: 'litter', x, y, a: rand(0, TAU), c: pick(['#6a3a1a', '#7a4a1e', '#5a2e14', '#8a5a2a']), s: rand(4, 7) });
            else if (r < 0.93) add({ k: 'pebble', x, y, s: rand(2, 4), c: pick(['#77736b', '#5f5c56']) });
            else add({ k: 'dirt', x, y, r: rand(20, 50), a: rand(0, TAU) });
        }
    } else if (G.world.terrain !== 'maze') {
        for (let i = 0; i < 5500 * MAP_AREA; i++) {
            const x = rand(0, W), y = rand(0, W), r = Math.random();
            if (G.world.height && G.world.height(x, y) > 0.7 && r < 0.75) continue;  // no grass up in the snow
            if (r < 0.55) add({ k: 'tuft', x, y, s: rand(0.7, 1.4), c: pick(['#3f7a33', '#4b8a3a', '#356b2b', '#5a9442']) });
            else if (r < 0.75) add({ k: 'pebble', x, y, s: rand(2, 5), c: pick(['#8d8a82', '#a29e94', '#77736b']) });
            else if (r < 0.9) add({ k: 'dirt', x, y, r: rand(20, 60), a: rand(0, TAU) });
            else add({ k: 'flower', x, y, c: pick(['#f4e04d', '#ffffff', '#e86a92', '#b48ee0']) });
        }
    }
    G.world.detail = grid;
    G.world.lamps = lamps;
    G.world.lampGrid = new Grid(400, 40);
    for (const l of lamps) G.world.lampGrid.insert(l);
}

function paintGroundDetail(g, cx, cy, half) {
    G.world.detail.query(cx, cy, half, d => {
        switch (d.k) {
            case 'tuft':
                g.strokeStyle = d.c; g.lineWidth = 2;
                g.beginPath();
                for (let i = -2; i <= 2; i++) { g.moveTo(d.x + i * 2.5 * d.s, d.y); g.lineTo(d.x + i * 4 * d.s, d.y - 9 * d.s + Math.abs(i) * 2); }
                g.stroke();
                break;
            case 'pebble':
                g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.arc(d.x + 1, d.y + 1.5, d.s, 0, TAU); g.fill();
                g.fillStyle = d.c; g.beginPath(); g.arc(d.x, d.y, d.s, 0, TAU); g.fill();
                break;
            case 'dirt':
                g.fillStyle = 'rgba(110,88,55,0.16)';
                g.beginPath(); g.ellipse(d.x, d.y, d.r, d.r * 0.6, d.a, 0, TAU); g.fill();
                break;
            case 'flower':
                g.fillStyle = d.c; g.beginPath(); g.arc(d.x, d.y, 2.2, 0, TAU); g.fill();
                break;
            case 'crack':
                g.strokeStyle = 'rgba(20,20,24,0.45)'; g.lineWidth = 1.6;
                g.beginPath(); d.pts.forEach(([px, py], i) => (i ? g.lineTo(d.x + px, d.y + py) : g.moveTo(d.x + px, d.y + py))); g.stroke();
                break;
            case 'oil':
                g.fillStyle = 'rgba(15,15,20,0.25)'; g.beginPath(); g.ellipse(d.x, d.y, d.r, d.r * 0.65, d.a, 0, TAU); g.fill();
                g.fillStyle = 'rgba(120,90,200,0.08)'; g.beginPath(); g.ellipse(d.x - 2, d.y - 2, d.r * 0.5, d.r * 0.3, d.a, 0, TAU); g.fill();
                break;
            case 'manhole':
                g.fillStyle = '#2b2b30'; g.beginPath(); g.arc(d.x, d.y, 15, 0, TAU); g.fill();
                g.strokeStyle = '#55555c'; g.lineWidth = 2; g.beginPath(); g.arc(d.x, d.y, 12, 0, TAU); g.stroke();
                g.beginPath(); for (let i = -8; i <= 8; i += 4) { g.moveTo(d.x - 9, d.y + i); g.lineTo(d.x + 9, d.y + i); } g.stroke();
                break;
            case 'puddle':
                g.fillStyle = 'rgba(60,70,90,0.35)'; g.beginPath(); g.ellipse(d.x, d.y, d.r, d.r * 0.55, d.a, 0, TAU); g.fill();
                g.fillStyle = 'rgba(200,220,255,0.12)'; g.beginPath(); g.ellipse(d.x - d.r * 0.25, d.y - d.r * 0.15, d.r * 0.4, d.r * 0.12, d.a, 0, TAU); g.fill();
                break;
            case 'rubble':
                g.save(); g.translate(d.x, d.y); g.rotate(d.a);
                g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-d.s / 2 + 1.5, -d.s / 3 + 2, d.s, d.s * 0.7);
                g.fillStyle = d.c; g.fillRect(-d.s / 2, -d.s / 3, d.s, d.s * 0.7);
                g.restore();
                break;
            case 'tire':
                g.fillStyle = '#151414'; g.beginPath(); g.arc(d.x, d.y, 11, 0, TAU); g.fill();
                g.fillStyle = '#3a3634'; g.beginPath(); g.arc(d.x, d.y, 5, 0, TAU); g.fill();
                break;
            case 'litter':
                g.save(); g.translate(d.x, d.y); g.rotate(d.a);
                g.fillStyle = d.c; g.fillRect(-d.s / 2, -d.s / 3, d.s, d.s * 0.66);
                g.restore();
                break;
        }
    });
}

function drawLamps(cx, cy, half) {
    if (!G.world.lampGrid || lowDetail) return;
    const lit = darkness() > 0.1;
    G.world.lampGrid.query(cx, cy, half, l => {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(l.x + 4, l.y + 5, 7, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3b3d44'; ctx.beginPath(); ctx.arc(l.x, l.y, 6, 0, TAU); ctx.fill();
        ctx.fillStyle = lit ? '#ffe9a8' : '#9a9ca4'; ctx.beginPath(); ctx.arc(l.x, l.y, 3.5, 0, TAU); ctx.fill();
    });
}

// Fine grain plus all the little details, painted once into tiles that are reused every frame
const TILE = { size: 512, scale: 0.5, keep: 64 };
let noiseCanvas = null;
function bakeGroundTile(tx, ty) {
    const S = TILE.size, [c, g] = makeCanvas(S * TILE.scale, S * TILE.scale);
    g.scale(TILE.scale, TILE.scale);
    g.translate(-tx * S, -ty * S);
    if (!noiseCanvas) {
        const [nc, ng] = makeCanvas(256, 256);
        for (let i = 0; i < 2600; i++) {
            ng.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${rand(0.02, 0.07)})` : `rgba(0,0,0,${rand(0.03, 0.1)})`;
            ng.fillRect(Math.random() * 256, Math.random() * 256, rand(1, 3), rand(1, 3));
        }
        noiseCanvas = nc;
    }
    if (G.world.terrain) paintTerrainBase(g, tx * S, ty * S, S);
    g.fillStyle = g.createPattern(noiseCanvas, 'repeat');
    g.fillRect(tx * S, ty * S, S, S);
    paintGroundDetail(g, tx * S + S / 2, ty * S + S / 2, S / 2 + 70);
    return c;
}
function drawGroundDetail(L, T, R, B) {
    if (lowDetail && !G.world.terrain) return;  // the maze and mountains need their ground even zoomed right out
    if (!G.world.detail) buildGroundDetail();
    const S = TILE.size, W = CONFIG.WORLD_SIZE, tiles = G.world.tiles || (G.world.tiles = new Map());
    for (let tx = Math.max(0, Math.floor(L / S)); tx <= Math.min(Math.floor(W / S), Math.floor(R / S)); tx++) {
        for (let ty = Math.max(0, Math.floor(T / S)); ty <= Math.min(Math.floor(W / S), Math.floor(B / S)); ty++) {
            const key = tx * 4096 + ty;
            let c = tiles.get(key);
            if (c) tiles.delete(key);
            else c = bakeGroundTile(tx, ty);
            tiles.set(key, c);  // most recently used goes to the back
            ctx.drawImage(c, tx * S, ty * S, S, S);
        }
    }
    while (tiles.size > TILE.keep) tiles.delete(tiles.keys().next().value);
}

// ----- Day and night -----
function dayT() { return (G.time / DAY.length + (G.dayPhase || 0)) % 1; }
// 0 in daylight, DAY.dark at the dead of night
const ZOMBIE_DARK = 1;
const pitchDark = () => !!G && (G.zombies || G.assassin || G.ghostMode) && G.mode !== 'demo';  // Zombies is played in pitch dark: your flashlight is all you've got
function darkness() {
    if ((G.zombies || G.assassin || G.ghostMode) && G.mode !== 'demo') return ZOMBIE_DARK;
    if (G.world.terrain === 'cavern') return CAVERN.dark;
    if (!G.dayCycle || G.world.floor) return 0;
    const t = dayT();
    if (t < 0.45) return 0;
    if (t < 0.55) return ((t - 0.45) / 0.1) * DAY.dark;
    if (t < 0.9) return DAY.dark;
    return ((1 - t) / 0.1) * DAY.dark;
}
// Orange light at sunset and sunrise
function duskGlow() {
    if (!G.dayCycle || G.world.floor) return 0;
    const t = dayT();
    const near = Math.min(Math.abs(t - 0.5), Math.abs(t - 0.95));
    return Math.max(0, 1 - near / 0.06);
}
// At night bots spot you from less far away, unless you're shooting or under a light
function sightOf(target) {
    const d = darkness();
    if (!d || G.time - (target.lastLoud || -1e9) < 1500) return CONFIG.BOT_SIGHT;
    return CONFIG.BOT_SIGHT * (1 - 0.45 * (d / DAY.dark));
}
function updateDayCycle() {
    if (!G.dayCycle || G.mode !== 'playing') return;
    const night = darkness() > DAY.dark * 0.6;
    if (G.wasNight !== undefined && night !== G.wasNight && !G.world.floor) {
        if (night) showBanner('NIGHT FALLS', false, 'Harder to see, and harder to be seen. Muzzle flashes give you away.');
        else showBanner('DAWN BREAKS', false, 'The sun is coming up.');
    }
    G.wasNight = night;
}

let lightCv = null, lightG = null;
function drawLighting(camX, camY, zoom) {
    const dark = darkness(), dusk = duskGlow();
    if (dusk > 0.01) { ctx.fillStyle = `rgba(255,120,40,${dusk * 0.12})`; ctx.fillRect(0, 0, viewW, viewH); }
    if (dark < 0.02) return;
    const k = 0.5, w = Math.ceil(viewW * k), h = Math.ceil(viewH * k);
    if (!lightCv || lightCv.width !== w || lightCv.height !== h) [lightCv, lightG] = makeCanvas(w, h);
    const g = lightG, s = zoom * k;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, w, h);
    g.fillStyle = pitchDark() ? `rgba(1,2,6,${dark})` : `rgba(6,10,28,${dark})`;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-out';
    const light = (x, y, r, a = 1) => {
        const sx = (x - camX) * s, sy = (y - camY) * s, sr = r * s;
        if (sx < -sr || sy < -sr || sx > w + sr || sy > h + sr) return;
        const grad = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
        grad.addColorStop(0, `rgba(0,0,0,${a})`); grad.addColorStop(0.5, `rgba(0,0,0,${a * 0.6})`); grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    };
    const p = G.player && !G.player.dead ? G.player : null;
    const pitch = pitchDark();
    if (p) {
        // (pitch dark: just enough glow to see yourself, then only the flashlight)
        light(p.x, p.y, pitch ? 75 : 260, pitch ? 0.75 : 0.9);
        // Flashlight beam where you're aiming
        const sx = (p.x - camX) * s, sy = (p.y - camY) * s, len = 900 * s;
        const grad = g.createRadialGradient(sx, sy, 0, sx, sy, len);
        grad.addColorStop(0, 'rgba(0,0,0,0.85)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.beginPath(); g.moveTo(sx, sy); g.arc(sx, sy, len, p.angle - 0.35, p.angle + 0.35); g.closePath(); g.fill();
        if (!pitch) for (const f of G.fighters) if (f !== p && !f.dead && f.team !== null && f.team === p.team && Math.abs(f.x - p.x) < 1400 && Math.abs(f.y - p.y) < 1000) light(f.x, f.y, 120, 0.5);
    }
    if (pitch) {
        // Everyone else carries a flashlight too (zombies don't): you see their beams sweep the dark
        const cone = (f, len, a) => {
            const sx = (f.x - camX) * s, sy = (f.y - camY) * s, L = len * s;
            if (sx < -L || sy < -L || sx > w + L || sy > h + L) return;
            const grad = g.createRadialGradient(sx, sy, 0, sx, sy, L);
            grad.addColorStop(0, `rgba(0,0,0,${a})`); grad.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = grad;
            g.beginPath(); g.moveTo(sx, sy); g.arc(sx, sy, L, f.angle - 0.32, f.angle + 0.32); g.closePath(); g.fill();
        };
        for (const f of G.fighters) if (f !== p && !f.dead && !f.zombie && !f.downed && !f.car && !f.ghost) { cone(f, 650, 0.7); light(f.x, f.y, 55, 0.55); }
        if (p && p.scopeAt) light(p.scopeAt.x, p.scopeAt.y, Math.min(viewW, viewH) * 0.6 / zoom, 1);
        // The haunted house: candles, lanterns, pumpkins and wisps glow (flickering) in the dark
        if (G.world.terrain === 'haunted') for (const q of G.world.glows) {
            const fl = 0.85 + 0.15 * Math.sin(G.time / 90 + q.seed * 13) * Math.sin(G.time / 37 + q.seed);
            const x = q.wisp ? q.x + Math.sin(G.time / 1700 + q.seed) * 60 : q.x, y = q.wisp ? q.y + Math.cos(G.time / 2100 + q.seed * 2) * 40 : q.y;
            light(x, y, q.r * 6 * fl, q.wisp ? 0.45 : 0.7);
        }
        ctx.drawImage(lightCv, 0, 0, viewW, viewH);
        if (G.ghostMode) drawGhostSteps(camX, camY, zoom);
        if (G.zombies) drawZombieEyes(camX, camY, zoom);
        return;
    }
    if (G.world.lampGrid) G.world.lampGrid.query(G.cam.x, G.cam.y, viewW / zoom, l => light(l.x, l.y, 240, 0.85));
    if (G.world.glows) for (const q of G.world.glows) light(q.x, q.y, q.lava ? q.r * 3.2 : q.r * 6, q.lava ? 0.9 : 0.75);
    for (const q of G.particles) {
        if (q.type === 'flash') light(q.x, q.y, 170, 0.9);
        else if (q.type === 'boom') light(q.x, q.y, q.size * 2.2, 1);
        else if (q.type === 'glow' && q.size > 5) light(q.x, q.y, q.size * 5, 0.5);
        else if (q.type === 'cube') light(q.x, q.y - q.z, q.size * 5, 0.5 * (1 - q.fade));
    }
    if (G.fires) for (const f of G.fires) light(f.x, f.y, (f.r || 60) * 3, 0.9);
    ctx.drawImage(lightCv, 0, 0, viewW, viewH);
    if (G.zombies && dark > 0.9) drawZombieEyes(camX, camY, zoom);
}
// In the dark, the zombies close by give themselves away: two glowing eyes
function drawZombieEyes(camX, camY, zoom) {
    const p = G.player;
    if (!p || p.zombie) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of G.fighters) {
        if (!f.zombie || f.dead || f === p || Math.hypot(f.x - p.x, f.y - p.y) > 900) continue;
        const sx = (f.x - camX) * zoom, sy = (f.y - camY) * zoom;
        if (sx < -20 || sy < -20 || sx > viewW + 20 || sy > viewH + 20) continue;
        const a = f.angle, fx = Math.cos(a), fy = Math.sin(a), r = f.r * zoom;
        const flick = 0.6 + 0.4 * Math.sin(G.time / 180 + f.x);
        for (const side of [-1, 1]) {
            const ex = sx + fx * r * 0.55 - fy * r * 0.35 * side, ey = sy + fy * r * 0.55 + fx * r * 0.35 * side;
            ctx.fillStyle = `rgba(150,255,60,${0.25 * flick})`;
            ctx.beginPath(); ctx.arc(ex, ey, Math.max(3, r * 0.3), 0, TAU); ctx.fill();
            ctx.fillStyle = `rgba(220,255,140,${0.9 * flick})`;
            ctx.beginPath(); ctx.arc(ex, ey, Math.max(1.2, r * 0.11), 0, TAU); ctx.fill();
        }
    }
    ctx.restore();
}

// ---------- Doomsday: a pocket nuke ----------
// Thrown like a strobe. Once it lands it counts down, then wipes out everything inside its radius:
// anyone there dies on the spot, forests, houses and cars are flattened, and the shock wave hurts people further out.
const NUKE = { radius: 3000 * MAP_SCALE, shock: 4300 * MAP_SCALE, delay: 24, fuse: 2.6, cloud: 2.4 * MAP_SCALE };
const nukes = () => G.world.nukes || (G.world.nukes = []);

function armNuke(x, y, owner, aimed) {
    nukes().push({ x, y, owner, t: 0 });
    // Everyone hears this one coming
    const youIn = G.player && Math.hypot(G.player.x - x, G.player.y - y) < NUKE.radius;
    if (G.mode === 'playing') showBanner(aimed && owner === G.player ? 'NUKE LAUNCHED' : 'NUKE INCOMING', true,
        owner && owner.isPlayer ? (aimed && !youIn ? `It hits your target in ${NUKE.delay} seconds` : `You have ${NUKE.delay} seconds. RUN!`) : `Get out of the red circle in ${NUKE.delay} seconds!`);
    Sound.siren(1);
}

// You don't throw a Doomsday Nuke: USE brings up the whole map and you pick where it comes down
const nukeMap = { open: false, hover: null, S: 0, held: false };
const canMapNuke = p => !!(G && G.mode === 'playing' && p && p.isPlayer && !p.remote && !p.dead && !p.downed && !p.zombie && p.items.nuke > 0 && !G.world.floor);
function openNukeMap(p = G && G.player) {
    if (!canMapNuke(p)) return false;
    nukeMap.open = true; nukeMap.hover = null; nukeMap.held = false;
    $('nuke-map').classList.remove('hidden');
    document.body.classList.remove('playing');
    keys.clear(); mouse.down = false; p.cookByTrigger = false;
    G.mode = 'paused';
    drawNukeMap();
    Sound.tone(220, 0.25, 'square', 0.06, 440);
    return true;
}
function closeNukeMap(target) {
    if (!nukeMap.open) return;
    nukeMap.open = false;
    $('nuke-map').classList.add('hidden');
    mouse.down = false;
    if (G && G.mode === 'paused') { G.mode = 'playing'; document.body.classList.add('playing'); }
    const p = G && G.player;
    if (!p) return;
    p.nadeReady = false;  // (the trigger goes back to your gun)
    if (!target || p.dead || !(p.items.nuke > 0)) return;
    p.items.nuke--;
    armNuke(clamp(target.x, 0, CONFIG.WORLD_SIZE), clamp(target.y, 0, CONFIG.WORLD_SIZE), p, true);
    G.shake = Math.max(G.shake || 0, 6);
}
// The map picture: the whole battlefield, the bases, the zone, you and your team, and where the nuke would land
function drawNukeMap() {
    const cv = $('nm-canvas'), W = CONFIG.WORLD_SIZE;
    const S = Math.max(160, Math.floor(Math.min(window.innerWidth - 60, window.innerHeight - (window.innerHeight < 520 ? 100 : 240), 780)));
    const d = window.devicePixelRatio || 1;
    if (nukeMap.S !== S || cv.width !== Math.round(S * d)) { cv.width = Math.round(S * d); cv.height = Math.round(S * d); cv.style.width = cv.style.height = S + 'px'; nukeMap.S = S; }
    const g = cv.getContext('2d'), k = S / W, p = G.player;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(G.world.minimap, 0, 0, S, S);
    // crisp buildings over the picture
    for (const b of G.world.buildings || []) { g.fillStyle = b.roof || '#777'; g.fillRect(b.x0 * k, b.y0 * k, Math.max(1, b.w * k), Math.max(1, b.h * k)); }
    // a light grid, like a war-room map
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1;
    for (let i = 1; i < 8; i++) { const v = Math.round((S * i) / 8) + 0.5; g.beginPath(); g.moveTo(v, 0); g.lineTo(v, S); g.moveTo(0, v); g.lineTo(S, v); g.stroke(); }
    const z = G.zone;
    if (z && !G.noZone) {
        g.beginPath(); g.rect(0, 0, S, S); g.arc(z.cx * k, z.cy * k, Math.max(0.5, z.r * k), 0, TAU);
        g.fillStyle = 'rgba(150,30,90,0.35)'; g.fill('evenodd');
        g.strokeStyle = '#ff4f6d'; g.lineWidth = 2; g.beginPath(); g.arc(z.cx * k, z.cy * k, Math.max(0.5, z.r * k), 0, TAU); g.stroke();
    }
    g.font = `800 ${Math.max(11, Math.round(S / 50))}px Rajdhani, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom';
    const label = (t, x, y) => { g.strokeStyle = 'rgba(0,0,0,0.85)'; g.lineWidth = 3; g.strokeText(t, x, y); g.fillStyle = '#fff'; g.fillText(t, x, y); };
    if (G.revolution) for (const base of G.revolution.bases) {
        const r = base.rect, mine = base.team === p.team;
        g.fillStyle = base.fallen ? 'rgba(60,55,50,0.8)' : REVO.sides[base.team].flag;
        g.globalAlpha = 0.85; g.fillRect(r.x0 * k, r.y0 * k, (r.x1 - r.x0) * k, (r.y1 - r.y0) * k); g.globalAlpha = 1;
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(r.x0 * k, r.y0 * k, (r.x1 - r.x0) * k, (r.y1 - r.y0) * k);
        label(base.fallen ? 'FALLEN' : mine ? 'YOUR BASE' : 'ENEMY BASE', ((r.x0 + r.x1) / 2) * k, r.y0 * k - 2);
    }
    for (const n of G.world.nukes || []) {
        g.fillStyle = 'rgba(255,40,40,0.3)'; g.strokeStyle = '#ff3b3b'; g.lineWidth = 2;
        g.beginPath(); g.arc(n.x * k, n.y * k, NUKE.radius * k, 0, TAU); g.fill(); g.stroke();
    }
    if (G.war) { g.fillStyle = (TEAMS[p.team] || {}).color || '#5ee08a'; for (const f of G.fighters) if (!f.dead && f.team === p.team && f !== p) g.fillRect(f.x * k - 2, f.y * k - 2, 4, 4); }
    // you
    g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.arc(p.x * k, p.y * k, 5, 0, TAU); g.fill(); g.stroke();
    label('YOU', p.x * k, p.y * k - 7);
    // where it would come down
    const h = nukeMap.hover;
    if (h) {
        const x = h.x * k, y = h.y * k;
        g.setLineDash([6, 5]); g.strokeStyle = 'rgba(255,190,80,0.9)'; g.lineWidth = 1.5;
        g.beginPath(); g.arc(x, y, NUKE.shock * k, 0, TAU); g.stroke(); g.setLineDash([]);
        g.fillStyle = 'rgba(255,30,30,0.35)'; g.strokeStyle = '#ff2b2b'; g.lineWidth = 3;
        g.beginPath(); g.arc(x, y, NUKE.radius * k, 0, TAU); g.fill(); g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x + 14, y); g.moveTo(x, y - 14); g.lineTo(x, y + 14); g.stroke();
        g.beginPath(); g.arc(x, y, 6, 0, TAU); g.stroke();
        if (Math.hypot(p.x - h.x, p.y - h.y) < NUKE.radius) { g.font = `800 ${Math.max(13, Math.round(S / 34))}px Rajdhani, sans-serif`; g.fillStyle = '#ffd166'; g.textBaseline = 'top'; g.fillText("YOU'RE INSIDE THE BLAST!", S / 2, 8); }
    }
}
function nukeMapPoint(e) {
    const r = $('nm-canvas').getBoundingClientRect(), W = CONFIG.WORLD_SIZE;
    return { x: clamp((e.clientX - r.left) / r.width, 0, 1) * W, y: clamp((e.clientY - r.top) / r.height, 0, 1) * W };
}
function wireNukeMap() {
    const cv = $('nm-canvas');
    // (press to see where it lands, drag to move it, let go to fire; a mouse shows the circle as you hover)
    cv.addEventListener('pointerdown', e => { e.preventDefault(); nukeMap.held = true; nukeMap.hover = nukeMapPoint(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} drawNukeMap(); });
    cv.addEventListener('pointermove', e => { if (!nukeMap.open || (e.pointerType !== 'mouse' && !nukeMap.held)) return; nukeMap.hover = nukeMapPoint(e); drawNukeMap(); });
    cv.addEventListener('pointerup', e => { if (!nukeMap.held) return; nukeMap.held = false; closeNukeMap(nukeMapPoint(e)); });
    cv.addEventListener('pointercancel', () => { nukeMap.held = false; });
    cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !nukeMap.held) { nukeMap.hover = null; drawNukeMap(); } });
    $('nm-cancel').addEventListener('click', () => closeNukeMap(null));
    $('nuke-use').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); openNukeMap(); });
    window.addEventListener('resize', () => { if (nukeMap.open) drawNukeMap(); });
}

function updateNukes(dt) {
    const fo = G.world.fallout;
    if (fo && G.time < fo.until) {
        fo.tick -= dt;
        if (fo.tick <= 0) {
            fo.tick = 0.5;
            G.fgrid.query(fo.x, fo.y, fo.r, f => { if (!f.dead && Math.hypot(f.x - fo.x, f.y - fo.y) < fo.r) damage(f, 4, null, 'Radiation'); });
        }
        if (inView(fo.x, fo.y, fo.r) && Math.random() < dt * 30) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * fo.r; G.particles.push({ type: 'glow', x: fo.x + Math.cos(a) * d, y: fo.y + Math.sin(a) * d, vx: rand(-10, 10), vy: rand(-40, -15), life: 1.2, max: 1.2, size: rand(4, 8), color: '#8dff5a' }); }
    }
    updateStormField(dt);
    const list = G.world.nukes;
    if (!list || !list.length) return;
    for (const n of list) {
        n.t += dt;
        if (Math.floor(n.t) !== Math.floor(n.t - dt)) Sound.siren(Math.min(1, 0.4 + n.t / NUKE.delay));
        if (n.t >= NUKE.delay) { n.done = true; detonateNuke(n); }
    }
    G.world.nukes = list.filter(n => !n.done);
}

// Bots that see the warning run straight out of the circle (zombies are too far gone to care)
function fleeNuke(b) {
    if (b.zombie || !G.world.nukes || !G.world.nukes.length) return;
    for (const n of G.world.nukes) {
        const d = Math.hypot(b.x - n.x, b.y - n.y);
        if (d > NUKE.radius + 200) continue;
        const a = d > 1 ? Math.atan2(b.y - n.y, b.x - n.x) : rand(0, TAU);
        b.vx = Math.cos(a) * CONFIG.BOT_SPEED * 1.25;
        b.vy = Math.sin(a) * CONFIG.BOT_SPEED * 1.25;
        b.angle = a;
        return;
    }
}

function detonateNuke(n) {
    const { x, y, owner } = n, R = NUKE.radius, S = NUKE.shock;
    // Anyone inside is gone instantly; armor doesn't matter
    for (const f of [...G.fighters]) {
        if (f.dead) continue;
        const d = Math.hypot(f.x - x, f.y - y);
        if (d < R) {
            if (G.zombies && !f.zombie) f.zombie = true;  // vaporized, not infected
            f.vaporized = true;
            killFighter(f, owner && owner !== f ? owner : null, 'Nuke');
        } else if (d < S) {
            const k = 1 - (d - R) / (S - R), a = Math.atan2(f.y - y, f.x - x);
            f.kx += Math.cos(a) * 1400 * k;
            f.ky += Math.sin(a) * 1400 * k;
            damage(f, 160 * k, null, 'Nuke');
            if (f.hp <= 0 && !f.dead) killFighter(f, owner && owner !== f ? owner : null, 'Nuke');
        }
    }
    for (const a of G.animals) if (!a.dead && Math.hypot(a.x - x, a.y - y) < R) a.dead = true;
    // Vehicles driving through are destroyed
    if (G.traffic) for (const car of G.traffic) if (car.state === 'drive' && Math.hypot(car.x - x, car.y - y) < R) destroyVehicle(car, owner);
    // Flatten everything: trees, bushes, rocks, crates, cars and the walls of every house
    const gone = [];
    G.world.grid.query(x, y, R, o => {
        if (o.broken || o.vaporized) return;
        const d = Math.hypot(o.x - x, o.y - y);
        if (d < R) gone.push(o);
    });
    for (const o of gone) {
        o.vaporized = true;
        o.broken = true;
        if (o.type === 'tree' || o.type === 'bush' || o.type === 'rock') G.world.grid.remove(o);
        else G.world.grid.removeBox(o);
        if (o.type === 'tree') addDecal({ kind: 'stump', x: o.x, y: o.y, r: o.r, life: 400000 });
    }
    for (const b of G.world.buildings) {
        if (b.collapsed || b.hq || Math.hypot(b.cx - x, b.cy - y) > R) continue;
        b.collapsed = true;
        b.collapseAt = 0;
        G.world.stairs = G.world.stairs.filter(s => s.b !== b);
        for (let i = 0, m = Math.round((b.w * b.h) / 30000) + 3; i < m; i++) {
            const o = makeWreck(rand(b.x0 + 30, b.x1 - 30), rand(b.y0 + 30, b.y1 - 30));
            G.world.grid.insertBox(o);
            G.world.obstacles.push(o);
        }
    }
    // Loot, grenades and mines in the blast are destroyed too
    G.lootGrid.query(x, y, R, l => { if (Math.hypot(l.x - x, l.y - y) < R) l.gone = true; });
    G.grenades = G.grenades.filter(g => Math.hypot(g.x - x, g.y - y) > R);
    G.mines = G.mines.filter(m => Math.hypot(m.x - x, m.y - y) > R);
    // Scorched earth, and radioactive fallout that keeps hurting anyone who walks into it
    addDecal({ kind: 'crater', x, y, r: R, life: 600000, seed: randInt(1, 1e9) });
    G.world.fallout = { x, y, r: R * 0.55, until: G.time + 45000, tick: 0 };
    // The blast itself: white-out, fireball, a shock wave racing outward and the mushroom cloud
    G.flash = 1;
    G.flashColor = '255,250,235';
    G.nukeFx = G.nukeFx || [];
    G.nukeFx.push({ x, y, born: G.time });
    G.particles.push({ type: 'boom', x, y, vx: 0, vy: 0, life: 2.2, max: 2.2, size: R * 0.9 });
    G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 1.6, max: 1.6, size: S * 1.2, color: '#fff3d0' });
    G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 2.4, max: 2.4, size: S * 1.5, color: '#ffb347' });
    for (let i = 0; i < 160; i++) {
        const a = rand(0, TAU), d = rand(0.2, 1) * R;
        G.particles.push({ type: 'smoke', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * rand(300, 900), vy: Math.sin(a) * rand(300, 900), life: rand(4, 8), max: 8, size: rand(80, 200), color: '90,80,70' });
    }
    // The only thing in the game that shakes the screen, and it shakes it hard
    const camD = Math.hypot(x - G.cam.x, y - G.cam.y);
    G.quakeUntil = G.time + 5000;
    G.quakePower = clamp(1 - camD / 20000, 0.5, 1);
    G.shake = 60 * G.quakePower;
    Sound.tone(38, 4, 'sawtooth', 0.35, 18);
    Sound.noiseBurst(300, 3.5, 1);
    if (owner && owner.isPlayer && !owner.dead) showBanner('DOOMSDAY', true, 'Everything in the blast is gone.');
}

function drawNukeMarkers(now) {
    drawStormField(now);
    const fo = G.world.fallout;
    if (fo && G.time < fo.until && inView(fo.x, fo.y, fo.r)) {
        ctx.fillStyle = `rgba(120,255,80,${0.08 + Math.sin(now * 2) * 0.03})`;
        ctx.beginPath(); ctx.arc(fo.x, fo.y, fo.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(140,255,90,0.35)'; ctx.lineWidth = 6; ctx.setLineDash([30, 20]);
        ctx.beginPath(); ctx.arc(fo.x, fo.y, fo.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
    const list = G.world.nukes;
    if (!list) return;
    for (const n of list) {
        const left = Math.max(0, NUKE.delay - n.t), pulse = 0.5 + Math.sin(now * (4 + n.t)) * 0.5;
        ctx.fillStyle = `rgba(255,40,40,${0.06 + pulse * 0.08})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, NUKE.radius, 0, TAU); ctx.fill();
        ctx.save();
        ctx.setLineDash([90, 50]);
        ctx.lineDashOffset = -now * 80;
        ctx.strokeStyle = `rgba(255,60,60,${0.6 + pulse * 0.4})`;
        ctx.lineWidth = 24;
        ctx.beginPath(); ctx.arc(n.x, n.y, NUKE.radius, 0, TAU); ctx.stroke();
        ctx.restore();
        drawNukeIcon(ctx, n.x, n.y, 4);
        ctx.font = '700 160px "Black Ops One", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(20,6,6,0.85)';
        const txt = left.toFixed(1);
        ctx.strokeText(txt, n.x, n.y - 170); ctx.fillStyle = '#ff4040'; ctx.fillText(txt, n.x, n.y - 170);
    }
}

// The Electricity Missile: thrown like a strobe, it calls down a missile packed with charge. The blast itself is
// small; the electricity does the work: everyone near it is electrocuted and stunned, it arcs on from person to
// person, any vehicle it reaches shorts out and blows (passing the charge on), and the ground stays live for a bit
const EMISSILE = { radius: 360, blast: 170, damage: 150, stun: 4000, chain: 3, field: 12000, fieldR: 220, color: '#5ee8ff' };
function electricStrike(x, y, owner) {
    const R = EMISSILE.radius;
    blast(x, y, owner, EMISSILE.blast, 80, 'Electricity Missile');
    const sky = (hx, hy, life = 0.5, size = 4) => { if (inView(hx, hy, 200)) G.particles.push({ type: 'bolt', x: hx + rand(-60, 60), y: hy - rand(500, 800), x2: hx, y2: hy, vx: 0, vy: 0, life, max: life, size, seed: Math.random() }); };
    const hits = [];
    G.fgrid.query(x, y, R, f => { if (!f.dead && f !== owner && (!owner || foe(owner, f)) && Math.hypot(f.x - x, f.y - y) < R) hits.push(f); });
    for (const f of hits) {
        const k = 1 - Math.hypot(f.x - x, f.y - y) / R;
        G.particles.push({ type: 'bolt', x, y, x2: f.x, y2: f.y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 4, seed: Math.random() });
        f.shield = 0;
        f.stunUntil = Math.max(f.stunUntil || 0, G.time + EMISSILE.stun * (0.5 + k * 0.5));
        damage(f, EMISSILE.damage * (0.4 + k * 0.6), owner, 'Electricity Missile');
        if (!f.dead) chainLightning(f, owner, EMISSILE.chain, 40, 'Electricity Missile');
    }
    if (G.survival) for (const a of G.animals) if (!a.dead && Math.hypot(a.x - x, a.y - y) < R) damageAnimal(a, EMISSILE.damage, owner);
    // Vehicles short out and blow, and the charge jumps on to the next ones
    const seen = new Set();
    for (const c of [...(G.world.cars || [])]) if (!c.dead && Math.hypot(c.x - x, c.y - y) < R + vt(c).len * 0.4) surgeVehicle(c, owner, seen);
    if (!G.world.floor) {
        // Lightning into the buildings it hits: cracks, holes, sometimes the whole thing
        for (const b of G.world.buildings) {
            if (b.collapsed || b.hq) continue;
            const nx = clamp(x, b.x0, b.x1), ny = clamp(y, b.y0, b.y1);
            if (Math.hypot(nx - x, ny - y) < R) for (let i = 0; i < 3; i++) sky(rand(b.x0 + 20, b.x1 - 20), rand(b.y0 + 20, b.y1 - 20));
        }
        damageBuildings(x, y, R, 260);
        for (const m of G.mines) if (!m.triggerAt && Math.hypot(m.x - x, m.y - y) < R) triggerMine(m, rand(100, 600));
    }
    for (let i = 0; i < 6; i++) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * R; addDecal({ kind: 'scorch', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: rand(40, 90), life: 120000, tint: '0,180,255' }); }
    // The ground stays live for a few seconds
    G.world.storm = { x, y, r: EMISSILE.fieldR, sky: R, until: G.time + EMISSILE.field, tick: 0.3, born: G.time, owner };
    G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: R, color: EMISSILE.color });
    G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.9, max: 0.9, size: R * 1.3, color: '#e8fbff' });
    for (let i = 0; i < 10; i++) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * R; sky(x + Math.cos(a) * d, y + Math.sin(a) * d); }
    if (inView(x, y, R)) { burst(x, y, 40, EMISSILE.color, 420, 'glow'); G.flash = Math.max(G.flash, 0.4); G.flashColor = '120,235,255'; }
    Sound.tone(2000, 0.6, 'sawtooth', 0.2 * Sound.volAt(x, y), 150);
    Sound.boom(Sound.volAt(x, y), 1);
}

// The live ground left behind: arcs keep jumping to anyone inside, zapping and jolting them
function updateStormField(dt) {
    updateSurges();
    const st = G.world.storm;
    if (!st || G.time > st.until) return;
    st.tick -= dt;
    // Sky bolts keep coming down for the first few seconds
    if (G.time - st.born < 1500 && inView(st.x, st.y, st.sky) && Math.random() < dt * 12) {
        const a = rand(0, TAU), d = Math.sqrt(Math.random()) * st.sky, hx = st.x + Math.cos(a) * d, hy = st.y + Math.sin(a) * d;
        G.particles.push({ type: 'bolt', x: hx + rand(-60, 60), y: hy - rand(500, 900), x2: hx, y2: hy, vx: 0, vy: 0, life: 0.4, max: 0.4, size: rand(3, 6), seed: Math.random() });
    }
    if (st.tick > 0) return;
    st.tick = 0.5;
    for (const c of [...(G.world.cars || [])]) if (!c.dead && Math.hypot(c.x - st.x, c.y - st.y) < st.r && Math.random() < 0.3) surgeVehicle(c, st.owner);
    G.fgrid.query(st.x, st.y, st.r, f => {
        if (f.dead || Math.hypot(f.x - st.x, f.y - st.y) > st.r || Math.random() > 0.6) return;
        damage(f, 7, st.owner && st.owner !== f ? st.owner : null, 'Electricity');
        f.stunUntil = Math.max(f.stunUntil || 0, G.time + 250);
        if (inView(f.x, f.y, 100)) { const a = rand(0, TAU); G.particles.push({ type: 'bolt', x: f.x + Math.cos(a) * 90, y: f.y + Math.sin(a) * 90, x2: f.x, y2: f.y, vx: 0, vy: 0, life: 0.2, max: 0.2, size: 2, seed: Math.random() }); }
    });
}

function drawStormField(now) {
    const st = G.world.storm;
    if (!st || G.time > st.until || !inView(st.x, st.y, st.r)) return;
    const fade = Math.min(1, (st.until - G.time) / 5000), flick = 0.7 + Math.random() * 0.3;
    ctx.fillStyle = `rgba(80,220,255,${(0.07 + Math.sin(now * 9) * 0.02) * fade})`;
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(120,235,255,${0.45 * fade * flick})`; ctx.lineWidth = 6; ctx.setLineDash([24, 18]); ctx.lineDashOffset = now * 60;
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    // Little arcs crawling over the ground
    if (Math.random() < 0.6) {
        const a = rand(0, TAU), d = Math.sqrt(Math.random()) * st.r, hx = st.x + Math.cos(a) * d, hy = st.y + Math.sin(a) * d, b2 = rand(0, TAU);
        G.particles.push({ type: 'bolt', x: hx, y: hy, x2: hx + Math.cos(b2) * rand(40, 110), y2: hy + Math.sin(b2) * rand(40, 110), vx: 0, vy: 0, life: 0.15, max: 0.15, size: 2, seed: Math.random() });
    }
}

// Inventory icon: a little blue missile with a lightning bolt on it
function drawEmissileIcon(g, x, y, s) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.rotate(-Math.PI / 4);
    g.fillStyle = '#0b1a2a';
    g.beginPath(); g.moveTo(-5, 8); g.lineTo(-10, 14); g.lineTo(-5, 12); g.moveTo(5, 8); g.lineTo(10, 14); g.lineTo(5, 12); g.fill();
    roundRect(g, -5.5, -9, 11, 22, 4); g.fill();
    roundRect(g, -4.5, -8, 9, 20, 3); g.fillStyle = '#1f6fd1'; g.fill();
    g.fillStyle = '#5ee8ff'; g.beginPath(); g.moveTo(-4.5, -7); g.quadraticCurveTo(0, -16, 4.5, -7); g.closePath(); g.fill();
    g.fillStyle = '#fff7a8';
    g.beginPath(); g.moveTo(1.5, -5); g.lineTo(-3, 2); g.lineTo(0, 2); g.lineTo(-1.5, 9); g.lineTo(3, 1); g.lineTo(0, 1); g.closePath(); g.fill();
    g.restore();
}

// The mushroom cloud: a rising fireball that cools into a churning cap of smoke over the stem
function drawNukeClouds() {
    if (!G.nukeFx || !G.nukeFx.length) return;
    G.nukeFx = G.nukeFx.filter(fx => G.time - fx.born < 16000);
    for (const fx of G.nukeFx) {
        const t = (G.time - fx.born) / 1000, fade = Math.min(1, (16 - t) / 4);
        const C = NUKE.cloud, rise = Math.min(1, t / 6), cx = fx.x, cy = fx.y - rise * 260 * C;
        const heat = Math.max(0, 1 - t / 5);
        ctx.save();
        ctx.globalAlpha = fade;
        // Stem
        const sg = ctx.createLinearGradient(cx, fx.y, cx, cy);
        sg.addColorStop(0, `rgba(80,70,60,0.6)`); sg.addColorStop(1, `rgba(${110 + heat * 140},${80 + heat * 60},60,0.75)`);
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.ellipse(cx, (fx.y + cy) / 2, (90 + rise * 40) * C, (fx.y - cy) / 2 + 60 * C, 0, 0, TAU); ctx.fill();
        // Cap
        const R = (280 + rise * 380) * C;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        cg.addColorStop(0, `rgba(255,${200 + heat * 55},${120 + heat * 100},${0.4 + heat * 0.6})`);
        cg.addColorStop(0.35, `rgba(${200 + heat * 55},${90 + heat * 60},40,0.8)`);
        cg.addColorStop(0.75, 'rgba(90,72,60,0.75)');
        cg.addColorStop(1, 'rgba(70,60,55,0)');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
        // Rolling billows round the rim
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * TAU + t * 0.15, bx = cx + Math.cos(a) * R * 0.72, by = cy + Math.sin(a) * R * 0.6;
            ctx.fillStyle = `rgba(${95 + heat * 120},${80 + heat * 40},65,0.55)`;
            ctx.beginPath(); ctx.arc(bx, by, R * 0.28, 0, TAU); ctx.fill();
        }
        ctx.restore();
    }
}

// Inventory icon: a yellow canister with the radiation sign
function drawNukeIcon(g, x, y, s) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    roundRect(g, -9, -12, 18, 24, 5); g.fillStyle = '#2a2414'; g.fill();
    roundRect(g, -7.5, -10.5, 15, 21, 4); g.fillStyle = '#f2c230'; g.fill();
    g.fillStyle = '#1d1a10';
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i / 3) * TAU; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 6.5, a - 0.5, a + 0.5); g.closePath(); g.fill(); }
    g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, 2.2, 0, TAU); g.fill();
    g.fillStyle = '#1d1a10'; g.beginPath(); g.arc(0, 0, 1.4, 0, TAU); g.fill();
    g.fillStyle = '#c23b2b'; g.fillRect(-4, -14, 8, 3);
    g.restore();
}

// ---------- Rusty: an abandoned facility after the war moved through ----------
// Knock the place about before anyone arrives: ruined buildings, shell-damaged roofs, craters and fires still smoking
function ruinWorld() {
    const W = CONFIG.WORLD_SIZE;
    for (const b of G.world.buildings) {
        if (b.kind !== 'hotel' && Math.random() < 0.14) { collapseBuilding(b, true); continue; }
        for (let i = randInt(0, 3); i > 0; i--) {
            const k = rand(0.04, 0.3);
            addImpact(b, rand(b.x0 + 30, b.x1 - 30), rand(b.y0 + 30, b.y1 - 30), k);
            b.hp -= k * b.maxHp * 0.6;
        }
        b.hp = Math.max(b.maxHp * 0.25, b.hp);
    }
    for (let i = 0; i < 90 * MAP_AREA; i++) addDecal({ kind: 'scorch', x: rand(150, W - 150), y: rand(150, W - 150), r: rand(50, 150), life: 1e12 });
    G.world.smokers = Array.from({ length: Math.round(26 * MAP_AREA) }, () => ({ x: rand(200, W - 200), y: rand(200, W - 200) }));
}

// Grime streaks and rust stains over a roof
function drawGrime(b, x, y, w, h) {
    const rnd = seededRand(b.seed || b.id + 1);
    for (let i = 0; i < 9; i++) {
        const gx = x + rnd() * w, gy = y + rnd() * h, r = 20 + rnd() * 60;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
        g.addColorStop(0, i % 3 ? 'rgba(60,40,25,0.35)' : 'rgba(140,70,30,0.3)'); g.addColorStop(1, 'rgba(60,40,25,0)');
        ctx.fillStyle = g;
        ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
    }
}

// Corrugated metal shed roof, rusted through in places
function drawRustShedRoof(b, x, y, w, h) {
    const rnd = seededRand(b.seed || b.id + 1), wide = w >= h;
    ctx.fillStyle = b.roofDark; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = b.roof; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let t = 0; t < (wide ? w : h); t += 12) wide ? ctx.fillRect(x + t, y, 5, h) : ctx.fillRect(x, y + t, w, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let t = 6; t < (wide ? w : h); t += 12) wide ? ctx.fillRect(x + t, y, 2, h) : ctx.fillRect(x, y + t, w, 2);
    drawGrime(b, x, y, w, h);
    // Missing and bent sheets you can see the dark through
    for (let i = 0; i < 3; i++) {
        const hw = 18 + rnd() * 40, hh = 14 + rnd() * 26, hx = x + 20 + rnd() * (w - 40 - hw), hy = y + 20 + rnd() * (h - 40 - hh);
        ctx.fillStyle = '#1a1512'; ctx.fillRect(hx, hy, hw, hh);
        ctx.fillStyle = shade(b.roof, -0.25); ctx.fillRect(hx - 3, hy - 3, hw + 6, 3);
    }
}

// Factory: sawtooth roof with smashed skylights and a sooty chimney stack
function drawFactoryRoof(b, x, y, w, h) {
    const rnd = seededRand(b.seed || b.id + 1);
    ctx.fillStyle = b.roofDark; ctx.fillRect(x, y, w, h);
    for (let yy = y + 6, i = 0; yy < y + h - 30; yy += 46, i++) {
        ctx.fillStyle = b.roof; ctx.fillRect(x + 6, yy, w - 12, 30);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 6, yy + 24, w - 12, 6);
        // Skylight strip, mostly broken
        for (let xx = x + 14; xx < x + w - 34; xx += 30) {
            ctx.fillStyle = rnd() < 0.55 ? '#16130f' : 'rgba(150,180,170,0.45)';
            ctx.fillRect(xx, yy + 30, 24, 12);
        }
    }
    drawGrime(b, x, y, w, h);
    const cx = x + w * 0.8, cy = y + h * 0.25;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(cx + 10, cy + 14, 30, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a4a32'; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0f0c0a'; ctx.beginPath(); ctx.arc(cx, cy, 17, 0, TAU); ctx.fill();
    if (Math.random() < 0.15) G.particles.push({ type: 'smoke', x: cx, y: cy, vx: rand(-10, 20), vy: rand(-50, -25), life: 3, max: 3, size: rand(14, 24), color: '40,38,40' });
}

// Abandoned car: rust-eaten paint, glass long gone
function drawRustCar(o, x, y, w, h) {
    const rnd = seededRand(o.seed || 1);
    ctx.fillStyle = '#231c17';
    roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 9); ctx.fill();
    ctx.fillStyle = o.color;
    roundRect(ctx, x, y, w, h, 8); ctx.fill();
    for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(150,70,25,0.6)' : 'rgba(90,45,20,0.6)';
        ctx.beginPath(); ctx.arc(x + rnd() * w, y + rnd() * h, 3 + rnd() * 7, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#120f0d';
    if (o.horiz) { ctx.fillRect(x + w * 0.24, y + 4, w * 0.16, h - 8); ctx.fillRect(x + w * 0.66, y + 5, w * 0.12, h - 10); }
    else { ctx.fillRect(x + 4, y + h * 0.24, w - 8, h * 0.16); ctx.fillRect(x + 5, y + h * 0.66, w - 10, h * 0.12); }
    // One wheel gone: the car sags onto a corner
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(o.horiz ? x + (rnd() < 0.5 ? 0 : w * 0.7) : x, o.horiz ? y : y + (rnd() < 0.5 ? 0 : h * 0.7), o.horiz ? w * 0.3 : w, o.horiz ? h : h * 0.3);
}

function drawBarrel(o) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(o.x + 3, o.y + 5, o.hw, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(o.color, -0.4); ctx.beginPath(); ctx.arc(o.x, o.y, o.hw + 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = o.color; ctx.beginPath(); ctx.arc(o.x, o.y, o.hw, 0, TAU); ctx.fill();
    ctx.strokeStyle = shade(o.color, -0.3); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(o.x, o.y, o.hw * 0.65, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(140,70,30,0.55)'; ctx.beginPath(); ctx.arc(o.x - 4, o.y + 3, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1612'; ctx.beginPath(); ctx.arc(o.x + 4, o.y - 4, 2.5, 0, TAU); ctx.fill();
}

// Shipping container: ribbed steel with rust bleeding down
function drawContainer(o, x, y, w, h) {
    ctx.fillStyle = shade(o.color, -0.45); ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = o.color; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    if (w > h) for (let xx = x + 4; xx < x + w; xx += 8) ctx.fillRect(xx, y, 3, h);
    else for (let yy = y + 4; yy < y + h; yy += 8) ctx.fillRect(x, yy, w, 3);
    ctx.fillStyle = 'rgba(110,55,20,0.45)';
    ctx.fillRect(x + w * 0.3, y, w * 0.12, h); ctx.fillRect(x + w * 0.72, y, w * 0.08, h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, y, w, 3);
}

// Fort Wars walls: planks nailed side by side along the wall, darker where they've been hit
function drawPlankWall(o, x, y, w, h) {
    const horiz = w > h, long = horiz ? w : h, thick = horiz ? h : w, n = Math.max(2, Math.round(thick / 8)), rnd = seededRand(o.seed || 1);
    ctx.fillStyle = '#3e2512'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    const hurt = o.maxHp ? 1 - o.hp / o.maxHp : 0;
    for (let i = 0; i < n; i++) {
        const a = thick * i / n + 0.6, b = thick / n - 1.2;
        ctx.fillStyle = shade(pick2(rnd, ['#8a5a32', '#9c6a3c', '#7d5029', '#a8743f']), -hurt * 0.35);
        if (horiz) ctx.fillRect(x + 1, y + a, w - 2, b); else ctx.fillRect(x + a, y + 1, b, h - 2);
        // grain
        ctx.fillStyle = 'rgba(60,32,14,0.35)';
        const g = a + b * (0.3 + rnd() * 0.4);
        if (horiz) ctx.fillRect(x + 4 + rnd() * 10, y + g, long * (0.4 + rnd() * 0.4), 1); else ctx.fillRect(x + g, y + 4 + rnd() * 10, 1, long * (0.4 + rnd() * 0.4));
    }
    // cross battens with nails
    ctx.fillStyle = '#5e3a1e';
    for (let k = 1; k < Math.max(2, Math.round(long / 26)); k++) {
        const c = long * k / Math.max(2, Math.round(long / 26));
        if (horiz) ctx.fillRect(x + c - 2.5, y, 5, h); else ctx.fillRect(x, y + c - 2.5, w, 5);
        ctx.fillStyle = '#c9c4b8';
        if (horiz) { ctx.fillRect(x + c - 1, y + 3, 2, 2); ctx.fillRect(x + c - 1, y + h - 5, 2, 2); } else { ctx.fillRect(x + 3, y + c - 1, 2, 2); ctx.fillRect(x + w - 5, y + c - 1, 2, 2); }
        ctx.fillStyle = '#5e3a1e';
    }
    ctx.fillStyle = 'rgba(255,230,190,0.14)';
    if (horiz) ctx.fillRect(x, y, w, 2); else ctx.fillRect(x, y, 2, h);
}
const pick2 = (rnd, a) => a[Math.floor(rnd() * a.length)];

function drawSandbagWall(o, x, y, w, h) {
    const horiz = w > h, n = Math.max(2, Math.round((horiz ? w : h) / 22));
    for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, bx = horiz ? x + w * t : x + w / 2, by = horiz ? y + h / 2 : y + h * t;
        ctx.fillStyle = '#5e5238'; ctx.beginPath(); ctx.ellipse(bx, by, horiz ? 13 : w / 2 + 1, horiz ? h / 2 + 1 : 13, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = i % 2 ? '#9a8a64' : '#8d7d5a'; ctx.beginPath(); ctx.ellipse(bx, by, horiz ? 11 : w / 2 - 1, horiz ? h / 2 - 1 : 11, 0, 0, TAU); ctx.fill();
    }
}

// ---------- Survival: hunt to eat, and everyone else is hunting you ----------
// Hunger drains all the time; at zero you starve. Animals roam the map and drop meat; wolves come out at night.
const HUNGER = { drain: 0.6, starve: 2.5, warn: 25 };
const ANIMALS = {
    deer: { name: 'Deer', hp: 60, r: 16, walk: 70, run: 330, meat: 2, shy: 380, color: '#9a6b3f', weight: 4, bite: 10, aggro: 160 },  // only stags (with antlers) charge
    rabbit: { name: 'Rabbit', hp: 15, r: 8, walk: 50, run: 360, meat: 1, shy: 260, color: '#a99a84', weight: 4 },
    boar: { name: 'Boar', hp: 130, r: 17, walk: 55, run: 290, meat: 3, shy: 0, color: '#4f4034', weight: 2, bite: 14, aggro: 260 },
    bear: { name: 'Bear', hp: 320, r: 25, walk: 50, run: 300, meat: 5, shy: 0, color: '#5a3e2b', weight: 0.8, bite: 19, aggro: 380 },
    wolf: { name: 'Wolf', hp: 70, r: 15, walk: 80, run: 340, meat: 2, shy: 0, color: '#7d7f86', weight: 0, bite: 11, hunter: true, aggro: 900 }
};
const ANIMAL_TABLE = Object.entries(ANIMALS).filter(([, a]) => a.weight).map(([k, a]) => [k, a.weight]);

function animalTarget() { return Math.round(clamp(40 + G.cpuCount * 0.4, 40, 160) * MAP_AREA); }

function addAnimal(kind, x, y) {
    const A = ANIMALS[kind];
    const a = { animal: true, kind, name: A.name, team: 'animal', x, y, vx: 0, vy: 0, r: A.r, hp: A.hp, maxHp: A.hp, armor: 0, dead: false, hidden: false,
        heading: rand(0, TAU), mode: 'walk', timer: rand(1, 4), step: 0, hitAt: -9999, lastShot: -9999, lastHurt: -9999, kills: 0, biteAt: 0, angryUntil: 0, foe: null,
        buck: kind === 'deer' && Math.random() < 0.4, color: A.color };
    G.animals.push(a);
    return a;
}

// Somewhere off-screen and out in the open
function animalSpot() {
    for (let i = 0; i < 20; i++) {
        const s = findSpawn(null, 0);
        if (!inView(s.x, s.y, 300) && !buildingAt(s.x, s.y)) return s;
    }
    return null;
}

function spawnAnimals() {
    G.animals = [];
    const n = animalTarget();
    for (let i = 0; i < n; i++) {
        const s = findSpawn(null, 0);
        if (buildingAt(s.x, s.y)) continue;
        const kind = weightedPick(ANIMAL_TABLE);
        addAnimal(kind, s.x, s.y);
        // Rabbits and deer like company
        if (kind !== 'boar' && Math.random() < 0.5) addAnimal(kind, s.x + rand(-60, 60), s.y + rand(-60, 60));
    }
    G.nextAnimal = 0;
}

function updateAnimals(dt) {
    const W = CONFIG.WORLD_SIZE;
    G.agrid.reset();
    for (const a of G.animals) if (!a.dead) G.agrid.insert(a);
    // Keep the wild stocked; at night wolf packs come out
    if (G.time >= G.nextAnimal) {
        G.nextAnimal = G.time + 4000;
        const alive = G.animals.filter(a => !a.dead);
        const night = darkness() > DAY.dark * 0.5, wolves = alive.filter(a => a.kind === 'wolf').length;
        if (alive.length - wolves < animalTarget()) { const s = animalSpot(); if (s) addAnimal(weightedPick(ANIMAL_TABLE), s.x, s.y); }
        if (wolves < (night ? 4 + Math.round(G.cpuCount / 25) : 3)) { const s = animalSpot(); if (s) for (let i = randInt(3, 4); i > 0; i--) addAnimal('wolf', s.x + rand(-50, 50), s.y + rand(-50, 50)); }
        G.animals = G.animals.filter(a => !a.dead);
    }
    for (const a of G.animals) {
        if (a.dead) continue;
        const A = ANIMALS[a.kind];
        a.timer -= dt;
        // Who's close?
        let near = null, nd = Infinity;
        const bites = A.bite && (a.kind !== 'deer' || a.buck);
        const look = Math.max(A.shy, bites ? Math.max(A.aggro, 500) : 0);
        if (look) G.fgrid.query(a.x, a.y, look, f => {
            if (f.dead) return;
            const d = Math.hypot(f.x - a.x, f.y - a.y);
            if (d < nd) { nd = d; near = f; }
        });
        let speed = A.walk;
        const angry = A.hunter || G.time < a.angryUntil || (bites && nd < A.aggro);
        if (bites && angry && near && nd < look) {
            // Boars charge whoever's close (or whoever hurt them); wolves hunt anyone they find
            const t = a.foe && !a.foe.dead && Math.hypot(a.foe.x - a.x, a.foe.y - a.y) < 700 ? a.foe : near;
            const d = Math.hypot(t.x - a.x, t.y - a.y);
            a.heading = Math.atan2(t.y - a.y, t.x - a.x);
            speed = A.run;
            a.mode = 'attack';
            if (d < a.r + t.r + 6) {
                speed = 0;
                if (G.time >= a.biteAt) {
                    a.biteAt = G.time + 850;
                    damage(t, A.bite, a, A.name);
                    if (!(t.armor > 0)) bloodSplat(t.x, t.y, a.heading, 0.7);
                    burst(t.x, t.y, 5, '#a3121e', 120, 'blood');
                }
            }
        } else if (A.shy && near && nd < A.shy) {
            a.heading = Math.atan2(a.y - near.y, a.x - near.x) + rand(-0.3, 0.3);
            a.mode = 'flee';
            a.timer = rand(1.5, 3);
            speed = A.run;
        } else if (a.mode === 'flee' && a.timer > 0) {
            speed = A.run;
        } else if (a.timer <= 0) {
            // Wander a while, then stop to graze
            a.mode = a.mode === 'graze' ? 'walk' : Math.random() < 0.5 ? 'graze' : 'walk';
            a.timer = rand(1.5, 5);
            if (a.mode === 'walk') a.heading += rand(-1.2, 1.2);
        }
        if (a.mode === 'graze') speed = 0;
        const nx = a.x + Math.cos(a.heading) * speed * dt, ny = a.y + Math.sin(a.heading) * speed * dt;
        if (speed && (blockedAt(G.world.grid, nx, ny, a.r) || nx < 60 || ny < 60 || nx > W - 60 || ny > W - 60)) a.heading += (Math.random() < 0.5 ? 1 : -1) * rand(0.8, 2);
        else { a.x = nx; a.y = ny; }
        a.vx = Math.cos(a.heading) * speed; a.vy = Math.sin(a.heading) * speed;
        a.step += speed * dt * 0.08;
    }
}

function damageAnimal(a, amount, attacker) {
    if (a.dead) return;
    a.hp -= amount;
    a.hitAt = G.time;
    a.lastHurt = G.time;
    burst(a.x, a.y, 5, '#a3121e', 140, 'blood');
    bloodSplat(a.x, a.y, rand(0, TAU), 0.7);
    if (attacker && attacker.isPlayer) G.hitMarker = 1;
    const A = ANIMALS[a.kind];
    if (A.bite && (a.kind !== 'deer' || a.buck)) { a.angryUntil = G.time + 8000; a.foe = attacker && !attacker.animal ? attacker : a.foe; }
    else if (attacker) { a.heading = Math.atan2(a.y - attacker.y, a.x - attacker.x); a.mode = 'flee'; a.timer = 3; }
    if (a.hp <= 0) killAnimal(a, attacker);
}

function killAnimal(a, by) {
    a.dead = true;
    const A = ANIMALS[a.kind];
    addDecal({ kind: 'pool', x: a.x, y: a.y, r: a.r * 1.6, life: 60000 });
    dropItems(a.x, a.y, Array.from({ length: A.meat }, () => 'meat'), 0.6);
    if (by && by.isPlayer) addFloat(a.x, a.y - 30, `${A.name} +${A.meat} meat`, '#ffb36b');
    Sound.tone(220, 0.12, 'triangle', 0.1 * Sound.volAt(a.x, a.y), 120);
}

// Closest animal a bot can see (hungry bots go hunting)
function nearestAnimal(b, range) {
    let best = null, bd = range;
    G.agrid.query(b.x, b.y, range, a => {
        if (a.dead) return;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < bd && lineOfSight(b, a)) { bd = d; best = a; }
    });
    return best;
}

function updateHunger(f, dt) {
    if (f.hunger === undefined) f.hunger = 100;
    f.hunger = Math.max(0, f.hunger - HUNGER.drain * dt);
    if (f.hunger > 0) return;
    f.hp -= HUNGER.starve * dt;
    if (f.isPlayer) G.hurt = Math.max(G.hurt, 0.2);
    if (f.hp <= 0) killFighter(f, null, 'starved');
}

function drawAnimals(L, T, R, B) {
    const night = darkness() > 0.2;
    for (const a of G.animals) {
        if (a.dead || a.x < L - 60 || a.x > R + 60 || a.y < T - 60 || a.y > B + 60) continue;
        const r = a.r, leg = Math.sin(a.step) * r * 0.35;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(3, 5, r * 1.3, r * 0.75, a.heading, 0, TAU); ctx.fill();
        ctx.rotate(a.heading);
        const dark = shade(a.color, -0.35);
        // Legs
        ctx.fillStyle = dark;
        if (a.kind !== 'rabbit') for (const [lx, ly] of [[r * 0.7 + leg, -r * 0.5], [r * 0.7 - leg, r * 0.5], [-r * 0.7 - leg, -r * 0.5], [-r * 0.7 + leg, r * 0.5]]) { ctx.beginPath(); ctx.ellipse(lx, ly, r * 0.22, r * 0.14, 0, 0, TAU); ctx.fill(); }
        // Tail
        if (a.kind === 'wolf') { ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(-r * 1.55, 0, r * 0.6, r * 0.22, 0, 0, TAU); ctx.fill(); }
        // Body
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.25 + 1.5, r * 0.7 + 1.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = a.color;
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.25, r * 0.7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.ellipse(-r * 0.1, -r * 0.2, r * 0.8, r * 0.3, 0, 0, TAU); ctx.fill();
        if (a.kind === 'deer' || a.kind === 'rabbit') { ctx.fillStyle = '#f2ece2'; ctx.beginPath(); ctx.arc(-r * 1.2, 0, r * 0.22, 0, TAU); ctx.fill(); }
        if (a.kind === 'boar') { ctx.strokeStyle = 'rgba(20,14,10,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(-r * 0.6 + i * 4, -r * 0.55); ctx.lineTo(-r * 0.5 + i * 4, -r * 0.2); } ctx.stroke(); }
        // Head
        const hx = r * 1.3, hr = a.kind === 'rabbit' ? r * 0.55 : r * 0.5;
        ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(hx, 0, hr * 1.3 + 1.2, hr + 1.2, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = a.color; ctx.beginPath(); ctx.ellipse(hx, 0, hr * 1.3, hr, 0, 0, TAU); ctx.fill();
        if (a.kind === 'rabbit') { ctx.fillStyle = a.color; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx - hr * 1.2, s * hr * 0.45, hr * 1.1, hr * 0.32, s * 0.2, 0, TAU); ctx.fill(); } }
        if (a.kind === 'deer') {
            ctx.fillStyle = dark; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx - hr * 0.6, s * hr, hr * 0.5, hr * 0.25, s * 0.5, 0, TAU); ctx.fill(); }
            if (a.buck) { ctx.strokeStyle = '#d8c7a4'; ctx.lineWidth = 2; ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(hx - 2, s * 3); ctx.lineTo(hx - hr, s * hr * 2); ctx.lineTo(hx - hr * 1.8, s * hr * 2.2); ctx.moveTo(hx - hr * 0.6, s * hr * 1.4); ctx.lineTo(hx - hr * 0.2, s * hr * 2.1); } ctx.stroke(); }
        }
        if (a.kind === 'bear') { ctx.fillStyle = dark; for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.arc(hx - hr * 0.3, s2 * hr * 0.85, hr * 0.38, 0, TAU); ctx.fill(); } ctx.fillStyle = '#9a7a5a'; ctx.beginPath(); ctx.ellipse(hx + hr * 0.75, 0, hr * 0.55, hr * 0.45, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(hx + hr * 1.1, 0, hr * 0.18, 0, TAU); ctx.fill(); }
        if (a.kind === 'boar') { ctx.fillStyle = '#c99a8a'; ctx.beginPath(); ctx.arc(hx + hr * 1.2, 0, hr * 0.45, 0, TAU); ctx.fill(); ctx.fillStyle = '#f4efe4'; for (const s of [-1, 1]) ctx.fillRect(hx + hr * 0.6, s * hr * 0.75 - 1, hr * 0.8, 2); }
        if (a.kind === 'wolf') {
            ctx.fillStyle = a.color; ctx.beginPath(); ctx.moveTo(hx + hr * 1.7, 0); ctx.lineTo(hx + hr * 0.6, -hr * 0.6); ctx.lineTo(hx + hr * 0.6, hr * 0.6); ctx.fill();
            ctx.fillStyle = dark; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx - hr * 0.4, s * hr * 0.4); ctx.lineTo(hx - hr * 1.1, s * hr * 1.1); ctx.lineTo(hx - hr * 0.1, s * hr * 0.95); ctx.fill(); }
            ctx.fillStyle = night ? '#ffe14a' : '#2a2a2a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + hr * 0.5, s * hr * 0.4, night ? 2.6 : 1.6, 0, TAU); ctx.fill(); }
        } else { ctx.fillStyle = '#151210'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + hr * 0.5, s * hr * 0.5, 1.5, 0, TAU); ctx.fill(); } }
        ctx.restore();
        drawPlantHealth(a, a.y - r - 14);
    }
}

// Loot icon for a bucket, empty or full of water
function drawBucketIcon(g, full) {
    g.fillStyle = '#5a6068';
    g.beginPath(); g.moveTo(-13, -10); g.lineTo(13, -10); g.lineTo(9, 13); g.lineTo(-9, 13); g.closePath(); g.fill();
    g.fillStyle = '#9aa3ae';
    g.beginPath(); g.moveTo(-11, -8); g.lineTo(11, -8); g.lineTo(8, 11); g.lineTo(-8, 11); g.closePath(); g.fill();
    g.fillStyle = full ? '#3f9be0' : '#3a3f46'; g.beginPath(); g.ellipse(0, -8, 11, 4, 0, 0, TAU); g.fill();
    if (full) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-3, -9, 4, 1.2, 0, 0, TAU); g.fill(); }
    g.strokeStyle = '#3a3f46'; g.lineWidth = 2; g.beginPath(); g.arc(0, -8, 14, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
}

// Loot icon for meat: a joint on the bone
function drawMeatIcon(g, s = 1) {
    g.save();
    g.scale(s, s);
    g.rotate(-0.6);
    g.fillStyle = '#f2ece0'; roundRect(g, 4, -2.5, 14, 5, 2.5); g.fill();
    g.beginPath(); g.arc(18, -3, 3.5, 0, TAU); g.arc(18, 3, 3.5, 0, TAU); g.fill();
    g.fillStyle = '#6a2418'; g.beginPath(); g.ellipse(-4, 0, 13, 10, 0, 0, TAU); g.fill();
    g.fillStyle = '#b8483a'; g.beginPath(); g.ellipse(-5, -1, 11, 8, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,220,200,0.35)'; g.beginPath(); g.ellipse(-8, -4, 5, 2.5, -0.3, 0, TAU); g.fill();
    g.restore();
}

// ----- Survival, part two: thirst, rest, ponds and buckets, and the countdown start -----
const THIRST = { drain: 0.85, die: 3, warn: 25, drink: 40 };
const ENERGY = { drain: 0.3, rest: 8, indoors: 2, tired: 25 };
const START = { countdown: 10000 };

// Lakes and ponds to drink from (flooded craters on the rusty map, ponds in the city parks)
function makePonds() {
    const W = CONFIG.WORLD_SIZE, ponds = [], parks = G.world.city ? G.world.city.parks : [];
    for (let i = 0, tries = 0; i < 12 * MAP_AREA && tries < 400; tries++) {
        let x, y, rx, ry;
        if (parks.length && i < parks.length && Math.random() < 0.7) {
            const pk = pick(parks);
            x = (pk.x0 + pk.x1) / 2; y = (pk.y0 + pk.y1) / 2;
            rx = (pk.x1 - pk.x0) * rand(0.2, 0.32); ry = (pk.y1 - pk.y0) * rand(0.18, 0.28);
        } else {
            x = rand(400, W - 400); y = rand(400, W - 400);
            rx = rand(110, 240); ry = rand(80, 170);
        }
        if (ponds.some(p => Math.hypot(p.x - x, p.y - y) < 600)) continue;
        if (G.world.buildings.some(b => x + rx + 40 > b.x0 && x - rx - 40 < b.x1 && y + ry + 40 > b.y0 && y - ry - 40 < b.y1)) continue;
        const pond = { x, y, rx, ry, a: rand(-0.4, 0.4), seed: randInt(1, 1e9), muddy: !!G.world.rusty };
        // Clear anything standing in the water
        const gone = [];
        G.world.grid.query(x, y, Math.max(rx, ry) + 20, o => { if (o.type !== 'wall' && inPond(o, pond, 20)) gone.push(o); });
        for (const o of gone) { o.broken = true; o.type === 'tree' || o.type === 'bush' || o.type === 'rock' ? G.world.grid.remove(o) : G.world.grid.removeBox(o); }
        ponds.push(pond);
        i++;
    }
    G.world.ponds = ponds;
}

function inPond(f, pond, pad = 0) {
    const ponds = pond ? [pond] : G.world.ponds || [];
    for (const p of ponds) {
        const c = Math.cos(-p.a), s = Math.sin(-p.a), dx = f.x - p.x, dy = f.y - p.y;
        const lx = dx * c - dy * s, ly = dx * s + dy * c;
        if ((lx / (p.rx + pad)) ** 2 + (ly / (p.ry + pad)) ** 2 < 1) return p;
    }
    return null;
}

function nearestPond(f) {
    let best = null, bd = Infinity;
    for (const p of G.world.ponds || []) { const d = Math.hypot(p.x - f.x, p.y - f.y); if (d < bd) { bd = d; best = p; } }
    return best;
}

// Scoop up water: drink your fill and fill every empty bucket you carry
function drinkFromPond(f) {
    if (G.time - (f.drankAt || 0) < 800) return false;
    f.drankAt = G.time;
    f.thirst = Math.min(100, f.thirst + THIRST.drink);
    const n = Math.min(f.items.bucket, carryLimit(f, 'water') - f.items.water);
    if (n > 0) { f.items.bucket -= n; f.items.water += n; }
    if (f.isPlayer) { addFloat(f.x, f.y - 34, n > 0 ? `Drank · filled ${n} bucket${n > 1 ? 's' : ''}` : 'Drank', '#7cc8ff'); Sound.tone(500, 0.12, 'sine', 0.1, 300); }
    if (inView(f.x, f.y, 50)) for (let i = 0; i < 6; i++) G.particles.push({ type: 'glow', x: f.x + rand(-14, 14), y: f.y + rand(-14, 14), vx: rand(-30, 30), vy: rand(-60, -20), life: 0.4, max: 0.4, size: 3, color: '#9fd8ff' });
    return true;
}

function playerDrink(p) {
    if (inPond(p)) drinkFromPond(p);
    else if (p.items.water > 0) startHeal(p, 'water');
    else { addFloat(p.x, p.y - 34, p.items.bucket ? 'Fill your bucket at a pond' : 'No water: find a pond', '#7cc8ff'); Sound.empty(); }
}

function toggleRest(p) {
    if (p.resting) { p.resting = false; return; }
    if (p.energy >= 99) { addFloat(p.x, p.y - 34, 'Not tired', '#c9a7ff'); return; }
    p.resting = true;
    if (p.healing) cancelHeal(p);
    addFloat(p.x, p.y - 34, 'Resting...', '#c9a7ff');
}

// Thirst, tiredness and the weather, for everyone, every frame
function updateNeeds(f, dt) {
    if (f.thirst === undefined) { f.thirst = 100; f.energy = 100; }
    f.thirst = Math.max(0, f.thirst - THIRST.drain * dt);
    if (f.thirst <= 0) {
        f.hp -= THIRST.die * dt;
        if (f.isPlayer) G.hurt = Math.max(G.hurt, 0.2);
        if (f.hp <= 0) { killFighter(f, null, 'dehydrated'); return; }
    }
    if (f.resting) {
        // Indoors (or upstairs) you rest twice as well
        const under = G.world.floor || buildingAt(f.x, f.y);
        f.energy = Math.min(100, f.energy + ENERGY.rest * (under ? ENERGY.indoors : 1) * dt);
        f.hp = Math.min(f.maxHp || CONFIG.MAX_HEALTH, f.hp + dt);
        if (f.energy >= 100) { f.resting = false; if (f.isPlayer) addFloat(f.x, f.y - 34, 'Rested', '#c9a7ff'); }
    } else {
        f.energy = Math.max(0, f.energy - ENERGY.drain * dt);
    }
}

// Survival reminders: when hunger, thirst, energy or health runs low you're told, with what to do about it.
// Once when it first gets low, again when it gets serious (and when it hits zero), and every 25 seconds while it stays low
const REMIND = { every: 25000, gap: 4000, health: 35 };
function survivalReminders() {
    const p = G.player, R = G.reminders || (G.reminders = {}), now = G.time;
    const needs = [
        ['hunger', p.hunger, HUNGER.warn, p.hunger <= 0 ? 'STARVING!' : 'YOU ARE HUNGRY',
            p.items.meat > 0 ? 'Press C to eat your meat' : 'Hunt animals for meat, then press C to eat it'],
        ['thirst', p.thirst, THIRST.warn, p.thirst <= 0 ? 'DYING OF THIRST!' : 'YOU ARE THIRSTY',
            p.items.water > 0 ? 'Press V to drink from your bucket' : 'Find a pond and press V to drink (it fills empty buckets too)'],
        ['energy', p.energy, ENERGY.tired, p.energy <= 0 ? 'EXHAUSTED!' : 'YOU ARE TIRED',
            'Press B to rest. Resting indoors is twice as fast'],
        ['health', (p.hp / p.maxHp) * 100, REMIND.health, 'LOW HEALTH',
            p.items.medkit > 0 ? 'Press E to use a medkit' : p.items.bandage > 0 ? 'Press Q to use a bandage' : 'Find bandages or medkits, or press B to rest and heal slowly']
    ];
    let due = null;
    for (const [k, v, warn, title, how] of needs) {
        const r = R[k] || (R[k] = { at: -1e9, level: 0 });
        const level = v <= 0 ? 3 : v < warn * 0.4 ? 2 : v < warn ? 1 : 0;
        if (!level) { r.level = 0; continue; }  // back up: the next time it gets low counts as new
        if ((level > r.level || now - r.at > REMIND.every) && (!due || v < due.v)) due = { v, title, how, level, r };
    }
    // One at a time, a few seconds apart, the most urgent first
    if (!due || now - (R.last || -1e9) < REMIND.gap) return;
    due.r.level = due.level; due.r.at = now; R.last = now;
    showBanner(due.title, true, due.how);
    Sound.tone(due.level >= 2 ? 520 : 440, 0.18, 'square', 0.07, due.level >= 2 ? 360 : 330);
}

// Worn out: everything is slower
function tiredPace(f) {
    if (!G.survival || f.energy === undefined) return 1;
    return f.energy <= 0 ? 0.6 : f.energy < ENERGY.tired ? 0.8 : 1;
}

function drawPonds(L, T, R, B, now) {
    for (const p of G.world.ponds || []) {
        const m = Math.max(p.rx, p.ry) + 30;
        if (p.x + m < L || p.x - m > R || p.y + m < T || p.y - m > B) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillStyle = p.muddy ? '#5a4a36' : '#6b5a3a';
        ctx.beginPath(); ctx.ellipse(0, 0, p.rx + 16, p.ry + 14, 0, 0, TAU); ctx.fill();
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(p.rx, p.ry));
        g.addColorStop(0, p.muddy ? '#3d4a44' : '#1f5f86'); g.addColorStop(1, p.muddy ? '#5a6650' : '#3f8fb8');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, TAU); ctx.fill();
        // Ripples drifting across the water
        const rnd = seededRand(p.seed);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const t = ((now * 0.4 + rnd()) % 1), rx = (rnd() - 0.5) * p.rx * 1.4, ry = (rnd() - 0.5) * p.ry * 1.4;
            if ((rx / p.rx) ** 2 + (ry / p.ry) ** 2 > 0.8) continue;
            ctx.globalAlpha = 1 - t;
            ctx.beginPath(); ctx.ellipse(rx, ry, 4 + t * 22, 2 + t * 11, 0, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.ellipse(-p.rx * 0.3, -p.ry * 0.35, p.rx * 0.35, p.ry * 0.12, 0, 0, TAU); ctx.fill();
        ctx.restore();
    }
}

// ----- The start: everyone spread evenly round the edge of the arena, frozen where they stand until the countdown ends -----
const EDGE = { inset: 450, depth: 500 };  // how far in from the border the ring sits, and how much further in a spot may move to find open ground
function edgeSpot(t) {
    // t from 0 to 1 runs once round the square inside the border
    const W = CONFIG.WORLD_SIZE, a = EDGE.inset, L = W - 2 * a, d = (((t % 1) + 1) % 1) * 4 * L;
    const side = Math.floor(d / L), u = d - side * L;
    return side === 0 ? { x: a + u, y: a, nx: 0, ny: 1 } : side === 1 ? { x: W - a, y: a + u, nx: -1, ny: 0 } : side === 2 ? { x: W - a - u, y: W - a, nx: 0, ny: -1 } : { x: a, y: W - a - u, nx: 1, ny: 0 };
}
function arrangeStart() {
    const people = G.fighters.filter(f => !f.dead), placed = [], n = people.length, off = Math.random();
    // Shuffle so you're not always in the same place on the ring
    const order = people.map((f, i) => [Math.random(), f]).sort((p, q) => p[0] - q[0]).map(([, f]) => f);
    order.forEach((f, i) => {
        // Your slot on the ring; if it's in a building, a pond or something solid, look a little along it and further in
        let s = null;
        for (let k = 0; k < 40 && !s; k++) {
            const e = edgeSpot(off + i / n + (k ? rand(-0.4, 0.4) / n : 0)), inward = k ? rand(0, EDGE.depth) : 0;
            const q = { x: e.x + e.nx * inward, y: e.y + e.ny * inward };
            if (!blockedAt(G.world.grid, q.x, q.y, 40) && !buildingAt(q.x, q.y) && !inPond(q)) s = q;
        }
        s = s || findSpawn(null, 0);
        placed.push(s);
        f.x = s.x; f.y = s.y; f.vx = f.vy = 0;
        f.mode = 'wander'; f.target = null; f.nextThink = 0;
    });
    // Nobody starts next to a bear
    for (const a of G.animals) if (placed.some(q => Math.hypot(a.x - q.x, a.y - q.y) < 350)) a.dead = true;
    G.animals = G.animals.filter(a => !a.dead);
    G.frozen = true;
    G.startAt = G.time + START.countdown;
}

function updateCountdown() {
    if (!G.frozen) return;
    const left = Math.ceil((G.startAt - G.time) / 1000);
    if (left !== G.lastCount && left > 0) { G.lastCount = left; if (left <= 3) Sound.tone(660, 0.15, 'square', 0.12); else Sound.tone(440, 0.08, 'square', 0.06); }
    if (G.time >= G.startAt) {
        G.frozen = false;
        showBanner('GO!', true, 'May the odds be ever in your favor');
        Sound.tone(990, 0.5, 'square', 0.14, 1320);
    }
}

function drawCountdown() {
    if (!G.frozen) return;
    const left = Math.max(0, (G.startAt - G.time) / 1000), n = Math.ceil(left), k = left - Math.floor(left);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(120 + k * 40)}px "Black Ops One", sans-serif`;
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(18,10,38,0.85)';
    ctx.globalAlpha = 0.4 + k * 0.6;
    ctx.strokeText(n, viewW / 2, viewH * 0.36);
    ctx.fillStyle = n <= 3 ? '#ff4f6d' : '#ffd166';
    ctx.fillText(n, viewW / 2, viewH * 0.36);
    ctx.globalAlpha = 1;
    ctx.font = '700 22px Rajdhani, sans-serif';
    ctx.lineWidth = 5; ctx.strokeText('GET READY', viewW / 2, viewH * 0.36 + 100);
    ctx.fillStyle = '#fff7ec'; ctx.fillText('GET READY', viewW / 2, viewH * 0.36 + 100);
    ctx.restore();
}

// ---------- Terrains: a walled maze, and a mountain range (any mode; Escape adds its own dangers on top) ----------
const MAZE = { cells: Math.round(18 * MAP_SCALE), wall: 36, loops: 0.03 };
const MOUNTAIN = { pass: 300, summit: 380 };

function generateTerrain(type) {
    const W = CONFIG.WORLD_SIZE, grid = new Grid(256, 90), obstacles = [], lootSpots = [];
    const addBox = o => { obstacles.push(o); grid.insertBox(o); return o; };
    const addCircle = o => { obstacles.push(o); grid.insert(o); return o; };
    const [mm, g] = makeCanvas(200, 200), k = 200 / W;
    let start, end, maze = null, height = null, maze_extra = null;

    if (type === 'maze') {
        // A perfect maze carved by a random walk, then a few extra gaps knocked through so there's more than one way
        const n = MAZE.cells, cs = W / n, T = MAZE.wall;
        const east = [], south = [], seen = [];
        for (let i = 0; i < n; i++) { east.push(new Array(n).fill(true)); south.push(new Array(n).fill(true)); seen.push(new Array(n).fill(false)); }
        const stack = [[0, 0]];
        seen[0][0] = true;
        while (stack.length) {
            const [i, j] = stack[stack.length - 1];
            const next = [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && !seen[a][b]);
            if (!next.length) { stack.pop(); continue; }
            const [a, b] = pick(next);
            if (a > i) east[i][j] = false; else if (a < i) east[a][j] = false; else if (b > j) south[i][j] = false; else south[i][b] = false;
            seen[a][b] = true;
            stack.push([a, b]);
        }
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            if (i < n - 1 && east[i][j] && Math.random() < MAZE.loops) east[i][j] = false;
            if (j < n - 1 && south[i][j] && Math.random() < MAZE.loops) south[i][j] = false;
        }
        const wallCol = () => pick(['#6b6e75', '#64676e', '#72757c', '#5f6b5a']);
        const seg = (x0, y0, x1, y1) => addBox({ type: 'wall', mazeWall: true, x: (x0 + x1) / 2, y: (y0 + y1) / 2, hw: Math.max(T / 2, (x1 - x0) / 2), hh: Math.max(T / 2, (y1 - y0) / 2), color: wallCol() });
        // Outer wall, then the inside walls (each runs a little long to close the corners)
        seg(0, 0, W, T); seg(0, W - T, W, W); seg(0, 0, T, W); seg(W - T, 0, W, W);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            if (i < n - 1 && east[i][j]) seg((i + 1) * cs - T / 2, j * cs - T / 2, (i + 1) * cs + T / 2, (j + 1) * cs + T / 2);
            if (j < n - 1 && south[i][j]) seg(i * cs - T / 2, (j + 1) * cs - T / 2, (i + 1) * cs + T / 2, (j + 1) * cs + T / 2);
        }
        maze = { n, cs, east, south, seen: new Uint8Array(n * n) };
        start = { x: cs / 2, y: cs / 2 };
        end = { x: W - cs / 2, y: W - cs / 2 };
        // Cover in the corridors, and supplies tucked into the dead ends
        const walls = (i, j) => (i === 0 || east[i - 1][j]) + (i === n - 1 || east[i][j]) + (j === 0 || south[i][j - 1]) + (j === n - 1 || south[i][j]);
        // Machine-gun nests at junctions: a horseshoe of sandbags (a gunner is put in each when Escape starts)
        const nests = [], mineSpots = [];
        const junctions = [];
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (walls(i, j) <= 1 && i + j > 4) junctions.push([i, j]);
        for (const [i, j] of shuffle(junctions).slice(0, ESCAPE.maze.nests)) {
            const cx = (i + 0.5) * cs, cy = (j + 0.5) * cs;
            addBox({ type: 'wall', sandbags: true, x: cx, y: cy - 46, hw: 50, hh: 13, color: '#8d7d5a' });
            addBox({ type: 'wall', sandbags: true, x: cx - 50, y: cy - 10, hw: 13, hh: 36, color: '#8d7d5a' });
            addBox({ type: 'wall', sandbags: true, x: cx + 50, y: cy - 10, hw: 13, hh: 36, color: '#8d7d5a' });
            nests.push({ x: cx, y: cy - 6, i, j });
        }
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i + j > 4 && !nests.some(q => q.i === i && q.j === j)) mineSpots.push({ x: (i + 0.5) * cs + rand(-150, 150), y: (j + 0.5) * cs + rand(-150, 150) });
        maze_extra = { nests, mines: shuffle(mineSpots).slice(0, ESCAPE.maze.mines) };
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const cx = (i + 0.5) * cs, cy = (j + 0.5) * cs;
            if ((i === 0 && j === 0) || (i === n - 1 && j === n - 1) || maze_extra.nests.some(q => q.i === i && q.j === j)) continue;
            if (walls(i, j) === 3) { lootSpots.push({ x: cx, y: cy, box: true }); lootSpots.push({ x: cx + 60, y: cy + 40, good: true }); }
            else if (Math.random() < 0.3) lootSpots.push({ x: cx + rand(-120, 120), y: cy + rand(-120, 120), box: Math.random() < 0.4 });
            const r = Math.random();
            if (r < 0.25) { const horiz = Math.random() < 0.5; addBox({ type: 'wall', sandbags: true, x: cx + rand(-100, 100), y: cy + rand(-100, 100), hw: horiz ? 60 : 13, hh: horiz ? 13 : 60, color: '#8d7d5a' }); }
            else if (r < 0.45) { for (let c = 0; c < 2; c++) addBox({ type: 'crate', x: cx + rand(-130, 130), y: cy + rand(-130, 130), hw: 20, hh: 20 }); }
            else if (r < 0.55) addBox({ type: 'crate', barrel: true, x: cx + rand(-150, 150), y: cy + rand(-150, 150), hw: 14, hh: 14, color: pick(['#7a3b22', '#5a5f3a', '#3b4a5a']) });
        }
        g.fillStyle = '#4a4c52'; g.fillRect(0, 0, 200, 200);
        g.fillStyle = '#c9ccd2';
        for (const o of obstacles) if (o.mazeWall) g.fillRect((o.x - o.hw) * k, (o.y - o.hh) * k, Math.max(1, o.hw * 2 * k), Math.max(1, o.hh * 2 * k));
    } else {
        // Mountains: the land climbs from a green valley in one corner to a snowy summit in the other.
        // Ridges of rock wall it off, with passes carved through so there's always a way up
        const P = Array.from({ length: 6 }, () => [rand(0.0006, 0.0016), rand(0.0006, 0.0016), rand(0, TAU), rand(0, TAU)]);
        height = makeHeight(P);
        start = { x: 600, y: 600 };
        end = { x: W - 650, y: W - 650 };
        // The route up: a winding line through a handful of waypoints, plus a second, longer one
        const routes = [];
        for (let r = 0; r < 2; r++) {
            const pts = [start];
            for (let i = 1; i < 8; i++) {
                const t = i / 8, side = (r === 0 ? 1 : -1) * rand(300, 1100) * (i % 2 ? 1 : -1);
                pts.push({ x: clamp(lerp(start.x, end.x, t) + side * 0.7, 300, W - 300), y: clamp(lerp(start.y, end.y, t) - side * 0.7, 300, W - 300) });
            }
            pts.push(end);
            routes.push(pts);
        }
        const nearRoute = (x, y, d) => routes.some(pts => pts.some((p, i) => i > 0 && segHitsCircle(pts[i - 1].x, pts[i - 1].y, p.x, p.y, x, y, d)));
        const ridge = (x, y) => Math.abs(Math.sin(x * 0.0021 + Math.sin(y * 0.0013) * 2.2) * Math.cos(y * 0.0019 + Math.sin(x * 0.0011) * 1.8));
        for (let x = 150; x < W - 150; x += 120) for (let y = 150; y < W - 150; y += 120) {
            const h = height(x, y), rv = ridge(x, y);
            if (Math.hypot(x - start.x, y - start.y) < 500 || Math.hypot(x - end.x, y - end.y) < MOUNTAIN.summit + 100) continue;
            const qx = x + rand(-50, 50), qy = y + rand(-50, 50);
            if (rv > 0.55 - h * 0.15 && !nearRoute(qx, qy, MOUNTAIN.pass)) {
                addCircle({ type: 'rock', x: qx, y: qy, r: rand(80, 150) + h * 50, spr: randInt(0, 5), rot: rand(0, TAU), cliff: true, snow: h > 0.72 });
            } else if (h > 0.25 && h < 0.7 && Math.random() < 0.28 && !nearRoute(qx, qy, 120)) {
                const canopy = rand(110, 160);
                addCircle({ type: 'tree', x: qx, y: qy, r: canopy * 0.27, canopy, spr: randInt(0, 7), rot: rand(0, TAU), hp: TREE_HP, maxHp: TREE_HP, hitAt: -9999 });
            } else if (Math.random() < 0.06) {
                addCircle({ type: 'rock', x: qx, y: qy, r: rand(22, 45), spr: randInt(0, 5), rot: rand(0, TAU), snow: h > 0.72 });
            }
        }
        // Supply caches along the routes, and a few hidden off them
        for (const pts of routes) for (let i = 1; i < pts.length - 1; i++) lootSpots.push({ x: pts[i].x + rand(-120, 120), y: pts[i].y + rand(-120, 120), box: Math.random() < 0.5, good: true });
        for (let i = 0; i < 160 * MAP_AREA; i++) { const x = rand(300, W - 300), y = rand(300, W - 300); if (!blockedAt(grid, x, y, 30)) lootSpots.push({ x, y, box: Math.random() < 0.4 }); }
        for (let x = 0; x < 200; x += 4) for (let y = 0; y < 200; y += 4) { g.fillStyle = altitudeColor(height(x / k, y / k)); g.fillRect(x, y, 4, 4); }
        for (const o of obstacles) if (o.type === 'rock' && o.cliff) { g.fillStyle = o.snow ? '#f2f5f8' : '#6a655c'; g.beginPath(); g.arc(o.x * k, o.y * k, Math.max(1.5, o.r * k), 0, TAU); g.fill(); }
    }
    // The landing zone at the end is kept clear
    const gone = [];
    grid.query(end.x, end.y, 300, o => { if (!o.mazeWall && Math.hypot(o.x - end.x, o.y - end.y) < 300) gone.push(o); });
    for (const o of gone) { o.type === 'tree' || o.type === 'rock' ? grid.remove(o) : grid.removeBox(o); obstacles.splice(obstacles.indexOf(o), 1); }
    return { obstacles, grid, decorGrid: new Grid(512, 900), buildings: [], biomes: [], roads: [], lootSpots, minimap: mm, city: null, stairs: [], floor: null, terrain: type, maze, mazeExtra: maze_extra, height, escapeStart: start, escapeEnd: end };
}

// ---------- The Cavern (Boss Fight's own arena) ----------
// One giant cave deep underground: walls of rock all the way round, boulders everywhere, glowing crystals and
// cracks of lava in the floor. It's dim down here; the crystals and the lava give the only light besides yours.
const CAVERN = { r: 2700, clear: 420, step: 175, dark: 0.6 };
function cavernShape() {
    const W = CONFIG.WORLD_SIZE, cx = W / 2, cy = W / 2, P = [[3, rand(0, TAU), 0.11], [5, rand(0, TAU), 0.07], [9, rand(0, TAU), 0.035]];
    const edge = a => CAVERN.r * (1 + P.reduce((n, [f, ph, amp]) => n + Math.sin(a * f + ph) * amp, 0));
    return { cx, cy, edge, inside: (x, y, m = 0) => Math.hypot(x - cx, y - cy) < edge(Math.atan2(y - cy, x - cx)) - m };
}
function generateCavern() {
    const W = CONFIG.WORLD_SIZE, grid = new Grid(256, 90), obstacles = [], lootSpots = [], glows = [];
    const addCircle = o => { obstacles.push(o); grid.insert(o); return o; };
    const cave = cavernShape(), { cx, cy, edge } = cave;
    const rock = (x, y, r, cliff) => addCircle({ type: 'rock', x, y, r, spr: randInt(0, 5), rot: rand(0, TAU), cliff });
    // The cave wall: two rings of huge rocks, packed so there's no way through
    for (const [off, big] of [[60, 1], [330, 1.3]]) {
        for (let a = 0; a < TAU; ) {
            const R = edge(a) + off + rand(0, 60), r = rand(130, 180) * big;
            rock(cx + Math.cos(a) * R, cy + Math.sin(a) * R, r, true);
            a += (r * 1.2) / R;
        }
    }
    // Rocks everywhere inside: boulders, stones and pebbles, with the middle (where the boss waits) kept open
    for (let x = cx - CAVERN.r * 1.2; x < cx + CAVERN.r * 1.2; x += CAVERN.step) for (let y = cy - CAVERN.r * 1.2; y < cy + CAVERN.r * 1.2; y += CAVERN.step) {
        const qx = x + rand(-60, 60), qy = y + rand(-60, 60), d = Math.hypot(qx - cx, qy - cy);
        if (d < CAVERN.clear || !cave.inside(qx, qy, 200)) continue;
        const r = Math.random();
        if (r < 0.09) rock(qx, qy, rand(70, 125), true);
        else if (r < 0.3) rock(qx, qy, rand(32, 58), false);
        else if (r < 0.48) rock(qx, qy, rand(16, 28), false);
    }
    // Crystals (blue and purple) and lava cracks: the light down here
    for (let i = 0; i < 70; i++) {
        const a = rand(0, TAU), d = Math.sqrt(Math.random()) * (CAVERN.r - 250), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (d < CAVERN.clear || !cave.inside(x, y, 220) || blockedAt(grid, x, y, 40)) continue;
        const lava = Math.random() < 0.3;
        glows.push(lava ? { x, y, lava: true, r: rand(60, 120), pts: Array.from({ length: 5 }, () => [rand(-1, 1), rand(-1, 1)]) }
            : { x, y, r: rand(28, 48), c: pick(['#5fe1ff', '#5fe1ff', '#b47dff', '#7dffc8']), n: randInt(3, 6), seed: Math.random() * 1000 });
    }
    // Supplies scattered round the cave
    for (let i = 0; i < 90; i++) {
        const a = rand(0, TAU), d = rand(CAVERN.clear + 100, CAVERN.r - 250), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (cave.inside(x, y, 220) && !blockedAt(grid, x, y, 30)) lootSpots.push({ x, y, box: Math.random() < 0.45, good: Math.random() < 0.3 });
    }
    // The map: black rock, the cave floor, the boulders and the glowing bits
    const [mm, g] = makeCanvas(200, 200), k = 200 / W;
    g.fillStyle = '#0d0a08'; g.fillRect(0, 0, 200, 200);
    g.fillStyle = '#4a4038'; g.beginPath();
    for (let a = 0; a <= TAU + 0.01; a += 0.05) { const R = edge(a); g.lineTo((cx + Math.cos(a) * R) * k, (cy + Math.sin(a) * R) * k); }
    g.fill();
    for (const o of obstacles) { g.fillStyle = o.cliff ? '#26201b' : '#6e655b'; g.beginPath(); g.arc(o.x * k, o.y * k, Math.max(0.8, o.r * k), 0, TAU); g.fill(); }
    for (const q of glows) { g.fillStyle = q.lava ? '#ff7a2a' : q.c; g.beginPath(); g.arc(q.x * k, q.y * k, 1.3, 0, TAU); g.fill(); }
    const mid = { x: cx, y: cy };
    return { obstacles, grid, decorGrid: new Grid(512, 900), buildings: [], biomes: [], roads: [], lootSpots, minimap: mm, city: null, stairs: [], floor: null, terrain: 'cavern', cave, glows, maze: null, mazeExtra: null, height: null, escapeStart: mid, escapeEnd: mid };
}
// ---------- The haunted house (Ghost's map) ----------
// A giant old mansion in the middle - a grand hall with pillars and a staircase, and two wings of rooms (library, dining room,
// bedrooms, parlour, a coffin room...) lit by candles - with a cemetery all round it inside a tall iron fence:
// rows of gravestones, crypts, dead trees, jack-o'-lanterns and drifting fog. Beyond the fence, dark woods.
const HAUNT = { half: 2300, hw: 1000, hh: 720, wall: 16, door: 110 };
const hauntInside = (x, y, m = 0) => { const c = CONFIG.WORLD_SIZE / 2; return Math.abs(x - c) < HAUNT.half - m && Math.abs(y - c) < HAUNT.half - m; };
function generateHaunted() {
    const W = CONFIG.WORLD_SIZE, C = W / 2, grid = new Grid(256, 90), obstacles = [], lootSpots = [], glows = [], paint = [], fogs = [];
    const addBox = o => { obstacles.push(o); grid.insertBox(o); return o; };
    const addCircle = o => { obstacles.push(o); grid.insert(o); return o; };
    const T = HAUNT.wall, X0 = C - HAUNT.hw, X1 = C + HAUNT.hw, Y0 = C - HAUNT.hh, Y1 = C + HAUNT.hh;
    const WALL = '#3b2b31', doors = [];
    // A wall along x (horiz) or y from a to b, with doorways cut in it ([middle, width])
    const wall = (horiz, at, a, b, gaps = [], extra = {}) => {
        const cuts = gaps.map(([c, w]) => [c - w / 2, c + w / 2]).sort((p, q) => p[0] - q[0]);
        for (const [c0, c1] of cuts) doors.push(horiz ? { x: (c0 + c1) / 2, y: at } : { x: at, y: (c0 + c1) / 2 });
        let s = a;
        for (const [g0, g1] of [...cuts, [b, b]]) {
            const e = Math.min(g0, b);
            if (e - s > 4) addBox(horiz ? { type: 'wall', x: (s + e) / 2, y: at, hw: (e - s) / 2, hh: T / 2, color: WALL, haunt: true, ...extra }
                : { type: 'wall', x: at, y: (s + e) / 2, hw: T / 2, hh: (e - s) / 2, color: WALL, haunt: true, ...extra });
            s = Math.max(s, g1);
        }
    };
    const xs = [X0, C - 620, C - 260, C + 260, C + 620, X1], ys = [Y0, C - 240, C + 240, Y1];
    // The outside walls: big front doors, a back door and a door each side
    wall(true, Y0, X0 - T / 2, X1 + T / 2, [[C, 130]], { outer: true });
    wall(true, Y1, X0 - T / 2, X1 + T / 2, [[C, 190]], { outer: true });
    wall(false, X0, Y0, Y1, [[C, 120]], { outer: true });
    wall(false, X1, Y0, Y1, [[C, 120]], { outer: true });
    // Inside: the wings split into rooms, a door from every room into the next
    const rowDoors = () => [0, 1, 2].map(r => [rand(ys[r] + 90, ys[r + 1] - 90), HAUNT.door]);
    for (const i of [1, 2, 3, 4]) wall(false, xs[i], Y0, Y1, rowDoors());
    for (const [a, b] of [[0, 2], [3, 5]]) for (const j of [1, 2]) wall(true, ys[j], xs[a], xs[b], [[rand(xs[a] + 90, xs[a + 1] - 90), HAUNT.door], [rand(xs[a + 1] + 90, xs[b] - 90), HAUNT.door]]);
    const nearDoor = (x, y, hw, hh) => doors.some(d => Math.abs(d.x - x) < hw + 85 && Math.abs(d.y - y) < hh + 85);
    const prop = (kind, x, y, hw, hh, extra = {}) => {
        if (nearDoor(x, y, hw, hh) || blockedAt(grid, x, y, 2)) return null;
        for (const [px, py] of [[x - hw, y - hh], [x + hw, y + hh], [x - hw, y + hh], [x + hw, y - hh]]) if (blockedAt(grid, px, py, 2)) return null;
        return addBox({ type: 'crate', hprop: kind, x, y, hw, hh, seed: randInt(1, 1e9), ...extra });
    };
    const candle = (x, y) => { glows.push({ x, y, r: 22, c: '#ffb347', candle: true, seed: Math.random() * 100 }); paint.push({ k: 'candle', x, y, r: 12 }); };
    // ---- The grand hall: pillars, a sweeping staircase, a chandelier, and coffins laid out for a wake ----
    for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) addBox({ type: 'wall', x: C + sx * 190, y: Y0 + 330 + k * 230, hw: 18, hh: 18, color: '#4a4048', pillar: true });
    paint.push({ k: 'stairs', x: C, y: Y0 + 130, w: 360, h: 220, r: 260 });
    paint.push({ k: 'runner', x: C, y: (Y0 + 240 + Y1) / 2, w: 150, h: Y1 - Y0 - 260, r: 800 });
    glows.push({ x: C, y: C - 60, r: 55, c: '#ffd27a', chandelier: true, seed: 3 });
    glows.push({ x: C, y: C + 420, r: 40, c: '#ffd27a', chandelier: true, seed: 7 });
    for (const sx of [-1, 1]) { prop('coffin', C + sx * 75, C + 130, 20, 44); candle(C + sx * 75, C + 200); }
    for (const sx of [-1, 1]) for (const yy of [Y0 + 300, C + 260]) candle(C + sx * 228, yy);
    prop('organ', C, Y0 + 290, 70, 24);
    // ---- The rooms ----
    const THEMES = ['library', 'dining', 'bedroom', 'parlour', 'coffins', 'kitchen', 'nursery', 'study', 'bedroom', 'library', 'parlour', 'coffins'];
    const themes = THEMES.slice().sort(() => Math.random() - 0.5);
    let ti = 0;
    for (const [a, b] of [[0, 1], [1, 2], [3, 4], [4, 5]]) for (let r = 0; r < 3; r++) {
        const rx0 = xs[a] + T, rx1 = xs[b] - T, ry0 = ys[r] + T, ry1 = ys[r + 1] - T, cx = (rx0 + rx1) / 2, cy = (ry0 + ry1) / 2, rw = rx1 - rx0, rh = ry1 - ry0;
        const theme = themes[ti++ % themes.length];
        paint.push({ k: 'rug', x: cx, y: cy, w: rw * 0.55, h: rh * 0.5, c: pick(['#5a1a24', '#3a2450', '#1f3a34', '#4a2a14']), r: Math.max(rw, rh) });
        for (const [qx, qy, sx, sy] of [[rx0, ry0, 1, 1], [rx1, ry0, -1, 1], [rx0, ry1, 1, -1], [rx1, ry1, -1, -1]]) if (Math.random() < 0.6) paint.push({ k: 'web', x: qx, y: qy, sx, sy, s: rand(40, 70), r: 80 });
        if (Math.random() < 0.4) paint.push({ k: 'blood', x: cx + rand(-rw / 3, rw / 3), y: cy + rand(-rh / 3, rh / 3), s: rand(18, 34), seed: randInt(1, 1e9), r: 60 });
        if (theme === 'library') {
            for (let x = rx0 + 50; x < rx1 - 40; x += 80) { prop('shelf', x, ry0 + 16, 36, 13); prop('shelf', x, ry1 - 16, 36, 13); }
            prop('table', cx, cy, 45, 28);
        } else if (theme === 'dining') {
            prop('table', cx, cy, Math.min(110, rw * 0.3), 30, { long: true });
            for (let k = -2; k <= 2; k++) { prop('chair', cx + k * 42, cy - 48, 10, 10); prop('chair', cx + k * 42, cy + 48, 10, 10); }
        } else if (theme === 'bedroom') {
            prop('bed', rx0 + 60, cy, 36, 52);
            prop('wardrobe', rx1 - 26, cy - rh / 4, 16, 34);
        } else if (theme === 'parlour') {
            prop('piano', cx - rw / 5, ry0 + 50, 48, 28);
            prop('sofa', cx + rw / 6, ry1 - 40, 55, 18);
            prop('chair', cx + rw / 4, cy, 16, 16);
        } else if (theme === 'coffins') {
            for (let k = -1; k <= 1; k++) prop('coffin', cx + k * 85, cy, 20, 44, { open: Math.random() < 0.4 });
        } else if (theme === 'kitchen') {
            for (let x = rx0 + 50; x < rx1 - 40; x += 75) prop('counter', x, ry0 + 18, 33, 16);
            prop('table', cx, cy + 30, 40, 26);
        } else if (theme === 'nursery') {
            prop('crib', cx - 60, cy, 24, 34); prop('crib', cx + 60, cy, 24, 34);
            paint.push({ k: 'toys', x: cx, y: cy + rh / 3, r: 60, seed: randInt(1, 1e9) });
        } else {
            prop('desk', cx, cy - rh / 5, 44, 22);
            prop('shelf', rx0 + 16, cy, 13, 40);
        }
        candle(cx + rand(-rw / 3, rw / 3), cy + rand(-rh / 3, rh / 3));
        if (Math.random() < 0.5) candle(cx + rand(-rw / 3, rw / 3), cy + rand(-rh / 3, rh / 3));
        for (let k = 0; k < 2; k++) lootSpots.push({ x: cx + rand(-rw / 3, rw / 3), y: cy + rand(-rh / 3, rh / 3), box: Math.random() < 0.6, good: Math.random() < 0.3 });
    }
    // ---- The iron fence round the grounds (the gate's chained shut) ----
    const H = HAUNT.half;
    for (const [horiz, at] of [[true, C - H], [true, C + H], [false, C - H], [false, C + H]]) {
        for (let s = -H; s < H; s += 200) {
            const a = C + s, b = C + Math.min(H, s + 200);
            addBox(horiz ? { type: 'wall', x: (a + b) / 2, y: at, hw: (b - a) / 2, hh: 6, color: '#25252b', iron: true, gateway: at > C && Math.abs((a + b) / 2 - C) < 150 }
                : { type: 'wall', x: at, y: (a + b) / 2, hw: 6, hh: (b - a) / 2, color: '#25252b', iron: true });
        }
    }
    for (const sx of [-1, 1]) { addBox({ type: 'wall', x: C + sx * 110, y: C + H, hw: 22, hh: 22, color: '#58545c', pillar: true }); glows.push({ x: C + sx * 110, y: C + H - 34, r: 26, c: '#ffb347', lantern: true, seed: sx }); }
    // ---- The grounds: a gravel path to the front door and round the house ----
    paint.push({ k: 'path', x: C, y: (Y1 + C + H) / 2, w: 140, h: C + H - Y1, r: H });
    paint.push({ k: 'ring', x: C, y: C, w: HAUNT.hw * 2 + 260, h: HAUNT.hh * 2 + 260, r: 1500 });
    const onPath = (x, y, m) => (Math.abs(x - C) < 70 + m && y > Y1) || (Math.abs(x - C) < HAUNT.hw + 130 + 45 + m && Math.abs(y - C) < HAUNT.hh + 130 + 45 + m);
    // Crypts first (big stone tombs), then dead trees, then the rows of graves fill in round them
    const crypts = [];
    for (let i = 0, tries = 0; i < 8 && tries < 400; tries++) {
        const x = C + rand(-H + 300, H - 300), y = C + rand(-H + 300, H - 300), hw = rand(70, 95), hh = rand(55, 75);
        if (onPath(x, y, Math.max(hw, hh) + 60) || crypts.some(q => Math.hypot(q.x - x, q.y - y) < 600)) continue;
        crypts.push(addBox({ type: 'wall', x, y, hw, hh, color: '#5d5a62', crypt: true, seed: randInt(1, 1e9) }));
        lootSpots.push({ x, y: y + hh + 40, box: true, good: true });
        glows.push({ x: x + rand(-30, 30), y: y + hh + 22, r: 16, c: '#ffb347', candle: true, seed: Math.random() * 100 });
        paint.push({ k: 'candle', x: x - 30, y: y + hh + 22, r: 12 });
        i++;
    }
    for (let i = 0; i < 44; i++) {
        const x = C + rand(-H + 120, H - 120), y = C + rand(-H + 120, H - 120);
        if (onPath(x, y, 60) || blockedAt(grid, x, y, 60)) continue;
        const canopy = rand(90, 140);
        addCircle({ type: 'tree', dead: true, x, y, r: canopy * 0.16, canopy, spr: randInt(0, 7), rot: rand(0, TAU), hp: TREE_HP, maxHp: TREE_HP, hitAt: -9999, seed: randInt(1, 1e9) });
    }
    const GRAVE = ['stone', 'stone', 'round', 'round', 'cross', 'cross', 'obelisk', 'angel'];
    for (let y = C - H + 170; y < C + H - 90; y += 150) for (let x = C - H + 110; x < C + H - 90; x += 96) {
        if (Math.random() < 0.38) continue;
        const gx = x + rand(-10, 10), gy = y + rand(-8, 8), kind = pick(GRAVE);
        if (onPath(gx, gy, 40) || blockedAt(grid, gx, gy, 40) || blockedAt(grid, gx, gy + 34, 22)) continue;
        const big = kind === 'obelisk' || kind === 'angel';
        addBox({ type: 'wall', x: gx, y: gy, hw: big ? 16 : 14, hh: big ? 12 : 7, color: pick(['#77747c', '#6a6870', '#86838a', '#5f6066']), grave: kind, seed: randInt(1, 1e9), tilt: rand(-0.12, 0.12) });
        paint.push({ k: 'mound', x: gx, y: gy + 36, r: 40, fresh: Math.random() < 0.12 });
        if (Math.random() < 0.06) glows.push({ x: gx + rand(-20, 20), y: gy + 30, r: 18, c: '#ff8a1e', pumpkin: true, seed: Math.random() * 100 });
    }
    // Will-o'-the-wisps drifting over the graves, and jack-o'-lanterns along the path
    for (let i = 0; i < 14; i++) glows.push({ x: C + rand(-H + 200, H - 200), y: C + rand(-H + 200, H - 200), r: 14, c: '#7dffb0', wisp: true, seed: Math.random() * 100 });
    for (let y = Y1 + 260; y < C + H - 150; y += 280) for (const sx of [-1, 1]) glows.push({ x: C + sx * 95, y, r: 20, c: '#ff8a1e', pumpkin: true, seed: Math.random() * 100 });
    for (let i = 0; i < 26; i++) { const x = C + rand(-H + 150, H - 150), y = C + rand(-H + 150, H - 150); if (!onPath(x, y, 0) && !blockedAt(grid, x, y, 30)) lootSpots.push({ x, y, box: Math.random() < 0.5, good: Math.random() < 0.2 }); }
    // Dark woods outside the fence
    for (let i = 0; i < 260; i++) {
        const a = rand(0, TAU), d = rand(H + 90, H + 900), x = C + Math.cos(a) * d * 1.05, y = C + Math.sin(a) * d * 1.05;
        if (hauntInside(x, y, -80) || blockedAt(grid, x, y, 50)) continue;
        const canopy = rand(90, 150), dead = true;
        addCircle({ type: 'tree', dead, x, y, r: canopy * (dead ? 0.16 : 0.27), canopy, spr: randInt(0, 7), rot: rand(0, TAU), hp: TREE_HP, maxHp: TREE_HP, hitAt: -9999, seed: randInt(1, 1e9) });
    }
    for (let i = 0; i < 70; i++) fogs.push({ x: C + rand(-H, H), y: C + rand(-H, H), r: rand(160, 320), sp: rand(6, 16), ph: rand(0, TAU), a: rand(0.05, 0.11) });
    const pgrid = new Grid(400, 900);
    for (const q of paint) pgrid.insert(q);
    // The map: the house, the grounds and the graves
    const [mm, g] = makeCanvas(200, 200), k = 200 / W;
    g.fillStyle = '#101410'; g.fillRect(0, 0, 200, 200);
    g.fillStyle = '#2e3828'; g.fillRect((C - H) * k, (C - H) * k, H * 2 * k, H * 2 * k);
    g.fillStyle = '#6b665c'; g.fillRect((C - 70) * k, Y1 * k, 140 * k, (C + H - Y1) * k);
    g.fillStyle = '#4a3528'; g.fillRect(X0 * k, Y0 * k, (X1 - X0) * k, (Y1 - Y0) * k);
    for (const o of obstacles) {
        if (o.type === 'tree') { g.fillStyle = '#3a3026'; g.fillRect(o.x * k - 0.8, o.y * k - 0.8, 1.6, 1.6); continue; }
        g.fillStyle = o.grave ? '#8a8790' : o.crypt ? '#a09ca6' : o.iron ? '#55555e' : '#1c1418';
        g.fillRect((o.x - o.hw) * k, (o.y - o.hh) * k, Math.max(0.6, o.hw * 2 * k), Math.max(0.6, o.hh * 2 * k));
    }
    const mid = { x: C, y: C + H - 200 };
    const cave = { inside: (x, y, m = 0) => hauntInside(x, y, Math.max(60, m * 0.4)) };
    return { obstacles, grid, decorGrid: new Grid(512, 900), buildings: [], biomes: [], roads: [], lootSpots, minimap: mm, city: null, stairs: [], floor: null, terrain: 'haunted', cave, glows, haunt: { paint: pgrid, fogs, X0, X1, Y0, Y1 }, maze: null, mazeExtra: null, height: null, escapeStart: mid, escapeEnd: mid };
}
// The ground: floorboards and a stone hall in the house, dead grass, gravel and grave mounds outside, black woods past the fence
function paintHaunted(g, x0, y0, S) {
    const w = G.world, h = w.haunt, C = CONFIG.WORLD_SIZE / 2, H = HAUNT.half, B = 16;
    for (let x = x0; x < x0 + S; x += B) for (let y = y0; y < y0 + S; y += B) {
        const mx = x + B / 2, my = y + B / 2, v = ((Math.sin(mx * 0.011) * Math.cos(my * 0.013) + Math.sin(mx * 0.0037 - my * 0.0041)) * 6) | 0;
        let col;
        if (mx > h.X0 && mx < h.X1 && my > h.Y0 && my < h.Y1) {
            if (Math.abs(mx - C) < 260) col = ((Math.floor(mx / 64) + Math.floor(my / 64)) & 1) ? `rgb(${52 + v},${48 + v},${56 + v})` : `rgb(${36 + v},${33 + v},${40 + v})`;
            else { const row = Math.floor(my / 16), sh = ((row * 7919) % 5) * 3; col = `rgb(${66 + sh + v},${46 + sh + v},${34 + sh / 2 + v})`; }
        } else if (Math.abs(mx - C) < H && Math.abs(my - C) < H) col = `rgb(${48 + v},${56 + v},${40 + v})`;
        else col = `rgb(${20 + v / 2},${25 + v / 2},${19 + v / 2})`;
        g.fillStyle = col; g.fillRect(x, y, B + 1, B + 1);
    }
    // plank seams across the wings
    g.strokeStyle = 'rgba(20,10,6,0.45)'; g.lineWidth = 1.2; g.beginPath();
    for (let y = Math.ceil(Math.max(y0, h.Y0) / 16) * 16; y < Math.min(y0 + S, h.Y1); y += 16) for (const [a, b] of [[h.X0, C - 260], [C + 260, h.X1]]) {
        const l = Math.max(a, x0), r = Math.min(b, x0 + S);
        if (l >= r) continue;
        g.moveTo(l, y); g.lineTo(r, y);
        for (let x = Math.ceil(l / 120) * 120 + ((y / 16) % 2) * 60; x < r; x += 120) { g.moveTo(x, y); g.lineTo(x, y + 16); }
    }
    g.stroke();
    h.paint.query(x0 + S / 2, y0 + S / 2, S / 2 + 900, q => {
        switch (q.k) {
            case 'path': case 'ring': {
                g.fillStyle = '#5f5a50';
                if (q.k === 'path') g.fillRect(q.x - q.w / 2, q.y - q.h / 2, q.w, q.h);
                else { g.save(); g.strokeStyle = '#5f5a50'; g.lineWidth = 90; g.strokeRect(q.x - q.w / 2, q.y - q.h / 2, q.w, q.h); g.restore(); }
                const rnd = seededRand(Math.floor(x0 * 3 + y0));
                for (let i = 0; i < 300; i++) {
                    const px = x0 + rnd() * S, py = y0 + rnd() * S;
                    const on = q.k === 'path' ? Math.abs(px - q.x) < q.w / 2 && Math.abs(py - q.y) < q.h / 2
                        : Math.abs(Math.abs(px - q.x) - q.w / 2) < 45 && Math.abs(py - q.y) < q.h / 2 + 45 || Math.abs(Math.abs(py - q.y) - q.h / 2) < 45 && Math.abs(px - q.x) < q.w / 2 + 45;
                    if (on) { g.fillStyle = rnd() < 0.5 ? '#7a7468' : '#4a463e'; g.fillRect(px, py, 2 + rnd() * 3, 2 + rnd() * 2); }
                }
                break;
            }
            case 'mound':
                g.fillStyle = q.fresh ? '#3d2a1c' : 'rgba(55,42,30,0.75)'; g.beginPath(); g.ellipse(q.x, q.y, 17, 30, 0, 0, TAU); g.fill();
                g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(q.x + 3, q.y + 4, 15, 26, 0, 0, TAU); g.fill();
                g.fillStyle = q.fresh ? '#4e3826' : 'rgba(70,58,40,0.7)'; g.beginPath(); g.ellipse(q.x - 2, q.y - 3, 13, 24, 0, 0, TAU); g.fill();
                break;
            case 'rug':
                g.fillStyle = shade(q.c, -0.3); g.fillRect(q.x - q.w / 2 - 6, q.y - q.h / 2 - 6, q.w + 12, q.h + 12);
                g.fillStyle = q.c; g.fillRect(q.x - q.w / 2, q.y - q.h / 2, q.w, q.h);
                g.strokeStyle = 'rgba(210,170,90,0.35)'; g.lineWidth = 3; g.strokeRect(q.x - q.w / 2 + 10, q.y - q.h / 2 + 10, q.w - 20, q.h - 20);
                break;
            case 'runner':
                g.fillStyle = '#4a0f18'; g.fillRect(q.x - q.w / 2, q.y - q.h / 2, q.w, q.h);
                g.fillStyle = '#6a1a24'; g.fillRect(q.x - q.w / 2 + 10, q.y - q.h / 2, q.w - 20, q.h);
                g.fillStyle = 'rgba(210,170,90,0.4)'; g.fillRect(q.x - q.w / 2 + 14, q.y - q.h / 2, 3, q.h); g.fillRect(q.x + q.w / 2 - 17, q.y - q.h / 2, 3, q.h);
                break;
            case 'stairs':
                for (let i = 0; i < 10; i++) {
                    const t = i / 10, sw = q.w * (0.7 + t * 0.3), yy = q.y - q.h / 2 + t * q.h;
                    g.fillStyle = i % 2 ? '#4e3a30' : '#5c463a'; g.fillRect(q.x - sw / 2, yy, sw, q.h / 10 + 1);
                    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(q.x - sw / 2, yy + q.h / 10 - 3, sw, 3);
                }
                g.fillStyle = '#6a1a24'; g.fillRect(q.x - 60, q.y - q.h / 2, 120, q.h);
                g.fillStyle = '#2a1c18'; g.fillRect(q.x - q.w / 2 - 12, q.y - q.h / 2, 12, q.h); g.fillRect(q.x + q.w / 2, q.y - q.h / 2, 12, q.h);
                break;
            case 'web': {
                g.strokeStyle = 'rgba(220,220,230,0.35)'; g.lineWidth = 1;
                g.beginPath();
                for (let i = 0; i <= 4; i++) { const a = (i / 4) * Math.PI / 2; g.moveTo(q.x, q.y); g.lineTo(q.x + Math.cos(a) * q.s * q.sx, q.y + Math.sin(a) * q.s * q.sy); }
                for (let r = 0.3; r <= 1; r += 0.23) { g.moveTo(q.x + q.s * r * q.sx, q.y); for (let i = 1; i <= 4; i++) { const a = (i / 4) * Math.PI / 2; g.lineTo(q.x + Math.cos(a) * q.s * r * q.sx * 0.92, q.y + Math.sin(a) * q.s * r * q.sy * 0.92); } }
                g.stroke();
                break;
            }
            case 'blood': {
                const rnd = seededRand(q.seed);
                g.fillStyle = 'rgba(90,6,12,0.7)';
                g.beginPath(); g.ellipse(q.x, q.y, q.s, q.s * 0.7, rnd() * 3, 0, TAU); g.fill();
                for (let i = 0; i < 7; i++) { const a = rnd() * TAU, d = q.s * (0.9 + rnd()); g.beginPath(); g.arc(q.x + Math.cos(a) * d, q.y + Math.sin(a) * d, 2 + rnd() * 4, 0, TAU); g.fill(); }
                break;
            }
            case 'toys': {
                const rnd = seededRand(q.seed);
                for (let i = 0; i < 6; i++) { g.fillStyle = pick2(rnd, ['#7a5a8a', '#8a6a4a', '#5a7a8a', '#9a8a6a']); g.fillRect(q.x + (rnd() - 0.5) * 120, q.y + (rnd() - 0.5) * 50, 7, 7); }
                g.fillStyle = '#c8b8a0'; g.beginPath(); g.arc(q.x + 20, q.y - 6, 7, 0, TAU); g.fill();
                g.fillStyle = '#222'; g.fillRect(q.x + 16, q.y - 8, 2, 2); g.fillRect(q.x + 22, q.y - 8, 2, 2);
                break;
            }
            case 'candle':
                g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(q.x + 2, q.y + 3, 6, 0, TAU); g.fill();
                g.fillStyle = '#3a3036'; g.beginPath(); g.arc(q.x, q.y, 6, 0, TAU); g.fill();
                g.fillStyle = '#e8e0cc'; g.beginPath(); g.arc(q.x, q.y, 3.5, 0, TAU); g.fill();
                g.fillStyle = 'rgba(240,230,200,0.5)'; g.beginPath(); g.ellipse(q.x + 5, q.y + 4, 4, 2.5, 0.4, 0, TAU); g.fill();
                break;
        }
    });
}
// Flickering flames, glowing pumpkins and drifting wisps (drawn every frame, on top of the floor)
function drawHauntGlows(L, T, R, B, now) {
    for (const q of G.world.glows) {
        if (q.x < L - 60 || q.x > R + 60 || q.y < T - 60 || q.y > B + 60) continue;
        const fl = 0.75 + 0.25 * Math.sin(now / 90 + q.seed * 13) * Math.sin(now / 37 + q.seed);
        let x = q.x, y = q.y;
        if (q.wisp) { x += Math.sin(now / 1700 + q.seed) * 60; y += Math.cos(now / 2100 + q.seed * 2) * 40; }
        if (q.pumpkin) {
            ctx.fillStyle = '#2a1a08'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 13, 11, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#c85a0a'; ctx.beginPath(); ctx.ellipse(x, y, 13, 11, 0, 0, TAU); ctx.fill();
            ctx.strokeStyle = '#8a3a06'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, 5, 11, 0, 0, TAU); ctx.stroke();
            ctx.fillStyle = '#3a5a1a'; ctx.fillRect(x - 1.5, y - 14, 3, 5);
            ctx.fillStyle = `rgba(255,220,90,${fl})`;
            ctx.beginPath(); ctx.moveTo(x - 7, y - 3); ctx.lineTo(x - 3, y - 6); ctx.lineTo(x - 2, y - 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x + 7, y - 3); ctx.lineTo(x + 3, y - 6); ctx.lineTo(x + 2, y - 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x - 7, y + 3); ctx.lineTo(x - 3, y + 6); ctx.lineTo(x, y + 4); ctx.lineTo(x + 3, y + 6); ctx.lineTo(x + 7, y + 3); ctx.lineTo(x, y + 8); ctx.fill();
        }
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const r = (q.chandelier ? 70 : q.wisp ? 26 : 20) * fl, gr = ctx.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, q.c + 'aa'); gr.addColorStop(1, q.c + '00');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        if (q.candle || q.lantern || q.chandelier) {
            const n = q.chandelier ? 6 : 1;
            for (let i = 0; i < n; i++) {
                const fx = x + (n > 1 ? Math.cos(i / n * TAU) * 26 : 0), fy = y + (n > 1 ? Math.sin(i / n * TAU) * 26 : 0) - 2;
                ctx.fillStyle = `rgba(255,200,90,${0.9 * fl})`; ctx.beginPath(); ctx.ellipse(fx, fy, 2.6, 4.5 * fl, 0, 0, TAU); ctx.fill();
                ctx.fillStyle = `rgba(255,250,220,${fl})`; ctx.beginPath(); ctx.ellipse(fx, fy + 1, 1.2, 2.2, 0, 0, TAU); ctx.fill();
            }
        }
        if (q.wisp) { ctx.fillStyle = `rgba(200,255,220,${0.8 * fl})`; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
        ctx.restore();
    }
}
// A dead tree: bare, twisted branches reaching out from the trunk
function drawDeadTree(o) {
    const wob = plantWobble(o) * 0.08;
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot + wob);
    ctx.lineCap = 'round';
    const tree = (dx, dy, c1, c2) => {
        const rnd = seededRand(o.seed || 5);
        const branch = (x, y, a, len, wdt, depth) => {
            const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
            ctx.strokeStyle = depth > 1 ? c2 : c1; ctx.lineWidth = wdt;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + ex) / 2 + (rnd() - 0.5) * len * 0.4, (y + ey) / 2 + (rnd() - 0.5) * len * 0.4, ex, ey); ctx.stroke();
            if (depth < 3) for (let i = 0; i < 2; i++) branch(ex, ey, a + (rnd() - 0.5) * 1.4, len * (0.5 + rnd() * 0.25), wdt * 0.6, depth + 1);
        };
        for (let i = 0, n = 5 + Math.floor(rnd() * 3); i < n; i++) branch(dx, dy, i / n * TAU + rnd() * 0.6, o.canopy * (0.28 + rnd() * 0.12), 7, 1);
    };
    tree(10, 14, 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.3)');
    tree(0, 0, '#3a2e24', '#2a221c');
    ctx.fillStyle = '#2e241c'; ctx.beginPath(); ctx.arc(0, 0, o.r + 2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#463628'; ctx.beginPath(); ctx.arc(-1, -1, o.r - 1, 0, TAU); ctx.fill();
    ctx.restore();
}
// Fog rolling slowly across the graves
function drawHauntFog(L, T, R, B, now) {
    for (const f of G.world.haunt.fogs) {
        const x = f.x + Math.sin(now / 9000 * f.sp / 10 + f.ph) * 260, y = f.y + Math.cos(now / 12000 * f.sp / 10 + f.ph) * 120;
        if (x < L - f.r || x > R + f.r || y < T - f.r || y > B + f.r) continue;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, f.r);
        gr.addColorStop(0, `rgba(190,200,210,${f.a})`); gr.addColorStop(1, 'rgba(190,200,210,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, f.r, 0, TAU); ctx.fill();
    }
}
// Gravestones, crypts, the iron fence, the old house's walls and its furniture
function drawHaunted(o, x, y, w, h) {
    const rnd = seededRand(o.seed || 7);
    if (o.grave) {
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.tilt || 0);
        const c = o.color, dk = shade(c, -0.4), lt = shade(c, 0.25);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-o.hw + 3, -o.hh + 5, o.hw * 2, o.hh * 2);
        if (o.grave === 'cross') {
            ctx.fillStyle = dk; ctx.fillRect(-4.5, -o.hh - 1, 9, o.hh * 2 + 2); ctx.fillRect(-o.hw - 1, -3.5, o.hw * 2 + 2, 7);
            ctx.fillStyle = c; ctx.fillRect(-3, -o.hh, 6, o.hh * 2); ctx.fillRect(-o.hw, -2, o.hw * 2, 4);
        } else if (o.grave === 'round') {
            ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(0, 0, o.hw + 1, o.hh + 1, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, o.hw, o.hh, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = lt; ctx.fillRect(-o.hw * 0.6, -o.hh * 0.5, o.hw * 1.2, 2);
        } else if (o.grave === 'obelisk') {
            ctx.fillStyle = dk; ctx.fillRect(-o.hw - 1, -o.hh - 1, o.hw * 2 + 2, o.hh * 2 + 2);
            ctx.fillStyle = c; ctx.fillRect(-o.hw, -o.hh, o.hw * 2, o.hh * 2);
            ctx.fillStyle = lt; ctx.beginPath(); ctx.moveTo(-o.hw * 0.55, -o.hh * 0.55); ctx.lineTo(o.hw * 0.55, -o.hh * 0.55); ctx.lineTo(o.hw * 0.55, o.hh * 0.55); ctx.lineTo(-o.hw * 0.55, o.hh * 0.55); ctx.closePath(); ctx.fill();
            ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-o.hw * 0.55, -o.hh * 0.55); ctx.lineTo(0, 0); ctx.lineTo(o.hw * 0.55, -o.hh * 0.55); ctx.fill();
        } else if (o.grave === 'angel') {
            ctx.fillStyle = dk; ctx.fillRect(-o.hw - 1, -o.hh - 1, o.hw * 2 + 2, o.hh * 2 + 2);
            ctx.fillStyle = c; ctx.fillRect(-o.hw, -o.hh, o.hw * 2, o.hh * 2);
            ctx.fillStyle = lt; ctx.beginPath(); ctx.ellipse(-7, -2, 8, 4, -0.4, 0, TAU); ctx.ellipse(7, -2, 8, 4, 0.4, 0, TAU); ctx.fill();
            ctx.fillStyle = shade(c, 0.4); ctx.beginPath(); ctx.arc(0, -3, 4, 0, TAU); ctx.fill();
        } else {
            ctx.fillStyle = dk; ctx.beginPath(); ctx.roundRect(-o.hw - 1, -o.hh - 1, o.hw * 2 + 2, o.hh * 2 + 2, [o.hw, o.hw, 1, 1]); ctx.fill();
            ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(-o.hw, -o.hh, o.hw * 2, o.hh * 2, [o.hw, o.hw, 1, 1]); ctx.fill();
            ctx.fillStyle = 'rgba(30,30,34,0.5)'; ctx.fillRect(-o.hw * 0.55, -1, o.hw * 1.1, 1.5); ctx.fillRect(-o.hw * 0.4, 2, o.hw * 0.8, 1.2);
        }
        // moss
        ctx.fillStyle = 'rgba(70,100,50,0.45)'; ctx.beginPath(); ctx.arc((rnd() - 0.5) * o.hw, (rnd() - 0.3) * o.hh, 2 + rnd() * 3, 0, TAU); ctx.fill();
        ctx.restore();
        return;
    }
    if (o.crypt) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 8, y + 10, w, h);
        ctx.fillStyle = '#3a383e'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
        // a pitched stone roof seen from above
        ctx.fillStyle = '#5d5a62'; ctx.fillRect(x, y, w, h / 2);
        ctx.fillStyle = '#4c4a52'; ctx.fillRect(x, y + h / 2, w, h / 2);
        ctx.fillStyle = '#6e6a74'; ctx.fillRect(x, y + h / 2 - 3, w, 6);
        ctx.strokeStyle = 'rgba(20,18,24,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let xx = x + 18; xx < x + w; xx += 18) { ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); }
        ctx.stroke();
        // the door and steps on the front
        ctx.fillStyle = '#2a2830'; ctx.fillRect(o.x - 18, y + h - 2, 36, 12);
        ctx.fillStyle = '#6a6672'; ctx.fillRect(o.x - 24, y + h + 10, 48, 6);
        ctx.fillStyle = 'rgba(70,100,50,0.4)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + rnd() * w, y + rnd() * h, 4 + rnd() * 8, 0, TAU); ctx.fill(); }
        return;
    }
    if (o.iron) {
        const horiz = w > h;
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 3, y + 5, w, h);
        ctx.fillStyle = '#1c1c22'; ctx.fillRect(x, y + (horiz ? h / 2 - 1.5 : 0), horiz ? w : 3, horiz ? 3 : h);
        if (!horiz) ctx.fillRect(x + w / 2 - 1.5, y, 3, h);
        ctx.fillStyle = '#34343c';
        const len = horiz ? w : h;
        for (let s = 6; s < len; s += 11) {
            const px = horiz ? x + s : o.x, py = horiz ? o.y : y + s;
            ctx.beginPath(); ctx.arc(px, py, 2.6, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = '#4a4a54';
        for (const e of [0, len]) { const px = horiz ? x + e : o.x, py = horiz ? o.y : y + e; ctx.fillRect(px - 5, py - 5, 10, 10); }
        if (o.gateway) { ctx.strokeStyle = '#8a7a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x - 30, o.y - 4); ctx.lineTo(o.x + 30, o.y + 4); ctx.moveTo(o.x - 30, o.y + 4); ctx.lineTo(o.x + 30, o.y - 4); ctx.stroke(); }
        return;
    }
    if (o.pillar) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(o.x + 5, o.y + 7, o.hw + 2, 0, TAU); ctx.fill();
        ctx.fillStyle = shade(o.color, -0.35); ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = o.color; ctx.beginPath(); ctx.arc(o.x, o.y, o.hw, 0, TAU); ctx.fill();
        ctx.fillStyle = shade(o.color, 0.2); ctx.beginPath(); ctx.arc(o.x - 4, o.y - 4, o.hw * 0.5, 0, TAU); ctx.fill();
        return;
    }
    if (o.haunt) {
        // Old dark wallpapered walls with a wooden dado, peeling and cracked
        ctx.fillStyle = '#1a1014'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = o.outer ? '#2e2228' : o.color; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(120,80,60,0.35)';
        if (w > h) ctx.fillRect(x, y + h / 2 - 2, w, 4); else ctx.fillRect(x + w / 2 - 2, y, 4, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i < Math.max(w, h) / 60; i++) { const cx = x + rnd() * w, cy = y + rnd() * h; ctx.moveTo(cx, cy); ctx.lineTo(cx + (rnd() - 0.5) * 12, cy + (rnd() - 0.5) * 12); }
        ctx.stroke();
        if (o.outer) {
            // boarded-up windows along the outside walls
            ctx.fillStyle = '#6a4a2a';
            const long = Math.max(w, h);
            for (let s = 120; s < long - 60; s += 260) {
                if (w > h) { ctx.save(); ctx.translate(x + s, o.y); ctx.rotate(0.15); ctx.fillRect(-26, -3, 52, 6); ctx.rotate(-0.35); ctx.fillRect(-24, -3, 48, 6); ctx.restore(); }
                else { ctx.save(); ctx.translate(o.x, y + s); ctx.rotate(0.15); ctx.fillRect(-3, -26, 6, 52); ctx.rotate(-0.35); ctx.fillRect(-3, -24, 6, 48); ctx.restore(); }
            }
        }
        return;
    }
    // Furniture: old, dusty and dark
    const P = o.hprop;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 4, y + 6, w, h);
    if (P === 'coffin') {
        ctx.save(); ctx.translate(o.x, o.y);
        const sh = (s) => { ctx.beginPath(); ctx.moveTo(-o.hw * 0.6 * s, -o.hh * s); ctx.lineTo(o.hw * 0.6 * s, -o.hh * s); ctx.lineTo(o.hw * s, -o.hh * 0.45 * s); ctx.lineTo(o.hw * 0.7 * s, o.hh * s); ctx.lineTo(-o.hw * 0.7 * s, o.hh * s); ctx.lineTo(-o.hw * s, -o.hh * 0.45 * s); ctx.closePath(); };
        ctx.fillStyle = '#1e120c'; sh(1.08); ctx.fill();
        ctx.fillStyle = '#4a2a18'; sh(1); ctx.fill();
        if (o.open) { ctx.fillStyle = '#5a1a24'; sh(0.8); ctx.fill(); ctx.fillStyle = '#d8d0c0'; ctx.beginPath(); ctx.arc(0, -o.hh * 0.55, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(-3, -o.hh * 0.6, 2, 2); ctx.fillRect(1, -o.hh * 0.6, 2, 2); }
        else { ctx.fillStyle = '#5e3a22'; sh(0.82); ctx.fill(); ctx.fillStyle = '#b8a060'; ctx.fillRect(-1.5, -o.hh * 0.55, 3, o.hh * 0.8); ctx.fillRect(-o.hw * 0.4, -o.hh * 0.3, o.hw * 0.8, 3); }
        ctx.restore();
        return;
    }
    const base = { shelf: '#3a2416', table: '#4a2e1c', chair: '#3e2618', bed: '#3a2416', wardrobe: '#2e1c12', piano: '#121014', sofa: '#4a1a22', counter: '#3e3a36', crib: '#5a4a3a', desk: '#4a2e1c', organ: '#1e1612' }[P] || '#3a2a20';
    ctx.fillStyle = shade(base, -0.4); ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
    if (P === 'shelf') {
        for (let i = 0, n = Math.floor(Math.max(w, h) / 6); i < n; i++) { ctx.fillStyle = pick2(rnd, ['#5a2a2a', '#2a3a5a', '#3a4a2a', '#6a5a3a', '#4a2a4a']); if (w > h) ctx.fillRect(x + 2 + i * 6, y + 3, 4, h - 6); else ctx.fillRect(x + 3, y + 2 + i * 6, w - 6, 4); }
    } else if (P === 'table' || P === 'desk') {
        ctx.fillStyle = shade(base, 0.15); ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
        ctx.fillStyle = 'rgba(220,220,230,0.18)'; ctx.fillRect(x + w * 0.2, y + h * 0.3, w * 0.25, h * 0.4);
        if (o.long) for (let k = -2; k <= 2; k++) { ctx.fillStyle = '#c8c0b0'; ctx.beginPath(); ctx.arc(o.x + k * 42, o.y - h * 0.2, 4, 0, TAU); ctx.arc(o.x + k * 42, o.y + h * 0.2, 4, 0, TAU); ctx.fill(); }
        if (P === 'desk') { ctx.fillStyle = '#d8d0b8'; ctx.fillRect(o.x - 10, o.y - 6, 14, 10); }
    } else if (P === 'bed') {
        ctx.fillStyle = '#5a4a4e'; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
        ctx.fillStyle = '#d0c8c0'; ctx.fillRect(x + 6, y + 5, w - 12, 14);
        ctx.fillStyle = '#4a1a22'; ctx.fillRect(x + 3, y + h * 0.4, w - 6, h * 0.55);
        ctx.fillStyle = '#2a1810'; for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU); ctx.fill(); }
    } else if (P === 'piano' || P === 'organ') {
        ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 4, y + h - 10, w - 8, 7);
        ctx.fillStyle = '#111'; for (let xx = x + 7; xx < x + w - 6; xx += 5) ctx.fillRect(xx, y + h - 10, 2.5, 4);
        if (P === 'organ') { ctx.fillStyle = '#8a7a5a'; for (let i = 0; i < 12; i++) ctx.fillRect(x + 6 + i * (w - 12) / 12, y + 2, 4, h * 0.5 + Math.abs(6 - i) * 0.8); }
    } else if (P === 'sofa') {
        ctx.fillStyle = '#6a2a32'; ctx.fillRect(x + 4, y + 5, w - 8, h - 7);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(o.x - 1, y + 5, 2, h - 7);
    } else if (P === 'wardrobe') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(o.x - 1, y + 2, 2, h - 4);
        ctx.fillStyle = '#b8a060'; ctx.fillRect(o.x - 4, o.y - 2, 2, 4); ctx.fillRect(o.x + 2, o.y - 2, 2, 4);
    } else if (P === 'counter') {
        ctx.fillStyle = '#5a5650'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        ctx.fillStyle = '#26221e'; ctx.beginPath(); ctx.arc(o.x, o.y, 7, 0, TAU); ctx.fill();
    } else if (P === 'crib') {
        ctx.fillStyle = '#3a2e24'; for (let yy = y + 4; yy < y + h - 2; yy += 6) { ctx.fillRect(x + 2, yy, 3, 3); ctx.fillRect(x + w - 5, yy, 3, 3); }
        ctx.fillStyle = '#c8c0d0'; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    } else if (P === 'chair') {
        ctx.fillStyle = shade(base, 0.2); ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    }
}

// The cave floor: dark stone inside, black rock beyond the walls, with the crystals and lava painted in
function paintCavern(g, x0, y0, S) {
    const w = G.world, cave = w.cave, B = 16;
    for (let x = x0; x < x0 + S; x += B) for (let y = y0; y < y0 + S; y += B) {
        const inn = cave.inside(x + B / 2, y + B / 2, -40), v = ((Math.sin(x * 0.013) * Math.cos(y * 0.011) + Math.sin(x * 0.0041 + y * 0.0037)) * 6) | 0;
        g.fillStyle = inn ? `rgb(${58 + v},${50 + v},${44 + v})` : `rgb(${18 + v / 2},${14 + v / 2},${12 + v / 2})`;
        g.fillRect(x, y, B + 1, B + 1);
    }
    for (const q of w.glows) {
        if (q.x + 200 < x0 || q.y + 200 < y0 || q.x - 200 > x0 + S || q.y - 200 > y0 + S) continue;
        if (q.lava) {
            const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 1.8);
            gr.addColorStop(0, 'rgba(255,120,30,0.35)'); gr.addColorStop(1, 'rgba(255,80,20,0)');
            g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, q.r * 1.8, 0, TAU); g.fill();
            g.lineCap = 'round';
            for (const [lw, col] of [[9, '#5a1a08'], [5, '#ff6a1a'], [2, '#ffd27a']]) {
                g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
                q.pts.forEach(([a, b], i) => { const px = q.x + a * q.r, py = q.y + b * q.r; i ? g.lineTo(px, py) : g.moveTo(px, py); });
                g.stroke();
            }
        } else {
            const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 3);
            gr.addColorStop(0, q.c + '55'); gr.addColorStop(1, q.c + '00');
            g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, q.r * 3, 0, TAU); g.fill();
            const rnd = seededRand(q.seed | 0);
            for (let i = 0; i < q.n; i++) {
                const a = rnd() * TAU, L = q.r * (0.6 + rnd() * 0.7), wdt = 6 + rnd() * 6, bx = q.x + Math.cos(a) * rnd() * 10, by = q.y + Math.sin(a) * rnd() * 10;
                const tx = bx + Math.cos(a) * L, ty = by + Math.sin(a) * L, nx = -Math.sin(a) * wdt, ny = Math.cos(a) * wdt;
                g.fillStyle = shade(q.c, -0.35); g.beginPath(); g.moveTo(bx + nx, by + ny); g.lineTo(tx, ty); g.lineTo(bx - nx, by - ny); g.closePath(); g.fill();
                g.fillStyle = q.c; g.beginPath(); g.moveTo(bx + nx * 0.4, by + ny * 0.4); g.lineTo(tx, ty); g.lineTo(bx, by); g.closePath(); g.fill();
            }
        }
    }
}

// Smooth rolling height, rising from the start corner to the far one (0 = valley, 1 = peak)
function makeHeight(P) {
    const W = CONFIG.WORLD_SIZE;
    return (x, y) => {
        let n = 0;
        for (const [fx, fy, px, py] of P) n += Math.sin(x * fx + px) * Math.cos(y * fy + py);
        return clamp(0.62 * ((x + y) / (2 * W)) + 0.19 * (n / P.length) * 2 + 0.12, 0, 1);
    };
}

const ALTITUDE = [[0, [91, 154, 69]], [0.35, [104, 140, 72]], [0.55, [128, 122, 104]], [0.7, [150, 146, 138]], [0.76, [228, 234, 238]], [1, [246, 248, 250]]];
function altitudeColor(h) {
    let i = 0;
    while (i < ALTITUDE.length - 2 && h > ALTITUDE[i + 1][0]) i++;
    const [h0, c0] = ALTITUDE[i], [h1, c1] = ALTITUDE[i + 1], t = clamp((h - h0) / (h1 - h0), 0, 1);
    return `rgb(${Math.round(lerp(c0[0], c1[0], t))},${Math.round(lerp(c0[1], c1[1], t))},${Math.round(lerp(c0[2], c1[2], t))})`;
}

// Ground for the maze (concrete slabs) and the mountains (grass to rock to snow), painted into the cached tiles
function paintTerrainBase(g, x0, y0, S) {
    const w = G.world;
    if (w.terrain === 'cavern') { paintCavern(g, x0, y0, S); return; }
    if (w.terrain === 'haunted') { paintHaunted(g, x0, y0, S); return; }
    if (w.terrain === 'maze') {
        g.fillStyle = '#5a5c62'; g.fillRect(x0, y0, S, S);
        g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2;
        g.beginPath();
        for (let x = x0; x <= x0 + S; x += 64) { g.moveTo(x, y0); g.lineTo(x, y0 + S); }
        for (let y = y0; y <= y0 + S; y += 64) { g.moveTo(x0, y); g.lineTo(x0 + S, y); }
        g.stroke();
        for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(30,25,20,0.12)'; g.beginPath(); g.arc(x0 + Math.random() * S, y0 + Math.random() * S, 20 + Math.random() * 50, 0, TAU); g.fill(); }
    } else if (w.terrain === 'mountain') {
        const B = 16;
        for (let x = x0; x < x0 + S; x += B) for (let y = y0; y < y0 + S; y += B) { g.fillStyle = altitudeColor(w.height(x + B / 2, y + B / 2)); g.fillRect(x, y, B + 1, B + 1); }
    }
}

// Maze: the minimap only shows the corridors you've been through (and the ones opening off them)
function updateMazeFog() {
    const M = G.world.maze, p = G.player;
    if (!M || G.world.floor || !p || p.dead) return;
    const n = M.n, i = Math.floor(clamp(p.x / M.cs, 0, n - 1)), j = Math.floor(clamp(p.y / M.cs, 0, n - 1)), c = i + j * n;
    if (M.seen[c] && M.lastCell === c) return;
    M.lastCell = c;
    let fresh = !M.seen[c];
    M.seen[c] = 1;
    for (const [a, b, open] of [[i + 1, j, i < n - 1 && !M.east[i][j]], [i - 1, j, i > 0 && !M.east[i - 1][j]], [i, j + 1, j < n - 1 && !M.south[i][j]], [i, j - 1, j > 0 && !M.south[i][j - 1]]]) {
        if (open && !M.seen[a + b * n]) { M.seen[a + b * n] = 1; fresh = true; }
    }
    if (fresh) drawMazeMap();
}

function drawMazeMap() {
    const M = G.world.maze, n = M.n, cs = M.cs, k = 200 / CONFIG.WORLD_SIZE, g = G.world.minimap.getContext('2d');
    g.fillStyle = '#121317'; g.fillRect(0, 0, 200, 200);
    g.save();
    g.beginPath();
    for (let c = 0; c < n * n; c++) if (M.seen[c]) g.rect((c % n) * cs * k - 1, Math.floor(c / n) * cs * k - 1, cs * k + 2, cs * k + 2);
    g.clip();
    g.fillStyle = '#4a4c52'; g.fillRect(0, 0, 200, 200);
    g.fillStyle = '#c9ccd2';
    for (const o of G.world.obstacles) if (o.mazeWall) g.fillRect((o.x - o.hw) * k, (o.y - o.hh) * k, Math.max(1, o.hw * 2 * k), Math.max(1, o.hh * 2 * k));
    g.restore();
}

// Maze: walk the corridors cell by cell toward the goal (breadth-first search over the cells)
function mazeRoute(b, gx, gy) {
    const M = G.world.maze, n = M.n, cs = M.cs;
    const ci = Math.floor(clamp(b.x / cs, 0, n - 1)), cj = Math.floor(clamp(b.y / cs, 0, n - 1));
    const ti = Math.floor(clamp(gx / cs, 0, n - 1)), tj = Math.floor(clamp(gy / cs, 0, n - 1));
    if (ci === ti && cj === tj) return { x: gx, y: gy };
    const key = ci + cj * n + (ti + tj * n) * 1000;
    if (b.mzKey !== key) {
        b.mzKey = key;
        const prev = new Int16Array(n * n).fill(-1), q = [ti + tj * n];
        prev[ti + tj * n] = ti + tj * n;
        // Search back from the goal so the first step from the bot falls out directly
        while (q.length) {
            const c = q.shift(), i = c % n, j = (c - i) / n;
            if (c === ci + cj * n) break;
            const nb = [];
            if (i < n - 1 && !M.east[i][j]) nb.push(c + 1);
            if (i > 0 && !M.east[i - 1][j]) nb.push(c - 1);
            if (j < n - 1 && !M.south[i][j]) nb.push(c + n);
            if (j > 0 && !M.south[i][j - 1]) nb.push(c - n);
            for (const d of nb) if (prev[d] < 0) { prev[d] = c; q.push(d); }
        }
        const nx = prev[ci + cj * n];
        b.mzNext = nx < 0 ? null : { x: ((nx % n) + 0.5) * cs, y: (Math.floor(nx / n) + 0.5) * cs };
    }
    return b.mzNext || { x: gx, y: gy };
}

// The extraction helicopter waiting at the end of the maze or on the summit
function drawExtraction(now) {
    const e = G.extract;
    if (!e || G.world.floor || !inView(e.x, e.y, 300)) return;
    ctx.fillStyle = '#2f3a33';
    ctx.beginPath(); ctx.arc(e.x, e.y, 130, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(e.x, e.y, 116, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#fff7ec';
    ctx.fillRect(e.x - 40, e.y - 45, 14, 90); ctx.fillRect(e.x + 26, e.y - 45, 14, 90); ctx.fillRect(e.x - 40, e.y - 7, 80, 14);
    drawHelicopter(e.x, e.y, now);
}

// Snow drifting down once you're high on the mountain
function drawSnowfall(now) {
    const p = G.player;
    if (G.world.terrain !== 'mountain' || !p || G.world.floor) return;
    const h = G.world.height(p.x, p.y);
    if (h < 0.66) return;
    const a = clamp((h - 0.66) / 0.1, 0, 1);
    ctx.fillStyle = `rgba(255,255,255,${0.75 * a})`;
    const n = Math.round((viewW * viewH) / 5000);
    for (let i = 0; i < n; i++) {
        const sp = 40 + (i % 5) * 20, y = ((now * sp + i * 97) % (viewH + 20)) - 10, x = ((i * 733.7) % viewW + Math.sin(now + i) * 20 + viewW) % viewW;
        ctx.beginPath(); ctx.arc(x, y, 1.2 + (i % 3) * 0.7, 0, TAU); ctx.fill();
    }
}

// ---------- Hyper drops: the only supply drop left, extremely rare, neon blue and teal ----------
// Inside: one-of-a-kind weapons, energy shields, special grenades and backpacks with perks
const HYPER = { first: [12000, 20000], every: [240000, 360000], hp: 320, neon: '#00e5ff', teal: '#00f5d4' };
const HYPER_LOOT = {
    weapons: ['Plasma Rifle', 'Railgun', 'Tesla Cannon', 'Laser Beam', 'Freeze Ray', 'Homing Launcher', 'Minigun of Doom', 'Sonic Cannon'],
    shields: ['shield1', 'shield2', 'shield3'],
    grenades: ['shock', 'cluster'],
    packs: ['medpack', 'jetpack', 'ammopack']
};
const SHOCK = { radius: 400, damage: 45, stun: 4000, chain: 2, building: 220 };  // stuns and hurts, but never kills a healthy person on its own (the Electricity Missile is the killer)

const HYPER_GUNS = 4;  // different quantum weapons in every drop
function hyperDropItems() {
    const guns = [...HYPER_LOOT.weapons].sort(() => Math.random() - 0.5).slice(0, HYPER_GUNS);
    return [...guns, 'ammo', 'ammo', pick(HYPER_LOOT.shields), pick(HYPER_LOOT.grenades), pick(HYPER_LOOT.grenades), pick(HYPER_LOOT.packs), weightedPick(NADE2_TABLE), 'ammo'];
}

// ----- Shields: an energy layer that soaks damage before armor -----
function shieldAbsorb(t, dmg, attacker, weapon) {
    if (!(t.shield > 0)) return dmg;
    const take = Math.min(t.shield, dmg);
    t.shield -= take;
    t.shieldHit = G.time;
    if (inView(t.x, t.y, 60)) burst(t.x, t.y, 4, HYPER.neon, 160, 'glow');
    // The reflector sends part of every hit straight back at the shooter
    const S = ITEMS[t.shieldKind];
    if (S && S.reflect && attacker && attacker !== t && !attacker.dead && weapon !== 'Reflected' && attacker.hp !== undefined) damage(attacker, take * S.reflect, t, 'Reflected');
    if (t.shield <= 0 && t.isPlayer) addFloat(t.x, t.y - 40, 'SHIELD DOWN', HYPER.neon, true);
    return dmg - take;
}

function updatePerks(f, dt) {
    const S = ITEMS[f.shieldKind];
    if (S && S.regen && f.shield < f.shieldMax && G.time - (f.shieldHit || 0) > 4000) f.shield = Math.min(f.shieldMax, f.shield + S.regen * dt);
    if (f.perk === 'heal' && f.hp < (f.maxHp || CONFIG.MAX_HEALTH)) f.hp = Math.min(f.maxHp || CONFIG.MAX_HEALTH, f.hp + 2 * dt);
}

const stunned = f => G.time < (f.stunUntil || 0);

// ----- Weapons -----
// Tesla Cannon: the bolt arcs on to the nearest enemies after the first hit
// hit: who's already been zapped by this blast (each person is only hit once)
function chainLightning(from, owner, jumps, dmg, name = 'Tesla Cannon', hit = new Set()) {
    hit.add(from);
    let cur = from;
    for (let j = 0; j < jumps; j++) {
        let next = null, bd = 260;
        G.fgrid.query(cur.x, cur.y, 260, f => {
            if (f.dead || hit.has(f) || !foe(owner, f)) return;
            const d = Math.hypot(f.x - cur.x, f.y - cur.y);
            if (d < bd) { bd = d; next = f; }
        });
        if (!next) break;
        G.particles.push({ type: 'bolt', x: cur.x, y: cur.y, x2: next.x, y2: next.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 3, seed: Math.random() });
        damage(next, dmg, owner, name);
        hit.add(next);
        cur = next;
    }
}

// ----- Grenades -----
function shockBlast(x, y, owner) {
    G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: SHOCK.radius, color: HYPER.neon });
    burst(x, y, 30, HYPER.neon, 360, 'glow');
    const hits = [];
    G.fgrid.query(x, y, SHOCK.radius, f => { if (!f.dead && Math.hypot(f.x - x, f.y - y) < SHOCK.radius) hits.push(f); });
    const zapped = new Set(hits);
    for (const f of hits) {
        if (f === owner || !foe(owner, f)) continue;
        G.particles.push({ type: 'bolt', x, y, x2: f.x, y2: f.y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: 3, seed: Math.random() });
        // Fries shields outright, locks up whoever's caught in it, and arcs on to anyone standing near them
        f.shield = 0;
        f.stunUntil = G.time + SHOCK.stun;
        damage(f, SHOCK.damage, owner, 'Electric Grenade');
        if (!f.dead) chainLightning(f, owner, SHOCK.chain, SHOCK.damage * 0.5, 'Electric Grenade', zapped);
    }
    // Lightning comes down on any building in range: cracks, holes, and maybe the whole thing
    if (!G.world.floor) {
        for (const b of G.world.buildings) {
            if (b.collapsed || b.hq) continue;
            const nx = clamp(x, b.x0, b.x1), ny = clamp(y, b.y0, b.y1);
            if (Math.hypot(nx - x, ny - y) > SHOCK.radius) continue;
            for (let i = 0; i < 3; i++) { const hx = rand(b.x0 + 20, b.x1 - 20), hy = rand(b.y0 + 20, b.y1 - 20); G.particles.push({ type: 'bolt', x: hx + rand(-60, 60), y: hy - 700, x2: hx, y2: hy, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 4, seed: Math.random() }); }
        }
        damageBuildings(x, y, SHOCK.radius, SHOCK.building);
        // It sets off mines and fries any car caught in it
        for (const m of G.mines) if (!m.triggerAt && Math.hypot(m.x - x, m.y - y) < SHOCK.radius) triggerMine(m, rand(100, 500));
        const seen = new Set();
        for (const c of [...(G.world.cars || [])]) if (!c.dead && Math.hypot(c.x - x, c.y - y) < SHOCK.radius + vt(c).len * 0.4) surgeVehicle(c, owner, seen);
    }
    addDecal({ kind: 'scorch', x, y, r: SHOCK.radius * 0.5, life: 120000, tint: '0,180,255' });
    if (G.survival) for (const a of G.animals) if (!a.dead && Math.hypot(a.x - x, a.y - y) < SHOCK.radius) damageAnimal(a, SHOCK.damage, owner);
    Sound.tone(1800, 0.3, 'sawtooth', 0.12 * Sound.volAt(x, y), 200);
    if (inView(x, y, 300)) { G.flash = Math.max(G.flash, 0.25); G.flashColor = '0,229,255'; }
}

function clusterBlast(x, y, owner) {
    blast(x, y, owner, 170, 100, 'Cluster Bomb');
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + rand(-0.2, 0.2), d = rand(150, 340), T = 0.5;
        G.grenades.push({ type: 'bomblet', x, y, vx: Math.cos(a) * d / T, vy: Math.sin(a) * d / T, t: 0, T, H: 40, z: 0, fuse: T + 0.15 + i * 0.07, owner, landed: false, spin: rand(0, TAU) });
    }
}

// ----- Drawing -----
// The hyper crate: dark armored box with neon blue and teal light strips that pulse
function drawHyperCrate(s) {
    const t = G.time / 1000, pulse = 0.6 + Math.sin(t * 4) * 0.4;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(0,229,255,${0.18 * pulse})`;
    ctx.beginPath(); ctx.arc(0, 0, s * 1.9, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#05121c'; ctx.fillRect(-s - 3, -s - 3, s * 2 + 6, s * 2 + 6);
    ctx.fillStyle = '#0d2a3a'; ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.fillStyle = '#123c52'; ctx.fillRect(-s + 6, -s + 6, s * 2 - 12, s * 2 - 12);
    ctx.fillStyle = HYPER.teal; ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.fillRect(-s, -5, s * 2, 10);
    ctx.fillStyle = HYPER.neon; ctx.fillRect(-5, -s, 10, s * 2);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(0,245,212,${0.6 + pulse * 0.4})`; ctx.lineWidth = 3;
    ctx.strokeRect(-s - 1, -s - 1, s * 2 + 2, s * 2 + 2);
    ctx.fillStyle = '#e8ffff'; ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
}

function drawShieldBubble(f) {
    if (!(f.shield > 0) || lowDetail) return;
    const hit = clamp(1 - (G.time - (f.shieldHit || -1e9)) / 300, 0, 1), r = f.r + 9;
    ctx.save();
    ctx.globalAlpha = 0.25 + hit * 0.5;
    ctx.strokeStyle = ITEMS[f.shieldKind] && ITEMS[f.shieldKind].reflect ? '#b37dff' : HYPER.neon;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * TAU + G.time / 1500; i ? ctx.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r) : ctx.moveTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,229,255,0.08)'; ctx.fill();
    ctx.restore();
}

function drawStun(f) {
    if (!stunned(f) || !inView(f.x, f.y, 40)) return;
    ctx.strokeStyle = HYPER.neon; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        let a = Math.random() * TAU, x = f.x + Math.cos(a) * f.r, y = f.y + Math.sin(a) * f.r;
        ctx.moveTo(x, y);
        for (let k = 0; k < 3; k++) { a += rand(-1, 1); x += Math.cos(a) * 8; y += Math.sin(a) * 8; ctx.lineTo(x, y); }
    }
    ctx.stroke();
}

// Icons for the new grenades, shields and packs
function drawShockIcon(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#0d2a3a'; g.beginPath(); g.arc(0, 2, 11, 0, TAU); g.fill();
    g.strokeStyle = HYPER.neon; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#fff36a'; g.beginPath(); g.moveTo(2, -6); g.lineTo(-5, 3); g.lineTo(0, 3); g.lineTo(-2, 10); g.lineTo(5, 0); g.lineTo(0, 0); g.closePath(); g.fill();
    g.fillStyle = '#9aa3ae'; g.fillRect(-3, -12, 6, 4);
    g.restore();
}
function drawClusterIcon(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    for (const [bx, by] of [[-5, 4], [5, 4], [0, -3]]) { g.fillStyle = '#2b3a2b'; g.beginPath(); g.arc(bx, by, 6, 0, TAU); g.fill(); g.strokeStyle = HYPER.teal; g.lineWidth = 1.5; g.stroke(); }
    g.fillStyle = '#ff8a3d'; g.beginPath(); g.arc(0, -3, 2, 0, TAU); g.fill();
    g.restore();
}
function drawShieldIcon(g, key) {
    const reflect = key === 'shield2', over = key === 'shield3';
    g.fillStyle = '#05121c';
    g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU - Math.PI / 2; g.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); } g.closePath(); g.fill();
    g.strokeStyle = reflect ? '#b37dff' : over ? '#ffd166' : HYPER.neon; g.lineWidth = 3; g.stroke();
    g.fillStyle = reflect ? 'rgba(179,125,255,0.5)' : over ? 'rgba(255,209,102,0.45)' : 'rgba(0,229,255,0.45)';
    g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU - Math.PI / 2; g.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); } g.closePath(); g.fill();
}
function drawPackIcon(g, key) {
    roundRect(g, -11, -10, 22, 24, 6); g.fillStyle = '#0d2a3a'; g.fill();
    g.strokeStyle = HYPER.teal; g.lineWidth = 2; g.stroke();
    roundRect(g, -11, -10, 22, 10, 5); g.fillStyle = '#123c52'; g.fill();
    g.fillStyle = HYPER.neon;
    if (key === 'medpack') { g.fillRect(-2, 1, 4, 11); g.fillRect(-5.5, 4.5, 11, 4); }
    else if (key === 'jetpack') { g.fillStyle = '#ff8a3d'; g.beginPath(); g.moveTo(-6, 14); g.lineTo(-3, 22); g.lineTo(0, 14); g.moveTo(1, 14); g.lineTo(4, 22); g.lineTo(7, 14); g.fill(); g.fillStyle = HYPER.neon; g.fillRect(-7, 2, 5, 10); g.fillRect(2, 2, 5, 10); }
    else { for (let i = -1; i <= 1; i++) g.fillRect(i * 5 - 1.5, 2, 3, 9); }
}

// ---------- Drivable vehicles: on every battlefield, F to get in and out ----------
// Each kind handles differently. The tank and the gun jeep fire where you aim; the truck carries your friends;
// the bulldozer and tank smash through walls; the helicopter flies over everything; the boat lives on the water.
const VTYPES = {
    car: { name: 'Car', len: 84, wid: 42, accel: 540, brake: 950, max: 660, reverse: 230, turn: 2.7, hp: 380, ram: 0.13, share: 0.25 },
    bike: { name: 'Motorbike', len: 52, wid: 18, accel: 820, brake: 1100, max: 840, reverse: 160, turn: 3.6, hp: 140, ram: 0.09, share: 1 },
    gunjeep: { name: 'Gun Jeep', len: 78, wid: 40, accel: 500, brake: 900, max: 600, reverse: 220, turn: 2.6, hp: 520, ram: 0.14, share: 0.4, gun: { weapon: 'Heavy MG', rate: 90, dmg: 16 } },
    tank: { name: 'Tank', len: 104, wid: 62, accel: 260, brake: 600, max: 270, reverse: 140, turn: 1.4, hp: 1800, ram: 0.35, share: 0.08, crush: true, cannon: { rate: 1700 } },
    truck: { name: 'Armored Truck', len: 108, wid: 56, accel: 380, brake: 800, max: 480, reverse: 180, turn: 1.9, hp: 950, ram: 0.2, share: 0.15, seats: 4 },
    quad: { name: 'Quad Bike', len: 56, wid: 34, accel: 700, brake: 1000, max: 600, reverse: 200, turn: 3.2, hp: 220, ram: 0.1, share: 0.8, offroad: true },
    heli: { name: 'Helicopter', len: 110, wid: 60, accel: 420, brake: 700, max: 720, reverse: 300, turn: 2.2, hp: 500, ram: 0, share: 0.3, fly: true },
    boat: { name: 'Speedboat', len: 70, wid: 30, accel: 600, brake: 800, max: 700, reverse: 200, turn: 2.6, hp: 300, ram: 0.1, share: 0.6, water: true },
    dozer: { name: 'Bulldozer', len: 96, wid: 60, accel: 220, brake: 600, max: 230, reverse: 120, turn: 1.5, hp: 1500, ram: 0.3, share: 0.15, crush: true, walls: true },
    supercar: { name: 'Supercar', len: 88, wid: 40, accel: 950, brake: 1300, max: 1020, reverse: 260, turn: 2.9, hp: 260, ram: 0.16, share: 0.3 },
    icecream: { name: 'Ice-Cream Truck', len: 96, wid: 48, accel: 380, brake: 800, max: 430, reverse: 180, turn: 2.0, hp: 520, ram: 0.15, share: 0.25, music: true },
    // High-tech: only from vehicle drops
    hovertank: { name: 'Hover Tank', len: 100, wid: 64, accel: 460, brake: 800, max: 540, reverse: 320, turn: 2.3, hp: 2400, ram: 0.3, share: 0.05, hover: true, cannon: { rate: 550, plasma: true }, tech: true },
    jetbike: { name: 'Jet Bike', len: 60, wid: 24, accel: 1300, brake: 1400, max: 1250, reverse: 300, turn: 3.8, hp: 320, ram: 0.12, share: 0.6, hover: true, boost: true, tech: true },
    mech: { name: 'Battle Mech', len: 70, wid: 70, accel: 320, brake: 700, max: 270, reverse: 220, turn: 2.8, hp: 3200, ram: 0.25, share: 0.05, crush: true, gun: { weapon: 'Minigun', rate: 50, dmg: 15, twin: true }, tech: true },
    stealth: { name: 'Stealth Buggy', len: 80, wid: 44, accel: 820, brake: 1100, max: 840, reverse: 260, turn: 3.0, hp: 760, ram: 0.15, share: 0.2, stealth: true, rockets: { rate: 650 }, tech: true },
    // Revolution: a heavy gun dug in behind sandbags. It doesn't move; it turns to wherever you aim
    // Revolution: a stone guard tower on the base wall with a cannon on top
    bigtower: { name: 'Castle Tower', len: 460, wid: 460, accel: 0, brake: 1, max: 0, reverse: 0, turn: 0, hp: 6000, ram: 0, share: 0, fixed: true, tower: true, round: true, cannon: { rate: 650, dmg: 320, speed: 2000, range: 2800, blastR: 200, blastDmg: 220 } },
    tower: { name: 'Guard Tower', len: 92, wid: 92, accel: 0, brake: 1, max: 0, reverse: 0, turn: 0, hp: 3000, ram: 0, share: 0, fixed: true, tower: true, cannon: { rate: 1300, dmg: 130, speed: 1400, range: 2400 } },
    cannon: { name: 'Cannon', len: 64, wid: 56, accel: 0, brake: 1, max: 0, reverse: 0, turn: 0, hp: 1400, ram: 0, share: 0, fixed: true, cannon: { rate: 1500, dmg: 120, speed: 1300, range: 2200 } },
    // Early Warfare: no engines. A horse to ride, and a horse-drawn wagon that carries your friends in the back
    horse: { name: 'Horse', len: 70, wid: 26, accel: 720, brake: 1000, max: 740, reverse: 140, turn: 3.3, hp: 260, ram: 0.1, share: 0.8, offroad: true, animal: true },
    wagon: { name: 'Wagon', len: 124, wid: 46, accel: 300, brake: 700, max: 430, reverse: 120, turn: 1.7, hp: 700, ram: 0.18, share: 0.2, seats: 4, animal: true },
    gunship: { name: 'Gunship', len: 120, wid: 70, accel: 450, brake: 700, max: 660, reverse: 300, turn: 2.1, hp: 1500, ram: 0, share: 0.1, fly: true, gun: { weapon: 'Heavy MG', rate: 70, dmg: 18 }, rockets: { rate: 1400 }, tech: true }
};
const CAR = VTYPES.car;
const HORSE_COLORS = ['#7a4a2a', '#5a3a22', '#b98a5e', '#3a2a20', '#e2d8c6', '#8a6a4a', '#2a2420'];
const WAGON_COLORS = ['#efe6d0', '#ddd0ad', '#cdbb92'];
const animalColor = type => pick(type === 'wagon' ? WAGON_COLORS : HORSE_COLORS);
const DRIVE_COLORS = ['#d63031', '#0984e3', '#fdcb6e', '#00b894', '#e17055', '#2d3436', '#dfe6e9', '#6c5ce7'];

function spawnCars() {
    const cars = G.world.cars = [];
    const city = !!G.world.city, maze = G.world.terrain === 'maze', mountain = G.world.terrain === 'mountain';
    // How many of each kind, before scaling for the map size
    const tech = G.hightech;
    const mix = { car: tech ? 8 : maze ? 12 : mountain ? 12 : 26, bike: 10, gunjeep: 5, tank: 3, truck: 5, quad: mountain ? 15 : 8, heli: 2.5, dozer: maze ? 7 : 5, supercar: city ? 3 : 1, icecream: city ? 2 : 1 };
    if (tech) { for (const k in mix) mix[k] = 0; Object.assign(mix, { hovertank: 6, jetbike: 12, mech: 4, stealth: 6, gunship: 4 }); }
    else if (G.heavy) Object.assign(mix, { tank: 8, gunjeep: 12, truck: 8, heli: 4 });
    if (G.early) { for (const k in mix) mix[k] = 0; Object.assign(mix, { horse: maze ? 14 : 30, wagon: maze ? 4 : 9 }); }
    const place = (type, s) => {
        const T = VTYPES[type];
        const a = city || maze ? randInt(0, 3) * Math.PI / 2 : rand(0, TAU);
        const c = { type, x: s.x, y: s.y, a, speed: 0, hp: T.hp, color: T.animal ? animalColor(type) : type === 'tank' || type === 'gunjeep' || type === 'truck' ? '#4f5d33' : type === 'icecream' ? '#f4f0ff' : type === 'dozer' ? '#e8b13a' : type === 'supercar' ? pick(['#ff2d55', '#ffcc00', '#00e0ff']) : pick(DRIVE_COLORS), driver: null, riders: [], dead: false, box: null, braking: false, fireAt: 0, turret: a };
        parkCar(c);
        cars.push(c);
    };
    for (const [type, n0] of Object.entries(mix)) {
        const n = Math.round(n0 * MAP_AREA);
        for (let i = 0, tries = 0; i < n && tries < n * 40; tries++) {
            const s = findSpawn(null, 0);
            const T = VTYPES[type];
            if (blockedAt(G.world.grid, s.x, s.y, T.len * 0.8) || buildingAt(s.x, s.y, 40) || (G.world.ponds && inPond(s))) continue;
            place(type, s);
            i++;
        }
    }
    // Boats sit on the ponds
    if (!tech && !G.early) for (const pd of G.world.ponds || []) if (Math.random() < 0.6) place('boat', { x: pd.x, y: pd.y });
}

const vt = c => VTYPES[c.type];

// A parked vehicle is a solid obstacle (an axis-aligned box roughly its shape). Helicopters and boats don't block anyone
function parkCar(c) {
    if (vt(c).round) return;  // (a castle guard tower: its rooms below are walkable, its walls do the blocking)
    const T = vt(c), side = Math.abs(Math.sin(c.a)) > 0.7;
    c.box = { type: 'crate', drivecar: c, x: c.x, y: c.y, hw: (side ? T.wid : T.len) / 2, hh: (side ? T.len : T.wid) / 2 };
    if (!T.water) G.world.grid.insertBox(c.box);
}
function unparkCar(c) { if (c.box) { G.world.grid.removeBox(c.box); c.box = null; } }

function nearestCar(p, range, landOnly = false) {
    let best = null, bd = range;
    for (const c of G.world.cars || []) {
        if (c.dead || c.driver || (landOnly && vt(c).water)) continue;
        const d = Math.hypot(c.x - p.x, c.y - p.y) - (vt(c).round ? vt(c).len / 2 + 70 : vt(c).len * 0.3);  // (a big round tower: anywhere round its edge)
        if (d < bd) { bd = d; best = c; }
    }
    return best;
}

function enterCar(p, c) {
    if (c.type === 'bigtower' && c.tower && !c.tower.fallen && p.up !== c.tower) return;  // the corner guns: only from the balcony
    if (p.up && c.tower === p.up) { p.towerUp = p.up; p.up = null; }  // climbing into a corner gun from the walkway
    unparkCar(c);
    c.driver = p;
    p.car = c;
    if (p.healing) cancelHeal(p);
    p.x = c.x; p.y = c.y;
    // The armored truck: friends nearby pile in the back
    const T = vt(c);
    if (T.seats) {
        for (const f of G.fighters) {
            if (c.riders.length >= T.seats || f === p || f.dead || f.car || isHuman(f) || foe(p, f) || dist(f, c) > 260) continue;
            f.car = c; f.riding = true; c.riders.push(f);
        }
        if (c.riders.length && p.isPlayer) addFloat(c.x, c.y - 50, `${c.riders.length} aboard`, '#fff7ec');
    }
    if (p.isPlayer) addFloat(c.x, c.y - 40, T.name, '#fff7ec');
    else { p.driveUntil = p.tanker ? Infinity : G.time + rand(30000, 75000); p.driveGoal = null; p.stuckFor = 0; }
    if (T.animal) Sound.tone(620, 0.3, 'triangle', 0.08, 420);  // a whinny, not an engine
    else Sound.tone(T.fly ? 70 : 110, 0.4, 'sawtooth', 0.08, T.fly ? 90 : 160);
}

function exitCar(p) {
    const c = p.car;
    if (!c) return;
    if (p.towerUp) {
        // Back out onto the walkway, on the inside of the tower
        const b = p.towerUp, a = Math.atan2(b.c.y - c.y, b.c.x - c.x);
        p.towerUp = null; p.up = b; p.car = null; c.driver = null;
        p.x = c.x + Math.cos(a) * (vt(c).len / 2 + 50); p.y = c.y + Math.sin(a) * (vt(c).len / 2 + 50); p.vx = p.vy = 0;
        return;
    }
    const T = vt(c), out = Math.max(T.wid / 2 + 26, 40);
    const spots = [c.a - Math.PI / 2, c.a + Math.PI / 2, c.a + Math.PI, c.a].map(a => ({ x: c.x + Math.cos(a) * out, y: c.y + Math.sin(a) * out }));
    // Out of a boat you swim for the nearest shore spot; out of a helicopter you just drop
    const s = spots.find(q => !blockedAt(G.world.grid, q.x, q.y, p.r)) || spawnNear(c, 140, p.r) || spots[0];
    p.x = s.x; p.y = s.y; p.vx = p.vy = 0;
    p.car = null;
    c.driver = null;
    c.speed = 0;
    c.auto = null;  // a route you set doesn't carry on without you
    for (const f of c.riders) { const q = spawnNear(c, 120, f.r); f.x = q.x; f.y = q.y; f.car = null; f.riding = false; f.nextThink = G.time; }
    c.riders = [];
    if (!c.dead) parkCar(c);
}

function inCar(c, x, y, pad = 0) {
    const T = vt(c), dx = x - c.x, dy = y - c.y, ca = Math.cos(-c.a), sa = Math.sin(-c.a);
    const lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
    return Math.abs(lx) < T.len / 2 + pad && Math.abs(ly) < T.wid / 2 + pad;
}

// Rough ground slows everything but the quad (mountain rock and snow)
function terrainDrag(c) {
    if (vt(c).offroad || vt(c).fly || vt(c).hover || !G.world.height) return 1;
    const h = G.world.height(c.x, c.y);
    return h > 0.7 ? 0.55 : h > 0.55 ? 0.75 : 1;
}

function updateCars(dt) {
    for (const c of G.world.cars || []) {
        if (c.dead || !c.driver) continue;
        const p = c.driver, T = vt(c);
        if (p.dead) { exitCar(p); continue; }
        let up, down, left, right;
        const I = inputOf(p), keys = I.keys;
        if (isHuman(p)) {
            up = keys.has('KeyW') || keys.has('ArrowUp'); down = keys.has('KeyS') || keys.has('ArrowDown');
            left = keys.has('KeyA') || keys.has('ArrowLeft'); right = keys.has('KeyD') || keys.has('ArrowRight');
        } else {
            const k = botDrive(c, p, dt);
            if (!k) continue;  // the bot got out
            ({ up, down, left, right } = k);
        }
        const drive = (G.mode === 'playing' || !isHuman(p)) && !G.frozen && !stunned(p);
        // The jet bike's boost (hold Shift)
        const boost = T.boost && isHuman(p) && (keys.has('ShiftLeft') || keys.has('ShiftRight'));
        const top = T.max * terrainDrag(c) * (boost ? 1.45 : 1);
        if (boost && (up || down || left || right) && inView(c.x, c.y, 60)) G.particles.push({ type: 'glow', x: c.x - Math.cos(c.a) * T.len / 2, y: c.y - Math.sin(c.a) * T.len / 2, vx: -Math.cos(c.a) * 200, vy: -Math.sin(c.a) * 200, life: 0.3, max: 0.3, size: 6, color: TECH_DROP.neon });
        c.braking = false;
        const dirX = (right ? 1 : 0) - (left ? 1 : 0), dirY = (down ? 1 : 0) - (up ? 1 : 0);
        const a0 = c.a;
        if (isHuman(p) && !T.fixed) {
            if (dirX || dirY) c.auto = null;  // touching the keys takes the wheel back
            const auto = c.auto && drive ? autoDrive(c, T, dt, top) : null;
            if (auto) {
                c.a += clamp(angleDiff(c.a, auto.want), -6 * dt, 6 * dt);
                const goal = auto.reverse ? -T.reverse * 0.7 : auto.speed * Math.max(0.15, Math.cos(angleDiff(c.a, auto.want)));
                if (c.speed < goal) c.speed = Math.min(goal, c.speed + (c.speed < 0 ? T.brake : T.accel) * dt);
                else { c.speed = Math.max(goal, c.speed - T.brake * dt); c.braking = goal < c.speed - 20; }
            }
            // You drive the way you press, like walking: the vehicle swings round to face that way and goes
            else if (drive && (dirX || dirY)) {
                const want = Math.atan2(dirY, dirX);
                c.a += clamp(angleDiff(c.a, want), -10 * dt, 10 * dt);
                const facing = Math.cos(angleDiff(c.a, want));  // full throttle once it's pointing the right way
                c.speed = Math.min(top, c.speed + (c.speed < 0 ? T.brake : T.accel * (boost ? 1.6 : 1) * Math.max(0.25, facing)) * dt);
            } else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), (T.fly ? 200 : 300) * dt);
            if (c.speed > top) c.speed = Math.max(top, c.speed - T.brake * dt);
        } else {
            if (drive && up) c.speed = Math.min(top, c.speed + (c.speed < 0 ? T.brake : T.accel * (boost ? 1.6 : 1)) * dt);
            else if (drive && down) { if (c.speed > 0) { c.speed = Math.max(0, c.speed - T.brake * dt); c.braking = true; } else c.speed = Math.max(-T.reverse, c.speed - T.accel * 0.6 * dt); }
            else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), (T.fly ? 200 : 300) * dt);
            if (c.speed > top) c.speed = Math.max(top, c.speed - T.brake * dt);
            const steer = drive ? (right ? 1 : 0) - (left ? 1 : 0) : 0;
            c.a += steer * T.turn * dt * (T.fly ? 1 : clamp(c.speed / 260, -1, 1));
        }
        // Don't swing the body round into something solid (that wedges it in for good)
        if (isHuman(p) && c.a !== a0 && !T.fly && !T.water && poseBlocked(c, T, c.x, c.y, c.a) && !poseBlocked(c, T, c.x, c.y, a0)) c.a = a0;
        const nx = c.x + Math.cos(c.a) * c.speed * dt, ny = c.y + Math.sin(c.a) * c.speed * dt;
        const ca = Math.cos(c.a), sa = Math.sin(c.a), W = CONFIG.WORLD_SIZE;
        const probes = [[T.len / 2, 0], [T.len / 2, T.wid / 2 - 4], [T.len / 2, -T.wid / 2 + 4], [-T.len / 2, T.wid / 2 - 4], [-T.len / 2, -T.wid / 2 + 4]];
        const pts = probes.map(([lx, ly]) => ({ x: nx + lx * ca - ly * sa, y: ny + lx * sa + ly * ca }));
        let blocked = nx < 50 || ny < 50 || nx > W - 50 || ny > W - 50;
        if (!blocked && T.water) blocked = pts.some(q => !inPond(q));
        else if (!blocked && !T.fly) {
            // The tank and the bulldozer flatten what's in front of them (the dozer even goes through walls)
            if (T.crush && c.speed > 0) crushAhead(c, pts);
            blocked = pts.some(q => blockedAt(G.world.grid, q.x, q.y, 5));
            if (!blocked && !T.hover && G.world.ponds && pts.some(q => inPond(q))) c.speed *= 0.9;  // wheels in the water bog down (hovercraft skim over)
        }
        if (blocked) {
            if (Math.abs(c.speed) > 300) {
                damageCar(c, Math.abs(c.speed) * 0.09, null);
                if (!c.dead) damage(p, Math.abs(c.speed) * 0.02, null, 'Crash');
                burst(c.x + ca * T.len / 2, c.y + sa * T.len / 2, 10, '#c9ced6', 220);
                Sound.thud(Sound.volAt(c.x, c.y));
            }
            c.speed = -c.speed * 0.25;
        } else { c.x = nx; c.y = ny; }
        if (c.dead) continue;
        if (!T.fly && T.ram && Math.abs(c.speed) > 120) {
            const hitOne = (f, dmgFn) => {
                if (G.time - (f.ramAt || 0) < 500 || !inCar(c, f.x, f.y, f.r)) return;
                f.ramAt = G.time;
                const a = Math.atan2(f.y - c.y, f.x - c.x), k = Math.abs(c.speed);
                f.kx = (f.kx || 0) + Math.cos(a) * k * 1.4; f.ky = (f.ky || 0) + Math.sin(a) * k * 1.4;
                dmgFn(f, k * T.ram + (T.crush ? 60 : 0));
                c.speed *= T.crush ? 0.97 : 0.85;
                burst(f.x, f.y, 8, '#a3121e', 200, 'blood');
                Sound.thud(Sound.volAt(f.x, f.y));
            };
            G.fgrid.query(c.x, c.y, T.len, f => { if (!f.dead && f !== p && !f.riding) hitOne(f, (t, d) => damage(t, d, p, T.name)); });
            if (G.survival && G.agrid) G.agrid.query(c.x, c.y, T.len, a => { if (!a.dead) hitOne(a, (t, d) => damageAnimal(t, d, p)); });
        }
        // Mounted weapons fire where you aim
        if ((T.gun || T.cannon || T.rockets) && isHuman(p)) {
            const m = I.world();
            c.turret = Math.atan2(m.y - c.y, m.x - c.x);
            if (I.mouse.down && drive && G.time >= c.fireAt) vehicleFire(c, p);
        }
        // The ice-cream truck plays its tune (and everyone hears it)
        if (T.music && Math.abs(c.speed) > 30 && G.time >= (c.tuneAt || 0)) {
            const tune = [784, 659, 784, 880, 784, 659, 523, 587];
            c.tuneStep = ((c.tuneStep || 0) + 1) % tune.length;
            c.tuneAt = G.time + 220;
            Sound.tone(tune[c.tuneStep], 0.16, 'triangle', 0.07 * Sound.volAt(c.x, c.y));
        }
        p.x = c.x; p.y = c.y; p.vx = 0; p.vy = 0;
        p.angle = T.gun || T.cannon || T.rockets ? c.turret : c.a;
        for (const f of c.riders) { f.x = c.x; f.y = c.y; f.vx = f.vy = 0; }
        if (T.fly && inView(c.x, c.y, 200) && Math.random() < dt * 20) G.particles.push({ type: 'smoke', x: c.x + rand(-60, 60), y: c.y + rand(-60, 60), vx: rand(-60, 60), vy: rand(-60, 60), life: 0.6, max: 0.6, size: rand(8, 14), color: '200,190,170' });
        if (T.water && Math.abs(c.speed) > 100 && Math.random() < dt * 25) G.particles.push({ type: 'glow', x: c.x - ca * T.len / 2, y: c.y - sa * T.len / 2, vx: -ca * 80 + rand(-40, 40), vy: -sa * 80 + rand(-40, 40), life: 0.5, max: 0.5, size: rand(3, 6), color: '#d8f1ff' });
        if (c.hp < T.hp * 0.4 && !T.animal && inView(c.x, c.y, 60) && Math.random() < dt * 12) G.particles.push({ type: 'smoke', x: c.x + ca * 30, y: c.y + sa * 30, vx: rand(-15, 15), vy: rand(-50, -25), life: 1.6, max: 1.6, size: rand(8, 14), color: c.hp < T.hp * 0.2 ? '40,36,40' : '160,160,160' });
    }
}

// Tank and bulldozer: crates, cars, wrecks, rubble, trees and rocks in the way are flattened; the dozer takes walls too
function crushAhead(c, pts) {
    const T = vt(c);
    const gone = new Set();
    for (const q of pts.slice(0, 3)) G.world.grid.query(q.x, q.y, 20, o => {
        if (gone.has(o) || o.baked || o.mazeWall && !T.walls) return;
        const hit = isBox(o) ? Math.abs(q.x - o.x) < o.hw + 6 && Math.abs(q.y - o.y) < o.hh + 6 : Math.hypot(q.x - o.x, q.y - o.y) < (o.r || 0) + 6;
        if (!hit) return;
        if (o.drivecar) { damageCar(o.drivecar, 400, c.driver); return; }
        if (o.type === 'box') { breakBox(o); return; }
        if (o.type === 'wall' && !T.walls) return;
        if (o.type === 'wall' && o.hw * o.hh > 6000 && !o.sandbags) {
            // A long wall: knock a chunk out of it where we hit instead of deleting the whole thing
            o.hp = (o.hp || 3) - 1;
            if (o.hp > 0) { c.speed *= 0.3; burst(q.x, q.y, 10, '#a8a39a', 200); return; }
        }
        gone.add(o);
    });
    for (const o of gone) {
        o.broken = true;
        if (o.type === 'tree' || o.type === 'rock' || o.type === 'bush') G.world.grid.remove(o); else G.world.grid.removeBox(o);
        burst(o.x, o.y, 14, o.type === 'tree' ? '#3f8a3a' : '#9a948a', 240);
        Sound.crunch(Sound.volAt(o.x, o.y));
        c.speed *= 0.85;
    }
}

function vehicleFire(c, p) {
    if (c.type === 'bigtower') { lobShot(c, p); return; }
    const T = vt(c), a = c.turret, mx = c.x + Math.cos(a) * (T.len * 0.55), my = c.y + Math.sin(a) * (T.len * 0.55);
    c.firedAt = G.time;
    if (T.rockets && (!T.gun || (c.rocketAt || 0) <= G.time)) {
        // Rocket pods: alternate sides
        c.side = -(c.side || 1);
        const ox = -Math.sin(a) * 14 * c.side, oy = Math.cos(a) * 14 * c.side;
        G.bullets.push({ x: mx + ox, y: my + oy, vx: Math.cos(a) * 950, vy: Math.sin(a) * 950, dmg: 40, owner: p, left: 1400, weapon: 'Rocket Pod', heavy: true, rocket: true });
        Sound.shot('heavy', Sound.volAt(c.x, c.y) * 0.8);
        if (T.gun) c.rocketAt = G.time + T.rockets.rate; else { c.fireAt = G.time + T.rockets.rate; return; }
    }
    if (T.cannon && T.cannon.plasma) {
        // Plasma cannon: fast, heavy, glowing bolts
        c.fireAt = G.time + T.cannon.rate;
        G.bullets.push({ x: mx, y: my, vx: Math.cos(a) * 2200, vy: Math.sin(a) * 2200, dmg: 75, owner: p, left: 1700, weapon: 'Plasma Rifle', heavy: true });
        G.particles.push({ type: 'flash', x: mx, y: my, vx: 0, vy: 0, life: 0.08, max: 0.08, size: 30, angle: a });
        burst(mx, my, 6, HYPER.neon, 200, 'glow');
        Sound.tone(260, 0.15, 'sawtooth', 0.1 * Sound.volAt(c.x, c.y), 900);
        return;
    }
    if (T.gun && T.gun.twin) {
        c.fireAt = G.time + T.gun.rate;
        c.side = -(c.side || 1);
        const sp = a + rand(-0.05, 0.05), ox = -Math.sin(a) * 18 * c.side, oy = Math.cos(a) * 18 * c.side;
        G.bullets.push({ x: mx + ox, y: my + oy, vx: Math.cos(sp) * 1700, vy: Math.sin(sp) * 1700, dmg: T.gun.dmg, owner: p, left: 1300, weapon: T.gun.weapon });
        Sound.shot('mid', Sound.volAt(c.x, c.y) * 0.7);
        return;
    }
    if (T.cannon) {
        const C = T.cannon;
        c.fireAt = G.time + C.rate;
        // (shells from a base's own guns fly over that base's walls)
        G.bullets.push({ x: mx, y: my, vx: Math.cos(a) * (C.speed || 1100), vy: Math.sin(a) * (C.speed || 1100), dmg: C.dmg || 60, owner: p, left: c.reach || C.range || 1600, weapon: T.fixed ? 'Cannon' : 'Tank Shell', heavy: true, rocket: true, over: c.base || null, blastR: C.blastR, blastDmg: C.blastDmg });
        G.particles.push({ type: 'flash', x: mx, y: my, vx: 0, vy: 0, life: 0.1, max: 0.1, size: T.fixed ? 60 : 40, angle: a });
        if (T.fixed && inView(mx, my, 100)) for (let i = 0; i < 6; i++) G.particles.push({ type: 'smoke', x: mx, y: my, vx: Math.cos(a) * rand(40, 140) + rand(-30, 30), vy: Math.sin(a) * rand(40, 140) + rand(-30, 30), life: rand(0.8, 1.4), max: 1.4, size: rand(10, 18), color: '190,185,175' });
        Sound.shot('heavy', Sound.volAt(c.x, c.y));
        if (!T.fixed) c.speed -= Math.cos(a - c.a) * 60;
    } else {
        c.fireAt = G.time + T.gun.rate;
        const sp = a + rand(-0.05, 0.05);
        G.bullets.push({ x: mx, y: my, vx: Math.cos(sp) * 1800, vy: Math.sin(sp) * 1800, dmg: T.gun.dmg, owner: p, left: 1500, weapon: T.gun.weapon });
        G.particles.push({ type: 'flash', x: mx, y: my, vx: 0, vy: 0, life: 0.06, max: 0.06, size: 22, angle: a });
        Sound.shot('mid', Sound.volAt(c.x, c.y));
    }
}


function damageCar(c, dmg, by) {
    if (c.dead) return;
    c.hp -= dmg;
    c.hitAt = G.time;
    if (c.hp <= 0) explodeCar(c, by);
}

function explodeCar(c, by) {
    if (c.dead) return;
    c.dead = true;
    const p = c.driver, T = vt(c);
    if (p) exitCar(p);
    unparkCar(c);
    if (T.animal) { animalDown(c); return; }
    // The blast goes off before the burnt shell is there to soak it up (it was shielding everyone from it)
    const big = T.hp > 900 ? 1.5 : 1;
    blast(c.x, c.y, by, 200 * big, 110 * big, `${T.name} explosion`);
    if (!T.water) {
        const side = Math.abs(Math.sin(c.a)) > 0.7;
        // The wreck keeps the shape of what it was, lying square to its box
        const wa = side ? (Math.sin(c.a) > 0 ? Math.PI / 2 : -Math.PI / 2) : (Math.cos(c.a) > 0 ? 0 : Math.PI);
        const wreck = { type: 'crate', car: true, wreck: true, x: c.x, y: c.y, hw: (side ? T.wid : T.len) / 2, hh: (side ? T.len : T.wid) / 2, color: c.color, horiz: !side, burnUntil: Infinity, driven: c.type, wa };
        G.world.obstacles.push(wreck);
        G.world.grid.insertBox(wreck);
        addFire(c.x, c.y, Math.min(70, T.len * 0.35), 12000);
    }
    for (let i = 0; i < 14; i++) { const a = rand(0, TAU), sp = rand(150, 420); G.particles.push({ type: 'chunk', x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.6, 1.1), max: 1.1, size: rand(5, 10), color: pick([c.color, '#2a2a2a', '#555']), rot: rand(0, TAU), spin: rand(-14, 14) }); }
}

// ----- Drive-to: right-click (or click, in a vehicle with no gun) a spot and the vehicle takes itself there -----
// It plans a route round walls, buildings and parked vehicles on a coarse grid sized to the vehicle, follows it
// corner to corner, slows to stop on the spot, and backs up and re-plans if it gets stuck
const AUTO = { cell: 50, pad: 500, max: 340, budget: 40000 };
// Would the vehicle's nose or corners be inside something at this spot and heading? (the same points driving checks)
function poseBlocked(c, T, x, y, a) {
    const ca = Math.cos(a), sa = Math.sin(a);
    return [[T.len / 2, 0], [T.len / 2, T.wid / 2 - 4], [T.len / 2, -T.wid / 2 + 4], [-T.len / 2, T.wid / 2 - 4], [-T.len / 2, -T.wid / 2 + 4]]
        .some(([lx, ly]) => blockedAt(G.world.grid, x + lx * ca - ly * sa, y + lx * sa + ly * ca, 5));
}
function setDriveGoal(c, x, y) {
    const W = CONFIG.WORLD_SIZE;
    c.auto = { x: clamp(x, 80, W - 80), y: clamp(y, 80, W - 80), path: null, i: 0, checkAt: G.time + 1200, from: { x: c.x, y: c.y }, backUntil: 0, tries: 0 };
}
function planDrive(c, T) {
    const a = c.auto;
    a.i = 0;
    if (T.fly || T.water) { a.path = [{ x: a.x, y: a.y }]; return; }
    const reach = Math.max(60, T.len * 0.5);
    let path = null;
    // Roomy first; squeeze through tighter gaps only if that's the only way; failing that, get as close as possible
    // (each time it's got stuck, it looks for a roomier way round that corner)
    for (const clear of [T.wid / 2 + 14 + a.tries * 12, T.wid / 2 + 14, T.wid / 2 + 4]) if (!path) path = findPath(c, a.x, a.y, reach, { ...AUTO, clear });
    if (!path) path = findPath(c, a.x, a.y, reach, { ...AUTO, clear: T.wid / 2 + 4, closest: true });
    a.routed = !!(path && path.length);
    a.path = a.routed ? path : [{ x: a.x, y: a.y }];  // no route at all: head straight for it and feel the way
    const end = a.path[a.path.length - 1];
    if (Math.hypot(end.x - a.x, end.y - a.y) > 5) { a.x = end.x; a.y = end.y; }  // the closest reachable spot becomes the goal
}
function autoDrive(c, T, dt, top) {
    const a = c.auto;
    if (!a.path) planDrive(c, T);
    const arrive = Math.max(55, T.len * 0.45), dGoal = Math.hypot(a.x - c.x, a.y - c.y);
    if (dGoal < arrive) { c.auto = null; return null; }
    // Backing out of a tight spot after getting stuck
    if (G.time < a.backUntil) return { want: c.a, speed: 0, reverse: true };
    // Corner by corner: move on once we're close to this one (or it's behind us and the next is in sight)
    let wp = a.path[a.i];
    while (a.i < a.path.length - 1 && Math.hypot(wp.x - c.x, wp.y - c.y) < Math.max(45, T.wid)) wp = a.path[++a.i];
    let want = Math.atan2(wp.y - c.y, wp.x - c.x);
    if (!T.fly && !a.routed) {
        const look = T.len / 2 + 30 + Math.abs(c.speed) * 0.25;
        const free = ang => !blockedAt(G.world.grid, c.x + Math.cos(ang) * look, c.y + Math.sin(ang) * look, T.wid * 0.45);
        if (!free(want)) for (const off of [0.35, -0.35, 0.7, -0.7, 1.1, -1.1]) if (free(want + off)) { want += off; break; }
    }
    // Ease off for sharp turns and coming in to stop
    const dWp = Math.hypot(wp.x - c.x, wp.y - c.y), last = a.i === a.path.length - 1;
    let speed = Math.min(top, last ? 60 + dGoal * 1.4 : 90 + dWp * 1.5);
    // Stuck: hardly moved for a while, so back up and plan again from here
    if (G.time >= a.checkAt) {
        const moved = Math.hypot(c.x - a.from.x, c.y - a.from.y);
        a.checkAt = G.time + 1200; a.from = { x: c.x, y: c.y };
        if (moved < 40) {
            if (++a.tries > 5) { c.auto = null; return null; }  // give up rather than grind forever
            a.backUntil = G.time + 700; a.path = null;
        } else a.tries = 0;
    }
    return { want, speed, reverse: false };
}

// The route you set: a dotted line through its corners and a marker on the spot
function drawDriveRoute() {
    const p = G.player, c = p && !p.dead && p.car;
    if (!c || !c.auto) return;
    const a = c.auto, pts = [{ x: c.x, y: c.y }, ...(a.path ? a.path.slice(a.i) : [{ x: a.x, y: a.y }])];
    ctx.save();
    ctx.strokeStyle = 'rgba(255,214,90,0.75)'; ctx.lineWidth = 4; ctx.setLineDash([14, 12]); ctx.lineDashOffset = -G.time / 30;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y); ctx.stroke();
    ctx.setLineDash([]);
    const pulse = 1 + Math.sin(G.time / 180) * 0.12;
    ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(a.x, a.y, 30 * pulse, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,214,90,0.25)'; ctx.beginPath(); ctx.arc(a.x, a.y, 30 * pulse, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd65a'; ctx.beginPath(); ctx.arc(a.x, a.y, 6, 0, TAU); ctx.fill();
    ctx.restore();
}

// A horse that's killed falls where it was; a wagon that's smashed breaks apart into a heap of planks
function animalDown(c) {
    const T = vt(c);
    if (c.type === 'horse') {
        addDecal({ kind: 'deadhorse', x: c.x, y: c.y, a: c.a, color: c.color, life: 1e12 });
        burst(c.x, c.y, 24, '#a3121e', 220, 'blood');
        bloodSplat(c.x, c.y, c.a, 1.4);
        Sound.thud(Sound.volAt(c.x, c.y));
        return;
    }
    const side = Math.abs(Math.sin(c.a)) > 0.7, wa = side ? (Math.sin(c.a) > 0 ? Math.PI / 2 : -Math.PI / 2) : (Math.cos(c.a) > 0 ? 0 : Math.PI);
    const wreck = { type: 'crate', car: true, wreck: true, x: c.x, y: c.y, hw: (side ? T.wid : T.len) / 2, hh: (side ? T.len : T.wid) / 2, color: c.color, horiz: !side, burnUntil: 0, driven: c.type, wa };
    G.world.obstacles.push(wreck);
    G.world.grid.insertBox(wreck);
    for (let i = 0; i < 18; i++) { const a = rand(0, TAU), sp = rand(120, 360); G.particles.push({ type: 'chunk', x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.6, 1.1), max: 1.1, size: rand(5, 11), color: pick(['#8a5a2e', '#6b4423', '#a07040', c.color]), rot: rand(0, TAU), spin: rand(-14, 14) }); }
    Sound.crunch(Sound.volAt(c.x, c.y));
}

// A horse from above, facing +x: legs that move with its gait, the body, neck, head and mane, a swishing tail, a saddle
function drawHorse(L, Wd, color, speed, saddle = true) {
    const now = G ? G.time / 1000 : 0, moving = Math.abs(speed) > 20, ph = now * (6 + Math.abs(speed) / 60);
    const dark = shade(color, -0.45), light = shade(color, 0.2);
    ctx.fillStyle = dark;
    for (const [lx, ly, o] of [[L * 0.24, -Wd * 0.38, 0], [L * 0.24, Wd * 0.38, Math.PI], [-L * 0.24, -Wd * 0.38, Math.PI], [-L * 0.24, Wd * 0.38, 0]]) {
        const d = moving ? Math.sin(ph + o) * 7 : 0;
        roundRect(ctx, lx + d - 5, ly - 3.5, 10, 7, 3); ctx.fill();
    }
    // Tail
    const sw = Math.sin(now * 3) * 0.35;
    ctx.save(); ctx.translate(-L * 0.38, 0); ctx.rotate(Math.PI + sw);
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(L * 0.1, 0, L * 0.13, Wd * 0.13, 0, 0, TAU); ctx.fill();
    ctx.restore();
    // Body
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(-L * 0.04, 0, L * 0.34 + 2, Wd * 0.46 + 2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(-L * 0.04, 0, L * 0.34, Wd * 0.46, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(-L * 0.08, -Wd * 0.14, L * 0.22, Wd * 0.18, 0, 0, TAU); ctx.fill();
    // Neck and head
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(L * 0.3, 0, L * 0.14, Wd * 0.24, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(L * 0.44, 0, L * 0.1, Wd * 0.19, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(L * 0.52, 0, L * 0.035, Wd * 0.13, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(L * 0.38, -Wd * 0.14); ctx.lineTo(L * 0.34, -Wd * 0.3); ctx.lineTo(L * 0.41, -Wd * 0.18); ctx.fill();
    ctx.beginPath(); ctx.moveTo(L * 0.38, Wd * 0.14); ctx.lineTo(L * 0.34, Wd * 0.3); ctx.lineTo(L * 0.41, Wd * 0.18); ctx.fill();
    // Mane down the neck
    ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(L * 0.16, 0); ctx.lineTo(L * 0.38, 0); ctx.stroke(); ctx.lineCap = 'butt';
    if (saddle) {
        ctx.fillStyle = '#6b2a1e'; roundRect(ctx, -L * 0.16, -Wd * 0.42, L * 0.26, Wd * 0.84, 5); ctx.fill();
        ctx.fillStyle = '#3a1810'; ctx.fillRect(-L * 0.02, -Wd * 0.5, 3, Wd);
    }
}

// Electricity reaching a vehicle shorts it out: the fuel goes up, whoever's inside is electrocuted, and the charge
// arcs out of the wreck into everyone nearby and on to the next vehicle, which can set that one off too
const SURGE = { reach: 300, carReach: 480, dmg: 45, stun: 2500, depth: 6, delay: [180, 380] };
function surgeVehicle(c, owner, seen = new Set(), depth = 0) {
    if (c.dead || seen.has(c)) return;
    seen.add(c);
    const hits = f => !f.dead && f !== owner && (!owner || foe(owner, f));
    const inside = [c.driver, ...(c.riders || [])].filter(Boolean);
    const zap = (x2, y2, size) => { if (inView(c.x, c.y, 600)) G.particles.push({ type: 'bolt', x: c.x, y: c.y, x2, y2, vx: 0, vy: 0, life: 0.4, max: 0.4, size, seed: Math.random() }); };
    // The vehicle crackles blue for a moment, then blows
    for (let i = 0; i < 4; i++) { const a = rand(0, TAU), r = vt(c).len * 0.6; zap(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 2); }
    if (inView(c.x, c.y, 200)) burst(c.x, c.y, 20, HYPER.neon, 320, 'glow');
    explodeCar(c, owner);
    // Now the vehicle's gone, whoever was inside takes the full jolt
    for (const f of inside) if (hits(f)) { f.stunUntil = Math.max(f.stunUntil || 0, G.time + SURGE.stun); f.shield = 0; damage(f, SURGE.dmg * 1.5, owner, 'Electrocuted'); }
    // Arcs into anyone standing close by
    G.fgrid.query(c.x, c.y, SURGE.reach, f => {
        if (!hits(f) || f.car || Math.hypot(f.x - c.x, f.y - c.y) > SURGE.reach) return;
        zap(f.x, f.y, 3);
        f.stunUntil = Math.max(f.stunUntil || 0, G.time + SURGE.stun * 0.6);
        damage(f, SURGE.dmg, owner, 'Electrocuted');
    });
    if (G.survival) for (const a of G.animals) if (!a.dead && Math.hypot(a.x - c.x, a.y - c.y) < SURGE.reach) damageAnimal(a, SURGE.dmg, owner);
    // ...and jumps to the nearest vehicles, which go up a moment later
    if (depth >= SURGE.depth) return;
    const next = (G.world.cars || []).filter(o => !o.dead && !seen.has(o) && Math.hypot(o.x - c.x, o.y - c.y) < SURGE.carReach)
        .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, 2);
    for (const o of next) {
        seen.add(o);
        zap(o.x, o.y, 4);
        (G.surges || (G.surges = [])).push({ c: o, owner, seen, depth: depth + 1, at: G.time + rand(...SURGE.delay) });
    }
}

function updateSurges() {
    if (!G.surges || !G.surges.length) return;
    const due = G.surges.filter(q => G.time >= q.at);
    G.surges = G.surges.filter(q => G.time < q.at);
    for (const q of due) { q.seen.delete(q.c); surgeVehicle(q.c, q.owner, q.seen, q.depth); }
}

function bulletHitsDrivenCar(b) {
    for (const c of G.world.cars || []) {
        if (c.dead || !c.driver || b.owner === c.driver || !inCar(c, b.x, b.y)) continue;
        if (b.owner && c.riders.includes(b.owner)) continue;
        damageCar(c, b.dmg, b.owner);
        burst(b.x, b.y, 5, '#ffe08a', 200, 'glow');
        return true;
    }
    return false;
}

// ----- How each vehicle looks from above -----
// One vehicle's body, drawn at the origin facing +x (the caller has already moved and turned the canvas)
function drawVehicleBody(c) {
    const T = vt(c), L = T.len, Wd = T.wid, now = G.time / 1000;
    switch (c.type) {
        case 'horse':
            drawHorse(L, Wd, c.color, c.speed || 0);
            break;
        case 'wagon': {
            // The cart behind, a horse in the shafts in front (a smashed wagon has lost its horse)
            const HL = 60, cart = L - HL;
            if (!c.wreck) {
                ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(-L / 2 + cart, -9); ctx.lineTo(L / 2 - 14, -9); ctx.moveTo(-L / 2 + cart, 9); ctx.lineTo(L / 2 - 14, 9); ctx.stroke();
                ctx.save(); ctx.translate(L / 2 - HL / 2, 0); drawHorse(HL, 24, '#5a3a22', c.speed || 0, false); ctx.restore();
            }
            ctx.fillStyle = '#1e1a16';
            for (const x of [-L / 2 + 12, -L / 2 + cart - 18]) { ctx.fillRect(x, -Wd / 2 - 4, 16, 6); ctx.fillRect(x, Wd / 2 - 2, 16, 6); }
            ctx.fillStyle = '#6b4423'; ctx.fillRect(-L / 2, -Wd / 2 + 2, cart, Wd - 4);
            ctx.fillStyle = '#7d5230'; for (let x = -L / 2 + 3; x < -L / 2 + cart - 3; x += 9) ctx.fillRect(x, -Wd / 2 + 4, 6, Wd - 8);
            ctx.fillStyle = c.color; roundRect(ctx, -L / 2 + 6, -Wd / 2 + 1, cart - 16, Wd - 2, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(90,70,40,0.45)'; ctx.lineWidth = 2;
            for (let x = -L / 2 + 16; x < -L / 2 + cart - 12; x += 13) { ctx.beginPath(); ctx.moveTo(x, -Wd / 2 + 2); ctx.lineTo(x, Wd / 2 - 2); ctx.stroke(); }
            break;
        }
        case 'bike':
            ctx.fillStyle = '#151515'; ctx.fillRect(-L / 2, -3, 12, 6); ctx.fillRect(L / 2 - 12, -3, 12, 6);
            ctx.fillStyle = c.color; roundRect(ctx, -L / 2 + 8, -Wd / 2 + 2, L - 16, Wd - 4, 6); ctx.fill();
            ctx.fillStyle = '#2b2b2b'; ctx.fillRect(L / 2 - 16, -Wd / 2 - 3, 4, Wd + 6);
            break;
        case 'quad':
            ctx.fillStyle = '#151515'; for (const [x, y] of [[-L / 2 + 6, -Wd / 2 - 2], [-L / 2 + 6, Wd / 2 - 8], [L / 2 - 16, -Wd / 2 - 2], [L / 2 - 16, Wd / 2 - 8]]) ctx.fillRect(x, y, 12, 10);
            ctx.fillStyle = c.color; roundRect(ctx, -L / 2 + 8, -Wd / 2 + 6, L - 16, Wd - 12, 6); ctx.fill();
            ctx.fillStyle = '#2b2b2b'; ctx.fillRect(L / 2 - 20, -Wd / 2 + 2, 4, Wd - 4);
            break;
        case 'gunjeep':
        case 'truck':
            drawVehicleShape(c.type === 'gunjeep' ? 'jeep' : 'apc', c.color, 7);
            break;
        case 'tank':
            ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-L / 2, -Wd / 2, L, 12); ctx.fillRect(-L / 2, Wd / 2 - 12, L, 12);
            ctx.fillStyle = '#333'; for (let x = -L / 2 + 4; x < L / 2; x += 10) { ctx.fillRect(x, -Wd / 2 + 1, 4, 10); ctx.fillRect(x, Wd / 2 - 11, 4, 10); }
            ctx.fillStyle = '#4f5d33'; ctx.fillRect(-L / 2 + 6, -Wd / 2 + 12, L - 12, Wd - 24);
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-L / 2 + 6, Wd / 2 - 18, L - 12, 6);
            break;
        case 'dozer':
            ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-L / 2 + 6, -Wd / 2, L - 22, 12); ctx.fillRect(-L / 2 + 6, Wd / 2 - 12, L - 22, 12);
            ctx.fillStyle = c.color; ctx.fillRect(-L / 2 + 10, -Wd / 2 + 10, L - 34, Wd - 20);
            ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-L / 2 + 20, -Wd / 4, 26, Wd / 2);
            ctx.fillStyle = '#9aa3ae'; ctx.fillRect(L / 2 - 12, -Wd / 2 - 6, 12, Wd + 12);
            ctx.fillStyle = '#6a727c'; ctx.fillRect(L / 2 - 4, -Wd / 2 - 6, 4, Wd + 12);
            break;
        case 'heli':
            ctx.rotate(Math.PI); drawHelicopter(0, 0, 0, ctx, 0.9); ctx.rotate(-Math.PI);
            break;
        case 'boat':
            ctx.fillStyle = '#f4f6f8'; ctx.beginPath(); ctx.moveTo(L / 2, 0); ctx.lineTo(L / 4, -Wd / 2); ctx.lineTo(-L / 2, -Wd / 2); ctx.lineTo(-L / 2, Wd / 2); ctx.lineTo(L / 4, Wd / 2); ctx.closePath(); ctx.fill();
            ctx.fillStyle = c.color; ctx.fillRect(-L / 2, -Wd / 2, L * 0.5, 5); ctx.fillRect(-L / 2, Wd / 2 - 5, L * 0.5, 5);
            ctx.fillStyle = 'rgba(40,60,90,0.8)'; ctx.fillRect(0, -Wd / 2 + 6, 10, Wd - 12);
            ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-L / 2 - 6, -5, 8, 10);
            break;
        case 'supercar':
            ctx.fillStyle = shade(c.color, -0.5); roundRect(ctx, -L / 2 - 2, -Wd / 2 - 2, L + 4, Wd + 4, 14); ctx.fill();
            ctx.fillStyle = c.color; roundRect(ctx, -L / 2, -Wd / 2, L, Wd, 13); ctx.fill();
            ctx.fillStyle = 'rgba(20,25,35,0.9)'; ctx.beginPath(); ctx.ellipse(4, 0, L * 0.18, Wd * 0.34, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = shade(c.color, -0.3); ctx.fillRect(-L / 2 + 2, -Wd / 2 + 2, 8, Wd - 4);
            ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(L * 0.15, -2, L * 0.3, 4);
            break;
        case 'icecream':
            drawCar({ color: c.color, horiz: true }, -L / 2, -Wd / 2, L, Wd);
            for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#ff8fb1', '#8fd8ff', '#ffe08a', '#a8f0c0', '#c9a7ff'][i]; ctx.fillRect(-L / 2 + 6 + i * 12, -Wd / 2, 10, 5); ctx.fillRect(-L / 2 + 6 + i * 12, Wd / 2 - 5, 10, 5); }
            ctx.fillStyle = '#ff8fb1'; ctx.beginPath(); ctx.arc(-L / 6, 0, 12, 0, TAU); ctx.fill();
            ctx.fillStyle = '#c99a5a'; ctx.beginPath(); ctx.moveTo(-L / 6 - 8, 6); ctx.lineTo(-L / 6 + 8, 6); ctx.lineTo(-L / 6, 22); ctx.fill();
            break;
        case 'hovertank':
            // A glowing hover skirt instead of tracks
            ctx.fillStyle = 'rgba(0,229,255,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, L / 2 + 6, Wd / 2 + 6, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#10141c'; roundRect(ctx, -L / 2, -Wd / 2, L, Wd, 16); ctx.fill();
            ctx.fillStyle = c.color; roundRect(ctx, -L / 2 + 6, -Wd / 2 + 6, L - 12, Wd - 12, 12); ctx.fill();
            techTrim(L, Wd, now);
            break;
        case 'jetbike':
            ctx.fillStyle = 'rgba(255,61,242,0.3)'; ctx.beginPath(); ctx.ellipse(-L / 2 - 6, 0, 14, 6, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = c.color; ctx.beginPath(); ctx.moveTo(L / 2, 0); ctx.lineTo(L / 6, -Wd / 2); ctx.lineTo(-L / 2, -Wd / 2 + 3); ctx.lineTo(-L / 2, Wd / 2 - 3); ctx.lineTo(L / 6, Wd / 2); ctx.closePath(); ctx.fill();
            techTrim(L, Wd, now);
            break;
        case 'mech': {
            // Two stomping feet, a cockpit and gun arms
            const step = Math.sin((c.walk = (c.walk || 0) + Math.abs(c.speed) * 0.0004)) * 10;
            ctx.fillStyle = '#0d1016'; ctx.fillRect(-12 + step, -Wd / 2, 24, 16); ctx.fillRect(-12 - step, Wd / 2 - 16, 24, 16);
            ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(0, 0, Wd * 0.36, 0, TAU); ctx.fill();
            ctx.fillStyle = 'rgba(0,229,255,0.7)'; ctx.beginPath(); ctx.arc(6, 0, 8, -1, 1); ctx.fill();
            ctx.strokeStyle = TECH_DROP.neon; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, Wd * 0.36, 0, TAU); ctx.stroke();
            break;
        }
        case 'stealth':
            ctx.globalAlpha = c.driver && G.time - (c.firedAt || -1e9) > 1500 ? 0.45 : 1;  // it shimmers out of sight
            ctx.fillStyle = '#151820'; ctx.beginPath(); ctx.moveTo(L / 2, 0); ctx.lineTo(L / 4, -Wd / 2); ctx.lineTo(-L / 2, -Wd / 2); ctx.lineTo(-L / 2, Wd / 2); ctx.lineTo(L / 4, Wd / 2); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(122,92,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#0b0d12'; ctx.fillRect(-L / 4, -Wd / 2 - 4, 16, 6); ctx.fillRect(-L / 4, Wd / 2 - 2, 16, 6);
            ctx.globalAlpha = 1;
            break;
        case 'tower': {
            // A square stone tower: a tall shadow, crenellated walls round the top, a banner in the team's colour
            ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-L / 2 + 14, -Wd / 2 + 18, L, Wd);
            ctx.fillStyle = '#5d6168'; ctx.fillRect(-L / 2, -Wd / 2, L, Wd);
            ctx.fillStyle = '#7d8189'; ctx.fillRect(-L / 2 + 8, -Wd / 2 + 8, L - 16, Wd - 16);
            ctx.fillStyle = '#9a9ea6';
            for (let i = 0; i < 5; i++) { const k = -L / 2 + 4 + i * ((L - 18) / 4); ctx.fillRect(k, -Wd / 2, 10, 8); ctx.fillRect(k, Wd / 2 - 8, 10, 8); ctx.fillRect(-L / 2, k, 8, 10); ctx.fillRect(L / 2 - 8, k, 8, 10); }
            ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.beginPath();
            for (let y = -Wd / 2 + 16; y < Wd / 2 - 8; y += 12) { ctx.moveTo(-L / 2 + 8, y); ctx.lineTo(L / 2 - 8, y); }
            ctx.stroke();
            ctx.fillStyle = c.color || '#888'; ctx.fillRect(-L / 2 + 10, -6, 6, 12);
            break;
        }
        case 'bigtower': {
            // A big round stone tower: a long shadow (it stands tall), a ring of battlements and the team's banner
            const R0 = L / 2;
            ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(22, 30, R0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#55595f'; ctx.beginPath(); ctx.arc(0, 0, R0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#7d8189'; ctx.beginPath(); ctx.arc(0, 0, R0 - 14, 0, TAU); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5;
            for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(0, 0, (R0 - 14) * k / 4, 0, TAU); ctx.stroke(); }
            ctx.fillStyle = '#9a9ea6';
            for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU; ctx.save(); ctx.rotate(a); ctx.fillRect(R0 - 14, -8, 14, 16); ctx.restore(); }
            ctx.fillStyle = c.color || '#888'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill();
            break;
        }
        case 'cannon': {
            // A ring of sandbags round a steel turntable
            for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; ctx.save(); ctx.translate(Math.cos(a) * L * 0.46, Math.sin(a) * Wd * 0.46); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = i % 2 ? '#a8925f' : '#b9a26c'; roundRect(ctx, -10, -6, 20, 12, 5); ctx.fill(); ctx.restore(); }
            ctx.fillStyle = '#3a3f46'; ctx.beginPath(); ctx.arc(0, 0, Wd * 0.3, 0, TAU); ctx.fill();
            ctx.fillStyle = '#555c66'; ctx.beginPath(); ctx.arc(0, 0, Wd * 0.22, 0, TAU); ctx.fill();
            break;
        }
        case 'gunship':
            ctx.rotate(Math.PI); drawHelicopter(0, 0, 0, ctx, 1.05); ctx.rotate(-Math.PI);
            ctx.fillStyle = 'rgba(20,24,34,0.6)'; ctx.fillRect(-20, -Wd / 2, 40, Wd);
            techTrim(L * 0.5, Wd, now);
            break;
        default:
            drawCar({ color: c.color, horiz: true }, -L / 2, -Wd / 2, L, Wd);
    }
}

// A burnt-out vehicle: its own shape (helicopter, tank, bike...) drawn once, charred black with the paint scorched off
const WRECK_SPRITES = new Map();
function wreckSprite(type, color) {
    const key = type + color;
    if (WRECK_SPRITES.has(key)) return WRECK_SPRITES.get(key);
    const T = VTYPES[type], pad = T.fly ? 70 : 24;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(T.len + pad * 2); cv.height = Math.ceil(Math.max(T.wid, T.fly ? T.len : 0) + pad * 2);
    const keep = ctx;
    ctx = cv.getContext('2d');
    try {
        ctx.translate(cv.width / 2, cv.height / 2);
        drawVehicleBody({ type, color, speed: 0, driver: null, riders: [], wreck: true });
        if (T.cannon) { ctx.fillStyle = '#3d4a28'; ctx.beginPath(); ctx.arc(0, 0, T.wid * 0.34, 0, TAU); ctx.fill(); ctx.save(); ctx.rotate(0.5); ctx.fillStyle = '#2b3420'; ctx.fillRect(0, -5, T.len * 0.55, 10); ctx.restore(); }
        // Char it: blacken everything that was drawn, leave patches of scorched paint and bare metal showing
        const rnd = seededRand(type.length * 977 + color.charCodeAt(1));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(18,14,12,0.72)'; ctx.fillRect(0, 0, cv.width, cv.height);
        for (let i = 0; i < 10; i++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(120,110,100,0.35)' : 'rgba(150,60,20,0.3)'; ctx.beginPath(); ctx.ellipse(rnd() * cv.width, rnd() * cv.height, 4 + rnd() * 10, 3 + rnd() * 7, rnd() * TAU, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(cv.width / 2 + (rnd() - 0.5) * 10, cv.height / 2, T.len * 0.22, T.wid * 0.22, 0, 0, TAU); ctx.fill();
    } finally { ctx = keep; }
    WRECK_SPRITES.set(key, cv);
    return cv;
}

// (a castle's big corner guns stand on its balcony, so they're drawn with it: drawCars(thatGun))
function drawCars(only) {
    const now = G.time / 1000;
    for (const c of only ? [only] : G.world.cars || []) {
        if (c.dead || !inView(c.x, c.y, 300) || (!only && c.type === 'bigtower' && c.tower && !c.tower.fallen)) continue;
        const T = vt(c), L = T.len, Wd = T.wid;
        if (T.fly && c.driver) {
            // Flying: a shadow on the ground, the helicopter drawn higher up
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(c.x + 30, c.y + 40, 60, 32, c.a, 0, TAU); ctx.fill();
            ctx.save(); ctx.translate(c.x, c.y - 24); ctx.rotate(c.a + Math.PI); drawHelicopter(0, 0, now, ctx, c.type === 'gunship' ? 1.05 : 0.9); ctx.restore();
            if (c.type === 'gunship') { ctx.save(); ctx.translate(c.x, c.y - 24); ctx.rotate(c.a); techTrim(T.len * 0.5, T.wid, now); ctx.restore(); }
            continue;
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.a);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        if (T.animal) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(5, 7, L * 0.48, Wd * 0.55, 0, 0, TAU); ctx.fill(); }  // a soft shadow, not a car's box
        else if (!T.round) ctx.fillRect(-L / 2 + 5, -Wd / 2 + 7, L, Wd);
        drawVehicleBody(c);
        if (!['heli', 'boat', 'tank', 'dozer', 'mech', 'gunship', 'hovertank', 'horse', 'wagon'].includes(c.type)) {
            ctx.fillStyle = c.driver ? '#fff6c2' : '#d8d2b0';
            ctx.fillRect(L / 2 - 4, -Wd / 2 + 4, 4, 6); ctx.fillRect(L / 2 - 4, Wd / 2 - 10, 4, 6);
            ctx.fillStyle = c.braking ? '#ff3030' : '#8a1a1a';
            ctx.fillRect(-L / 2, -Wd / 2 + 4, 3, 6); ctx.fillRect(-L / 2, Wd / 2 - 10, 3, 6);
        }
        if (c.driver && c.type !== 'heli' && c.type !== 'gunship' && !(c.type === 'stealth' && c.driver.hidden)) {
            ctx.fillStyle = c.driver.color;
            const rxg = c.type === 'horse' ? -L * 0.04 : c.type === 'wagon' ? -L / 2 + (L - 60) - 14 : c.type === 'bike' || c.type === 'quad' ? -4 : 2;
            if (c.driver === G.player) playerGlow(rxg, c.type === 'bike' || c.type === 'quad' || c.type === 'horse' || c.type === 'wagon' ? 0 : -Wd * 0.18, 12);
            const rx = c.type === 'horse' ? -L * 0.04 : c.type === 'wagon' ? -L / 2 + (L - 60) - 14 : c.type === 'bike' || c.type === 'quad' ? -4 : 2;
            const ry = c.type === 'bike' || c.type === 'quad' || c.type === 'horse' || c.type === 'wagon' ? 0 : -Wd * 0.18;
            ctx.beginPath(); ctx.arc(rx, ry, 9, 0, TAU); ctx.fill();
            ctx.strokeStyle = '#fff7ec'; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.restore();
        // Turrets turn to where the driver aims
        if ((T.gun || T.cannon) && !T.fly) {
            ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.turret);
            // (a castle cannon kicks back when it fires, then rolls forward again)
            if (c.type === 'bigtower') ctx.translate(-clamp(1 - (G.time - (c.firedAt ?? -1e9)) / 260, 0, 1) * 34, 0);
            if ((c.arm === 'catapult' || c.arm === 'tesla') && T.round) ctx.scale(T.len / 200, T.len / 200);
            if (c.arm === 'catapult') {
                // A catapult: a timber frame with a throwing arm and a stone in its cup
                const pull = clamp((c.fireAt - G.time) / 2600, 0, 1);
                ctx.fillStyle = '#6b4423'; ctx.fillRect(-34, -30, 68, 8); ctx.fillRect(-34, 22, 68, 8); ctx.fillRect(-30, -30, 8, 60); ctx.fillRect(22, -30, 8, 60);
                ctx.fillStyle = '#8a5a2e'; ctx.fillRect(-6, -26, 12, 52);
                ctx.save(); ctx.rotate(0); ctx.fillStyle = '#a0703c'; ctx.fillRect(-40 + pull * 30, -5, 84 - pull * 30, 10); ctx.restore();
                if (pull < 0.15 || pull > 0.6) { ctx.fillStyle = '#7d7468'; ctx.beginPath(); ctx.arc(-34 + pull * 30, 0, 11, 0, TAU); ctx.fill(); }
            } else if (c.arm === 'tesla') {
                // A tesla coil: copper windings round a glowing ball
                ctx.fillStyle = '#3a3f46'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();
                ctx.strokeStyle = '#c87533'; ctx.lineWidth = 4; for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(0, 0, 8 + k * 7, 0, TAU); ctx.stroke(); }
                ctx.fillStyle = '#41464f'; ctx.fillRect(0, -6, 52, 12);
                ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(127,233,255,${0.6 + Math.sin(G.time / 90) * 0.3})`; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(54, 0, 6, 0, TAU); ctx.fill(); ctx.restore();
            } else if (c.arm === 'boom') {
                // The exploding cannon: a fat mortar-like barrel with hazard bands
                ctx.fillStyle = '#41464f'; roundRect(ctx, -26, -16, 40, 32, 8); ctx.fill();
                ctx.fillStyle = '#30343b'; ctx.fillRect(4, -11, L * 0.8, 22);
                ctx.fillStyle = '#ffb347'; ctx.fillRect(14, -11, 6, 22); ctx.fillRect(4 + L * 0.8 - 14, -11, 6, 22);
                ctx.fillStyle = '#22252a'; ctx.fillRect(4 + L * 0.8 - 6, -14, 10, 28);
            } else if (T.fixed) {
                // The cannon: a long barrel on a carriage with two wheels
                ctx.fillStyle = '#2a2d33'; ctx.fillRect(-14, -Wd * 0.3, 10, Wd * 0.6);
                ctx.fillStyle = '#1b1d21'; ctx.fillRect(-12, -Wd * 0.36, 16, 8); ctx.fillRect(-12, Wd * 0.36 - 8, 16, 8);
                ctx.fillStyle = '#41464f'; roundRect(ctx, -18, -9, 26, 18, 6); ctx.fill();
                ctx.fillStyle = '#30343b'; ctx.fillRect(4, -6, L * 0.85, 12);
                ctx.fillStyle = '#4a505a'; ctx.fillRect(4, -6, L * 0.85, 3);
                ctx.fillStyle = '#22252a'; ctx.fillRect(4 + L * 0.85 - 6, -8, 8, 16);
            } else if (T.cannon) {
                ctx.fillStyle = '#3d4a28'; ctx.beginPath(); ctx.arc(0, 0, Wd * 0.34, 0, TAU); ctx.fill();
                ctx.fillStyle = '#2b3420'; ctx.fillRect(0, -5, L * 0.62, 10);
            } else {
                ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.arc(-6, 0, 10, 0, TAU); ctx.fill();
                ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-6, -3, 40, 6);
            }
            ctx.restore();
        }
        if (c.hitAt && G.time - c.hitAt < 2000) drawPlantHealth({ hp: c.hp, maxHp: T.hp, hitAt: c.hitAt, x: c.x }, c.y - T.wid / 2 - 22);
    }
}

// ----- High-tech vehicles: they only arrive in vehicle drops -----
const TECH_VEHICLES = ['hovertank', 'jetbike', 'mech', 'stealth', 'gunship'];
const TECH_DROP = { first: [60000, 90000], every: [180000, 300000], neon: '#ff3df2', glow: '#7a5cff' };

function spawnVehicle(type, x, y, a = rand(0, TAU)) {
    const T = VTYPES[type];
    const c = { type, x, y, a, speed: 0, hp: T.hp, color: T.tech ? '#1b1f2a' : T.animal ? animalColor(type) : pick(DRIVE_COLORS), driver: null, riders: [], dead: false, box: null, braking: false, fireAt: 0, turret: a, firedAt: -1e9 };
    parkCar(c);
    (G.world.cars || (G.world.cars = [])).push(c);
    return c;
}

// The neon strips and glow that mark a tech vehicle
function techTrim(L, Wd, now) {
    const pulse = 0.6 + Math.sin(now * 5) * 0.4;
    ctx.fillStyle = TECH_DROP.neon; ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.fillRect(-L / 2 + 6, -Wd / 2 + 2, L - 12, 3); ctx.fillRect(-L / 2 + 6, Wd / 2 - 5, L - 12, 3);
    ctx.fillStyle = HYPER.neon; ctx.fillRect(L / 2 - 8, -Wd / 4, 4, Wd / 2);
    ctx.globalAlpha = 1;
}

// ----- Bots behind the wheel -----
const canDrive = b => !isHuman(b) && !b.zombie && !b.decoy && !b.riding && !b.up && !G.escape && b.likesCars && G.time > (b.carCool || 0) && !G.world.floor && G.world.cars;

// Steer toward a point, swerving round anything in the way; back up and try again when stuck
function botDrive(c, b, dt) {
    const T = vt(c);
    if (G.time >= (b.driveThink || 0)) {
        b.driveThink = G.time + 300;
        // Get out when the vehicle's about to go, when it's been stuck for ages, or after a good long drive
        // (a tank crew stays with it until it's badly hit; they back out of tight spots instead)
        if (c.hp < T.hp * 0.3 || ((b.stuckFor || 0) > (b.tanker ? 14 : 4)) || G.time > (b.driveUntil || Infinity)) {
            exitCar(b);
            b.stuckFor = 0; b.driveUntil = 0;
            b.carCool = G.time + rand(8000, 20000);
            b.mode = 'wander'; b.nextThink = G.time;
            return null;
        }
        let enemy = null, bd = T.fixed ? 1400 : 800;
        G.fgrid.query(c.x, c.y, bd, f => {
            if (f.dead || f === b || f.riding || !foe(b, f) || (f.hidden && !f.car)) return;
            const d = Math.hypot(f.x - c.x, f.y - c.y);
            if (d < bd && lineOfSight(c, f)) { bd = d; enemy = f; }
        });
        b.driveEnemy = enemy;
        const g = zoneGoal(), outside = G.mode !== 'demo' && Math.hypot(c.x - g.x, c.y - g.y) > g.r - 200;
        const front = G.war && marchTarget(b);
        if (front) b.driveGoal = front;
        else if (!b.driveGoal || Math.hypot(b.driveGoal.x - c.x, b.driveGoal.y - c.y) < 220) {
            const a = rand(0, TAU), d = rand(400, 1500), W = CONFIG.WORLD_SIZE;
            b.driveGoal = { x: clamp(g.x + Math.cos(a) * Math.min(d, g.r * 0.8), 200, W - 200), y: clamp(g.y + Math.sin(a) * Math.min(d, g.r * 0.8), 200, W - 200) };
        }
        // Armed vehicles hold off and shoot; the rest try to run the enemy down
        b.driveTarget = enemy && !(T.gun || T.cannon || T.rockets) ? enemy : outside ? g : enemy && bd > 400 ? enemy : b.driveGoal;
    }
    // Revolution: guns with nobody to shoot at pound the enemy base's walls if they're in range
    if (G.revolution && !b.driveEnemy && (T.cannon || T.gun || T.rockets)) {
        const w = nearestEnemyWall({ x: c.x, y: c.y, team: b.team }, T.fixed ? 1300 : 800);
        if (w) { c.turret = Math.atan2(w.y - c.y, w.x - c.x); if (G.time >= c.fireAt) vehicleFire(c, b); if (T.fixed) { b.fixedIdle = 0; return { up: false, down: false, left: false, right: false }; } }
    }
    // A cannon doesn't drive: just swing round onto whoever's in range and fire, and leave if nothing comes along
    if (T.fixed) {
        const e = b.driveEnemy;
        if (e && !e.dead) {
            b.fixedIdle = 0;
            c.turret = Math.atan2(e.y - c.y, e.x - c.x);
            if (G.time >= c.fireAt && Math.hypot(e.x - c.x, e.y - c.y) < 1400 && lineOfSight(c, e)) { c.turret += rand(-0.05, 0.05) * AIK().aim; vehicleFire(c, b); }
        } else if ((b.fixedIdle = (b.fixedIdle || 0) + dt) > 12) {
            exitCar(b);
            b.fixedIdle = 0; b.carCool = G.time + rand(10000, 20000); b.mode = 'wander'; b.nextThink = G.time;
            return null;
        }
        return { up: false, down: false, left: false, right: false };
    }
    const t = b.driveTarget || b.driveGoal || c;
    let want = Math.atan2(t.y - c.y, t.x - c.x);
    // Feel ahead for walls and swerve to whichever side is clear
    if (!T.fly) {
        const look = T.len / 2 + 40 + Math.abs(c.speed) * 0.3;
        const free = a => !blockedAt(G.world.grid, c.x + Math.cos(a) * look, c.y + Math.sin(a) * look, T.wid * 0.45);
        if (!free(c.a) || !free(want)) {
            for (const off of [0.5, -0.5, 1, -1, 1.6, -1.6]) if (free(want + off)) { want += off; break; }
        }
    }
    const diff = angleDiff(c.a, want);
    const ctl = { up: false, down: false, left: false, right: false };
    if (G.time < (b.reverseUntil || 0)) {
        ctl.down = true;
        if (diff > 0) ctl.left = true; else ctl.right = true;  // reversing flips the steering
    } else {
        ctl.up = Math.abs(diff) < 1.7;
        ctl.down = Math.abs(diff) > 2.2 && c.speed > 200;
        if (diff > 0.08) ctl.right = true; else if (diff < -0.08) ctl.left = true;
        if (Math.abs(c.speed) < 30 && !T.fly) {
            b.stuckT = (b.stuckT || 0) + dt;
            b.stuckFor = (b.stuckFor || 0) + dt;
            if (b.stuckT > 0.8) { b.stuckT = 0; b.reverseUntil = G.time + rand(700, 1100); }
        } else { b.stuckT = 0; if (Math.abs(c.speed) > 150) b.stuckFor = Math.max(0, (b.stuckFor || 0) - dt); }
    }
    // Turrets and rocket pods track and fire at the enemy in sight
    const e = b.driveEnemy;
    if (e && (T.gun || T.cannon || T.rockets) && !e.dead) {
        c.turret = Math.atan2(e.y - c.y, e.x - c.x);
        if (G.time >= c.fireAt && Math.hypot(e.x - c.x, e.y - c.y) < 900 && lineOfSight(c, e)) { c.turret += rand(-0.08, 0.08) * AIK().aim; vehicleFire(c, b); }
    }
    return ctl;
}

// ---------- Special guns: beams, the sonic cannon, homing missiles and explosive minigun rounds ----------
// Laser Beam and Freeze Ray: a continuous beam out to the first wall or person, ticking damage while you hold it on them
function fireBeam(f, w, name) {
    const a = f.angle, ca = Math.cos(a), sa = Math.sin(a);
    const sx = f.x + ca * (f.r + w.len), sy = f.y + sa * (f.r + w.len);
    let ex = sx, ey = sy, hit = null, prop = null, car = null, beast = null;
    for (let d = 0; d < w.range && !hit && !prop && !car && !beast; d += 10) {
        const x = sx + ca * d, y = sy + sa * d;
        G.world.grid.query(x, y, 0, o => { if (!prop && blocksMove(o) && pointInObstacle(x, y, o)) prop = o; });
        if (prop) break;
        G.fgrid.query(x, y, 30, t => { if (!hit && !t.dead && t !== f && !t.car && foe(f, t) && (t.x - x) ** 2 + (t.y - y) ** 2 < (t.r + 4) ** 2) hit = t; });
        for (const c of G.world.cars || []) if (!car && !c.dead && c.driver && c.driver !== f && foe(f, c.driver) && inCar(c, x, y)) car = c;
        if (G.survival && G.agrid) G.agrid.query(x, y, 30, an => { if (!beast && !an.dead && Math.hypot(an.x - x, an.y - y) < an.r + 4) beast = an; });
        ex = x; ey = y;
    }
    if (hit) {
        damage(hit, w.damage, f, name);
        if (w.freeze && !hit.dead) {
            // The freeze ray chills them a little more every tick; fully chilled, they freeze solid
            hit.chill = Math.min(1, (hit.chill || 0) + w.freeze);
            if (hit.chill >= 1) { hit.chill = 0; hit.stunUntil = G.time + 2500; hit.frozenUntil = G.time + 2500; burst(hit.x, hit.y, 16, '#dff8ff', 220, 'glow'); }
        }
    }
    if (car) damageCar(car, w.damage * 1.5, f);
    if (beast) damageAnimal(beast, w.damage, f);
    if (prop) {
        if (prop.type === 'box') damageBox(prop, w.damage * 0.6, f);
        else if (mineable(prop)) mineHit(prop, w.damage * 0.6, f);
        else if (prop.drivecar) damageCar(prop.drivecar, w.damage, f);
        else if (prop.type === 'tree') damagePlant(prop, w.damage, f);
    }
    if ((hit || prop || car) && inView(ex, ey, 40) && Math.random() < 0.5) burst(ex, ey, 2, w.freeze ? '#dff8ff' : '#ff5a5f', 160, 'glow');
    f.beam = { x1: sx, y1: sy, x2: ex, y2: ey, until: G.time + 90, ice: !!w.freeze };
    if (G.time - (f.beamSound || 0) > 160) { f.beamSound = G.time; Sound.tone(w.freeze ? 900 : 180, 0.16, w.freeze ? 'sine' : 'sawtooth', 0.05 * Sound.volAt(f.x, f.y), w.freeze ? 1100 : 200); }
}

function drawBeams() {
    for (const f of G.fighters) {
        const b = f.beam;
        if (!b || G.time > b.until || f.dead) continue;
        if (!inView(b.x1, b.y1, 1000)) continue;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        const flicker = 0.8 + Math.random() * 0.2;
        for (const [col, lw] of b.ice ? [['rgba(120,210,255,0.35)', 16], ['rgba(190,240,255,0.8)', 7], ['#ffffff', 2.5]] : [['rgba(255,40,60,0.35)', 16], ['rgba(255,90,110,0.85)', 7], ['#fff0f0', 2.5]]) {
            ctx.strokeStyle = col; ctx.lineWidth = lw * flicker;
            ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
        }
        ctx.fillStyle = b.ice ? 'rgba(200,245,255,0.8)' : 'rgba(255,120,120,0.8)';
        ctx.beginPath(); ctx.arc(b.x2, b.y2, 7 + Math.random() * 5, 0, TAU); ctx.fill();
        ctx.restore();
    }
}

// Sonic Cannon: a wide shockwave that flings everyone in front of you and smashes what's in the way
function fireSonic(f, w, name) {
    const a = f.angle, R = w.range, cone = 0.5;
    const inCone = (x, y) => { const d = Math.hypot(x - f.x, y - f.y); return d < R && Math.abs(angleDiff(a, Math.atan2(y - f.y, x - f.x))) < cone ? d : -1; };
    G.fgrid.query(f.x, f.y, R, t => {
        if (t.dead || t === f || t.car || !foe(f, t)) return;
        const d = inCone(t.x, t.y);
        if (d < 0) return;
        const k = 1 - d / R, ang = Math.atan2(t.y - f.y, t.x - f.x);
        t.kx += Math.cos(ang) * 1800 * (0.4 + k); t.ky += Math.sin(ang) * 1800 * (0.4 + k);
        t.stunUntil = Math.max(t.stunUntil || 0, G.time + 400);
        damage(t, w.damage * (0.5 + k * 0.5), f, name);
    });
    G.world.grid.query(f.x, f.y, R, o => {
        if (o.broken || inCone(o.x, o.y) < 0) return;
        if (o.type === 'box') damageBox(o, 80, f);
        else if (mineable(o)) mineHit(o, 80, f);
        else if (o.type === 'tree' || o.type === 'bush') damagePlant(o, 90, f);
        else if (o.drivecar) damageCar(o.drivecar, 90, f);
    });
    for (const c of G.world.cars || []) if (!c.dead && c.driver && c.driver !== f && inCone(c.x, c.y) >= 0) damageCar(c, 90, f);
    if (G.survival) for (const an of G.animals) if (!an.dead && inCone(an.x, an.y) >= 0) damageAnimal(an, w.damage, f);
    if (!G.world.floor) damageBuildings(f.x + Math.cos(a) * R * 0.6, f.y + Math.sin(a) * R * 0.6, R * 0.4, 90);
    for (let i = 0; i < 3; i++) G.particles.push({ type: 'sonic', x: f.x, y: f.y, vx: 0, vy: 0, life: 0.35 + i * 0.08, max: 0.35 + i * 0.08, size: R, angle: a });
    Sound.tone(70, 0.5, 'sine', 0.16 * Sound.volAt(f.x, f.y), 40);
    Sound.boom(Sound.volAt(f.x, f.y), 0.6);
}

// Minigun of Doom: every round goes off with a small bang where it lands
function miniBlast(x, y, owner) {
    G.fgrid.query(x, y, 60, t => {
        const d = Math.hypot(t.x - x, t.y - y);
        if (t.dead || d > 60 + t.r || (owner && t !== owner && !foe(owner, t)) || t === owner) return;
        damage(t, 6 + 12 * (1 - d / 60), owner, 'Minigun of Doom');
    });
    G.world.grid.query(x, y, 60, o => { if (o.type === 'box' && !o.broken && Math.hypot(o.x - x, o.y - y) < 60 + o.hw) damageBox(o, 12, owner); });
    if (inView(x, y, 60)) {
        G.particles.push({ type: 'boom', x, y, vx: 0, vy: 0, life: 0.22, max: 0.22, size: 42 });
        burst(x, y, 3, '#ffb347', 180, 'glow');
    }
    if (Math.random() < 0.25) addDecal({ kind: 'scorch', x, y, r: 22, life: 40000 });
    if (Math.random() < 0.3) Sound.tone(90, 0.12, 'square', 0.06 * Sound.volAt(x, y), 50);
}

// Slow enough to dodge, burns out after a couple of seconds, and turns in wide arcs rather than on a dime
const HOMING = { seek: 650, cone: 0.9, turn: 1.5, life: 2.4 };
// Homing missiles steer toward the nearest enemy (or enemy vehicle) roughly ahead of them
function steerHoming(b, dt) {
    b.age = (b.age || 0) + dt;
    if (b.age > HOMING.life) { b.left = 0; return; }
    if (G.time >= (b.seekAt || 0)) {
        b.seekAt = G.time + 150;
        const cur = Math.atan2(b.vy, b.vx);
        let best = null, bd = HOMING.seek;
        G.fgrid.query(b.x, b.y, HOMING.seek, t => {
            if (t.dead || t.car || !foe(b.owner, t)) return;
            const d = Math.hypot(t.x - b.x, t.y - b.y);
            if (d < bd && Math.abs(angleDiff(cur, Math.atan2(t.y - b.y, t.x - b.x))) < HOMING.cone) { bd = d; best = t; }
        });
        for (const c of G.world.cars || []) {
            if (c.dead || !c.driver || !foe(b.owner, c.driver)) continue;
            const d = Math.hypot(c.x - b.x, c.y - b.y);
            if (d < bd && Math.abs(angleDiff(cur, Math.atan2(c.y - b.y, c.x - b.x))) < HOMING.cone) { bd = d; best = c; }
        }
        b.target = best;
    }
    const t = b.target;
    if (!t || t.dead) return;
    const sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx);
    const turn = clamp(angleDiff(cur, Math.atan2(t.y - b.y, t.x - b.x)), -HOMING.turn * dt, HOMING.turn * dt);
    b.vx = Math.cos(cur + turn) * sp; b.vy = Math.sin(cur + turn) * sp;
}

// ---------- Collapses: buildings come down in a direction, leave broken wall stubs and wood and metal wreckage strewn all round ----------
// quiet: already in ruins when the match starts (no sound or crushing)
function collapseBuilding(b, quiet) {
    b.collapsed = true;
    b.collapseAt = 0;
    const grid = G.world.grid, pad = 14, rnd = Math.random;
    // Which way it falls: away from whatever hit it last (or any way, for old ruins). Taller buildings spill further
    b.fallA = b.lastHit ? Math.atan2(b.cy - b.lastHit.y, b.cx - b.lastHit.x) : rand(0, TAU);
    b.spill = Math.min(520, 60 + (b.floors || 1) * 30);
    const gone = [];
    grid.query(b.cx, b.cy, Math.max(b.w, b.h) / 2 + 30, o => {
        if ((o.type === 'wall' || o.type === 'crate') && !o.car && !o.rubble && !o.drivecar && o.x >= b.x0 - pad && o.x <= b.x1 + pad && o.y >= b.y0 - pad && o.y <= b.y1 + pad) gone.push(o);
    });
    for (const o of gone) grid.removeBox(o);
    // Jagged stubs of the outer walls stay standing, mostly on the side it fell away from
    const back = { x: b.cx - Math.cos(b.fallA) * Math.max(b.w, b.h), y: b.cy - Math.sin(b.fallA) * Math.max(b.w, b.h) };
    for (const o of gone) {
        if (o.type !== 'wall') continue;
        const outer = o.x - o.hw <= b.x0 + 4 || o.x + o.hw >= b.x1 - 4 || o.y - o.hh <= b.y0 + 4 || o.y + o.hh >= b.y1 - 4;
        if (!outer) continue;
        const behind = Math.hypot(o.x - back.x, o.y - back.y) < Math.hypot(o.x - b.cx, o.y - b.cy) + Math.max(b.w, b.h) * 0.5;
        if (rnd() > (behind ? 0.75 : 0.25)) continue;
        const horiz = o.hw > o.hh, len = (horiz ? o.hw : o.hh) * 2, keep = len * rand(0.25, 0.6), at = rand(-len / 2 + keep / 2, len / 2 - keep / 2);
        const stub = { type: 'wall', ruinWall: true, color: shade(o.color || '#6a645c', -0.25), x: o.x + (horiz ? at : 0), y: o.y + (horiz ? 0 : at), hw: horiz ? keep / 2 : o.hw, hh: horiz ? o.hh : keep / 2, seed: randInt(1, 1e9) };
        grid.insertBox(stub);
        G.world.obstacles.push(stub);
    }
    // The wreckage: broken timbers, planks, steel girders and roofing sheets, over the footprint and thrown out
    // all round it, furthest the way it fell. Bigger pieces block like low cover
    const half = a => Math.min(Math.abs(b.w / 2 / (Math.cos(a) || 1e-6)), Math.abs(b.h / 2 / (Math.sin(a) || 1e-6)));
    const strewn = (a, reach) => { const d = half(a) + rnd() * rnd() * reach; return [b.cx + Math.cos(a) * d, b.cy + Math.sin(a) * d]; };
    const n = Math.round((b.w * b.h) / 16000) + 6 + Math.round(b.spill / 70);
    for (let i = 0; i < n; i++) {
        let x, y;
        if (rnd() < 0.5) { x = b.cx + (rnd() - 0.5) * b.w * 0.85; y = b.cy + (rnd() - 0.5) * b.h * 0.85; }
        else {
            const a = rnd() < 0.5 ? rand(0, TAU) : b.fallA + rand(-0.7, 0.7);
            [x, y] = strewn(a, Math.abs(angleDiff(a, b.fallA)) < 0.8 ? b.spill + 60 : 40 + b.spill * 0.4);
            if (blockedAt(grid, x, y, 30)) continue;
        }
        const o = makeWreck(x, y);
        grid.insertBox(o);
        G.world.obstacles.push(o);
    }
    // Loose planks, splinters, pipes and scrap metal everywhere around it (just on the ground: you can walk over them)
    for (let i = 0, m = Math.round((50 + b.spill / 5 + (b.w + b.h) / 25) * (quiet ? 0.4 : 1)); i < m; i++) {
        let x, y;
        if (rnd() < 0.3) { x = b.cx + (rnd() - 0.5) * b.w; y = b.cy + (rnd() - 0.5) * b.h; }
        else { const a = rand(0, TAU); [x, y] = strewn(a, Math.abs(angleDiff(a, b.fallA)) < 0.8 ? b.spill + 120 : 90 + b.spill * 0.5); }
        addDecal({ kind: 'debris', x, y, r: rand(8, 26), a: rand(0, TAU), m: rnd() < 0.55 ? 'wood' : 'metal', s: randInt(0, 3), seed: randInt(1, 1e9), life: 1e12 });
    }
    G.world.stairs = G.world.stairs.filter(s => s.b !== b);
    if (quiet) return;
    // The roof topples over in the fall direction as it comes apart
    (G.fallingRoofs || (G.fallingRoofs = [])).push({ b, start: G.time });
    // Anyone still inside, or right where it lands, is crushed
    for (const f of G.fighters) {
        const inside = !(f.dead || f.x < b.x0 - 10 || f.x > b.x1 + 10 || f.y < b.y0 - 10 || f.y > b.y1 + 10);
        const under = !f.dead && !inside && Math.hypot(f.x - (b.cx + Math.cos(b.fallA) * (Math.max(b.w, b.h) / 2 + b.spill / 2)), f.y - (b.cy + Math.sin(b.fallA) * (Math.max(b.w, b.h) / 2 + b.spill / 2))) < b.spill / 2;
        if (!inside && !under) continue;
        const a = Math.atan2(f.y - b.cy, f.x - b.cx);
        f.kx += Math.cos(a) * 400; f.ky += Math.sin(a) * 400;
        damage(f, inside ? rand(90, 140) : rand(40, 80), null, 'Collapse');
    }
    if (inView(b.cx, b.cy, 800)) {
        for (let i = 0; i < 70; i++) {
            const a = rand(0, TAU), sp = rand(80, 420);
            G.particles.push({ type: 'chunk', x: b.cx + rand(-0.4, 0.4) * b.w, y: b.cy + rand(-0.4, 0.4) * b.h, vx: Math.cos(a) * sp + Math.cos(b.fallA) * 200, vy: Math.sin(a) * sp + Math.sin(b.fallA) * 200, life: rand(0.6, 1.3), max: 1.3, size: rand(4, 12), color: pick(WRECK.wood.concat(WRECK.metal)), rot: rand(0, TAU), spin: rand(-12, 12) });
        }
    }
    Sound.boom(Sound.volAt(b.cx, b.cy), 2.6);
    Sound.thud(Sound.volAt(b.cx, b.cy));
    setTimeout(() => G && Sound.crunch(Sound.volAt(b.cx, b.cy)), 400);
}

// The roof tipping and breaking up as it falls: it slides out the way the building went, tilts and breaks away
function drawFallingRoofs() {
    if (!G.fallingRoofs || !G.fallingRoofs.length) return;
    G.fallingRoofs = G.fallingRoofs.filter(r => G.time - r.start < 1100);
    for (const r of G.fallingRoofs) {
        const b = r.b, t = (G.time - r.start) / 1100, ease = t * t;
        const dx = Math.cos(b.fallA) * (b.spill * 0.7 + Math.max(b.w, b.h) * 0.3) * ease, dy = Math.sin(b.fallA) * (b.spill * 0.7 + Math.max(b.w, b.h) * 0.3) * ease;
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.translate(b.cx + dx, b.cy + dy);
        ctx.rotate(Math.sin(b.fallA + 1) * 0.35 * ease);
        ctx.scale(1 - 0.35 * ease, 1 - 0.35 * ease);
        // Broken into a few big pieces that drift apart
        const rnd = seededRand(b.id * 97 + 3);
        for (let i = 0; i < 4; i++) {
            const qx = (i % 2 ? 0.5 : -0.5) * b.w / 2, qy = (i < 2 ? -0.5 : 0.5) * b.h / 2, spread = 1 + ease * 0.6;
            ctx.save(); ctx.translate(qx * spread, qy * spread); ctx.rotate((rnd() - 0.5) * ease);
            ctx.fillStyle = b.roofDark || '#4a453f'; ctx.fillRect(-b.w / 4 - 3, -b.h / 4 - 3, b.w / 2 + 6, b.h / 2 + 6);
            ctx.fillStyle = b.roof || '#6a645c'; ctx.fillRect(-b.w / 4, -b.h / 4, b.w / 2, b.h / 2);
            ctx.fillStyle = `rgba(30,25,20,${0.5 * ease})`; ctx.fillRect(-b.w / 4, -b.h / 4, b.w / 2, b.h / 2);
            ctx.restore();
        }
        ctx.restore();
    }
}

function mixColor(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

const WRECK = { wood: ['#8a5a32', '#6e4526', '#a0703f', '#5a3a1e'], metal: ['#8a9098', '#6b7178', '#9aa3ab', '#7a4a2a'] };

// One big piece of wreckage, lying roughly square to the map so its box matches what you see
function makeWreck(x, y) {
    const r = Math.random(), mat = r < 0.55 ? 'wood' : 'metal';
    const shape = mat === 'wood' ? (Math.random() < 0.6 ? 'planks' : 'beam') : (Math.random() < 0.5 ? 'girder' : 'sheet');
    const len = { planks: rand(60, 110), beam: rand(80, 140), girder: rand(90, 160), sheet: rand(55, 90) }[shape];
    const wid = { planks: rand(24, 34), beam: rand(14, 20), girder: rand(13, 17), sheet: rand(38, 60) }[shape];
    const up = Math.random() < 0.5;
    return { type: 'crate', rubble: true, x, y, hw: (up ? wid : len) / 2, hh: (up ? len : wid) / 2, len, wid, mat, shape, rot: (up ? Math.PI / 2 : 0) + rand(-0.12, 0.12), seed: randInt(1, 1e9) };
}

// A piece of the wreckage: a pile of broken planks, a splintered timber, a bent steel girder or a crumpled roofing sheet
function drawRubble(o) {
    const rnd = seededRand(o.seed);
    if (!o.shape) { const w = o.hw > o.hh; o.len = (w ? o.hw : o.hh) * 2; o.wid = Math.max(14, (w ? o.hh : o.hw)); o.rot = w ? 0 : Math.PI / 2; o.shape = ['planks', 'beam', 'girder', 'sheet'][o.seed % 4]; }
    const L = o.len, Wd = o.wid;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-L / 2 + 4, -Wd / 2 + 5, L, Wd);
    switch (o.shape) {
        case 'planks': {
            // Three to five boards tumbled across each other, grain showing, nails sticking out of the broken ends
            const k = 3 + Math.floor(rnd() * 3), bw = Wd / 2.6;
            for (let i = 0; i < k; i++) {
                const bl = L * (0.6 + rnd() * 0.4);
                ctx.save(); ctx.translate((rnd() - 0.5) * L * 0.2, (i / (k - 1) - 0.5) * (Wd - bw)); ctx.rotate((rnd() - 0.5) * 0.35);
                const c = WRECK.wood[Math.floor(rnd() * 3)];
                ctx.fillStyle = shade(c, -0.3); ctx.fillRect(-bl / 2, -bw / 2, bl, bw);
                ctx.fillStyle = c; ctx.fillRect(-bl / 2 + 1, -bw / 2 + 1, bl - 2, bw - 2.5);
                ctx.strokeStyle = 'rgba(40,24,10,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
                for (let g = 0; g < 2; g++) { const gy = -bw / 4 + g * bw / 2; ctx.moveTo(-bl / 2 + 3, gy); ctx.lineTo(bl / 2 - 3, gy + (rnd() - 0.5) * 2); }
                ctx.stroke();
                // Snapped end
                ctx.fillStyle = '#c9a070'; ctx.beginPath(); ctx.moveTo(bl / 2, -bw / 2); ctx.lineTo(bl / 2 + 5, -bw / 4); ctx.lineTo(bl / 2 + 1, 0); ctx.lineTo(bl / 2 + 6, bw / 4); ctx.lineTo(bl / 2, bw / 2); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#9aa0a6'; ctx.fillRect(-bl / 2 + 4, -1, 3, 2); ctx.fillRect(bl / 2 - 6, -bw / 2 - 2, 1.5, 4);
                ctx.restore();
            }
            break;
        }
        case 'beam': {
            // A heavy timber with one end split into splinters
            const c = WRECK.wood[Math.floor(rnd() * 4)];
            ctx.fillStyle = shade(c, -0.3); ctx.fillRect(-L / 2, -Wd / 2, L * 0.9, Wd);
            ctx.fillStyle = c; ctx.fillRect(-L / 2 + 1, -Wd / 2 + 1, L * 0.9 - 2, Wd - 3);
            ctx.fillStyle = shade(c, 0.1);
            ctx.beginPath(); ctx.moveTo(L * 0.4, -Wd / 2);
            for (let i = 0; i <= 6; i++) ctx.lineTo(L * 0.4 + (i % 2 ? L * 0.1 * (0.5 + rnd() * 0.5) : rnd() * 4), -Wd / 2 + (i / 6) * Wd);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(40,24,10,0.4)'; ctx.lineWidth = 1; ctx.beginPath();
            for (let g = 0; g < 3; g++) { const gy = -Wd / 3 + g * Wd / 3; ctx.moveTo(-L / 2 + 4, gy); ctx.lineTo(L * 0.38, gy + (rnd() - 0.5) * 3); }
            ctx.stroke();
            ctx.fillStyle = '#2a1a0c'; ctx.fillRect(-L / 2 + L * 0.2, -2, 4, 4);
            break;
        }
        case 'girder': {
            // A steel I-beam with a kink where it buckled: web, both flanges and a row of rivets
            const kink = (rnd() - 0.5) * 0.5, c = WRECK.metal[Math.floor(rnd() * 4)];
            for (const side of [-1, 1]) {
                ctx.save(); ctx.rotate(side > 0 ? kink : 0); ctx.translate(side * L / 4, 0);
                ctx.fillStyle = shade(c, -0.35); ctx.fillRect(-L / 4, -Wd / 2, L / 2, Wd);
                ctx.fillStyle = c; ctx.fillRect(-L / 4, -Wd / 2, L / 2, 3); ctx.fillRect(-L / 4, Wd / 2 - 3, L / 2, 3);
                ctx.fillStyle = shade(c, -0.15); ctx.fillRect(-L / 4, -1.5, L / 2, 3);
                ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-L / 4, -Wd / 2, L / 2, 1);
                ctx.fillStyle = shade(c, -0.5); for (let x = -L / 4 + 6; x < L / 4; x += 10) ctx.fillRect(x, -Wd / 2 + 1, 2, 1.5);
                ctx.restore();
            }
            if (rnd() < 0.6) { ctx.fillStyle = 'rgba(122,74,42,0.55)'; ctx.beginPath(); ctx.ellipse((rnd() - 0.5) * L * 0.6, 0, 8, Wd / 2, 0, 0, TAU); ctx.fill(); }
            break;
        }
        default: {
            // A crumpled sheet of corrugated roofing, rust coming through, one corner folded over
            const c = WRECK.metal[Math.floor(rnd() * 3)];
            ctx.fillStyle = shade(c, -0.25);
            ctx.beginPath(); ctx.moveTo(-L / 2, -Wd / 2); ctx.lineTo(L / 2 - 12, -Wd / 2); ctx.lineTo(L / 2, -Wd / 2 + 12); ctx.lineTo(L / 2, Wd / 2); ctx.lineTo(-L / 2 + 6, Wd / 2); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = shade(c, 0.15); ctx.lineWidth = 2; ctx.beginPath();
            for (let x = -L / 2 + 5; x < L / 2 - 4; x += 7) { const w = (rnd() - 0.5) * 3; ctx.moveTo(x, -Wd / 2 + 2); ctx.lineTo(x + w, Wd / 2 - 2); }
            ctx.stroke();
            ctx.fillStyle = shade(c, 0.25); ctx.beginPath(); ctx.moveTo(L / 2 - 12, -Wd / 2); ctx.lineTo(L / 2, -Wd / 2 + 12); ctx.lineTo(L / 2 - 14, -Wd / 2 + 10); ctx.closePath(); ctx.fill();
            for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(122,74,42,0.5)'; ctx.beginPath(); ctx.ellipse((rnd() - 0.5) * L * 0.8, (rnd() - 0.5) * Wd * 0.7, 4 + rnd() * 7, 3 + rnd() * 5, rnd() * TAU, 0, TAU); ctx.fill(); }
        }
    }
    ctx.restore();
}

// What's left where a building stood: its bare floor, scuffed and cracked, littered with splinters and scraps of metal
function drawRuinFloor(b) {
    const rnd = seededRand(b.id * 31 + 7);
    ctx.fillStyle = SPR.floors[b.floor];
    ctx.fillRect(b.x0, b.y0, b.w, b.h);
    ctx.fillStyle = 'rgba(30,26,22,0.35)';
    ctx.fillRect(b.x0, b.y0, b.w, b.h);
    ctx.strokeStyle = 'rgba(20,16,12,0.5)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
        let x = b.x0 + rnd() * b.w, y = b.y0 + rnd() * b.h, a = rnd() * TAU;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let k = 0; k < 5; k++) { a += (rnd() - 0.5) * 1.3; x += Math.cos(a) * (10 + rnd() * 25); y += Math.sin(a) * (10 + rnd() * 25); ctx.lineTo(x, y); }
        ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
        ctx.save(); ctx.translate(b.x0 + rnd() * b.w, b.y0 + rnd() * b.h); ctx.rotate(rnd() * TAU);
        ctx.fillStyle = (i % 2 ? WRECK.wood : WRECK.metal)[Math.floor(rnd() * 4)];
        ctx.fillRect(-5 - rnd() * 8, -1.5, 10 + rnd() * 16, 2 + rnd() * 2);
        ctx.restore();
    }
}

// ---------- Twelve more grenades ----------
const NADES2 = {
    fire: { name: 'Fire Grenade', rarity: 'uncommon', color: '#ff6a2a' },
    freeze: { name: 'Freeze Grenade', rarity: 'rare', color: '#8fe3ff' },
    gravity: { name: 'Gravity Grenade', rarity: 'rare', color: '#c9a7ff' },
    sticky: { name: 'Sticky Bomb', rarity: 'uncommon', color: '#7dffb0' },
    decoy: { name: 'Decoy', rarity: 'uncommon', color: '#ffd166' },
    flash: { name: 'Flashbang', rarity: 'uncommon', color: '#ffffff' },
    poison: { name: 'Poison Gas', rarity: 'rare', color: '#9bff3a' },
    shockwave: { name: 'Shockwave', rarity: 'epic', color: '#e8eef2' },
    teleport: { name: 'Teleport Grenade', rarity: 'epic', color: '#c77dff' },
    heal: { name: 'Healing Grenade', rarity: 'rare', color: '#5ee08a' },
    drone: { name: 'Drone Grenade', rarity: 'legendary', color: '#5ec3ff' },
    megafrag: { name: 'Mega Frag', rarity: 'legendary', color: '#ff4f6d' }
};
const NADE2_KEYS = Object.keys(NADES2);
const NADE2_TABLE = [['fire', 6], ['sticky', 6], ['decoy', 5], ['flash', 6], ['freeze', 4], ['gravity', 4], ['poison', 4], ['heal', 4], ['shockwave', 2.5], ['teleport', 2.5], ['drone', 1.2], ['megafrag', 1.2]];
const FREEZE = { radius: 230, time: 3500 };
const FLASH = { radius: 480, time: 8000 };  // blinded and stunned (was 3 seconds of blindness)
const GAS = { radius: 230, life: 10, dmg: 5 };
const HEALCLOUD = { radius: 210, life: 6, rate: 9 };
const DRONE = { life: 12000, hp: 60, range: 900, rate: 260, dmg: 9 };

function detonate2(key, x, y, owner) {
    switch (key) {
        case 'fire':
            // A carpet of flames that keeps burning
            addFire(x, y, 150, 8000);
            for (let i = 0; i < 5; i++) { const a = rand(0, TAU), d = rand(60, 150); addFire(x + Math.cos(a) * d, y + Math.sin(a) * d, 70, rand(5000, 8000)); }
            burst(x, y, 40, '#ff8a3d', 380, 'glow');
            G.particles.push({ type: 'boom', x, y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 160 });
            Sound.boom(Sound.volAt(x, y), 0.8);
            break;
        case 'freeze':
            G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: FREEZE.radius, color: '#bff0ff' });
            burst(x, y, 40, '#dff8ff', 320, 'glow');
            G.fgrid.query(x, y, FREEZE.radius, f => {
                if (f.dead || f === owner || !foe(owner, f) || Math.hypot(f.x - x, f.y - y) > FREEZE.radius) return;
                f.stunUntil = G.time + FREEZE.time;
                f.frozenUntil = G.time + FREEZE.time;
                damage(f, 25, owner, 'Freeze Grenade');
            });
            addDecal({ kind: 'scorch', x, y, r: FREEZE.radius * 0.7, life: 30000, tint: '200,240,255' });
            Sound.tone(1200, 0.5, 'sine', 0.1 * Sound.volAt(x, y), 2400);
            break;
        case 'gravity':
            // Everyone gets thrown up and away, and lands hard
            G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: 300, color: '#c9a7ff' });
            G.fgrid.query(x, y, 280, f => {
                const d = Math.hypot(f.x - x, f.y - y);
                if (f.dead || d > 280 || (f !== owner && !foe(owner, f))) return;
                const a = d > 1 ? Math.atan2(f.y - y, f.x - x) : rand(0, TAU), k = 1 - d / 280;
                f.kx += Math.cos(a) * 1800 * (0.4 + k); f.ky += Math.sin(a) * 1800 * (0.4 + k);
                f.stunUntil = Math.max(f.stunUntil || 0, G.time + 700);
                if (f !== owner) damage(f, 30 + 40 * k, owner, 'Gravity Grenade');
            });
            burst(x, y, 30, '#c9a7ff', 420, 'glow');
            Sound.tone(90, 0.6, 'sine', 0.15 * Sound.volAt(x, y), 400);
            break;
        case 'sticky':
            blast(x, y, owner, 170, 130, 'Sticky Bomb');
            break;
        case 'decoy':
            spawnDecoy(x, y, owner);
            break;
        case 'flash':
            flashBang(x, y, owner);
            break;
        case 'poison':
            (G.clouds || (G.clouds = [])).push({ x, y, born: G.time, kind: 'poison', owner, tick: 0 });
            Sound.tone(300, 1, 'sawtooth', 0.04 * Sound.volAt(x, y), 200);
            break;
        case 'heal':
            (G.clouds || (G.clouds = [])).push({ x, y, born: G.time, kind: 'heal', owner, tick: 0 });
            Sound.tone(660, 0.6, 'sine', 0.1 * Sound.volAt(x, y), 990);
            break;
        case 'shockwave':
            // A massive push that flings people, loot and parked cars' worth of dust outward
            G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.7, max: 0.7, size: 460, color: '#ffffff' });
            G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 1.0, max: 1.0, size: 620, color: '#c9ced6' });
            G.fgrid.query(x, y, 420, f => {
                const d = Math.hypot(f.x - x, f.y - y);
                if (f.dead || d > 420 || f.car) return;
                const a = d > 1 ? Math.atan2(f.y - y, f.x - x) : rand(0, TAU), k = 1 - d / 420;
                f.kx += Math.cos(a) * 2600 * k; f.ky += Math.sin(a) * 2600 * k;
                if (f !== owner && foe(owner, f)) damage(f, 25 + 35 * k, owner, 'Shockwave');
            });
            G.lootGrid.query(x, y, 420, l => { if (l.gone) return; const d = Math.hypot(l.x - x, l.y - y) || 1; l.vx = ((l.x - x) / d) * 700; l.vy = ((l.y - y) / d) * 700; if (!l.moving) { l.moving = true; G.movingLoot.push(l); } });
            for (let i = 0; i < 40; i++) { const a = rand(0, TAU); G.particles.push({ type: 'smoke', x, y, vx: Math.cos(a) * rand(300, 700), vy: Math.sin(a) * rand(300, 700), life: 1, max: 1, size: rand(10, 20), color: '190,180,165' }); }
            if (!G.world.floor) damageBuildings(x, y, 300, 120);
            Sound.boom(Sound.volAt(x, y), 1.4);
            break;
        case 'teleport':
            if (owner && !owner.dead && !owner.car && !blockedAt(G.world.grid, x, y, owner.r)) {
                burst(owner.x, owner.y, 30, '#c77dff', 300, 'glow');
                owner.x = x; owner.y = y; owner.vx = owner.vy = 0;
                burst(x, y, 30, '#c77dff', 300, 'glow');
                G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.4, max: 0.4, size: 80, color: '#c77dff' });
                if (owner.isPlayer) { G.cam.x = x; G.cam.y = y; }
                Sound.tone(500, 0.3, 'sine', 0.12, 1500);
            }
            break;
        case 'drone':
            (G.drones || (G.drones = [])).push({ x, y, owner, until: G.time + DRONE.life, hp: DRONE.hp, fireAt: 0, target: null, spin: 0 });
            Sound.tone(800, 0.3, 'square', 0.06, 1200);
            break;
        case 'megafrag':
            blast(x, y, owner, GRENADE.radius * 3, 170, 'Mega Frag');
            for (let i = 0; i < 60; i++) { const a = rand(0, TAU), sp = rand(700, 1300); G.particles.push({ type: 'streak', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.25, 0.45), max: 0.45, size: 3 }); }
            if (!G.world.floor) for (let i = 0; i < 4; i++) { const a = rand(0, TAU), d = rand(50, 220); addFire(x + Math.cos(a) * d, y + Math.sin(a) * d, 70, 6000); }
            break;
    }
}

// Flashbang: anyone who can see it is blinded (bots spray wildly; your screen goes white)
function flashBang(x, y, owner) {
    G.particles.push({ type: 'glow', x, y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 80, color: '#ffffff' });
    G.particles.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: FLASH.radius, color: '#ffffff' });
    const at = { x, y };
    G.fgrid.query(x, y, FLASH.radius, f => {
        const d = Math.hypot(f.x - x, f.y - y);
        if (f.dead || d > FLASH.radius || !lineOfSight(at, f)) return;
        const k = 1 - d / FLASH.radius;
        const t = FLASH.time * (0.4 + k * 0.6);
        f.blindUntil = G.time + t;
        f.stunUntil = Math.max(f.stunUntil || 0, G.time + t);
        if (f.isPlayer) { G.whiteout = Math.max(G.whiteout || 0, 0.5 + k * 0.5); G.whiteoutFade = 1 / (t / 1000); }
    });
    Sound.tone(3000, 0.6, 'sine', 0.12 * Sound.volAt(x, y), 2900);
}

function spawnDecoy(x, y, owner) {
    if (!owner) return;
    const s = blockedAt(G.world.grid, x, y, 20) ? spawnNear({ x, y }, 80, 20) : { x, y };
    const d = createFighter(s.x, s.y, { name: owner.name, color: owner.color, team: owner.team });
    Object.assign(d, { decoy: true, hp: 150, maxHp: 150, decoyUntil: G.time + 10000, angle: owner.angle, nextThink: 1e15, mode: 'rest' });
    d.inv = [...owner.inv]; d.slot = owner.slot;
    G.fighters.push(d);
    burst(s.x, s.y, 16, '#ffd166', 200, 'glow');
}

function updateGadgets(dt) {
    // Decoys stand around looking busy until they're shot or fade out
    for (const f of G.fighters) if (f.decoy && !f.dead) {
        f.vx = f.vy = 0;
        f.angle += Math.sin(G.time / 400) * dt;
        if (G.time > f.decoyUntil) { f.dead = true; burst(f.x, f.y, 14, '#ffd166', 160, 'glow'); }
    }
    // Clouds: poison hurts anyone inside; the healing cloud patches up you and your friends
    if (G.clouds && G.clouds.length) {
        for (const c of G.clouds) {
            const life = c.kind === 'poison' ? GAS.life : HEALCLOUD.life, R = c.kind === 'poison' ? GAS.radius : HEALCLOUD.radius;
            if ((G.time - c.born) / 1000 > life) { c.done = true; continue; }
            c.tick -= dt;
            if (c.tick > 0) continue;
            c.tick = 0.5;
            G.fgrid.query(c.x, c.y, R, f => {
                if (f.dead || Math.hypot(f.x - c.x, f.y - c.y) > R) return;
                if (c.kind === 'poison') { if (f === c.owner || foe(c.owner, f)) damage(f, GAS.dmg, c.owner, 'Poison Gas'); }
                else if (f === c.owner || !foe(c.owner, f)) f.hp = Math.min(f.maxHp || CONFIG.MAX_HEALTH, f.hp + HEALCLOUD.rate * 0.5);
            });
        }
        G.clouds = G.clouds.filter(c => !c.done);
    }
    // Drones hunt the nearest enemy and strafe it
    if (G.drones && G.drones.length) {
        for (const d of G.drones) {
            if (G.time > d.until || d.hp <= 0 || !d.owner) { d.done = true; burst(d.x, d.y, 14, '#5ec3ff', 200); continue; }
            d.spin += dt * 30;
            if (!d.target || d.target.dead || dist(d, d.target) > DRONE.range) {
                d.target = null;
                let bd = DRONE.range;
                G.fgrid.query(d.x, d.y, DRONE.range, f => { if (!f.dead && !f.decoy && foe(d.owner, f)) { const dd = dist(d, f); if (dd < bd) { bd = dd; d.target = f; } } });
            }
            const goal = d.target || d.owner;
            const a = Math.atan2(goal.y - d.y, goal.x - d.x), dd = dist(d, goal), want = d.target ? 170 : 90;
            const orbit = a + (dd < want + 40 ? Math.PI / 2 : 0);
            d.x += Math.cos(orbit) * 340 * dt; d.y += Math.sin(orbit) * 340 * dt;
            if (d.target && G.time >= d.fireAt && lineOfSight(d, d.target)) {
                d.fireAt = G.time + DRONE.rate;
                const fa = Math.atan2(d.target.y - d.y, d.target.x - d.x) + rand(-0.06, 0.06);
                G.bullets.push({ x: d.x, y: d.y, vx: Math.cos(fa) * 1500, vy: Math.sin(fa) * 1500, dmg: DRONE.dmg, owner: d.owner, left: 1000, weapon: 'Drone' });
                Sound.shot('light', Sound.volAt(d.x, d.y) * 0.6);
            }
        }
        G.drones = G.drones.filter(d => !d.done);
    }
    if (G.whiteout > 0) G.whiteout = Math.max(0, G.whiteout - dt * (G.whiteoutFade || 0.35));
}

// Shooting a drone down
function bulletHitsDrone(b) {
    for (const d of G.drones || []) {
        if (d.owner === b.owner || !foe(b.owner, d.owner) || Math.hypot(b.x - d.x, b.y - d.y) > 16) continue;
        d.hp -= b.dmg;
        burst(b.x, b.y, 4, '#5ec3ff', 160, 'glow');
        return true;
    }
    return false;
}

function drawGadgets(now) {
    for (const c of G.clouds || []) {
        const poison = c.kind === 'poison', life = poison ? GAS.life : HEALCLOUD.life, R = poison ? GAS.radius : HEALCLOUD.radius;
        const t = (G.time - c.born) / 1000, a = Math.min(1, t * 2, (life - t) / 1.5);
        if (!inView(c.x, c.y, R)) continue;
        for (let i = 0; i < 7; i++) {
            const ang = i * 0.9 + now * 0.3 * (i % 2 ? 1 : -1), r = R * (0.35 + (i % 3) * 0.2);
            ctx.fillStyle = poison ? `rgba(120,220,40,${0.16 * a})` : `rgba(120,255,170,${0.13 * a})`;
            ctx.beginPath(); ctx.arc(c.x + Math.cos(ang) * r * 0.5, c.y + Math.sin(ang) * r * 0.5, r, 0, TAU); ctx.fill();
        }
        if (!poison && Math.random() < 0.3) G.particles.push({ type: 'plus', x: c.x + rand(-R, R) * 0.7, y: c.y + rand(-R, R) * 0.7, vx: 0, vy: -40, life: 0.8, max: 0.8, size: 5 });
    }
    for (const d of G.drones || []) {
        if (!inView(d.x, d.y, 60)) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(d.x + 12, d.y + 20, 14, 8, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(d.x, d.y);
        ctx.strokeStyle = '#2b2f38'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, 12); ctx.moveTo(12, -12); ctx.lineTo(-12, 12); ctx.stroke();
        for (const [rx, ry] of [[-12, -12], [12, 12], [12, -12], [-12, 12]]) { ctx.fillStyle = 'rgba(200,220,240,0.35)'; ctx.beginPath(); ctx.ellipse(rx, ry, 8, 3, d.spin, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#3a4250'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
        ctx.fillStyle = d.target ? '#ff3b3b' : '#5ec3ff'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, TAU); ctx.fill();
        ctx.restore();
    }
}

// Ice over anyone frozen
function drawFrozen(f) {
    if (!(G.time < (f.frozenUntil || 0))) return;
    ctx.fillStyle = 'rgba(190,240,255,0.55)';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, r = f.r + (i % 2 ? 6 : 12); i ? ctx.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r) : ctx.moveTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
}

// One icon style for all twelve: a canister in the grenade's color with its own symbol
function drawNade2Icon(g, key, x, y, s) {
    const N = NADES2[key];
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#1a1424'; g.beginPath(); g.arc(0, 2, 12, 0, TAU); g.fill();
    g.fillStyle = shade(N.color, -0.35); g.beginPath(); g.arc(0, 2, 10, 0, TAU); g.fill();
    g.fillStyle = N.color; g.beginPath(); g.arc(-2, 0, 7, 0, TAU); g.fill();
    g.fillStyle = '#1a1424'; g.strokeStyle = '#1a1424'; g.lineWidth = 2;
    switch (key) {
        case 'fire': g.beginPath(); g.moveTo(0, -5); g.quadraticCurveTo(5, 1, 0, 6); g.quadraticCurveTo(-5, 1, 0, -5); g.fill(); break;
        case 'freeze': g.beginPath(); for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; g.moveTo(Math.cos(a) * 6, 1 + Math.sin(a) * 6); g.lineTo(-Math.cos(a) * 6, 1 - Math.sin(a) * 6); } g.stroke(); break;
        case 'gravity': g.beginPath(); g.moveTo(0, 6); g.lineTo(0, -5); g.moveTo(-4, -1); g.lineTo(0, -5); g.lineTo(4, -1); g.stroke(); break;
        case 'sticky': g.beginPath(); g.arc(0, 1, 4, 0, TAU); g.fill(); g.fillRect(-1, 4, 2, 5); break;
        case 'decoy': g.beginPath(); g.arc(0, -2, 3, 0, TAU); g.fill(); g.beginPath(); g.arc(0, 6, 5, Math.PI, 0); g.fill(); break;
        case 'flash': g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.moveTo(0, 1); g.lineTo(Math.cos(a) * 7, 1 + Math.sin(a) * 7); } g.stroke(); break;
        case 'poison': g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fill(); g.fillRect(-4, 4, 2, 3); g.fillRect(2, 4, 2, 3); break;
        case 'shockwave': for (const r of [3, 6]) { g.beginPath(); g.arc(0, 1, r, 0, TAU); g.stroke(); } break;
        case 'teleport': g.beginPath(); g.ellipse(0, 1, 6, 3, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(0, 1, 2, 6, 0, 0, TAU); g.stroke(); break;
        case 'heal': g.fillRect(-1.5, -4, 3, 10); g.fillRect(-5, -0.5, 10, 3); break;
        case 'drone': g.beginPath(); g.moveTo(-5, -4); g.lineTo(5, 6); g.moveTo(5, -4); g.lineTo(-5, 6); g.stroke(); break;
        case 'megafrag': g.font = '700 10px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('M', 0, 1.5); break;
    }
    g.fillStyle = '#9aa3ae'; g.fillRect(-3, -13, 6, 4);
    g.restore();
}

// The secret: type capital X Y Z while standing next to a tree for one of every grenade
function secretGrenades(p) {
    let tree = false;
    G.world.grid.query(p.x, p.y, 200, o => { if (!tree && o.type === 'tree' && !o.broken && Math.hypot(o.x - p.x, o.y - p.y) < (o.canopy || 80) * 0.6 + 60) tree = true; });
    if (!tree) return false;
    for (const k of THROWABLES) if (k !== 'cure' || G.zombies) p.items[k] = Math.max(p.items[k], 1);
    addFloat(p.x, p.y - 44, '...the tree remembers you', '#7dffb0', true);
    burst(p.x, p.y, 30, '#7dffb0', 220, 'glow');
    Sound.tone(523, 0.5, 'sine', 0.12, 1046);
    return true;
}

// ---------- Physics ----------
function moveFighter(f, dt) {
    if (f.car) return;
    const ox = f.x, oy = f.y;
    const slow = (f.downed ? 0.2 : 1) * (f.healing ? 0.5 : 1) * hurtPace(f) * tiredPace(f) * (G.survival && G.world.ponds && inPond(f) ? 0.6 : 1);
    f.x += (f.vx * slow + f.kx) * dt;
    f.y += (f.vy * slow + f.ky) * dt;
    const kd = Math.exp(-7 * dt);
    f.kx *= kd;
    f.ky *= kd;
    G.world.grid.query(f.x, f.y, f.r, o => {
        if (!blocksMove(o)) return;
        if (levelSkips(o, f.up || null)) return;  // walking on an upper floor over the rooms (or past what's on another floor)
        if (isBox(o)) {
            const nx = clamp(f.x, o.x - o.hw, o.x + o.hw), ny = clamp(f.y, o.y - o.hh, o.y + o.hh);
            const dx = f.x - nx, dy = f.y - ny;
            const d2 = dx * dx + dy * dy;
            if (d2 >= f.r * f.r) return;
            if (d2 > 0) {
                const d = Math.sqrt(d2);
                f.x = nx + (dx / d) * f.r;
                f.y = ny + (dy / d) * f.r;
            } else if (o.hw - Math.abs(f.x - o.x) < o.hh - Math.abs(f.y - o.y)) {
                f.x = o.x + (f.x < o.x ? -1 : 1) * (o.hw + f.r);
            } else {
                f.y = o.y + (f.y < o.y ? -1 : 1) * (o.hh + f.r);
            }
            return;
        }
        const dx = f.x - o.x, dy = f.y - o.y;
        const min = o.r + f.r;
        const d2 = dx * dx + dy * dy;
        if (d2 < min * min) {
            const d = Math.sqrt(d2) || 0.01;
            f.x = o.x + (dx / d) * min;
            f.y = o.y + (dy / d) * min;
        }
    });
    const W = CONFIG.WORLD_SIZE;
    f.x = clamp(f.x, f.r, W - f.r);
    f.y = clamp(f.y, f.r, W - f.r);
    // The deck's parapet keeps you up there (the stairs are the only way down)
    if (f.up) clampToDeck(f);

    // Bots that get wedged against something take a short detour
    if (!isHuman(f) && f._wantSpeed > 0) {
        const moved = Math.hypot(f.x - ox, f.y - oy) / dt;
        if (moved < f._wantSpeed * 0.25) f.stuck += dt; else f.stuck = 0;
        if (f.stuck > 0.4) {
            // Wedged in a corner: back off the other way and hold that heading for a bit
            f.stuck = 0;
            f.avoidSide = -f.avoidSide;
            f.detour = rand(0.5, 0.9);
            f.detourAngle = Math.atan2(f.vy, f.vx) + f.avoidSide * rand(1.4, 2.4);
            f.heading = f.detourAngle;
            f.headingHold = G.time + 1500;
        }
    }
}

function separateFighters() {
    for (const f of G.fighters) {
        G.fgrid.query(f.x, f.y, f.r * 2, o => {
            if (o === f || o.dead || (o.up || null) !== (f.up || null)) return;
            const dx = f.x - o.x, dy = f.y - o.y;
            const min = f.r + o.r;
            const d2 = dx * dx + dy * dy;
            if (d2 < min * min && d2 > 0) {
                const d = Math.sqrt(d2);
                const push = (min - d) / 2;
                f.x += (dx / d) * push;
                f.y += (dy / d) * push;
            }
        });
    }
}

function updateHidden(f) {
    if (f.ghost) { f.hidden = !ghostSeen(f); return; }  // (the ghost is unseen unless it's just shot or been hit)
    if (f.car && vt(f.car).stealth && G.time - (f.car.firedAt || -1e9) > 1500) { f.hidden = true; return; }
    f.hidden = inSmoke(f.x, f.y);
    // Firing gives your position away for a moment, even from cover
    if (G.time - (f.lastLoud || -1e9) < 800) { f.hidden = false; return; }
    // Look wide enough to catch big canopies whose trunk is a fair way off
    G.world.grid.query(f.x, f.y, 170, o => {
        if (f.hidden || (o.type !== 'tree' && o.type !== 'bush') || o.dead) return;
        const reach = o.type === 'tree' ? o.canopy * 0.8 : o.r * 0.85;
        if (Math.hypot(f.x - o.x, f.y - o.y) < reach) f.hidden = true;
    });
}

function updateBullets(dt) {
    const W = CONFIG.WORLD_SIZE;
    for (const b of G.bullets) {
        if (b.homing) steerHoming(b, dt);
        const speed = Math.hypot(b.vx, b.vy);
        const total = speed * dt;
        const steps = Math.max(1, Math.ceil(total / 14));
        const sx = (b.vx * dt) / steps, sy = (b.vy * dt) / steps, sl = total / steps;
        for (let s = 0; s < steps && !b.dead; s++) {
            b.x += sx;
            b.y += sy;
            b.left -= sl;
            if (b.left <= 0 || b.x < 0 || b.y < 0 || b.x > W || b.y > W) {
                b.dead = true;
                if (b.left <= 0 && !b.rocket && inView(b.x, b.y, 30)) G.particles.push({ type: 'smoke', x: b.x, y: b.y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 4, color: '170,150,120' });
                break;
            }
            if (b.rocket && inView(b.x, b.y, 50) && s === 0 && Math.random() < 0.9) {
                G.particles.push({ type: 'smoke', x: b.x, y: b.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.9, max: 0.9, size: rand(6, 10), color: '200,196,190' });
                G.particles.push({ type: 'glow', x: b.x, y: b.y, vx: -b.vx * 0.1, vy: -b.vy * 0.1, life: 0.2, max: 0.2, size: rand(4, 7), color: '#ffb347' });
            }

            let wall = null, bush = null;
            if (b.up === undefined) b.up = (b.owner && b.owner.up) || null;
            // (indoors on a castle's middle floor: a shot stops at the outside of the ring)
            if (isMid(b.up) && !onDeck(b.up, b)) { b.dead = true; break; }
            G.world.grid.query(b.x, b.y, 0, o => {
                if (wall || !blocksMove(o) || !pointInObstacle(b.x, b.y, o)) return;
                // Shots from the deck go over everything under it and over the parapet; a base's own guns fire over its walls
                if (levelSkips(o, b.up)) return;
                if (b.over && o.base === b.over) return;
                // From the yard, about half the shots aimed up at the deck clear the parapet
                if (o.parapet && !b.up) { if (b.parapetTry !== o) { b.parapetTry = o; b.clears = Math.random() < 0.5; } if (b.clears) { b.up = o.parapet; return; } }
                wall = o;
                if (o.type === 'bush' && o !== b.lastBush && (b.x - o.x) ** 2 + (b.y - o.y) ** 2 < (o.r * 0.8) ** 2) bush = o;
            });
            if (bush) { b.lastBush = bush; damagePlant(bush, b.dmg * 0.5, b.owner); }
            if (wall) {
                b.dead = true;
                if (wall.type === 'box') { damageBox(wall, b.dmg * 0.5, b.owner); break; }
                if (wall.baseWall) damageBaseWall(wall, b.dmg, b.owner);
                if (wall.fortBlock) damageFortBlock(wall, b.dmg * 0.6);
                if (mineable(wall)) mineHit(wall, b.dmg * 0.6, b.owner);
                if (wall.drivecar) damageCar(wall.drivecar, b.dmg * 0.6, b.owner);
                if (wall.type === 'tree') { damagePlant(wall, b.dmg, b.owner); break; }
                const col = wall.type === 'rock' ? '#d6dae2' : wall.type === 'crate' ? '#d9a066' : wall.type === 'wall' ? '#d8cfc0' : '#9a6b45';
                burst(b.x - sx, b.y - sy, 5, col, 150);
                if (inView(b.x, b.y, 50)) {
                    burst(b.x - sx, b.y - sy, 3, '#ffe08a', 260, 'glow');
                    G.particles.push({ type: 'smoke', x: b.x - sx, y: b.y - sy, vx: -sx * 2, vy: -sy * 2, life: 0.6, max: 0.6, size: rand(4, 7), color: '190,180,165' });
                }
                if (WEAPONS[b.weapon] && WEAPONS[b.weapon].string) addDecal({ kind: 'bolt', x: b.x - sx * 0.5, y: b.y - sy * 0.5, a: Math.atan2(b.vy, b.vx), life: 60000 });
                else if (wall.type === 'wall' || (wall.type === 'crate' && !wall.car)) addDecal({ kind: 'hole', x: b.x - sx * 0.3, y: b.y - sy * 0.3, life: 60000 });
                break;
            }

            let hit = null;
            G.fgrid.query(b.x, b.y, 24, f => {
                if (hit || f.dead || f.car || !foe(b.owner, f) || (b.pierced && b.pierced.has(f))) return;
                // Different levels: the deck shields whoever's under it, and only shots that came up over the parapet reach the deck
                if ((f.up || null) !== (b.up || null) && (f.up || isMid(b.up) || underRing(b.up, f))) return;
                const rr = f.r + 3;
                if ((b.x - f.x) ** 2 + (b.y - f.y) ** 2 < rr * rr) hit = f;
            });
            if (!hit && G.traffic.length && !G.world.floor && bulletHitsCar(b)) { b.dead = true; break; }
            if (!hit && G.world.cars && bulletHitsDrivenCar(b)) { b.dead = true; break; }
            if (!hit && G.drones && G.drones.length && bulletHitsDrone(b)) { b.dead = true; break; }
            if (!hit && G.survival && !G.world.floor) {
                let prey = null;
                G.agrid.query(b.x, b.y, 40, a => { if (!prey && !a.dead && (b.x - a.x) ** 2 + (b.y - a.y) ** 2 < (a.r + 4) ** 2) prey = a; });
                if (prey) { b.dead = true; damageAnimal(prey, b.dmg, b.owner); break; }
            }
            if (hit) {
                const BW = WEAPONS[b.weapon];
                if (BW && BW.pierce) (b.pierced || (b.pierced = new Set())).add(hit); else b.dead = true;
                if (BW && BW.chain) chainLightning(hit, b.owner, BW.chain, b.dmg * 0.8);
                // How close the shot's line passes to the middle: dead center is the head
                const perp = Math.abs((hit.x - b.x) * b.vy - (hit.y - b.y) * b.vx) / speed;
                const head = perp < hit.r * REALISM.headZone;
                const mul = !head ? 1 : hit.zombie ? REALISM.zombieHeadMul : hit.soldier && !hit.boss ? REALISM.helmetMul : REALISM.headMul;
                const armored = hit.armor > 0;
                damage(hit, b.dmg * mul, b.owner, b.weapon);
                burst(b.x, b.y, b.heavy ? 14 : 6, armored ? '#8fd8ff' : '#a3121e', 200, 'blood');
                if (!armored) bloodSplat(hit.x + b.vx / speed * hit.r * 0.6, hit.y + b.vy / speed * hit.r * 0.6, Math.atan2(b.vy, b.vx), b.heavy ? 1.5 : 1);
                if (head && b.owner && b.owner.isPlayer && !hit.dead && G.time - (hit.headAt || -1e9) > 700) { hit.headAt = G.time; addFloat(hit.x, hit.y - 46, 'HEADSHOT', '#ffd166', true); Sound.tone(1500, 0.05, 'square', 0.08); }
                else if (head && hit.isPlayer) G.hurt = Math.max(G.hurt, 0.6);
            }
        }
        if (b.dead && b.explosive) miniBlast(b.x - b.vx * 0.008, b.y - b.vy * 0.008, b.owner);
        if (b.dead && b.rocket) {
            const ex = clamp(b.x - b.vx * 0.012, 0, W), ey = clamp(b.y - b.vy * 0.012, 0, W);
            blast(ex, ey, b.owner, b.blastR || ROCKET.radius, b.blastDmg || ROCKET.damage, b.weapon);
            // A tesla bolt arcs on to the people round where it struck
            if (b.zap) { let near = null, nd = 220; G.fgrid.query(ex, ey, 220, f => { const d = Math.hypot(f.x - ex, f.y - ey); if (!f.dead && foe(b.owner, f) && d < nd) { nd = d; near = f; } }); if (near) chainLightning(near, b.owner, b.zap, 40, b.weapon); burst(ex, ey, 16, '#7fe9ff', 320, 'glow'); }
        }
    }
    G.bullets = G.bullets.filter(b => !b.dead);
}

function updateParticles(dt) {
    for (const p of G.particles) {
        if (p.type === 'cube') { updateCube(p, dt); continue; }
        p.life -= dt;
        if (p.type === 'shell' && p.life <= 0) addCasing(p.x, p.y);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const drag = p.type === 'smoke' ? 0.9 : 0.86;
        p.vx *= Math.pow(drag, dt * 10);
        p.vy *= Math.pow(drag, dt * 10);
    }
    G.particles = G.particles.filter(p => p.life > 0);
    for (const f of G.floats) { f.life -= dt; f.y -= 40 * dt; }
    G.floats = G.floats.filter(f => f.life > 0);
}

// ---------- Main update ----------
function update(dt) {
    G.time += dt * 1000;
    Sound.budget = 0;

    G.fgrid.reset();
    for (const f of G.fighters) G.fgrid.insert(f);

    if (G.mode !== 'demo' && !G.frozen) { if (!G.world.floor || !G.escape) updateZone(dt); if (!G.world.floor) updateAirdrops(dt); }
    if (G.world.stairs.length && G.mode === 'playing' && G.player && !G.player.dead && !G.frozen && !G.player.car) checkStairs(dt);
    if (G.war && G.time >= G.war.nextCenter) updateTeamCenters();
    if (G.noZone) updateOutbreak(dt);
    if (G.murder) updateMurder(dt);
    if (G.ghostMode) updateGhost(dt);
    if (G.fort) updateFort(dt);
    if (G.world.maze && G.escape && G.mode === 'playing') updateMazeFog();
    if (G.survival) { if (!G.frozen && !G.world.floor) updateAnimals(dt); updateCountdown(); }
    updateDayCycle();
    if (G.escape && !G.world.floor && G.time >= G.nextSquads) updateSquads();
    if (G.escape && G.world.city && !G.world.floor && G.mode !== 'over') updateChaos(dt);
    if (!G.world.floor) updateWreckage(dt);
    const z = G.zone;

    for (const f of G.fighters) {
        if (f.dead) continue;
        updateHidden(f);
        if (isHuman(f)) { if (G.mode === 'playing') updatePlayer(f, dt); else { f.vx = 0; f.vy = 0; } }
        else if (G.frozen || stunned(f) || f.car) { f.vx = f.vy = 0; }
        else { updateBot(f, dt); fleeNuke(f); }
        updateHeal(f, dt);
        if (G.survival && !G.frozen) { updateHunger(f, dt); if (!f.dead) updateNeeds(f, dt); }
        updateCook(f);
        f.recoil = Math.max(0, f.recoil - dt * 8);
        f.bloom = Math.max(0, (f.bloom || 0) - dt * REALISM.bloomDecay);
        updatePerks(f, dt);
        if (f.chill) f.chill = Math.max(0, f.chill - dt * 0.35);
        f.punch = Math.max(0, f.punch - dt * 5);
        f.hitFlash = Math.max(0, f.hitFlash - dt * 6);

        if (G.mode !== 'demo' && Math.hypot(f.x - z.cx, f.y - z.cy) > z.r) {
            // A vehicle out in the storm wears down instead of the people in it, about as fast as a person would
            // (the driver counts it once)
            if (f.car && !f.car.dead) { if (f.car.driver === f) damageCar(f.car, z.dmg * dt * vt(f.car).hp / 100, null); continue; }
            f.hp -= z.dmg * dt;
            if (f.isPlayer) G.hurt = Math.max(G.hurt, 0.35);
            if (f.hp <= 0) killFighter(f, null, 'zone');
        }
    }
    for (const f of G.fighters) if (!f.dead) moveFighter(f, dt);
    separateFighters();
    if (G.world.cars) updateCars(dt);
    updateBullets(dt);
    updateLobs();
    updateGrenades(dt);
    updateGadgets(dt);
    updateStrikes(dt);
    updateNukes(dt);
    if (G.revolution) updateRevolution(dt);
    if (G.war) updateDowned(dt);
    updateMines();
    G.smokes = G.smokes.filter(sm => (G.time - sm.born) / 1000 < SMOKE.life);
    if (G.cures.length) updateCures(dt);
    G.fighters = G.fighters.filter(f => !f.dead);
    updateLoot(dt);
    expireDeathDrops();
    updateParticles(dt);

    G.shake = Math.max(0, G.shake - dt * 40);
    // After a nuke the ground keeps rumbling for a few seconds
    if (G.time < (G.quakeUntil || 0)) G.shake = Math.max(G.shake, 22 * G.quakePower * ((G.quakeUntil - G.time) / 5000));
    G.hurt = Math.max(0, G.hurt - dt * 1.2);
    G.hitMarker = Math.max(0, G.hitMarker - dt * 6);
    G.zoomKick = Math.max(0, G.zoomKick - dt * 0.5);
    // How far out the camera sits; it eases between views
    const target = G.mode === 'demo' ? 1 : strikeCamOn() ? wideZoom() : normalZoom();
    G.viewZoom = G.viewZoom ? lerp(G.viewZoom, target, Math.min(1, dt * 4)) : target;
    G.zoom = G.viewZoom * (1 + G.zoomKick + G.winZoom);

    updateCamera(dt);

    if (G.mode === 'demo' && (G.fighters.length < 8 || (G.war && G.teamAlive.filter(n => n > 0).length < 2) || (G.noZone && (G.sides.b === 0 || G.sides.a < 5)) || (G.escape && G.time > 90000))) newDemo();
    if (G.survival && G.mode === 'playing' && !G.frozen && G.player && !G.player.dead) survivalReminders();
    // Team modes: once you're dead (and your side fights on), ask whether you want to spectate
    if (G.war && G.mode === 'playing' && G.player && G.player.dead && !G.result && !G.spectateAsked && G.time - (G.player.diedAt || 0) > 1200) askSpectate();
    if (G.result && !screens.spectate.classList.contains('hidden')) screens.spectate.classList.add('hidden');
    if (G.result && G.mode === 'playing' && G.time >= G.overAt) showGameOver();
}

function askSpectate() {
    G.spectateAsked = true;
    const p = G.player, left = G.teamAlive[p.team] || 0;
    $('sp-sub').textContent = `${left} of your team ${left === 1 ? 'is' : 'are'} still fighting.${G.revolution ? ' There are no respawns in Revolution.' : ''}`;
    screens.spectate.classList.remove('hidden');
    document.body.classList.remove('playing');
    mouse.down = false;
}

// Manning a castle cannon: the camera looks out ahead, toward the enemy castle: the view starts at your castle's
// front wall and runs out across the field (rather than your own castle filling it)
function cannonLook(f, w, h, zoom) {
    const c = f.car, e = c.foeBase && c.foeBase.c;
    if (!e) return { x: c.x, y: c.y };
    const a = Math.atan2(e.y - c.y, e.x - c.x), dx = Math.cos(a), dy = Math.sin(a);
    const hw = w / 2 / zoom, hh = h / 2 / zoom, edge = Math.min(Math.abs(dx) > 1e-3 ? hw / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-3 ? hh / Math.abs(dy) : Infinity);
    // (the near edge of the view sits at your castle's front wall, so it's all the ground out in front)
    const own = c.tower, fx = own.c.x + own.fwd.x * REVO.base.depth / 2, fy = own.c.y + own.fwd.y * REVO.base.depth / 2;
    const toFront = Math.max(0, (fx - c.x) * dx + (fy - c.y) * dy);
    const d = toFront + edge - 120;
    return { x: c.x + dx * d, y: c.y + dy * d };
}
const strikeCamOn = () => !!(G.strikeCam && G.mode !== 'demo' && G.time < G.strikeCam.until);
function updateCamera(dt) {
    let tx = G.cam.x, ty = G.cam.y;
    if (G.strikeCam && !strikeCamOn()) G.strikeCam = null;
    if (!strikeCamOn() && inCannon(G.player) && G.mode !== 'demo') {
        const t = cannonLook(G.player, viewW, viewH, G.zoom);
        G.cam.x += (t.x - G.cam.x) * Math.min(1, dt * 3);
        G.cam.y += (t.y - G.cam.y) * Math.min(1, dt * 3);
    } else if (strikeCamOn()) {
        G.cam.x += (G.strikeCam.x - G.cam.x) * Math.min(1, dt * 3);
        G.cam.y += (G.strikeCam.y - G.cam.y) * Math.min(1, dt * 3);
    } else if (G.mode === 'demo') {
        if (!G.demoFollow || G.demoFollow.dead || Math.random() < dt * 0.08) G.demoFollow = pick(G.fighters);
        if (G.demoFollow) { tx = G.demoFollow.x; ty = G.demoFollow.y; }
        G.cam.x += (tx - G.cam.x) * Math.min(1, dt * 1.2);
        G.cam.y += (ty - G.cam.y) * Math.min(1, dt * 1.2);
    } else if (G.player && !G.player.dead) {
        const p = G.player;
        if (p.scoped && !canScope(p)) p.scoped = false;
        if (p.scoped) p.scopeAt = scopeTarget(p); else p.scopeAt = null;
        const t = p.scopeAt || p;
        G.cam.x += (t.x - G.cam.x) * Math.min(1, dt * (p.scopeAt ? 9 : 12));
        G.cam.y += (t.y - G.cam.y) * Math.min(1, dt * (p.scopeAt ? 9 : 12));
    } else if (G.war && G.player && G.spectating) {
        // Spectate a teammate (once you've chosen to after dying)
        if (!G.demoFollow || G.demoFollow.dead) {
            const mates = G.fighters.filter(f => f.team === G.player.team);
            G.demoFollow = mates.length ? mates.reduce((a, f) => (dist(f, G.cam) < dist(a, G.cam) ? f : a)) : null;
        }
        if (G.demoFollow) {
            G.cam.x += (G.demoFollow.x - G.cam.x) * Math.min(1, dt * 4);
            G.cam.y += (G.demoFollow.y - G.cam.y) * Math.min(1, dt * 4);
        }
    }
    const W = CONFIG.WORLD_SIZE;
    const hw = viewW / 2 / G.zoom, hh = viewH / 2 / G.zoom;
    G.cam.x = hw * 2 < W ? clamp(G.cam.x, hw, W - hw) : W / 2;
    G.cam.y = hh * 2 < W ? clamp(G.cam.y, hh, W - hh) : W / 2;
}

// ---------- Rendering ----------
let lowDetail = false;  // skip small touches when zoomed far out
function render() {
    const now = performance.now() / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1d3a1a';
    ctx.fillRect(0, 0, viewW, viewH);
    if (!G) return;

    const sx = G.shake ? rand(-G.shake, G.shake) * 0.5 : 0;
    const sy = G.shake ? rand(-G.shake, G.shake) * 0.5 : 0;
    const zoom = G.zoom;
    const camX = G.cam.x - viewW / 2 / zoom + sx, camY = G.cam.y - viewH / 2 / zoom + sy;
    const L = camX, T = camY, R = camX + viewW / zoom, B = camY + viewH / zoom;
    const cx = G.cam.x, cy = G.cam.y, half = Math.hypot(viewW, viewH) / 2 / zoom;
    lowDetail = zoom < 0.45;
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, Math.round(-camX * dpr * zoom), Math.round(-camY * dpr * zoom));

    // Ground
    const W = CONFIG.WORLD_SIZE;
    if (G.world.floor) drawFloorBase(L, T, R, B);
    else if (G.world.city) drawCity(L, T, R, B);
    else {
        ctx.fillStyle = SPR.grass;
        ctx.fillRect(Math.max(0, L), Math.max(0, T), Math.min(W, R) - Math.max(0, L), Math.min(W, B) - Math.max(0, T));
        G.world.decorGrid.query(cx, cy, half, d => {
            const s = 128 * d.s;
            ctx.drawImage(SPR.patches[d.spr], d.x - s, d.y - s, s * 2, s * 2);
        });
        drawGroundDetail(L, T, R, B);
        drawRoads();
    }
    if (G.world.city && !G.world.floor) drawGroundDetail(L, T, R, B);
    if (G.world.ponds) drawPonds(L, T, R, B, now);

    // Building floors
    const houses = G.world.buildings.filter(b => b.x1 > L - 20 && b.x0 < R + 20 && b.y1 > T - 20 && b.y0 < B + 20);
    for (const b of houses) {
        if (b.collapsed) { drawRuinFloor(b); continue; }
        ctx.fillStyle = 'rgba(20,10,20,0.3)';
        ctx.fillRect(b.x0 + 8, b.y0 + 10, b.w, b.h);
        // The full interior only once the roof is coming off (nobody can see it under a solid roof)
        if (b.rooms && b.roofAlpha < 0.99) ctx.drawImage(houseFloorArt(b), b.x0, b.y0);
        else { ctx.fillStyle = SPR.floors[b.floor]; ctx.fillRect(b.x0, b.y0, b.w, b.h); }
    }
    if (G.revolution) { drawBases(L, T, R, B); drawBaseFlags(); drawShells(); drawGates(); }
    drawDecals(L, T, R, B, 'ground');

    for (const st of G.stumps) {
        if (!inView(st.x, st.y, 40)) continue;
        ctx.fillStyle = '#4a2f1d';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r + 2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#b08458';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r - 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(90,60,35,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r * 0.6, 0, TAU); ctx.moveTo(st.x + st.r * 0.25, st.y); ctx.arc(st.x, st.y, st.r * 0.25, 0, TAU); ctx.stroke();
    }

    // Scorch marks left by explosions fade out over time
    for (const sc of G.scorches) {
        const age = (G.time - sc.born) / 1000;
        const a = clamp(1 - (age - 20) / 10, 0, 1);
        if (a <= 0 || !inView(sc.x, sc.y, sc.r)) continue;
        const grad = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, sc.r);
        grad.addColorStop(0, `rgba(20,14,12,${0.7 * a})`);
        grad.addColorStop(0.6, `rgba(30,22,16,${0.4 * a})`);
        grad.addColorStop(1, 'rgba(30,22,16,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(sc.x, sc.y, sc.r, 0, TAU); ctx.fill();
    }

    // Collect visible obstacles once
    const trees = [], rocks = [], bushes = [], boxes = [];
    G.world.grid.query(cx, cy, half, o => {
        if (isBox(o)) {
            if (o.x + o.hw > L && o.x - o.hw < R && o.y + o.hh > T && o.y - o.hh < B) boxes.push(o);
            return;
        }
        if (o.x + 100 < L || o.x - 100 > R || o.y + 100 < T || o.y - 100 > B) return;
        (o.type === 'tree' ? trees : o.type === 'rock' ? rocks : bushes).push(o);
    });

    // Tree shadows and trunks
    ctx.fillStyle = 'rgba(10,30,10,0.22)';
    if (!lowDetail) for (const o of trees) { if (o.dead) continue; ctx.beginPath(); ctx.ellipse(o.x + 14, o.y + 18, o.canopy * 0.95, o.canopy * 0.85, 0, 0, TAU); ctx.fill(); }
    for (const o of trees) {
        ctx.fillStyle = '#4a2f1d';
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#7a5134';
        ctx.beginPath(); ctx.arc(o.x - 1, o.y - 1, o.r - 1, 0, TAU); ctx.fill();
    }

    // Next zone preview
    const z = G.zone;
    if (G.mode !== 'demo' && z.state === 'wait') {
        ctx.save();
        ctx.setLineDash([24 / Math.min(1, G.zoom), 16 / Math.min(1, G.zoom)]);
        ctx.lineWidth = Math.max(4, 2 / G.zoom);
        ctx.strokeStyle = 'rgba(255,247,236,0.55)';
        ctx.beginPath(); ctx.arc(z.tcx, z.tcy, Math.max(1, z.tr), 0, TAU); ctx.stroke();
        ctx.restore();
    }

    if (G.world.stairs.length) drawStairs(now);
    drawLoot(cx, cy, half, now);
    if (G.survival && !G.world.floor) drawAnimals(L, T, R, B);
    drawMines(now);
    drawStrikeMarkers(now);

    // Rocks
    for (const o of rocks) {
        ctx.fillStyle = 'rgba(10,30,10,0.25)';
        ctx.beginPath(); ctx.ellipse(o.x + 6, o.y + 8, o.r, o.r * 0.9, 0, 0, TAU); ctx.fill();
        drawSprite(SPR.rocks[o.spr], o.x, o.y, o.r / 50, o.rot);
        if (o.snow) {
            // Snow lying on top of the high rocks
            ctx.fillStyle = 'rgba(248,250,252,0.85)';
            ctx.beginPath(); ctx.ellipse(o.x - o.r * 0.12, o.y - o.r * 0.15, o.r * 0.62, o.r * 0.48, o.rot, 0, TAU); ctx.fill();
        }
    }
    for (const o of boxes) { drawBox(o); if (o.maxHp && mineable(o)) drawPlantHealth(o, o.y - o.hh - 14); }
    if (G.world.terrain === 'haunted') drawHauntGlows(L, T, R, B, now);
    drawDecals(L, T, R, B, 'wall');
    if (G.world.city && !G.world.floor) drawLamps(cx, cy, half);
    const chaos = G.escape && !G.world.floor;
    if (chaos) { drawBombs(); drawTraffic(); }
    if (G.extract) drawExtraction(now);

    // Fighters
    const visible = [];
    for (const f of G.fighters) if (!f.car && !f.up && f.x > L - 80 && f.x < R + 80 && f.y > T - 80 && f.y < B + 80) visible.push(f);
    if (G.world.cars) { drawCars(); drawDriveRoute(); }
    for (const f of visible) {
        if (f.ghost && !f.dead) {
            // The ghost: see-through, and all but invisible unless it's just shot or been hit (you see yourself faintly)
            const a = f === G.player ? 0.45 : ghostSeen(f) ? 1 : 0.035;
            ctx.save(); ctx.globalAlpha = a; drawFighter(f); ctx.restore();
            continue;
        }
        drawFighter(f);
    }
    for (const f of visible) { drawShieldBubble(f); drawStun(f); drawFrozen(f); }

    if (G.world.floor && G.world.floor.heli) drawHelicopter(G.world.floor.heli.x, G.world.floor.heli.y, now);
    drawBullets(L, T, R, B);
    drawBeams();
    drawGrenades(false, now);
    drawGadgets(now);
    if (G.fires.length && !G.world.floor) drawFires(now);
    drawParticles();

    // Bushes and canopies sit on top so you can hide under them
    const p = G.player && !G.player.dead ? G.player : null;
    for (const o of bushes) {
        const under = p && Math.hypot(p.x - o.x, p.y - o.y) < o.r * 0.85 + 10;
        ctx.globalAlpha = under ? 0.5 : 1;
        const wob = plantWobble(o);
        drawSprite(SPR.bushes[o.spr], o.x, o.y, (o.r / 40) * (1 - wob * 0.1), o.rot + wob * 0.15);
    }
    for (const o of trees) {
        if (o.dead) { drawDeadTree(o); continue; }
        const under = p && Math.hypot(p.x - o.x, p.y - o.y) < o.canopy * 0.85;
        ctx.globalAlpha = under ? 0.38 : 0.97;
        const wob = plantWobble(o);
        // Canopies thin out as the tree takes damage
        const health = 0.85 + 0.15 * (o.hp / o.maxHp);
        drawSprite(SPR.canopies[o.spr], o.x, o.y, (o.canopy / 100) * health * (1 - wob * 0.06), o.rot + wob * 0.06);
    }
    ctx.globalAlpha = 1;
    for (const o of trees) drawPlantHealth(o, o.y - o.canopy * 0.55);
    if (G.world.terrain === 'haunted') drawHauntFog(L, T, R, B, now);
    for (const o of bushes) drawPlantHealth(o, o.y - o.r - 8);

    // Roofs fade out while the player is inside so you can see the room
    const inside = p ? buildingAt(p.x, p.y) : null;
    for (const b of houses) {
        b.roofAlpha = lerp(b.roofAlpha, b === inside ? 0 : 1, 0.15);
        drawRoof(b);
    }
    drawFallingRoofs();
    if (G.revolution) drawDecks(L, T, R, B);

    for (const f of visible) drawOverhead(f);

    // Keep yourself easy to spot when zoomed far out
    if (p && G.zoom < 0.6) {
        const pulse = 1 + Math.sin(now * 5) * 0.15;
        ctx.strokeStyle = '#fff7ec';
        ctx.lineWidth = 2.5 / G.zoom;
        ctx.beginPath(); ctx.arc(p.x, p.y, (12 * pulse) / G.zoom, 0, TAU); ctx.stroke();
        ctx.fillStyle = PLAYER_COLOR;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5 / G.zoom, 0, TAU); ctx.fill();
    }

    drawLobs();
    drawNukeClouds();
    drawNukeMarkers(now);
    drawSmoke(p, now);
    drawCures(now);
    drawGrenades(true, now);
    drawMissiles(now);
    drawAirdrops(now);
    if (chaos) drawJets();
    if (G.mode !== 'demo') drawZone(L, T, R, B, now);

    // Night falls over the world (but not over the damage numbers)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLighting(camX, camY, zoom);
    if (G.survival) drawCountdown();
    if (G.world.terrain === 'mountain') drawSnowfall(now);
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, Math.round(-camX * dpr * zoom), Math.round(-camY * dpr * zoom));
    drawFloats();

    // Screen-space overlays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(vignette, 0, 0, viewW, viewH);
    if (p && p.scopeAt && !p.dead) drawScope();
    if (p) {
        const low = p.hp < 30 ? (0.25 + Math.sin(now * 6) * 0.12) * (1 - p.hp / 30) + 0.1 : 0;
        const a = Math.min(1, G.hurt * 0.8 + low);
        if (a > 0.01) { ctx.globalAlpha = a; ctx.drawImage(hurtVignette, 0, 0, viewW, viewH); ctx.globalAlpha = 1; }
    }
    if (G.whiteout > 0.01) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, G.whiteout * 1.6)})`; ctx.fillRect(0, 0, viewW, viewH); }
    if (G.flash > 0.01) {
        ctx.fillStyle = `rgba(${G.flashColor},${G.flash * 0.6})`;
        ctx.fillRect(0, 0, viewW, viewH);
    }
    // Revolution: which floor of a castle you're on, always shown while you're in one
    if (G.revolution && G.mode === 'playing' && G.player && !G.player.dead && !G.player.car && G.revolution.bases.some(b => !b.fallen && inRect(G.player, b.rect))) {
        const n = floorOf(G.player), label = `${['▣', '▣', '▣▣'][n]}  ${FLOOR_NAME[n]}`;
        ctx.font = '900 20px "Black Ops One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(label).width + 36, x = viewW / 2, y = 96;
        ctx.fillStyle = 'rgba(14,10,28,0.75)'; roundRect(ctx, x - w / 2, y - 18, w, 36, 10); ctx.fill();
        ctx.fillStyle = ['#d9c7a3', '#ffd166', '#8fd8ff'][n]; ctx.fillText(label, x, y + 1);
    }
    // Revolution: an arrow at the edge of the screen pointing to the enemy base while it's out of sight
    if (G.revolution && G.mode === 'playing' && G.player && !G.player.dead && !G.world.floor) {
        const eb = G.revolution.bases[1 - G.player.team];
        if (eb && !eb.fallen) {
            const ex = (eb.c.x - G.cam.x) * G.zoom + viewW / 2, ey = (eb.c.y - G.cam.y) * G.zoom + viewH / 2;
            if (ex < -40 || ex > viewW + 40 || ey < -40 || ey > viewH + 40) {
                const a = Math.atan2(ey - viewH / 2, ex - viewW / 2), cx = viewW / 2, cy = viewH / 2;
                const tx = Math.cos(a), ty = Math.sin(a), sc = Math.min(Math.abs((viewW / 2 - 90) / (tx || 1e-6)), Math.abs((viewH / 2 - 90) / (ty || 1e-6)));
                // (kept clear of the HUD along the top and bottom)
                const ax = cx + tx * sc, ay = clamp(cy + ty * sc, 120, viewH - 200), pulse = 0.75 + Math.sin(now * 5) * 0.25;
                ctx.save(); ctx.translate(ax, ay);
                ctx.save(); ctx.rotate(a);
                ctx.fillStyle = `rgba(255,75,75,${pulse})`; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-10, -15); ctx.lineTo(-4, 0); ctx.lineTo(-10, 15); ctx.closePath(); ctx.fill();
                ctx.restore();
                ctx.font = '700 13px Rajdhani, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff7ec';
                ctx.fillText(`ENEMY BASE ${Math.round(dist(G.player, eb.c) / 10)}m`, -tx * 46, -ty * 30);
                ctx.restore();
            }
        }
    }
    // Downed: how long you've got, and whether someone's on the way
    if (G.war && G.mode === 'playing' && G.player && G.player.downed && !G.player.dead) {
        const left = Math.max(0, Math.ceil((REVIVE.bleed - (G.time - G.player.downAt)) / 1000));
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(40,0,10,0.4)'; ctx.fillRect(0, viewH * 0.36, viewW, viewH * 0.18);
        ctx.font = '900 46px "Black Ops One", sans-serif'; ctx.fillStyle = '#ff6b6b'; ctx.fillText(`YOU'RE DOWN · ${left}`, viewW / 2, viewH * 0.43);
        ctx.font = '600 20px Rajdhani, sans-serif'; ctx.fillStyle = '#fff7ec';
        ctx.fillText(G.player.reviveT > 0 ? `${G.player.helper ? G.player.helper.name : 'A teammate'} is reviving you...` : 'Crawl toward a teammate: they can get you back up', viewW / 2, viewH * 0.5);
        ctx.restore();
    }
    // Revolution: you're dead for good; spectating your side
    if (G.revolution && G.mode === 'playing' && G.player && G.player.dead && !G.result && G.spectating) {
        const q = G.revolution.queue.find(q => q.f === G.player);
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(10,6,20,0.45)'; ctx.fillRect(0, viewH * 0.36, viewW, viewH * 0.2);
        ctx.font = '900 54px "Black Ops One", sans-serif'; ctx.fillStyle = q ? '#ffd166' : '#ff6b6b';
        ctx.fillText(q ? `RESPAWNING IN ${Math.max(1, Math.ceil((q.at - G.time) / 1000))}` : 'YOU ARE DEAD', viewW / 2, viewH * 0.44);
        ctx.font = '600 20px Rajdhani, sans-serif'; ctx.fillStyle = '#fff7ec';
        ctx.fillText(q ? 'You will come back in your barracks' : 'No respawns: spectating your side', viewW / 2, viewH * 0.51);
        ctx.restore();
    }
    for (const c of G.confetti) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.scale(1, Math.abs(Math.cos(c.sway * 2)) * 0.8 + 0.2);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
    }
    if (G.mode === 'playing' && p) drawCrosshair(p);
}

// Virus map: sidewalks, parks and asphalt streets with lane markings and crosswalks
function drawCity(L, T, R, B) {
    const W = CONFIG.WORLD_SIZE, S = CITY.street, P = CITY.block, { streets, parks } = G.world.city;
    const x0 = Math.max(0, L), y0 = Math.max(0, T), x1 = Math.min(W, R), y1 = Math.min(W, B);
    const rusty = G.world.rusty;
    ctx.fillStyle = rusty ? '#7d7262' : '#a19c93';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // Sidewalk paving lines
    if (!lowDetail) {
        ctx.strokeStyle = 'rgba(70,64,56,0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
        for (let y = Math.floor(y0 / 60) * 60; y < y1; y += 60) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
        ctx.stroke();
    }
    for (const pk of parks) {
        if (pk.x1 < L || pk.x0 > R || pk.y1 < T || pk.y0 > B) continue;
        ctx.fillStyle = rusty ? '#4a4038' : '#6f6a62';
        ctx.fillRect(pk.x0 - 6, pk.y0 - 6, pk.x1 - pk.x0 + 12, pk.y1 - pk.y0 + 12);
        ctx.fillStyle = rusty ? '#5d4f3e' : SPR.grass;
        ctx.fillRect(pk.x0, pk.y0, pk.x1 - pk.x0, pk.y1 - pk.y0);
    }
    // Curbs, asphalt, then markings
    for (const at of streets) {
        if (at + S / 2 + 8 > L && at - S / 2 - 8 < R) { ctx.fillStyle = rusty ? '#5e564b' : '#77726a'; ctx.fillRect(at - S / 2 - 8, y0, S + 16, y1 - y0); }
        if (at + S / 2 + 8 > T && at - S / 2 - 8 < B) { ctx.fillStyle = rusty ? '#5e564b' : '#77726a'; ctx.fillRect(x0, at - S / 2 - 8, x1 - x0, S + 16); }
    }
    ctx.fillStyle = rusty ? '#3e3a35' : '#3f3f46';
    for (const at of streets) {
        if (at + S / 2 > L && at - S / 2 < R) ctx.fillRect(at - S / 2, y0, S, y1 - y0);
        if (at + S / 2 > T && at - S / 2 < B) ctx.fillRect(x0, at - S / 2, x1 - x0, S);
    }
    if (lowDetail) return;
    ctx.fillStyle = rusty ? 'rgba(200,170,90,0.25)' : 'rgba(240,200,80,0.75)';
    for (const at of streets) {
        for (let k = Math.floor(y0 / P) * P; k < y1; k += P) {
            // Dashed center line between intersections
            for (let d = k + S / 2 + 40; d < k + P - S / 2 - 40; d += 70) {
                if (at > L - 10 && at < R + 10) ctx.fillRect(at - 3, d, 6, 36);
            }
        }
        for (let k = Math.floor(x0 / P) * P; k < x1; k += P) {
            for (let d = k + S / 2 + 40; d < k + P - S / 2 - 40; d += 70) {
                if (at > T - 10 && at < B + 10) ctx.fillRect(d, at - 3, 36, 6);
            }
        }
    }
    // Zebra crossings at every intersection
    ctx.fillStyle = rusty ? 'rgba(220,215,200,0.18)' : 'rgba(240,240,235,0.7)';
    for (const ax of streets) {
        if (ax + S < L || ax - S > R) continue;
        for (const ay of streets) {
            if (ay + S < T || ay - S > B) continue;
            for (let i = -S / 2 + 12; i < S / 2 - 12; i += 22) {
                ctx.fillRect(ax + i, ay - S / 2 - 30, 12, 26);
                ctx.fillRect(ax + i, ay + S / 2 + 4, 12, 26);
                ctx.fillRect(ax - S / 2 - 30, ay + i, 26, 12);
                ctx.fillRect(ax + S / 2 + 4, ay + i, 26, 12);
            }
        }
    }
}

// Inside an upper floor: the city is a long way down, so everything outside the walls is dark.
// The floor itself is a pre-painted canvas (see bakeFloor).
function drawFloorBase(L, T, R, B) {
    const F = G.world.floor, W = CONFIG.WORLD_SIZE;
    ctx.fillStyle = '#0d0b14';
    ctx.fillRect(Math.max(0, L), Math.max(0, T), Math.min(W, R) - Math.max(0, L), Math.min(W, B) - Math.max(0, T));
    // Distant street lights far below
    ctx.fillStyle = 'rgba(255,214,140,0.08)';
    for (let x = Math.floor(L / 200) * 200; x < R; x += 200) for (let y = Math.floor(T / 200) * 200; y < B; y += 200) ctx.fillRect(x + ((y * 7) % 90), y + ((x * 3) % 70), 4, 4);
    // Smashed furniture: repaint, but not more than a few times a second
    if (F.dirty && G.time - (F.bakedAt || 0) > 250) { F.dirty = false; F.baked = null; }
    if (!F.baked) { F.baked = bakeFloor(F, G.world.obstacles); F.bakedAt = G.time; }
    ctx.drawImage(F.baked, F.R.x0 - FLOOR.margin, F.R.y0 - FLOOR.margin);
}

// Staircases: a striped pad with an arrow and the floor it leads to
function drawStairs(now) {
    const p = G.player;
    for (const st of G.world.stairs) {
        if (!inView(st.x, st.y, 60)) continue;
        const up = st.dir === 'up', S = 30;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(st.x - S + 4, st.y - S + 5, S * 2, S * 2);
        ctx.fillStyle = '#4b4654';
        ctx.fillRect(st.x - S, st.y - S, S * 2, S * 2);
        ctx.fillStyle = '#7a7486';
        for (let i = 0; i < 5; i++) ctx.fillRect(st.x - S + 4, st.y - S + 4 + i * 11.5, S * 2 - 8, 6);
        const col = up ? '#7dffb0' : '#8fd8ff';
        ctx.strokeStyle = col;
        ctx.lineWidth = 3 + Math.sin(now * 4) * 1;
        ctx.strokeRect(st.x - S, st.y - S, S * 2, S * 2);
        ctx.fillStyle = col;
        ctx.beginPath();
        if (up) { ctx.moveTo(st.x, st.y - 16); ctx.lineTo(st.x + 13, st.y + 2); ctx.lineTo(st.x - 13, st.y + 2); }
        else { ctx.moveTo(st.x, st.y + 16); ctx.lineTo(st.x + 13, st.y - 2); ctx.lineTo(st.x - 13, st.y - 2); }
        ctx.fill();
        ctx.font = '700 15px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#160e28';
        const label = st.to === 1 ? 'STREET' : `${st.to}F`;
        ctx.strokeText(label, st.x, st.y + 14);
        ctx.fillText(label, st.x, st.y + 14);
        // Progress ring while you stand on it
        if (p && p.stairT > 0 && Math.abs(st.x - p.x) < 34 && Math.abs(st.y - p.y) < 34) {
            ctx.strokeStyle = '#fff7ec';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 14, -Math.PI / 2, -Math.PI / 2 + TAU * (p.stairT / 0.7)); ctx.stroke();
        }
    }
}

// The escape helicopter on the HQ roof, rotor spinning
function drawHelicopter(x, y, now, g = ctx, s = 1) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.ellipse(10, 14, 60, 30, 0, 0, TAU); g.fill();
    // Tail boom and tail rotor
    g.fillStyle = '#3a4a3c';
    g.fillRect(30, -6, 80, 12);
    g.fillRect(104, -18, 10, 36);
    // Skids
    g.fillStyle = '#222';
    g.fillRect(-42, -34, 70, 5);
    g.fillRect(-42, 29, 70, 5);
    // Body
    g.fillStyle = '#4e6450';
    g.beginPath(); g.ellipse(0, 0, 50, 30, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(160,220,255,0.75)';
    g.beginPath(); g.ellipse(-26, 0, 20, 22, 0, Math.PI * 0.5, Math.PI * 1.5); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.15)';
    g.beginPath(); g.ellipse(-6, -12, 26, 8, 0, 0, TAU); g.fill();
    // Main rotor
    g.rotate(now * 22);
    g.fillStyle = 'rgba(30,30,30,0.55)';
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillRect(-5, 0, 10, 96); }
    g.fillStyle = 'rgba(200,200,200,0.1)';
    g.beginPath(); g.arc(0, 0, 96, 0, TAU); g.fill();
    g.fillStyle = '#222';
    g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
    g.restore();
}

function drawRoads() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [col, w] of [['rgba(110,85,50,0.45)', 104], ['#b0956a', 88], ['rgba(200,175,130,0.5)', 30]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        for (const pts of G.world.roads) {
            ctx.beginPath();
            pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
            ctx.stroke();
        }
    }
}

function drawBox(o) {
    if (o.baked || o.drivecar) return;  // painted into the floor / drawn as a car  // already painted into the floor's canvas
    if (o.rubble) { drawRubble(o); return; }
    if (o.hedgehog) { drawHedgehog(o); return; }
    if (o.gate) return;  // drawn with its base
    if (o.ruinWall) {
        // A stub of wall left standing: jagged broken ends, cracks and scorch
        const rnd = seededRand(o.seed || 1), x0 = o.x - o.hw, y0 = o.y - o.hh, horiz = o.hw > o.hh;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x0 + 5, y0 + 7, o.hw * 2, o.hh * 2);
        ctx.fillStyle = shade(o.color, -0.3);
        ctx.beginPath();
        if (horiz) { ctx.moveTo(x0, y0); ctx.lineTo(o.x + o.hw - 6, y0); for (let k = 0; k < 3; k++) ctx.lineTo(o.x + o.hw - rnd() * 8, y0 + (k + 1) * o.hh * 2 / 3); ctx.lineTo(x0 + rnd() * 8, o.y + o.hh); for (let k = 0; k < 2; k++) ctx.lineTo(x0 + rnd() * 6, y0 + o.hh * 2 * (1 - (k + 1) / 3)); }
        else { ctx.moveTo(x0, y0 + rnd() * 6); ctx.lineTo(x0 + o.hw * 2, y0 + rnd() * 8); ctx.lineTo(x0 + o.hw * 2, o.y + o.hh - rnd() * 8); ctx.lineTo(x0 + o.hw, o.y + o.hh - rnd() * 4); ctx.lineTo(x0, o.y + o.hh - rnd() * 8); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = o.color; ctx.fillRect(x0 + 2, y0 + 2, o.hw * 2 - 4, o.hh * 2 - 4);
        ctx.strokeStyle = 'rgba(20,16,12,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); for (let k = 0; k < 3; k++) { const cx = x0 + rnd() * o.hw * 2, cy = y0 + rnd() * o.hh * 2; ctx.moveTo(cx, cy); ctx.lineTo(cx + (rnd() - 0.5) * 14, cy + (rnd() - 0.5) * 14); } ctx.stroke();
        return;
    }
    const x = o.x - o.hw, y = o.y - o.hh, w = o.hw * 2, h = o.hh * 2;
    ctx.fillStyle = 'rgba(10,20,10,0.25)';
    ctx.fillRect(x + 5, y + 7, w, h);
    if (o.type === 'box') { if (o.on) return; o.chest ? drawChest(o) : drawLootBox(o); return; }
    if (o.car && o.wreck) {
        // Burnt-out shell, burning for good
        if (o.driven) { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.wa); ctx.drawImage(wreckSprite(o.driven, o.color), -wreckSprite(o.driven, o.color).width / 2, -wreckSprite(o.driven, o.color).height / 2); ctx.restore(); }
        else if (o.vtype) { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot); drawVehicleShape(o.vtype, o.color, o.seed, true); ctx.restore(); }
        else drawCar({ color: shade(o.color, -0.7), horiz: o.horiz }, x, y, w, h);
        if (G.time < o.burnUntil) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            if (o.driven) {
                // Small flames licking up from a few spots on the shell, so you can still see what it was
                const rnd = seededRand(Math.round(o.x * 7 + o.y));
                for (let i = 0; i < 3; i++) {
                    const fx = o.x + (rnd() - 0.5) * o.hw * 1.2, fy = o.y + (rnd() - 0.5) * o.hh * 1.2, r = 6 + rnd() * 5 + Math.random() * 4;
                    ctx.fillStyle = `rgba(255,120,30,${0.45 + Math.random() * 0.25})`; ctx.beginPath(); ctx.arc(fx, fy, r, 0, TAU); ctx.fill();
                    ctx.fillStyle = `rgba(255,220,120,${0.5 + Math.random() * 0.3})`; ctx.beginPath(); ctx.arc(fx, fy - 2, r * 0.45, 0, TAU); ctx.fill();
                }
            } else {
                ctx.fillStyle = `rgba(255,130,40,${0.35 + Math.random() * 0.25})`;
                ctx.beginPath(); ctx.arc(o.x, o.y, 18 + Math.random() * 8, 0, TAU); ctx.fill();
            }
            ctx.restore();
            if (Math.random() < 0.3) G.particles.push({ type: 'smoke', x: o.x + rand(-10, 10), y: o.y, vx: rand(-10, 10), vy: rand(-60, -30), life: 2, max: 2, size: rand(8, 14), color: '35,32,36' });
        }
        return;
    }
    if (o.car) { o.rust ? drawRustCar(o, x, y, w, h) : drawCar(o, x, y, w, h); return; }
    if (o.barrel) { drawBarrel(o); return; }
    if (o.container) { drawContainer(o, x, y, w, h); return; }
    if (o.grave || o.crypt || o.iron || o.pillar || o.haunt || o.hprop) { drawHaunted(o, x, y, w, h); return; }
    if (o.planks) { drawPlankWall(o, x, y, w, h); return; }
    if (o.sandbags) { drawSandbagWall(o, x, y, w, h); return; }
    if (o.furn) {
        if (o.house) { if (o.house.roofAlpha < 0.99) paintFurniture(ctx, o, seededRand(o.seed)); return; }
        drawFurniture(o, x, y, w, h);
        return;
    }
    if (o.type === 'crate') {
        ctx.fillStyle = '#5a3a1e';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = '#b8803f';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#d29a55';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
        ctx.strokeStyle = '#8a5a2b';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + w - 4, y + h - 4); ctx.moveTo(x + w - 4, y + 4); ctx.lineTo(x + 4, y + h - 4); ctx.stroke();
        return;
    }
    ctx.fillStyle = shade(o.color, -0.45);
    ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    ctx.fillStyle = o.color;
    ctx.fillRect(x, y, w, h);
    if (o.baseWall) {
        // Cracks spread as the wall takes damage, and a health bar shows while it's under fire
        const k = 1 - o.hp / o.maxHp;
        if (k > 0.15) { const rnd = seededRand(Math.round(o.x * 3 + o.y)); ctx.strokeStyle = 'rgba(20,16,12,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < k * 10; i++) { let cx = x + rnd() * w, cy = y + rnd() * h; ctx.moveTo(cx, cy); for (let j = 0; j < 3; j++) { cx += (rnd() - 0.5) * 18; cy += (rnd() - 0.5) * 18; ctx.lineTo(clamp(cx, x, x + w), clamp(cy, y, y + h)); } } ctx.stroke(); }
        if (G.time - o.hitAt < 2500) drawPlantHealth(o, o.y - o.hh - 12);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, y, w, Math.min(h, 4));
    if (o.windows) {
        // Glass panes along the outside walls of upper floors
        ctx.fillStyle = 'rgba(140,200,255,0.55)';
        if (w > h) for (let xx = x + 30; xx < x + w - 60; xx += 70) ctx.fillRect(xx, y + 4, 40, h - 8);
        else for (let yy = y + 30; yy < y + h - 60; yy += 70) ctx.fillRect(x + 4, yy, w - 8, 40);
    }
}

// Beds and desks on upper floors
function drawFurniture(o, x, y, w, h) {
    if (o.furn === 'bed') {
        ctx.fillStyle = '#3b2a20';
        roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 5); ctx.fill();
        ctx.fillStyle = o.hospital ? '#f2f5f8' : '#efe6d8';
        roundRect(ctx, x, y, w, h, 4); ctx.fill();
        ctx.fillStyle = o.hospital ? '#7fb6e0' : o.color;
        if (w < h) ctx.fillRect(x, y + h * 0.35, w, h * 0.65); else ctx.fillRect(x + w * 0.35, y, w * 0.65, h);
        ctx.fillStyle = '#fff';
        if (w < h) roundRect(ctx, x + 4, y + 4, w - 8, h * 0.2, 3); else roundRect(ctx, x + 4, y + 4, w * 0.2, h - 8, 3);
        ctx.fill();
    } else {
        ctx.fillStyle = '#4a3324';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = '#8a6142';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#2b3a4a';
        ctx.fillRect(x + w * 0.3, y + h * 0.25, w * 0.3, h * 0.4);
    }
}

// Parked car seen from above: body, windshield, rear window and roof
function drawCar(o, x, y, w, h) {
    ctx.fillStyle = shade(o.color, -0.5);
    roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 10); ctx.fill();
    ctx.fillStyle = o.color;
    roundRect(ctx, x, y, w, h, 9); ctx.fill();
    ctx.fillStyle = 'rgba(30,40,55,0.85)';
    if (o.horiz) {
        ctx.fillRect(x + w * 0.24, y + 4, w * 0.16, h - 8);
        ctx.fillRect(x + w * 0.66, y + 5, w * 0.12, h - 10);
        ctx.fillStyle = shade(o.color, 0.15);
        ctx.fillRect(x + w * 0.41, y + 5, w * 0.24, h - 10);
    } else {
        ctx.fillRect(x + 4, y + h * 0.24, w - 8, h * 0.16);
        ctx.fillRect(x + 5, y + h * 0.66, w - 10, h * 0.12);
        ctx.fillStyle = shade(o.color, 0.15);
        ctx.fillRect(x + 5, y + h * 0.41, w - 10, h * 0.24);
    }
}

function drawLootBox(o) {
    const hit = clamp(1 - (G.time - o.hitAt) / 220, 0, 1);
    const wob = hit * Math.sin(G.time * 0.09) * 0.12;
    const sq = 1 - hit * 0.08;
    const s = o.hw;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot + wob);
    ctx.scale(sq, sq);
    if (o.hyper) {
        drawHyperCrate(s);
    } else if (o.supply) {
        drawSupplyCrate(s);
    } else if (o.airdrop) {
        ctx.fillStyle = '#1e2530';
        ctx.fillRect(-s - 2, -s - 2, s * 2 + 4, s * 2 + 4);
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.fillStyle = '#5c6b80';
        ctx.fillRect(-s + 6, -s + 6, s * 2 - 12, s * 2 - 12);
        ctx.fillStyle = '#ff5a5f';
        ctx.fillRect(-s, -6, s * 2, 12);
        ctx.fillRect(-6, -s, 12, s * 2);
        ctx.fillStyle = '#fff7ec';
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff5a5f';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
    } else {
        ctx.fillStyle = '#7d5a37';
        ctx.fillRect(-s - 2, -s - 2, s * 2 + 4, s * 2 + 4);
        ctx.fillStyle = '#c89b6d';
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.fillStyle = '#b48659';
        ctx.fillRect(-s, -s, s * 2, s * 0.5);
        ctx.fillStyle = '#e6cfa3';
        ctx.fillRect(-4, -s, 8, s * 2);
        ctx.strokeStyle = 'rgba(90,60,30,0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke();
    }
    // Cracks show how close it is to breaking
    const dmg = 1 - o.hp / o.maxHp;
    if (dmg > 0.25) {
        ctx.strokeStyle = 'rgba(40,25,10,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.5); ctx.lineTo(-s * 0.2, -s * 0.1); ctx.lineTo(-s * 0.35, s * 0.3);
        if (dmg > 0.6) { ctx.moveTo(s * 0.6, -s * 0.6); ctx.lineTo(s * 0.15, s * 0.05); ctx.lineTo(s * 0.5, s * 0.6); }
        ctx.stroke();
    }
    ctx.restore();
}

// War-mode supply crate: a big reinforced military crate with hazard bands and a gold star
function drawSupplyCrate(s, g = ctx) {
    g.fillStyle = '#1c2014';
    roundRect(g, -s - 3, -s - 3, s * 2 + 6, s * 2 + 6, 6); g.fill();
    const body = g.createLinearGradient(0, -s, 0, s);
    body.addColorStop(0, '#6b7a45');
    body.addColorStop(1, '#46522c');
    g.fillStyle = body;
    roundRect(g, -s, -s, s * 2, s * 2, 4); g.fill();
    // Wooden slats
    g.strokeStyle = 'rgba(20,24,12,0.35)';
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 1; i < 4; i++) { const y = -s + (i * s * 2) / 4; g.moveTo(-s + 4, y); g.lineTo(s - 4, y); }
    g.stroke();
    // Hazard bands top and bottom
    for (const by of [-s + 4, s - 14]) {
        g.save();
        g.beginPath(); g.rect(-s + 4, by, s * 2 - 8, 10); g.clip();
        g.fillStyle = '#ffc23d';
        g.fillRect(-s, by, s * 2, 10);
        g.fillStyle = '#22221c';
        for (let x = -s - 10; x < s + 10; x += 14) {
            g.beginPath(); g.moveTo(x, by + 10); g.lineTo(x + 7, by); g.lineTo(x + 14, by); g.lineTo(x + 7, by + 10); g.fill();
        }
        g.restore();
    }
    // Steel corner brackets
    g.fillStyle = '#b9c0c8';
    for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        g.fillRect(cx * s - (cx > 0 ? 12 : 0), cy * s - (cy > 0 ? 4 : 0), 12, 4);
        g.fillRect(cx * s - (cx > 0 ? 4 : 0), cy * s - (cy > 0 ? 12 : 0), 4, 12);
    }
    // Gold star emblem in a dark circle
    g.fillStyle = 'rgba(20,24,12,0.55)';
    g.beginPath(); g.arc(0, 0, 17, 0, TAU); g.fill();
    g.fillStyle = '#ffd166';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 6 : 14;
        g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill();
    // Top highlight
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.fillRect(-s, -s, s * 2, 3);
}

function drawGrenades(airborne, now) {
    for (const g of G.grenades) {
        if ((g.z > 30) !== airborne || !inView(g.x, g.y, 200)) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        const ss = 1 - Math.min(0.5, g.z / 200);
        ctx.beginPath(); ctx.ellipse(g.x + 3, g.y + 4, 8 * ss, 6 * ss, 0, 0, TAU); ctx.fill();
        ctx.save();
        ctx.translate(g.x, g.y - g.z);
        ctx.rotate(g.spin);
        drawThrowable(ctx, g.type, 0, -2, 0.8 + g.z / 250);
        ctx.restore();
    }
}

function drawMines(now) {
    for (const m of G.mines) {
        if (!inView(m.x, m.y, 30)) continue;
        const armed = G.time >= m.armAt;
        // Mines are hard to spot: muted colors and a slow blink once armed
        const blink = m.triggerAt ? Math.sin(now * 60) > 0 : armed && Math.sin(now * 3 + m.x) > 0.85;
        ctx.globalAlpha = (G.player && !foe(m.owner, G.player)) || m.triggerAt ? 1 : 0.75;
        drawMineIcon(ctx, m.x, m.y, 1, blink ? '#ff3b3b' : '#5a2020');
        if (m.triggerAt) {
            ctx.fillStyle = 'rgba(255,59,59,0.35)';
            ctx.beginPath(); ctx.arc(m.x, m.y, 18, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

function drawStrikeMarkers(now) {
    for (const s of G.strikes) {
        if (!inView(s.x, s.y, STRIKE.radius + 50)) continue;
        // Just the little strobe on the ground: no warning circle, so targets don't see it coming
        const pulse = 0.5 + 0.5 * Math.sin(now * 10);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = s.electric ? `rgba(60,220,255,${0.15 + pulse * 0.3})` : `rgba(255,50,50,${0.15 + pulse * 0.3})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, 10 + pulse * 6, 0, TAU); ctx.fill();
        ctx.restore();
        if (s.electric) drawEmissileIcon(ctx, s.x, s.y, 0.9); else drawStrobeIcon(ctx, s.x, s.y, 1, pulse > 0.5);
    }
}

function drawMissiles(now) {
    for (const s of G.strikes) {
        const fall = 0.8;
        const p = (s.t - (s.delay - fall)) / fall;
        if (p < 0 || !inView(s.x, s.y, 900)) continue;
        const h = (1 - p) * 900;
        ctx.fillStyle = `rgba(0,0,0,${0.15 + p * 0.3})`;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, 30 * (0.4 + p), 20 * (0.4 + p), 0, 0, TAU); ctx.fill();
        if (Math.random() < 0.8) G.particles.push({ type: 'glow', x: s.x + rand(-6, 6), y: s.y - h - 50, vx: rand(-20, 20), vy: rand(-80, -20), life: 0.3, max: 0.3, size: rand(5, 9), color: s.electric ? EMISSILE.color : '#ff8a3d' });
        ctx.save();
        ctx.translate(s.x, s.y - h);
        const sc = 1.4;
        ctx.scale(sc, sc);
        ctx.fillStyle = s.electric ? '#1f4f9a' : '#3d4450';
        roundRect(ctx, -9, -50, 18, 54, 8); ctx.fill();
        ctx.fillStyle = s.electric ? EMISSILE.color : '#ff5a5f';
        ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(0, 16); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#262a31';
        ctx.beginPath(); ctx.moveTo(-9, -46); ctx.lineTo(-18, -56); ctx.lineTo(-9, -36); ctx.moveTo(9, -46); ctx.lineTo(18, -56); ctx.lineTo(9, -36); ctx.fill();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = s.electric ? 'rgba(120,235,255,0.9)' : 'rgba(255,190,90,0.9)';
        ctx.beginPath(); ctx.ellipse(0, -58, 7, 14 + Math.random() * 8, 0, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.restore();
    }
}

function drawCures(now) {
    for (const c of G.cures) {
        const age = (G.time - c.born) / 1000, fade = clamp((CURE.life - age) / 1, 0, 1), grow = Math.min(1, age / 0.4);
        const r = CURE.radius * grow;
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
        grad.addColorStop(0, `rgba(190,255,210,${0.55 * fade})`);
        grad.addColorStop(0.7, `rgba(94,224,138,${0.35 * fade})`);
        grad.addColorStop(1, 'rgba(94,224,138,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.fill();
        // Rings sweeping inward show the pull
        ctx.strokeStyle = `rgba(94,224,138,${0.5 * fade})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            const k = 1 - ((now * 0.8 + i / 3) % 1);
            ctx.beginPath(); ctx.arc(c.x, c.y, CURE.radius + k * (CURE.pull - CURE.radius), 0, TAU); ctx.stroke();
        }
        ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
        ctx.fillRect(c.x - 5, c.y - 18, 10, 36);
        ctx.fillRect(c.x - 18, c.y - 5, 36, 10);
    }
}

function drawSmoke(p, now) {
    for (const s of G.smokes) {
        const r = smokeRadius(s);
        if (r <= 0 || !inView(s.x, s.y, r + 80)) continue;
        const age = (G.time - s.born) / 1000;
        const fade = clamp((SMOKE.life - age) / 2, 0, 1);
        // You can see a little when you're inside it yourself
        const inside = p && Math.hypot(p.x - s.x, p.y - s.y) < r * 0.85;
        ctx.globalAlpha = fade * (inside ? 0.72 : 1);
        const k = r / SMOKE.radius;
        for (const pf of s.puffs) {
            const dx = pf.ox * k + Math.cos(pf.drift + age * 0.3) * 12;
            const dy = pf.oy * k + Math.sin(pf.drift + age * 0.25) * 12;
            const size = 150 * pf.s * (0.6 + 0.4 * k);
            ctx.drawImage(SPR.puff, s.x + dx - size / 2, s.y + dy - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
    }
}

function drawAirdrops(now) {
    for (const d of G.airdrops) {
        if (d.landed || !inView(d.x, d.y, 600)) continue;
        const p = d.t / d.dur;
        const height = (1 - p) * 520;
        const scale = 1 + (1 - p) * 0.9;
        const supply = d.kind === 'supply', hyper = d.kind === 'hyper', veh = d.kind === 'vehicle';
        const hw = supply ? 46 : hyper ? 40 : veh ? 70 : 34;
        const chute = supply ? ['#ffd166', '#5d6b3a'] : hyper ? [HYPER.neon, HYPER.teal] : veh ? [TECH_DROP.neon, TECH_DROP.glow] : ['#fff7ec', '#ff5a5f'];
        // Target marker and growing shadow
        ctx.strokeStyle = supply ? `rgba(255,209,102,${0.5 + Math.sin(now * 8) * 0.3})` : hyper ? `rgba(0,229,255,${0.5 + Math.sin(now * 8) * 0.3})` : `rgba(255,90,95,${0.5 + Math.sin(now * 8) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(d.x, d.y, hw + 6, 0, TAU); ctx.stroke();
        ctx.fillStyle = `rgba(0,0,0,${0.12 + p * 0.25})`;
        ctx.beginPath(); ctx.ellipse(d.x + 6, d.y + 8, 34 * (0.5 + p * 0.5), 30 * (0.5 + p * 0.5), 0, 0, TAU); ctx.fill();
        ctx.save();
        ctx.translate(d.x + Math.sin(now * 1.5) * 10 * (1 - p), d.y - height);
        ctx.scale(scale, scale);
        // Parachute
        ctx.strokeStyle = 'rgba(255,247,236,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const ox of [-60, -20, 20, 60]) { ctx.moveTo(ox, -70); ctx.lineTo(Math.sign(ox) * 20, -30); }
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = chute[i % 2];
            ctx.beginPath();
            ctx.moveTo(0, -70);
            ctx.arc(0, -70, 75, Math.PI + (i / 6) * Math.PI, Math.PI + ((i + 1) / 6) * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        if (supply) ctx.scale(1.25, 1.25);
        if (veh) { ctx.scale(0.8, 0.8); drawVehicleBody({ type: d.vtype, color: '#1b1f2a', a: 0, turret: 0 }); }
        else drawLootBox({ x: 0, y: 0, hw, hp: 1, maxHp: 1, hitAt: -9999, rot: 0, airdrop: true, supply, hyper });
        ctx.restore();
    }
}

function drawRoof(b) {
    if (b.roofAlpha < 0.02 || b.collapsed) return;
    // About to come down: the whole roof shudders
    const shaking = b.collapseAt;
    if (shaking) { ctx.save(); ctx.translate(rand(-6, 6), rand(-6, 6)); }
    const o = 8, x = b.x0 - o, y = b.y0 - o, w = b.w + o * 2, h = b.h + o * 2;
    ctx.globalAlpha = b.roofAlpha;
    // Taller buildings throw longer shadows
    const sh = b.flat ? 14 + Math.min(14, b.floors) * 5 : 10;
    ctx.fillStyle = 'rgba(10,5,20,0.33)';
    ctx.fillRect(x + sh, y + sh * 1.3, w, h);
    switch (b.style) {
        case 'hip': drawPitchedRoof(b, x, y, w, h, true); break;
        case 'garden': drawGardenRoof(b, x, y, w, h); break;
        case 'shop': drawShopRoof(b, x, y, w, h); break;
        case 'flat': drawPlainRoof(b, x, y, w, h); if (b.rusty) drawGrime(b, x, y, w, h); break;
        case 'pool': drawPoolRoof(b, x, y, w, h); break;
        case 'tiers': drawTieredRoof(b, x, y, w, h); break;
        case 'glass': drawGlassRoof(b, x, y, w, h); break;
        case 'cross': case 'helipad': drawHospitalRoof(b, x, y, w, h); break;
        case 'hq': drawHQRoof(b, x, y, w, h); break;
        case 'rustshed': drawRustShedRoof(b, x, y, w, h); break;
        case 'factory': drawFactoryRoof(b, x, y, w, h); break;
        case 'clinic': drawHospitalRoof(b, x, y, w, h); drawGrime(b, x, y, w, h); break;
        default: drawPitchedRoof(b, x, y, w, h, false);
    }
    if (b.hits) drawImpacts(b, x, y, w, h);
    if (b.flat && b.kind !== 'house') {
        const name = b.label || b.kind.toUpperCase(), label = b.hq ? `HQ · ${b.floors} FLOORS` : G.world.stairs.some(st => st.b === b) ? `${name} · ${b.floors}F` : name;
        ctx.font = '700 30px "Black Ops One", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(10,6,20,0.8)';
        const ly = b.hq ? b.y0 + 34 : b.y1 - 34;
        ctx.strokeText(label, b.cx, ly);
        ctx.fillStyle = b.hq ? '#ffd166' : b.kind === 'hospital' ? '#e8434b' : '#fff7ec';
        ctx.fillText(label, b.cx, ly);
    }
    ctx.globalAlpha = 1;
    if (shaking) ctx.restore();
}

// A flat concrete roof: parapet, membrane and seams
function flatBase(b, x, y, w, h, seam = 40) {
    ctx.fillStyle = b.roofDark;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, w, 3);
    ctx.fillRect(x, y, 3, h);
    if (!seam) return;
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let xx = x + seam; xx < x + w - 8; xx += seam) { ctx.moveTo(xx, y + 8); ctx.lineTo(xx, y + h - 8); }
    ctx.stroke();
}

function drawACUnits(b, x, y, w, h) {
    for (const a of b.ac) {
        const ax = x + w * a.x, ay = y + h * a.y;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(ax - a.s + 4, ay - a.s + 5, a.s * 2, a.s * 2);
        ctx.fillStyle = '#c9ccd2';
        ctx.fillRect(ax - a.s, ay - a.s, a.s * 2, a.s * 2);
        ctx.fillStyle = '#8f949c';
        ctx.beginPath(); ctx.arc(ax, ay, a.s * 0.65, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#6d727a';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax - a.s * 0.6, ay); ctx.lineTo(ax + a.s * 0.6, ay); ctx.moveTo(ax, ay - a.s * 0.6); ctx.lineTo(ax, ay + a.s * 0.6); ctx.stroke();
    }
}

// One sloped face of a roof: filled, with rows of tiles running along its eave
function roofFace(pts, col, horizRows) {
    ctx.save();
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    ctx.clip();
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (horizRows) for (let yy = y0 + 14; yy < y1; yy += 14) { ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); }
    else for (let xx = x0 + 14; xx < x1; xx += 14) { ctx.moveTo(xx, y0); ctx.lineTo(xx, y1); }
    ctx.stroke();
    // Staggered tile joints
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.beginPath();
    if (horizRows) for (let yy = y0, r = 0; yy < y1; yy += 14, r++) for (let xx = x0 + (r % 2) * 11; xx < x1; xx += 22) { ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 14); }
    else for (let xx = x0, r = 0; xx < x1; xx += 14, r++) for (let yy = y0 + (r % 2) * 11; yy < y1; yy += 22) { ctx.moveTo(xx, yy); ctx.lineTo(xx + 14, yy); }
    ctx.stroke();
    ctx.restore();
}

// Tiled house roofs: a gable (two slopes) or a hip (four slopes meeting at a short ridge)
function drawPitchedRoof(b, x, y, w, h, hip) {
    const wide = w >= h, lit = b.roof, dark = shade(b.roofDark, -0.08);
    const sideLit = shade(b.roof, -0.12), sideDark = shade(b.roofDark, 0.06);
    const cx = x + w / 2, cy = y + h / 2, r = hip ? (wide ? h : w) / 2 : 0;
    ctx.fillStyle = shade(b.roofDark, -0.3);
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    let ridge;
    if (wide) {
        ridge = [[x + r, cy], [x + w - r, cy]];
        roofFace([[x, y], [x + w, y], ridge[1], ridge[0]], lit, true);
        roofFace([[x, y + h], [x + w, y + h], ridge[1], ridge[0]], dark, true);
        if (hip) { roofFace([[x, y], ridge[0], [x, y + h]], sideLit, false); roofFace([[x + w, y], ridge[1], [x + w, y + h]], sideDark, false); }
    } else {
        ridge = [[cx, y + r], [cx, y + h - r]];
        roofFace([[x, y], [x, y + h], ridge[1], ridge[0]], lit, false);
        roofFace([[x + w, y], [x + w, y + h], ridge[1], ridge[0]], dark, false);
        if (hip) { roofFace([[x, y], ridge[0], [x + w, y]], sideLit, true); roofFace([[x, y + h], ridge[1], [x + w, y + h]], sideDark, true); }
    }
    // Ridge and hip caps
    ctx.strokeStyle = shade(b.roof, 0.25);
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(...ridge[0]); ctx.lineTo(...ridge[1]);
    if (hip) {
        ctx.moveTo(x, y); ctx.lineTo(...ridge[0]); ctx.lineTo(...(wide ? [x, y + h] : [x + w, y]));
        ctx.moveTo(x + w, y + h); ctx.lineTo(...ridge[1]); ctx.lineTo(...(wide ? [x + w, y] : [x, y + h]));
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
    // Solar panels on the sunny slope
    if (b.solar) {
        const n = Math.max(2, Math.floor((wide ? w - r * 2 : h - r * 2) / 70));
        for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n;
            const px = wide ? lerp(x + r + 20, x + w - r - 20, t) - 26 : x + w * 0.12;
            const py = wide ? y + h * 0.12 : lerp(y + r + 20, y + h - r - 20, t) - 26;
            const pw = wide ? 52 : w * 0.28, ph = wide ? h * 0.28 : 52;
            ctx.fillStyle = '#c7ccd4'; ctx.fillRect(px - 2, py - 2, pw + 4, ph + 4);
            ctx.fillStyle = '#23365a'; ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = 'rgba(140,180,255,0.35)'; ctx.lineWidth = 1;
            ctx.beginPath();
            for (let k = 1; k < 4; k++) { ctx.moveTo(px + pw * k / 4, py); ctx.lineTo(px + pw * k / 4, py + ph); }
            ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2);
            ctx.stroke();
        }
    }
    // Brick chimney
    if (b.chimney) {
        const chx = x + w * b.chimney.x, chy = y + h * b.chimney.y;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(chx - 12, chy - 8, 30, 28);
        ctx.fillStyle = '#8a4a36'; ctx.fillRect(chx - 15, chy - 15, 30, 30);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = -8; k < 15; k += 7) { ctx.moveTo(chx - 15, chy + k); ctx.lineTo(chx + 15, chy + k); }
        ctx.stroke();
        ctx.fillStyle = '#b0a79a'; ctx.fillRect(chx - 17, chy - 17, 34, 6);
        ctx.fillStyle = '#1d1a1c'; ctx.fillRect(chx - 8, chy - 8, 16, 16);
    }
}

// Rooftop garden: decking, planters full of shrubs and a table under an umbrella
function drawGardenRoof(b, x, y, w, h) {
    flatBase(b, x, y, w, h, 0);
    const d = b.deck, dx = x + w * d.x, dy = y + h * d.y, dw = w * d.w, dh = h * d.h;
    ctx.fillStyle = '#9a6d44'; ctx.fillRect(dx, dy, dw, dh);
    ctx.strokeStyle = 'rgba(60,35,15,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let yy = dy + 12; yy < dy + dh; yy += 12) { ctx.moveTo(dx, yy); ctx.lineTo(dx + dw, yy); }
    ctx.stroke();
    const tx = dx + dw / 2, ty = dy + dh / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(tx + 6, ty + 8, 34, 0, TAU); ctx.fill();
    for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? '#f4ede1' : '#e0574f';
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.arc(tx, ty, 34, (i / 8) * TAU, ((i + 1) / 8) * TAU); ctx.fill();
    }
    ctx.fillStyle = '#5a3b22'; ctx.beginPath(); ctx.arc(tx, ty, 4, 0, TAU); ctx.fill();
    for (const p of b.planters) {
        const pw = w * p.w, ph = Math.max(26, h * p.h), px = x + w * p.x - pw / 2, py = y + h * p.y - ph / 2;
        const [bw, bh] = p.flip ? [ph, pw] : [pw, ph];
        ctx.fillStyle = '#6b4a2e'; ctx.fillRect(px, py, bw, bh);
        ctx.fillStyle = '#3e2c1c'; ctx.fillRect(px + 4, py + 4, bw - 8, bh - 8);
        for (let i = 0, n = Math.max(2, Math.round(Math.max(bw, bh) / 24)); i < n; i++) {
            const t = (i + 0.5) / n, sx = bw > bh ? px + bw * t : px + bw / 2, sy = bw > bh ? py + bh / 2 : py + bh * t;
            ctx.fillStyle = i % 3 === 1 ? '#5f9a46' : '#4a8238';
            ctx.beginPath(); ctx.arc(sx, sy, Math.min(bw, bh) * 0.48, 0, TAU); ctx.fill();
            if (i % 3 === 2) { ctx.fillStyle = '#e8b04a'; ctx.beginPath(); ctx.arc(sx + 3, sy - 3, 3, 0, TAU); ctx.fill(); }
        }
    }
}

// Corner shop: flat roof with AC units and a striped awning over the sidewalk
function drawShopRoof(b, x, y, w, h) {
    flatBase(b, x, y, w, h);
    drawACUnits(b, x, y, w, h);
    const { side, cols } = b.awning, d = 34, horiz = side % 2 === 0;
    const ax = side === 3 ? x - d + 8 : side === 1 ? x + w - 8 : x, ay = side === 0 ? y - d + 8 : side === 2 ? y + h - 8 : y;
    const aw = horiz ? w : d, ah = horiz ? d : h;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(ax + 6, ay + 8, aw, ah);
    const n = Math.round((horiz ? aw : ah) / 22);
    for (let i = 0; i < n; i++) {
        ctx.fillStyle = cols[i % 2];
        if (horiz) ctx.fillRect(ax + (aw / n) * i, ay, aw / n + 0.5, ah);
        else ctx.fillRect(ax, ay + (ah / n) * i, aw, ah / n + 0.5);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    if (horiz) ctx.fillRect(ax, side === 0 ? ay : ay + ah - 6, aw, 6); else ctx.fillRect(side === 3 ? ax : ax + aw - 6, ay, 6, ah);
}

// Plain flat roof: AC units, skylights and a water tank
function drawPlainRoof(b, x, y, w, h) {
    flatBase(b, x, y, w, h);
    drawACUnits(b, x, y, w, h);
    for (let i = 0; i < b.skylights; i++) {
        const sx = x + w * (0.25 + i * 0.22), sy = y + h * 0.7;
        ctx.fillStyle = '#5b6066'; ctx.fillRect(sx - 22, sy - 16, 44, 32);
        ctx.fillStyle = 'rgba(150,200,240,0.75)'; ctx.fillRect(sx - 18, sy - 12, 36, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(sx - 14, sy - 10, 8, 20);
    }
    const tx = x + w * b.tank.x, ty = y + h * b.tank.y * 0.6;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(tx + 6, ty + 8, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7d6a55'; ctx.beginPath(); ctx.arc(tx, ty, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#95806a'; ctx.beginPath(); ctx.arc(tx, ty, 18, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx, ty, 22, 0, TAU); ctx.stroke();
}

// Hotel with a rooftop pool, loungers and umbrellas
function drawPoolRoof(b, x, y, w, h) {
    flatBase(b, x, y, w, h, 0);
    // Pale tile deck
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let xx = x + 8; xx < x + w - 8; xx += 30) { ctx.moveTo(xx, y + 8); ctx.lineTo(xx, y + h - 8); }
    for (let yy = y + 8; yy < y + h - 8; yy += 30) { ctx.moveTo(x + 8, yy); ctx.lineTo(x + w - 8, yy); }
    ctx.stroke();
    const px = x + w * (b.poolSide ? 0.12 : 0.42), py = y + h * 0.3, pw = w * 0.46, ph = h * 0.4;
    ctx.fillStyle = '#e9e4da'; ctx.fillRect(px - 8, py - 8, pw + 16, ph + 16);
    const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
    grad.addColorStop(0, '#4fc3e8'); grad.addColorStop(1, '#1e7fb8');
    ctx.fillStyle = grad; ctx.fillRect(px, py, pw, ph);
    // Light ripples drifting across the water
    const t = G.time / 1000;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const yy = py + ph * ((i + 0.5) / 6);
        for (let xx = px + 10; xx < px + pw - 20; xx += 40) { const o = Math.sin(t * 1.5 + i + xx * 0.05) * 4; ctx.moveTo(xx, yy + o); ctx.quadraticCurveTo(xx + 10, yy + o - 4, xx + 20, yy + o); }
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.strokeRect(px, py, pw, ph);
    // Loungers in a row with umbrellas between them
    const lx = b.poolSide ? x + w * 0.66 : x + w * 0.08, n = Math.max(3, Math.floor(ph / 60));
    for (let i = 0; i < n; i++) {
        const ly = py + (ph / n) * i + 10;
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(lx + 4, ly + 4, w * 0.2, 24);
        ctx.fillStyle = '#f7f4ee'; ctx.fillRect(lx, ly, w * 0.2, 24);
        ctx.fillStyle = '#3aa0c8'; ctx.fillRect(lx, ly, w * 0.06, 24);
        if (i % 2) {
            const ux = lx + w * 0.24, uy = ly + 12;
            for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#f4ede1' : '#f08a24'; ctx.beginPath(); ctx.moveTo(ux, uy); ctx.arc(ux, uy, 26, (k / 6) * TAU, ((k + 1) / 6) * TAU); ctx.fill(); }
        }
    }
    drawACUnits(b, x, y + h * 0.55, w, h * 0.45);
}

// Stepped tower: setbacks with glass bands, crowned by an antenna with a blinking light
function drawTieredRoof(b, x, y, w, h) {
    flatBase(b, x, y, w, h, 0);
    for (let i = 1; i <= 3; i++) {
        const k = i * 0.13, tx = x + w * k, ty = y + h * k, tw = w * (1 - k * 2), th = h * (1 - k * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(tx + 8, ty + 10, tw, th);
        ctx.fillStyle = 'rgba(160,210,240,0.55)'; ctx.fillRect(tx - 5, ty - 5, tw + 10, th + 10);
        ctx.fillStyle = shade(b.roof, i * 0.08); ctx.fillRect(tx, ty, tw, th);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.strokeRect(tx + 4, ty + 4, tw - 8, th - 8);
    }
    ctx.fillStyle = '#2a2d33'; ctx.fillRect(b.cx - 6, b.cy - 6, 12, 12);
    ctx.strokeStyle = '#2a2d33'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.cx, b.cy); ctx.lineTo(b.cx + 40, b.cy - 30); ctx.moveTo(b.cx, b.cy); ctx.lineTo(b.cx - 40, b.cy - 30); ctx.stroke();
    if (Math.sin(G.time / 300) > 0) { ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.arc(b.cx, b.cy, 6, 0, TAU); ctx.fill(); }
}

// Glass-topped tower: a grid of tinted panes with a sheen, and a window-cleaning rail round the edge
function drawGlassRoof(b, x, y, w, h) {
    ctx.fillStyle = b.roofDark; ctx.fillRect(x, y, w, h);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#6d93b5'); g.addColorStop(0.5, b.roof); g.addColorStop(1, '#3a5671');
    ctx.fillStyle = g; ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
    ctx.strokeStyle = 'rgba(20,30,45,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let xx = x + 10 + 50; xx < x + w - 10; xx += 50) { ctx.moveTo(xx, y + 10); ctx.lineTo(xx, y + h - 10); }
    for (let yy = y + 10 + 50; yy < y + h - 10; yy += 50) { ctx.moveTo(x + 10, yy); ctx.lineTo(x + w - 10, yy); }
    ctx.stroke();
    // Diagonal sheen
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 10, y + 10, w - 20, h - 20); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    ctx.beginPath(); ctx.moveTo(x + w * 0.2, y); ctx.lineTo(x + w * 0.45, y); ctx.lineTo(x + w * 0.1, y + h); ctx.lineTo(x - w * 0.15, y + h); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.moveTo(x + w * 0.55, y); ctx.lineTo(x + w * 0.62, y); ctx.lineTo(x + w * 0.27, y + h); ctx.lineTo(x + w * 0.2, y + h); ctx.fill();
    ctx.restore();
    // Plant room in the middle and the cleaning rail
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(b.cx - 50, b.cy - 34, 112, 80);
    ctx.fillStyle = '#7a7f87'; ctx.fillRect(b.cx - 56, b.cy - 40, 112, 80);
    ctx.fillStyle = '#5c6068'; ctx.fillRect(b.cx - 44, b.cy - 28, 40, 56);
    ctx.fillStyle = '#9ea3ab'; for (let i = 0; i < 4; i++) ctx.fillRect(b.cx + 6, b.cy - 28 + i * 15, 40, 8);
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 3; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
}

// Hospital: white roof with a big red cross, or a proper helipad
function drawHospitalRoof(b, x, y, w, h) {
    flatBase(b, x, y, w, h);
    ctx.fillStyle = '#4caf7a';
    ctx.fillRect(x + 8, y + 8, w - 16, 6); ctx.fillRect(x + 8, y + h - 14, w - 16, 6);
    drawACUnits(b, x, y, w, h);
    if (b.style === 'helipad') {
        const r = Math.min(w, h) * 0.3;
        ctx.fillStyle = '#4a4f57'; ctx.beginPath(); ctx.arc(b.cx, b.cy, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(b.cx, b.cy, r - 10, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#fff7ec';
        const s = r * 0.42;
        ctx.fillRect(b.cx - s, b.cy - s, s * 0.35, s * 2); ctx.fillRect(b.cx + s * 0.65, b.cy - s, s * 0.35, s * 2); ctx.fillRect(b.cx - s, b.cy - s * 0.17, s * 2, s * 0.34);
        const c = Math.min(w, h) * 0.06, qx = x + w - c * 4, qy = y + c * 4;
        ctx.fillStyle = '#e8434b'; ctx.fillRect(qx - c, qy - c * 3, c * 2, c * 6); ctx.fillRect(qx - c * 3, qy - c, c * 6, c * 2);
    } else {
        const c = Math.min(w, h) * 0.12;
        ctx.fillStyle = '#fff7ec'; ctx.fillRect(b.cx - c * 3.6, b.cy - c * 3.6, c * 7.2, c * 7.2);
        ctx.fillStyle = '#e8434b';
        ctx.fillRect(b.cx - c, b.cy - c * 3, c * 2, c * 6);
        ctx.fillRect(b.cx - c * 3, b.cy - c, c * 6, c * 2);
    }
}

// The HQ: dark military roof with the escape helicopter on its pad
function drawHQRoof(b, x, y, w, h) {
    flatBase(b, x, y, w, h);
    drawACUnits(b, x, y, w, h);
    const hx = w >= h ? x + w - 130 : b.cx, hy = w >= h ? b.cy : y + h - 130;
    ctx.fillStyle = '#2f3a33';
    ctx.beginPath(); ctx.arc(hx, hy, 120, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(hx, hy, 106, 0, TAU); ctx.stroke();
    drawHelicopter(hx, hy, G.time / 1000);
}

function plantWobble(o) {
    const t = clamp(1 - (G.time - o.hitAt) / 300, 0, 1);
    return t * Math.sin(G.time * 0.06);
}

function drawPlantHealth(o, y) {
    if (G.time - o.hitAt > 2000 || o.hp >= o.maxHp) return;
    const w = 50, x = o.x - w / 2;
    ctx.fillStyle = 'rgba(18,10,38,0.75)';
    roundRect(ctx, x - 2, y - 2, w + 4, 8, 3); ctx.fill();
    ctx.fillStyle = '#9fe07a';
    ctx.fillRect(x, y, w * Math.max(0, o.hp / o.maxHp), 4);
}

function drawSprite(img, x, y, scale, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
}

function drawLoot(cx, cy, half, now) {
    const p = G.player && !G.player.dead ? G.player : null;
    const near = p ? nearestLoot(p.x, p.y, CONFIG.PICKUP_RANGE) : null;
    G.lootGrid.query(cx, cy, half, l => {
        if (l.gone || !inView(l.x, l.y, 40)) return;
        const col = RARITY[lootRarity(l.key)].color;
        const age = (G.time - l.born) / 1000;
        const bob = Math.sin(now * 3 + l.t) * 2.5 - (l.moving ? Math.max(0, 1 - age * 2) * 14 : 0);
        const pop = Math.min(1, 0.5 + age * 2.5);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(l.x + 3, l.y + 18, 18, 6, 0, 0, TAU); ctx.fill();
        // Pulsing glow ring
        ctx.globalAlpha = 0.35 + Math.sin(now * 4 + l.t) * 0.15;
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(l.x, l.y + bob, 28, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
        if (lootRarity(l.key) === 'hyper') {
            ctx.fillStyle = `rgba(0,229,255,${0.22 + Math.sin(now * 6 + l.t) * 0.1})`;
            ctx.beginPath(); ctx.arc(l.x, l.y + bob, 38, 0, TAU); ctx.fill();
        }
        if (lootRarity(l.key) === 'mythic') {
            ctx.fillStyle = `rgba(255,90,95,${0.18 + Math.sin(now * 5 + l.t) * 0.08})`;
            ctx.beginPath(); ctx.arc(l.x, l.y + bob, 34, 0, TAU); ctx.fill();
        }
        const sz = 64 * pop;
        ctx.drawImage(SPR.loot[l.key], l.x - sz / 2, l.y - sz / 2 + bob, sz, sz);
        if (l.count > 1) {
            ctx.fillStyle = '#fff7ec';
            ctx.beginPath(); ctx.arc(l.x + 17, l.y + 15 + bob, 9, 0, TAU); ctx.fill();
            ctx.fillStyle = '#1a0f2e';
            ctx.font = '700 12px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(l.count, l.x + 17, l.y + 16 + bob);
        }
        if (l === near) {
            ctx.strokeStyle = '#fff7ec';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(l.x, l.y + bob, 32, 0, TAU); ctx.stroke();
        }
    });
}

// A soft, gently pulsing halo round you so you can always pick yourself out of a crowd
function playerGlow(x, y, r) {
    const pulse = 0.85 + Math.sin((G ? G.time : 0) / 260) * 0.15, R = r * 3;
    const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, R);
    g.addColorStop(0, `rgba(255,247,200,${0.75 * pulse})`);
    g.addColorStop(0.45, `rgba(255,230,140,${0.4 * pulse})`);
    g.addColorStop(1, 'rgba(255,230,140,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
}

function drawFighter(f) {
    if (f.downed) { drawDowned(f); return; }
    // (the boss is drawn as a normal fighter blown up to giant size, gun and all)
    const gk = f.giant ? f.r / CONFIG.RADIUS : 1, r = f.giant ? CONFIG.RADIUS : f.r;
    const w = WEAPONS[held(f)];
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.giant) {
        // An angry red glow round him once he's raging
        if (f.rage) { const pu = 0.5 + Math.sin(G.time / 140) * 0.2; ctx.fillStyle = `rgba(255,60,60,${0.18 * pu + 0.08})`; ctx.beginPath(); ctx.arc(0, 0, f.r * 1.45, 0, TAU); ctx.fill(); }
        ctx.scale(gk, gk);
    }

    if (!lowDetail) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(4, 7, r, r * 0.85, 0, 0, TAU); ctx.fill();
    }

    ctx.rotate(f.angle);
    const kick = -f.recoil * 6;
    let hands;
    if (f.zombie) {
        // Arms stretched out in front, swiping
        const ext = Math.sin(f.punch * Math.PI) * 14;
        hands = [[r * 1.15 + (f.punchHand === 0 ? ext : 0), -r * 0.5], [r * 1.05 + (f.punchHand === 1 ? ext : 0), r * 0.55]];
    } else if (w.blade === 'sword') {
        // At rest it's held out to the side; a swing sweeps it across the front
        const a = f.punch > 0 ? 1.1 - (1 - f.punch) * 2.3 : 0.6;
        const gx = r * 0.55, gy = r * 0.6;
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(a - 0.6);
        ctx.fillStyle = '#5a3a1e'; ctx.fillRect(-7, -2.5, 10, 5);
        ctx.fillStyle = '#c9a24a'; ctx.fillRect(3, -7, 4, 14);
        ctx.fillStyle = '#dfe4ec'; ctx.beginPath(); ctx.moveTo(7, -3); ctx.lineTo(7 + w.len, -2.4); ctx.lineTo(14 + w.len, 0); ctx.lineTo(7 + w.len, 2.4); ctx.lineTo(7, 3); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(110,120,140,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(6 + w.len, 0); ctx.stroke();
        ctx.restore();
        if (f.punch > 0.15) { ctx.strokeStyle = `rgba(255,255,255,${f.punch * 0.35})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(gx, gy, w.len + 10, -1.5, a - 0.6); ctx.stroke(); }
        hands = [[gx, gy], [r * 0.45, -r * 0.75]];
    } else if (w.blade && !THRUST[w.blade] && w.blade !== 'sword') {
        // Dagger, axe, mace and hammer: a handle with a head on the end, swung across the front like the sword
        const heavy = w.blade === 'hammer' || w.blade === 'axe';
        const a = f.punch > 0 ? 1.1 - (1 - f.punch) * 2.3 : (heavy ? 0.9 : 0.6);
        const gx = r * 0.55, gy = r * 0.6;
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(a - 0.6);
        ctx.fillStyle = w.blade === 'dagger' ? '#3a2614' : '#8a5a2e'; ctx.fillRect(-6, -2.2, w.len + 6, 4.4);
        ctx.translate(w.len, 0); drawWeaponHead(ctx, w.blade);
        ctx.restore();
        if (f.punch > 0.15) { ctx.strokeStyle = `rgba(255,255,255,${f.punch * 0.35})`; ctx.lineWidth = heavy ? 9 : 5; ctx.beginPath(); ctx.arc(gx, gy, w.len + 12, -1.5, a - 0.6); ctx.stroke(); }
        hands = [[gx, gy], w.blade === 'dagger' ? [r * 0.45, -r * 0.75] : [gx + 9 * Math.cos(a - 0.6), gy + 9 * Math.sin(a - 0.6)]];
    } else if (w.blade === 'halberd') {
        // A long pole held level; an attack is a straight thrust
        const ext = Math.sin(f.punch * Math.PI) * 28, y = r * 0.42;
        ctx.fillStyle = '#8a5a2e'; ctx.fillRect(-r * 0.6 + ext, y - 2.2, w.len, 4.4);
        ctx.save(); ctx.translate(-r * 0.6 + w.len + ext, y); drawWeaponHead(ctx, 'halberd'); ctx.restore();
        hands = [[r * 0.25 + ext, y], [r * 0.95 + ext, y]];
    } else if (w.blade === 'spear') {
        // Held level in both hands; an attack is a straight thrust
        const ext = Math.sin(f.punch * Math.PI) * 30, y = r * 0.42;
        ctx.fillStyle = '#8a5a2e'; ctx.fillRect(-r * 0.6 + ext, y - 2, w.len, 4);
        const tip = -r * 0.6 + w.len + ext;
        ctx.fillStyle = '#c9a24a'; ctx.fillRect(tip - 3, y - 3, 3, 6);
        ctx.fillStyle = '#dfe4ec'; ctx.beginPath(); ctx.moveTo(tip, y - 5.5); ctx.lineTo(tip + 16, y); ctx.lineTo(tip, y + 5.5); ctx.closePath(); ctx.fill();
        hands = [[r * 0.25 + ext, y], [r * 0.95 + ext, y]];
    } else if (w.melee) {
        const ext = Math.sin(f.punch * Math.PI) * 18;
        hands = [[r * 0.72 + (f.punchHand === 0 ? ext : 0), -r * 0.68], [r * 0.72 + (f.punchHand === 1 ? ext : 0), r * 0.68]];
    } else if (w.shape === 'bow') {
        // The bow out in front; the string drawn back with an arrow on it when one's nocked
        const R0 = w.bowR || 20, bx = r * 1.25 + 18 + (R0 - 20) * 0.5, A = 1.1, ex = bx + Math.cos(A) * R0 - R0, ey = Math.sin(A) * R0;
        const nocked = f.ammo[held(f)] > 0, pull = nocked ? 14 : 0;
        ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(bx - R0, 0, R0, -A, A); ctx.stroke();
        ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(bx - R0, 0, R0, -A, A); ctx.stroke();
        ctx.strokeStyle = '#efe6d0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex, -ey); ctx.lineTo(ex - pull, 0); ctx.lineTo(ex, ey); ctx.stroke();
        if (nocked) {
            ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex - pull, 0); ctx.lineTo(bx + 10, 0); ctx.stroke();
            ctx.fillStyle = '#d8dde6'; ctx.beginPath(); ctx.moveTo(bx + 15, 0); ctx.lineTo(bx + 9, -3); ctx.lineTo(bx + 9, 3); ctx.closePath(); ctx.fill();
        }
        hands = [[bx - 2, 0], [ex - pull, 0]];
    } else {
        // Gun body, barrel and a rarity-colored stripe
        const gx = r * 0.35 + kick;
        ctx.fillStyle = '#1f1b2b';
        roundRect(ctx, gx - 2, -w.w / 2 - 2, w.len + r * 0.7 + 4, w.w + 4, 3); ctx.fill();
        ctx.fillStyle = '#3b3550';
        roundRect(ctx, gx, -w.w / 2, w.len + r * 0.7, w.w, 2); ctx.fill();
        ctx.fillStyle = RARITY[w.rarity].color;
        ctx.fillRect(gx + 4, -1, Math.min(14, w.len * 0.4), 2);
        hands = [[r * 0.85 + kick, 5], [r * 0.85 + w.len * 0.5 + kick, -3]];
    }

    // Body (drawn unrotated so the highlight stays top-left)
    ctx.rotate(-f.angle);
    if (f === G.player) playerGlow(0, 0, r);
    ctx.fillStyle = f.dark;
    ctx.beginPath(); ctx.arc(0, 0, r + 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.32, r * 0.5, 0, TAU); ctx.fill();
    if (f.zombie) {
        // Rotting blotches and a torn patch
        ctx.fillStyle = 'rgba(60,80,20,0.75)';
        ctx.beginPath(); ctx.arc(r * 0.35, r * 0.3, r * 0.32, 0, TAU); ctx.arc(-r * 0.4, r * 0.45, r * 0.2, 0, TAU); ctx.arc(r * 0.1, -r * 0.55, r * 0.17, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(120,30,30,0.6)';
        ctx.beginPath(); ctx.arc(-r * 0.5, -r * 0.1, r * 0.16, 0, TAU); ctx.fill();
    }
    if (f.giant) {
        // Armor plates, two horns and glowing eyes, all facing where he looks
        ctx.save(); ctx.rotate(f.angle);
        ctx.fillStyle = 'rgba(20,6,10,0.55)';
        ctx.beginPath(); ctx.arc(-r * 0.15, 0, r * 0.62, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8dcc0'; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1;
        for (const sy of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(r * 0.05, sy * r * 0.55); ctx.quadraticCurveTo(-r * 0.2, sy * r * 1.35, -r * 0.85, sy * r * 1.25); ctx.quadraticCurveTo(-r * 0.25, sy * r * 0.95, -r * 0.3, sy * r * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        const glow = f.rage ? '#ff3030' : '#ffb000';
        ctx.fillStyle = glow; ctx.shadowColor = glow; ctx.shadowBlur = 8;
        for (const sy of [-1, 1]) { ctx.beginPath(); ctx.ellipse(r * 0.55, sy * r * 0.28, r * 0.16, r * 0.1, 0, 0, TAU); ctx.fill(); }
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    if (f.soldier) {
        // Camo blotches and a helmet
        ctx.fillStyle = 'rgba(40,46,24,0.7)';
        ctx.beginPath(); ctx.arc(r * 0.4, r * 0.35, r * 0.28, 0, TAU); ctx.arc(-r * 0.45, r * 0.3, r * 0.22, 0, TAU); ctx.fill();
        if (f.boss) {
            // The Commander: red beret and gold stars on the shoulders
            ctx.fillStyle = '#b3262e';
            ctx.beginPath(); ctx.ellipse(-r * 0.1, -r * 0.15, r * 0.66, r * 0.55, -0.4, 0, TAU); ctx.fill();
            ctx.fillStyle = '#ffd166';
            for (const sx of [-0.62, 0.62]) { ctx.beginPath(); ctx.arc(r * sx, r * 0.42, 3.2, 0, TAU); ctx.fill(); }
            ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, 2.6, 0, TAU); ctx.fill();
        } else {
            ctx.fillStyle = '#3d4526';
            ctx.beginPath(); ctx.arc(-r * 0.05, -r * 0.1, r * 0.62, 0, TAU); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.3, r * 0.25, 0, TAU); ctx.fill();
        }
    }
    // (a white ring round you; a gold one round the other people playing: the host and their friends)
    if (f === G.player || isHuman(f)) {
        ctx.strokeStyle = f === G.player ? '#fff7ec' : '#ffd166';
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, TAU); ctx.stroke();
    }
    if (f.armor > 0) {
        ctx.strokeStyle = 'rgba(76,195,255,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, r - 4, -Math.PI * 0.85, -Math.PI * 0.15); ctx.stroke();
    }
    if (f.hitFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${f.hitFlash * 0.8})`;
        ctx.beginPath(); ctx.arc(0, 0, r + 2, 0, TAU); ctx.fill();
    }

    ctx.rotate(f.angle);
    if (f.zombie) {
        // Glowing eyes
        ctx.fillStyle = '#ff3b2f';
        ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.28, 2.6, 0, TAU); ctx.arc(r * 0.55, r * 0.28, 2.6, 0, TAU); ctx.fill();
    }
    if (f.cook) {
        drawThrowable(ctx, f.cook.key, r * 0.9, r * 0.75, 0.75);
        if (cookLeft(f) < 1 && Math.sin(G.time * 0.05) > 0) {
            ctx.fillStyle = '#ff3b3b';
            ctx.beginPath(); ctx.arc(r * 0.9, r * 0.75 - 4, 3.5, 0, TAU); ctx.fill();
        }
    }
    for (const [hx, hy] of hands) {
        ctx.fillStyle = f.dark;
        ctx.beginPath(); ctx.arc(hx, hy, 7.5, 0, TAU); ctx.fill();
        ctx.fillStyle = f.light;
        ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, TAU); ctx.fill();
    }
    ctx.restore();
}

// Health bars over hurt bots
function drawOverhead(f) {
    const p = G.player;
    if (f.ghost && f !== p && !ghostSeen(f)) return;
    if (f.hidden && p && !p.dead && f !== p && foe(p, f) && dist(f, p) > CONFIG.HIDDEN_SIGHT) return;
    if (f.healing) {
        const t = (G.time - f.healing.start) / (f.healing.end - f.healing.start);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r + 12, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#5ee08a';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * t); ctx.stroke();
    }
    if (f.cook && f === G.player) {
        const left = cookLeft(f), t = clamp(left / f.cook.fuse, 0, 1);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r + 18, 0, TAU); ctx.stroke();
        ctx.strokeStyle = left < 1 ? '#ff3b3b' : '#ffb347';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r + 18, -Math.PI / 2, -Math.PI / 2 + TAU * t); ctx.stroke();
    }
    if (f === G.player) return;
    if (G.war && G.player && f.team === G.player.team) {
        // Little chevron so you can pick out your squad in a crowd
        const y0 = f.y - f.r - (G.time - f.lastHurt > 2500 ? 12 : 24);
        const k = Math.max(1, 0.7 / G.zoom);
        ctx.fillStyle = '#fff7ec';
        ctx.beginPath(); ctx.moveTo(f.x - 8 * k, y0 - 8 * k); ctx.lineTo(f.x, y0); ctx.lineTo(f.x + 8 * k, y0 - 8 * k); ctx.lineTo(f.x, y0 - 4 * k); ctx.closePath(); ctx.fill();
    }
    if (f.boss) {
        // The Commander's health and armor are always shown, with his title
        const w = f.giant ? 130 : 70, x = f.x - w / 2, y = f.y - f.r - 20, title = f.giant ? 'THE BOSS' : 'COMMANDER';
        ctx.font = `700 ${f.giant ? 18 : 14}px Rajdhani, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.lineWidth = 3; ctx.strokeStyle = '#160e28'; ctx.strokeText(title, f.x, y - 4);
        ctx.fillStyle = f.rage ? '#ff4f6d' : '#ffd166'; ctx.fillText(title, f.x, y - 4);
        ctx.fillStyle = 'rgba(18,10,38,0.8)'; roundRect(ctx, x - 2, y - 2, w + 4, 11, 3); ctx.fill();
        ctx.fillStyle = '#ff4f6d'; ctx.fillRect(x, y, w * clamp(f.hp / f.maxHp, 0, 1), 5);
        ctx.fillStyle = '#4cc3ff'; ctx.fillRect(x, y + 5, w * clamp(f.armor / (f.giant ? BOSS.armor : COMMANDER.armor), 0, 1), 3);
        return;
    }
    if (G.time - f.lastHurt > 2500) return;
    const w = 44, x = f.x - w / 2, y = f.y - f.r - 16;
    ctx.fillStyle = 'rgba(18,10,38,0.75)';
    roundRect(ctx, x - 2, y - 2, w + 4, 9, 3); ctx.fill();
    ctx.fillStyle = f.zombie ? '#9be35a' : '#ff4f6d';
    ctx.fillRect(x, y, w * clamp(f.hp / f.maxHp, 0, 1), 5);
    if (f.armor > 0) { ctx.fillStyle = '#4cc3ff'; ctx.fillRect(x, y + 5, w * Math.min(1, f.armor / CONFIG.MAX_ARMOR), 2); }
}

function drawBullets(L, T, R, B) {
    ctx.lineCap = 'round';
    for (const b of G.bullets) {
        if (b.x < L - 60 || b.x > R + 60 || b.y < T - 60 || b.y > B + 60) continue;
        if (b.boulder) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(b.x + 8, b.y + 12, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#7d7468'; ctx.beginPath(); ctx.arc(b.x, b.y, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a9083'; ctx.beginPath(); ctx.arc(b.x - 3, b.y - 3, 6, 0, TAU); ctx.fill(); continue; }
        if (b.zap) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#7fe9ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(b.x, b.y); for (let k = 1; k <= 4; k++) ctx.lineTo(b.x - b.vx * 0.006 * k + rand(-7, 7), b.y - b.vy * 0.006 * k + rand(-7, 7)); ctx.stroke(); ctx.fillStyle = '#e8ffff'; ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, TAU); ctx.fill(); ctx.restore(); continue; }
        if (b.rocket) { drawRocket(b); continue; }
        if (WEAPONS[b.weapon] && WEAPONS[b.weapon].string) {
            const arrow = b.weapon !== 'Crossbow', a = Math.atan2(b.vy, b.vx), L = b.weapon === 'Longbow' ? 44 : arrow ? 36 : 26;
            ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
            ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = arrow ? 2.2 : 3; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, 0); ctx.stroke();
            ctx.fillStyle = '#c9ced6'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-3, -3.5); ctx.lineTo(-3, 3.5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = b.weapon === 'Longbow' ? '#f2f2f2' : arrow ? '#d64545' : '#e8e3d0'; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-L - 6, -5); ctx.lineTo(-L - 3, 0); ctx.lineTo(-L - 6, 5); ctx.closePath(); ctx.fill();
            ctx.restore();
            continue;
        }
        if (b.explosive) { ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, TAU); ctx.fill(); }
        const sp = Math.hypot(b.vx, b.vy);
        const tail = Math.min(b.heavy ? 70 : 34, sp * 0.03);
        const tx = b.x - (b.vx / sp) * tail, ty = b.y - (b.vy / sp) * tail;
        const hyper = WEAPONS[b.weapon] && WEAPONS[b.weapon].hyper;
        if (hyper) {
            ctx.strokeStyle = b.weapon === 'Railgun' ? '#e8ffff' : HYPER.neon;
            ctx.lineWidth = b.weapon === 'Railgun' ? 6 : 4;
            ctx.beginPath(); ctx.moveTo(b.x - (b.vx / sp) * tail * 1.6, b.y - (b.vy / sp) * tail * 1.6); ctx.lineTo(b.x, b.y); ctx.stroke();
            continue;
        }
        if (lowDetail) {
            ctx.strokeStyle = '#ffd98a';
        } else {
            const grad = ctx.createLinearGradient(tx, ty, b.x, b.y);
            grad.addColorStop(0, 'rgba(255,209,102,0)');
            grad.addColorStop(1, b.owner.isPlayer ? 'rgba(255,247,200,1)' : 'rgba(255,190,110,1)');
            ctx.strokeStyle = grad;
        }
        ctx.lineWidth = Math.max(b.heavy ? 4 : 3, 1.5 / G.zoom);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
}

function drawRocket(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.atan2(b.vy, b.vx));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,170,70,0.9)';
    ctx.beginPath(); ctx.ellipse(-20, 0, 10 + Math.random() * 6, 5, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#3d4450';
    roundRect(ctx, -14, -4.5, 22, 9, 4); ctx.fill();
    ctx.fillStyle = '#ff5a5f';
    ctx.beginPath(); ctx.moveTo(8, -4.5); ctx.lineTo(16, 0); ctx.lineTo(8, 4.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#262a31';
    ctx.fillRect(-14, -8, 5, 16);
    ctx.restore();
}

function drawParticles() {
    if (G.fort) drawFort();
    for (const p of G.particles) {
        const t = p.life / p.max;
        switch (p.type) {
            case 'flash':
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = `rgba(255,220,120,${t})`;
                ctx.beginPath(); ctx.ellipse(p.size * 0.4, 0, p.size, p.size * 0.5, 0, 0, TAU); ctx.fill();
                ctx.fillStyle = `rgba(255,255,240,${t})`;
                ctx.beginPath(); ctx.arc(0, 0, p.size * 0.4, 0, TAU); ctx.fill();
                ctx.restore();
                break;
            case 'smoke':
                if (p.color && p.color[0] === '#') {
                    ctx.globalAlpha = t * 0.4;
                    ctx.fillStyle = p.color;
                } else {
                    ctx.fillStyle = `rgba(${p.color || '230,225,240'},${t * (p.color ? 0.4 : 0.25)})`;
                }
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (2 - t), 0, TAU); ctx.fill();
                ctx.globalAlpha = 1;
                break;
            case 'boom': {
                const k = 1 - t;
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (0.5 + k * 0.7));
                grad.addColorStop(0, `rgba(255,250,220,${t})`);
                grad.addColorStop(0.35, `rgba(255,190,80,${t * 0.9})`);
                grad.addColorStop(0.7, `rgba(255,90,40,${t * 0.6})`);
                grad.addColorStop(1, 'rgba(255,60,30,0)');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.7), 0, TAU); ctx.fill();
                ctx.restore();
                break;
            }
            case 'plus':
                ctx.globalAlpha = Math.min(1, t * 2);
                ctx.fillStyle = '#5ee08a';
                ctx.fillRect(p.x - p.size, p.y - p.size * 0.3, p.size * 2, p.size * 0.6);
                ctx.fillRect(p.x - p.size * 0.3, p.y - p.size, p.size * 0.6, p.size * 2);
                ctx.globalAlpha = 1;
                break;
            case 'glow':
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = Math.min(1, t * 1.6);
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + t * 0.6), 0, TAU); ctx.fill();
                ctx.restore();
                break;
            case 'leaf':
                if (p.rot === undefined) { p.rot = rand(0, TAU); p.spin = rand(-8, 8); }
                p.rot += p.spin * 0.016;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = Math.min(1, t * 2);
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, TAU); ctx.fill();
                ctx.restore();
                break;
            case 'chunk':
                p.rot += p.spin * 0.016;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = Math.min(1, t * 2);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
                ctx.restore();
                break;
            case 'skull': {
                const a = Math.min(1, t * 2), sc = 1 + (1 - t) * 0.3;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.scale(sc, sc);
                ctx.globalAlpha = a;
                ctx.fillStyle = '#1a0f2e';
                ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
                ctx.fillRect(-9, 6, 18, 12);
                ctx.fillStyle = '#ffd166';
                ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
                ctx.fillRect(-7, 6, 14, 9);
                ctx.fillStyle = '#1a0f2e';
                ctx.beginPath(); ctx.arc(-5, -1, 3.5, 0, TAU); ctx.arc(5, -1, 3.5, 0, TAU); ctx.fill();
                ctx.fillRect(-1, 4, 2, 4);
                ctx.fillRect(-4, 11, 2, 4); ctx.fillRect(2, 11, 2, 4);
                ctx.restore();
                break;
            }
            case 'shell':
                // Brass tumbling out of the ejection port
                p.rot += p.spin * 0.016;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                ctx.fillStyle = '#d9a640'; ctx.fillRect(-3, -1.3, 6, 2.6);
                ctx.restore();
                break;
            case 'sonic': {
                // A wide arc of force rolling outward
                const r = p.size * (1 - t) + 20;
                ctx.save(); ctx.globalAlpha = t;
                ctx.strokeStyle = 'rgba(200,240,255,0.9)'; ctx.lineWidth = 10 * t + 2;
                ctx.beginPath(); ctx.arc(p.x, p.y, r, p.angle - 0.5, p.angle + 0.5); ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.85, p.angle - 0.45, p.angle + 0.45); ctx.stroke();
                ctx.restore();
                break;
            }
            case 'streak':
                // Shrapnel: a short bright line along its path
                ctx.strokeStyle = `rgba(255,220,150,${t})`; ctx.lineWidth = p.size;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke();
                break;
            case 'bolt': {
                // A jagged arc of lightning between two points
                const rnd = seededRand(Math.floor(p.seed * 1e6) + Math.floor(G.time / 50));
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = t;
                for (const [col, lw] of [['rgba(0,229,255,0.5)', 7], ['#e8ffff', 2.5]]) {
                    ctx.strokeStyle = col; ctx.lineWidth = lw;
                    ctx.beginPath(); ctx.moveTo(p.x, p.y);
                    for (let k = 1; k < 7; k++) { const f = k / 7; ctx.lineTo(lerp(p.x, p.x2, f) + (rnd() - 0.5) * 26, lerp(p.y, p.y2, f) + (rnd() - 0.5) * 26); }
                    ctx.lineTo(p.x2, p.y2); ctx.stroke();
                }
                ctx.restore();
                break;
            }
            case 'cube': drawCube(p); break;
            case 'twinkle': {
                // a little four-pointed sparkle
                const k = Math.sin(t * Math.PI), L = p.size * k;
                ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = p.color; ctx.lineWidth = 1.4; ctx.globalAlpha = k;
                ctx.beginPath(); ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x + L, p.y); ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y + L); ctx.stroke();
                ctx.restore();
                break;
            }
            case 'zap': {
                // A crackle of electricity (its zigzag jumps to a new shape every frame)
                const rnd = seededRand(Math.floor(p.seed * 1e6) + Math.floor(G.time / 16));
                const j = Math.hypot(p.x2 - p.x, p.y2 - p.y) * 0.35;
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 1;
                for (const [col, lw] of [[p.color, 2.6], ['#ffffff', 1]]) {
                    ctx.strokeStyle = col; ctx.lineWidth = lw;
                    ctx.beginPath(); ctx.moveTo(p.x, p.y);
                    for (let k = 1; k < 4; k++) { const f = k / 4; ctx.lineTo(lerp(p.x, p.x2, f) + (rnd() - 0.5) * j, lerp(p.y, p.y2, f) + (rnd() - 0.5) * j); }
                    ctx.lineTo(p.x2, p.y2); ctx.stroke();
                }
                ctx.restore();
                break;
            }
            case 'ring':
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = t;
                ctx.lineWidth = 4 * t;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.2 - t), 0, TAU); ctx.stroke();
                ctx.globalAlpha = 1;
                break;
            default:
                ctx.globalAlpha = Math.min(1, t * 1.5);
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.5), 0, TAU); ctx.fill();
                ctx.globalAlpha = 1;
        }
    }
}

function drawZone(L, T, R, B, now) {
    const z = G.zone;
    ctx.save();
    ctx.beginPath();
    ctx.rect(L - 50, T - 50, R - L + 100, B - T + 100);
    ctx.arc(z.cx, z.cy, Math.max(0.5, z.r), 0, TAU);
    ctx.fillStyle = 'rgba(150,30,90,0.32)';
    ctx.fill('evenodd');
    ctx.lineWidth = Math.max(8, 4 / G.zoom);
    ctx.strokeStyle = `rgba(255,79,109,${0.6 + Math.sin(now * 4) * 0.2})`;
    ctx.beginPath(); ctx.arc(z.cx, z.cy, Math.max(0.5, z.r), 0, TAU); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,220,230,0.8)';
    ctx.stroke();
    ctx.restore();
}

function drawFloats() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of G.floats) {
        const t = f.life / f.max;
        const pop = t > 0.8 ? 1 + (t - 0.8) * 2 : 1;
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.font = `700 ${Math.round(((f.big ? 26 : 18) * pop) / G.zoom)}px Rajdhani, sans-serif`;
        ctx.lineWidth = 4 / G.zoom;
        ctx.strokeStyle = 'rgba(18,10,38,0.85)';
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
}

function drawCrosshair(p) {
    const w = WEAPONS[held(p)];
    const m = mouseWorld();
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    const gap = 6 + gunSpread(p, w) * d * 0.5 + p.recoil * 6;
    const x = mouse.x, y = mouse.y;
    ctx.lineCap = 'round';
    for (const [col, lw] of [['rgba(18,10,38,0.8)', 4], ['#fff7ec', 2]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x - gap - 8, y); ctx.lineTo(x - gap, y);
        ctx.moveTo(x + gap, y); ctx.lineTo(x + gap + 8, y);
        ctx.moveTo(x, y - gap - 8); ctx.lineTo(x, y - gap);
        ctx.moveTo(x, y + gap); ctx.lineTo(x, y + gap + 8);
        ctx.stroke();
    }
    ctx.fillStyle = '#fff7ec';
    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, TAU); ctx.fill();
    if (G.hitMarker > 0) {
        ctx.strokeStyle = `rgba(255,79,109,${G.hitMarker})`;
        ctx.lineWidth = 3;
        const s = 7, o = 5;
        ctx.beginPath();
        ctx.moveTo(x - o - s, y - o - s); ctx.lineTo(x - o, y - o);
        ctx.moveTo(x + o + s, y - o - s); ctx.lineTo(x + o, y - o);
        ctx.moveTo(x - o - s, y + o + s); ctx.lineTo(x - o, y + o);
        ctx.moveTo(x + o + s, y + o + s); ctx.lineTo(x + o, y + o);
        ctx.stroke();
    }
}

// ---------- HUD ----------
const $ = id => document.getElementById(id);
const hud = {
    root: $('hud'), alive: $('alive'), kills: $('kills'), zone: $('zone-info'), killfeed: $('killfeed'),
    banner: $('banner'), prompt: $('prompt'), hpBar: $('hp-bar'), armorBar: $('armor-bar'), shieldBar: $('shield-bar'), hungerBar: $('hunger-bar'), thirstBar: $('thirst-bar'), energyBar: $('energy-bar'), hotbar: $('hotbar'),
    weapon: $('weapon-name'), mag: $('mag'),
    minimap: $('minimap').getContext('2d'), cache: {},
    cells: Object.fromEntries(STACKABLE.map(k => [k, $('cell-' + k)])), nukeUse: $('nuke-use'),
    counts: Object.fromEntries(STACKABLE.map(k => [k, $('count-' + k)])),
    healBar: $('heal-bar'), healLabel: $('heal-label'), teamScore: $('team-score')
};

// Only touch the DOM when a value actually changes
function setText(el, key, value) {
    if (hud.cache[key] === value) return;
    hud.cache[key] = value;
    el.textContent = value;
}

function setHTML(el, key, value) {
    if (hud.cache[key] === value) return;
    hud.cache[key] = value;
    el.innerHTML = value;
}

function updateHUD() {
    const p = G.player;
    const z = G.zone;
    setText(hud.alive, 'alive', String(G.alive));
    setText(hud.kills, 'kills', String(p.kills));
    if (G.revolution) {
        const Rv = G.revolution;
        setHTML(hud.teamScore, 'teams', [0, 1].map(t => `<div class="ts${t === p.team ? ' mine' : ''}${revoLeft(t) === 0 ? ' out' : ''}"><i style="background:${REVO.sides[t].flag}"></i><b>${G.teamAlive[t]}</b><span>${revoName(t)} · ${Rv.bases[t].fallen ? 'base fallen' : `base ${Math.round(baseHealth(Rv.bases[t]) * 100)}% · strike ${Math.floor(Rv.bases[t].strike.ammo / 100) / 10}k/${REVO.strike.cost / 1000}k`}</span></div>`).join('<em>vs</em>'));
    } else if (G.war) {
        setHTML(hud.teamScore, 'teams', G.teamAlive.map((n, t) =>
            `<div class="ts${t === p.team ? ' mine' : ''}${n === 0 ? ' out' : ''}"><i style="background:${TEAMS[t].color}"></i><b>${n}</b><span>${t === p.team ? 'Your team' : TEAMS[t].name}</span></div>`).join('<em>vs</em>'));
    } else if (G.noZone) {
        const { a, b } = G.sides;
        const chip = (n, color, label, mine) => `<div class="ts${mine ? ' mine' : ''}${n === 0 ? ' out' : ''}"><i style="background:${color}"></i><b>${n}</b><span>${label}</span></div>`;
        const B = G.bossF, pct = B ? Math.max(0, Math.ceil(B.hp / B.maxHp * 100)) : 0;
        if (G.bossFight) setHTML(hud.teamScore, 'teams', chip(a, SURVIVOR_COLOR, 'Your team', true) + '<em>vs</em>'
            + `<div class="boss-hp${B && B.rage ? ' rage' : ''}"><span>THE BOSS${b > 1 ? ` + ${b - 1} guard${b === 2 ? '' : 's'}` : ''}</span><div><i style="width:${pct}%"></i><s style="width:${B ? clamp(B.armor / BOSS.armor, 0, 1) * 100 : 0}%"></s></div><b>${pct}%</b></div>`);
        else setHTML(hud.teamScore, 'teams', G.assassin
            ? chip(a, SURVIVOR_COLOR, 'Survivors', !p.assassin) + '<em>vs</em>' + chip(b, '#e0303a', b ? 'Assassin' : 'Caught', !!p.assassin)
            : G.zombies
            ? chip(a, SURVIVOR_COLOR, 'Survivors', !p.zombie) + '<em>vs</em>' + chip(b, ZOMBIE.color, 'Zombies', p.zombie)
            : chip(a, '#fff7ec', 'Running', true) + chip(G.escaped, '#7dffb0', 'Escaped', false) + '<em>vs</em>' + chip(b, '#9aa86a', 'Soldiers', false));
    }

    let zt;
    if (G.zombies) zt = p.zombie ? 'Hunt the survivors' : 'Survive the horde';
    else if (G.bossFight) zt = G.bossF && G.bossF.rage ? 'Guards! Take them out or go for the boss' : 'Take down the boss · beware his stomp';
    else if (G.assassin) zt = p.assassin ? "Take them all out · don't get caught" : 'Find the assassin and catch him';
    else if (G.murder) { const r = murderRole(p), n = G.fighters.filter(f => !f.dead && !f.murderer).length; zt = `${MURDER_ROLE[r]} · ${r === 'murderer' ? `${n} left to get` : r === 'sheriff' ? 'find the murderer' : 'stay alive'} · ${fmtTime(Math.max(0, (G.murderEnd - G.time) / 1000))}`; }
    else if (G.ghostMode) zt = p.ghost ? `Haunt them all · ${G.fighters.filter(f => !f.dead && !f.ghost).length} hunters left` : 'Find the ghost · follow its glowing footprints';
    else if (G.fort) zt = G.fort.build ? `Build your fort · 🪵 ${p.wood || 0} wood (${FORT.wall} a wall) · fight in ${fmtTime(Math.max(0, (FORT.build - G.time) / 1000))}` : 'Shoot their fort apart and wipe them out';
    else if (G.escape) {
        const F = G.world.floor;
        if (!F && G.extract) zt = `Reach the extraction helicopter · ${Math.round(dist(p, G.extract) / 10)}m`;
        else if (!F) zt = `Get to the HQ tower · ${Math.round(dist(p, { x: G.hq.cx, y: G.hq.cy }) / 10)}m`;
        else if (F.roof) zt = 'Get to the helicopter!';
        else zt = `${F.b.hq ? 'HQ' : F.b.kind} floor ${F.level}/${F.b.floors}${F.b.hq ? ': find the stairs up' : ''}`;
    }
    else if (G.revolution) zt = p.dead ? (G.revolution.queue.some(q => q.f === p) ? `Respawning in ${Math.ceil((G.revolution.queue.find(q => q.f === p).at - G.time) / 1000)}s` : 'Dead: spectating') : `Wipe out the ${revoName(1 - p.team)} · ${fmtTime(Math.max(0, (REVO.timeLimit - G.time) / 1000))} left`;
    else if (z.state === 'wait') zt = `Zone shrinks in ${fmtTime(z.timer)}`;
    else if (z.state === 'shrink') zt = `Zone closing ${fmtTime(z.timer)}`;
    else zt = G.survival ? 'Survive: last one alive wins' : 'Final zone';
    setText(hud.zone, 'zone', zt);
    hud.zone.classList.toggle('closing', z.state !== 'wait' && !G.revolution);

    const hpPct = clamp(p.hp / p.maxHp, 0, 1);
    hud.hpBar.querySelector('.fill').style.transform = `scaleX(${hpPct})`;
    hud.hpBar.querySelector('.ghost').style.transform = `scaleX(${hpPct})`;
    hud.hpBar.classList.toggle('low', p.hp < 30);
    setText(hud.hpBar.querySelector('span'), 'hp', String(Math.ceil(p.hp)));
    hud.armorBar.querySelector('.fill').style.transform = `scaleX(${clamp(p.armor / CONFIG.MAX_ARMOR, 0, 1)})`;
    hud.shieldBar.classList.toggle('hidden', !(p.shield > 0));
    if (p.shield > 0) {
        hud.shieldBar.querySelector('.fill').style.transform = `scaleX(${clamp(p.shield / p.shieldMax, 0, 1)})`;
        setText(hud.shieldBar.querySelector('span'), 'shield', `${ITEMS[p.shieldKind].name.toUpperCase()} ${Math.ceil(p.shield)}`);
    }
    if (G.survival) {
        hud.hungerBar.querySelector('.fill').style.transform = `scaleX(${clamp(p.hunger / 100, 0, 1)})`;
        setText(hud.hungerBar.querySelector('span'), 'hunger', p.hunger <= 0 ? 'STARVING' : `HUNGER ${Math.ceil(p.hunger)}`);
        hud.hungerBar.classList.toggle('low', p.hunger < HUNGER.warn);
        hud.thirstBar.querySelector('.fill').style.transform = `scaleX(${clamp(p.thirst / 100, 0, 1)})`;
        setText(hud.thirstBar.querySelector('span'), 'thirst', p.thirst <= 0 ? 'DEHYDRATED: PRESS V AT WATER' : `THIRST ${Math.ceil(p.thirst)}`);
        hud.thirstBar.classList.toggle('low', p.thirst < THIRST.warn);
        hud.energyBar.querySelector('.fill').style.transform = `scaleX(${clamp(p.energy / 100, 0, 1)})`;
        setText(hud.energyBar.querySelector('span'), 'energy', p.resting ? 'RESTING...' : p.energy < ENERGY.tired ? `TIRED ${Math.ceil(p.energy)} · PRESS B TO REST` : `ENERGY ${Math.ceil(p.energy)}`);
        hud.energyBar.classList.toggle('low', p.energy < ENERGY.tired);
    }
    setText(hud.armorBar.querySelector('span'), 'armor', p.armor > 0 ? `ARMOR ${Math.ceil(p.armor)}` : '');

    // Hotbar
    let html = '';
    for (let i = 0; i < 5; i++) {
        if (i >= p.maxSlots) {
            html += `<div class="slot locked"><span class="key">${i + 1}</span><span class="name">Backpack ${i - 1}</span></div>`;
            continue;
        }
        const n = p.inv[i];
        const active = i === p.slot;
        if (!n) {
            html += `<div class="slot empty${active ? ' active' : ''}"><span class="key">${i + 1}</span><span class="name">${p.zombie ? 'Claws' : 'Fists'}</span><span class="sub">${p.zombie ? 'Zombie' : 'Empty slot'}</span></div>`;
            continue;
        }
        const w = WEAPONS[n];
        const col = RARITY[w.rarity].color;
        const sub = w.melee ? (THRUST[w.blade] ? 'Long reach' : w.chop ? 'Chops trees' : w.crush ? 'Breaks armor' : w.knock ? 'Knockback' : w.blade === 'dagger' ? 'Fast' : 'Melee') : `${p.ammo[n] === Infinity ? '∞' : p.ammo[n]} rounds`;
        html += `<div class="slot${active ? ' active' : ''}" style="border-color:${active ? col : col + '44'}"><span class="key">${i + 1}</span><span class="name" style="color:${col}">${n}</span><span class="sub">${sub}</span></div>`;
    }
    setHTML(hud.hotbar, 'hotbar', html);

    // Supplies: heals bottom-left, grenades bottom-right
    for (const k of STACKABLE) {
        const lim = carryLimit(p, k);
        setText(hud.counts[k], 'c-' + k, `${p.items[k]}/${lim}`);
        hud.cells[k].classList.toggle('none', p.items[k] === 0);
        hud.cells[k].classList.toggle('full', p.items[k] >= lim);
        hud.cells[k].classList.toggle('using', !!p.healing && p.healing.key === k);
        hud.cells[k].classList.toggle('selected', p.throwSel === k);
        hud.cells[k].classList.toggle('armed', p.throwSel === k && !!p.nadeReady);
    }
    hud.nukeUse.classList.toggle('hidden', !canMapNuke(p));
    hud.healBar.classList.toggle('on', !!p.healing);
    if (p.healing) {
        hud.healBar.firstChild.style.width = `${((G.time - p.healing.start) / (p.healing.end - p.healing.start)) * 100}%`;
        setText(hud.healLabel, 'healLabel', `Using ${ITEMS[p.healing.key].name}…`);
    } else setText(hud.healLabel, 'healLabel', '');

    const name = held(p), w = WEAPONS[name];
    setText(hud.weapon, 'wname', p.nadeReady ? `${ITEMS[p.throwSel].name} (in hand)` : name);
    hud.weapon.style.color = p.nadeReady ? '#ffb347' : RARITY[w.rarity].color;
    setText(hud.mag, 'mag', w.melee ? '—' : p.ammo[name] === Infinity ? '∞' : String(Math.max(0, p.ammo[name] || 0)));
    hud.mag.style.color = !w.melee && !(p.ammo[name] > 0) ? '#ff4f6d' : '';

    // Context prompt
    let prompt = '', warn = false;
    if (!p.dead) {
        const outside = Math.hypot(p.x - z.cx, p.y - z.cy) > z.r;
        const l = nearestLoot(p.x, p.y, CONFIG.PICKUP_RANGE);
        const st = G.escape && G.world.stairs.find(s => Math.abs(s.x - p.x) < 80 && Math.abs(s.y - p.y) < 80);
        let car = !p.car && !l && !p.zombie ? nearestCar(p, 90) : null;
        if (car && car.type === 'bigtower' && car.tower && !car.tower.fallen && p.up !== car.tower) car = null;  // (only from the balcony)
        const pad = G.revolution && !p.car && !p.up && G.revolution.bases[p.team] && G.revolution.bases[p.team].strike;
        const onPad = pad && nearOwnPad(p);
        let stairHint = null;
        if (G.revolution && !p.car) for (const b of G.revolution.bases) if (!b.fallen) for (const L of [b]) for (const st of L.stairs) {
            if ((p.up || null) === L.lower && Math.hypot(p.x - st.b.x, p.y - st.b.y) < 110) stairHint = 'Stand on the stairs to go up to the balcony';
            else if (p.up === L && Math.hypot(p.x - st.t.x, p.y - st.t.y) < 110) stairHint = `Stand on the stairs to go down to the ${L === b ? 'middle floor' : 'ground floor'}`;
        }
        if (strikeCamOn()) {
            prompt = 'Watching the boss strike · <kbd>Space</kbd> to look back';
        } else if (onPad) {
            prompt = pad.ammo >= REVO.strike.cost ? '<kbd>F</kbd> LAUNCH THE BOSS STRIKE' : `<kbd>F</kbd> Load ammo into the boss strike · ${Math.floor(pad.ammo)} / ${REVO.strike.cost}`;
        } else if (stairHint && !p.car) {
            prompt = stairHint;
        } else if (p.car) {
            const T = vt(p.car);
            prompt = T.fixed ? `${T.name}: Click to fire · <kbd>F</kbd> Get out`
                : `${T.name}: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ${T.fly ? 'Fly' : 'Drive'} · ${T.gun || T.cannon || T.rockets ? 'Right-click a spot to go there · Click to fire' : 'Click a spot to go there'} · <kbd>F</kbd> ${T.animal ? 'Get off' : 'Get out'} · ${Math.round(Math.abs(p.car.speed) / 6)} km/h`;
        } else if (car) {
            prompt = `<kbd>F</kbd> ${vt(car).animal ? 'Get on the' : 'Get in the'} ${vt(car).name}`;
        } else if (st) {
            const where = st.to === 1 ? 'the street' : `floor ${st.to}`;
            prompt = p.stairLock ? 'Step off the stairs and back on to use them again' : `Stand on the stairs to go ${st.dir} to ${where} (your group comes too)`;
        } else if (p.cook) {
            const left = cookLeft(p);
            prompt = `${left < 1 ? 'THROW IT NOW!' : 'Release to throw'} ${Math.max(0, left).toFixed(1)}s`;
            warn = left < 1.2;
        } else if (l) {
            const col = RARITY[lootRarity(l.key)].color;
            const full = WEAPONS[l.key] && !p.inv.includes(l.key) && !p.inv.includes(null);
            const count = l.count > 1 ? ` x${l.count}` : '';
            prompt = `<kbd>F</kbd> ${full ? 'Swap for' : 'Pick up'} <span style="color:${col}">${lootName(l.key)}${count}</span>`;
        } else if (nearBox(p)) {
            const empty = p.inv.indexOf(null);
            if (w.melee) prompt = 'Punch the box to break it open';
            else if (empty >= 0) prompt = `<kbd>${empty + 1}</kbd> Pick an empty slot to punch the box open`;
            else prompt = 'Slots full: shoot the box open';
        } else if (outside) {
            prompt = 'You are outside the zone! Get to safety';
            warn = true;
        } else if (!w.melee && !(p.ammo[name] > 0)) {
            prompt = 'Out of ammo: find more or switch weapons';
            warn = true;
        } else if (p.hp < 50 && !p.healing && (p.items.medkit > 0 || p.items.bandage > 0)) {
            prompt = p.items.medkit > 0 && p.hp < 40 ? '<kbd>E</kbd> Use a medkit' : p.items.bandage > 0 ? '<kbd>Q</kbd> Use a bandage' : '<kbd>E</kbd> Use a medkit';
        }
    }
    setHTML(hud.prompt, 'prompt', prompt);
    hud.prompt.classList.toggle('warn', warn);

    drawMinimap();
}

function nearBox(p) {
    let found = false;
    G.world.grid.query(p.x, p.y, 60, o => {
        if (!found && o.type === 'box' && !o.broken && overlapsObstacle(p.x, p.y, p.r + 30, o)) found = true;
    });
    return found;
}

function drawMinimap() {
    // Upper floors have a zoomed-in minimap of their own (mmT = its offset and scale)
    const mt = G.world.mmT || { ox: 0, oy: 0, k: 200 / CONFIG.WORLD_SIZE };
    const g = hud.minimap, S = 200, k = mt.k, z = G.zone, p = G.player;
    g.drawImage(G.world.minimap, 0, 0);
    g.save();
    g.translate(-mt.ox * k, -mt.oy * k);
    if (!G.noZone) {
        g.beginPath();
        g.rect(0, 0, S, S);
        g.arc(z.cx * k, z.cy * k, Math.max(0.5, z.r * k), 0, TAU);
        g.fillStyle = 'rgba(150,30,90,0.45)';
        g.fill('evenodd');
        g.strokeStyle = '#ff4f6d';
        g.lineWidth = 2;
        g.beginPath(); g.arc(z.cx * k, z.cy * k, Math.max(0.5, z.r * k), 0, TAU); g.stroke();
    }
    if (z.state === 'wait' && !G.noZone) {
        g.setLineDash([4, 3]);
        g.strokeStyle = '#fff7ec';
        g.lineWidth = 1.5;
        g.beginPath(); g.arc(z.tcx * k, z.tcy * k, Math.max(0.5, z.tr * k), 0, TAU); g.stroke();
        g.setLineDash([]);
    }
    const blink = Math.sin(performance.now() / 150) > 0;
    for (const sm of G.smokes) {
        const r = smokeRadius(sm);
        if (r <= 0) continue;
        g.fillStyle = 'rgba(200,200,210,0.75)';
        g.beginPath(); g.arc(sm.x * k, sm.y * k, Math.max(2, r * k), 0, TAU); g.fill();
    }
    for (const st of G.strikes) {
        // You only see missiles your side called in
        if (!blink || foe(st.owner, p)) continue;
        g.strokeStyle = '#ff3b3b';
        g.lineWidth = 2;
        g.beginPath(); g.arc(st.x * k, st.y * k, Math.max(3, STRIKE.radius * k), 0, TAU); g.stroke();
    }
    for (const pd of G.world.ponds || []) { g.fillStyle = '#3f8fb8'; g.beginPath(); g.ellipse(pd.x * k, pd.y * k, Math.max(2, pd.rx * k), Math.max(2, pd.ry * k), pd.a, 0, TAU); g.fill(); }
    // Revolution: both bases, in their colours, the enemy's labelled
    if (G.revolution && !G.world.floor) for (const base of G.revolution.bases) {
        const r = base.rect, mine = p && base.team === p.team;
        g.fillStyle = base.fallen ? 'rgba(60,55,50,0.8)' : REVO.sides[base.team].flag;
        g.globalAlpha = base.fallen ? 1 : 0.85;
        // (drawn a bit bigger than life so they stand out, with a flag in the middle)
        const mx = ((r.x0 + r.x1) / 2) * k, my = ((r.y0 + r.y1) / 2) * k, mw = Math.max(16, (r.x1 - r.x0) * k * 1.5), mh = Math.max(16, (r.y1 - r.y0) * k * 1.5);
        g.fillRect(mx - mw / 2, my - mh / 2, mw, mh);
        g.globalAlpha = 1;
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(mx - mw / 2, my - mh / 2, mw, mh);
        if (!base.fallen) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(mx - 2, my + 5); g.lineTo(mx - 2, my - 6); g.lineTo(mx + 6, my - 3); g.lineTo(mx - 2, my); g.fill(); }
        g.font = '800 10px Rajdhani, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'bottom';
        g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 3; g.strokeText(base.fallen ? 'FALLEN' : mine ? 'YOUR BASE' : 'ENEMY BASE', mx, my - mh / 2 - 1);
        g.fillStyle = '#fff'; g.fillText(base.fallen ? 'FALLEN' : mine ? 'YOUR BASE' : 'ENEMY BASE', mx, my - mh / 2 - 1);
    }
    // Nukes counting down: everyone sees these
    for (const n of G.world.nukes || []) {
        g.fillStyle = blink ? 'rgba(255,40,40,0.45)' : 'rgba(255,40,40,0.25)';
        g.strokeStyle = '#ff3b3b';
        g.lineWidth = 2;
        g.beginPath(); g.arc(n.x * k, n.y * k, Math.max(4, NUKE.radius * k), 0, TAU); g.fill(); g.stroke();
    }
    // Airdrop markers
    for (const d of G.airdrops) {
        if (!d.landed && !blink) continue;
        const sz = d.kind === 'supply' || d.kind === 'hyper' || d.kind === 'vehicle' ? 10 : 8;
        g.fillStyle = d.kind === 'supply' ? '#ffd166' : d.kind === 'hyper' ? HYPER.teal : d.kind === 'vehicle' ? TECH_DROP.neon : '#ff5a5f';
        g.strokeStyle = d.kind === 'supply' ? '#2a2a24' : d.kind === 'hyper' ? '#05121c' : '#fff7ec';
        g.lineWidth = 1.5;
        g.fillRect(d.x * k - sz / 2, d.y * k - sz / 2, sz, sz);
        g.strokeRect(d.x * k - sz / 2, d.y * k - sz / 2, sz, sz);
    }
    // Teammates
    if (G.war) {
        g.fillStyle = TEAMS[p.team].color;
        for (const f of G.fighters) if (f.team === p.team && !f.isPlayer) g.fillRect(f.x * k - 1.5, f.y * k - 1.5, 3, 3);
    }
    // Escape: your group, the stairs, and a line to where you need to go next (HQ, stairs up, or helicopter)
    if (G.escape) {
        g.fillStyle = TEAMS[2].color;
        for (const f of G.fighters) if (!f.soldier && !f.isPlayer) g.fillRect(f.x * k - 1.5, f.y * k - 1.5, 3, 3);
        const F = G.world.floor;
        if (F) {
            g.fillStyle = '#ff5a5f';
            for (const f of G.fighters) if (f.soldier) g.fillRect(f.x * k - 1.5, f.y * k - 1.5, 3, 3);
            for (const st of G.world.stairs) {
                g.fillStyle = st.dir === 'up' ? '#7dffb0' : '#8fd8ff';
                g.fillRect(st.x * k - 5, st.y * k - 5, 10, 10);
            }
        }
        const goal = !F ? (G.extract || { x: G.hq.cx, y: G.hq.cy }) : F.heli || (F.b.hq ? G.world.stairs.find(s => s.dir === 'up') : null);
        if (!F) {
            g.fillStyle = '#ffd166'; g.strokeStyle = '#160e28'; g.lineWidth = 2;
            g.beginPath(); g.arc(goal.x * k, goal.y * k, 7, 0, TAU); g.fill(); g.stroke();
            g.fillStyle = '#160e28'; g.font = '700 7px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(G.extract ? 'GO' : 'HQ', goal.x * k, goal.y * k + 0.5);
        } else if (F.heli) {
            g.fillStyle = '#ffd166';
            g.beginPath(); g.arc(F.heli.x * k, F.heli.y * k, 9, 0, TAU); g.fill();
        }
        if (goal && !p.dead) {
            g.strokeStyle = 'rgba(255,209,102,0.8)'; g.lineWidth = 1.2;
            g.beginPath(); g.moveTo(p.x * k, p.y * k); g.lineTo(goal.x * k, goal.y * k); g.stroke();
        }
    }
    // Zombies: you can see the horde coming (or your fellow zombies)
    if (G.zombies) {
        g.fillStyle = ZOMBIE.color;
        for (const f of G.fighters) if (f.zombie && !f.isPlayer) g.fillRect(f.x * k - 1, f.y * k - 1, 2.5, 2.5);
    }
    const px = (p.dead ? G.cam.x : p.x) * k, py = (p.dead ? G.cam.y : p.y) * k;
    const goal = zoneGoal();
    if (!p.dead && Math.hypot(p.x - goal.x, p.y - goal.y) > goal.r) {
        g.strokeStyle = 'rgba(255,247,236,0.7)';
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(px, py); g.lineTo(goal.x * k, goal.y * k); g.stroke();
    }
    g.strokeStyle = 'rgba(255,247,236,0.5)';
    const vw = (viewW / G.zoom) * k, vh = (viewH / G.zoom) * k;
    g.strokeRect(px - vw / 2, py - vh / 2, vw, vh);
    g.translate(px, py);
    g.rotate(p.angle);
    g.fillStyle = '#fff7ec';
    g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -4); g.lineTo(-2, 0); g.lineTo(-4, 4); g.closePath(); g.fill();
    g.restore();
}

function addKillfeed(victim, killer, weapon) {
    const mine = victim.isPlayer || (killer && killer.isPlayer);
    // With hundreds of bots, only show a sample of kills that don't involve the player
    if (!mine && G.cpuCount > 50 && Math.random() > 50 / G.cpuCount) return;
    const name = f => (f.isPlayer ? '<span class="you">You</span>' : G.war || G.zombies ? `<span style="color:${f.color}">${f.name}</span>` : f.name);
    const el = document.createElement('div');
    el.className = 'kf' + (mine ? ' mine' : '');
    if (killer && killer !== victim) el.innerHTML = `${name(killer)}<span class="w">${weapon}</span>${name(victim)}`;
    else el.innerHTML = `${name(victim)}<span class="w">${weapon === 'zone' ? 'lost to the zone' : weapon === 'escaped' ? 'escaped the city' : weapon === 'starved' ? 'starved to death' : weapon === 'dehydrated' ? 'died of thirst' : weapon === 'murdered' || weapon === 'shot an innocent' ? weapon : 'died'}</span>`;
    hud.killfeed.appendChild(el);
    while (hud.killfeed.children.length > 5) hud.killfeed.firstChild.remove();
    setTimeout(() => { el.style.opacity = '0'; }, 5000);
    setTimeout(() => el.remove(), 5600);
}

let bannerTimer = null;
function showBanner(text, danger, sub) {
    hud.banner.innerHTML = '';
    hud.banner.append(text);
    if (sub) {
        const el = document.createElement('div');
        el.className = 'sub';
        el.textContent = sub;
        hud.banner.append(el);
    }
    hud.banner.classList.toggle('danger', !!danger);
    // Restart the pop-in animation
    hud.banner.classList.remove('show');
    void hud.banner.offsetWidth;
    hud.banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => hud.banner.classList.remove('show'), 2400);
}

// ---------- Screens ----------
const screens = { menu: $('menu'), pause: $('pause'), over: $('gameover'), mapsel: $('mapsel'), typesel: $('typesel'), spectate: $('spectate') };
const slider = $('cpu-slider');
// AI level, remembered between visits
let aiLevel = 5;
try { aiLevel = clamp(parseInt(localStorage.getItem('ba_ailevel'), 10) || 5, 1, 10); } catch (e) {}
const AI_NAMES = ['', 'Beginner', 'Very easy', 'Easy', 'Casual', 'Normal', 'Tough', 'Hard', 'Veteran', 'Elite', 'Insane'];
function showAiLevel() { $('ai-slider').value = aiLevel; $('ai-value').textContent = aiLevel + ' · ' + AI_NAMES[aiLevel]; }
$('ai-slider').addEventListener('input', () => {
    aiLevel = +$('ai-slider').value;
    try { localStorage.setItem('ba_ailevel', String(aiLevel)); } catch (e) {}
    showAiLevel();
});
showAiLevel();
const teamSlider = $('team-slider');

// ---------- Game modes (title screen carousel) ----------
let assassinRole = 'survivor';
const MODES = [
    { id: 'zombies', name: 'ZOMBIES', desc: 'Pitch dark: all you have is your flashlight, and the zombies\' glowing eyes. Pick how many survivors and zombies. Anyone the horde takes down turns into a zombie. Zombies that die stay dead.' },
    { id: 'war', name: 'TEAMS', desc: 'Teams battle it out. Arm your squad from big supply crates and wipe out the other teams.' },
    { id: 'ffa', name: 'FREE FOR ALL', desc: 'Every player for themselves. Last one standing wins.' },
    { id: 'survival', name: 'SURVIVAL', desc: 'Hunt deer, rabbits and boars to stay fed, and hunt everyone else too. Day turns to night, and wolves come out in the dark. Last one alive wins.' },
    { id: 'revolution', name: 'REVOLUTION', desc: 'Rebels against the Regime: fortified bases with healing rooms and an armory, chests everywhere, tanks and cannons. Everyone is tougher, and there are no respawns or revives: when you die, you stay dead.' },
    { id: 'assassin', name: 'ASSASSIN', desc: 'Pitch dark. One assassin with a Barrett hides among the survivors and picks them off. Survivors win if they catch him (touch him or take him down); he wins if nobody is left. Play as either side.' },
    { id: 'boss', name: 'BOSS FIGHT', desc: 'Everyone teams up against one giant boss with a minigun, rockets and a huge stomp. At half health he calls in soldiers to help him.' },
    { id: 'escape', name: 'ESCAPE', desc: 'Lead your group past the soldiers through the city, a deadly maze or over the mountains, and get everyone to the helicopter.' },
    { id: 'murder', name: 'MURDER MYSTERY', desc: 'One murderer with a knife, one sheriff with a gun, and everyone else innocent. Nobody knows who\'s who. Find the murderer before everyone is gone.' },
    { id: 'ghost', name: 'GHOST', desc: 'Pitch dark. One invisible ghost hunts the hunters. It only shows when it shoots, but it leaves glowing footprints. Play as a hunter or the ghost.' },
    { id: 'fort', name: 'FORT WARS', desc: 'Two teams get 2 minutes to chop trees with their axes and build a wooden fort. Then the wall in the middle drops and it\'s war: shoot their fort apart.' }
];
let murderRolePick = 'random', ghostRolePick = 'hunter';
// After the mode and its settings, you pick how the fight is armed
const WARFARE = {
    normal: { name: 'NORMAL WARFARE', desc: 'Ordinary guns to find in boxes, ordinary cars and trucks.' },
    heavy: { name: 'HEAVY WARFARE', desc: 'Heavy guns to find, supply crates of heavy weapons everywhere, and lots of tanks and gun jeeps.' },
    hightech: { name: 'HIGH TECH WARFARE', desc: 'Only quantum guns and tech vehicles, and quantum drops keep falling.' },
    early: { name: 'EARLY WARFARE', desc: 'No guns and no engines: swords, spears, bows and crossbows, and horses and wagons to ride.' }
};
let lastWarfare = 'normal';
let menuMode = 0;
let warTeams = 2;

function setMenuMode(i, dir) {
    menuMode = (i + MODES.length) % MODES.length;
    const m = MODES[menuMode];
    $('mode-name').textContent = m.name;
    $('mode-desc').textContent = m.desc;
    $('settings-ffa').classList.toggle('hidden', m.id === 'war' || m.id === 'hightech' || m.id === 'zombies' || m.id === 'revolution' || m.id === 'fort');
    $('settings-zombies').classList.toggle('hidden', m.id !== 'zombies');
    $('settings-assassin').classList.toggle('hidden', m.id !== 'assassin');
    $('settings-murder').classList.toggle('hidden', m.id !== 'murder');
    $('settings-ghost').classList.toggle('hidden', m.id !== 'ghost');
    document.querySelector('#settings-ffa .cpu-row span').textContent = m.id === 'escape' ? 'Soldiers' : m.id === 'assassin' ? 'Survivors' : m.id === 'boss' ? 'Teammates' : m.id === 'murder' ? `Other players (up to ${MURDER.maxPlayers - 1})` : m.id === 'ghost' ? `Other players (up to ${GHOST.maxPlayers - 1})` : 'Opponents';
    $('settings-war').classList.toggle('hidden', m.id !== 'war' && m.id !== 'hightech' && m.id !== 'revolution' && m.id !== 'fort');
    // Revolution and Fort Wars are always two sides
    $('team-count').closest('.cpu-row').classList.toggle('hidden', m.id === 'revolution' || m.id === 'fort');
    if (typeof updateTeamLabel === 'function' && teamSlider) updateTeamLabel();
    try { showCpuValue(); } catch (e) {}  // (not set up yet on the very first call)
    $('mode-dots').innerHTML = MODES.map((_, k) => `<span class="${k === menuMode ? 'on' : ''}"></span>`).join('');
    const card = document.querySelector('.mode-card');
    card.classList.remove('slide-left', 'slide-right');
    if (dir) { void card.offsetWidth; card.classList.add(dir > 0 ? 'slide-left' : 'slide-right'); }
    // The battle behind the menu switches to show what this mode looks like
    if (dir) newDemo();
}

// Players per team: left half of the slider covers 1–50, right half 50 up to the max for this many teams
function teamSize() {
    const teams = MODES[menuMode] && (MODES[menuMode].id === 'revolution' || MODES[menuMode].id === 'fort') ? 2 : warTeams, t = +teamSlider.value / 1000, max = Math.floor(MAX_PLAYERS / teams);
    return t < 0.5 ? Math.max(1, Math.round(1 + (t / 0.5) * 49)) : Math.min(max, Math.round(50 + ((t - 0.5) / 0.5) * (max - 50)));
}
function updateTeamLabel() {
    $('team-value').textContent = teamSize();
    $('team-max').textContent = Math.floor(MAX_PLAYERS / (MODES[menuMode] && (MODES[menuMode].id === 'revolution' || MODES[menuMode].id === 'fort') ? 2 : warTeams));
}

$('mode-prev').addEventListener('click', () => setMenuMode(menuMode - 1, -1));
$('mode-next').addEventListener('click', () => setMenuMode(menuMode + 1, 1));
teamSlider.addEventListener('input', updateTeamLabel);
for (const btn of document.querySelectorAll('#team-count button')) {
    btn.addEventListener('click', () => {
        warTeams = +btn.dataset.n;
        for (const b of document.querySelectorAll('#team-count button')) b.classList.toggle('on', b === btn);
        updateTeamLabel();
    });
}

// Little animated "photo" of each mode, drawn with the game's own sprites
function drawModePreview(now) {
    const c = $('mode-preview'), g = c.getContext('2d');
    const Wd = c.width, Ht = c.height;
    const id = MODES[menuMode].id, war = id === 'war' || id === 'revolution', epic = id === 'epic';
    let seed = war ? 7 : epic ? 11 : 3;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    if (id === 'zombies') { drawZombiePreview(g, Wd, Ht, now); return; }
    if (id === 'escape') { drawEscapePreview(g, Wd, Ht, now); return; }
    g.save();
    g.fillStyle = SPR.grass;
    g.fillRect(0, 0, Wd, Ht);
    // Road and a small house
    g.strokeStyle = '#b0956a';
    g.lineWidth = 46;
    g.beginPath(); g.moveTo(-20, Ht * 0.78); g.quadraticCurveTo(Wd * 0.5, Ht * 0.6, Wd + 20, Ht * 0.86); g.stroke();
    g.fillStyle = 'rgba(20,10,20,0.3)'; g.fillRect(Wd * 0.4 + 6, 20 + 8, 120, 80);
    g.fillStyle = '#c0583f'; g.fillRect(Wd * 0.4, 20, 120, 80);
    g.fillStyle = '#8e3b2a'; g.fillRect(Wd * 0.4, 58, 120, 4);
    for (let i = 0; i < 4; i++) {
        const x = rnd() * Wd, y = rnd() * Ht;
        g.drawImage(SPR.rocks[i % SPR.rocks.length], x - 22, y - 22, 44, 44);
    }
    const fighters = [];
    if (war) {
        for (let t = 0; t < 2; t++) {
            for (let i = 0; i < 7; i++) {
                fighters.push({ x: (t ? Wd * 0.8 : Wd * 0.2) + (rnd() - 0.5) * 110, y: Ht * 0.1 + rnd() * Ht * 0.5, color: TEAMS[t].color, team: t, ph: rnd() * TAU });
            }
        }
        // Supply crate between the lines
        g.save(); g.translate(Wd * 0.5, Ht * 0.4); g.scale(0.75, 0.75); drawSupplyCrate(46, g); g.restore();
    } else {
        if (epic) for (const [x, y] of [[0.2, 0.35], [0.78, 0.5]]) { g.save(); g.translate(Wd * x, Ht * y); g.scale(0.6, 0.6); drawSupplyCrate(46, g); g.restore(); }
        for (let i = 0; i < (epic ? 15 : 11); i++) fighters.push({ x: 30 + rnd() * (Wd - 60), y: 24 + rnd() * Ht * 0.56, color: BOT_COLORS[i % BOT_COLORS.length], team: i, ph: rnd() * TAU });
    }
    // Everyone aims at the nearest enemy; tracers fly between them
    for (const f of fighters) {
        let best = null, bd = Infinity;
        for (const o of fighters) if (o.team !== f.team) { const d = Math.hypot(o.x - f.x, o.y - f.y); if (d < bd) { bd = d; best = o; } }
        f.aim = best ? Math.atan2(best.y - f.y, best.x - f.x) : 0;
        f.tx = best.x; f.ty = best.y;
    }
    g.lineCap = 'round';
    for (const f of fighters) {
        const t = (now * 1.6 + f.ph) % 1;
        const x = lerp(f.x, f.tx, t), y = lerp(f.y, f.ty, t);
        g.strokeStyle = 'rgba(255,220,140,0.9)';
        g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(x - Math.cos(f.aim) * 16, y - Math.sin(f.aim) * 16); g.lineTo(x, y); g.stroke();
    }
    for (const f of fighters) {
        g.save();
        g.translate(f.x, f.y);
        g.rotate(f.aim);
        g.fillStyle = '#1f1b2b'; g.fillRect(6, -3.5, 22, 7);
        g.rotate(-f.aim);
        g.fillStyle = shade(f.color, -0.45); g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill();
        g.fillStyle = f.color; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.arc(-3, -3, 5, 0, TAU); g.fill();
        g.restore();
    }
    // A blast going off now and then
    for (const [ox, oy, sp] of epic ? [[0.62, 0.55, 0.5], [0.3, 0.2, 0.7], [0.85, 0.25, 0.9]] : [[war ? 0.5 : 0.62, war ? 0.32 : 0.55, 0.5]]) {
    const bt = (now * sp) % 1;
    if (bt < 0.3) {
        const k = bt / 0.3, bx = Wd * ox, by = Ht * oy;
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = `rgba(255,170,70,${0.8 * (1 - k)})`;
        g.beginPath(); g.arc(bx, by, 10 + k * 40, 0, TAU); g.fill();
        g.globalCompositeOperation = 'source-over';
    }
    }
    // Trees on top
    const trees = war ? [[0.02, 0.1], [0.36, 0.05], [0.64, 0.12], [0.98, 0.3], [0.08, 0.95]] : [[0.02, 0.15], [0.97, 0.08], [0.5, 0.02], [0.9, 0.95], [0.3, 0.95]];
    trees.forEach(([tx, ty], i) => {
        const sz = 80 + rnd() * 30;
        g.globalAlpha = 0.95;
        g.drawImage(SPR.canopies[i % SPR.canopies.length], tx * Wd - sz / 2, ty * Ht - sz / 2, sz, sz);
    });
    g.restore();
    if (id === 'survival') drawSurvivalPreview(g, Wd, Ht, now);
    if (id === 'hightech') drawHighTechPreview(g, Wd, Ht, now);
}

// High Tech card: a neon wash, laser bolts flying and a hover tank
function drawHighTechPreview(g, Wd, Ht, now) {
    g.save();
    g.fillStyle = 'rgba(20,10,60,0.35)'; g.fillRect(0, 0, Wd, Ht);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
        const t = (now * 0.7 + i / 7) % 1, y = Ht * (0.2 + (i % 4) * 0.18), x = t * Wd;
        g.strokeStyle = i % 2 ? 'rgba(0,229,255,0.9)' : 'rgba(255,61,242,0.9)'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - 40, y + 4); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.translate(Wd * 0.5, Ht * 0.55); g.rotate(-0.3);
    g.fillStyle = 'rgba(0,229,255,0.3)'; g.beginPath(); g.ellipse(0, 0, 58, 38, 0, 0, TAU); g.fill();
    g.fillStyle = '#10141c'; roundRect(g, -50, -30, 100, 60, 14); g.fill();
    g.fillStyle = '#ff3df2'; g.fillRect(-44, -27, 88, 3); g.fillRect(-44, 24, 88, 3);
    g.fillStyle = '#3d4a28'; g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill(); g.fillRect(0, -5, 62, 10);
    g.restore();
}

// Survival card: deer grazing and a boar wandering, with a dusky tint for the coming night
function drawSurvivalPreview(g, Wd, Ht, now) {
    const herd = [[0.2, 0.35, 'deer'], [0.27, 0.42, 'deer'], [0.75, 0.62, 'boar'], [0.55, 0.3, 'rabbit'], [0.6, 0.36, 'rabbit']];
    g.save();
    for (const [x, y, kind] of herd) {
        const A = ANIMALS[kind], r = A.r * 1.4, a = Math.sin(now * 0.5 + x * 10) * 0.6;
        g.save(); g.translate(x * Wd, y * Ht); g.rotate(a);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(3, 5, r * 1.3, r * 0.75, 0, 0, TAU); g.fill();
        g.fillStyle = A.color; g.beginPath(); g.ellipse(0, 0, r * 1.25, r * 0.7, 0, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(r * 1.3, 0, r * 0.65, r * 0.5, 0, 0, TAU); g.fill();
        if (kind === 'boar') { g.fillStyle = '#f4efe4'; g.fillRect(r * 1.6, -r * 0.4, r * 0.5, 2); g.fillRect(r * 1.6, r * 0.35, r * 0.5, 2); }
        g.restore();
    }
    g.fillStyle = 'rgba(255,120,40,0.12)'; g.fillRect(0, 0, Wd, Ht);
    g.restore();
}

// A little top-down person for the previews
function previewFighter(g, x, y, color, aim, opts = {}) {
    g.save();
    g.translate(x, y);
    g.rotate(aim);
    if (opts.zombie) {
        g.fillStyle = shade(color, -0.5);
        g.beginPath(); g.arc(14, -6, 5, 0, TAU); g.arc(13, 7, 5, 0, TAU); g.fill();
    } else { g.fillStyle = '#1f1b2b'; g.fillRect(6, -3.5, 22, 7); }
    g.rotate(-aim);
    g.fillStyle = shade(color, -0.45); g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill();
    g.fillStyle = color; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.arc(-3, -3, 5, 0, TAU); g.fill();
    if (opts.zombie) { g.fillStyle = 'rgba(60,80,20,0.75)'; g.beginPath(); g.arc(4, 3, 3.5, 0, TAU); g.arc(-4, 5, 2.2, 0, TAU); g.fill(); }
    if (opts.red) { g.strokeStyle = `rgba(255,60,60,${opts.red})`; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.stroke(); }
    if (opts.zombie) {
        g.rotate(aim);
        g.fillStyle = '#ff3b2f';
        g.beginPath(); g.arc(6, -3, 1.8, 0, TAU); g.arc(6, 3, 1.8, 0, TAU); g.fill();
    }
    g.restore();
}

// Zombies preview: a green horde shambling in from the right toward a knot of blue survivors
function drawZombiePreview(g, Wd, Ht, now) {
    let seed = 19;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.save();
    g.fillStyle = SPR.grass;
    g.fillRect(0, 0, Wd, Ht);
    g.fillStyle = 'rgba(20,10,20,0.3)'; g.fillRect(40 + 6, 30 + 8, 130, 90);
    g.fillStyle = '#7a68a8'; g.fillRect(40, 30, 130, 90);
    g.fillStyle = '#4d4170'; g.fillRect(40, 73, 130, 4);
    const surv = [], zombies = [];
    for (let i = 0; i < 6; i++) surv.push({ x: 110 + rnd() * 110, y: 140 + rnd() * 70 });
    const drift = (now * 18) % 60;
    for (let i = 0; i < 16; i++) zombies.push({ x: Wd * 0.55 + rnd() * Wd * 0.42 - drift, y: 20 + rnd() * Ht * 0.62, ph: rnd() * TAU });
    g.lineCap = 'round';
    for (const f of surv) {
        let best = zombies[0], bd = Infinity;
        for (const z of zombies) { const d = Math.hypot(z.x - f.x, z.y - f.y); if (d < bd) { bd = d; best = z; } }
        f.aim = Math.atan2(best.y - f.y, best.x - f.x);
        const t = (now * 1.8 + f.x * 0.01) % 1;
        const x = lerp(f.x, best.x, t), y = lerp(f.y, best.y, t);
        g.strokeStyle = 'rgba(255,220,140,0.9)'; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(x - Math.cos(f.aim) * 16, y - Math.sin(f.aim) * 16); g.lineTo(x, y); g.stroke();
    }
    for (const z of zombies) previewFighter(g, z.x + Math.sin(now * 3 + z.ph) * 3, z.y, ZOMBIE.color, Math.PI + Math.sin(now * 2 + z.ph) * 0.3, { zombie: true });
    for (const f of surv) previewFighter(g, f.x, f.y, SURVIVOR_COLOR, f.aim);
    [[0.02, 0.9], [0.97, 0.05], [0.5, 0.97]].forEach(([tx, ty], i) => g.drawImage(SPR.canopies[i], tx * Wd - 45, ty * Ht - 45, 90, 90));
    g.restore();
}

// Escape preview: city streets, people running for a helipad, soldiers closing in
function drawEscapePreview(g, Wd, Ht, now) {
    let seed = 23;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.save();
    g.fillStyle = '#a19c93';
    g.fillRect(0, 0, Wd, Ht);
    g.fillStyle = '#77726a'; g.fillRect(0, Ht * 0.42 - 8, Wd, 76); g.fillRect(Wd * 0.62 - 8, 0, 76, Ht);
    g.fillStyle = '#3f3f46'; g.fillRect(0, Ht * 0.42, Wd, 60); g.fillRect(Wd * 0.62, 0, 60, Ht);
    g.fillStyle = 'rgba(240,200,80,0.75)';
    for (let x = 10; x < Wd; x += 50) if (Math.abs(x - Wd * 0.62 - 30) > 50) g.fillRect(x, Ht * 0.42 + 28, 26, 4);
    for (const [x, y, w, h, c] of [[20, 14, 150, 90, '#7d7f86'], [200, 20, 120, 80, '#8a857c'], [Wd * 0.62 + 80, 16, 120, 70, '#6b6f78'], [30, Ht * 0.42 + 80, 140, 80, '#958d80'], [Wd * 0.62 + 90, Ht * 0.42 + 84, 110, 80, '#5f646d']]) {
        g.fillStyle = 'rgba(10,5,20,0.35)'; g.fillRect(x + 8, y + 10, w, h);
        g.fillStyle = shade(c, -0.3); g.fillRect(x, y, w, h);
        g.fillStyle = c; g.fillRect(x + 6, y + 6, w - 12, h - 12);
        g.fillStyle = '#c9ccd2'; g.fillRect(x + w * 0.6, y + h * 0.3, 18, 18);
    }
    for (const [x, y, c] of [[90, Ht * 0.42 + 10, '#c0392b'], [Wd * 0.62 + 10, 200, '#2e86de']]) { g.fillStyle = c; roundRect(g, x, y, 76, 36, 8); g.fill(); }
    // Helipad on the right
    const hx = Wd * 0.88, hy = Ht * 0.5;
    g.fillStyle = '#2f3a33'; g.beginPath(); g.arc(hx, hy, 44, 0, TAU); g.fill();
    g.strokeStyle = `rgba(125,255,176,${0.6 + Math.sin(now * 4) * 0.3})`; g.lineWidth = 4; g.beginPath(); g.arc(hx, hy, 40, 0, TAU); g.stroke();
    g.fillStyle = '#e8f5ec'; g.font = '700 34px "Black Ops One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', hx, hy + 2);
    const run = (now * 30) % 80;
    const people = [], soldiers = [];
    for (let i = 0; i < 7; i++) people.push({ x: Wd * 0.3 + rnd() * Wd * 0.3 + run, y: Ht * 0.42 + rnd() * 50, color: BOT_COLORS[i % BOT_COLORS.length] });
    for (let i = 0; i < 9; i++) soldiers.push({ x: 20 + rnd() * Wd * 0.22, y: 20 + rnd() * (Ht - 40) });
    for (const sd of [[Wd * 0.75, Ht * 0.12], [Wd * 0.72, Ht * 0.86]]) soldiers.push({ x: sd[0], y: sd[1] });
    g.lineCap = 'round';
    for (const s of soldiers) {
        let best = people[0], bd = Infinity;
        for (const f of people) { const d = Math.hypot(f.x - s.x, f.y - s.y); if (d < bd) { bd = d; best = f; } }
        s.aim = Math.atan2(best.y - s.y, best.x - s.x);
        const t = (now * 1.7 + s.x * 0.013) % 1;
        const x = lerp(s.x, best.x, t), y = lerp(s.y, best.y, t);
        g.strokeStyle = 'rgba(255,220,140,0.9)'; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(x - Math.cos(s.aim) * 16, y - Math.sin(s.aim) * 16); g.lineTo(x, y); g.stroke();
    }
    for (const f of people) previewFighter(g, f.x, f.y, f.color, Math.atan2(hy - f.y, hx - f.x));
    for (const s of soldiers) {
        previewFighter(g, s.x, s.y, ESCAPE.soldier, s.aim);
        g.fillStyle = '#3d4526'; g.beginPath(); g.arc(s.x - 0.5, s.y - 1, 6.5, 0, TAU); g.fill();
    }
    g.restore();
}

// Left half of the slider covers 1–100, right half 100–1000
// Left half of the slider covers 1–100, right half 100 up to the max
// Nobody can start a game with more than 800 players in it, in any mode
const MAX_PLAYERS = 800, MAX_BOTS = MAX_PLAYERS - 1;
function sliderToCount(v) {
    const t = v / 1000;
    return t < 0.5 ? Math.max(1, Math.round(1 + (t / 0.5) * 99)) : Math.min(MAX_BOTS, Math.round(100 + ((t - 0.5) / 0.5) * (MAX_BOTS - 100)));
}

// (Murder Mystery and Ghost only take so many players)
const cpuCap = () => { const id = MODES[menuMode] && MODES[menuMode].id; return id === 'murder' ? MURDER.maxPlayers - 1 : id === 'ghost' ? GHOST.maxPlayers - 1 : Infinity; };
const showCpuValue = () => { $('cpu-value').textContent = Math.min(cpuCap(), sliderToCount(+slider.value)); };
slider.addEventListener('input', showCpuValue);
showCpuValue();

// Zombies: survivors (including you) 2–1000, starting zombies 30–500 (left half of each slider is the small numbers)
const survivorCount = () => clamp(sliderToCount(+$('surv-slider').value), 2, MAX_PLAYERS - ZOMBIE.min);
const zombFromSlider = v => { const t = v / 1000; return t < 0.5 ? Math.round(ZOMBIE.min + (t / 0.5) * (100 - ZOMBIE.min)) : Math.round(100 + ((t - 0.5) / 0.5) * 700); };
function zombieCount() { return Math.min(zombFromSlider(+$('zomb-slider').value), MAX_PLAYERS - survivorCount()); }
// Survivors and zombies share the 800-player limit: whichever slider you move wins, and the other slides down to make room
function fitSliders(moved) {
    const surv = $('surv-slider'), zomb = $('zomb-slider');
    if (moved === 'zomb') while (+surv.value > 0 && survivorCount() + zombFromSlider(+zomb.value) > MAX_PLAYERS) surv.value = +surv.value - 1;
    else while (+zomb.value > 0 && survivorCount() + zombFromSlider(+zomb.value) > MAX_PLAYERS) zomb.value = +zomb.value - 1;
    $('surv-value').textContent = survivorCount(); $('zomb-value').textContent = zombieCount();
}
$('surv-slider').addEventListener('input', () => fitSliders('surv'));
$('zomb-slider').addEventListener('input', () => fitSliders('zomb'));
$('start-btn').addEventListener('click', openDescription);
// The title screen has two steps: first the game mode, then the opponents and the rest of the settings
function menuStep(step) {
    const c = $('menu-card');
    c.classList.toggle('step-mode', step === 'mode');
    c.classList.toggle('step-setup', step === 'setup');
    if (step === 'setup') $('setup-mode').textContent = MODES[menuMode].name;
    if (typeof fitMenus === 'function') fitMenus();
}
$('mode-go').addEventListener('click', () => menuStep('setup'));
$('setup-back').addEventListener('click', () => menuStep('mode'));
$('typesel-back').addEventListener('click', () => { screens.typesel.classList.add('hidden'); screens.menu.classList.remove('hidden'); });
for (const card of document.querySelectorAll('.type-card')) card.addEventListener('click', () => { lastWarfare = card.dataset.type; screens.typesel.classList.add('hidden'); openMapSelect(); });
function openTypeSelect() {
    for (const card of document.querySelectorAll('.type-card')) drawWarfarePreview(card.querySelector('canvas'), card.dataset.type);
    screens.menu.classList.add('hidden');
    screens.typesel.classList.remove('hidden');
}
// Little pictures of each warfare type: the guns (and a vehicle) you'll be fighting with
function drawWarfarePreview(cv, type) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    const bg = type === 'hightech' ? ['#0a0620', '#1a0d40'] : type === 'heavy' ? ['#2a2a1e', '#3d3a26'] : type === 'early' ? ['#4a3620', '#6b4f2c'] : ['#23402a', '#2f5a36'];
    const grad = g.createLinearGradient(0, 0, W, H); grad.addColorStop(0, bg[0]); grad.addColorStop(1, bg[1]);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    if (type === 'hightech') { g.strokeStyle = 'rgba(0,229,255,0.15)'; g.lineWidth = 1; for (let x = 0; x < W; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }
    const guns = type === 'hightech' ? ['Plasma Rifle', 'Laser Beam', 'Railgun'] : type === 'heavy' ? ['Minigun', 'Rocket Launcher', 'Heavy MG'] : type === 'early' ? ['Sword', 'Spear', 'Bow'] : ['Pistol', 'Shotgun', 'Mac10'];
    guns.forEach((k, i) => { const img = SPR.loot[k]; if (img) g.drawImage(img, 20 + i * 92, 18, 84, 84); });
    g.save(); g.translate(W / 2, 140);
    const veh = { hightech: 'hovertank', heavy: 'tank', normal: 'car', early: 'wagon' }[type];
    const T = VTYPES[veh], prev = ctx;
    ctx = g;  // borrow the in-game vehicle drawing for the card
    try { drawVehicleBody({ type: veh, color: type === 'normal' ? '#d63031' : type === 'heavy' ? '#4f5d33' : type === 'early' ? '#efe6d0' : '#1b1f2a', a: 0, turret: 0 }); } finally { ctx = prev; }
    g.restore();
}
$('again-btn').addEventListener('click', () => startGame(lastMap));
$('mapsel-back').addEventListener('click', () => { const id = MODES[menuMode].id; screens.mapsel.classList.add('hidden'); (id === 'murder' || id === 'ghost' ? screens.menu : screens.typesel).classList.remove('hidden'); });
for (const card of document.querySelectorAll('#mapsel .map-card')) {
    drawMapPreview(card.querySelector('canvas'), card.dataset.map);
    card.addEventListener('click', () => openBriefing(card.dataset.map));
}

// ---------- Briefing: what this game is about, in a few lines, before it starts ----------
const BRIEF = {
    ffa: [['🎯', '<b>Goal:</b> be the last one alive.'], ['📦', 'Everyone starts with nothing: grab guns, armor and medkits from boxes and the ground.'], ['🔴', 'The red zone shrinks over time. Stay inside the circle or you take damage.'], ['🚗', 'Hop in cars, tanks and helicopters.']],
    war: [['🎯', '<b>Goal:</b> wipe out every other team.'], ['📦', 'Your team starts at its base. Grab guns from the supply crates nearby.'], ['🩹', 'When you go down, a teammate can revive you before you bleed out.'], ['🔴', 'The zone shrinks, so the fight keeps moving.']],
    zombies: [['🎯', '<b>Goal:</b> survive. Survivors win when every zombie is dead; the horde wins when everyone is turned.'], ['🌑', 'It is pitch dark. Only your flashlight lights the way, and zombies show glowing green eyes.'], ['🧟', 'If a zombie gets you, you turn into one, and then you hunt the survivors.'], ['💉', 'Cures can turn zombies back into survivors.']],
    survival: [['🎯', '<b>Goal:</b> be the last one alive.'], ['🍖', 'Hunt deer, rabbits and boars for meat, and drink at ponds.'], ['😴', 'Rest when you are tired.'], ['🐺', 'Day turns to night, and wolf packs come out in the dark.']],
    revolution: [['🎯', '<b>Goal:</b> wipe out the other side or bring down their castle.'], ['🏰', 'Each side has a castle with healing rooms, an armory, guard towers and cannons on the walls.'], ['💥', 'Load ammo into your boss strike pad and launch it at the enemy castle.'], ['☠️', 'No revives: when you die, you stay dead.']],
    assassin: [['🎯', '<b>Survivors:</b> find the assassin and touch him (or take him down) to win.'], ['🔫', '<b>Assassin:</b> a Barrett with 2000 rounds and a medkit (a Railgun in High Tech). Take everyone out without getting caught.'], ['🌑', 'Pitch dark. Everyone has a flashlight.'], ['🔭', 'Sniper rifles have an 8x night-vision scope.'], ['🚶', 'Survivors spread out: they can\'t stay together.']],
    boss: [['🎯', '<b>Goal:</b> your whole team against one giant boss. Bring him down.'], ['🔫', 'He sprays a minigun, then fires rockets, and never runs out of ammo.'], ['💥', 'Get too close and he stomps: it hurts and throws you back.'], ['🪖', 'At half health he calls in soldiers and gets angry and faster. At a quarter, more come.'], ['📦', 'Everyone starts armed. Ammo and medkits are lying around the arena.']],
    escape: [['🎯', '<b>Goal:</b> get your group to the helicopter.'], ['🪖', 'Soldiers guard the way. Fight through them or sneak past.'], ['👥', 'Your group follows you. The more of them make it, the better.'], ['🗺️', 'City: climb the HQ tower. Maze: your map only shows where you\'ve been. Mountains: climb to the summit.']]
};
BRIEF.murder = [['🔪', '<b>Murderer:</b> a knife that kills in one stab. Take everyone out, but anyone who sees the knife out knows it\'s you.'], ['🔫', '<b>Sheriff:</b> a gun that kills in one shot. Shoot the murderer. Shoot an innocent and you die too.'], ['🙂', '<b>Innocent:</b> stay alive for 3 minutes. If the sheriff goes down, grab the gun: you become the sheriff.'], ['❓', 'Nobody knows who\'s who. Pick your role, or let it be random.']];
BRIEF.ghost = [['👻', '<b>Ghost:</b> invisible, fast and tough, with a shotgun that never runs out. It only shows for a moment when it shoots or gets hit.'], ['👣', 'It leaves glowing footprints wherever it walks. Follow them.'], ['🔦', 'Pitch dark. Every hunter has a flashlight and a gun.'], ['🎯', 'Hunters win if the ghost goes down; the ghost wins if no hunter is left.']];
BRIEF.fort = [['🧱', '<b>2 minutes to build:</b> aim and shoot to put down sandbag walls (60 of them). Your team\'s bots build too.'], ['🚧', 'A glowing wall splits the map while you build. Nobody can fight yet.'], ['💥', 'Then the wall drops: it\'s war. Bullets and explosions knock the forts apart.'], ['🎯', 'Wipe out the other team to win.']];
const BRIEF_WAR = { normal: 'Normal guns', heavy: 'Heavy guns', early: 'Swords & bows', hightech: 'High tech' };
const BRIEF_MAP = { ordinary: 'Ordinary', city: 'City', rusty: 'Rusty', maze: 'Maze', mountain: 'Mountains', wasteland: 'Wasteland', cavern: 'Cavern', haunted: 'Haunted House' };
// Pressing Play: first what this mode is about. After the warfare type and the map are picked: the controls, then go.
const CONTROLS_KEYS = [['⌨️', '<b>W A S D</b> move · <b>mouse</b> aim · <b>click</b> shoot'], ['🎒', 'Walk over items to pick them up · <b>F</b> swap a gun, get in or out of a vehicle'], ['🔢', '<b>1–5</b> or <b>scroll</b> switch guns'], ['🩹', '<b>Q</b> bandage · <b>E</b> medkit'], ['💣', 'Click a grenade (or <b>T</b>) to hold it, hold the mouse to pull the pin, let go to throw'], ['⏸️', '<b>Esc</b> pause · <b>M</b> mute']];
const CONTROLS_TOUCH = [['🕹️', '<b>Left stick</b> move · <b>right stick</b> aim, push it past the middle to shoot'], ['🎒', 'Walk over items to pick them up · the <b>button at the bottom</b> swaps a gun or gets in a vehicle'], ['🔢', 'Tap a slot at the top to switch guns'], ['🩹', 'Tap the bandage or medkit on the left to heal'], ['💣', 'Tap a grenade on the right to hold it, pull the right stick back to pull the pin, let go to throw'], ['⏸️', '<b>II</b> pause · <b>⛶</b> full screen']];
function controlsFor(id) {
    const t = TOUCH.enabled, list = (t ? CONTROLS_TOUCH : CONTROLS_KEYS).slice();
    if (id === 'survival') list.push(['🍖', t ? 'Tap the meat or water on the left to eat or drink' : '<b>C</b> eat · <b>V</b> drink or fill a bucket at water · <b>B</b> rest']);
    if (id === 'revolution') list.push(['💥', t ? 'At your boss strike pad, the bottom button loads ammo or launches it' : 'At your boss strike pad, <b>F</b> loads ammo or launches it']);
    list.push(['🔭', t ? 'Sniper rifles: tap the <b>8x</b> button for the scope' : 'Sniper rifles: hold <b>right click</b> (or <b>Z</b>) for the 8x scope']);
    list.push(['☢️', 'Doomsday Nuke: press <b>USE NUKE</b> and pick the target on the map']);
    return list;
}
const BRIEF_STAGE = { stage: null, map: null };
function showBrief(title, tags, lines, back, go) {
    $('brief-title').textContent = title;
    $('brief-tags').innerHTML = tags.filter(Boolean).map(t => `<span>${t}</span>`).join('');
    $('brief-list').innerHTML = lines.map(([i, t]) => `<li data-i="${i}">${t}</li>`).join('');
    $('brief-back').textContent = back; $('brief-go').textContent = go;
    $('brief').classList.remove('hidden');
}
function openDescription() {
    const m = MODES[menuMode];
    BRIEF_STAGE.stage = 'desc';
    screens.menu.classList.add('hidden');
    showBrief(m.name, [m.id === 'assassin' ? (assassinRole === 'assassin' ? 'You: Assassin' : 'You: Survivor') : m.id === 'murder' ? `You: ${murderRolePick === 'random' ? 'Random' : murderRolePick[0].toUpperCase() + murderRolePick.slice(1)}` : m.id === 'ghost' ? `You: ${ghostRolePick === 'ghost' ? 'Ghost' : 'Hunter'}` : ''], BRIEF[m.id] || BRIEF.ffa, 'BACK', 'NEXT');
}
function openBriefing(map) {
    const m = MODES[menuMode];
    BRIEF_STAGE.stage = 'controls'; BRIEF_STAGE.map = map;
    screens.mapsel.classList.add('hidden');
    showBrief('CONTROLS', [m.name, BRIEF_WAR[lastWarfare] || '', BRIEF_MAP[map] || map], controlsFor(m.id), 'BACK', 'START');
}
$('brief-go').addEventListener('click', () => {
    $('brief').classList.add('hidden');
    if (BRIEF_STAGE.stage === 'desc') { const id = MODES[menuMode].id; if (id === 'murder' || id === 'ghost') openMapSelect(); else openTypeSelect(); }
    else startGame(BRIEF_STAGE.map);
});
$('brief-back').addEventListener('click', () => {
    $('brief').classList.add('hidden');
    (BRIEF_STAGE.stage === 'desc' ? screens.menu : screens.mapsel).classList.remove('hidden');
});

// Pressing Play first asks where to fight (Escape needs streets and towers, so no open countryside there)
let lastMap = 'ordinary';
function openMapSelect() {
    const id = MODES[menuMode].id, escape = id === 'escape';
    for (const card of document.querySelectorAll('#mapsel .map-card')) {
        const m = card.dataset.map;
        card.classList.toggle('hidden', (escape && m === 'ordinary') || ((id === 'survival' || id === 'revolution' || id === 'fort') && m === 'maze') || (m === 'wasteland' && id !== 'assassin') || ((m === 'cavern') !== (id === 'boss')) || ((m === 'haunted') !== (id === 'ghost')));
        card.disabled = false;
        card.querySelector('.map-desc').textContent = (escape && ESCAPE_MAP_DESC[m]) || MAP_DESC[m];
    }
    screens.menu.classList.add('hidden');
    screens.mapsel.classList.remove('hidden');
}
const MAP_DESC = {
    ordinary: 'Open fields, forests, rocky hills and little towns.',
    city: 'Streets, parked cars, hotels, hospitals and houses.',
    rusty: 'An abandoned facility in a warzone: rusted sheds, wrecked cars, ruins and smoke.',
    maze: 'A huge maze of concrete corridors. Every corner could hide someone.',
    mountain: 'Green valleys, pine forests, rocky passes and snowy peaks.',
    haunted: 'A giant haunted mansion full of candlelit rooms and coffins, in a foggy cemetery of graves, crypts and dead trees behind an iron fence.',
    cavern: 'The boss\'s lair: a giant cave deep underground with rocks everywhere, glowing crystals and lava cracks.',
    wasteland: 'Made for Assassin: wide open ground, a few lone trees and broken junk everywhere, no cars. Snipe from far away.'
};
const ESCAPE_MAP_DESC = {
    city: 'Cross the city to the HQ tower and fight up 12 floors to the helicopter.',
    maze: 'The hardest escape: a huge maze of machine-gun nests and minefields, and your map only shows where you\'ve been.',
    mountain: 'Climb from a green valley through rocky passes to the helicopter on the snowy summit.'
};

// Little painted thumbnails of each battlefield
function drawMapPreview(cv, map) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, rnd = seededRand(map.length * 977);
    if (map === 'wasteland') {
        g.fillStyle = '#6f8a4a'; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,100,60,${0.15 + rnd() * 0.2})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, 6 + rnd() * 18, 0, TAU); g.fill(); }
        for (let i = 0; i < 14; i++) { g.fillStyle = '#8f897d'; g.fillRect(rnd() * W, rnd() * H, 4 + rnd() * 10, 3); }
        for (let i = 0; i < 12; i++) { g.fillStyle = '#5a5f3a'; g.beginPath(); g.arc(rnd() * W, rnd() * H, 3, 0, TAU); g.fill(); }
        for (let i = 0; i < 4; i++) { const x = rnd() * W, y = rnd() * H; g.fillStyle = '#2f5a2a'; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); g.fillStyle = '#3f7a35'; g.beginPath(); g.arc(x - 3, y - 3, 7, 0, TAU); g.fill(); }
        g.strokeStyle = 'rgba(255,60,60,0.9)'; g.lineWidth = 2; const cx = W * 0.62, cy = H * 0.45;
        g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.moveTo(cx - 22, cy); g.lineTo(cx + 22, cy); g.moveTo(cx, cy - 22); g.lineTo(cx, cy + 22); g.stroke();
        return;
    }
    if (map === 'haunted') {
        g.fillStyle = '#141a14'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#2e3828'; g.fillRect(8, 8, W - 16, H - 16);
        g.strokeStyle = '#4a4a54'; g.lineWidth = 2; g.strokeRect(8, 8, W - 16, H - 16);
        g.fillStyle = '#5f5a50'; g.fillRect(W / 2 - 7, H * 0.68, 14, H * 0.32 - 8);
        for (let y = 20; y < H - 14; y += 14) for (let x = 18; x < W - 14; x += 11) { if (x > W * 0.27 && x < W * 0.73 && y > H * 0.24 && y < H * 0.76 || Math.abs(x - W / 2) < 12 || rnd() < 0.4) continue; g.fillStyle = '#7a7780'; g.fillRect(x, y, 5, 3); }
        g.fillStyle = '#1c1418'; g.fillRect(W * 0.28, H * 0.26, W * 0.44, H * 0.48);
        g.fillStyle = '#4a3528'; g.fillRect(W * 0.29, H * 0.28, W * 0.42, H * 0.44);
        g.fillStyle = '#2e2228'; for (const fx of [0.4, 0.6]) g.fillRect(W * fx, H * 0.28, 2, H * 0.44); g.fillRect(W * 0.29, H * 0.43, W * 0.11, 2); g.fillRect(W * 0.6, H * 0.57, W * 0.11, 2);
        for (let i = 0; i < 9; i++) { const x = rnd() * W, y = rnd() * H, c = rnd() < 0.3 ? '#7dffb0' : '#ffb347'; g.shadowColor = c; g.shadowBlur = 10; g.fillStyle = c; g.beginPath(); g.arc(x, y, 2.5, 0, TAU); g.fill(); }
        g.shadowBlur = 0;
        g.fillStyle = 'rgba(200,210,220,0.12)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(rnd() * W, rnd() * H, 30 + rnd() * 30, 0, TAU); g.fill(); }
        g.fillStyle = 'rgba(220,240,255,0.55)'; g.beginPath(); g.arc(W / 2, H / 2 - 4, 10, Math.PI, 0); g.lineTo(W / 2 + 10, H / 2 + 12); for (let k = 0; k < 4; k++) g.lineTo(W / 2 + 10 - (k + 0.5) * 5, H / 2 + (k % 2 ? 12 : 7)); g.lineTo(W / 2 - 10, H / 2 + 12); g.fill();
        g.fillStyle = '#141a14'; g.fillRect(W / 2 - 5, H / 2 - 6, 3, 4); g.fillRect(W / 2 + 2, H / 2 - 6, 3, 4);
        return;
    }
    if (map === 'cavern') {
        g.fillStyle = '#0d0a08'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#4a4038'; g.beginPath(); g.ellipse(W / 2, H / 2, W * 0.46, H * 0.42, 0, 0, TAU); g.fill();
        for (let i = 0; i < 60; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()); const x = W / 2 + Math.cos(a) * d * W * 0.44, y = H / 2 + Math.sin(a) * d * H * 0.4; if (Math.hypot((x - W / 2) / W, (y - H / 2) / H) < 0.09) continue; g.fillStyle = rnd() < 0.3 ? '#2a231d' : '#7a7066'; g.beginPath(); g.arc(x, y, 3 + rnd() * (rnd() < 0.2 ? 12 : 5), 0, TAU); g.fill(); }
        for (let i = 0; i < 10; i++) { const x = W * 0.12 + rnd() * W * 0.76, y = H * 0.15 + rnd() * H * 0.7, c = rnd() < 0.35 ? '#ff7a2a' : rnd() < 0.5 ? '#b47dff' : '#5fe1ff'; g.shadowColor = c; g.shadowBlur = 10; g.fillStyle = c; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
        g.shadowBlur = 0;
        g.fillStyle = '#5a1620'; g.beginPath(); g.arc(W / 2, H / 2, 14, 0, TAU); g.fill();
        g.fillStyle = '#ffb000'; g.beginPath(); g.arc(W / 2 + 6, H / 2 - 4, 2.5, 0, TAU); g.arc(W / 2 + 6, H / 2 + 4, 2.5, 0, TAU); g.fill();
        return;
    }
    if (map === 'maze') {
        g.fillStyle = '#5a5c62'; g.fillRect(0, 0, W, H);
        const n = 10, cw = W / n, ch = H / 6;
        g.fillStyle = '#c9ccd2';
        g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4); g.fillRect(0, 0, 4, H); g.fillRect(W - 4, 0, 4, H);
        for (let i = 0; i < n; i++) for (let j = 0; j < 6; j++) {
            if (rnd() < 0.5 && i < n - 1) g.fillRect((i + 1) * cw - 2, j * ch, 4, ch + 2);
            if (rnd() < 0.45 && j < 5) g.fillRect(i * cw, (j + 1) * ch - 2, cw + 2, 4);
        }
        for (let i = 0; i < 9; i++) { g.fillStyle = '#5f6b3c'; g.beginPath(); g.arc(rnd() * W, rnd() * H, 4, 0, TAU); g.fill(); }
        g.fillStyle = '#5ec3ff'; g.beginPath(); g.arc(cw / 2, ch / 2, 6, 0, TAU); g.fill();
        g.fillStyle = '#ffd166'; g.beginPath(); g.arc(W - cw / 2, H - ch / 2, 9, 0, TAU); g.fill();
        return;
    }
    if (map === 'mountain') {
        for (let x = 0; x < W; x += 6) for (let y = 0; y < H; y += 6) {
            const h = clamp(0.62 * ((x / W + y / H) / 2) + 0.12 * Math.sin(x * 0.05) * Math.cos(y * 0.06) + 0.12, 0, 1);
            g.fillStyle = altitudeColor(h); g.fillRect(x, y, 6, 6);
        }
        for (let i = 0; i < 24; i++) {
            const x = rnd() * W, y = rnd() * H, high = (x / W + y / H) / 2 > 0.62;
            g.fillStyle = high ? '#f2f5f8' : '#6a655c'; g.beginPath(); g.arc(x, y, 8 + rnd() * 10, 0, TAU); g.fill();
        }
        for (let i = 0; i < 18; i++) { const x = rnd() * W * 0.6, y = rnd() * H * 0.6; g.fillStyle = '#2f6b2a'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); }
        g.strokeStyle = 'rgba(255,240,200,0.6)'; g.lineWidth = 3; g.setLineDash([6, 5]);
        g.beginPath(); g.moveTo(20, 20); g.quadraticCurveTo(W * 0.7, H * 0.2, W - 30, H - 25); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#ffd166'; g.beginPath(); g.arc(W - 30, H - 25, 9, 0, TAU); g.fill();
        return;
    }
    if (map === 'ordinary') {
        g.fillStyle = '#5b9a45'; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#b0956a'; g.lineWidth = 14; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-10, 120); g.quadraticCurveTo(120, 60, 310, 110); g.stroke();
        for (let i = 0; i < 26; i++) { const x = 170 + rnd() * 130, y = rnd() * 80; g.fillStyle = i % 2 ? '#2f6b2a' : '#3d7f35'; g.beginPath(); g.arc(x, y, 14 + rnd() * 8, 0, TAU); g.fill(); }
        for (let i = 0; i < 6; i++) { g.fillStyle = '#a8a294'; g.beginPath(); g.arc(30 + rnd() * 90, 140 + rnd() * 35, 8 + rnd() * 6, 0, TAU); g.fill(); }
        for (const [x, y, c] of [[40, 30, '#c0583f'], [95, 45, '#3f7a9c'], [55, 75, '#7a68a8']]) { g.fillStyle = c; g.fillRect(x, y, 38, 28); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x, y + 14, 38, 14); }
    } else {
        const rusty = map === 'rusty';
        g.fillStyle = rusty ? '#7d7262' : '#a19c93'; g.fillRect(0, 0, W, H);
        g.fillStyle = rusty ? '#3e3a35' : '#3f3f46';
        for (const x of [95, 205]) g.fillRect(x, 0, 26, H);
        g.fillRect(0, 85, W, 26);
        if (!rusty) { g.fillStyle = 'rgba(240,200,80,0.8)'; for (let x = 0; x < W; x += 22) g.fillRect(x, 97, 12, 3); }
        const roofs = rusty ? ['#8a4a2a', '#7a5a3a', '#6a6a5a', '#9a5a30'] : ['#c0583f', '#3f7a9c', '#d9dde2', '#5d4f6e', '#7a68a8'];
        for (const [x0, x1] of [[8, 88], [128, 198], [228, 292]]) for (const [y0, y1] of [[8, 78], [118, 172]]) {
            g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0 + 6, y0 + 6, x1 - x0, y1 - y0);
            g.fillStyle = pick(roofs); g.fillRect(x0, y0, x1 - x0, y1 - y0);
            if (rusty) { g.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = x0; x < x1; x += 6) g.fillRect(x, y0, 2, y1 - y0); g.fillStyle = '#16120f'; g.fillRect(x0 + 10 + rnd() * 30, y0 + 10 + rnd() * 20, 14, 10); }
        }
        if (!rusty) { g.fillStyle = '#e8434b'; g.fillRect(150, 30, 26, 8); g.fillRect(159, 21, 8, 26); }
        for (let i = 0; i < 6; i++) { g.fillStyle = rusty ? pick(['#6b3a24', '#4a4f44', '#5a4a3a']) : pick(CAR_COLORS); g.fillRect(i % 2 ? 99 : 209, 10 + i * 27, 10, 18); }
        if (rusty) {
            for (let i = 0; i < 5; i++) { const x = rnd() * W, y = rnd() * H, r = 14 + rnd() * 16, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(15,12,10,0.8)'); gr.addColorStop(1, 'rgba(15,12,10,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
            for (let i = 0; i < 3; i++) { const x = 40 + rnd() * 220, y = 30 + rnd() * 120; for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(45,42,44,${0.5 - k * 0.07})`; g.beginPath(); g.arc(x + k * 6, y - k * 9, 8 + k * 3, 0, TAU); g.fill(); } g.fillStyle = '#ff8a3d'; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
        }
    }
}
$('resume-btn').addEventListener('click', () => setPaused(false));
// After dying in a team mode: watch your team, or leave
wireNukeMap();
for (const [sel, set] of [['#murder-role', v => { murderRolePick = v; }], ['#ghost-role', v => { ghostRolePick = v; }]])
    for (const b of document.querySelectorAll(sel + ' button')) b.addEventListener('click', () => {
        set(b.dataset.r);
        for (const o of document.querySelectorAll(sel + ' button')) o.classList.toggle('on', o === b);
    });
for (const b of document.querySelectorAll('#assassin-role button')) b.addEventListener('click', () => {
    assassinRole = b.dataset.r;
    for (const o of document.querySelectorAll('#assassin-role button')) o.classList.toggle('on', o === b);
});
$('sl-ok').addEventListener('click', () => closeStrikeLoad(true));
$('sl-cancel').addEventListener('click', () => closeStrikeLoad(false));
$('spectate-btn').addEventListener('click', () => {
    G.spectating = true;
    screens.spectate.classList.add('hidden');
    if (G.mode === 'playing') document.body.classList.add('playing');
});
$('spectate-quit').addEventListener('click', toMenu);
$('spectate-again').addEventListener('click', () => { screens.spectate.classList.add('hidden'); startGame(lastMap); });
$('quit-btn').addEventListener('click', toMenu);
$('menu-btn').addEventListener('click', toMenu);

function startGame(map = lastMap) {
    Sound.init();
    const id = MODES[menuMode].id, war = id === 'war' || id === 'hightech' || id === 'revolution' || id === 'fort';
    if (id === 'revolution' && map === 'maze') map = 'ordinary';
    // Escape has no open countryside to cross, and Survival has no maze
    if (id === 'escape' && map === 'ordinary') map = 'city';
    if (id !== 'assassin' && map === 'wasteland') map = 'ordinary';
    if ((id === 'survival' || id === 'fort') && map === 'maze') map = 'ordinary';
    if (id === 'boss') map = 'cavern'; else if (map === 'cavern') map = 'ordinary';  // (the cavern is the boss's own)
    if (id === 'ghost') map = 'haunted'; else if (map === 'haunted') map = 'ordinary';  // (and the haunted house is the ghost's)
    lastMap = map;
    const setup = war ? { type: id, teams: id === 'revolution' || id === 'fort' ? 2 : warTeams, size: teamSize() }
        : id === 'murder' ? { type: id, count: Math.max(2, Math.min(MURDER.maxPlayers - 1, sliderToCount(+slider.value))), role: murderRolePick }
        : id === 'ghost' ? { type: id, count: Math.max(1, Math.min(GHOST.maxPlayers - 1, sliderToCount(+slider.value))), role: ghostRolePick }
        : id === 'zombies' ? { type: id, count: survivorCount() - 1, zombies: zombieCount() }
        : id === 'assassin' ? { type: id, count: sliderToCount(+slider.value), role: assassinRole }
        : { type: id, count: id === 'escape' ? Math.min(sliderToCount(+slider.value), MAX_PLAYERS - ESCAPE.people) : sliderToCount(+slider.value) };
    setup.map = map;
    setup.warfare = id === 'murder' || id === 'ghost' ? 'normal' : lastWarfare;
    setup.ai = aiLevel;
    newState('playing', setup);
    screens.mapsel.classList.add('hidden');
    hud.cache = {};
    hud.killfeed.innerHTML = '';
    screens.menu.classList.add('hidden');
    screens.over.classList.add('hidden');
    screens.pause.classList.add('hidden');
    hud.root.classList.remove('hidden');
    document.body.classList.add('playing');
    canvas.classList.remove('dead');
    mouse.down = false;
    hud.teamScore.classList.toggle('hidden', !war && !G.noZone);
    hud.cells.cure.classList.toggle('hidden', !G.zombies);
    hud.cells.meat.classList.toggle('hidden', !G.survival);
    // Early Warfare: nothing to throw, so no grenade panel
    $('grenade-panel').classList.toggle('hidden', !!G.early || !!G.murder);
    hud.hungerBar.classList.toggle('hidden', !G.survival);
    hud.thirstBar.classList.toggle('hidden', !G.survival);
    hud.energyBar.classList.toggle('hidden', !G.survival);
    hud.cells.water.classList.toggle('hidden', !G.survival);
    hud.cells.bucket.classList.toggle('hidden', !G.survival);
    if (G.murder) { const r = murderRole(G.player); showBanner(`YOU ARE ${r === 'innocent' ? 'INNOCENT' : 'THE ' + MURDER_ROLE[r]}`, true, r === 'murderer' ? 'Take everyone out. Switch to your knife (slot 2) to stab: one stab kills. Anyone who sees the knife knows it\'s you!' : r === 'sheriff' ? 'One shot kills. Find the murderer and shoot them, but if you shoot an innocent, you die too!' : 'Stay alive for 3 minutes. Watch for anyone with a knife out, and grab the gun if the sheriff goes down.'); }
    else if (G.ghostMode) showBanner('GHOST', true, G.player.ghost ? `You're the ghost. Nobody can see you unless you shoot. ${G.alive - 1} hunters to haunt.` : `A ghost is out there with ${G.alive - 1} of you. It only shows when it shoots. Follow the glowing footprints!`);
    else if (G.fort) showBanner('FORT WARS', true, `${G.war.size} a side. Chop trees with your axe for wood, then aim at open ground and ${TOUCH.enabled ? 'push the right stick' : 'click'} to build wooden walls. 2 minutes, then the wall drops!`);
    else if (G.revolution) showBanner(`REVOLUTION: ${revoName(0).toUpperCase()} VS ${revoName(1).toUpperCase()}`, true, `${G.war.size} a side. No respawns: when you die, you stay dead. Arm up from the chests in your armory!`);
    else if (G.early && war) showBanner(`EARLY WARFARE: ${G.war.teams} TEAMS OF ${G.war.size}`, true, 'Swords, spears, bows and crossbows only. Arm up from the supply crates!');
    else if (G.hightech && war) showBanner(`HIGH TECH TEAMS: ${G.war.teams} TEAMS OF ${G.war.size}`, true, 'Find quantum guns in the crates and grab a mech!');
    else if (war) showBanner(`TEAMS: ${G.war.teams} TEAMS OF ${G.war.size}`, false, 'Grab guns from the supply crates near your base');
    else if (G.bossFight) showBanner('BOSS FIGHT', true, `You + ${G.fighters.filter(f => f.team === 0).length - 1} vs THE BOSS. Don't get close!`);
    else if (G.assassin) showBanner('ASSASSIN', true, G.player.assassin ? `You're the assassin. ${G.alive - 1} survivors in the dark. If one of them touches you, you're caught!` : `An assassin with a ${G.hightech ? 'Railgun' : 'Barrett'} is hiding among ${G.alive - 1} of you. Find him and catch him!`);
    else if (G.zombies) { const z = G.fighters.filter(f => f.zombie).length; showBanner('ZOMBIES', true, `${z} zombies are out there. Survive with ${G.fighters.length - z - 1} other survivors.`); }
    else if (G.escape) showBanner('ESCAPE', true, G.world.terrain === 'maze' ? 'Find a way through the maze to the helicopter. Machine-gun nests, minefields, and the map only shows where you\'ve been!'
        : G.world.terrain === 'mountain' ? 'Climb the mountains with your group to the helicopter on the snowy summit!'
        : `Lead your group across the city to the HQ tower and climb ${G.hq.floors} floors to the helicopter!`);
    else if (G.survival) showBanner('SURVIVAL', true, 'Hunt for meat (C to eat), find water (V to drink), rest when tired (B). Everyone moves when the countdown ends!');
    else if (G.early) showBanner('EARLY WARFARE', true, `${G.alive} players. Swords, spears, bows and crossbows only!`);
    else if (G.hightech) showBanner('HIGH TECH WARFARE', true, `${G.alive} players. Find a quantum gun, grab a tech vehicle!`);
    else if (G.heavy && !war) showBanner('HEAVY WARFARE', true, `${G.alive} players. Find the heavy guns: supply crates everywhere!`);
    else if (G.epic) showBanner(`EPIC FREE FOR ALL: ${G.alive} PLAYERS`, false, 'Supply crates everywhere. Grab the heavy guns!');
    else showBanner(`${G.alive} PLAYERS. SURVIVE!`);
    if (NET.role === 'host') netGameStarted();
}

function toMenu() {
    netGameEnded();
    newDemo();
    screens.pause.classList.add('hidden');
    screens.over.classList.add('hidden');
    screens.spectate.classList.add('hidden');
    $('strike-load').classList.add('hidden');
    hud.root.classList.add('hidden');
    canvas.classList.remove('dead');
    menuStep('mode');
    screens.menu.classList.remove('hidden');
    document.body.classList.remove('playing');
    $('best-kills').textContent = bestKills;
}

function setPaused(on) {
    if (!G || (G.mode !== 'playing' && G.mode !== 'paused')) return;
    G.mode = on ? 'paused' : 'playing';
    screens.pause.classList.toggle('hidden', !on);
    document.body.classList.toggle('playing', !on);
    mouse.down = false;
}

function showGameOver() {
    const r = G.result, p = G.player;
    G.mode = 'over';
    document.body.classList.remove('playing');
    const newBest = p.kills > bestKills;
    if (newBest) {
        bestKills = p.kills;
        localStorage.setItem('ba_highscore', String(bestKills));
    }
    const title = $('go-title');
    title.textContent = r.title || (r.won ? 'VICTORY!' : G.war ? 'DEFEAT' : 'ELIMINATED');
    title.classList.toggle('lose', !r.won);
    if (r.sub) $('go-sub').textContent = r.sub;
    else if (G.war) $('go-sub').textContent = r.won ? `Your team won the war${p.dead ? ' (you went down, but your squad finished it)' : ''}.` : `Your team was wiped out${r.killer ? `. You were taken out by ${r.killer}` : ''}.`;
    else $('go-sub').textContent = r.won ? 'You are the last one standing.' : r.killer ? `Taken out by ${r.killer}` : 'Better luck next drop.';
    $('go-place').textContent = `#${r.place}`;
    $('go-kills').textContent = p.kills;
    $('go-time').textContent = fmtTime((p.dead ? p.diedAt : G.time) / 1000);
    $('go-best').textContent = newBest ? '★ New best kill record!' : '';
    screens.over.classList.toggle('win', r.won);
    screens.over.classList.remove('hidden');
}

// ---------- Main loop ----------
let last = performance.now();
function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // (playing on a friend's game: their computer runs it and you watch their picture of your view)
    if (NET.viewing) { requestAnimationFrame(frame); return; }
    if (TOUCH.enabled) touchFrame();
    if (G && G.mode !== 'paused') {
        // Slow-mo eases back to normal speed (slower recovery during the victory moment)
        G.timeScale = Math.min(1, G.timeScale + dt * (G.victory ? 0.35 : 2.2));
        G.flash = Math.max(0, G.flash - dt * 1.6);
        update(dt * G.timeScale);
        updateVictory(dt);
    }
    render();
    if (G && G.player && G.mode !== 'demo') updateHUD();
    // Hosting: draw each friend's own view for their stream
    if (G && G.netHosted && G.mode !== 'demo') for (const g of NET.guests) if (g.f) renderGuest(g, G.mode === 'paused' ? 0 : dt);
    if (!screens.menu.classList.contains('hidden')) drawModePreview(now / 1000);
    requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
buildSprites();
$('best-kills').textContent = bestKills;
// The game opens on Free For All
setMenuMode(MODES.findIndex(m => m.id === 'ffa'));
updateTeamLabel();
for (const k of STACKABLE) hud.cells[k].querySelector('img').src = SPR.loot[k].toDataURL();
// Click a throwable to choose it
for (const k of THROWABLES) {
    hud.cells[k].addEventListener('mousedown', e => {
        e.stopPropagation();
        if (G && G.player && !G.player.cook && G.player.items[k] > 0) { G.player.throwSel = k; G.player.nadeReady = true; }
    });
}
newDemo();
requestAnimationFrame(frame);

// ---------- Play with friends ----------
// The host runs the game. Each friend takes over a bot (on the host's side in team games): the host draws that
// friend's own view every frame and streams it to them like a video call, and the friend's keys and mouse come
// back over the same connection. Connecting uses PeerJS (WebRTC); the code is the host's id on its free broker.
const NET = {
    lib: 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
    prefix: 'battlearena-v1-',
    letters: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
    maxFriends: 7, maxPixels: 1280 * 720,
    peer: null, role: null, code: null,
    guests: [],          // (host) the friends who've joined
    conn: null, viewing: false, stream: null, lastMove: 0   // (friend) the connection to the host
};
function loadPeerJS() {
    if (window.Peer) return Promise.resolve();
    return new Promise((ok, fail) => {
        const s = document.createElement('script');
        s.src = NET.lib; s.onload = () => ok(); s.onerror = () => fail(new Error('Could not load the networking library. Check your internet connection.'));
        document.head.appendChild(s);
    });
}
const netCode = () => Array.from({ length: 5 }, () => NET.letters[randInt(0, NET.letters.length - 1)]).join('');
function friendsView(which) {
    for (const id of ['fr-choose', 'fr-hosting', 'fr-joining']) $(id).classList.toggle('hidden', id !== which);
}
function openFriends() {
    $('friends').classList.remove('hidden');
    friendsView(NET.role === 'host' ? 'fr-hosting' : NET.role === 'guest' ? 'fr-joining' : 'fr-choose');
}
function netStop() {
    for (const g of NET.guests) dropGuest(g, true);
    NET.guests = [];
    if (NET.peer) { try { NET.peer.destroy(); } catch (e) { /* already gone */ } }
    NET.peer = null; NET.role = null; NET.code = null; NET.conn = null;
    stopViewing();
    updateHostStrip();
}

// ----- Hosting -----
async function hostGame() {
    netStop();
    friendsView('fr-hosting');
    $('fr-code').textContent = '·····';
    $('fr-list').textContent = 'Setting up...';
    try { await loadPeerJS(); } catch (e) { $('fr-list').textContent = e.message; return; }
    NET.role = 'host';
    const tryOpen = (tries) => {
        const code = netCode(), peer = new Peer(NET.prefix + code.toLowerCase());
        NET.peer = peer;
        peer.on('open', () => { NET.code = code; $('fr-code').textContent = code; updateHostList(); updateHostStrip(); });
        peer.on('error', err => {
            if (err.type === 'unavailable-id' && tries > 0) { peer.destroy(); tryOpen(tries - 1); return; }
            if (NET.peer === peer) $('fr-list').textContent = `Couldn't host: ${err.type || err.message}`;
        });
        peer.on('connection', conn => conn.on('open', () => addGuest(conn)));
    };
    tryOpen(4);
}
function updateHostList() {
    if (NET.role !== 'host') return;
    $('fr-list').textContent = NET.guests.length ? `Joined: ${NET.guests.map(g => g.name).join(', ')}` : 'Waiting for friends to join...';
    updateHostStrip();
}
function updateHostStrip() {
    const el = $('host-strip');
    if (!el) return;
    el.classList.toggle('hidden', NET.role !== 'host' || !NET.code);
    if (NET.role === 'host' && NET.code) el.innerHTML = `HOSTING · CODE <strong>${NET.code}</strong> · ${NET.guests.length} friend${NET.guests.length === 1 ? '' : 's'} joined · pick a battlefield to start`;
}
function addGuest(conn) {
    if (NET.guests.length >= NET.maxFriends) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); return; }
    const used = new Set(NET.guests.map(g => g.n));
    let n = 1; while (used.has(n)) n++;
    const g = { n, name: `Friend ${n}`, conn, call: null, f: null, w: 1280, h: 720, input: { keys: new Set(), mouse: { x: 640, y: 360, down: false }, world: null }, cam: { x: 0, y: 0 }, zoom: 1, va: null, hurt: 0 };
    g.input.world = () => ({ x: (g.input.mouse.x - g.w / 2) / g.zoom + g.cam.x, y: (g.input.mouse.y - g.h / 2) / g.zoom + g.cam.y });
    NET.guests.push(g);
    conn.on('data', msg => onGuestMsg(g, msg));
    conn.on('close', () => dropGuest(g));
    conn.send({ t: 'welcome', name: g.name });
    updateHostList();
    if (G && G.netHosted && G.mode !== 'demo') attachGuest(g);
}
function dropGuest(g, keepList) {
    if (g.call) { try { g.call.close(); } catch (e) { /* gone */ } g.call = null; }
    if (g.f) { g.f.remote = null; g.f.nextThink = G ? G.time : 0; g.f = null; }
    if (!keepList) { NET.guests = NET.guests.filter(x => x !== g); updateHostList(); try { g.conn.close(); } catch (e) { /* gone */ } }
}
function onGuestMsg(g, m) {
    if (!m || typeof m !== 'object') return;
    const I = g.input;
    if (m.t === 'hello') {
        // (their screen's shape, kept to a size the host can draw and send every frame)
        const w = Math.max(320, +m.w || 1280), h = Math.max(240, +m.h || 720), k = Math.min(1, Math.sqrt(NET.maxPixels / (w * h)));
        g.w = Math.round(w * k); g.h = Math.round(h * k);
        return;
    }
    if (m.t === 'k') {
        const code = String(m.code || '').slice(0, 24);
        if (m.down) { if (!I.keys.has(code) && g.f) onKeyPress(code, false, g.f); I.keys.add(code); }
        else { I.keys.delete(code); if (code === 'KeyG' && g.f) playerRelease(g.f); }
    } else if (m.t === 'm') { I.mouse.x = +m.x || 0; I.mouse.y = +m.y || 0; }
    else if (m.t === 'b') {
        const p = g.f, down = !!m.down;
        if (m.button === 0) I.mouse.down = down;
        if (!p || !G || G.mode !== 'playing' || p.dead) return;
        if (down && p.car && !vt(p.car).fixed && (m.button === 2 || (m.button === 0 && !(vt(p.car).gun || vt(p.car).cannon || vt(p.car).rockets)))) { I.mouse.down = false; const w = I.world(); setDriveGoal(p.car, w.x, w.y); return; }
        if (m.button === 2) down ? playerCook(p) : playerRelease(p);
    } else if (m.t === 'w') {
        const p = g.f;
        if (p && G && G.mode === 'playing' && !p.dead) { const n = p.inv.length; switchSlot(p, (p.slot + (m.dy > 0 ? 1 : -1) + n) % n); }
    } else if (m.t === 'blur') { I.keys.clear(); I.mouse.down = false; }
}
// A friend takes over a bot: one on your side if there are sides, the nearest to you
function attachGuest(g) {
    if (!G || !G.player || g.f) return;
    const me = G.player, side = me.team;
    const ok = f => !f.dead && !isHuman(f) && !f.soldier && !f.zombie && !f.decoy && !f.car && !f.riding && (side === null || f.team === side);
    let best = null, bd = Infinity;
    for (const f of G.fighters) if (ok(f)) { const d = dist(f, me); if (d < bd) { bd = d; best = f; } }
    if (!best) {
        // (nobody to take over: they arrive next to you)
        const s = spawnNear(me, 160, 18) || { x: me.x + 60, y: me.y };
        best = createFighter(s.x, s.y, { name: g.name, color: pick(BOT_COLORS), team: side });
        G.fighters.push(best);
    }
    best.remote = g; best.name = g.name;
    best.mode = 'wander'; best.goal = null; best.path = null; best.target = null; best.vx = best.vy = 0;
    if (best.up && !G.revolution) best.up = null;
    g.f = best; g.cam = { x: best.x, y: best.y }; g.va = null; g.hurt = 0;
    g.input.keys.clear(); g.input.mouse.down = false;
    // Their view, drawn here and streamed to them
    g.canvas = document.createElement('canvas'); g.canvas.width = g.w; g.canvas.height = g.h;
    g.ctx = g.canvas.getContext('2d');
    g.vig = null; g.hv = null; g.light = [null, null];
    renderGuest(g, 0);
    const stream = g.canvas.captureStream(30);
    if (g.call) { try { g.call.close(); } catch (e) { /* gone */ } }
    g.call = NET.peer.call(g.conn.peer, stream);
    g.conn.send({ t: 'start', name: g.name, mode: MODES[menuMode].name });
    showBanner(`${g.name.toUpperCase()} JOINED`, false, `${g.name} is playing as ${best.team !== null && G.war ? 'your teammate' : 'one of the players'}`);
}
// Called when a game starts with friends connected
function netGameStarted() {
    if (NET.role !== 'host') return;
    G.netHosted = true;
    for (const g of NET.guests) { g.f = null; attachGuest(g); }
}
function netGameEnded() {
    if (NET.role !== 'host') return;
    for (const g of NET.guests) { if (g.call) { try { g.call.close(); } catch (e) { /* gone */ } g.call = null; } g.f = null; try { g.conn.send({ t: 'end' }); } catch (e) { /* gone */ } }
}

// ----- Drawing a friend's view -----
function updateGuestCam(g, dt) {
    let f = g.f;
    if (!f) return;
    // (once they're out, they watch a teammate, or whoever's still going)
    if (f.dead) {
        if (!g.watch || g.watch.dead) { const alive = G.fighters.filter(x => !x.dead && (f.team === null || x.team === f.team)); g.watch = alive.length ? alive.reduce((a, x) => (dist(x, f) < dist(a, f) ? x : a)) : null; }
        if (g.watch) f = g.watch;
    }
    const k = Math.min(1, dt * 12);
    const look = inCannon(g.f) && g.zoom ? cannonLook(g.f, g.w, g.h, g.zoom) : f;
    g.cam.x += (look.x - g.cam.x) * k; g.cam.y += (look.y - g.cam.y) * k;
    const target = normalZoom(g.w, g.h, g.f);
    g.zoom = g.zoom ? lerp(g.zoom, target, Math.min(1, dt * 4)) : target;
    const W = CONFIG.WORLD_SIZE, hw = g.w / 2 / g.zoom, hh = g.h / 2 / g.zoom;
    g.cam.x = hw * 2 < W ? clamp(g.cam.x, hw, W - hw) : W / 2;
    g.cam.y = hh * 2 < W ? clamp(g.cam.y, hh, W - hh) : W / 2;
    // (their own red flash when they get hurt)
    if (g.lastHp !== undefined && g.f.hp < g.lastHp) g.hurt = Math.min(1, g.hurt + 0.35);
    g.lastHp = g.f.hp;
    g.hurt = Math.max(0, g.hurt - dt * 1.2);
}
// Each viewer keeps their own see-through roofs and balconies
function swapViewState(g) {
    if (!g.va) g.va = new Map();
    const objs = G.revolution ? G.world.buildings.concat(G.revolution.bases) : G.world.buildings;
    for (const o of objs) {
        const mine = g.va.get(o);
        g.va.set(o, { r: o.roofAlpha, d: o.deckAlpha });
        if (mine) { o.roofAlpha = mine.r; o.deckAlpha = mine.d; }
    }
}
function renderGuest(g, dt) {
    if (!g.f || !g.ctx) return;
    updateGuestCam(g, dt);
    const keep = { ctx, viewW, viewH, dpr, vignette, hurtVignette, lightCv, lightG, player: G.player, cam: G.cam, zoom: G.zoom, hurt: G.hurt, strike: G.strikeCam, shake: G.shake, flash: G.flash, whiteout: G.whiteout, mx: mouse.x, my: mouse.y, md: mouse.down };
    ctx = g.ctx; viewW = g.w; viewH = g.h; dpr = 1;
    if (!g.vig) { g.vig = makeVignette('rgba(10,4,24,0.55)'); g.hv = makeVignette('rgba(220,20,60,0.75)'); }
    vignette = g.vig; hurtVignette = g.hv; [lightCv, lightG] = g.light;
    G.player = g.f; G.cam = g.cam; G.zoom = g.zoom; G.hurt = g.hurt; G.strikeCam = null; G.shake = 0; G.flash = 0; G.whiteout = 0;
    mouse.x = g.input.mouse.x; mouse.y = g.input.mouse.y; mouse.down = g.input.mouse.down;
    swapViewState(g);
    try { render(); drawGuestHud(g); }
    finally {
        swapViewState(g);
        g.light = [lightCv, lightG];
        ({ ctx, viewW, viewH, dpr, vignette, hurtVignette, lightCv, lightG } = keep);
        G.player = keep.player; G.cam = keep.cam; G.zoom = keep.zoom; G.hurt = keep.hurt; G.strikeCam = keep.strike; G.shake = keep.shake; G.flash = keep.flash; G.whiteout = keep.whiteout;
        mouse.x = keep.mx; mouse.y = keep.my; mouse.down = keep.md;
    }
}
// The friend's HUD, drawn into their view: health and armor, the gun and its ammo, their slots and supplies
function drawGuestHud(g) {
    const p = g.f, c = ctx, W = viewW, H = viewH;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.textBaseline = 'middle';
    const panel = (x, y, w, h) => { c.fillStyle = 'rgba(14,10,28,0.72)'; roundRect(c, x, y, w, h, 10); c.fill(); };
    // top left: alive and kills
    panel(14, 14, 190, 46);
    c.font = '700 22px "Black Ops One", sans-serif'; c.textAlign = 'left'; c.fillStyle = '#fff7ec';
    c.fillText(`${G.alive ?? G.fighters.length}`, 28, 38); c.fillText(`${p.kills || 0}`, 118, 38);
    c.font = '600 12px Rajdhani, sans-serif'; c.fillStyle = '#b8b0d0'; c.fillText('ALIVE', 66, 39); c.fillText('KILLS', 150, 39);
    // bottom middle: health and armor
    const bw = Math.min(340, W * 0.4), bx = W / 2 - bw / 2, by = H - 64;
    const bar = (y, frac, col, label) => { c.fillStyle = 'rgba(14,10,28,0.72)'; roundRect(c, bx, y, bw, 18, 6); c.fill(); c.fillStyle = col; roundRect(c, bx + 2, y + 2, Math.max(0, (bw - 4) * clamp(frac, 0, 1)), 14, 5); c.fill(); c.font = '700 12px Rajdhani, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(label, W / 2, y + 10); };
    if (p.armor > 0) bar(by - 24, p.armor / 100, '#5ec3ff', `ARMOR ${Math.ceil(p.armor)}`);
    bar(by, p.hp / p.maxHp, p.hp < p.maxHp * 0.3 ? '#ff4f6d' : '#5ee08a', `${Math.ceil(Math.max(0, p.hp))} / ${p.maxHp}`);
    // bottom left: slots, and bandages / medkits
    c.textAlign = 'left';
    p.inv.forEach((k, i) => {
        const x = 14, y = H - 30 - (p.inv.length - i) * 30;
        panel(x, y, 190, 26);
        if (i === p.slot) { c.strokeStyle = '#ffd166'; c.lineWidth = 2; roundRect(c, x, y, 190, 26, 10); c.stroke(); }
        c.font = '600 14px Rajdhani, sans-serif'; c.fillStyle = k ? '#fff7ec' : '#6f6890'; c.fillText(`${i + 1}  ${k || '—'}`, x + 12, y + 14);
    });
    panel(14, H - 28 - 2, 190, 24);
    c.font = '600 13px Rajdhani, sans-serif'; c.fillStyle = '#fff7ec';
    c.fillText(`Q bandage ${p.items.bandage || 0}   E medkit ${p.items.medkit || 0}`, 26, H - 17);
    // bottom right: the gun and its ammo
    const w = held(p), W8 = WEAPONS[w];
    panel(W - 214, H - 74, 200, 60);
    c.textAlign = 'right'; c.font = '700 15px Rajdhani, sans-serif'; c.fillStyle = '#b8b0d0'; c.fillText((w || 'Fists').toUpperCase(), W - 28, H - 58);
    c.font = '700 26px "Black Ops One", sans-serif'; c.fillStyle = '#fff7ec';
    const reserve = p.ammo[w] === Infinity ? '∞' : Math.max(0, p.ammo[w] || 0);
    c.fillText(W8 && !W8.melee ? `${reserve}` : '—', W - 28, H - 32);
    // what F does here
    const loot = !p.dead && !p.car && nearestLoot(p.x, p.y, CONFIG.PICKUP_RANGE), car = !p.dead && !p.car && !loot && nearestCar(p, 90);
    const hint = p.car ? 'F  get out' : loot ? `F  pick up ${lootName(loot.key)}` : car ? `F  get in the ${vt(car).name}` : '';
    if (hint) { c.font = '700 16px Rajdhani, sans-serif'; c.textAlign = 'center'; const tw = c.measureText(hint).width + 30; panel(W / 2 - tw / 2, H - 132, tw, 30); c.fillStyle = '#ffd166'; c.fillText(hint, W / 2, H - 116); }
    // out of the game, or the game's over
    if (p.dead || G.result) {
        c.fillStyle = 'rgba(10,6,20,0.45)'; c.fillRect(0, H * 0.36, W, H * 0.2);
        c.textAlign = 'center'; c.font = '900 50px "Black Ops One", sans-serif';
        const won = G.result && (G.result.won || (G.war && G.result.winner === p.team));
        c.fillStyle = G.result ? (won ? '#5ee08a' : '#ff6b6b') : '#ff6b6b';
        c.fillText(G.result ? (won ? 'VICTORY!' : 'GAME OVER') : 'YOU DIED', W / 2, H * 0.44);
        c.font = '600 19px Rajdhani, sans-serif'; c.fillStyle = '#fff7ec';
        c.fillText(G.result ? 'Waiting for the host to start the next game' : `Watching ${g.watch ? g.watch.name : 'the game'}`, W / 2, H * 0.51);
    }
}

// ----- Joining -----
async function joinGame(code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 5) { $('fr-join-msg').textContent = 'Codes are 5 letters and numbers. Check it and try again:'; return; }
    netStop();
    friendsView('fr-joining');
    $('fr-join-msg').textContent = 'Connecting...';
    try { await loadPeerJS(); } catch (e) { $('fr-join-msg').textContent = e.message; return; }
    NET.role = 'guest';
    const peer = new Peer();
    NET.peer = peer;
    peer.on('error', err => {
        if (NET.peer !== peer) return;
        $('fr-join-msg').textContent = err.type === 'peer-unavailable' ? `No game found with code ${code}. Check the code with your friend:` : `Couldn't connect (${err.type || err.message}). Try again:`;
        NET.role = null;
    });
    peer.on('open', () => {
        const conn = peer.connect(NET.prefix + code.toLowerCase(), { reliable: true });
        NET.conn = conn;
        conn.on('open', () => conn.send({ t: 'hello', w: window.innerWidth, h: window.innerHeight }));
        conn.on('data', m => onHostMsg(m));
        conn.on('close', () => { if (NET.peer !== peer) return; stopViewing(); $('friends').classList.remove('hidden'); friendsView('fr-joining'); $('fr-join-msg').textContent = 'The host left the game. Type a code to join another:'; NET.role = null; });
    });
    peer.on('call', call => {
        call.answer();
        call.on('stream', s => startViewing(s));
        call.on('close', () => stopViewing(true));
    });
}
function onHostMsg(m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'welcome') $('fr-join-msg').textContent = `Connected as ${m.name}! Waiting for the host to start the game...`;
    if (m.t === 'full') $('fr-join-msg').textContent = 'That game is full.';
    if (m.t === 'start') $('fr-join-msg').textContent = `Joining ${m.mode}...`;
    if (m.t === 'end') { stopViewing(true); $('fr-join-msg').textContent = 'The host is back at the menu. Waiting for the next game...'; }
}
function startViewing(stream) {
    const v = $('net-video');
    NET.stream = stream; NET.viewing = true;
    v.srcObject = stream; v.classList.remove('hidden');
    v.play().catch(() => { /* starts on the next click */ });
    for (const k in screens) screens[k].classList.add('hidden');
    $('friends').classList.add('hidden');
    hud.root.classList.add('hidden');
    document.body.classList.add('playing', 'net-viewing');
    keys.clear(); mouse.down = false;
}
function stopViewing(backToLobby) {
    const v = $('net-video');
    if (v) { v.srcObject = null; v.classList.add('hidden'); }
    $('net-leave') && $('net-leave').classList.add('hidden');
    document.body.classList.remove('net-viewing');
    if (!NET.viewing) return;
    NET.viewing = false; NET.stream = null;
    document.body.classList.remove('playing');
    if (backToLobby) { screens.mapsel.classList.remove('hidden'); $('friends').classList.remove('hidden'); friendsView('fr-joining'); }
}
// Where the mouse is in the host's picture of your view (it's letterboxed to fit your window)
function netMouse(e) {
    const v = $('net-video'), r = v.getBoundingClientRect(), vw = v.videoWidth || 1280, vh = v.videoHeight || 720;
    const k = Math.min(r.width / vw, r.height / vh), ox = r.left + (r.width - vw * k) / 2, oy = r.top + (r.height - vh * k) / 2;
    return { x: (e.clientX - ox) / k, y: (e.clientY - oy) / k };
}
const netSend = m => { if (NET.conn && NET.conn.open) NET.conn.send(m); };
// While playing on a friend's game, your keys and mouse go to them (capture first, so the game here ignores them)
window.addEventListener('keydown', e => {
    if (!NET.viewing) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.code === 'Escape') { $('net-leave').classList.toggle('hidden'); return; }
    if (!e.repeat) netSend({ t: 'k', code: e.code, down: true });
}, true);
window.addEventListener('keyup', e => { if (!NET.viewing) return; e.stopImmediatePropagation(); netSend({ t: 'k', code: e.code, down: false }); }, true);
window.addEventListener('mousemove', e => {
    if (!NET.viewing) return;
    const now = performance.now();
    if (now - NET.lastMove < 25) return;
    NET.lastMove = now; netSend({ t: 'm', ...netMouse(e) });
}, true);
window.addEventListener('blur', () => { if (NET.viewing) netSend({ t: 'blur' }); });

$('net-video').addEventListener('mousedown', e => { const m = netMouse(e); netSend({ t: 'm', ...m }); netSend({ t: 'b', button: e.button, down: true }); e.preventDefault(); });
$('net-video').addEventListener('mouseup', e => netSend({ t: 'b', button: e.button, down: false }));
$('net-video').addEventListener('contextmenu', e => e.preventDefault());
$('net-video').addEventListener('wheel', e => netSend({ t: 'w', dy: e.deltaY }), { passive: true });
$('friends-btn').addEventListener('click', openFriends);
$('fr-host').addEventListener('click', hostGame);
$('fr-join').addEventListener('click', () => { friendsView('fr-joining'); $('fr-join-msg').textContent = 'Type the code your friend sent you:'; setTimeout(() => $('fr-input').focus(), 0); });
$('fr-go').addEventListener('click', () => joinGame($('fr-input').value));
$('fr-input').addEventListener('keydown', e => { if (e.code === 'Enter') joinGame($('fr-input').value); });
$('fr-pick').addEventListener('click', () => $('friends').classList.add('hidden'));
$('fr-stop').addEventListener('click', () => { netStop(); friendsView('fr-choose'); });
$('fr-back').addEventListener('click', () => {
    // (backing out of joining stops it; a host keeps hosting and goes back to choosing a battlefield)
    if (NET.role === 'guest') netStop();
    $('friends').classList.add('hidden');
});
$('nl-leave').addEventListener('click', () => { netStop(); $('friends').classList.add('hidden'); toMenu(); });
$('nl-back').addEventListener('click', () => $('net-leave').classList.add('hidden'));

// ---------- Touch controls (phones and iPads) ----------
// Left thumb: a joystick that walks you (as fast as you push it). Right thumb: a joystick that aims, and fires
// once you push it out past the middle (with a grenade in hand: pull it back to pull the pin, let go to throw). A
// pick-up button shows up when there's something to pick up; tap the supplies to heal, a slot to switch guns
const TOUCH = {
    enabled: false,
    move: { on: false, id: null, x: 0, y: 0, ox: 0, oy: 0 },
    aim: { on: false, id: null, x: 1, y: 0, mag: 0, ox: 0, oy: 0 },
    radius: 60, fireAt: 0.35, keysDown: new Set()
};
function enableTouch() {
    if (TOUCH.enabled) return;
    TOUCH.enabled = true;
    document.body.classList.add('touch');
}
if (window.matchMedia && matchMedia('(pointer: coarse)').matches) enableTouch();

// ---------- Full screen on phones and iPads ----------
// On by default: browsers only allow it after a tap, so the first tap anywhere goes full screen (and turns the
// screen sideways where the phone allows it). The ⛶ button switches it off and back on.
// iPhones can't make a web page full screen, so there the button explains Add to Home Screen instead.
const FS = { off: false };

// Every menu box is shrunk just enough to fit on the screen, so nothing ever has to scroll
function fitMenus() {
    const availH = window.innerHeight - 16, availW = window.innerWidth - 12;
    for (const card of document.querySelectorAll('.overlay:not(.hidden) .menu-card')) {
        const prev = card.style.zoom;
        card.style.zoom = 1;
        const h = card.scrollHeight, w = card.offsetWidth;
        if (!h || !w) { card.style.zoom = prev; continue; }
        const z = Math.min(1, availH / h, availW / w);
        card.style.zoom = z < 0.995 ? z.toFixed(3) : '';
    }
}
window.addEventListener('resize', () => setTimeout(fitMenus, 50));
window.addEventListener('orientationchange', () => setTimeout(fitMenus, 200));
new MutationObserver(() => requestAnimationFrame(fitMenus)).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
setTimeout(fitMenus, 300);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMenus);
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
const fsCan = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
const standalone = () => (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) || navigator.standalone;
function enterFullscreen() {
    if (fsEl() || !fsCan()) return;
    const el = document.documentElement;
    try {
        const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen();
        // (no orientation lock: upright or sideways, the game turns with the phone)
        if (r && r.then) r.then(() => { try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch (_) {} }).catch(() => {});
    } catch (_) {}
}
function exitFullscreen() {
    try { if (document.exitFullscreen) document.exitFullscreen().catch(() => {}); else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); } catch (_) {}
}
// (any tap, while it's on and we're not already full screen)
const fsAuto = e => { if (TOUCH.enabled && !FS.off && !fsEl() && e.target && e.target.id !== 'fs-btn') enterFullscreen(); };
window.addEventListener('pointerup', fsAuto, true);
window.addEventListener('touchend', fsAuto, true);
for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => { document.body.classList.toggle('fs', !!fsEl()); setTimeout(() => window.dispatchEvent(new Event('resize')), 120); });
(function setUpFullscreenButton() {
    const btn = document.getElementById('fs-btn'), hint = document.getElementById('fs-hint');
    if (standalone()) { btn.style.display = 'none'; return; }
    btn.addEventListener('pointerdown', e => e.stopPropagation());
    btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        if (!fsCan()) { hint.classList.remove('hidden'); return; }
        if (fsEl()) { FS.off = true; exitFullscreen(); } else { FS.off = false; enterFullscreen(); }
    });
    document.getElementById('fs-hint-ok').addEventListener('click', () => hint.classList.add('hidden'));
})();
window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') enableTouch(); }, true);

// A key from the touch controls: pressed here, or sent to the host when playing on a friend's game
function touchKey(code, down) {
    if (NET.viewing) { netSend({ t: 'k', code, down }); return; }
    if (down) { if (!keys.has(code)) { keys.add(code); onKeyPress(code); } }
    else { keys.delete(code); if (code === 'KeyG') playerRelease(); }
}
// The movement stick drives the arrow keys too (cars and horses steer with those)
function stickKeys(x, y) {
    const want = new Set();
    if (y < -0.38) want.add('KeyW'); if (y > 0.38) want.add('KeyS');
    if (x < -0.38) want.add('KeyA'); if (x > 0.38) want.add('KeyD');
    for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) {
        if (want.has(k) && !TOUCH.keysDown.has(k)) { TOUCH.keysDown.add(k); NET.viewing ? netSend({ t: 'k', code: k, down: true }) : keys.add(k); }
        if (!want.has(k) && TOUCH.keysDown.has(k)) { TOUCH.keysDown.delete(k); NET.viewing ? netSend({ t: 'k', code: k, down: false }) : keys.delete(k); }
    }
}
function stickAt(st, e) {
    let dx = e.clientX - st.ox, dy = e.clientY - st.oy;
    const d = Math.hypot(dx, dy), R = TOUCH.radius;
    if (d > R) { dx *= R / d; dy *= R / d; }
    return { x: dx / R, y: dy / R, mag: Math.min(1, d / R) };
}
function drawStick(el, st, v) {
    el.classList.toggle('on', st.on);
    el.firstElementChild.style.transform = `translate(${v.x * TOUCH.radius}px, ${v.y * TOUCH.radius}px)`;
}
// Each frame: the aim stick points the crosshair (and fires) for you, or for your view on a friend's game
function touchFrame() {
    const a = TOUCH.aim, firing = a.on && a.mag > TOUCH.fireAt;
    if (NET.viewing) {
        const v = $('net-video'), vw = v.videoWidth || 1280, vh = v.videoHeight || 720;
        if (a.on) netSend({ t: 'm', x: vw / 2 + a.x * 220, y: vh / 2 + a.y * 220 });
        if (firing !== !!TOUCH.netFiring) { TOUCH.netFiring = firing; netSend({ t: 'b', button: 0, down: firing }); }
        return;
    }
    const p = G && G.player;
    if (!p || G.mode === 'demo') return;
    // (the crosshair sits out along the way you're aiming; further the harder you push)
    const reach = 140 + 260 * (a.on ? a.mag : (a.lastMag ?? 0.6));
    // (scoped in, the stick steers the scope: it stays put while you let go)
    if (p.scoped) { if (a.on) { mouse.x = viewW / 2 + a.x * reach; mouse.y = viewH / 2 + a.y * reach; } }
    else {
        mouse.x = viewW / 2 + (p.x - G.cam.x) * G.zoom + a.x * reach;
        mouse.y = viewH / 2 + (p.y - G.cam.y) * G.zoom + a.y * reach;
    }
    if (a.on || TOUCH.wasFiring) mouse.down = firing;
    TOUCH.wasFiring = firing;
}
(function setUpTouch() {
    const layer = $('touch'), moveEl = $('stick-move'), aimEl = $('stick-aim');
    layer.addEventListener('pointerdown', e => {
        e.preventDefault();
        enableTouch();
        Sound.init();
        // (the sticks stay put, next to the supplies: a thumb anywhere on that side works the stick on that side)
        const left = e.clientX < window.innerWidth * 0.5;
        const st = left ? TOUCH.move : TOUCH.aim, el = left ? moveEl : aimEl;
        if (st.on) return;
        const r = el.getBoundingClientRect();
        st.on = true; st.id = e.pointerId; st.ox = r.left + r.width / 2; st.oy = r.top + r.height / 2;
        const v = stickAt(st, e);
        if (left) { st.x = v.x; st.y = v.y; stickKeys(v.x, v.y); }
        else { if (v.mag > 0.15) { st.x = v.x / v.mag; st.y = v.y / v.mag; } st.mag = v.mag; }
        drawStick(el, st, v);
        layer.setPointerCapture(e.pointerId);
    });
    layer.addEventListener('pointermove', e => {
        for (const [st, el, isMove] of [[TOUCH.move, moveEl, true], [TOUCH.aim, aimEl, false]]) {
            if (!st.on || st.id !== e.pointerId) continue;
            const v = stickAt(st, e);
            if (isMove) { st.x = v.x; st.y = v.y; stickKeys(v.x, v.y); }
            else if (v.mag > 0.15) { st.x = v.x / v.mag; st.y = v.y / v.mag; st.mag = v.mag; }
            else st.mag = v.mag;
            drawStick(el, st, v);
        }
    });
    const end = e => {
        for (const [st, el, isMove] of [[TOUCH.move, moveEl, true], [TOUCH.aim, aimEl, false]]) {
            if (!st.on || st.id !== e.pointerId) continue;
            st.on = false; st.id = null;
            if (isMove) { st.x = st.y = 0; stickKeys(0, 0); } else { st.lastMag = st.mag; st.mag = 0; }
            drawStick(el, st, { x: 0, y: 0 });
        }
    };
    layer.addEventListener('pointerup', end);
    layer.addEventListener('pointercancel', end);
    // Tap the grenade to switch to the next kind you're carrying
    $('grenade-panel').addEventListener('pointerdown', e => { if (!TOUCH.enabled) return; e.preventDefault(); e.stopPropagation(); touchKey('KeyT', true); touchKey('KeyT', false); });
    // Tap the bandages, medkit, meat or water to use them
    for (const [id, code] of [['cell-bandage', 'KeyQ'], ['cell-medkit', 'KeyE'], ['cell-meat', 'KeyC'], ['cell-water', 'KeyV']]) {
        $(id).addEventListener('pointerdown', e => { if (!TOUCH.enabled) return; e.preventDefault(); e.stopPropagation(); touchKey(code, true); touchKey(code, false); });
    }
    // Keep the sticks beside the supply panels (medical on the left, grenades on the right), and fit the buttons into
    // the space between the minimap, the aiming stick and the grenades, smaller on a small phone
    const place = () => {
        if (!TOUCH.enabled) return;
        const heal = $('heal-panel').getBoundingClientRect(), nade = $('grenade-panel').getBoundingClientRect(), top = $('hud-topright').getBoundingClientRect();
        const W = window.innerWidth, H = window.innerHeight, s = moveEl.offsetWidth || 130;
        // (sideways: the gun slots move down between the sticks; upright: back up top under the health)
        const hb = $('hotbar'), hudRoot = $('hud'), wide = W >= H;
        if (wide && hb.parentElement !== hudRoot) { hudRoot.append(hb); hb.classList.add('hb-bottom'); }
        if (!wide && hb.parentElement === hudRoot) { $('hud-bottom').append(hb); hb.classList.remove('hb-bottom'); }
        let ax, stickTop;
        if (H > W) {
            // Upright: each stick sits right above its supply panel, one in each bottom corner
            const top = Math.min(heal.height ? heal.top : H, nade.height ? nade.top : H) - s - 16;
            moveEl.style.left = '16px'; moveEl.style.top = `${top}px`;
            ax = W - s - 16; stickTop = top;
        } else {
            moveEl.style.left = `${Math.max(12, (heal.width ? heal.right : 12) + 14)}px`;
            moveEl.style.top = `${H - s - 18}px`;
            // (never off the right half of the screen, however many kinds of grenade you're carrying)
            const nadeLeft = nade.width ? nade.left : W - 12;
            ax = clamp(nadeLeft - s - 14, W * 0.55, W - s - 12); stickTop = H - s - 18;
        }
        aimEl.style.left = `${ax}px`;
        aimEl.style.top = `${stickTop}px`;
        // (pause: just under your stats, top left)
        const tl = $('hud-topleft').getBoundingClientRect();
        $('tb-pause').style.top = `${(tl.height ? tl.bottom : 60) + 8}px`;
        const pr = $('tb-pause').getBoundingClientRect(), fb = $('fs-btn');
        if (document.body.classList.contains('playing')) { fb.style.left = `${pr.width ? pr.right + 10 : 70}px`; fb.style.top = `${pr.width ? pr.top + (pr.height - 40) / 2 : (tl.bottom || 60) + 8}px`; }
        else { fb.style.left = ''; fb.style.top = ''; }
        // The pick-up button sits at the bottom, between the two sticks
        const pk = $('tb-pick'), mr = moveEl.getBoundingClientRect(), gapW = ax - mr.right - 12;
        pk.style.maxWidth = `${Math.max(120, gapW)}px`;
        const hbr = hb.getBoundingClientRect();
        pk.style.top = `${wide && hbr.height ? hbr.top - pk.offsetHeight - 10 : H - pk.offsetHeight - 24}px`;
        pk.style.left = `${(mr.right + ax) / 2}px`;
    };
    setInterval(place, 400);
    window.addEventListener('resize', place);
    // The pick-up button: only there when there's something to pick up (or a vehicle to get in or out of)
    const pick = $('tb-pick');
    const pickLabel = () => {
        if (NET.viewing) return 'USE';
        const p = G && G.player;
        if (!p || G.mode !== 'playing' || p.dead || p.zombie) return '';
        if (p.car) return `GET OUT`;
        if (G.revolution && nearOwnPad(p)) return 'BOSS STRIKE';
        const l = nearestLoot(p.x, p.y, CONFIG.PICKUP_RANGE);
        if (l) return `PICK UP ${lootName(l.key).toUpperCase()}`;
        const c = nearestCar(p, 90);
        if (c && (!p.up || c.tower === p.up) && !(c.type === 'bigtower' && c.tower && !c.tower.fallen && p.up !== c.tower)) return `GET IN ${vt(c).name.toUpperCase()}`;
        return '';
    };
    setInterval(() => {
        if (!TOUCH.enabled) return;
        const t = pickLabel();
        pick.classList.toggle('hidden', !t);
        if (t && pick.textContent !== t) pick.textContent = t;
    }, 150);
    pick.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); touchKey('KeyF', true); touchKey('KeyF', false); });
    // The 8x scope button: tap to look through it, tap again to come out
    const scopeBtn = $('tb-scope');
    setInterval(() => {
        if (!TOUCH.enabled) return;
        const p = G && G.player, ok = !NET.viewing && canScope(p);
        scopeBtn.classList.toggle('hidden', !ok);
        scopeBtn.classList.toggle('on', !!(ok && p.scoped));
        const a = aimEl.getBoundingClientRect();
        if (a.width) { scopeBtn.style.left = `${a.left + a.width / 2 - 29}px`; scopeBtn.style.top = `${a.top - 70}px`; }
    }, 150);
    scopeBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const p = G && G.player; if (canScope(p)) p.scoped = !p.scoped; });
    $('tb-pause').addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        if (NET.viewing) { $('net-leave').classList.toggle('hidden'); return; }
        onKeyPress('Escape');
    });
    // Tap a slot on the hotbar to switch to it, or a grenade to pick it
    $('hotbar').addEventListener('pointerdown', e => {
        const slot = e.target.closest('.slot'), p = G && G.player;
        if (!slot || !p || G.mode !== 'playing' || p.dead) return;
        const i = [...$('hotbar').children].indexOf(slot);
        if (i >= 0 && i < p.inv.length) switchSlot(p, i);
    });
})();
