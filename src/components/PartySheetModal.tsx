import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { INITIAL_JOBS } from '../data/jobs';
import { TacticalPosition, Skill, PassiveMastery } from '../types/game';
import { sound } from '../utils/audio';
import {
  X,
  BookOpen,
  Lock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Flame,
  Snowflake,
  Heart,
  RotateCcw,
  GitBranch,
  Layers,
  ArrowDown,
  Star,
  Activity,
  Award,
} from 'lucide-react';

interface UnifiedNode {
  id: string;
  name: string;
  description: string;
  jobId: string;
  jpCost: number;
  apCost: number;
  mpCost?: number;
  element?: string;
  targetType?: string;
  powerMultiplier?: number;
  shieldDamage?: number;
  timelineDelayMod?: number;
  timelineSelfDelay?: number;
  tier: number;
  branch?: string;
  prerequisites?: string[];
  nodeType?: 'starter' | 'minor' | 'skill' | 'keystone' | 'ultimate';
  isPassive: boolean;
  statBonus?: Record<string, number>;
  effectKey?: string;
}

export const PartySheetModal: React.FC = () => {
  const {
    party,
    selectedHeroId,
    setSelectedHeroId,
    unlockedJobs,
    learnSkill,
    learnPassive,
    changeHeroJob,
    shiftHeroPosition,
    activeModal,
    setActiveModal,
  } = useGame();

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'skills' | 'traits'>('all');

  const currentHero = party.find((h) => h.id === selectedHeroId) || party[0];
  const activeJobDef = currentHero
    ? INITIAL_JOBS.find((j) => j.id === currentHero.currentJobId) || INITIAL_JOBS[0]
    : INITIAL_JOBS[0];
  const heroJp = (currentHero && currentHero.jp && currentHero.jp[currentHero.currentJobId]) || 0;

  // Unify skills and passives into a single structured tree dataset
  const allJobNodes: UnifiedNode[] = useMemo(() => {
    if (!activeJobDef) return [];
    const skillNodes: UnifiedNode[] = (activeJobDef.skills || []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      jobId: s.jobId,
      jpCost: s.jpCost,
      apCost: s.apCost,
      mpCost: s.mpCost,
      element: s.element,
      targetType: s.targetType,
      powerMultiplier: s.powerMultiplier,
      shieldDamage: s.shieldDamage,
      timelineDelayMod: s.timelineDelayMod,
      timelineSelfDelay: s.timelineSelfDelay,
      tier: s.tier,
      branch: s.branch,
      prerequisites: s.prerequisites,
      nodeType: s.nodeType || (s.tier === 3 ? 'ultimate' : 'skill'),
      isPassive: false,
    }));

    const passiveNodes: UnifiedNode[] = (activeJobDef.passives || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      jobId: p.jobId,
      jpCost: p.jpCost,
      apCost: p.apCost,
      tier: p.tier || 1,
      branch: p.branch,
      prerequisites: p.prerequisites,
      nodeType: p.nodeType || 'minor',
      isPassive: true,
      statBonus: p.statBonus as Record<string, number> | undefined,
      effectKey: p.effectKey,
    }));

    return [...skillNodes, ...passiveNodes];
  }, [activeJobDef]);

  // Extract distinct branches
  const branches = useMemo(() => {
    const list = Array.from(new Set(allJobNodes.map((n) => n.branch).filter(Boolean))) as string[];
    return list;
  }, [allJobNodes]);

  // Helper to get node name
  const getNodeName = (nodeId: string) => {
    const found = allJobNodes.find((n) => n.id === nodeId);
    return found ? found.name : nodeId;
  };

  // Helper to find downstream nodes that require this node
  const getDownstreamUnlocks = (nodeId: string) => {
    return allJobNodes.filter((n) => n.prerequisites?.includes(nodeId));
  };

  // Check if learned
  const isNodeLearned = (node: UnifiedNode) => {
    if (!currentHero) return false;
    const passiveIds = currentHero.unlockedPassiveIds || [];
    const skillIds = currentHero.unlockedSkillIds || [];
    return node.isPassive
      ? passiveIds.includes(node.id)
      : skillIds.includes(node.id);
  };

  // Check if prerequisites met
  const arePrerequisitesMet = (node: UnifiedNode) => {
    if (!node.prerequisites || node.prerequisites.length === 0) return true;
    if (!currentHero) return false;
    const skillIds = currentHero.unlockedSkillIds || [];
    const passiveIds = currentHero.unlockedPassiveIds || [];
    return node.prerequisites.every(
      (prereqId) =>
        skillIds.includes(prereqId) ||
        passiveIds.includes(prereqId)
    );
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return allJobNodes.filter((node) => {
      // Branch filter
      if (selectedBranch !== 'all' && node.branch !== selectedBranch) {
        return false;
      }
      // Type filter
      if (filterType === 'skills' && node.isPassive) return false;
      if (filterType === 'traits' && !node.isPassive) return false;
      return true;
    });
  }, [allJobNodes, selectedBranch, filterType]);

  // Unconditionally evaluate all hooks before returning null
  if (activeModal !== 'party_sheet' || !currentHero) return null;

  // Group by Tier (Tier 1: Foundations & Smaller Options, Tier 2: Intermediate, Tier 3: Ultimates)
  const tier1Nodes = filteredNodes.filter((n) => n.tier === 1);
  const tier2Nodes = filteredNodes.filter((n) => n.tier === 2);
  const tier3Nodes = filteredNodes.filter((n) => n.tier === 3);

  // Total learned count for this class
  const learnedCount = allJobNodes.filter(isNodeLearned).length;

  const handleLearn = (node: UnifiedNode) => {
    if (node.isPassive) {
      learnPassive(currentHero.id, node.id);
    } else {
      learnSkill(currentHero.id, node.id);
    }
  };

  return (
    <div id="party_sheet_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4">
      <div className="flex flex-col h-[92vh] w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-700/60 text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-['Cinzel'] text-lg font-bold text-slate-100 tracking-wide">
                CLASS SKILL TREES & PROGRESSION
              </h2>
              <p className="text-xs text-slate-400">
                Unlock smaller foundation traits and tactical prerequisites to master specialized combat skills.
              </p>
            </div>
          </div>

          <button
            id="party_sheet_close_btn"
            onClick={() => {
              sound.play('click');
              setActiveModal(null);
            }}
            className="rounded-lg border border-slate-800 bg-slate-850 p-2 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hero Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 overflow-x-auto">
          {party.map((hero) => {
            const isSelected = hero.id === currentHero.id;
            return (
              <button
                key={hero.id}
                id={`hero_tab_${hero.id}`}
                onClick={() => {
                  sound.play('click');
                  setSelectedHeroId(hero.id);
                  setSelectedBranch('all');
                }}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'border-indigo-400 text-indigo-300 bg-indigo-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold">
                  {hero.name.charAt(0)}
                </span>
                <span>{hero.name}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-normal">
                  Lv.{hero.level} {hero.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-4 flex-1 overflow-y-auto p-5 sm:p-6 gap-6">
          {/* Left Column: Hero Stats & Job Class Switcher */}
          <div className="lg:col-span-1 space-y-4">
            {/* Hero Profile Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold text-lg shadow">
                    {currentHero.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{currentHero.name}</h3>
                    <div className="text-xs text-indigo-400 font-semibold">
                      Class: {activeJobDef.name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Level</div>
                  <div className="font-mono text-lg font-bold text-amber-300">{currentHero.level}</div>
                </div>
              </div>

              {/* XP progress */}
              <div className="mb-3">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>EXP Progress</span>
                  <span className="font-mono">
                    {currentHero.xp} / {currentHero.xpToNext} XP
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((currentHero.xp / currentHero.xpToNext) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Currency Counters (JP & AP) */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="rounded-lg border border-indigo-800/60 bg-indigo-950/40 p-2.5 text-center">
                  <div className="text-[10px] uppercase font-semibold text-indigo-400">Job Points (JP)</div>
                  <div className="font-mono text-lg font-bold text-indigo-200">{heroJp} JP</div>
                  <div className="text-[9px] text-slate-400">Earned in combat & camps</div>
                </div>

                <div className="rounded-lg border border-purple-800/60 bg-purple-950/40 p-2.5 text-center">
                  <div className="text-[10px] uppercase font-semibold text-purple-400">Ability Points (AP)</div>
                  <div className="font-mono text-lg font-bold text-purple-200">{currentHero.ap} AP</div>
                  <div className="text-[9px] text-slate-400">Universal Masteries</div>
                </div>
              </div>

              {/* Tactical Rank Position */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-slate-300 mb-2">Tactical Formation Rank:</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['front', 'mid', 'back'] as TacticalPosition[]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => shiftHeroPosition(currentHero.id, pos)}
                      className={`rounded-lg border py-1.5 text-xs font-bold uppercase transition-all cursor-pointer ${
                        currentHero.position === pos
                          ? 'border-indigo-400 bg-indigo-950/80 text-indigo-200 shadow'
                          : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Job Switcher */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>ASSIGN ACTIVE CLASS:</span>
                <span className="text-[10px] text-slate-400">Retains skills</span>
              </div>
              <div className="space-y-1.5">
                {INITIAL_JOBS.map((job) => {
                  const isUnlocked = unlockedJobs.includes(job.id);
                  const isCurrent = currentHero.currentJobId === job.id;

                  return (
                    <button
                      key={job.id}
                      id={`job_select_btn_${job.id}`}
                      disabled={!isUnlocked}
                      onClick={() => isUnlocked && changeHeroJob(currentHero.id, job.id)}
                      className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all text-left ${
                        isCurrent
                          ? 'border-indigo-400 bg-indigo-950/70 text-indigo-200 font-bold'
                          : isUnlocked
                          ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-850 text-slate-300 cursor-pointer'
                          : 'border-slate-900 bg-slate-950/40 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{job.name}</span>
                        {isCurrent && (
                          <span className="rounded bg-indigo-900 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div>
                        {isUnlocked ? (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {currentHero.jp[job.id] || 0} JP
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-slate-600">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Three Columns: Deep Interactive Skill Tree View */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tree Navigation & Filter Controls */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800/60 text-indigo-400">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-['Cinzel'] font-bold text-sm text-slate-100 tracking-wide">
                      {activeJobDef.name.toUpperCase()} SPECIALIZATION PATHS
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Mastered: <span className="font-mono text-emerald-400 font-semibold">{learnedCount}</span> of {allJobNodes.length} nodes
                    </p>
                  </div>
                </div>

                {/* Filter by Type */}
                <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 self-start sm:self-auto">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      filterType === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Options
                  </button>
                  <button
                    onClick={() => setFilterType('traits')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      filterType === 'traits' ? 'bg-emerald-700 text-emerald-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Smaller Options / Traits
                  </button>
                  <button
                    onClick={() => setFilterType('skills')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      filterType === 'skills' ? 'bg-indigo-700 text-indigo-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Active Skills
                  </button>
                </div>
              </div>

              {/* Branch Selector Tabs */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedBranch('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedBranch === 'all'
                      ? 'bg-slate-800 text-indigo-300 border border-indigo-700/60 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  All Specializations ({allJobNodes.length})
                </button>
                {branches.map((branch) => {
                  const branchNodes = allJobNodes.filter((n) => n.branch === branch);
                  const branchLearned = branchNodes.filter(isNodeLearned).length;
                  const isSelected = selectedBranch === branch;

                  return (
                    <button
                      key={branch}
                      onClick={() => setSelectedBranch(branch)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-500 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{branch}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                        {branchLearned}/{branchNodes.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tree Sections Grouped by Progression Tiers */}
            <div className="space-y-6">
              {/* TIER 1: Foundations & Smaller Options */}
              {tier1Nodes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                      1
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Tier 1: Foundations & Smaller Options (Entry Stepping Stones)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tier1Nodes.map((node) => (
                      <TreeNodeCard
                        key={node.id}
                        node={node}
                        heroJp={heroJp}
                        currentHeroAp={currentHero.ap}
                        isLearned={isNodeLearned(node)}
                        prereqsMet={arePrerequisitesMet(node)}
                        getNodeName={getNodeName}
                        downstreamUnlocks={getDownstreamUnlocks(node.id)}
                        onLearn={() => handleLearn(node)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TIER 2: Intermediate Techniques & Stances */}
              {tier2Nodes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-950 border border-indigo-700/60 text-[10px] font-bold text-indigo-300">
                      2
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Tier 2: Intermediate Techniques & Stances (Requires Tier 1)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tier2Nodes.map((node) => (
                      <TreeNodeCard
                        key={node.id}
                        node={node}
                        heroJp={heroJp}
                        currentHeroAp={currentHero.ap}
                        isLearned={isNodeLearned(node)}
                        prereqsMet={arePrerequisitesMet(node)}
                        getNodeName={getNodeName}
                        downstreamUnlocks={getDownstreamUnlocks(node.id)}
                        onLearn={() => handleLearn(node)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TIER 3: Capstone Ultimates & Masteries */}
              {tier3Nodes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-950 border border-amber-700/60 text-[10px] font-bold text-amber-300">
                      3
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Tier 3: Capstone Ultimates & Masteries (Requires Tier 2)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tier3Nodes.map((node) => (
                      <TreeNodeCard
                        key={node.id}
                        node={node}
                        heroJp={heroJp}
                        currentHeroAp={currentHero.ap}
                        isLearned={isNodeLearned(node)}
                        prereqsMet={arePrerequisitesMet(node)}
                        getNodeName={getNodeName}
                        downstreamUnlocks={getDownstreamUnlocks(node.id)}
                        onLearn={() => handleLearn(node)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3.5 bg-slate-950/90">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Current Hero: <strong className="text-slate-200">{currentHero.name}</strong> ({activeJobDef.name})</span>
            <span>•</span>
            <span className="text-indigo-400 font-mono font-bold">{heroJp} JP Available</span>
            <span>•</span>
            <span className="text-purple-400 font-mono font-bold">{currentHero.ap} AP Available</span>
          </div>

          <button
            id="party_sheet_done_btn"
            onClick={() => {
              sound.play('click');
              setActiveModal(null);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2 text-xs font-bold text-white shadow-lg cursor-pointer transition-all"
          >
            <span>Return to Expedition Map</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual skill/trait node card
interface TreeNodeCardProps {
  node: UnifiedNode;
  heroJp: number;
  currentHeroAp: number;
  isLearned: boolean;
  prereqsMet: boolean;
  getNodeName: (id: string) => string;
  downstreamUnlocks: UnifiedNode[];
  onLearn: () => void;
}

const TreeNodeCard: React.FC<TreeNodeCardProps> = ({
  node,
  heroJp,
  currentHeroAp,
  isLearned,
  prereqsMet,
  getNodeName,
  downstreamUnlocks,
  onLearn,
}) => {
  const canAfford = heroJp >= node.jpCost && currentHeroAp >= node.apCost;
  const isAvailable = prereqsMet && !isLearned;

  // Render node type badge
  const renderTypeBadge = () => {
    if (node.nodeType === 'starter') {
      return (
        <span className="rounded bg-sky-950/80 border border-sky-700/50 px-2 py-0.5 text-[9px] font-bold text-sky-300 uppercase tracking-wide">
          Starter Skill
        </span>
      );
    }
    if (node.nodeType === 'minor' || node.isPassive) {
      return (
        <span className="rounded bg-emerald-950/80 border border-emerald-700/50 px-2 py-0.5 text-[9px] font-bold text-emerald-300 uppercase tracking-wide">
          Smaller Option (Trait)
        </span>
      );
    }
    if (node.nodeType === 'ultimate') {
      return (
        <span className="rounded bg-amber-950/80 border border-amber-700/50 px-2 py-0.5 text-[9px] font-bold text-amber-300 uppercase tracking-wide">
          Capstone Ultimate
        </span>
      );
    }
    return (
      <span className="rounded bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 text-[9px] font-bold text-indigo-300 uppercase tracking-wide">
        Active Skill
      </span>
    );
  };

  return (
    <div
      id={`skill_card_${node.id}`}
      className={`rounded-xl border p-4 flex flex-col justify-between transition-all relative overflow-hidden ${
        isLearned
          ? 'border-emerald-700/60 bg-emerald-950/20 shadow-sm'
          : !prereqsMet
          ? 'border-slate-800/80 bg-slate-950/40 opacity-60'
          : canAfford
          ? 'border-indigo-600/70 bg-indigo-950/20 hover:border-indigo-400 shadow-md'
          : 'border-slate-800 bg-slate-900/40 opacity-80'
      }`}
    >
      <div>
        {/* Top Badges & Title */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {renderTypeBadge()}
              {node.branch && (
                <span className="text-[10px] text-slate-400 font-medium">
                  • {node.branch}
                </span>
              )}
            </div>
            <h5 className="font-bold text-xs text-slate-100">{node.name}</h5>
          </div>

          <div className="text-right">
            <span className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[9px] font-mono text-slate-300">
              Tier {node.tier}
            </span>
          </div>
        </div>

        {/* Skill Details or Stat Bonuses */}
        {!node.isPassive && (
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 capitalize">
            <span>Element: <strong className="text-slate-200">{node.element}</strong></span>
            <span>•</span>
            <span>MP: <strong className="text-sky-300">{node.mpCost}</strong></span>
            {node.shieldDamage ? (
              <>
                <span>•</span>
                <span>Shield Dmg: <strong className="text-amber-300">{node.shieldDamage}</strong></span>
              </>
            ) : null}
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {node.description}
        </p>

        {/* Timeline Delay Indicator */}
        {node.timelineDelayMod && node.timelineDelayMod !== 0 && (
          <div className="mt-2 text-[10px] font-mono text-amber-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {node.timelineDelayMod > 0
                ? `+${node.timelineDelayMod} Delay to Target`
                : `${Math.abs(node.timelineDelayMod)} Timeline Advance`}
            </span>
          </div>
        )}

        {/* Prerequisites Section */}
        {node.prerequisites && node.prerequisites.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/60">
            {prereqsMet ? (
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Prerequisites Satisfied</span>
              </div>
            ) : (
              <div className="text-[10px] text-amber-400 flex items-center gap-1.5 bg-amber-950/30 px-2 py-1 rounded border border-amber-900/50">
                <Lock className="h-3 w-3 shrink-0" />
                <span>
                  Requires:{' '}
                  <strong>
                    {node.prerequisites.map((pId) => getNodeName(pId)).join(', ')}
                  </strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Downstream Unlocks Info (Smaller Options that unlock new skills!) */}
        {downstreamUnlocks.length > 0 && (
          <div className="mt-2 text-[10px] text-cyan-300/90 font-medium flex items-center gap-1">
            <span className="text-cyan-400">↳ Unlocks:</span>
            <span className="text-slate-300">
              {downstreamUnlocks.map((u) => u.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Cost & Action Button */}
      <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-300 font-mono">
          <span className={heroJp >= node.jpCost ? 'text-indigo-300 font-bold' : 'text-slate-400'}>
            {node.jpCost} JP
          </span>
          {' • '}
          <span className={currentHeroAp >= node.apCost ? 'text-purple-300 font-bold' : 'text-slate-400'}>
            {node.apCost} AP
          </span>
        </div>

        {isLearned ? (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Learned
          </span>
        ) : !prereqsMet ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 cursor-not-allowed">
            <Lock className="h-3 w-3" /> Locked
          </span>
        ) : (
          <button
            id={`learn_btn_${node.id}`}
            disabled={!canAfford}
            onClick={onLearn}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              canAfford
                ? node.nodeType === 'minor'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  : node.nodeType === 'ultimate'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>
              {!canAfford
                ? heroJp < node.jpCost
                  ? `Need ${node.jpCost - heroJp} JP`
                  : `Need ${node.apCost - currentHeroAp} AP`
                : node.nodeType === 'minor'
                ? 'Learn Trait'
                : 'Learn Skill'}
            </span>
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
