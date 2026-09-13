import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { INITIAL_RESEARCH_NODES } from '../data/research';
import { PERSISTENT_ARTIFACTS } from '../data/artifacts';
import { sound } from '../utils/audio';
import {
  X,
  Layers,
  Sparkles,
  Crown,
  ShieldAlert,
  Gem,
  CheckCircle2,
  Lock,
  ChevronRight,
  Shield,
  Clock,
  Package,
  Crosshair,
  Moon,
  Mountain,
} from 'lucide-react';

export const ResearchSanctumModal: React.FC = () => {
  const {
    aetherShards,
    runsAttempted,
    runsCompleted,
    completedResearchIds,
    unlockResearchNode,
    persistentArtifactsVault,
    unlockedArtifactSlots,
    unlockedMaxRarity,
    activeModal,
    setActiveModal,
  } = useGame();

  const [activeCategory, setActiveCategory] = useState<'all' | 'loot' | 'artifacts' | 'classes' | 'vitality'>('all');

  if (activeModal !== 'research') return null;

  const filteredNodes = INITIAL_RESEARCH_NODES.filter(
    (node) => activeCategory === 'all' || node.category === activeCategory
  );

  return (
    <div id="research_sanctum_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="flex flex-col h-[90vh] w-full max-w-5xl rounded-2xl border border-purple-800/60 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950 border border-purple-700/60 text-purple-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Cinzel'] text-lg font-bold text-slate-100 tracking-wide">
                  RESEARCH SANCTUM & META-PROGRESSION
                </h2>
                <span className="rounded bg-purple-950 border border-purple-600/60 px-2 py-0.5 text-xs font-mono font-bold text-purple-300">
                  {aetherShards} Aether Available
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unlock higher loot tiers, extra persistent artifact sockets, and secret character classes.
              </p>
            </div>
          </div>

          <button
            id="research_close_btn"
            onClick={() => {
              sound.play('click');
              setActiveModal(null);
            }}
            className="rounded-lg border border-slate-800 bg-slate-850 p-2 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/30 px-6 overflow-x-auto">
          <div className="flex gap-2 py-2">
            {[
              { id: 'all', label: 'All Research' },
              { id: 'loot', label: 'Loot Rarity Tiers' },
              { id: 'artifacts', label: 'Artifact Sockets' },
              { id: 'classes', label: 'Guild Classes' },
              { id: 'vitality', label: 'Bag & Vitality' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.play('click');
                  setActiveCategory(tab.id as any);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-purple-950/80 border border-purple-500 text-purple-200'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Max Rarity: <span className="uppercase text-amber-300 font-bold">{unlockedMaxRarity}</span> • Artifact Sockets: <span className="text-purple-300 font-bold">{unlockedArtifactSlots}</span>
          </div>
        </div>

        {/* Main Content: Research Tree Grid + Persistent Artifacts Showcase */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Research Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredNodes.map((node) => {
              const isUnlocked = completedResearchIds.includes(node.id);
              const prereqsMet = !node.requires || node.requires.every((r) => completedResearchIds.includes(r));
              const canAfford = aetherShards >= node.cost && prereqsMet;

              return (
                <div
                  key={node.id}
                  id={`research_node_${node.id}`}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    isUnlocked
                      ? 'border-emerald-700/60 bg-emerald-950/20'
                      : canAfford
                      ? 'border-purple-600/70 bg-purple-950/20 hover:border-purple-500 shadow-md'
                      : !prereqsMet
                      ? 'border-slate-800/60 bg-slate-950/40 opacity-50'
                      : 'border-slate-800 bg-slate-900/40 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-purple-300">
                          {node.category === 'loot' ? (
                            <Gem className="h-4 w-4" />
                          ) : node.category === 'artifacts' ? (
                            <ShieldAlert className="h-4 w-4" />
                          ) : node.category === 'classes' ? (
                            <Sparkles className="h-4 w-4" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-100">{node.title}</h4>
                          <span className="text-[10px] text-purple-400 capitalize">Tier {node.tier} • {node.category}</span>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <span className="flex items-center gap-1 rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {node.cost} Aether
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                      {node.description}
                    </p>

                    {node.requires && !prereqsMet && (
                      <div className="mt-2 text-[10px] text-rose-400 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Requires previous tier research
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                    {!isUnlocked && (
                      <button
                        id={`unlock_research_btn_${node.id}`}
                        disabled={!canAfford}
                        onClick={() => unlockResearchNode(node.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>Research Upgrade</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Persistent Artifact Vault Showcase */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-['Cinzel'] font-bold text-base text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  PERSISTENT ARTIFACTS VAULT ({persistentArtifactsVault.length} Discovered)
                </h3>
                <p className="text-xs text-slate-400">
                  These artifacts are permanently retained across all runs and rebirths. Defeat Dungeon Bosses to discover more!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {persistentArtifactsVault.map((art, aIdx) => (
                <div
                  key={`${art.id}_${aIdx}`}
                  className="rounded-xl border border-purple-800/50 bg-purple-950/20 p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-purple-200">{art.name}</span>
                      <span className="rounded bg-purple-900/60 px-1.5 py-0.2 text-[9px] font-bold uppercase text-purple-300">
                        {art.rarity}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Source: {art.bossSource}</div>
                    <p className="text-xs text-slate-300 mt-2">{art.uniqueEffect}</p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-purple-300">
                    Stats: {Object.entries(art.stats).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
