import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BIOMES } from '../data/biomes';
import { sound } from '../utils/audio';
import {
  Users,
  Briefcase,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Coins,
  Compass,
  RotateCcw,
  Clock,
  Shield,
  BookOpen,
} from 'lucide-react';

export const HeaderBar: React.FC = () => {
  const {
    isRunActive,
    selectedBiomeId,
    runGold,
    bagInventory,
    inventoryCapacity,
    aetherShards,
    worldMap,
    timeSpentMinutes,
    activeModal,
    setActiveModal,
    rebirthRun,
  } = useGame();

  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [showRebirthConfirm, setShowRebirthConfirm] = useState(false);

  const toggleMute = () => {
    sound.isMuted = !sound.isMuted;
    setIsMuted(sound.isMuted);
    sound.play('click');
  };

  const currentBiome = BIOMES.find((b) => b.id === selectedBiomeId) || BIOMES[0];

  return (
    <header
      id="app_header_bar"
      className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 text-slate-100 flex flex-wrap items-center justify-between gap-3"
    >
      {/* Brand & Biome Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-purple-600/30 border border-amber-500/40 text-amber-400 shadow-inner">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Cinzel'] font-bold text-base tracking-wide text-slate-100">
                CHRONO REBIRTH
              </span>
              <span className="rounded border border-amber-500/30 bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                ROGUELIKE RPG
              </span>
            </div>
            {isRunActive && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: currentBiome.color }} />
                <span className="font-medium text-slate-300">{currentBiome.name}</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Compass className="h-3 w-3 text-sky-400" />
                  Distance: {worldMap?.stepsTaken || 0} leagues
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="h-3 w-3 text-emerald-400" />
                  Time: {timeSpentMinutes}m
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Run Stats & Meta Resources */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
        {isRunActive && (
          <>
            {/* Run Gold */}
            <div
              id="header_run_gold"
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-950/20 px-2.5 py-1 text-amber-300"
              title="Run Gold (spent at merchants, converted partially on rebirth)"
            >
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono font-semibold">{runGold}</span>
              <span className="text-[10px] text-amber-500/80">Gold</span>
            </div>

            {/* Inventory Capacity */}
            <button
              id="header_inventory_btn"
              onClick={() => {
                sound.play('click');
                setActiveModal(activeModal === 'inventory' ? null : 'inventory');
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-all ${
                bagInventory.length >= inventoryCapacity
                  ? 'border-rose-500/50 bg-rose-950/40 text-rose-300 animate-pulse'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
              }`}
              title="Limited Bag Inventory - Manage equipment and prioritize loot"
            >
              <Briefcase className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-mono font-semibold">
                {bagInventory.length}/{inventoryCapacity}
              </span>
              <span className="text-[10px] text-slate-400">Slots</span>
            </button>

            {/* Party & Skill Tree Button */}
            <button
              id="header_party_btn"
              onClick={() => {
                sound.play('click');
                setActiveModal(activeModal === 'party_sheet' ? null : 'party_sheet');
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-all ${
                activeModal === 'party_sheet'
                  ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-medium">Party & Skills</span>
            </button>
          </>
        )}

        {/* Permanent Meta Aether Shards */}
        <button
          id="header_research_btn"
          onClick={() => {
            sound.play('click');
            setActiveModal(activeModal === 'research' ? null : 'research');
          }}
          className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 px-2.5 py-1 text-purple-300 transition-all cursor-pointer"
          title="Sanctuary: Permanent Aether Shards for the Research Sanctum"
        >
          <Layers className="h-3.5 w-3.5 text-purple-400" />
          <span className="font-mono font-bold text-purple-200">{aetherShards}</span>
          <span className="text-[10px] text-purple-400">Sanctuary / Research</span>
        </button>

        {/* Sound Mute Toggle */}
        <button
          id="header_sound_toggle_btn"
          onClick={toggleMute}
          className="rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 p-1.5 text-slate-400 hover:text-slate-200 transition-all"
          title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
        </button>

        {/* Rebirth Button (Converts all carried loot into Aether Shards) */}
        {isRunActive && (
          <div className="relative">
            <button
              id="header_rebirth_action_btn"
              onClick={() => {
                sound.play('click');
                setShowRebirthConfirm(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 px-2.5 py-1 text-rose-300 transition-all font-semibold cursor-pointer"
              title="Conclude run and convert all loot to Aether Shards"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Rebirth</span>
            </button>

            {/* In-UI Rebirth Confirmation Popover */}
            {showRebirthConfirm && (
              <div
                id="rebirth_confirm_popover"
                className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-rose-600 bg-slate-950 p-4 shadow-2xl z-50 animate-fadeIn text-left"
              >
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs mb-1">
                  <RotateCcw className="h-4 w-4" />
                  <span>Confirm Chrono Rebirth?</span>
                </div>
                <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                  All carried loot and run gold will be converted into permanent Aether Shards for the Research Sanctum.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowRebirthConfirm(false)}
                    className="rounded-lg border border-slate-800 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="rebirth_confirm_yes_btn"
                    onClick={() => {
                      setShowRebirthConfirm(false);
                      rebirthRun(false);
                    }}
                    className="rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1 text-xs font-bold text-white transition-all cursor-pointer shadow-md"
                  >
                    Yes, Rebirth
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
