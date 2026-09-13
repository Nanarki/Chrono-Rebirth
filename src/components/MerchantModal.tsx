import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { EquipmentItem } from '../types/game';
import { generateLootItem, getRarityBadgeColor } from '../utils/loot';
import { sound } from '../utils/audio';
import {
  ShoppingBag,
  X,
  Coins,
  ChevronRight,
  Package,
} from 'lucide-react';

export const MerchantModal: React.FC = () => {
  const {
    runGold,
    bagInventory,
    inventoryCapacity,
    unlockedMaxRarity,
    worldMap,
    buyShopItem,
    activeModal,
    setActiveModal,
  } = useGame();

  // Procedural wares for this merchant
  const [wares] = useState<EquipmentItem[]>(() => {
    const lvl = worldMap?.stepsTaken ? Math.max(1, Math.round(worldMap.stepsTaken * 0.8)) : 1;
    return [
      generateLootItem(lvl, unlockedMaxRarity, false, 'weapon'),
      generateLootItem(lvl, unlockedMaxRarity, false, 'armor'),
      generateLootItem(lvl, unlockedMaxRarity, false, 'accessory'),
    ];
  });

  if (activeModal !== 'merchant') return null;

  return (
    <div id="merchant_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl border border-yellow-600/50 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-950 border border-yellow-600/50 text-yellow-400 shadow">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Cinzel'] text-lg font-bold text-slate-100 tracking-wide">
                  NOMADIC CHRONO TRADER
                </h2>
                <span className="rounded bg-amber-950 border border-amber-600 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                  {runGold} Gold Available
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Purchase gear to bolster your current expedition. Bag space: {bagInventory.length}/{inventoryCapacity}
              </p>
            </div>
          </div>

          <button
            id="merchant_close_btn"
            onClick={() => {
              sound.play('click');
              setActiveModal(null);
            }}
            className="rounded-lg border border-slate-800 bg-slate-850 p-2 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Goods List */}
        <div className="p-6 space-y-3">
          {wares.map((item, idx) => {
            const canAfford = runGold >= item.value;
            const hasBagSpace = bagInventory.length < inventoryCapacity;
            const isPurchasable = canAfford && hasBagSpace;

            return (
              <div
                key={`${item.id}_${idx}`}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getRarityBadgeColor(item.rarity)}`}>
                      {item.rarity}
                    </span>
                    <span className="font-bold text-sm text-slate-100">{item.name}</span>
                    <span className="text-xs text-slate-400 capitalize">({item.slot})</span>
                  </div>

                  <div className="text-xs text-slate-300 mt-1">
                    {Object.entries(item.stats).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ')}
                  </div>

                  {item.affixes.length > 0 && (
                    <div className="text-[11px] text-amber-300 mt-0.5">
                      • {item.affixes.map((a) => a.description).join(' • ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-amber-300 flex items-center gap-1 justify-end">
                      <Coins className="h-4 w-4 text-amber-400" />
                      {item.value} G
                    </div>
                  </div>

                  <button
                    disabled={!isPurchasable}
                    onClick={() => buyShopItem(item)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isPurchasable
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Buy</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
