// Scene dimensions
export const SCENE_WIDTH = 6000

// Unified ground line — 0% = bottom edge of world container (flush with viewport bottom).
// All front-row elements anchor here; back-row and temples use small positive offsets for depth.
export const GROUND_Y_PCT = 0

// Maps game faction names → asset key
export const FACTION_MAP = {
  olympians: 'greek',
  aesir:     'norse',
  annunaki:  'mesop',
}

// Maps asset key → directory name (mesop folder is "mesopotamian")
export const FACTION_FOLDER = {
  greek: 'greek',
  norse: 'norse',
  mesop: 'mesopotamian',
}

export const FACTION_LOADING_MSG = {
  greek: 'The gods prepare your settlement...',
  norse: 'The mists of Niflheim clear...',
  mesop: 'The sands reveal your domain...',
}

// Background parallax layers per faction (greek: 5 layers — sky_front was blank and deleted)
// Greek order: sky_back → mid_back → mid_middle → mid_front → ground (front)
export const BG_LAYERS = {
  greek: [
    { file: 'bg_greek_sky_back.png',    speed: 0.05 },
    { file: 'bg_greek_mid_back.png',    speed: 0.2  },
    { file: 'bg_greek_mid_middle.png',  speed: 0.3  },
    { file: 'bg_greek_ground.png',      speed: 1.0  },
    { file: 'bg_greek_mid_front.png',   speed: 0.4  },
  ],
  norse: [
    { file: 'bg_norse_sky_back.png',     speed: 0.05 },
    { file: 'bg_norse_sky_front.png',    speed: 0.1  },
    { file: 'bg_norse_mid_back.png',     speed: 0.2  },
    { file: 'bg_norse_mid_front.png',    speed: 0.4  },
    { file: 'bg_norse_ground_back.png',  speed: 0.8  },
    { file: 'bg_norse_ground_front.png', speed: 1.0  },
  ],
  mesop: [
    { file: 'bg_mesop_sky_back.png',  speed: 0.05 },
    { file: 'bg_mesop_sky_mid.png',   speed: 0.08 },
    { file: 'bg_mesop_sky_front.png', speed: 0.1  },
    { file: 'bg_mesop_mid_back.png',  speed: 0.2  },
    { file: 'bg_mesop_mid_front.png', speed: 0.4  },
    { file: 'bg_mesop_ground.png',    speed: 1.0  },
  ],
}

// 16 fixed building plots
// x:         fraction of SCENE_WIDTH (left edge)
// bottomPct: fraction of scene height from bottom where the building's bottom edge sits
// scale:     used only for temples (tier sizing handled per-category in BuildingSprite)
// templeType: only on temple plots
export const PLOTS = [
  // ── Military Quarter (left zone) ──────────────────────────────────────
  { id: 'fortification', x: 0.05, bottomPct: 0,    scale: 1.0 },
  { id: 'warfare',       x: 0.11, bottomPct: 0,    scale: 1.0 },
  { id: 'stewardship',   x: 0.08, bottomPct: 0.05, scale: 1.0 },
  { id: 'ritual',        x: 0.17, bottomPct: 0.05, scale: 1.0 },
  { id: 'exploration',   x: 0.20, bottomPct: 0,    scale: 1.0 },

  // ── Town Center (middle zone) ──────────────────────────────────────────
  { id: 'embassy',       x: 0.30, bottomPct: 0,    scale: 1.0 },
  { id: 'shop',          x: 0.37, bottomPct: 0,    scale: 1.0 },
  { id: 'townhall',      x: 0.48, bottomPct: 0,    scale: 1.0 },
  { id: 'divination',    x: 0.58, bottomPct: 0,    scale: 1.0 },
  { id: 'commerce',      x: 0.53, bottomPct: 0.05, scale: 1.0 },
  { id: 'craftsmanship', x: 0.63, bottomPct: 0.05, scale: 1.0 },

  // ── Sacred Hill (right zone — gentle elevation curve) ─────────────────
  { id: 'temple_roadside', x: 0.68, bottomPct: 0,    scale: 1.0, templeType: 'roadside_shrine'  },
  { id: 'temple_minor',    x: 0.77, bottomPct: 0.02, scale: 1.0, templeType: 'minor_temple'     },
  { id: 'temple_grand',    x: 0.85, bottomPct: 0.04, scale: 1.0, templeType: 'grand_temple'     },
  { id: 'temple_divine',   x: 0.92, bottomPct: 0.07, scale: 1.0, templeType: 'divine_fortress'  },
  { id: 'temple_citadel',  x: 0.99, bottomPct: 0.10, scale: 1.0, templeType: 'pantheon_citadel' },
]

