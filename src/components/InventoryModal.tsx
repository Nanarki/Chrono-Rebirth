import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { EquipmentItem, ItemSlot, PersistentArtifact, Stats } from '../types/game';
import { getRarityBadgeColor } from '../utils/loot';
import { sound } from '../utils/audio';
import { getEffectiveStats } from '../utils/stats';
import {
  X,
  Briefcase,
  Shield,
  Sparkles,
  Zap,
  Swords,
  Heart,
  Clock,
  Trash2,
  Coins,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight,
  Plus,
} from 'lucide-react';

export const InventoryModal: React.FC = () => {
  const {
    party,
    selectedHeroId,
    setSelectedHeroId,
    bagInventory,
    inventoryCapacity,
    unlockedArtifactSlots,
    persistentArtifactsVault,
    equipItem,
    unequipItem,
    equipArtifact,
    unequipArtifact,
    discardItem,
    activeModal,
    setActiveModal,
  } = useGame();

  const [inspectedItem, setInspectedItem] = useState<EquipmentItem | null>(null);
  const [inspectedArtifact, setInspectedArtifact] = useState<PersistentArtifact | null>(null);

  if (activeModal !== 'inventory') return null;

  const currentHero = party.find((h) => h.id === selectedHeroId) || party[0];
  const totalHeroStats = getEffectiveStats(currentHero);

  // Compare inspected item with currently equipped in that slot
  const currentEquippedInSlot = inspectedItem ? currentHero.equipment[inspectedItem.slot] : null;

  const renderStatDiff = (statKey: keyof Stats, label: string) => {
    if (!inspectedItem) return null;
    const newItemVal = (inspectedItem.stats[statKey] as number) || 0;
    const oldItemVal = currentEquippedInSlot ? (currentEquippedInSlot.stats[statKey] as number) || 0 : 0;
    const diff = newItemVal - oldItemVal;

    return (
      <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
        <span className="text-slate-400">{label}</span>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-200">{totalHeroStats[statKey]}</span>
          {diff !== 0 && (
            <span
              className={`text-xs font-bold ${
                diff > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {diff > 0 ? `+${diff}` : diff}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="inventory_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="flex flex-col h-[90vh] w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-950 border border-sky-700/60 text-sky-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Cinzel'] text-lg font-bold text-slate-100 tracking-wide">
                  TACTICAL GEAR & BAG STORAGE
                </h2>
                <span className="rounded bg-sky-950/80 border border-sky-600/60 px-2 py-0.5 text-xs font-mono font-bold text-sky-300">
                  {bagInventory.length} / {inventoryCapacity} Slots
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Storage space is limited. Carried equipment converts into Aether upon Rebirth!
              </p>
            </div>
          </div>

          <button
            id="inventory_close_btn"
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
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
          {party.map((hero) => {
            const isSelected = hero.id === currentHero.id;
            return (
              <button
                key={hero.id}
                id={`inv_hero_tab_${hero.id}`}
                onClick={() => {
                  sound.play('click');
                  setSelectedHeroId(hero.id);
                  setInspectedItem(null);
                }}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-400 text-sky-300 bg-sky-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold">
                  {hero.name.charAt(0)}
                </span>
                <span>{hero.name}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400 font-normal">
                  {hero.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-y-auto p-6 gap-6">
          {/* Left Column: Currently Equipped Gear & Persistent Artifact Slots */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="font-['Cinzel'] font-bold text-sm text-slate-200 mb-3 flex items-center justify-between">
                <span>EQUIPPED LOADOUT:</span>
                <span className="text-xs text-sky-400">{currentHero.name}</span>
              </h3>

              {/* Slots: Weapon, Armor, Accessory */}
              <div className="space-y-2.5">
                {(['weapon', 'armor', 'accessory'] as ItemSlot[]).map((slot) => {
                  const item = currentHero.equipment[slot];

                  return (
                    <div
                      key={slot}
                      className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">
                          {slot === 'weapon' ? 'Main-Hand Weapon' : slot === 'armor' ? 'Body Armor' : 'Accessory'}
                        </div>
                        {item ? (
                          <div className="mt-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getRarityBadgeColor(item.rarity)}`}>
                                {item.rarity}
                              </span>
                              <span className="font-semibold text-xs text-slate-200">{item.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {Object.entries(item.stats).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-600 italic mt-0.5">Empty slot</div>
                        )}
                      </div>

                      {item && (
                        <button
                          onClick={() => unequipItem(currentHero.id, slot)}
                          disabled={bagInventory.length >= inventoryCapacity}
                          className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] text-slate-300 transition-all cursor-pointer"
                        >
                          Unequip
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Persistent Artifact Slots */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-300 mb-2">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    PERSISTENT ARTIFACTS
                  </span>
                  <span className="font-mono text-[11px] text-purple-400">
                    {currentHero.equipment.artifacts.length} / {unlockedArtifactSlots} Slots
                  </span>
                </div>

                <div className="space-y-2">
                  {Array.from({ length: unlockedArtifactSlots }).map((_, slotIdx) => {
                    const art = currentHero.equipment.artifacts[slotIdx];

                    return (
                      <div
                        key={slotIdx}
                        className="rounded-lg border border-purple-900/40 bg-purple-950/20 p-2.5 flex items-center justify-between gap-2"
                      >
                        {art ? (
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-purple-200 truncate">{art.name}</div>
                            <div className="text-[10px] text-purple-300/80 truncate">{art.uniqueEffect}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic">Empty Artifact Socket</div>
                        )}

                        {art && (
                          <button
                            onClick={() => unequipArtifact(currentHero.id, art.id)}
                            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] text-purple-300 cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Bag Storage Inventory Grid */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-['Cinzel'] font-bold text-sm text-slate-200">
                  CARRIED INVENTORY ({bagInventory.length}/{inventoryCapacity})
                </h3>
                <span className="text-[10px] text-slate-400">Click item to inspect & compare</span>
              </div>

              {bagInventory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Briefcase className="h-10 w-10 text-slate-700 mb-2" />
                  <p className="text-xs">Your bag is empty.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Defeat enemies and open treasure vaults to scavenge loot.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1">
                  {bagInventory.map((item, idx) => {
                    const isInspected = inspectedItem?.id === item.id;

                    return (
                      <div
                        key={`${item.id}_${idx}`}
                        id={`bag_item_${item.id}_${idx}`}
                        onClick={() => {
                          sound.play('click');
                          setInspectedItem(item);
                          setInspectedArtifact(null);
                        }}
                        className={`rounded-lg border p-2.5 transition-all cursor-pointer ${
                          isInspected
                            ? 'border-sky-400 bg-sky-950/40 ring-1 ring-sky-400/50'
                            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getRarityBadgeColor(item.rarity)}`}>
                              {item.rarity}
                            </span>
                            <span className="font-semibold text-xs text-slate-200">{item.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-300">+{item.value} Aether</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span className="capitalize">{item.slot}</span>
                          <span>
                            {Object.entries(item.stats)
                              .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
                              .join(' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Item Inspection & Stat Diff Comparison */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 h-full flex flex-col justify-between">
              <div>
                <h3 className="font-['Cinzel'] font-bold text-sm text-slate-200 mb-3 flex items-center justify-between">
                  <span>ITEM INSPECTION & STAT DIFF</span>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </h3>

                {inspectedItem ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getRarityBadgeColor(inspectedItem.rarity)}`}>
                          {inspectedItem.rarity}
                        </span>
                        <span className="text-xs font-mono text-amber-300">
                          Rebirth Value: {inspectedItem.value} Aether
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-100 mt-2">{inspectedItem.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">{inspectedItem.description}</p>

                      {/* Affixes */}
                      {inspectedItem.affixes.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
                          <div className="text-[10px] uppercase font-bold text-amber-400">Special Affixes:</div>
                          {inspectedItem.affixes.map((aff, aIdx) => (
                            <div key={aIdx} className="text-xs text-amber-200 flex items-center gap-1">
                              • {aff.description}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stat Diff Matrix against current loadout */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                      <div className="text-[11px] font-bold text-slate-300 mb-2">
                        Stat Impact on {currentHero.name}:
                      </div>
                      {renderStatDiff('atk', 'Physical Attack (ATK)')}
                      {renderStatDiff('mag', 'Magic Power (MAG)')}
                      {renderStatDiff('def', 'Physical Defense (DEF)')}
                      {renderStatDiff('res', 'Magic Resistance (RES)')}
                      {renderStatDiff('spd', 'Action Speed (SPD)')}
                      {renderStatDiff('maxHp', 'Maximum HP')}
                      {renderStatDiff('maxMp', 'Maximum MP')}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Select an item in your bag to see its details and stat comparisons.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {inspectedItem && (
                <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                  <button
                    id="inv_equip_item_btn"
                    onClick={() => {
                      equipItem(currentHero.id, inspectedItem);
                      setInspectedItem(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 py-2.5 text-xs font-bold text-slate-950 shadow-md cursor-pointer transition-all"
                  >
                    <span>Equip to {currentHero.name}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    id="inv_scrap_item_btn"
                    onClick={() => {
                      discardItem(inspectedItem.id);
                      setInspectedItem(null);
                    }}
                    className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-rose-950/50 hover:border-rose-700/60 p-2.5 text-xs text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
                    title="Scrap item for instant run gold"
                  >
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span>Scrap</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
