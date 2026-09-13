import { AttackType, Enemy, MapNode, NodeType, TacticalPosition } from '../types/game';
import { BIOMES } from '../data/biomes';

export interface WorldMapState {
  biomeId: string;
  nodes: MapNode[];
  currentNodeId: string;
  stepsTaken: number;
  areaTimeMinutes: number;
}

// Procedural generation of world map nodes with branching paths and distance from start
export function generateProceduralWorldMap(biomeId: string, _difficultyMultiplier: number = 1.0): WorldMapState {
  const currentBiome = BIOMES.find((b) => b.id === biomeId) || BIOMES[0];
  const nodes: MapNode[] = [];

  // Start node
  const startNode: MapNode = {
    id: 'node_start',
    x: 6,
    y: 50,
    type: 'start',
    name: 'Sanctuary of Awakening',
    description: `The dimensional rift entry of ${currentBiome.name}. Prepare your party before delving into the unknown.`,
    connectedTo: [],
    completed: true,
    revealed: true,
    biomeId,
    threatLevel: 1,
  };
  nodes.push(startNode);

  // Layers from start to boss: 8 distinct exploration stages
  const layerColumns = [16, 27, 38, 49, 60, 71, 82, 90];
  const layerConfigs: { count: number; types: NodeType[] }[] = [
    { count: 3, types: ['battle', 'battle', 'shrine'] },
    { count: 3, types: ['battle', 'merchant', 'treasure'] },
    { count: 4, types: ['dungeon', 'elite', 'battle', 'camp'] },
    { count: 3, types: ['battle', 'shrine', 'treasure'] },
    { count: 4, types: ['merchant', 'camp', 'battle', 'dungeon'] },
    { count: 3, types: ['elite', 'battle', 'shrine'] },
    { count: 4, types: ['dungeon', 'treasure', 'camp', 'battle'] },
    { count: 3, types: ['elite', 'camp', 'merchant'] },
  ];

  let previousLayerIds: string[] = [startNode.id];

  layerConfigs.forEach((layer, layerIdx) => {
    const colX = layerColumns[layerIdx];
    const currentLayerIds: string[] = [];
    const stepY = 80 / (layer.count + 1);

    for (let i = 0; i < layer.count; i++) {
      const nodeId = `node_${layerIdx}_${i}`;
      const nodeY = 10 + stepY * (i + 1) + (Math.random() * 8 - 4);
      const nodeType = layer.types[i % layer.types.length];

      let name = 'Uncharted Outpost';
      let description = 'A mysterious crossroads in the wilderness.';
      if (nodeType === 'battle') {
        name = `Encounter: Wild beasts of ${currentBiome.name}`;
        description = 'A pack of corrupted territorial fiends guarding the path.';
      } else if (nodeType === 'elite') {
        name = `Apex Predator: Champion Fiend`;
        description = 'A fierce, mutated entity exuding dense aetheric pressure.';
      } else if (nodeType === 'dungeon') {
        name = `Dungeon: Forgotten Crypt of ${currentBiome.name}`;
        description = 'A high-risk underground labyrinth housing ancient dungeon guardians and rare persistent artifacts.';
      } else if (nodeType === 'camp') {
        name = 'Campfire Oasis';
        description = 'A secluded safe haven to rest, heal party wounds, spend JP & AP, and calibrate gear.';
      } else if (nodeType === 'shrine') {
        name = 'Astral Monolith';
        description = 'An ancient runic altar offering blessings or temporal boons.';
      } else if (nodeType === 'merchant') {
        name = 'Nomadic Chrono Trader';
        description = 'A planar peddler offering weapons, armor, and temporal trinkets.';
      } else if (nodeType === 'treasure') {
        name = 'Overgrown Vault Chest';
        description = 'A sealed treasure coffer waiting to be scavenged.';
      }

      const threatLevel = 1 + Math.floor(layerIdx * 1.2) + Math.floor(Math.random() * 2);

      const newNode: MapNode = {
        id: nodeId,
        x: colX,
        y: Math.max(12, Math.min(88, nodeY)),
        type: nodeType,
        name,
        description,
        connectedTo: [],
        completed: false,
        revealed: layerIdx === 0, // reveal first layer immediately
        biomeId,
        threatLevel,
      };

      nodes.push(newNode);
      currentLayerIds.push(nodeId);
    }

    // Connect previous layer to this layer (guaranteeing at least 1 connection each)
    previousLayerIds.forEach((prevId) => {
      const prevNode = nodes.find((n) => n.id === prevId)!;
      // Connect to 1 or 2 closest nodes in current layer
      const sortedByY = [...currentLayerIds].sort((a, b) => {
        const na = nodes.find((n) => n.id === a)!;
        const nb = nodes.find((n) => n.id === b)!;
        return Math.abs(na.y - prevNode.y) - Math.abs(nb.y - prevNode.y);
      });

      const targets = sortedByY.slice(0, Math.random() < 0.5 ? 1 : 2);
      targets.forEach((t) => {
        if (!prevNode.connectedTo.includes(t)) {
          prevNode.connectedTo.push(t);
        }
      });
    });

    // Ensure all current layer nodes have an incoming connection
    currentLayerIds.forEach((currId) => {
      const hasIncoming = nodes.some((n) => n.connectedTo.includes(currId));
      if (!hasIncoming) {
        const randomPrev = previousLayerIds[Math.floor(Math.random() * previousLayerIds.length)];
        nodes.find((n) => n.id === randomPrev)!.connectedTo.push(currId);
      }
    });

    previousLayerIds = currentLayerIds;
  });

  // Boss node at final column
  const bossNode: MapNode = {
    id: 'node_boss',
    x: 96,
    y: 50,
    type: 'boss',
    name: `Lair of ${currentBiome.bossName}`,
    description: `The epicenter of ${currentBiome.name}. Defeat this supreme entity to unlock subsequent biomes and claim persistent artifacts!`,
    connectedTo: [],
    completed: false,
    revealed: false,
    biomeId,
    threatLevel: 10,
  };
  nodes.push(bossNode);

  // Connect last layer nodes to boss
  previousLayerIds.forEach((prevId) => {
    nodes.find((n) => n.id === prevId)!.connectedTo.push(bossNode.id);
  });

  return {
    biomeId,
    nodes,
    currentNodeId: startNode.id,
    stepsTaken: 0,
    areaTimeMinutes: 1,
  };
}