// Temple visual config: size scale range and glow colour
export const TEMPLE_CONFIG = {
  roadside_shrine:  { min: 0.5, max: 0.8,  glow: 'rgba(255,255,255,0.9)'  },
  minor_temple:     { min: 0.6, max: 1.0,  glow: 'rgba(150,200,255,0.9)'  },
  grand_temple:     { min: 0.8, max: 1.3,  glow: 'rgba(255,200,50,0.9)'   },
  divine_fortress:  { min: 1.0, max: 1.6,  glow: 'rgba(180,100,255,0.9)'  },
  pantheon_citadel: { min: 1.2, max: 2.0,  glow: 'rgba(255,220,100,1.0)'  },
}

// ── Default ambient NPC patrol configs ──────────────────────────────────────────
// minX/maxX are absolute scene-pixel positions (fractions × SCENE_WIDTH).
// startX is derived from the original startRatio (posX = minX + (maxX-minX) * startRatio)
// so the layout editor can drag an absolute start position directly.
const RAW_NPC_CONFIGS = [
  { id: 'npc_0', type: 'villager', minX: 0.05 * SCENE_WIDTH, maxX: 0.20 * SCENE_WIDTH, speed: 30, startRatio: 0.3, initialDir:  1, staggerMs:    0 },
  { id: 'npc_1', type: 'animal',   minX: 0.09 * SCENE_WIDTH, maxX: 0.17 * SCENE_WIDTH, speed: 20, startRatio: 0.7, initialDir: -1, staggerMs:  900 },
  { id: 'npc_2', type: 'villager', minX: 0.34 * SCENE_WIDTH, maxX: 0.55 * SCENE_WIDTH, speed: 30, startRatio: 0.5, initialDir:  1, staggerMs: 1600 },
  { id: 'npc_3', type: 'animal',   minX: 0.38 * SCENE_WIDTH, maxX: 0.53 * SCENE_WIDTH, speed: 20, startRatio: 0.2, initialDir: -1, staggerMs:  400 },
  { id: 'npc_4', type: 'villager', minX: 0.60 * SCENE_WIDTH, maxX: 0.72 * SCENE_WIDTH, speed: 30, startRatio: 0.8, initialDir:  1, staggerMs: 1200 },
  { id: 'npc_5', type: 'animal',   minX: 0.63 * SCENE_WIDTH, maxX: 0.75 * SCENE_WIDTH, speed: 20, startRatio: 0.4, initialDir:  1, staggerMs:  700 },
]

export const DEFAULT_NPC_CONFIGS = RAW_NPC_CONFIGS.map(c => ({
  ...c,
  startX: c.minX + (c.maxX - c.minX) * c.startRatio,
}))

// ── Default atmosphere ground-effect positions ──────────────────────────────────
// Sky group (birds) drift automatically and are not positionable — only ground
// elements (fire/smoke/ashes/enviroparticles) are exposed to the layout editor.
// ids match AtmosphereEffects.jsx SPRITES entries so overrides merge by id.
export const DEFAULT_ATMOSPHERE_CONFIGS = [
  { id: 'fire-a',  group: 'ground', sprite: 'fire',             leftPct: 0.25 },
  { id: 'fire-b',  group: 'ground', sprite: 'fire',             leftPct: 0.50 },
  { id: 'fire-c',  group: 'ground', sprite: 'fire',             leftPct: 0.72 },
  { id: 'smoke-a', group: 'ground', sprite: 'smoke',            leftPct: 0.25 },
  { id: 'smoke-b', group: 'ground', sprite: 'smoke',            leftPct: 0.50 },
  { id: 'smoke-c', group: 'ground', sprite: 'smoke',            leftPct: 0.72 },
  { id: 'ashes-a', group: 'ground', sprite: 'ashes',            leftPct: 0.30 },
  { id: 'ashes-b', group: 'ground', sprite: 'ashes',            leftPct: 0.60 },
  { id: 'env-a',   group: 'ground', sprite: 'enviroparticles',  leftPct: 0.38 },
  { id: 'env-b',   group: 'ground', sprite: 'enviroparticles',  leftPct: 0.72 },
]

// ── Asset URL helpers ──────────────────────────────────────────────────────────

export function getBgLayerUrl(assetKey, file) {
  return `/pantheon_wars_assets/backgrounds/${FACTION_FOLDER[assetKey]}/${file}`
}

export function getBuildingUrl(assetKey, filename) {
  return `/pantheon_wars_assets/buildings/${FACTION_FOLDER[assetKey]}/${filename}`
}

export function getTempleUrl(templeType) {
  return `/pantheon_wars_assets/buildings/temples/temple_${templeType}.png`
}

// ── Tier / townhall helpers ────────────────────────────────────────────────────

export function levelToTier(level) {
  if (level >= 67) return 3
  if (level >= 34) return 2
  return 1
}

const PROFESSION_TYPES = [
  'stewardship', 'ritual', 'commerce', 'divination',
  'exploration', 'fortification', 'warfare', 'craftsmanship',
]

