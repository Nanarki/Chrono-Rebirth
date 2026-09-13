import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BIOMES } from '../data/biomes';
import { INITIAL_JOBS } from '../data/jobs';
import { sound } from '../utils/audio';
import {
  Sparkles,
  Shield,
  Zap,
  Heart,
  ChevronRight,
  Compass,
  Layers,
  Lock,
  RotateCcw,
  Check,
  User,
  Users,
} from 'lucide-react';

export const NewRunSetupModal: React.FC = () => {
  const {
    unlockedBiomes,
    unlockedJobs,
    persistentArtifactsVault,
    unlockedArtifactSlots,
    startNewRun,
    setActiveModal,
  } = useGame();

  const [selectedBiomeId, setSelectedBiomeId] = useState<string>(unlockedBiomes[0] || 'verdant_canopy');

  // 3 party members initial setup
  const [partyMembers, setPartyMembers] = useState([
    { heroId: 'hero_0', name: 'Valen', avatar: 'Warrior', jobId: 'warrior' },
    { heroId: 'hero_1', name: 'Lyra', avatar: 'Mage', jobId: 'mage' },
    { heroId: 'hero_2', name: 'Elysia', avatar: 'Healer', jobId: 'healer' },
  ]);

  const handleJobChange = (heroIndex: number, newJobId: string) => {
    sound.play('click');
    setPartyMembers((prev) =>
      prev.map((m, idx) => (idx === heroIndex ? { ...m, jobId: newJobId } : m))
    );
  };

  const handleNameChange = (heroIndex: number, newName: string) => {
    setPartyMembers((prev) =>
      prev.map((m, idx) => (idx === heroIndex ? { ...m, name: newName } : m))
    );
  };

  const handleLaunchRun = () => {
    sound.play('time');
    startNewRun(selectedBiomeId, partyMembers);
  };

  return (
    <div id="new_run_setup_container" className="flex min-h-[calc(100vh-60px)] items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 backdrop-blur-md">
        {/* Banner */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-600/30 border border-amber-500/40 text-amber-400">
            <RotateCcw className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="font-['Cinzel'] text-2xl font-bold tracking-wide text-slate-100">
            CHRONO REBIRTH: NEW EXPEDITION
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Assemble a trio of tactical heroes, assign their starting combat classes, and choose an expedition biome.
          </p>
        </div>

        {/* 1. Biome Selection (Only 1 unlocked at start, subsequent environments unlocked by defeating bosses) */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2.5">
            <span className="flex items-center gap-1.5 font-['Cinzel'] tracking-wider text-amber-300">
              <Compass className="h-4 w-4" /> 1. SELECT EXPEDITION BIOME
            </span>
            <span className="text-[11px] text-slate-400">
              Defeat Biome Bosses to unlock subsequent environments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {BIOMES.map((biome) => {
              const isUnlocked = unlockedBiomes.includes(biome.id);
              const isSelected = selectedBiomeId === biome.id;

              return (
                <div
                  key={biome.id}
                  id={`biome_card_${biome.id}`}
                  onClick={() => {
                    if (isUnlocked) {
                      sound.play('click');
                      setSelectedBiomeId(biome.id);
                    }
                  }}
                  className={`relative rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                    !isUnlocked
                      ? 'border-slate-800/60 bg-slate-950/40 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/40 shadow-lg cursor-pointer'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{biome.name}</span>
                      {isUnlocked ? (
                        <span className="rounded bg-emerald-950 border border-emerald-700 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
                          Tier {biome.baseLevel}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{biome.subtitle}</div>
                    <p className="text-[11px] text-slate-300 mt-2 line-clamp-2">
                      {biome.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-amber-300/80">
                    Boss: {biome.bossName.split(',')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Assemble 3 Heroes & Assign Starting Classes */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2.5">
            <span className="flex items-center gap-1.5 font-['Cinzel'] tracking-wider text-sky-300">
              <Users className="h-4 w-4" /> 2. ASSEMBLE 3 HEROES & JOBS
            </span>
            <span className="text-[11px] text-slate-400">
              Warrior, Mage, Healer available • Advanced classes unlock via research & dungeons
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partyMembers.map((member, idx) => {
              const currentJob = INITIAL_JOBS.find((j) => j.id === member.jobId) || INITIAL_JOBS[0];

              return (
                <div
                  key={member.heroId}
                  id={`setup_hero_card_${idx}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold text-sm shadow">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Hero Name
                        </label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleNameChange(idx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    {/* Job Selection Dropdown / Buttons */}
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Starting Job Class:
                      </label>
                      <select
                        value={member.jobId}
                        onChange={(e) => handleJobChange(idx, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-400"
                      >
                        {INITIAL_JOBS.filter((j) => unlockedJobs.includes(j.id)).map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.name} ({job.preferredPosition.toUpperCase()} Rank)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Class Preview */}
                    <div className="mt-3 rounded-lg border border-slate-800/80 bg-slate-900/50 p-2.5 text-xs text-slate-300">
                      <div className="font-semibold text-sky-300 mb-0.5">{currentJob.name}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {currentJob.description}
                      </p>
                    </div>
                  </div>

                  {/* Heirloom Artifact socket preview */}
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                      {unlockedArtifactSlots} Persistent Artifact Socket{unlockedArtifactSlots > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Launch Expedition & Meta Sanctum Quick Link */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => {
              sound.play('click');
              setActiveModal('research');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-all cursor-pointer"
          >
            <Layers className="h-4 w-4" />
            <span>Open Research Sanctum (Spend Aether)</span>
          </button>

          <button
            id="launch_run_btn"
            onClick={handleLaunchRun}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-8 py-3 text-sm font-bold text-slate-950 shadow-xl cursor-pointer transition-all"
          >
            <span>Embark on Expedition</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
