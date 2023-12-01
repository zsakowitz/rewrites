// Sourced from https://github.com/iamcal/enchant-order/blob/main/data.js

export interface Item {
  readonly id: string
  readonly name: string
  readonly isBook: boolean
}

export const ALL_ITEMS = Object.freeze([
  { id: "book", name: "Book", isBook: true },

  { id: "helmet", name: "Helmet", isBook: false },
  { id: "chestplate", name: "Chestplate", isBook: false },
  { id: "leggings", name: "Leggings", isBook: false },
  { id: "boots", name: "Boots", isBook: false },
  { id: "turtle_shell", name: "Turtle Shell", isBook: false },
  { id: "elytra", name: "Elytra", isBook: false },

  { id: "sword", name: "Sword", isBook: false },
  { id: "axe", name: "Axe", isBook: false },
  { id: "trident", name: "Trident", isBook: false },
  { id: "pickaxe", name: "Pickaxe", isBook: false },
  { id: "shovel", name: "Shovel", isBook: false },
  { id: "hoe", name: "Hoe", isBook: false },
  { id: "bow", name: "Bow", isBook: false },
  { id: "shield", name: "Shield", isBook: false },
  { id: "crossbow", name: "Crossbow", isBook: false },
  { id: "brush", name: "Brush", isBook: false },

  { id: "fishing_rod", name: "Fishing Rod", isBook: false },
  { id: "shears", name: "Shears", isBook: false },
  { id: "flint_and_steel", name: "Flint and Steel", isBook: false },
  { id: "carrot_on_a_stick", name: "Carrot on a Stick", isBook: false },
  {
    id: "warped_fungus_on_a_stick",
    name: "Warped Fungus on a Stick",
    isBook: false,
  },
  { id: "pumpkin", name: "Pumpkin", isBook: false },
] as const) satisfies readonly Item[]

export interface Enchantment {
  readonly id: string
  readonly levelMax: number
  readonly weight: number
  readonly incompatible: readonly string[]
  readonly items: readonly string[]
}

