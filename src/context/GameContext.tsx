import React, { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react';
import {
  EquipmentItem,
  HeroCharacter,
  ItemRarity,
  PersistentArtifact,
  Stats,
  MapNode,
  Enemy,
  TimelineActor,
  TacticalPosition,
  AttackType,
} from '../types/game';
import { INITIAL_JOBS } from '../data/jobs';
import { BIOMES } from '../data/biomes';
import { PERSISTENT_ARTIFACTS } from '../data/artifacts';
import { INITIAL_RESEARCH_NODES } from '../data/research';
import { generateEnemiesForNode, generateProceduralWorldMap, WorldMapState } from '../utils/generator';
import { generateLootItem } from '../utils/loot';
import { sound } from '../utils/audio';
import { getEffectiveStats } from '../utils/stats';

const STORAGE_KEY = 'chrono_rpg_meta_save_v1';

export interface CombatState {
  enemies: Enemy[];
  timeline: TimelineActor[];
  currentTurnActorId: string | null;
  activeHeroId: string | null;
  combatLog: string[];
  isVictory: boolean;
  isDefeat: boolean;
  activeNode: MapNode;
  rewardsPending?: {
    xp: number;
    jp: number;
    ap: number;
    gold: number;
    loot: EquipmentItem[];
    artifact?: PersistentArtifact;
  };
}

interface GameContextType {
  // Meta Progression
  aetherShards: number;
  runsAttempted: number;
  runsCompleted: number;
  unlockedBiomes: string[];
  unlockedJobs: string[];
  unlockedMaxRarity: ItemRarity;
  unlockedArtifactSlots: number;
  inventoryCapacity: number;
  startingGoldBonus: number;
  startingApBonus: number;
  persistentArtifactsVault: PersistentArtifact[];
  completedResearchIds: string[];
  unlockResearchNode: (nodeId: string) => void;

  // Active Run
  isRunActive: boolean;
  selectedBiomeId: string;
  party: HeroCharacter[];
  bagInventory: EquipmentItem[];
  runGold: number;
  worldMap: WorldMapState | null;
  timeSpentMinutes: number;

  // Active Modals & Combat
  combat: CombatState | null;
  activeModal: 'party_sheet' | 'inventory' | 'research' | 'dungeon' | 'merchant' | 'camp' | 'sanctuary' | 'run_summary' | null;
  setActiveModal: (modal: 'party_sheet' | 'inventory' | 'research' | 'dungeon' | 'merchant' | 'camp' | 'sanctuary' | 'run_summary' | null) => void;
  selectedHeroId: string;
  setSelectedHeroId: (id: string) => void;
  activeDungeonNode: MapNode | null;
  setActiveDungeonNode: (node: MapNode | null) => void;

  // Actions
  startNewRun: (biomeId: string, partySetup: { heroId: string; name: string; avatar: string; jobId: string }[]) => void;
  moveToNode: (nodeId: string) => void;
  enterDungeonCombat: () => void;
  rebirthRun: (wasDefeat?: boolean) => void;

  // Camp & Sanctuary Actions
  applyCampRest: () => void;
  applyCampTraining: () => void;
  applyCampAttune: () => void;
  applySanctuaryBlessing: () => void;
  applySanctuaryInfusion: () => void;
  applySanctuaryRelic: () => EquipmentItem | null;
  
  // Hero Management
  learnSkill: (heroId: string, skillId: string) => void;
  learnPassive: (heroId: string, passiveId: string) => void;
  changeHeroJob: (heroId: string, newJobId: string) => void;
  equipItem: (heroId: string, item: EquipmentItem) => void;
  unequipItem: (heroId: string, slot: 'weapon' | 'armor' | 'accessory') => void;
  equipArtifact: (heroId: string, artifact: PersistentArtifact) => void;
  unequipArtifact: (heroId: string, artifactId: string) => void;
  discardItem: (itemId: string) => void;
  shiftHeroPosition: (heroId: string, newPos: TacticalPosition) => void;
  buyShopItem: (item: EquipmentItem) => void;

  // Combat Actions
  executeHeroAction: (skillId: string, targetId: string) => void;
  executeBasicAttack: (targetId: string) => void;
  executeDefend: () => void;
  forceAdvanceTimeline: () => void;
  collectCombatRewards: (openPartySheet?: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, startTransition] = useTransition();
  const enemyTurnTimeoutRef = useRef<any>(null);
  const isVictoryHandledRef = useRef<boolean>(false);
  const isCollectingRewardsRef = useRef<boolean>(false);

  // Load Meta Progression
  const [aetherShards, setAetherShards] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).aetherShards ?? 150; // Starting gift for new players
    } catch {}
    return 150;
  });

  const [runsAttempted, setRunsAttempted] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).runsAttempted ?? 0;
    } catch {}
    return 0;
  });

  const [runsCompleted, setRunsCompleted] = useState<number>(0);

  const [unlockedBiomes, setUnlockedBiomes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).unlockedBiomes ?? ['verdant_canopy'];
    } catch {}
    return ['verdant_canopy'];
  });

  const [unlockedJobs, setUnlockedJobs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).unlockedJobs ?? ['warrior', 'mage', 'healer'];
    } catch {}
    return ['warrior', 'mage', 'healer'];
  });

  const [unlockedMaxRarity, setUnlockedMaxRarity] = useState<ItemRarity>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).unlockedMaxRarity ?? 'uncommon';
    } catch {}
    return 'uncommon';
  });

  const [unlockedArtifactSlots, setUnlockedArtifactSlots] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).unlockedArtifactSlots ?? 1;
    } catch {}
    return 1;
  });

  const [inventoryCapacity, setInventoryCapacity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).inventoryCapacity ?? 10;
    } catch {}
    return 10;
  });

  const [startingGoldBonus, setStartingGoldBonus] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).startingGoldBonus ?? 50;
    } catch {}
    return 50;
  });

  const [startingApBonus, setStartingApBonus] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).startingApBonus ?? 0;
    } catch {}
    return 0;
  });

  const [persistentArtifactsVault, setPersistentArtifactsVault] = useState<PersistentArtifact[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).persistentArtifactsVault) {
        return JSON.parse(saved).persistentArtifactsVault;
      }
    } catch {}
    return [PERSISTENT_ARTIFACTS[0]]; // Initial heirloom: Hourglass of the First Dawn
  });

  const [completedResearchIds, setCompletedResearchIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).completedResearchIds ?? [];
    } catch {}
    return [];
  });

  // Save Meta Progression automatically
  useEffect(() => {
    const metaData = {
      aetherShards,
      runsAttempted,
      runsCompleted,
      unlockedBiomes,
      unlockedJobs,
      unlockedMaxRarity,
      unlockedArtifactSlots,
      inventoryCapacity,
      startingGoldBonus,
      startingApBonus,
      persistentArtifactsVault,
      completedResearchIds,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metaData));
    } catch {}
  }, [
    aetherShards,
    runsAttempted,
    runsCompleted,
    unlockedBiomes,
    unlockedJobs,
    unlockedMaxRarity,
    unlockedArtifactSlots,
    inventoryCapacity,
    startingGoldBonus,
    startingApBonus,
    persistentArtifactsVault,
    completedResearchIds,
  ]);

  // Active Run State
  const [isRunActive, setIsRunActive] = useState<boolean>(false);
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>('verdant_canopy');
  const [party, setParty] = useState<HeroCharacter[]>([]);
  const [bagInventory, setBagInventory] = useState<EquipmentItem[]>([]);
  const [runGold, setRunGold] = useState<number>(0);
  const [worldMap, setWorldMap] = useState<WorldMapState | null>(null);
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number>(1);

  // Modals & Selected View
  const [activeModal, setActiveModal] = useState<'party_sheet' | 'inventory' | 'research' | 'dungeon' | 'merchant' | 'camp' | 'sanctuary' | 'run_summary' | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string>('');
  const [activeDungeonNode, setActiveDungeonNode] = useState<MapNode | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);

  // Time tracker for dynamic area scaling
  useEffect(() => {
    if (!isRunActive) return;
    const interval = setInterval(() => {
      setTimeSpentMinutes((prev) => prev + 1);
    }, 60000); // every 1 min
    return () => clearInterval(interval);
  }, [isRunActive]);

  // Sanitize bagInventory to purge any duplicate item IDs on mount
  useEffect(() => {
    setBagInventory((prev) => {
      const seen = new Set<string>();
      const deduped: EquipmentItem[] = [];
      let hadDupes = false;
      for (const item of prev) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduped.push(item);
        } else {
          hadDupes = true;
        }
      }
      return hadDupes ? deduped : prev;
    });
  }, []);

  // Unlock research node
  const unlockResearchNode = (nodeId: string) => {
    const node = INITIAL_RESEARCH_NODES.find((n) => n.id === nodeId);
    if (!node || completedResearchIds.includes(nodeId)) return;
    if (aetherShards < node.cost) return;

    sound.play('level');
    setAetherShards((prev) => prev - node.cost);
    setCompletedResearchIds((prev) => [...prev, nodeId]);

    // Apply immediate effect
    if (node.effect.type === 'unlock_rarity') {
      setUnlockedMaxRarity(node.effect.value);
    } else if (node.effect.type === 'artifact_slot') {
      setUnlockedArtifactSlots(node.effect.value);
    } else if (node.effect.type === 'unlock_class') {
      setUnlockedJobs((prev) => Array.from(new Set([...prev, node.effect.value])));
    } else if (node.effect.type === 'inventory_size') {
      setInventoryCapacity(node.effect.value);
    } else if (node.effect.type === 'starting_gold') {
      setStartingGoldBonus((prev) => prev + node.effect.value);
    } else if (node.effect.type === 'starting_ap') {
      setStartingApBonus((prev) => prev + node.effect.value);
    }
  };

  // Start new run
  const startNewRun = (
    biomeId: string,
    partySetup: { heroId: string; name: string; avatar: string; jobId: string }[]
  ) => {
    sound.play('time');
    setSelectedBiomeId(biomeId);
    setRunsAttempted((prev) => prev + 1);
    setTimeSpentMinutes(1);

    // Build 3 hero characters
    const heroes: HeroCharacter[] = partySetup.map((setup, idx) => {
      const jobDef = INITIAL_JOBS.find((j) => j.id === setup.jobId) || INITIAL_JOBS[0];
      const positions: TacticalPosition[] = ['front', 'mid', 'back'];
      const starterSkills = jobDef.skills.filter(
        (s) => s.nodeType === 'starter' || ((!s.prerequisites || s.prerequisites.length === 0) && s.tier === 1)
      );
      const initialSkills = starterSkills.length > 0 ? starterSkills.slice(0, 2).map((s) => s.id) : jobDef.skills.slice(0, 1).map((s) => s.id);

      const baseStats: Stats = {
        maxHp: 100 + (jobDef.statGrowths.maxHp || 40),
        maxMp: 30 + (jobDef.statGrowths.maxMp || 20),
        atk: 12 + (jobDef.statGrowths.atk || 10),
        mag: 10 + (jobDef.statGrowths.mag || 10),
        def: 8 + (jobDef.statGrowths.def || 8),
        res: 8 + (jobDef.statGrowths.res || 8),
        spd: 9 + (jobDef.statGrowths.spd || 9),
        critRate: jobDef.statGrowths.critRate || 0.05,
      };

      // Starting basic gear
      const starterWeapon = generateLootItem(1, 'common', false, 'weapon');
      const starterArmor = generateLootItem(1, 'common', false, 'armor');

      const draftHero: HeroCharacter = {
        id: setup.heroId || `hero_${idx}`,
          name: setup.name,
          avatar: setup.avatar,
          title: jobDef.name,
          currentJobId: setup.jobId,
          level: 1,
          xp: 0,
          xpToNext: 100,
          jp: { [setup.jobId]: 40 },
          ap: 2 + startingApBonus,
          unlockedSkillIds: initialSkills,
          unlockedPassiveIds: [],
          masteredJobIds: [],
          hp: 1,
          mp: 1,
          baseStats,
          position: jobDef.preferredPosition || positions[idx % 3],
          equipment: {
            weapon: starterWeapon,
            armor: starterArmor,
            artifacts: idx === 0 && persistentArtifactsVault.length > 0 ? [persistentArtifactsVault[0]] : [],
          },
          statusEffects: [],
        };
        const eff = getEffectiveStats(draftHero);
        draftHero.hp = eff.maxHp;
        draftHero.mp = eff.maxMp;
        return draftHero;
      });

    setParty(heroes);
    setSelectedHeroId(heroes[0].id);
    setRunGold(startingGoldBonus);

    // Initial procedural bag items
    const starterPotions = [
      generateLootItem(1, 'common', false, 'accessory'),
    ];
    setBagInventory(starterPotions);

    // Generate procedural world map
    const generatedMap = generateProceduralWorldMap(biomeId);
    setWorldMap(generatedMap);
    setIsRunActive(true);
    setCombat(null);
    setActiveModal(null);
    sound.startBgm('exploration');
  };

  // Rebirth Run (converts all carried loot into Aether Shards for meta progression)
  const rebirthRun = (wasDefeat: boolean = false) => {
    let totalLootValue = 0;
    bagInventory.forEach((item) => {
      totalLootValue += item.value;
    });

    party.forEach((hero) => {
      if (hero.equipment.weapon) totalLootValue += hero.equipment.weapon.value;
      if (hero.equipment.armor) totalLootValue += hero.equipment.armor.value;
      if (hero.equipment.accessory) totalLootValue += hero.equipment.accessory.value;
    });

    // Conversion rate: 100% of loot converted to Aether
    const earnedAether = Math.max(25, Math.round(totalLootValue + runGold * 0.5));
    setAetherShards((prev) => prev + earnedAether);

    if (wasDefeat) {
      sound.play('defeat');
    } else {
      sound.play('victory');
      setRunsCompleted((prev) => prev + 1);
    }

    sound.stopBgm();
    setIsRunActive(false);
    setCombat(null);
    setActiveModal('research'); // Directly open Research Sanctum for spending meta currency!
  };

  // Move to a node on the world map
  const moveToNode = (nodeId: string) => {
    if (!worldMap) return;
    const targetNode = worldMap.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    sound.play('click');
    const updatedNodes = worldMap.nodes.map((n) => {
      if (n.id === nodeId) {
        // Dungeons are completed only when the guardian is slain
        return { ...n, completed: targetNode.type === 'dungeon' ? false : true };
      }
      // Reveal connected next nodes
      if (targetNode.connectedTo.includes(n.id)) {
        return { ...n, revealed: true };
      }
      return n;
    });

    setWorldMap({
      ...worldMap,
      nodes: updatedNodes,
      currentNodeId: nodeId,
      stepsTaken: worldMap.stepsTaken + 1,
    });

    // Handle node action
    if (targetNode.type === 'battle' || targetNode.type === 'elite' || targetNode.type === 'boss') {
      startCombatForNode(targetNode);
    } else if (targetNode.type === 'dungeon') {
      setActiveDungeonNode(targetNode);
      setActiveModal('dungeon');
    } else if (targetNode.type === 'merchant') {
      setActiveModal('merchant');
    } else if (targetNode.type === 'camp') {
      sound.play('click');
      setActiveModal('camp');
    } else if (targetNode.type === 'shrine' || targetNode.type === 'start') {
      sound.play('magic');
      setActiveModal('sanctuary');
    } else if (targetNode.type === 'treasure') {
      // Scavenge loot
      const loot = generateLootItem(
        targetNode.threatLevel,
        unlockedMaxRarity,
        false
      );
      sound.play('loot');
      if (bagInventory.length < inventoryCapacity) {
        setBagInventory((prev) => [...prev, loot]);
      }
      setRunGold((prev) => prev + 50);
    }
  };

  // Camp Actions
  const applyCampRest = () => {
    sound.play('heal');
    setParty((prev) =>
      prev.map((h) => {
        const eff = getEffectiveStats(h);
        if (h.hp <= 0) {
          return {
            ...h,
            hp: Math.max(1, Math.round(eff.maxHp * 0.4)),
            mp: Math.max(0, Math.round(eff.maxMp * 0.3)),
          };
        }
        return {
          ...h,
          hp: Math.min(eff.maxHp, Math.round(h.hp + eff.maxHp * 0.65)),
          mp: Math.min(eff.maxMp, Math.round(h.mp + eff.maxMp * 0.6)),
        };
      })
    );
  };

  const applyCampTraining = () => {
    sound.play('level');
    setParty((prev) =>
      prev.map((h) => ({
        ...h,
        jp: {
          ...h.jp,
          [h.currentJobId]: (h.jp[h.currentJobId] || 0) + 150,
        },
      }))
    );
  };

  const applyCampAttune = () => {
    sound.play('loot');
    setParty((prev) =>
      prev.map((h) => ({
        ...h,
        ap: h.ap + 2,
      }))
    );
    setRunGold((prev) => prev + 50);
  };

  // Sanctuary Actions
  const applySanctuaryBlessing = () => {
    sound.play('heal');
    setParty((prev) =>
      prev.map((h) => {
        const updatedBase = {
          ...h.baseStats,
          maxHp: h.baseStats.maxHp + 30,
        };
        const tempHero = { ...h, baseStats: updatedBase };
        const eff = getEffectiveStats(tempHero);
        return {
          ...tempHero,
          hp: eff.maxHp,
          mp: eff.maxMp,
        };
      })
    );
  };

  const applySanctuaryInfusion = () => {
    sound.play('time');
    setParty((prev) =>
      prev.map((h) => ({
        ...h,
        ap: h.ap + 3,
      }))
    );
    setAetherShards((prev) => prev + 75);
  };

  const applySanctuaryRelic = (): EquipmentItem | null => {
    sound.play('loot');
    const lvl = worldMap?.stepsTaken ? Math.max(1, Math.round(worldMap.stepsTaken * 0.9)) : 1;
    const rarityPool: ItemRarity[] = ['rare', 'epic', 'legendary'];
    const chosenRarity = rarityPool[Math.min(rarityPool.length - 1, Math.floor(Math.random() * rarityPool.length))];
    const loot = generateLootItem(lvl, chosenRarity, true);
    if (bagInventory.length < inventoryCapacity) {
      setBagInventory((prev) => {
        if (prev.some((i) => i.id === loot.id)) return prev;
        return [...prev, loot];
      });
    }
    return loot;
  };

  // Enter Dungeon Combat
  const enterDungeonCombat = () => {
    if (!activeDungeonNode) return;
    setActiveModal(null);
    startCombatForNode(activeDungeonNode);
  };

  // Initialize Combat for a node
  const startCombatForNode = (node: MapNode) => {
    if (!worldMap) return;

    isVictoryHandledRef.current = false;
    isCollectingRewardsRef.current = false;

    sound.startBgm(node.type === 'boss' || node.type === 'dungeon' ? 'boss' : 'battle');

    // Ensure all heroes are conscious with at least 35% HP before battle begins
    const healthyParty = party.map((h) => {
      const eff = getEffectiveStats(h);
      if (h.hp <= 0) {
        return { ...h, hp: Math.max(1, Math.round(eff.maxHp * 0.35)) };
      }
      return h;
    });
    setParty(healthyParty);

    const enemies = generateEnemiesForNode(
      node,
      worldMap.biomeId,
      worldMap.stepsTaken,
      timeSpentMinutes
    );

    // Build timeline actors
    const actors: TimelineActor[] = [];

    healthyParty.forEach((h) => {
      const eff = getEffectiveStats(h);
      // Check for Chronos artifact boost
      const hasChronosBoost = h.equipment.artifacts.some((a) => a.effectKey === 'chronos_boost');
      const initialDelay = hasChronosBoost ? 25 : Math.max(10, 60 - eff.spd * 2);

      actors.push({
        id: h.id,
        type: 'hero',
        name: h.name,
        avatar: h.avatar,
        speed: eff.spd,
        currentDelay: initialDelay,
        isCurrentTurn: false,
      });
    });

    enemies.forEach((e) => {
      actors.push({
        id: e.id,
        type: 'enemy',
        name: e.name,
        avatar: e.avatar,
        speed: e.spd,
        currentDelay: Math.max(15, 65 - e.spd * 2),
        isCurrentTurn: false,
      });
    });

    // Advance timeline until someone reaches 0
    advanceTimeline(actors, enemies, node, healthyParty);
  };

  // Helper to advance timeline
  const advanceTimeline = (
    currentTimeline: TimelineActor[],
    enemies: Enemy[],
    activeNode: MapNode,
    overrideParty?: HeroCharacter[],
    logMsg?: string
  ) => {
    // Clear any existing enemy turn timer
    if (enemyTurnTimeoutRef.current) {
      clearTimeout(enemyTurnTimeoutRef.current);
      enemyTurnTimeoutRef.current = null;
    }

    const currentParty = overrideParty || party;

    // 1. Check Victory: If all enemies are defeated, conclude combat immediately
    const aliveEnemies = enemies.filter((e) => e.hp > 0);
    if (aliveEnemies.length === 0) {
      handleCombatVictory(enemies, activeNode);
      return;
    }

    // 2. Check Defeat: If all heroes are defeated
    const aliveHeroes = currentParty.filter((h) => h.hp > 0);
    if (aliveHeroes.length === 0) {
      sound.play('defeat');
      setCombat((prev) =>
        prev
          ? {
              ...prev,
              isDefeat: true,
              combatLog: ['The entire party has fallen in battle.', ...prev.combatLog],
            }
          : null
      );
      return;
    }

    // 3. Purge dead actors (enemies or heroes with <= 0 HP) from the active timeline
    const aliveHeroIdSet = new Set(aliveHeroes.map((h) => h.id));
    const aliveEnemyIdSet = new Set(aliveEnemies.map((e) => e.id));

    let validTimeline = currentTimeline.filter((actor) => {
      if (actor.type === 'hero') return aliveHeroIdSet.has(actor.id);
      if (actor.type === 'enemy') return aliveEnemyIdSet.has(actor.id);
      return false;
    });

    // Fallback: If validTimeline is somehow empty, repopulate with all living actors
    if (validTimeline.length === 0) {
      validTimeline = [
        ...aliveHeroes.map((h) => ({
          id: h.id,
          type: 'hero' as const,
          name: h.name,
          avatar: h.jobId,
          speed: getEffectiveStats(h).spd,
          currentDelay: Math.max(10, 50 - getEffectiveStats(h).spd),
          isCurrentTurn: false,
        })),
        ...aliveEnemies.map((e) => ({
          id: e.id,
          type: 'enemy' as const,
          name: e.name,
          avatar: e.avatar,
          speed: e.spd,
          currentDelay: Math.max(15, 60 - e.spd),
          isCurrentTurn: false,
        })),
      ];
    }

    // 4. Find minimum delay among valid living combatants
    const minDelay = Math.min(...validTimeline.map((a) => a.currentDelay));
    const nextTimeline = validTimeline.map((a) => ({
      ...a,
      currentDelay: Math.max(0, a.currentDelay - minDelay),
    }));

    // 5. Find the actor with 0 delay (tie-break by speed)
    const readyActors = nextTimeline.filter((a) => a.currentDelay === 0);
    readyActors.sort((a, b) => b.speed - a.speed);
    const turnActor = readyActors[0] || nextTimeline[0];

    // CRITICAL: Verify if turn actor is a dead or missing enemy
    if (turnActor.type === 'enemy') {
      const enemyObj = enemies.find((e) => e.id === turnActor.id);
      if (!enemyObj || enemyObj.hp <= 0) {
        // Fallback: immediately strip this dead actor and advance without delay
        const cleaned = nextTimeline.filter((a) => a.id !== turnActor.id);
        advanceTimeline(cleaned, enemies, activeNode, currentParty, logMsg);
        return;
      }
    }

    const finalTimeline = nextTimeline.map((a) => ({
      ...a,
      isCurrentTurn: a.id === turnActor.id,
    }));

    const nextLog = logMsg ? [logMsg] : [];

    setCombat({
      enemies,
      timeline: finalTimeline,
      currentTurnActorId: turnActor.id,
      activeHeroId: turnActor.type === 'hero' ? turnActor.id : null,
      combatLog: nextLog,
      isVictory: false,
      isDefeat: false,
      activeNode,
    });

    // 6. If turn actor is an enemy, schedule AI turn
    if (turnActor.type === 'enemy') {
      enemyTurnTimeoutRef.current = setTimeout(() => {
        executeEnemyTurn(turnActor.id, finalTimeline, enemies, activeNode, currentParty);
      }, 650);
    }
  };

  // Execute Enemy Turn
  const executeEnemyTurn = (
    enemyId: string,
    currentTimeline: TimelineActor[],
    enemies: Enemy[],
    activeNode: MapNode,
    latestParty?: HeroCharacter[]
  ) => {
    try {
      const currentParty = latestParty || party;
      const enemy = enemies.find((e) => e.id === enemyId);
      // If enemy is missing or dead, purge from timeline and immediately advance
      if (!enemy || enemy.hp <= 0) {
        const cleanedTimeline = currentTimeline.filter((a) => a.id !== enemyId);
        advanceTimeline(cleanedTimeline, enemies, activeNode, currentParty);
        return;
      }

      // If enemy is broken, skip turn and recover shields!
      if (enemy.isBroken) {
        const recoveredEnemies = enemies.map((e) => {
          if (e.id === enemyId) {
            return {
              ...e,
              isBroken: false,
              shields: e.maxShields,
            };
          }
          return e;
        });

        const updatedTimeline = currentTimeline.map((a) =>
          a.id === enemyId ? { ...a, currentDelay: 50 } : a
        );

        advanceTimeline(
          updatedTimeline,
          recoveredEnemies,
          activeNode,
          currentParty,
          `${enemy.name} recovered from Break and restored its shields!`
        );
        return;
      }

      // Pick random target prioritizing frontline
      const frontHeroes = currentParty.filter((h) => h.hp > 0 && h.position === 'front');
      const aliveHeroes = currentParty.filter((h) => h.hp > 0);
      if (aliveHeroes.length === 0) {
        sound.play('defeat');
        setCombat((prev) =>
          prev
            ? {
                ...prev,
                isDefeat: true,
                combatLog: ['The entire party has fallen in battle.', ...prev.combatLog],
              }
            : null
        );
        return;
      }

      const targetHero =
        frontHeroes.length > 0 && Math.random() < 0.65
          ? frontHeroes[Math.floor(Math.random() * frontHeroes.length)]
          : aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];

      const effectiveHero = getEffectiveStats(targetHero);
      const skill = enemy.skills && enemy.skills.length > 0
        ? enemy.skills[Math.floor(Math.random() * enemy.skills.length)]
        : { name: 'Fierce Strike', power: 1.0, element: 'physical' as const, delay: 50, timeDelay: 0 };
      const defStat = skill.element === 'physical' ? effectiveHero.def : effectiveHero.res;
      const rawDmg = Math.max(1, Math.round(enemy.atk * skill.power * 1.8 - defStat * 0.7));

      sound.play(skill.element === 'physical' ? 'strike' : 'magic');

      let isPartyDefeated = false;
      const newParty = currentParty.map((h) => {
        if (h.id === targetHero.id) {
          const newHp = Math.max(0, h.hp - rawDmg);
          return { ...h, hp: newHp };
        }
        return h;
      });

      if (newParty.every((h) => h.hp <= 0)) {
        isPartyDefeated = true;
      }

      setParty(newParty);

      if (isPartyDefeated) {
        sound.play('defeat');
        setCombat((prev) =>
          prev
            ? {
                ...prev,
                isDefeat: true,
                combatLog: [`${enemy.name} struck down ${targetHero.name}! The party has perished.`, ...prev.combatLog],
              }
            : null
        );
        return;
      }

      // Purge any heroes that fell in this attack from the timeline
      const deadHeroIds = new Set(newParty.filter((h) => h.hp <= 0).map((h) => h.id));
      const liveTimeline = currentTimeline.filter((a) => !deadHeroIds.has(a.id));

      // Update enemy timeline recovery
      const updatedTimeline = liveTimeline.map((a) => {
        if (a.id === enemyId) {
          return { ...a, currentDelay: skill.delay || 50 };
        }
        // If skill inflicted time delay on target hero
        if (skill.timeDelay && a.id === targetHero.id) {
          return { ...a, currentDelay: a.currentDelay + skill.timeDelay };
        }
        return a;
      });

      advanceTimeline(
        updatedTimeline,
        enemies,
        activeNode,
        newParty,
        `${enemy.name} used ${skill.name} on ${targetHero.name} for ${rawDmg} DMG!`
      );
    } catch (err) {
      console.error('Error executing enemy turn:', err);
      const fallbackTimeline = currentTimeline.map((a) =>
        a.id === enemyId ? { ...a, currentDelay: 50 } : a
      );
      advanceTimeline(fallbackTimeline, enemies, activeNode, latestParty || party);
    }
  };

  // Force manual advance if combat timeline ever stalls
  const forceAdvanceTimeline = () => {
    if (!combat) return;
    if (enemyTurnTimeoutRef.current) {
      clearTimeout(enemyTurnTimeoutRef.current);
      enemyTurnTimeoutRef.current = null;
    }
    const deadEnemyIds = new Set(combat.enemies.filter((e) => e.hp <= 0).map((e) => e.id));
    const deadHeroIds = new Set(party.filter((h) => h.hp <= 0).map((h) => h.id));
    const cleanedTimeline = combat.timeline.filter(
      (a) => !deadEnemyIds.has(a.id) && !deadHeroIds.has(a.id)
    );
    advanceTimeline(cleanedTimeline, combat.enemies, combat.activeNode, party);
  };

  // Hero Actions (Skill, Basic Attack, Defend)
  const executeHeroAction = (skillId: string, targetId: string) => {
    if (!combat || !combat.currentTurnActorId) return;
    if (enemyTurnTimeoutRef.current) {
      clearTimeout(enemyTurnTimeoutRef.current);
      enemyTurnTimeoutRef.current = null;
    }

    const hero = party.find((h) => h.id === combat.currentTurnActorId);
    if (!hero || hero.hp <= 0) return;

    // Find skill definition
    let skillObj = INITIAL_JOBS.flatMap((j) => j.skills).find((s) => s.id === skillId);
    if (!skillObj) return;

    if (hero.mp < skillObj.mpCost) return; // Insufficient MP

    // Audio cue
    if (skillObj.targetType.includes('ally')) {
      sound.play('heal');
    } else if (skillObj.timelineDelayMod && skillObj.timelineDelayMod !== 0) {
      sound.play('time');
    } else if (skillObj.element === 'slash' || skillObj.element === 'strike' || skillObj.element === 'pierce') {
      sound.play('slash');
    } else {
      sound.play('magic');
    }

    const effectiveHero = getEffectiveStats(hero);

    // Immutable clone of enemies and party with MP deducted
    let updatedParty = party.map((h) =>
      h.id === hero.id ? { ...h, mp: Math.max(0, h.mp - skillObj.mpCost) } : h
    );
    let updatedEnemies = combat.enemies.map((e) => ({
      ...e,
      weaknesses: [...e.weaknesses],
      revealedWeaknesses: [...e.revealedWeaknesses],
    }));
    let combatMsg = '';

    // Handle Healing / Ally Buff
    if (skillObj.targetType === 'single_ally') {
      const healAmount = Math.round(effectiveHero.mag * skillObj.powerMultiplier * 2.2);
      updatedParty = updatedParty.map((h) => {
        if (h.id === targetId) {
          const effTarget = getEffectiveStats(h);
          return { ...h, hp: Math.min(effTarget.maxHp, h.hp + healAmount) };
        }
        return h;
      });
      combatMsg = `${hero.name} cast ${skillObj.name} on ${updatedParty.find((h) => h.id === targetId)?.name} (+${healAmount} HP)!`;
    } else if (skillObj.targetType === 'all_allies') {
      const healAmount = Math.round(effectiveHero.mag * skillObj.powerMultiplier * 1.5);
      updatedParty = updatedParty.map((h) => {
        const effTarget = getEffectiveStats(h);
        return {
          ...h,
          hp: Math.min(effTarget.maxHp, h.hp + healAmount),
        };
      });
      combatMsg = `${hero.name} cast ${skillObj.name}, restoring all allies (+${healAmount} HP)!`;
    } else if (skillObj.targetType === 'self') {
      combatMsg = `${hero.name} activated ${skillObj.name}!`;
    } else {
      // Single or All Enemy Attack (only target living enemies)
      updatedEnemies = updatedEnemies.map((target) => {
        const isTarget = skillObj.targetType === 'all_enemies' || target.id === targetId;
        if (!isTarget || target.hp <= 0) return target;

        const isWeak = target.weaknesses.includes(skillObj.element);
        const weakMultiplier = isWeak ? 1.5 : 1.0;
        const breakMultiplier = target.isBroken ? 1.5 : 1.0;
        const isCrit = Math.random() < effectiveHero.critRate;
        const critMultiplier = isCrit ? 1.5 : 1.0;

        const revealed = [...target.revealedWeaknesses];
        if (isWeak && !revealed.includes(skillObj.element)) {
          revealed.push(skillObj.element);
        }

        let shields = target.shields;
        let isBroken = target.isBroken;
        if (isWeak && shields > 0) {
          shields = Math.max(0, shields - skillObj.shieldDamage);
          if (shields === 0 && !isBroken) {
            isBroken = true;
            sound.play('break');
            combatMsg += ` [BREAK!] ${target.name}'s defense shattered! `;
          }
        }

        const basePower = (skillObj.element === 'slash' || skillObj.element === 'strike' || skillObj.element === 'pierce' || skillObj.element === 'physical')
          ? effectiveHero.atk
          : effectiveHero.mag;
        const defense = target.def;
        const rawDmg = Math.max(1, Math.round((basePower * skillObj.powerMultiplier * 2.0 - defense * 0.5) * weakMultiplier * breakMultiplier * critMultiplier));
        const newHp = Math.max(0, target.hp - rawDmg);

        combatMsg = `${hero.name} struck ${target.name} with ${skillObj.name} for ${rawDmg} DMG! ${isWeak ? '(WEAKNESS!) ' : ''}${isCrit ? '(CRITICAL!)' : ''}`;

        return {
          ...target,
          shields,
          isBroken,
          revealedWeaknesses: revealed,
          hp: newHp,
        };
      });
    }

    setParty(updatedParty);

    // Check Victory
    const aliveEnemies = updatedEnemies.filter((e) => e.hp > 0);
    if (aliveEnemies.length === 0) {
      handleCombatVictory(updatedEnemies, combat.activeNode);
      return;
    }

    // Immediately remove dead enemies and dead heroes from timeline
    const deadEnemyIds = new Set(updatedEnemies.filter((e) => e.hp <= 0).map((e) => e.id));
    const deadHeroIds = new Set(updatedParty.filter((h) => h.hp <= 0).map((h) => h.id));
    const liveTimeline = combat.timeline.filter((a) => !deadEnemyIds.has(a.id) && !deadHeroIds.has(a.id));

    // Update timeline & handle time manipulation
    const updatedTimeline = liveTimeline.map((actor) => {
      if (actor.id === hero.id) {
        return { ...actor, currentDelay: skillObj.timelineSelfDelay };
      }
      // If time manipulation affects target
      if (skillObj.timelineDelayMod && skillObj.timelineDelayMod !== 0) {
        if (skillObj.targetType.includes('enemy') && actor.id === targetId) {
          return { ...actor, currentDelay: actor.currentDelay + skillObj.timelineDelayMod };
        }
        if (skillObj.targetType.includes('ally') && actor.id === targetId) {
          return { ...actor, currentDelay: Math.max(0, actor.currentDelay + skillObj.timelineDelayMod) };
        }
      }
      return actor;
    });

    advanceTimeline(updatedTimeline, updatedEnemies, combat.activeNode, updatedParty, combatMsg);
  };

  // Basic Attack
  const executeBasicAttack = (targetId: string) => {
    if (!combat || !combat.currentTurnActorId) return;
    if (enemyTurnTimeoutRef.current) {
      clearTimeout(enemyTurnTimeoutRef.current);
      enemyTurnTimeoutRef.current = null;
    }

    const hero = party.find((h) => h.id === combat.currentTurnActorId);
    if (!hero || hero.hp <= 0) return;

    sound.play('slash');
    const effectiveHero = getEffectiveStats(hero);
    const updatedEnemies = combat.enemies.map((e) => {
      if (e.id === targetId && e.hp > 0) {
        const isWeak = e.weaknesses.includes('physical');
        const weakMultiplier = isWeak ? 1.5 : 1.0;
        const breakMultiplier = e.isBroken ? 1.5 : 1.0;
        const dmg = Math.max(1, Math.round((effectiveHero.atk * 1.5 - e.def * 0.5) * weakMultiplier * breakMultiplier));
        return {
          ...e,
          hp: Math.max(0, e.hp - dmg),
        };
      }
      return e;
    });

    const targetEnemy = combat.enemies.find((e) => e.id === targetId);

    // Check Victory
    const aliveEnemies = updatedEnemies.filter((e) => e.hp > 0);
    if (aliveEnemies.length === 0) {
      handleCombatVictory(updatedEnemies, combat.activeNode);
      return;
    }

    // Immediately remove dead enemies from timeline
    const deadEnemyIds = new Set(updatedEnemies.filter((e) => e.hp <= 0).map((e) => e.id));
    const deadHeroIds = new Set(party.filter((h) => h.hp <= 0).map((h) => h.id));
    const liveTimeline = combat.timeline.filter((a) => !deadEnemyIds.has(a.id) && !deadHeroIds.has(a.id));

    const updatedTimeline = liveTimeline.map((a) =>
      a.id === hero.id ? { ...a, currentDelay: 40 } : a
    );

    advanceTimeline(
      updatedTimeline,
      updatedEnemies,
      combat.activeNode,
      party,
      `${hero.name} attacked ${targetEnemy?.name}!`
    );
  };

  // Defend Action
  const executeDefend = () => {
    if (!combat || !combat.currentTurnActorId) return;
    if (enemyTurnTimeoutRef.current) {
      clearTimeout(enemyTurnTimeoutRef.current);
      enemyTurnTimeoutRef.current = null;
    }

    const hero = party.find((h) => h.id === combat.currentTurnActorId);
    if (!hero || hero.hp <= 0) return;

    sound.play('click');
    const deadEnemyIds = new Set(combat.enemies.filter((e) => e.hp <= 0).map((e) => e.id));
    const deadHeroIds = new Set(party.filter((h) => h.hp <= 0).map((h) => h.id));
    const liveTimeline = combat.timeline.filter((a) => !deadEnemyIds.has(a.id) && !deadHeroIds.has(a.id));

    const updatedTimeline = liveTimeline.map((a) =>
      a.id === hero.id ? { ...a, currentDelay: 25 } : a
    );

    advanceTimeline(
      updatedTimeline,
      combat.enemies,
      combat.activeNode,
      party,
      `${hero.name} assumed a defensive guard.`
    );
  };

  // Handle Victory Rewards
  const handleCombatVictory = (defeatedEnemies: Enemy[], activeNode: MapNode) => {
    if (isVictoryHandledRef.current) return;
    isVictoryHandledRef.current = true;

    sound.play('victory');

    let totalXp = 0;
    let totalJp = 0;
    let totalAp = 0;
    let totalGold = 0;

    defeatedEnemies.forEach((e) => {
      totalXp += e.xpReward;
      totalJp += e.jpReward;
      totalAp += e.apReward;
      totalGold += e.goldReward;
    });

    // Roll loot
    const lootList: EquipmentItem[] = [];
    const isBoss = activeNode.type === 'boss' || activeNode.type === 'dungeon';
    const dropCount = isBoss ? 2 : Math.random() < 0.75 ? 1 : 0;

    for (let i = 0; i < dropCount; i++) {
      lootList.push(generateLootItem(activeNode.threatLevel, unlockedMaxRarity, isBoss));
    }

    // Boss or Dungeon Boss persistent artifact drop
    let droppedArtifact: PersistentArtifact | undefined;
    if (isBoss) {
      const biomeObj = BIOMES.find((b) => b.id === selectedBiomeId);
      const matchedArt = PERSISTENT_ARTIFACTS.find((a) => a.id === biomeObj?.bossArtifactId) || PERSISTENT_ARTIFACTS[Math.floor(Math.random() * PERSISTENT_ARTIFACTS.length)];
      droppedArtifact = matchedArt;
    }

    // Mark current node completed in world map
    if (worldMap) {
      setWorldMap((prev) =>
        prev
          ? {
              ...prev,
              nodes: prev.nodes.map((n) =>
                n.id === activeNode.id ? { ...n, completed: true } : n
              ),
            }
          : null
      );
    }

    setCombat((prev) =>
      prev
        ? {
            ...prev,
            enemies: defeatedEnemies,
            isVictory: true,
            rewardsPending: {
              xp: totalXp,
              jp: totalJp,
              ap: totalAp,
              gold: totalGold,
              loot: lootList,
              artifact: droppedArtifact,
            },
            combatLog: ['The party has triumphed!', ...prev.combatLog],
          }
        : null
    );
  };

  // Collect Combat Rewards & Apply Growth (XP, Level Up, JP, AP)
  const collectCombatRewards = (openPartySheet: boolean = true) => {
    if (!combat || !combat.rewardsPending || isCollectingRewardsRef.current) return;
    isCollectingRewardsRef.current = true;
    const { xp, jp, ap, gold, loot, artifact } = combat.rewardsPending;

    sound.play('loot');
    sound.startBgm('exploration');

    // Distribute XP, JP, AP to party members
    const updatedParty = party.map((hero) => {
      let currentXp = hero.xp + xp;
      let level = hero.level;
      let xpToNext = hero.xpToNext;
      let hp = hero.hp;
      let mp = hero.mp;
      let baseStats = { ...hero.baseStats };

      // Level up loop
      let didLevelUp = false;
      while (currentXp >= xpToNext) {
        currentXp -= xpToNext;
        level += 1;
        xpToNext = Math.round(xpToNext * 1.35);
        baseStats.maxHp += 15;
        baseStats.maxMp += 6;
        baseStats.atk += 3;
        baseStats.mag += 3;
        baseStats.def += 2;
        baseStats.res += 2;
        baseStats.spd += 1;
        didLevelUp = true;
        sound.play('level');
      }

      const tempHero = { ...hero, level, baseStats };
      const effective = getEffectiveStats(tempHero);

      if (didLevelUp) {
        hp = effective.maxHp;
        mp = effective.maxMp;
      } else if (hp <= 0) {
        // Fallen heroes are revived with 50% HP after battle victory!
        hp = Math.round(effective.maxHp * 0.5);
        mp = Math.max(mp, Math.round(effective.maxMp * 0.35));
      } else {
        // Surviving heroes recover 35% HP and MP
        hp = Math.min(effective.maxHp, Math.round(hp + effective.maxHp * 0.35));
        mp = Math.min(effective.maxMp, Math.round(mp + effective.maxMp * 0.35));
      }

      const currentJobJp = ((hero.jp && hero.jp[hero.currentJobId]) || 0) + jp;

      return {
        ...hero,
        level,
        xp: currentXp,
        xpToNext,
        hp,
        mp,
        baseStats,
        jp: {
          ...(hero.jp || {}),
          [hero.currentJobId]: currentJobJp,
        },
        ap: (hero.ap || 0) + ap,
        unlockedSkillIds: hero.unlockedSkillIds || [],
        unlockedPassiveIds: hero.unlockedPassiveIds || [],
      };
    });

    setParty(updatedParty);
    setRunGold((prev) => prev + gold);

    // Ensure node is marked completed
    if (worldMap && combat.activeNode) {
      setWorldMap((prev) =>
        prev
          ? {
              ...prev,
              nodes: prev.nodes.map((n) =>
                n.id === combat.activeNode.id ? { ...n, completed: true } : n
              ),
            }
          : null
      );
    }

    // Add loot to bag if storage space permits (ensuring no duplicate IDs)
    if (loot.length > 0) {
      setBagInventory((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const uniqueLoot = loot.filter((item) => !existingIds.has(item.id));
        const remainingSpace = inventoryCapacity - prev.length;
        const itemsToAdd = uniqueLoot.slice(0, Math.max(0, remainingSpace));
        return [...prev, ...itemsToAdd];
      });
    }

    // If persistent artifact dropped, store in permanent vault!
    if (artifact) {
      setPersistentArtifactsVault((prev) => {
        if (prev.some((a) => a.id === artifact.id)) return prev;
        return [...prev, artifact];
      });
    }

    // If boss was defeated, unlock next biome in meta progression!
    if (combat.activeNode.type === 'boss') {
      const biomeObj = BIOMES.find((b) => b.id === selectedBiomeId);
      if (biomeObj) {
        const nextBiome = BIOMES.find((b) => b.requiredBossDefeats.includes(biomeObj.id));
        if (nextBiome && !unlockedBiomes.includes(nextBiome.id)) {
          setUnlockedBiomes((prev) => [...prev, nextBiome.id]);
        }
      }
    }

    setCombat(null);
    if (openPartySheet) {
      setActiveModal('party_sheet'); // Offer player opportunity to spend JP and AP!
    } else {
      setActiveModal(null);
    }
  };

  // Learn skill from Skill Tree with JP and AP
  const learnSkill = (heroId: string, skillId: string) => {
    const hero = party.find((h) => h.id === heroId);
    if (!hero) return;

    const skill = INITIAL_JOBS.flatMap((j) => j.skills).find((s) => s.id === skillId);
    if (!skill || hero.unlockedSkillIds.includes(skillId)) return;

    // Verify all prerequisites are learned
    if (skill.prerequisites && skill.prerequisites.length > 0) {
      const allPrereqsMet = skill.prerequisites.every(
        (prereqId) => hero.unlockedSkillIds.includes(prereqId) || hero.unlockedPassiveIds.includes(prereqId)
      );
      if (!allPrereqsMet) return;
    }

    const currentJp = hero.jp[hero.currentJobId] || 0;
    if (currentJp < skill.jpCost || hero.ap < skill.apCost) return;

    sound.play('level');
    setParty((prev) =>
      prev.map((h) => {
        if (h.id === heroId) {
          return {
            ...h,
            jp: { ...h.jp, [hero.currentJobId]: currentJp - skill.jpCost },
            ap: h.ap - skill.apCost,
            unlockedSkillIds: [...h.unlockedSkillIds, skillId],
          };
        }
        return h;
      })
    );
  };

  // Learn passive from Skill Tree
  const learnPassive = (heroId: string, passiveId: string) => {
    const hero = party.find((h) => h.id === heroId);
    if (!hero) return;

    const passive = INITIAL_JOBS.flatMap((j) => j.passives).find((p) => p.id === passiveId);
    if (!passive || hero.unlockedPassiveIds.includes(passiveId)) return;

    // Verify all prerequisites are learned
    if (passive.prerequisites && passive.prerequisites.length > 0) {
      const allPrereqsMet = passive.prerequisites.every(
        (prereqId) => hero.unlockedSkillIds.includes(prereqId) || hero.unlockedPassiveIds.includes(prereqId)
      );
      if (!allPrereqsMet) return;
    }

    const currentJp = hero.jp[hero.currentJobId] || 0;
    if (currentJp < passive.jpCost || hero.ap < passive.apCost) return;

    sound.play('level');
    setParty((prev) =>
      prev.map((h) => {
        if (h.id === heroId) {
          const newBaseStats = { ...h.baseStats };
          let hpIncrease = 0;
          let mpIncrease = 0;
          if (passive.statBonus) {
            Object.entries(passive.statBonus).forEach(([statKey, val]) => {
              (newBaseStats as any)[statKey] = ((newBaseStats as any)[statKey] || 0) + (val as number);
            });
            if (passive.statBonus.maxHp) hpIncrease = passive.statBonus.maxHp;
            if (passive.statBonus.maxMp) mpIncrease = passive.statBonus.maxMp;
          }
          return {
            ...h,
            hp: h.hp + hpIncrease,
            mp: h.mp + mpIncrease,
            jp: { ...h.jp, [hero.currentJobId]: currentJp - passive.jpCost },
            ap: h.ap - passive.apCost,
            unlockedPassiveIds: [...h.unlockedPassiveIds, passiveId],
            baseStats: newBaseStats,
          };
        }
        return h;
      })
    );
  };

  // Change hero job & master classes
  const changeHeroJob = (heroId: string, newJobId: string) => {
    sound.play('click');
    setParty((prev) =>
      prev.map((h) => {
        if (h.id === heroId) {
          const newJob = INITIAL_JOBS.find((j) => j.id === newJobId);
          return {
            ...h,
            currentJobId: newJobId,
            title: newJob?.name || h.title,
          };
        }
        return h;
      })
    );
  };

  // Equip Item & Stat recalculation
  const equipItem = (heroId: string, item: EquipmentItem) => {
    const hero = party.find((h) => h.id === heroId);
    if (!hero) return;

    sound.play('loot');
    const currentEquipped = hero.equipment[item.slot];

    // Safely update bag inventory outside setParty, preventing duplicate items
    setBagInventory((b) => {
      const withoutItem = b.filter((i) => i.id !== item.id);
      if (currentEquipped && !withoutItem.some((i) => i.id === currentEquipped.id)) {
        return [...withoutItem, currentEquipped];
      }
      return withoutItem;
    });

    setParty((prev) =>
      prev.map((h) => {
        if (h.id === heroId) {
          const oldEffective = getEffectiveStats(h);
          const updatedHero: HeroCharacter = {
            ...h,
            equipment: {
              ...h.equipment,
              [item.slot]: item,
            },
          };
          const newEffective = getEffectiveStats(updatedHero);
          const hpGain = newEffective.maxHp - oldEffective.maxHp;
          const mpGain = newEffective.maxMp - oldEffective.maxMp;

          // If hero had hp <= 0, revive them to at least the gained HP or 40%
          let newHp = h.hp <= 0 ? Math.max(1, hpGain > 0 ? hpGain : Math.round(newEffective.maxHp * 0.4)) : h.hp + Math.max(0, hpGain);
          newHp = Math.max(1, Math.min(newEffective.maxHp, newHp));

          let newMp = Math.max(0, Math.min(newEffective.maxMp, h.mp + Math.max(0, mpGain)));

          return {
            ...updatedHero,
            hp: newHp,
            mp: newMp,
          };
        }
        return h;
      })
    );
  };

  // Unequip Item
  const unequipItem = (heroId: string, slot: 'weapon' | 'armor' | 'accessory') => {
    if (bagInventory.length >= inventoryCapacity) return;
    const hero = party.find((h) => h.id === heroId);
    if (!hero) return;
    const currentEquipped = hero.equipment[slot];
    if (!currentEquipped) return;

    sound.play('click');

    // Safely update bag inventory outside setParty, preventing duplicate items
    setBagInventory((b) => {
      if (b.some((i) => i.id === currentEquipped.id)) return b;
      return [...b, currentEquipped];
    });

    setParty((prev) =>
      prev.map((h) => {
        if (h.id === heroId) {
          const updatedHero: HeroCharacter = {
            ...h,
            equipment: {
              ...h.equipment,
              [slot]: undefined,
            },
          };
          const newEffective = getEffectiveStats(updatedHero);
          const newHp = Math.max(1, Math.min(newEffective.maxHp, h.hp));
          const newMp = Math.max(0, Math.min(newEffective.maxMp, h.mp));

          return {
            ...updatedHero,
            hp: newHp,
            mp: newMp,
          };
        }
        return h;
      })
    );
  };

  // Equip Persistent Artifact
  const equipArtifact = (heroId: string, artifact: PersistentArtifact) => {
    const hero = party.find((h) => h.id === heroId);
    if (!hero) return;
    if (hero.equipment.artifacts.length >= unlockedArtifactSlots) return;
    if (hero.equipment.artifacts.some((a) => a.id === artifact.id)) return;

    sound.play('time');
    setParty((prev) =>
      prev.map((h) => {
        if (h.id === heroId) {
          return {
            ...h,
            equipment: {
              ...h.equipment,
              artifacts: [...h.equipment.artifacts, artifact],
            },
          };
        }
        return h;
      })
    );
  };

  // Unequip Persistent Artifact
  const unequipArtifact = (heroId: string, artifactId: string) => {
    sound.play('click');
    setParty((prev) =>
      prev.map((h) => {
        if (h.id === heroId) {
          return {
            ...h,
            equipment: {
              ...h.equipment,
              artifacts: h.equipment.artifacts.filter((a) => a.id !== artifactId),
            },
          };
        }
        return h;
      })
    );
  };

  // Discard / Scrap Item for run gold
  const discardItem = (itemId: string) => {
    const item = bagInventory.find((i) => i.id === itemId);
    if (!item) return;
    sound.play('click');
    setRunGold((prev) => prev + Math.round(item.value * 0.4));
    setBagInventory((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Shift hero rank position (Front, Mid, Back)
  const shiftHeroPosition = (heroId: string, newPos: TacticalPosition) => {
    sound.play('click');
    setParty((prev) =>
      prev.map((h) => (h.id === heroId ? { ...h, position: newPos } : h))
    );
  };

  // Buy Shop Item
  const buyShopItem = (item: EquipmentItem) => {
    if (runGold < item.value || bagInventory.length >= inventoryCapacity) return;
    sound.play('loot');
    setRunGold((prev) => prev - item.value);
    setBagInventory((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  return (
    <GameContext.Provider
      value={{
        aetherShards,
        runsAttempted,
        runsCompleted,
        unlockedBiomes,
        unlockedJobs,
        unlockedMaxRarity,
        unlockedArtifactSlots,
        inventoryCapacity,
        startingGoldBonus,
        startingApBonus,
        persistentArtifactsVault,
        completedResearchIds,
        unlockResearchNode,
        isRunActive,
        selectedBiomeId,
        party,
        bagInventory,
        runGold,
        worldMap,
        timeSpentMinutes,
        combat,
        activeModal,
        setActiveModal,
        selectedHeroId,
        setSelectedHeroId,
        activeDungeonNode,
        setActiveDungeonNode,
        startNewRun,
        moveToNode,
        enterDungeonCombat,
        rebirthRun,
        applyCampRest,
        applyCampTraining,
        applyCampAttune,
        applySanctuaryBlessing,
        applySanctuaryInfusion,
        applySanctuaryRelic,
        learnSkill,
        learnPassive,
        changeHeroJob,
        equipItem,
        unequipItem,
        equipArtifact,
        unequipArtifact,
        discardItem,
        shiftHeroPosition,
        buyShopItem,
        executeHeroAction,
        executeBasicAttack,
        executeDefend,
        forceAdvanceTimeline,
        collectCombatRewards,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