export function getTownhallTier(townships) {
  const allT3 = PROFESSION_TYPES.every(p => {
    const t = (townships || []).find(t => t.type === p)
    return t?.is_owned && t.current_level >= 67
  })
  if (allT3) return 3
  const allT2 = PROFESSION_TYPES.every(p => {
    const t = (townships || []).find(t => t.type === p)
    return t?.is_owned && t.current_level >= 34
  })
  return allT2 ? 2 : 1
}

// ── Preload helper: gather all required asset URLs for the scene ───────────────

export function gatherPreloadAssets(assetKey, townships, templeData) {
  const assets = new Set()

  // Background layers
  const layers = BG_LAYERS[assetKey] || []
  layers.forEach(l => assets.add(getBgLayerUrl(assetKey, l.file)))

  // Always-present faction buildings
  assets.add(getBuildingUrl(assetKey, `bldg_embassy_${assetKey}.png`))
  assets.add(getBuildingUrl(assetKey, `bldg_shop_${assetKey}.png`))
  assets.add(getBuildingUrl(assetKey, `bldg_empty_${assetKey}.png`))

  // Town hall at current tier
  const thTier = getTownhallTier(townships)
  assets.add(getBuildingUrl(assetKey, `bldg_townhall_${assetKey}_t${thTier}.png`))

  // Profession buildings at current tier (empty for unestablished)
  PROFESSION_TYPES.forEach(prof => {
    const t = (townships || []).find(t => t.type === prof)
    if (t?.is_owned) {
      const tier = levelToTier(t.current_level)
      assets.add(getBuildingUrl(assetKey, `bldg_${prof}_${assetKey}_t${tier}.png`))
    }
  })

  // Owned temple assets
  ;(templeData?.owned || []).forEach(t => {
    assets.add(getTempleUrl(t.temple_type))
  })

  return [...assets]
}

// ── Faction-themed building names ──────────────────────────────────────────────

export const BUILDING_NAMES = {
  stewardship:   { greek: 'Granary of Demeter',       norse: "Freya's Longhouse",     mesop: 'Storehouse of Enlil'    },
  ritual:        { greek: 'Shrine of Apollo',          norse: "Völva's Sanctum",       mesop: 'Altar of Marduk'        },
  commerce:      { greek: 'Agora Exchange',            norse: "Merchant's Stave Hall", mesop: 'Bazaar of Ishtar'       },
  divination:    { greek: "Oracle's Grotto",           norse: "Mimir's Well House",    mesop: 'Star Tower of Nabu'     },
  exploration:   { greek: "Cartographer's Hall",       norse: "Pathfinder's Lodge",    mesop: "Surveyor's Outpost"     },
  fortification: { greek: 'Bastion of Ares',           norse: 'Shield Wall Keep',      mesop: 'Rampart of Nergal'      },
  warfare:       { greek: 'War Forge of Hephaestus',  norse: "Týr's Arsenal",          mesop: 'Siege Works of Ninurta' },
  craftsmanship: { greek: "Athena's Workshop",         norse: 'Dwarven Smithy',        mesop: 'Crucible of Kothar'     },
  townhall:      { greek: 'Prytaneion',               norse: 'Great Mead Hall',        mesop: 'Palace of the Ensi'     },
  embassy:       { greek: 'Hall of Heralds',           norse: 'Embassy of the Realms', mesop: 'Gate of Nations'        },
  shop:          { greek: "Merchant's Quarter",        norse: 'Trading Post',           mesop: 'Grand Bazaar'           },
}

export function getBuildingName(plotId, assetKey) {
  const entry = BUILDING_NAMES[plotId]
  if (entry) return entry[assetKey] || plotId
  return plotId
}

// ── Profession data for modal display ─────────────────────────────────────────

export const PROFESSION_DATA = {
  stewardship:   { bonusLabel: 'Energy Regen',       bonusAtMax: '+150%', establishCost: 500,    levelReq: 20 },
  ritual:        { bonusLabel: 'Health Regen',        bonusAtMax: '+150%', establishCost: 500,    levelReq: 20 },
  commerce:      { bonusLabel: 'Drachma & Temples',   bonusAtMax: '+120%', establishCost: 2000,   levelReq: 25 },
  divination:    { bonusLabel: 'XP Gain',             bonusAtMax: '+100%', establishCost: 7500,   levelReq: 35 },
  exploration:   { bonusLabel: 'Adventure Rewards',   bonusAtMax: '+100%', establishCost: 10000,  levelReq: 40 },
  fortification: { bonusLabel: 'Defense',             bonusAtMax: '+100',  establishCost: 20000,  levelReq: 45 },
  warfare:       { bonusLabel: 'Attack',              bonusAtMax: '+100',  establishCost: 20000,  levelReq: 50 },
  craftsmanship: { bonusLabel: 'Crafting Cycles',     bonusAtMax: '—',     establishCost: 30000,  levelReq: 60 },
}