// Dynamic scaling formula:
// Scales monster level & attributes based on:
// 1. Biome's base progression level
// 2. Distance from starting node (steps taken and threat level)
// 3. Time spent within current area (areaTimeMinutes)
export function calculateDynamicLevel(
  biomeBaseLevel: number,
  nodeThreatLevel: number,
  stepsTaken: number,
  areaTimeMinutes: number
): number {
  const distanceScaling = (nodeThreatLevel - 1) * 0.8 + stepsTaken * 0.3;
  const timeScaling = Math.floor(areaTimeMinutes / 3) * 0.5; // Every 3 min or equivalent time increases threat
  const finalLevel = Math.max(1, Math.round(biomeBaseLevel + distanceScaling + timeScaling));
  return finalLevel;
}

const ALL_ELEMENTS: AttackType[] = ['fire', 'ice', 'lightning', 'earth', 'wind', 'light', 'dark', 'slash', 'strike', 'pierce'];

export function generateEnemiesForNode(
  node: MapNode,
  biomeId: string,
  stepsTaken: number,
  areaTimeMinutes: number
): Enemy[] {
  const currentBiome = BIOMES.find((b) => b.id === biomeId) || BIOMES[0];
  const dynamicLvl = calculateDynamicLevel(currentBiome.baseLevel, node.threatLevel, stepsTaken, areaTimeMinutes);

  if (node.type === 'boss') {
    return [generateBossEnemy(currentBiome.bossName, dynamicLvl + 2, false)];
  }

  if (node.type === 'dungeon') {
    const dungeonBoss = generateBossEnemy(`${currentBiome.name} Crypt Guardian`, dynamicLvl + 1, true);
    const minion = generateProceduralEnemy(biomeId, dynamicLvl, 'front', true);
    return [dungeonBoss, minion];
  }

  const isElite = node.type === 'elite';
  const enemyCount = isElite ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 3) + 1;

  const enemies: Enemy[] = [];
  const positions: TacticalPosition[] = ['front', 'mid', 'back'];

  for (let i = 0; i < enemyCount; i++) {
    const isSpecial = isElite && i === 0;
    const lvl = isSpecial ? dynamicLvl + 1 : dynamicLvl;
    const pos = positions[i % positions.length];
    enemies.push(generateProceduralEnemy(biomeId, lvl, pos, isSpecial));
  }

  return enemies;
}

const MONSTER_PREFIXES: Record<string, string[]> = {
  verdant_canopy: ['Thorn-Weaver', 'Bark-Hide', 'Spore-Caller', 'Gloom-Stalker', 'Sylvan'],
  molten_crags: ['Cinder-Claw', 'Magma-Gorged', 'Ash-Strider', 'Obsidian', 'Pyre-Born'],
  sunken_ruins: ['Abyssal', 'Tide-Terror', 'Barnacle-Crusted', 'Drowned', 'Siren-Cursed'],
  astral_void: ['Void-Touched', 'Chrono-Drifter', 'Cosmic', 'Phase-Shifting', 'Singularity'],
};

const MONSTER_SPECIES = ['Stalker', 'Sentinel', 'Drake', 'Shaman', 'Gorgon', 'Construct', 'Warden'];

