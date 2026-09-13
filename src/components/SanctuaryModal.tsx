import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../utils/audio';
import { getEffectiveStats } from '../utils/stats';
import { EquipmentItem } from '../types/game';
import {
  X,
  Sparkles,
  Heart,
  Zap,
  Gift,
  Layers,
  CheckCircle2,
  ChevronRight,
  Sun,
  Shield,
  Clock,
  ArrowRight,
  Gem,
  Lock,
  AlertCircle,
} from 'lucide-react';

export const SanctuaryModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    party,
    aetherShards,
    applySanctuaryBlessing,
    applySanctuaryInfusion,
    applySanctuaryRelic,
  } = useGame();

  const [chosenBoon, setChosenBoon] = useState<'blessing' | 'infusion' | 'relic' | null>(null);
  const [obtainedItem, setObtainedItem] = useState<EquipmentItem | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (activeModal !== 'sanctuary') return null;

  const handleBlessing = () => {
    if (chosenBoon !== null) return;
    applySanctuaryBlessing();
    setChosenBoon('blessing');
    setFeedbackMessage('Celestial blessing conferred: All party members fully healed and gained +30 Max HP!');
  };

  const handleInfusion = () => {
    if (chosenBoon !== null) return;
    applySanctuaryInfusion();
    setChosenBoon('infusion');
    setFeedbackMessage('Aether infusion absorbed: +3 AP granted to all heroes & +75 permanent Aether Shards gained!');
  };

  const handleRelic = () => {
    if (chosenBoon !== null) return;
    const item = applySanctuaryRelic();
    setChosenBoon('relic');
    if (item) {
      setObtainedItem(item);
      setFeedbackMessage(`Sacred reliquary unsealed: Discovered ${item.name} (${item.rarity.toUpperCase()})!`);
    } else {
      setFeedbackMessage('Sacred reliquary unsealed: Bag was full or item could not be stored.');
    }
  };

  const handleOpenResearch = () => {
    sound.play('click');
    setActiveModal('research');
  };

  const handleLeaveSanctuary = () => {
    sound.play('click');
    setActiveModal(null);
  };

  return (
    <div
      id="sanctuary_modal_overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
    >
      <div className="flex flex-col h-[90vh] w-full max-w-4xl rounded-2xl border border-teal-800/60 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-950 border border-teal-500/60 text-teal-300 shadow-lg shadow-teal-950/50">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Cinzel'] text-xl font-bold text-slate-100 tracking-wide">
                  ASTRAL SANCTUARY
                </h2>
                <span className="flex items-center gap-1 rounded bg-teal-950/90 border border-teal-600/70 px-2 py-0.5 text-xs font-semibold text-teal-300">
                  <Sun className="h-3.5 w-3.5 text-amber-300" />
                  Dimensional Rift Altar
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                An ancient temporal nexus pulsating with planar magic. Commune with the sanctuary to receive cosmic boons.
              </p>
            </div>
          </div>

          <button
            id="sanctuary_close_btn"
            onClick={handleLeaveSanctuary}
            className="rounded-lg border border-slate-800 bg-slate-850 p-2 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title="Depart Sanctuary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Notification Banner */}
        {feedbackMessage && (
          <div className="bg-teal-950/70 border-b border-teal-800/70 px-6 py-2.5 flex items-center justify-between text-xs text-teal-200 animate-fadeIn">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-teal-400 hover:text-teal-200 font-bold ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Party Condition & Shards Ribbon */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-teal-400" />
                Sanctuary Attunement Status
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-3">
                <span className="flex items-center gap-1 text-purple-300 font-mono font-bold">
                  <Layers className="h-3.5 w-3.5 text-purple-400" /> {aetherShards} Aether Shards
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {party.map((hero) => {
                const eff = getEffectiveStats(hero);
                const hpPercent = Math.max(0, Math.min(100, Math.round((hero.hp / eff.maxHp) * 100)));
                const mpPercent = Math.max(0, Math.min(100, Math.round((hero.mp / eff.maxMp) * 100)));

                return (
                  <div
                    key={hero.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="text-2xl h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                        {hero.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-100 truncate">{hero.name}</h4>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            Lv.{hero.level}
                          </span>
                        </div>
                        <div className="text-[10px] text-teal-300 capitalize">
                          {hero.currentJobId} • {hero.ap} AP
                        </div>
                      </div>
                    </div>

                    {/* Vitals Bars */}
                    <div className="space-y-1 text-[10px]">
                      <div>
                        <div className="flex justify-between text-slate-400">
                          <span>HP</span>
                          <span className="text-emerald-300 font-mono">
                            {hero.hp}/{eff.maxHp}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-0.5">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400">
                          <span>MP</span>
                          <span className="text-sky-300 font-mono">
                            {hero.mp}/{eff.maxMp}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-0.5">
                          <div
                            className="h-full bg-sky-500 transition-all duration-300"
                            style={{ width: `${mpPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sanctuary Options Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                Sanctuary Communion Options
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium bg-amber-950/40 border border-amber-800/50 px-2.5 py-0.5 rounded-full">
                <AlertCircle className="h-3 w-3 text-amber-400" />
                <span>Ancient Vow: Only 1 boon can be selected per Shrine visit</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Celestial Blessing */}
              <div
                id="sanctuary_option_blessing"
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  chosenBoon === 'blessing'
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-lg ring-1 ring-emerald-500/50'
                    : chosenBoon !== null
                    ? 'border-slate-850 bg-slate-950/30 opacity-45 cursor-not-allowed'
                    : 'border-slate-800 bg-slate-950/50 hover:border-teal-500/70 hover:bg-slate-900/80 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-950 border border-teal-500/60 text-teal-300">
                        <Sun className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">Celestial Blessing of Vitality</h4>
                        <span className="text-[10px] text-teal-400 font-medium">
                          100% Full Restore • +30 Permanent Max HP
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    Imbue the party with pure solar aether. Fully restores all HP & MP, revives fallen party members,
                    and grants a permanent +30 Max HP capacity to each hero for this expedition.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Divine Blessing</span>
                  {chosenBoon === 'blessing' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Chosen & Conferred
                    </span>
                  ) : chosenBoon !== null ? (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Lock className="h-3 w-3" /> Locked (1 boon limit)
                    </span>
                  ) : (
                    <button
                      id="sanctuary_action_blessing_btn"
                      onClick={handleBlessing}
                      className="flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
                    >
                      <span>Receive Blessing</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Aether Infusion */}
              <div
                id="sanctuary_option_infusion"
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  chosenBoon === 'infusion'
                    ? 'border-purple-500 bg-purple-950/40 shadow-lg ring-1 ring-purple-500/50'
                    : chosenBoon !== null
                    ? 'border-slate-850 bg-slate-950/30 opacity-45 cursor-not-allowed'
                    : 'border-slate-800 bg-slate-950/50 hover:border-purple-500/70 hover:bg-slate-900/80 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-950 border border-purple-500/60 text-purple-300">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">Aether Infusion & Awakening</h4>
                        <span className="text-[10px] text-purple-400 font-medium">
                          +3 AP to All Heroes • +75 Aether Shards
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    Directly siphon latent dimensional energies. Bestows 3 Ability Points to every hero for talent tree
                    unlocks and harvests 75 permanent Aether Shards into your meta-vault.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Temporal Infusion</span>
                  {chosenBoon === 'infusion' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-purple-300">
                      <CheckCircle2 className="h-4 w-4" /> Chosen & Absorbed
                    </span>
                  ) : chosenBoon !== null ? (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Lock className="h-3 w-3" /> Locked (1 boon limit)
                    </span>
                  ) : (
                    <button
                      id="sanctuary_action_infusion_btn"
                      onClick={handleInfusion}
                      className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg cursor-pointer transition-all"
                    >
                      <span>Channel Aether</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Option 3: Unseal Sacred Reliquary */}
              <div
                id="sanctuary_option_relic"
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  chosenBoon === 'relic'
                    ? 'border-amber-500 bg-amber-950/40 shadow-lg ring-1 ring-amber-500/50'
                    : chosenBoon !== null
                    ? 'border-slate-850 bg-slate-950/30 opacity-45 cursor-not-allowed'
                    : 'border-slate-800 bg-slate-950/50 hover:border-amber-500/70 hover:bg-slate-900/80 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-950 border border-amber-500/60 text-amber-300">
                        <Gift className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">Unseal Sacred Reliquary</h4>
                        <span className="text-[10px] text-amber-400 font-medium">
                          Guaranteed Rare, Epic, or Legendary Gear Drop
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    Open a sanctified planar coffer preserved across epochs. Guarantees a high-tier enchanted equipment
                    drop with boosted affixes placed directly into your inventory bag.
                  </p>

                  {obtainedItem && (
                    <div className="mt-2.5 rounded-lg border border-amber-600/40 bg-amber-950/30 p-2 text-xs flex items-center gap-2">
                      <Gem className="h-4 w-4 text-amber-400" />
                      <span className="font-semibold text-amber-200">Discovered: {obtainedItem.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Ancient Reliquary</span>
                  {chosenBoon === 'relic' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-300">
                      <CheckCircle2 className="h-4 w-4" /> Chosen & Unsealed
                    </span>
                  ) : chosenBoon !== null ? (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Lock className="h-3 w-3" /> Locked (1 boon limit)
                    </span>
                  ) : (
                    <button
                      id="sanctuary_action_relic_btn"
                      onClick={handleRelic}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
                    >
                      <span>Unseal Reliquary</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Option 4: Commune with Research Sanctum */}
              <div
                id="sanctuary_option_research"
                className="rounded-xl border border-slate-800 bg-slate-950/50 hover:border-purple-600/70 hover:bg-slate-900/80 p-4 flex flex-col justify-between shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-950 border border-purple-600/60 text-purple-300">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">Research Sanctum Archives</h4>
                        <span className="text-[10px] text-purple-400 font-medium">
                          Permanent Meta-Progression & Artifact Sockets
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    Access the dimensional vault archives to unlock higher loot rarity tiers, permanent artifact sockets,
                    inventory expansions, and secret guild classes using your Aether Shards.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Meta Progression</span>
                  <button
                    id="sanctuary_open_research_btn"
                    onClick={handleOpenResearch}
                    className="flex items-center gap-1.5 rounded-lg border border-purple-500/60 bg-purple-950/60 hover:bg-purple-900/80 px-3.5 py-1.5 text-xs font-bold text-purple-200 transition-all cursor-pointer"
                  >
                    <span>Open Research Sanctum</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            Sanctuary blessings persist throughout the expedition.
          </div>

          <button
            id="sanctuary_depart_btn"
            onClick={handleLeaveSanctuary}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
          >
            <span>Depart Sanctuary</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
