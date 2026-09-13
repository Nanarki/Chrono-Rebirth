import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../utils/audio';
import { getEffectiveStats } from '../utils/stats';
import {
  X,
  Tent,
  Flame,
  Heart,
  Zap,
  Swords,
  Wrench,
  CheckCircle2,
  ChevronRight,
  Users,
  Coins,
  Shield,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const CampModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    party,
    applyCampRest,
    applyCampTraining,
    applyCampAttune,
    runGold,
  } = useGame();

  const [usedOptions, setUsedOptions] = useState<{ [key: string]: boolean }>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (activeModal !== 'camp') return null;

  const handleRest = () => {
    if (usedOptions['rest']) return;
    applyCampRest();
    setUsedOptions((prev) => ({ ...prev, rest: true }));
    setFeedbackMessage('Party rested by the embers: HP & MP restored, fallen allies revived!');
  };

  const handleDrills = () => {
    if (usedOptions['drills']) return;
    applyCampTraining();
    setUsedOptions((prev) => ({ ...prev, drills: true }));
    setFeedbackMessage('Tactical drills completed: +150 JP awarded to all active jobs!');
  };

  const handleAttune = () => {
    if (usedOptions['attune']) return;
    applyCampAttune();
    setUsedOptions((prev) => ({ ...prev, attune: true }));
    setFeedbackMessage('Equipment calibrated: +2 AP awarded to each hero & +50 Gold scavenged!');
  };

  const handleOpenParty = () => {
    sound.play('click');
    setActiveModal('party_sheet');
  };

  const handleLeaveCamp = () => {
    sound.play('click');
    setActiveModal(null);
  };

  return (
    <div
      id="camp_modal_overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
    >
      <div className="flex flex-col h-[90vh] w-full max-w-4xl rounded-2xl border border-emerald-800/60 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-600/60 text-emerald-400 shadow-lg shadow-emerald-950/50">
              <Tent className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Cinzel'] text-xl font-bold text-slate-100 tracking-wide">
                  CAMPFIRE OASIS
                </h2>
                <span className="flex items-center gap-1 rounded bg-emerald-950/90 border border-emerald-600/70 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  Safe Haven
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Take respite from the expedition. Rest your wounds, conduct tactical drills, or calibrate party gear.
              </p>
            </div>
          </div>

          <button
            id="camp_close_btn"
            onClick={handleLeaveCamp}
            className="rounded-lg border border-slate-800 bg-slate-850 p-2 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title="Conclude Camp and return to Map"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Notification Banner */}
        {feedbackMessage && (
          <div className="bg-emerald-950/70 border-b border-emerald-800/70 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 font-bold ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Party Vital Status Strip */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-sky-400" />
                Current Party Condition
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-3">
                <span className="flex items-center gap-1 text-amber-300">
                  <Coins className="h-3.5 w-3.5" /> {runGold} Gold
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {party.map((hero) => {
                const eff = getEffectiveStats(hero);
                const hpPercent = Math.max(0, Math.min(100, Math.round((hero.hp / eff.maxHp) * 100)));
                const mpPercent = Math.max(0, Math.min(100, Math.round((hero.mp / eff.maxMp) * 100)));
                const isFallen = hero.hp <= 0;

                return (
                  <div
                    key={hero.id}
                    className={`rounded-xl border p-3 bg-slate-950/60 flex flex-col justify-between ${
                      isFallen ? 'border-rose-900/60 bg-rose-950/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="relative text-2xl h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                        {hero.avatar}
                        {isFallen && (
                          <span className="absolute -bottom-1 -right-1 rounded bg-rose-900 border border-rose-600 px-1 text-[9px] font-bold text-rose-200">
                            KO
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-100 truncate">{hero.name}</h4>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            Lv.{hero.level}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {hero.currentJobId} • {hero.ap} AP
                        </div>
                      </div>
                    </div>

                    {/* Vitals Bars */}
                    <div className="space-y-1 text-[10px]">
                      <div>
                        <div className="flex justify-between text-slate-400">
                          <span>HP</span>
                          <span className={isFallen ? 'text-rose-400 font-bold' : 'text-emerald-300 font-mono'}>
                            {hero.hp}/{eff.maxHp}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-0.5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isFallen ? 'bg-rose-500' : hpPercent < 30 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
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

          {/* Camp Tactical Options Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              Campfire Activities & Options
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Rest by the Campfire */}
              <div
                id="camp_option_rest"
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  usedOptions['rest']
                    ? 'border-emerald-700/60 bg-emerald-950/20 opacity-80'
                    : 'border-slate-800 bg-slate-950/50 hover:border-emerald-600/70 hover:bg-slate-900/80 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-600/60 text-emerald-300">
                        <Heart className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">Tend Wounds & Rest</h4>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Restores 65% HP & 60% MP • Revives Fallen Allies
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    Bandage wounds, brew restorative herbs, and let the party gather strength around the roaring fire.
                    Fallen allies are revived back to 40% HP.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Vitality Boon</span>
                  {usedOptions['rest'] ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Option Used
                    </span>
                  ) : (
                    <button
                      id="camp_action_rest_btn"
                      onClick={handleRest}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg cursor-pointer transition-all"
                    >
                      <span>Rest by Fire</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Tactical Drills */}
              <div
                id="camp_option_drills"
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  usedOptions['drills']
                    ? 'border-indigo-700/60 bg-indigo-950/20 opacity-80'
                    : 'border-slate-800 bg-slate-950/50 hover:border-indigo-600/70 hover:bg-slate-900/80 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-600/60 text-indigo-300">
                        <Swords className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">Combat Drills & Training</h4>
                        <span className="text-[10px] text-indigo-400 font-medium">
                          +150 Job Points (JP) to All Active Classes
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    Spar under the guidance of seasoned veterans to master active job class abilities and accelerate skill tree unlocks.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Martial Training</span>
                  {usedOptions['drills'] ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Option Used
                    </span>
                  ) : (
                    <button
                      id="camp_action_drills_btn"
                      onClick={handleDrills}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg cursor-pointer transition-all"
                    >
                      <span>Conduct Drills</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Option 3: Calibrate Equipment */}
              <div
                id="camp_option_attune"
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  usedOptions['attune']
                    ? 'border-amber-700/60 bg-amber-950/20 opacity-80'
                    : 'border-slate-800 bg-slate-950/50 hover:border-amber-600/70 hover:bg-slate-900/80 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-950 border border-amber-600/60 text-amber-300">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">Calibrate Gear & Scavenge</h4>
                        <span className="text-[10px] text-amber-400 font-medium">
                          +2 AP to All Heroes • +50 Run Gold
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    Hone blades, adjust armor joints, and refine temporal catalysts. Grants Ability Points to master active skills and salvages loose gold.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Smithing & Scavenge</span>
                  {usedOptions['attune'] ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Option Used
                    </span>
                  ) : (
                    <button
                      id="camp_action_attune_btn"
                      onClick={handleAttune}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
                    >
                      <span>Calibrate Gear</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Option 4: Party Sheet Management */}
              <div
                id="camp_option_party_manage"
                className="rounded-xl border border-slate-800 bg-slate-950/50 hover:border-sky-600/70 hover:bg-slate-900/80 p-4 flex flex-col justify-between shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-950 border border-sky-600/60 text-sky-300">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">Party Skills & Equipment</h4>
                        <span className="text-[10px] text-sky-400 font-medium">
                          Assign Job Points, Learn Skills, Equip Artifacts
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    Spend accumulated JP and AP on class talent trees, assign combat formation positions, and optimize equipped gear and relics.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Customization</span>
                  <button
                    id="camp_open_party_sheet_btn"
                    onClick={handleOpenParty}
                    className="flex items-center gap-1.5 rounded-lg border border-sky-500/60 bg-sky-950/60 hover:bg-sky-900/80 px-3.5 py-1.5 text-xs font-bold text-sky-200 transition-all cursor-pointer"
                  >
                    <span>Open Party Sheet</span>
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
            Completed actions take effect immediately for the active expedition.
          </div>

          <button
            id="camp_embark_btn"
            onClick={handleLeaveCamp}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
          >
            <span>Conclude Camp & Embark</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
