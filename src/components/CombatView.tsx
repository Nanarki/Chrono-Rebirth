import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { INITIAL_JOBS } from '../data/jobs';
import { AttackType, EquipmentItem, TacticalPosition } from '../types/game';
import { getRarityBadgeColor } from '../utils/loot';
import { sound } from '../utils/audio';
import { getEffectiveStats } from '../utils/stats';
import { HeroCombatSprite, EnemyCombatSprite } from './CombatSprite';
import {
  Shield,
  Zap,
  Flame,
  Snowflake,
  RotateCcw,
  Sparkles,
  Swords,
  Heart,
  Clock,
  ChevronRight,
  Award,
  Crosshair,
  ShieldAlert,
  ArrowUpRight,
  Package,
} from 'lucide-react';

export const CombatView: React.FC = () => {
  const {
    combat,
    party,
    executeHeroAction,
    executeBasicAttack,
    executeDefend,
    forceAdvanceTimeline,
    collectCombatRewards,
    rebirthRun,
    shiftHeroPosition,
  } = useGame();

  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);

  useEffect(() => {
    setIsClaimingRewards(false);
  }, [combat?.isVictory]);

  // Auto-recovery watchdog if combat is stalled waiting on a dead enemy or dead actor
  useEffect(() => {
    if (!combat || combat.isVictory || combat.isDefeat) return;

    // 1. Immediate check: if current turn actor is a dead enemy or missing actor
    const actorInTimeline = combat.timeline.find((a) => a.id === combat.currentTurnActorId);
    if (!actorInTimeline) {
      forceAdvanceTimeline();
      return;
    }

    if (actorInTimeline.type === 'enemy') {
      const enemy = combat.enemies.find((e) => e.id === actorInTimeline.id);
      if (!enemy || enemy.hp <= 0) {
        forceAdvanceTimeline();
        return;
      }
    } else if (actorInTimeline.type === 'hero') {
      const hero = party.find((h) => h.id === actorInTimeline.id);
      if (!hero || hero.hp <= 0) {
        forceAdvanceTimeline();
        return;
      }
    }

    // 2. Timeout failsafe if turn doesn't switch in 2.2 seconds during non-hero turns
    const currentHero = party.find((h) => h.id === combat.currentTurnActorId);
    const isHero = !!currentHero && currentHero.hp > 0;
    if (!isHero) {
      const timer = setTimeout(() => {
        forceAdvanceTimeline();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [combat?.currentTurnActorId, combat?.isVictory, combat?.isDefeat, combat?.timeline, combat?.enemies, party]);

  if (!combat) return null;

  const currentHero = party.find((h) => h.id === combat.currentTurnActorId);
  const isHeroTurn = !!currentHero && currentHero.hp > 0 && !combat.isVictory && !combat.isDefeat;

  // Active Job skills available to this hero
  const activeJob = INITIAL_JOBS.find((j) => j.id === currentHero?.currentJobId);
  const unlockedSkills = (activeJob?.skills || []).filter((s) =>
    currentHero?.unlockedSkillIds.includes(s.id)
  );

  const selectedSkill = activeJob?.skills.find((s) => s.id === selectedSkillId);

  // Handle skill click
  const handleSelectSkill = (skillId: string) => {
    sound.play('click');
    const skill = activeJob?.skills.find((s) => s.id === skillId);
    if (!skill || !currentHero) return;

    if (currentHero.mp < skill.mpCost) {
      return; // Insufficient MP
    }

    if (selectedSkillId === skillId) {
      setSelectedSkillId(null);
      return;
    }

    setSelectedSkillId(skillId);

    // Auto-execute if target is self or all
    if (skill.targetType === 'self') {
      executeHeroAction(skill.id, currentHero.id);
      setSelectedSkillId(null);
    } else if (skill.targetType === 'all_enemies') {
      const aliveTarget = combat.enemies.find((e) => e.hp > 0);
      if (aliveTarget) {
        executeHeroAction(skill.id, aliveTarget.id);
      }
      setSelectedSkillId(null);
    } else if (skill.targetType === 'all_allies') {
      const aliveAlly = party.find((h) => h.hp > 0);
      if (aliveAlly) {
        executeHeroAction(skill.id, aliveAlly.id);
      }
      setSelectedSkillId(null);
    }
  };

  // Handle target click
  const handleTargetClick = (targetId: string, isEnemy: boolean) => {
    if (!isHeroTurn) return;

    if (isEnemy) {
      const enemyTarget = combat.enemies.find((e) => e.id === targetId && e.hp > 0);
      if (!enemyTarget) return; // Ignore clicks on defeated enemies
    } else {
      const heroTarget = party.find((h) => h.id === targetId && h.hp > 0);
      if (!heroTarget) return; // Ignore clicks on fallen heroes
    }

    if (selectedSkill) {
      if (selectedSkill.targetType === 'single_enemy' && isEnemy) {
        executeHeroAction(selectedSkill.id, targetId);
        setSelectedSkillId(null);
      } else if (selectedSkill.targetType === 'single_ally' && !isEnemy) {
        executeHeroAction(selectedSkill.id, targetId);
        setSelectedSkillId(null);
      }
    } else {
      // Default basic attack against enemy
      if (isEnemy) {
        executeBasicAttack(targetId);
      }
    }
  };

  const getElementBadge = (elem: AttackType) => {
    switch (elem) {
      case 'fire':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-orange-950/70 text-orange-400 border border-orange-700/50"><Flame className="h-3 w-3" /> Fire</span>;
      case 'ice':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-cyan-950/70 text-cyan-400 border border-cyan-700/50"><Snowflake className="h-3 w-3" /> Ice</span>;
      case 'lightning':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-950/70 text-amber-400 border border-amber-700/50"><Zap className="h-3 w-3" /> Bolt</span>;
      case 'earth':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-700/50">Earth</span>;
      case 'wind':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-teal-950/70 text-teal-400 border border-teal-700/50">Wind</span>;
      case 'light':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-yellow-950/70 text-yellow-300 border border-yellow-700/50"><Sparkles className="h-3 w-3" /> Light</span>;
      case 'dark':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-purple-950/70 text-purple-400 border border-purple-700/50">Dark</span>;
      case 'slash':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-600">Slash</span>;
      case 'strike':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-600">Strike</span>;
      case 'pierce':
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-600">Pierce</span>;
      default:
        return <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300">Physical</span>;
    }
  };

  return (
    <div id="combat_view_container" className="relative flex min-h-[calc(100vh-60px)] flex-col justify-between bg-slate-950 text-slate-100 p-4">
      {/* 1. Turn Action Timeline Bar (Conditional Turn-Based / FFX style) */}
      <div id="combat_timeline_bar" className="w-full rounded-xl border border-slate-800/80 bg-slate-900/80 p-2.5 backdrop-blur-md shadow-lg mb-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="font-['Cinzel'] tracking-wider">ACTION TIMELINE</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Speed & Time Manipulation dictate turn order)
            </span>
          </div>
          <span className="text-[11px] text-amber-400/90 font-mono">
            {isHeroTurn ? `${currentHero.name}'s Turn` : 'Enemy Action in progress...'}
          </span>
        </div>

        {/* Timeline queue cards */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {combat.timeline
            .slice()
            .sort((a, b) => a.currentDelay - b.currentDelay)
            .map((actor, idx) => {
              const isHero = actor.type === 'hero';
              const isTurn = actor.isCurrentTurn;

              return (
                <div
                  key={`${actor.id}_${idx}`}
                  className={`relative flex min-w-[105px] flex-shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                    isTurn
                      ? 'border-amber-400 bg-amber-950/60 text-amber-200 ring-2 ring-amber-400/50 scale-105 shadow-md'
                      : isHero
                      ? 'border-sky-800/60 bg-sky-950/30 text-sky-200'
                      : 'border-rose-900/60 bg-rose-950/30 text-rose-200'
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isHero ? 'bg-sky-600/50 text-sky-100' : 'bg-rose-600/50 text-rose-100'
                    }`}
                  >
                    {isHero ? actor.name.charAt(0) : 'E'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-[11px]">{actor.name}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>SPD {actor.speed}</span>
                      <span className="font-mono text-amber-300">+{Math.round(actor.currentDelay)}</span>
                    </div>
                  </div>
                  {isTurn && (
                    <div className="absolute -top-1.5 -right-1 rounded-full bg-amber-500 px-1 py-0.2 text-[9px] font-black text-slate-950 shadow">
                      NOW
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* 2. Tactical Battlefield Area: Party (Left) vs Enemies (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 my-2">
        {/* Left Side: Party Heroes & Tactical Positioning */}
        <div id="combat_party_formation" className="flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-['Cinzel'] font-bold text-sky-400 tracking-wider flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> ALLIED FORMATION
            </span>
            <span className="text-[11px] text-slate-400">Frontline protects • Backline +20% Magic</span>
          </div>

          <div className="space-y-3">
            {party.map((hero) => {
              const isTurn = combat.currentTurnActorId === hero.id;
              const isDead = hero.hp <= 0;
              const effectiveHero = getEffectiveStats(hero);
              const hpPct = Math.round((hero.hp / effectiveHero.maxHp) * 100);
              const mpPct = Math.round((hero.mp / effectiveHero.maxMp) * 100);
              const targetableAlly = selectedSkill && (selectedSkill.targetType === 'single_ally' || selectedSkill.targetType === 'all_allies');

              return (
                <div
                  key={hero.id}
                  id={`combat_hero_card_${hero.id}`}
                  onClick={() => {
                    if (targetableAlly && isHeroTurn) {
                      handleTargetClick(hero.id, false);
                    }
                  }}
                  className={`relative rounded-xl border p-3 transition-all ${
                    isDead
                      ? 'border-slate-800 bg-slate-950/50 opacity-40'
                      : isTurn
                      ? 'border-amber-500/80 bg-slate-900/90 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                      : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700'
                  } ${targetableAlly ? 'cursor-pointer hover:border-emerald-400 hover:bg-emerald-950/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Character Combat Sprite */}
                    <div className="flex-shrink-0 flex items-center justify-center w-20 h-24 sm:w-24 sm:h-28 overflow-hidden rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <HeroCombatSprite
                        jobId={hero.currentJobId}
                        name={hero.name}
                        isCurrentTurn={isTurn}
                        isDead={isDead}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-100">{hero.name}</span>
                            <span className="rounded bg-sky-950/80 border border-sky-700/60 px-1.5 py-0.2 text-[10px] font-semibold text-sky-300">
                              Lv.{hero.level} {hero.title}
                            </span>
                          </div>
                          {/* Tactical rank badge & repositioning control */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400">Rank:</span>
                            <div className="flex items-center gap-1">
                              {(['front', 'mid', 'back'] as TacticalPosition[]).map((pos) => (
                                <button
                                  key={pos}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    shiftHeroPosition(hero.id, pos);
                                  }}
                                  className={`rounded px-1.5 py-0.5 text-[9px] uppercase font-bold transition-all cursor-pointer ${
                                    hero.position === pos
                                      ? pos === 'front'
                                        ? 'bg-rose-950 border border-rose-500 text-rose-300'
                                        : pos === 'mid'
                                        ? 'bg-amber-950 border border-amber-500 text-amber-300'
                                        : 'bg-indigo-950 border border-indigo-500 text-indigo-300'
                                      : 'bg-slate-800/40 text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  {pos}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Active Persistent Artifacts */}
                        {hero.equipment.artifacts.length > 0 && (
                          <div className="flex items-center gap-1">
                            {hero.equipment.artifacts.map((art, aIdx) => (
                              <div
                                key={`${art.id}_${aIdx}`}
                                className="flex h-6 w-6 items-center justify-center rounded border border-purple-500/50 bg-purple-950/50 text-purple-300"
                                title={`${art.name}: ${art.uniqueEffect}`}
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* HP and MP Gauge with effective stats */}
                      <div className="mt-2 space-y-1.5">
                        {/* Health Bar */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="text-slate-400 font-medium flex items-center gap-1">
                              <Heart className="h-3 w-3 text-rose-500" /> HP
                            </span>
                            <span className="font-mono text-slate-200">
                              {hero.hp} / {effectiveHero.maxHp}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-rose-600 to-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
                            />
                          </div>
                        </div>

                        {/* Mana Bar */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="text-slate-400 font-medium flex items-center gap-1">
                              <Zap className="h-3 w-3 text-sky-400" /> MP
                            </span>
                            <span className="font-mono text-slate-200">
                              {hero.mp} / {effectiveHero.maxMp}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full bg-sky-500 transition-all duration-300"
                              style={{ width: `${Math.max(0, Math.min(100, mpPct))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Enemies with Shields & Weaknesses */}
        <div id="combat_enemy_formation" className="flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-['Cinzel'] font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
              <Swords className="h-4 w-4" /> HOSTILE TARGETS
            </span>
            <span className="text-[11px] text-amber-400">Strike weaknesses to BREAK shields!</span>
          </div>

          <div className="space-y-3">
            {combat.enemies.map((enemy) => {
              const isDead = enemy.hp <= 0;
              const hpPct = Math.round((enemy.hp / enemy.maxHp) * 100);
              const isHovered = hoveredTargetId === enemy.id;
              const isTurn = combat.currentTurnActorId === enemy.id;

              return (
                <div
                  key={enemy.id}
                  id={`combat_enemy_card_${enemy.id}`}
                  onMouseEnter={() => setHoveredTargetId(enemy.id)}
                  onMouseLeave={() => setHoveredTargetId(null)}
                  onClick={() => {
                    if (isHeroTurn && !isDead) {
                      handleTargetClick(enemy.id, true);
                    }
                  }}
                  className={`relative rounded-xl border p-3 transition-all ${
                    isDead
                      ? 'border-slate-800 bg-slate-950/40 opacity-30 pointer-events-none'
                      : isHovered && isHeroTurn
                      ? 'border-rose-500 bg-rose-950/30 ring-2 ring-rose-500/50 cursor-crosshair scale-[1.02]'
                      : enemy.isBroken
                      ? 'border-amber-400/80 bg-amber-950/30 shadow-lg shadow-amber-500/20 animate-pulse'
                      : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  {/* Break State Overlay */}
                  {enemy.isBroken && !isDead && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950 shadow-md z-10">
                      <Sparkles className="h-3 w-3" /> BREAK STUNNED (1.5x DMG)
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {/* Enemy Animated Sprite */}
                    <div className="flex-shrink-0 flex items-center justify-center w-20 h-24 sm:w-24 sm:h-28 overflow-hidden rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <EnemyCombatSprite
                        name={enemy.name}
                        isBoss={enemy.isBoss}
                        isElite={enemy.isElite}
                        isBroken={enemy.isBroken}
                        isCurrentTurn={isTurn}
                        isDead={isDead}
                        elementWeaknesses={enemy.weaknesses}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-100">{enemy.name}</span>
                            <span className="rounded bg-rose-950/80 border border-rose-700/60 px-1.5 py-0.2 text-[10px] font-semibold text-rose-300">
                              Lv.{enemy.level} {enemy.isBoss ? 'BOSS' : enemy.isElite ? 'ELITE' : 'Rank ' + enemy.position}
                            </span>
                          </div>

                          {/* Shield Points */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                              Shields:
                            </span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: enemy.maxShields }).map((_, sIdx) => (
                                <div
                                  key={sIdx}
                                  className={`h-3 w-2.5 rounded-sm transition-all ${
                                    sIdx < enemy.shields
                                      ? 'bg-amber-400 border border-amber-300 shadow-sm'
                                      : 'bg-slate-800 border border-slate-700 opacity-40'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enemy HP bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="text-slate-400">Health</span>
                          <span className="font-mono text-slate-200">
                            {enemy.hp} / {enemy.maxHp}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
                            style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
                          />
                        </div>
                      </div>

                      {/* Elemental Weaknesses (Revealed & Hidden) */}
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">Weaknesses:</span>
                        {enemy.weaknesses.map((weakElem, idx) => {
                          const isRevealed = enemy.revealedWeaknesses.includes(weakElem);
                          if (isRevealed) {
                            return <div key={idx}>{getElementBadge(weakElem)}</div>;
                          }
                          return (
                            <span
                              key={idx}
                              className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400"
                              title="Hidden Elemental Weakness - Strike with attacks to discover!"
                            >
                              ?
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Combat Control & Time Manipulation Spell Bar */}
      <div id="combat_action_dock" className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 backdrop-blur-md shadow-2xl">
        {/* Action Header & Context */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs">
              ⚡
            </span>
            <span className="font-['Cinzel'] font-bold text-sm text-slate-100">
              {isHeroTurn ? `${currentHero.name}'s Tactical Command` : 'Awaiting enemy turn completion...'}
            </span>
            {isHeroTurn && (
              <span className="text-xs text-slate-400">
                (MP: {currentHero.mp}/{currentHero.baseStats.maxMp})
              </span>
            )}
          </div>

          {/* Combat Log snippet */}
          {combat.combatLog.length > 0 && (
            <div className="text-xs text-amber-300 font-medium italic max-w-md truncate">
              {combat.combatLog[0]}
            </div>
          )}
        </div>

        {/* Skill Buttons */}
        {isHeroTurn ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Standard Attacks */}
            <div className="flex items-center gap-2">
              <button
                id="combat_basic_attack_btn"
                onClick={() => {
                  sound.play('click');
                  setSelectedSkillId(null);
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                  selectedSkillId === null
                    ? 'border-amber-400 bg-amber-950/60 text-amber-200 ring-2 ring-amber-400/30'
                    : 'border-slate-800 bg-slate-800/50 hover:bg-slate-700/60 text-slate-300'
                }`}
              >
                <Swords className="h-4 w-4 text-amber-400" />
                <span>Basic Attack (0 MP)</span>
              </button>

              <button
                id="combat_defend_btn"
                onClick={executeDefend}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-700/60 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all"
              >
                <Shield className="h-4 w-4 text-sky-400" />
                <span>Defend (Quick Delay)</span>
              </button>
            </div>

            {/* Job Skills with Time Flow Manipulation Indicators */}
            <div className="flex flex-wrap items-center gap-2">
              {unlockedSkills.map((skill) => {
                const isSelected = selectedSkillId === skill.id;
                const canAfford = currentHero.mp >= skill.mpCost;

                return (
                  <button
                    key={skill.id}
                    id={`combat_skill_btn_${skill.id}`}
                    disabled={!canAfford}
                    onClick={() => handleSelectSkill(skill.id)}
                    className={`flex flex-col items-start rounded-xl border px-3.5 py-2 text-left transition-all ${
                      !canAfford
                        ? 'border-slate-800/50 bg-slate-900/30 text-slate-600 cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'border-sky-400 bg-sky-950/80 text-sky-200 ring-2 ring-sky-400/40 shadow-md'
                        : 'border-slate-800 bg-slate-800/60 hover:bg-slate-700/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{skill.name}</span>
                      <span className="rounded bg-sky-900/80 px-1 py-0.2 text-[10px] font-mono text-sky-300">
                        {skill.mpCost} MP
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      {getElementBadge(skill.element)}
                      {skill.timelineDelayMod && skill.timelineDelayMod !== 0 && (
                        <span className="font-mono text-amber-300 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {skill.timelineDelayMod > 0 ? `+${skill.timelineDelayMod} Delay` : `${skill.timelineDelayMod} Advance`}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-2 text-center text-xs text-slate-400 italic flex items-center justify-center gap-3">
            <span>Waiting for timeline action to resolve...</span>
            <button
              onClick={forceAdvanceTimeline}
              className="px-2.5 py-1 text-[11px] not-italic rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors shadow-sm"
              title="Click to immediately resume next turn if animation or turn pauses"
            >
              Skip / Resume Turn
            </button>
          </div>
        )}

        {/* Prompt when skill is selected */}
        {selectedSkill && isHeroTurn && (
          <div className="mt-3 rounded-lg border border-sky-500/40 bg-sky-950/40 px-3 py-2 text-xs text-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-sky-400 animate-spin" />
              <span>
                Select a {selectedSkill.targetType.includes('ally') ? 'Party Member' : 'Target Enemy'} to unleash <strong>{selectedSkill.name}</strong> ({selectedSkill.description})
              </span>
            </div>
            <button
              onClick={() => setSelectedSkillId(null)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* 4. Post-Battle Victory Dialog (Rewards & Growth) */}
      {combat.isVictory && (
        <div id="combat_victory_modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-5">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg">
                <Award className="h-8 w-8" />
              </div>
              <h2 className="font-['Cinzel'] text-2xl font-bold text-amber-300 tracking-wide">
                VICTORY ACHIEVED!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                The hostile entities were vanquished. Collect spoils and allocate battle rewards.
              </p>
            </div>

            {/* Growth Rewards (XP, JP, AP, Gold) */}
            {(() => {
              const rewards = combat.rewardsPending || { xp: 45, jp: 30, ap: 1, gold: 25, loot: [] };
              return (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="rounded-xl border border-sky-800/60 bg-sky-950/40 p-2.5 text-center">
                      <div className="text-[10px] uppercase font-semibold text-sky-400">Experience</div>
                      <div className="font-mono text-base font-bold text-sky-200">+{rewards.xp} XP</div>
                    </div>
                    <div className="rounded-xl border border-indigo-800/60 bg-indigo-950/40 p-2.5 text-center">
                      <div className="text-[10px] uppercase font-semibold text-indigo-400">Job Points</div>
                      <div className="font-mono text-base font-bold text-indigo-200">+{rewards.jp} JP</div>
                    </div>
                    <div className="rounded-xl border border-purple-800/60 bg-purple-950/40 p-2.5 text-center">
                      <div className="text-[10px] uppercase font-semibold text-purple-400">Ability Points</div>
                      <div className="font-mono text-base font-bold text-purple-200">+{rewards.ap} AP</div>
                    </div>
                    <div className="rounded-xl border border-amber-800/60 bg-amber-950/40 p-2.5 text-center">
                      <div className="text-[10px] uppercase font-semibold text-amber-400">Run Gold</div>
                      <div className="font-mono text-base font-bold text-amber-200">+{rewards.gold} G</div>
                    </div>
                  </div>

                  {/* Persistent Artifact Drop if Boss Defeated */}
                  {rewards.artifact && (
                    <div className="mb-4 rounded-xl border border-amber-500/80 bg-gradient-to-r from-amber-950/60 via-purple-950/60 to-slate-900 p-3.5 shadow-lg animate-pulse">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase mb-1">
                        <Sparkles className="h-4 w-4" /> PERSISTENT ARTIFACT DISCOVERED!
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/30 text-amber-300 border border-amber-400">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-100">
                            {rewards.artifact.name}
                          </div>
                          <div className="text-xs text-amber-200/90">
                            {rewards.artifact.uniqueEffect}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Added permanently to your Artifact Vault across all runs.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loot Dropped */}
                  {rewards.loot && rewards.loot.length > 0 && (
                    <div className="mb-5">
                      <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-sky-400" /> Equipment Loot Discovered:
                      </div>
                      <div className="space-y-1.5">
                        {rewards.loot.map((item, idx) => (
                          <div
                            key={`${item.id}_${idx}`}
                            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase ${getRarityBadgeColor(item.rarity)}`}>
                                {item.rarity}
                              </span>
                              <span className="font-semibold text-slate-200">{item.name}</span>
                              <span className="text-[10px] text-slate-400 capitalize">({item.slot})</span>
                            </div>
                            <div className="text-[11px] text-amber-400 font-mono">+{item.value} Aether Value</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Collect & Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                id="combat_claim_rewards_btn"
                disabled={isClaimingRewards}
                onClick={() => {
                  setIsClaimingRewards(true);
                  collectCombatRewards(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isClaimingRewards ? 'Claiming Spoils...' : 'Claim Spoils & Customize Skills'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                id="combat_claim_and_return_map_btn"
                disabled={isClaimingRewards}
                onClick={() => {
                  setIsClaimingRewards(true);
                  collectCombatRewards(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-200 shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Return to Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Defeat Modal */}
      {combat.isDefeat && (
        <div id="combat_defeat_modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl text-center text-slate-100">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-950 border border-rose-600/50 text-rose-400">
              <RotateCcw className="h-8 w-8" />
            </div>
            <h2 className="font-['Cinzel'] text-2xl font-bold text-rose-400 tracking-wide">
              PARTY VANQUISHED
            </h2>
            <p className="text-xs text-slate-300 mt-2">
              The mortal vessel has perished, but your aether echoes through time. Rebirth now to convert all carried equipment into Aether Shards for permanent meta-upgrades!
            </p>
            <button
              id="combat_rebirth_defeat_btn"
              onClick={() => rebirthRun(true)}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 py-3 text-sm font-bold text-white shadow-lg cursor-pointer transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Initiate Rebirth & Open Research Sanctum</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
