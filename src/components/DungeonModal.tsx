import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../utils/audio';
import {
  Castle,
  X,
  Swords,
  Skull,
  Sparkles,
  Shield,
  ChevronRight,
  Flame,
  AlertTriangle,
} from 'lucide-react';

export const DungeonModal: React.FC = () => {
  const {
    activeDungeonNode,
    activeModal,
    setActiveModal,
    enterDungeonCombat,
  } = useGame();

  const [dungeonFloor, setDungeonFloor] = useState<number>(1);

  if (activeModal !== 'dungeon' || !activeDungeonNode) return null;

  return (
    <div id="dungeon_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl border border-amber-600/60 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950 border border-amber-600/60 text-amber-400 shadow">
              <Castle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Cinzel'] text-lg font-bold text-slate-100 tracking-wide">
                  FORGOTTEN CRYPT LABYRINTH
                </h2>
                <span className="rounded bg-amber-950 border border-amber-600 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                  Dungeon Trial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                A perilous descent into ancient catacombs guarding persistent artifacts.
              </p>
            </div>
          </div>

          <button
            id="dungeon_close_btn"
            onClick={() => {
              sound.play('click');
              setActiveModal(null);
            }}
            className="rounded-lg border border-slate-800 bg-slate-850 p-2 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dungeon Content */}
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-1">
              <AlertTriangle className="h-4 w-4" /> HIGH THREAT DUNGEON ENCOUNTER
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You stand before the obsidian gate of the underground crypt. The air is heavy with temporal distortion. Defeating the Dungeon Guardian at the deepest level guarantees a <strong>Persistent Artifact</strong> that stays in your soul vault across rebirths.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="text-xs text-slate-400 font-semibold mb-1">Dungeon Floor</div>
              <div className="font-mono text-xl font-bold text-amber-300">Deep Chamber B2</div>
              <div className="text-[10px] text-slate-500 mt-1">Boss Encounter Waiting</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="text-xs text-slate-400 font-semibold mb-1">Guaranteed Spoils</div>
              <div className="font-mono text-sm font-bold text-purple-300 flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> Persistent Relic
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Permanent across runs</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              id="dungeon_engage_boss_btn"
              onClick={() => {
                enterDungeonCombat();
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
            >
              <Swords className="h-4 w-4" />
              <span>Engage Dungeon Guardian</span>
            </button>

            <button
              onClick={() => {
                sound.play('click');
                setActiveModal(null);
              }}
              className="rounded-xl border border-slate-800 bg-slate-850 hover:bg-slate-800 px-4 py-3 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              Retreat to Wilderness
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
