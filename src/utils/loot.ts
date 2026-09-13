import { EquipmentItem, ItemAffix, ItemRarity, ItemSlot, Stats } from '../types/game';

const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 60,
  uncommon: 30,
  rare: 15,
  epic: 6,
  legendary: 2,
  mythic: 0.5,
};

const RARITY_ORDER: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export function getAvailableRarities(maxRarity: ItemRarity): ItemRarity[] {
  const maxIdx = RARITY_ORDER.indexOf(maxRarity);
  return RARITY_ORDER.slice(0, maxIdx + 1);
}

export function rollRarity(maxRarity: ItemRarity, isBoss: boolean = false): ItemRarity {
  const available = getAvailableRarities(maxRarity);
  if (isBoss) {
    // Boss guarantees at least rare or highest available
    if (available.includes('epic') && Math.random() < 0.5) return 'epic';
    if (available.includes('rare')) return 'rare';
    return available[available.length - 1];
  }

  let totalWeight = 0;
  available.forEach((r) => {
    totalWeight += RARITY_WEIGHTS[r];
  });

  let roll = Math.random() * totalWeight;
  for (const r of available) {
    if (roll < RARITY_WEIGHTS[r]) {
      return r;
    }
    roll -= RARITY_WEIGHTS[r];
  }
  return available[0];
}

const WEAPON_NAMES: Record<ItemRarity, string[]> = {
  common: ['Rusty Broadsword', 'Novice Staff', 'Short Bow', 'Iron Dagger', 'Simple Mace'],
  uncommon: ['Steel Claymore', 'Arcane Focus', 'Composite Recurve', 'Shadow Stiletto', 'Heavy Flail'],
  rare: ['Rune-Etched Cleaver', 'Spire Crystal Wand', 'Windshear Bow', 'Chrono Dagger', 'Templar Warhammer'],
  epic: ['Blade of the Temporal Rift', 'Aetheric Astral Staff', 'Stormcaller Greatbow', 'Voidfang Kris', 'Solar Aegis Gavel'],
  legendary: ['Chronos Sovereign Edge', 'Singularity Arch-Staff', 'Fateweaver Heart-Piercer', 'Eclipse Shadowblade', 'World-Breaker Maul'],
  mythic: ['Ouroboros Eternity Blade', 'Genesis Primordial Catalyst', 'Infinity Bow of the Void', 'Cosmic Dilation Edge', 'Pillar of the Cosmos'],
};

const ARMOR_NAMES: Record<ItemRarity, string[]> = {
  common: ['Padded Tunic', 'Worn Leather Vest', 'Copper Chainmail', 'Cloth Vestment'],
  uncommon: ['Reinforced Hauberk', 'Studded Brigandine', 'Runed Vestment', 'Scaled Plate'],
  rare: ['Gryphon Mantle', 'Ironclad Carapace', 'Silversilk Robes', 'Dreadnought Cuirass'],
  epic: ['Temporal Mail of Agility', 'Prismatic Aegis Robe', 'Titanium Dread-Plate', 'Shadow-Cloaked Carapace'],
  legendary: ['Astral Sovereign Plate', 'Phoenix-Feather Raiment', 'Void-Forged Bulwark', 'Weaver of Realities Coat'],
  mythic: ['Chronos Unyielding Aegis', 'God-King Prismatic Regalia', 'Infinity Star-Woven Mail'],
};

const ACCESSORY_NAMES: Record<ItemRarity, string[]> = {
  common: ['Brass Ring', 'Bone Talisman', 'Carved Wooden Pendant', 'Simple Leather Band'],
  uncommon: ['Silver Signet', 'Amber Choker', 'Falcon Feather Charm', 'Garnet Loop'],
  rare: ['Chrono-Pebble Ring', 'Aether Vial Pendant', 'Ring of Quickening', 'Ward of Tenacity'],
  epic: ['Time-Weaver Band', 'Opal of Spatial Distortion', 'Prismatic Heart Pendant', 'Amulet of the Eclipse'],
  legendary: ['Eye of the Chronos God', 'Band of Eternal Velocity', 'Core of Singularity', 'Crest of Infinite Wills'],
  mythic: ['Crown of the Omniscient', 'Tears of the Primordial Titan', 'Ring of Infinite Timelines'],
};