export const ALL_ENCHANTMENTS = Object.freeze({
  aqua_affinity: {
    id: "aqua_affinity",
    levelMax: 1,
    weight: 2,
    incompatible: [],
    items: ["helmet", "turtle_shell"],
  },
  bane_of_arthropods: {
    id: "bane_of_arthropods",
    levelMax: 5,
    weight: 1,
    incompatible: ["smite", "sharpness"],
    items: ["sword", "axe"],
  },
  blast_protection: {
    id: "blast_protection",
    levelMax: 4,
    weight: 2,
    incompatible: ["fire_protection", "protection", "projectile_protection"],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
  },
  channeling: {
    id: "channeling",
    levelMax: 1,
    weight: 4,
    incompatible: ["riptide"],
    items: ["trident"],
  },
  depth_strider: {
    id: "depth_strider",
    levelMax: 3,
    weight: 2,
    incompatible: ["frost_walker"],
    items: ["boots"],
  },
  efficiency: {
    id: "efficiency",
    levelMax: 5,
    weight: 1,
    incompatible: [],
    items: ["pickaxe", "shovel", "axe", "hoe", "shears"],
  },
  feather_falling: {
    id: "feather_falling",
    levelMax: 4,
    weight: 1,
    incompatible: [],
    items: ["boots"],
  },
  fire_aspect: {
    id: "fire_aspect",
    levelMax: 2,
    weight: 2,
    incompatible: [],
    items: ["sword"],
  },
  fire_protection: {
    id: "fire_protection",
    levelMax: 4,
    weight: 1,
    incompatible: ["blast_protection", "protection", "projectile_protection"],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
  },
  flame: {
    id: "flame",
    levelMax: 1,
    weight: 2,
    incompatible: [],
    items: ["bow"],
  },
  fortune: {
    id: "fortune",
    levelMax: 3,
    weight: 2,
    incompatible: ["silk_touch"],
    items: ["pickaxe", "shovel", "axe", "hoe"],
  },
  frost_walker: {
    id: "frost_walker",
    levelMax: 2,
    weight: 2,
    incompatible: ["depth_strider"],
    items: ["boots"],
  },
  impaling: {
    id: "impaling",
    levelMax: 5,
    weight: 2,
    incompatible: [],
    items: ["trident"],
  },
  infinity: {
    id: "infinity",
    levelMax: 1,
    weight: 4,
    incompatible: ["mending"],
    items: ["bow"],
  },
  knockback: {
    id: "knockback",
    levelMax: 2,
    weight: 1,
    incompatible: [],
    items: ["sword"],
  },
  looting: {
    id: "looting",
    levelMax: 3,
    weight: 2,
    incompatible: [],
    items: ["sword"],
  },
  loyalty: {
    id: "loyalty",
    levelMax: 3,
    weight: 1,
    incompatible: ["riptide"],
    items: ["trident"],
  },
  luck_of_the_sea: {
    id: "luck_of_the_sea",
    levelMax: 3,
    weight: 2,
    incompatible: [],
    items: ["fishing_rod"],
  },
  lure: {
    id: "lure",
    levelMax: 3,
    weight: 2,
    incompatible: [],
    items: ["fishing_rod"],
  },
  mending: {
    id: "mending",
    levelMax: 1,
    weight: 2,
    incompatible: ["infinity"],
    items: [
      "helmet",
      "chestplate",
      "leggings",
      "boots",
      "pickaxe",
      "shovel",
      "axe",
      "sword",
      "hoe",
      "brush",
      "fishing_rod",
      "bow",
      "shears",
      "flint_and_steel",
      "carrot_on_a_stick",
      "warped_fungus_on_a_stick",
      "shield",
      "elytra",
      "trident",
      "turtle_shell",
      "crossbow",
    ],
  },
  multishot: {
    id: "multishot",
    levelMax: 1,
    weight: 2,
    incompatible: ["piercing"],
    items: ["crossbow"],
  },
  piercing: {
    id: "piercing",
    levelMax: 4,
    weight: 1,
    incompatible: ["multishot"],
    items: ["crossbow"],
  },
  power: {
    id: "power",
    levelMax: 5,
    weight: 1,
    incompatible: [],
    items: ["bow"],
  },
  projectile_protection: {
    id: "projectile_protection",
    levelMax: 4,
    weight: 1,
    incompatible: ["protection", "blast_protection", "fire_protection"],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
  },
  protection: {
    id: "protection",
    levelMax: 4,
    weight: 1,
    incompatible: [
      "blast_protection",
      "fire_protection",
      "projectile_protection",
    ],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
  },
  punch: {
    id: "punch",
    levelMax: 2,
    weight: 2,
    incompatible: [],
    items: ["bow"],
  },
  quick_charge: {
    id: "quick_charge",
    levelMax: 3,
    weight: 1,
    incompatible: [],
    items: ["crossbow"],
  },
  respiration: {
    id: "respiration",
    levelMax: 3,
    weight: 2,
    incompatible: [],
    items: ["helmet", "turtle_shell"],
  },
  riptide: {
    id: "riptide",
    levelMax: 3,
    weight: 2,
    incompatible: ["channeling", "loyalty"],
    items: ["trident"],
  },
  sharpness: {
    id: "sharpness",
    levelMax: 5,
    weight: 1,
    incompatible: ["bane_of_arthropods", "smite"],
    items: ["sword", "axe"],
  },
  silk_touch: {
    id: "silk_touch",
    levelMax: 1,
    weight: 4,
    incompatible: ["fortune"],
    items: ["pickaxe", "shovel", "axe", "hoe"],
  },
  smite: {
    id: "smite",
    levelMax: 5,
    weight: 1,
    incompatible: ["bane_of_arthropods", "sharpness"],
    items: ["sword", "axe"],
  },
  soul_speed: {
    id: "soul_speed",
    levelMax: 3,
    weight: 4,
    incompatible: [],
    items: ["boots"],
  },
  sweeping: {
    id: "sweeping",
    levelMax: 3,
    weight: 2,
    incompatible: [],
    items: ["sword"],
  },
  swift_sneak: {
    id: "swift_sneak",
    levelMax: 3,
    weight: 4,
    incompatible: [],
    items: ["leggings"],
  },
  thorns: {
    id: "thorns",
    levelMax: 3,
    weight: 4,
    incompatible: [],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
  },
  unbreaking: {
    id: "unbreaking",
    levelMax: 3,
    weight: 1,
    incompatible: [],
    items: [
      "helmet",
      "chestplate",
      "leggings",
      "boots",
      "pickaxe",
      "shovel",
      "axe",
      "sword",
      "hoe",
      "brush",
      "fishing_rod",
      "bow",
      "shears",
      "flint_and_steel",
      "carrot_on_a_stick",
      "warped_fungus_on_a_stick",
      "shield",
      "elytra",
      "trident",
      "turtle_shell",
      "crossbow",
    ],
  },
  binding_curse: {
    id: "binding_curse",
    levelMax: 1,
    weight: 4,
    incompatible: [],
    items: [
      "helmet",
      "chestplate",
      "leggings",
      "boots",
      "elytra",
      "pumpkin",
      "helmet",
      "turtle_shell",
    ],
  },
  vanishing_curse: {
    id: "vanishing_curse",
    levelMax: 1,
    weight: 4,
    incompatible: [],
    items: [
      "helmet",
      "chestplate",
      "leggings",
      "boots",
      "pickaxe",
      "shovel",
      "axe",
      "sword",
      "hoe",
      "brush",
      "fishing_rod",
      "bow",
      "shears",
      "flint_and_steel",
      "carrot_on_a_stick",
      "warped_fungus_on_a_stick",
      "shield",
      "elytra",
      "pumpkin",
      "helmet",
      "trident",
      "turtle_shell",
      "crossbow",
    ],
  },
}) satisfies Record<string, Enchantment>

export interface EnchantedItem {
  item: Item
  enchantments: Enchantment[]
  xpUsed: number
  workFactor: number
}

export interface ReadonlyEnchantedItem {
  readonly item: Item
  readonly enchantments: readonly Enchantment[]
  readonly xpUsed: number
  readonly workFactor: number
}

export function combine(
  target: ReadonlyEnchantedItem,
  sacrifice: ReadonlyEnchantedItem,
): ReadonlyEnchantedItem {
  throw new Error("todo")
}