// ── Temple data for modal display ──────────────────────────────────────────────

export const TEMPLE_DATA = {
  roadside_shrine:  { name: 'Roadside Shrine',  incomePerHr: 10,   levelReq: 1,  maxLevel: 25 },
  minor_temple:     { name: 'Minor Temple',      incomePerHr: 40,   levelReq: 10, maxLevel: 25 },
  grand_temple:     { name: 'Grand Temple',      incomePerHr: 200,  levelReq: 25, maxLevel: 25 },
  divine_fortress:  { name: 'Divine Fortress',   incomePerHr: 1000, levelReq: 50, maxLevel: 25 },
  pantheon_citadel: { name: 'Pantheon Citadel',  incomePerHr: 4000, levelReq: 75, maxLevel: 25 },
}

// ── Player character sprite URLs ───────────────────────────────────────────────

export function getCharacterUrl(assetKey) {
  return `/pantheon_wars_assets/sprites/player_characters/${FACTION_FOLDER[assetKey]}/char_${assetKey}_idle.png`
}

export function getCharacterWalkUrl(assetKey) {
  return `/pantheon_wars_assets/sprites/player_characters/${FACTION_FOLDER[assetKey]}/char_${assetKey}_walk.png`
}

// ── NPC sprite URLs ────────────────────────────────────────────────────────────
// type: 'villager' | 'animal'   variant: 'idle' | 'walk'

export function getNPCUrl(assetKey, type, variant) {
  const folder = FACTION_FOLDER[assetKey]
  return `/pantheon_wars_assets/sprites/npc/${folder}/npc_${assetKey}_${type}_${variant}.png`
}

// ── Atmosphere extras URLs ─────────────────────────────────────────────────────
// name: 'birds' | 'smoke' | 'fire' | 'ashes' | 'enviroparticles'

export function getExtrasUrl(assetKey, name) {
  const folder = FACTION_FOLDER[assetKey]
  return `/pantheon_wars_assets/extras/${folder}/extra_${name}_${assetKey}.png`
}

// ── Tooltip info helper ────────────────────────────────────────────────────────

export function getTooltipInfo(plot, assetKey, townships, templeData) {
  if (plot.templeType) {
    const owned = (templeData?.owned || []).find(t => t.temple_type === plot.templeType)
    if (!owned) return { name: 'Sacred Ground', levelText: 'Unoccupied', isUpgrading: false }
    const td = TEMPLE_DATA[plot.templeType]
    return {
      name:        td?.name || plot.templeType,
      levelText:   `Lv. ${owned.upgrade_level}`,
      isUpgrading: false,
    }
  }

  if (plot.id === 'embassy') return { name: getBuildingName('embassy', assetKey), levelText: 'Alliance', isUpgrading: false }
  if (plot.id === 'shop')    return { name: getBuildingName('shop', assetKey),    levelText: 'Shop',     isUpgrading: false }

  if (plot.id === 'townhall') {
    const tier = getTownhallTier(townships)
    return { name: getBuildingName('townhall', assetKey), levelText: `Stage ${tier}`, isUpgrading: false }
  }

  const t = (townships || []).find(t => t.type === plot.id)
  if (!t || !t.is_owned) {
    return { name: getBuildingName(plot.id, assetKey), levelText: 'Not Established', isUpgrading: false }
  }
  return {
    name:        getBuildingName(plot.id, assetKey),
    levelText:   `Lv. ${t.current_level}`,
    isUpgrading: !!t.is_upgrading,
  }
}

export function getBuildingAriaLabel(plot, assetKey, townships, templeData) {
  if (plot.templeType) {
    const td    = TEMPLE_DATA[plot.templeType]
    const owned = (templeData?.owned || []).find(t => t.temple_type === plot.templeType)
    if (!owned) return `${td?.name || 'Sacred Ground'} - Not established`
    return `${td?.name || plot.templeType} - Level ${owned.upgrade_level}`
  }
  const name = getBuildingName(plot.id, assetKey) || plot.id
  if (plot.id === 'townhall') return `${name} - Stage ${getTownhallTier(townships)}`
  if (plot.id === 'embassy')  return `${name} - Alliance Hub`
  if (plot.id === 'shop')     return `${name} - Open Shop`
  const t = (townships || []).find(t => t.type === plot.id)
  if (!t || !t.is_owned) return `${name} - Not established`
  return `${name} - Level ${t.current_level}`
}

export async function preloadImages(srcs) {
  await Promise.all(
    srcs.filter(Boolean).map(
      src => new Promise(resolve => {
        const img = new Image()
        img.onload = resolve
        img.onerror = resolve
        img.src = src
      })
    )
  )
}