export function generateLootItem(
  level: number,
  maxRarity: ItemRarity = 'uncommon',
  isBoss: boolean = false,
  preferredSlot?: ItemSlot
): EquipmentItem {
  const rarity = rollRarity(maxRarity, isBoss);
  const slots: ItemSlot[] = ['weapon', 'armor', 'accessory'];
  const slot = preferredSlot || slots[Math.floor(Math.random() * slots.length)];

  let nameList: string[] = [];
  if (slot === 'weapon') nameList = WEAPON_NAMES[rarity];
  else if (slot === 'armor') nameList = ARMOR_NAMES[rarity];
  else nameList = ACCESSORY_NAMES[rarity];

  const baseName = nameList[Math.floor(Math.random() * nameList.length)];
  const rarityMultiplier: Record<ItemRarity, number> = {
    common: 1.0,
    uncommon: 1.4,
    rare: 2.0,
    epic: 2.9,
    legendary: 4.2,
    mythic: 6.5,
  };

  const mult = rarityMultiplier[rarity];
  const stats: Partial<Stats> = {};

  if (slot === 'weapon') {
    stats.atk = Math.round((6 + level * 2.5) * mult);
    stats.mag = Math.round((5 + level * 2.3) * mult);
    if (['rare', 'epic', 'legendary', 'mythic'].includes(rarity)) {
      stats.critRate = Math.min(0.35, 0.05 + Math.random() * 0.12 * mult);
    }
  } else if (slot === 'armor') {
    stats.def = Math.round((5 + level * 2.2) * mult);
    stats.res = Math.round((4 + level * 2.0) * mult);
    stats.maxHp = Math.round((25 + level * 10) * mult);
  } else {
    stats.spd = Math.round((3 + level * 1.2) * mult);
    stats.maxMp = Math.round((15 + level * 6) * mult);
    stats.maxHp = Math.round((20 + level * 8) * mult);
  }

  // Generate affixes based on rarity
  const affixes: ItemAffix[] = [];
  const affixCountMap: Record<ItemRarity, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    mythic: 5,
  };
  const count = affixCountMap[rarity];

  const possibleAffixes: { stat: ItemAffix['stat']; desc: (v: number) => string; val: () => number }[] = [
    { stat: 'shieldBreak', desc: (v) => `+${v} Shield Damage on Break attacks`, val: () => Math.floor(1 + Math.random() * 2) },
    { stat: 'timeSpeed', desc: (v) => `+${v}% Turn Timeline Acceleration`, val: () => Math.round(5 + Math.random() * 15 * mult) },
    { stat: 'fireDmg', desc: (v) => `+${v}% Fire Affinity Power`, val: () => Math.round(10 + Math.random() * 15 * mult) },
    { stat: 'iceDmg', desc: (v) => `+${v}% Ice & Time Stasis Power`, val: () => Math.round(10 + Math.random() * 15 * mult) },
    { stat: 'mpCostReduce', desc: (v) => `-${v} MP cost on all abilities`, val: () => Math.floor(2 + Math.random() * 4) },
    { stat: 'critRate', desc: (v) => `+${Math.round(v * 100)}% Critical Chance`, val: () => Math.round(0.04 + Math.random() * 0.08) },
  ];

  for (let i = 0; i < count; i++) {
    const pick = possibleAffixes[i % possibleAffixes.length];
    const val = pick.val();
    affixes.push({
      stat: pick.stat,
      value: val,
      description: pick.desc(val),
    });
  }

  // Base Aether value for rebirth conversion
  const baseValueMap: Record<ItemRarity, number> = {
    common: 15,
    uncommon: 35,
    rare: 80,
    epic: 190,
    legendary: 450,
    mythic: 1000,
  };
  const value = Math.round(baseValueMap[rarity] + level * 6);

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: baseName,
    slot,
    rarity,
    stats,
    affixes,
    value,
    levelReq: level,
    description: `A ${rarity} grade ${slot} discovered in the uncharted wilds. Alters combat efficiency and can be converted to ${value} Aether upon Rebirth.`,
  };
}

export function getRarityBadgeColor(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common':
      return 'text-slate-400 bg-slate-800/80 border-slate-700';
    case 'uncommon':
      return 'text-emerald-400 bg-emerald-950/60 border-emerald-700';
    case 'rare':
      return 'text-sky-400 bg-sky-950/60 border-sky-700';
    case 'epic':
      return 'text-purple-400 bg-purple-950/60 border-purple-700 shadow-sm shadow-purple-900/40';
    case 'legendary':
      return 'text-amber-400 bg-amber-950/60 border-amber-600 shadow-md shadow-amber-900/40';
    case 'mythic':
      return 'text-rose-300 bg-gradient-to-r from-rose-950/80 via-purple-950/80 to-amber-950/80 border-rose-500 shadow-lg shadow-rose-900/50 animate-pulse';
  }
}