export function generateProceduralEnemy(
  biomeId: string,
  level: number,
  position: TacticalPosition,
  isElite: boolean = false
): Enemy {
  const prefixes = MONSTER_PREFIXES[biomeId] || MONSTER_PREFIXES.verdant_canopy;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const species = MONSTER_SPECIES[Math.floor(Math.random() * MONSTER_SPECIES.length)];
  const name = `${isElite ? 'Dread ' : ''}${prefix} ${species}`;

  // Elemental weaknesses: pick 2 to 3 distinct weaknesses
  const shuffledWeaknesses = [...ALL_ELEMENTS].sort(() => Math.random() - 0.5);
  const weaknessCount = isElite ? 3 : 2;
  const weaknesses = shuffledWeaknesses.slice(0, weaknessCount);

  const statMult = isElite ? 1.7 : 1.0;
  const maxHp = Math.round((70 + level * 28) * statMult);
  const atk = Math.round((10 + level * 3.2) * statMult);
  const mag = Math.round((9 + level * 3.0) * statMult);
  const def = Math.round((6 + level * 1.8) * statMult);
  const res = Math.round((5 + level * 1.7) * statMult);
  const spd = Math.round(7 + level * 0.8 + (position === 'mid' ? 2 : 0));
  const maxShields = isElite ? 5 + Math.floor(level / 3) : 3 + Math.floor(level / 4);

  // Skills
  const enemySkills: Enemy['skills'] = [
    {
      name: `${prefix} Swipe`,
      power: 1.0,
      element: 'physical',
      delay: 50,
      description: 'Standard physical attack.',
      targetType: 'single',
    },
    {
      name: `${species} Rupture`,
      power: 1.3,
      element: (weaknesses[0] === 'fire' ? 'ice' : 'fire') as AttackType,
      delay: 55,
      description: 'Elemental surge hitting frontline targets.',
      targetType: 'single',
      timeDelay: 15,
    },
  ];

  if (isElite) {
    enemySkills.push({
      name: 'Temporal Shockwave',
      power: 1.1,
      element: 'dark',
      delay: 65,
      description: 'Strikes all heroes and pushes their timeline recovery back.',
      targetType: 'all',
      timeDelay: 25,
    });
  }

  return {
    id: `enemy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    avatar: species,
    level,
    maxHp,
    hp: maxHp,
    atk,
    mag,
    def,
    res,
    spd,
    position,
    shields: maxShields,
    maxShields,
    weaknesses,
    revealedWeaknesses: [],
    isBroken: false,
    brokenDuration: 0,
    xpReward: Math.round((30 + level * 14) * (isElite ? 2.5 : 1)),
    jpReward: Math.round((20 + level * 8) * (isElite ? 2.2 : 1)),
    apReward: isElite ? 2 : 1,
    goldReward: Math.round((15 + level * 8) * (isElite ? 2.5 : 1)),
    skills: enemySkills,
    isElite,
    statusEffects: [],
  };
}

export function generateBossEnemy(bossName: string, level: number, isDungeonBoss: boolean = false): Enemy {
  const maxShields = 7 + Math.floor(level / 2);
  const maxHp = Math.round((350 + level * 95) * (isDungeonBoss ? 1.5 : 1.3));

  // Boss weaknesses: 3 diverse weaknesses
  const weaknesses: AttackType[] = ['fire', 'strike', 'light'];

  return {
    id: `boss_${Date.now()}`,
    name: bossName,
    avatar: 'Crown',
    level,
    maxHp,
    hp: maxHp,
    atk: Math.round(18 + level * 4.2),
    mag: Math.round(20 + level * 4.5),
    def: Math.round(15 + level * 2.8),
    res: Math.round(16 + level * 2.9),
    spd: Math.round(11 + level * 1.1),
    position: 'mid',
    shields: maxShields,
    maxShields,
    weaknesses,
    revealedWeaknesses: [],
    isBroken: false,
    brokenDuration: 0,
    xpReward: 200 + level * 60,
    jpReward: 150 + level * 40,
    apReward: 5,
    goldReward: 180 + level * 40,
    skills: [
      {
        name: 'Cataclysmic Fracture',
        power: 1.5,
        element: 'earth',
        delay: 50,
        description: 'Hits frontline heroes and shatters defense.',
        targetType: 'single',
      },
      {
        name: 'Temporal Cataclysm',
        power: 1.3,
        element: 'dark',
        delay: 60,
        description: 'Devastating time-warp wave delaying all heroes.',
        targetType: 'all',
        timeDelay: 35,
      },
      {
        name: 'Primal Judgment',
        power: 1.8,
        element: 'light',
        delay: 65,
        description: 'Concentrated beam of radiant judgment.',
        targetType: 'single',
      },
    ],
    isBoss: true,
    statusEffects: [],
  };
}
