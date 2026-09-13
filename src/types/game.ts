export type ElementType = 'physical' | 'fire' | 'ice' | 'lightning' | 'earth' | 'wind' | 'light' | 'dark';

export type PhysicalSubtype = 'slash' | 'strike' | 'pierce';

export type AttackType = ElementType | PhysicalSubtype;

export type TacticalPosition = 'front' | 'mid' | 'back';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type ItemSlot = 'weapon' | 'armor' | 'accessory';

export interface Stats {
  maxHp: number;
  maxMp: number;
  atk: number;
  mag: number;
  def: number;
  res: number;
  spd: number;
  critRate: number; // 0 to 1
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  jobId: string;
  jpCost: number;
  apCost: number;
  mpCost: number;
  element: AttackType;
  targetType: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'self';
  powerMultiplier: number;
  shieldDamage: number;
  timelineDelayMod?: number; // positive = delays target, negative = accelerates target (time manipulation)
  timelineSelfDelay: number; // standard recovery time (e.g. 50 is normal, 20 is fast, 90 is slow)
  positionalEffect?: {
    userMove?: TacticalPosition;
    targetPushPull?: -1 | 1; // -1 push back, 1 pull forward
    requiredUserPosition?: TacticalPosition[];
  };
  specialEffect?: 'haste' | 'stop' | 'rewind' | 'break_boost' | 'taunt' | 'cleanse' | 'summon_spirit' | 'quake' | 'steal_turn';
  icon: string;
  tier: number;
  branch?: string;
  prerequisites?: string[];
  nodeType?: 'starter' | 'minor' | 'skill' | 'keystone' | 'ultimate';
}

export interface PassiveMastery {
  id: string;
  name: string;
  description: string;
  jobId: string;
  jpCost: number;
  apCost: number;
  statBonus?: Partial<Stats>;
  effectKey: string;
  tier?: number;
  branch?: string;
  prerequisites?: string[];
  nodeType?: 'starter' | 'minor' | 'skill' | 'keystone' | 'ultimate';
}

export interface JobDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  statGrowths: Partial<Stats>;
  preferredPosition: TacticalPosition;
  skills: Skill[];
  passives: PassiveMastery[];
  masteryBonus: string;
  unlockedByDefault: boolean;
}

export interface ItemAffix {
  stat: keyof Stats | 'fireDmg' | 'iceDmg' | 'shieldBreak' | 'timeSpeed' | 'mpCostReduce';
  value: number;
  description: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  stats: Partial<Stats>;
  affixes: ItemAffix[];
  value: number; // converted to Aether on rebirth
  description: string;
  levelReq: number;
}

export interface PersistentArtifact {
  id: string;
  name: string;
  rarity: 'epic' | 'legendary' | 'mythic';
  description: string;
  icon: string;
  bossSource: string;
  stats: Partial<Stats>;
  uniqueEffect: string; // e.g., "Start battle with 50% Timeline Boost", "Elemental Break causes 2-turn Stasis", etc.
  effectKey: 'chronos_boost' | 'shatter_freeze' | 'phoenix_res' | 'infinity_mana' | 'aegis_barrier' | 'time_echo' | 'primal_wrath';
}

export interface HeroCharacter {
  id: string;
  name: string;
  avatar: string;
  title: string;
  currentJobId: string;
  secondaryJobId?: string;
  level: number;
  xp: number;
  xpToNext: number;
  jp: Record<string, number>; // JP earned per job
  ap: number; // Universal Ability Points
  unlockedSkillIds: string[];
  unlockedPassiveIds: string[];
  masteredJobIds: string[];
  hp: number;
  mp: number;
  baseStats: Stats;
  position: TacticalPosition;
  equipment: {
    weapon?: EquipmentItem;
    armor?: EquipmentItem;
    accessory?: EquipmentItem;
    artifacts: PersistentArtifact[];
  };
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  type: 'haste' | 'slow' | 'stop' | 'atk_up' | 'def_up' | 'regen' | 'poison' | 'shielded' | 'broken';
  duration: number;
  value?: number;
}

export interface Enemy {
  id: string;
  name: string;
  avatar: string;
  level: number;
  maxHp: number;
  hp: number;
  atk: number;
  mag: number;
  def: number;
  res: number;
  spd: number;
  position: TacticalPosition;
  shields: number;
  maxShields: number;
  weaknesses: AttackType[];
  revealedWeaknesses: AttackType[];
  isBroken: boolean;
  brokenDuration: number;
  xpReward: number;
  jpReward: number;
  apReward: number;
  goldReward: number;
  skills: {
    name: string;
    power: number;
    element: AttackType;
    delay: number;
    description: string;
    targetType: 'single' | 'all';
    timeDelay?: number;
  }[];
  isBoss?: boolean;
  isElite?: boolean;
  statusEffects: StatusEffect[];
}

export type TimelineActorType = 'hero' | 'enemy';

export interface TimelineActor {
  id: string;
  type: TimelineActorType;
  name: string;
  avatar: string;
  currentDelay: number; // reaches 0 to act
  speed: number;
  isCurrentTurn: boolean;
}

export type NodeType = 'battle' | 'elite' | 'dungeon' | 'camp' | 'shrine' | 'merchant' | 'treasure' | 'start' | 'boss';

export interface MapNode {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  name: string;
  description: string;
  connectedTo: string[];
  completed: boolean;
  revealed: boolean;
  dungeonCompleted?: boolean;
  biomeId: string;
  threatLevel: number;
}

export interface Biome {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  accentColor: string;
  bgGradient: string;
  requiredBossDefeats: string[];
  baseLevel: number;
  unlockedByDefault: boolean;
  bossName: string;
  bossArtifactId: string;
}

export interface ResearchNode {
  id: string;
  title: string;
  category: 'loot' | 'artifacts' | 'classes' | 'biomes' | 'vitality';
  tier: number;
  cost: number;
  description: string;
  unlocked: boolean;
  icon: string;
  requires?: string[];
  effect: {
    type: 'unlock_rarity' | 'artifact_slot' | 'unlock_class' | 'unlock_biome' | 'inventory_size' | 'starting_gold' | 'starting_ap';
    value: any;
  };
}

export interface MetaProgression {
  aetherShards: number;
  runsAttempted: number;
  runsCompleted: number;
  bossesDefeated: string[];
  unlockedBiomes: string[];
  unlockedJobs: string[];
  unlockedMaxRarity: ItemRarity;
  unlockedArtifactSlots: number;
  inventoryCapacity: number;
  startingGoldBonus: number;
  startingApBonus: number;
  persistentArtifactsVault: PersistentArtifact[];
  completedResearchIds: string[];
}
