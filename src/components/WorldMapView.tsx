import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BIOMES } from '../data/biomes';
import { MapNode, NodeType } from '../types/game';
import { sound } from '../utils/audio';
import {
  Swords,
  Skull,
  Castle,
  Tent,
  Sparkles,
  ShoppingBag,
  Gift,
  Crown,
  Compass,
  Clock,
  ChevronRight,
  TrendingUp,
  MapPin,
  Flame,
  Layers,
} from 'lucide-react';

export const WorldMapView: React.FC = () => {
  const {
    worldMap,
    selectedBiomeId,
    timeSpentMinutes,
    moveToNode,
    setActiveModal,
  } = useGame();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!worldMap) return null;

  const currentBiome = BIOMES.find((b) => b.id === selectedBiomeId) || BIOMES[0];
  const currentNode = worldMap.nodes.find((n) => n.id === worldMap.currentNodeId);
  const selectedNode = worldMap.nodes.find((n) => n.id === selectedNodeId) || currentNode;

  // Connected nodes available for next travel
  const availableNextNodeIds = currentNode ? currentNode.connectedTo : [];

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'start':
        return <Compass className="h-5 w-5 text-sky-400" />;
      case 'battle':
        return <Swords className="h-5 w-5 text-rose-400" />;
      case 'elite':
        return <Skull className="h-5 w-5 text-purple-400" />;
      case 'dungeon':
        return <Castle className="h-5 w-5 text-amber-400" />;
      case 'camp':
        return <Tent className="h-5 w-5 text-emerald-400" />;
      case 'shrine':
        return <Sparkles className="h-5 w-5 text-teal-400" />;
      case 'merchant':
        return <ShoppingBag className="h-5 w-5 text-yellow-400" />;
      case 'treasure':
        return <Gift className="h-5 w-5 text-amber-300" />;
      case 'boss':
        return <Crown className="h-6 w-6 text-amber-300 animate-pulse" />;
    }
  };

  const getNodeBadgeColor = (type: NodeType) => {
    switch (type) {
      case 'start':
        return 'border-sky-500/50 bg-sky-950/70 text-sky-300';
      case 'battle':
        return 'border-rose-500/50 bg-rose-950/70 text-rose-300';
      case 'elite':
        return 'border-purple-500/50 bg-purple-950/70 text-purple-300';
      case 'dungeon':
        return 'border-amber-500/50 bg-amber-950/70 text-amber-300 ring-1 ring-amber-500/40';
      case 'camp':
        return 'border-emerald-500/50 bg-emerald-950/70 text-emerald-300';
      case 'shrine':
        return 'border-teal-500/50 bg-teal-950/70 text-teal-300';
      case 'merchant':
        return 'border-yellow-500/50 bg-yellow-950/70 text-yellow-300';
      case 'treasure':
        return 'border-amber-400/50 bg-amber-950/70 text-amber-200';
      case 'boss':
        return 'border-amber-400 bg-gradient-to-br from-amber-600/60 to-rose-700/60 text-amber-200 ring-2 ring-amber-400';
    }
  };

  // Dynamic threat calculation preview
  const dynamicThreatMultiplier = (
    1.0 +
    (selectedNode ? selectedNode.threatLevel - 1 : 0) * 0.12 +
    worldMap.stepsTaken * 0.05 +
    Math.floor(timeSpentMinutes / 3) * 0.08
  ).toFixed(2);

  return (
    <div id="world_map_view_container" className="flex flex-col min-h-[calc(100vh-60px)] bg-slate-950 text-slate-100 p-4">
      {/* Biome Title & Dynamic Scaling Banner */}
      <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <h1 className="font-['Cinzel'] text-xl font-bold text-slate-100 tracking-wide">
                {currentBiome.name}
              </h1>
              <span className="rounded bg-emerald-950/80 border border-emerald-700 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                Progression Tier {currentBiome.baseLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentBiome.subtitle} — {currentBiome.description}</p>
          </div>

          {/* Dynamic Monster Scaling Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
              <TrendingUp className="h-4 w-4 text-rose-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Scaling Multiplier</div>
                <div className="font-mono font-bold text-rose-300">{dynamicThreatMultiplier}x Threat</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
              <Compass className="h-4 w-4 text-sky-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Distance Traveled</div>
                <div className="font-mono font-bold text-sky-300">{worldMap.stepsTaken} Leagues</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
              <Clock className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Area Time Spent</div>
                <div className="font-mono font-bold text-emerald-300">{timeSpentMinutes} mins</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Interactive Canvas & Node Network */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        {/* Procedural Map Canvas Area */}
        <div className="lg:col-span-3 relative rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden min-h-[500px] flex items-center justify-center p-6 shadow-inner">
          {/* Subtle thematic grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            {worldMap.nodes.map((node) => {
              return node.connectedTo.map((targetId) => {
                const targetNode = worldMap.nodes.find((n) => n.id === targetId);
                if (!targetNode) return null;

                const isPathActive = node.id === worldMap.currentNodeId && availableNextNodeIds.includes(targetId);
                const isPathCompleted = node.completed && targetNode.completed;

                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${targetNode.x}%`}
                    y2={`${targetNode.y}%`}
                    stroke={
                      isPathActive
                        ? '#fbbf24'
                        : isPathCompleted
                        ? '#3b82f6'
                        : '#334155'
                    }
                    strokeWidth={isPathActive ? '3' : isPathCompleted ? '2' : '1.5'}
                    strokeDasharray={isPathActive ? '6 4' : undefined}
                    className={isPathActive ? 'animate-pulse' : ''}
                  />
                );
              });
            })}
          </svg>

          {/* Interactive Map Nodes */}
          {worldMap.nodes.map((node) => {
            const isCurrent = node.id === worldMap.currentNodeId;
            const isAvailable = availableNextNodeIds.includes(node.id);
            const isSelected = selectedNode?.id === node.id;
            const isCompleted = node.completed;

            return (
              <div
                key={node.id}
                id={`map_node_${node.id}`}
                onClick={() => {
                  sound.play('click');
                  setSelectedNodeId(node.id);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 ${getNodeBadgeColor(
                    node.type
                  )} ${
                    isCurrent
                      ? 'ring-4 ring-sky-400 shadow-lg shadow-sky-400/30 scale-110'
                      : isAvailable
                      ? 'ring-4 ring-amber-400/80 shadow-lg shadow-amber-400/40 animate-bounce scale-105'
                      : isCompleted
                      ? 'opacity-60'
                      : 'opacity-85 hover:scale-110'
                  } ${isSelected ? 'border-white shadow-xl' : ''}`}
                >
                  {getNodeIcon(node.type)}
                </div>

                {/* Node Mini Label */}
                <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/90 border border-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 pointer-events-none">
                  {node.type === 'boss' ? 'BIOME BOSS' : node.type.toUpperCase()}
                </div>

                {/* Current Location Ping */}
                {isCurrent && (
                  <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-slate-950 text-[10px] font-bold shadow">
                    YOU
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Node Details & Action Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>NODE INTELLIGENCE</span>
            </div>

            {selectedNode ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-xl border ${getNodeBadgeColor(selectedNode.type)}`}>
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{selectedNode.name}</h3>
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">
                      Type: {selectedNode.type} • Threat Lv.{selectedNode.threatLevel}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-3">
                  {selectedNode.description}
                </p>

                {/* Special Perks for Dungeons, Bosses, Camp, and Sanctuary */}
                {selectedNode.type === 'camp' && (
                  <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-200">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Tent className="h-4 w-4 text-emerald-400" /> Campfire Oasis
                    </div>
                    <span>
                      A safe haven to rest, recover HP/MP, revive fallen allies, conduct tactical job drills for <strong>+150 JP</strong>, or calibrate gear for <strong>+2 AP</strong>.
                    </span>
                  </div>
                )}

                {(selectedNode.type === 'shrine' || selectedNode.type === 'start') && (
                  <div className="mt-3 rounded-xl border border-teal-500/40 bg-teal-950/30 p-3 text-xs text-teal-200">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Sparkles className="h-4 w-4 text-teal-300" /> Astral Sanctuary Altar
                    </div>
                    <span>
                      Commune with celestial aether to receive full renewal with <strong>+30 Max HP</strong>, channel <strong>+3 AP & +75 Aether Shards</strong>, or unseal ancient reliquary loot.
                    </span>
                  </div>
                )}

                {selectedNode.type === 'dungeon' && (
                  <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Castle className="h-4 w-4 text-amber-400" /> High Challenge Dungeon
                    </div>
                    <span>
                      Dungeons contain elite trials and underground crypt guardians. Defeating them guarantees rare <strong>Persistent Artifacts</strong> that stay in your permanent vault across runs!
                    </span>
                  </div>
                )}

                {selectedNode.type === 'boss' && (
                  <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Crown className="h-4 w-4 text-rose-400" /> Biome Supreme Sovereign
                    </div>
                    <span>
                      Defeating this entity conquers <strong>{currentBiome.name}</strong>, unlocks subsequent biomes, and awards legendary persistent relics!
                    </span>
                  </div>
                )}

                {selectedNode.completed && (
                  <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    ✓ Cleared / Completed
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                Select a node on the map to inspect threats and rewards.
              </div>
            )}
          </div>

          {/* Action Travel Button */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            {selectedNode && availableNextNodeIds.includes(selectedNode.id) ? (
              <button
                id="world_map_travel_btn"
                onClick={() => moveToNode(selectedNode.id)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
              >
                <span>Travel to {selectedNode.type.toUpperCase()}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : selectedNode?.id === worldMap.currentNodeId ? (
              <div className="space-y-2">
                <div className="text-center py-2 text-xs text-sky-400 font-medium bg-sky-950/40 border border-sky-800/50 rounded-xl">
                  Current Location: {selectedNode.name}
                </div>
                {selectedNode.type === 'camp' && (
                  <button
                    id="current_node_camp_btn"
                    onClick={() => {
                      sound.play('click');
                      setActiveModal('camp');
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
                  >
                    <Tent className="h-4 w-4" />
                    <span>Open Camp Options</span>
                  </button>
                )}
                {(selectedNode.type === 'shrine' || selectedNode.type === 'start') && (
                  <button
                    id="current_node_sanctuary_btn"
                    onClick={() => {
                      sound.play('click');
                      setActiveModal('sanctuary');
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 py-2.5 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Open Sanctuary Options</span>
                  </button>
                )}
                {selectedNode.type === 'merchant' && (
                  <button
                    id="current_node_merchant_btn"
                    onClick={() => {
                      sound.play('click');
                      setActiveModal('merchant');
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 py-2.5 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Open Merchant Wares</span>
                  </button>
                )}
                {selectedNode.type === 'dungeon' && (
                  <button
                    id="current_node_dungeon_btn"
                    onClick={() => {
                      sound.play('click');
                      setActiveModal('dungeon');
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-2.5 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
                  >
                    <Castle className="h-4 w-4" />
                    <span>Explore Dungeon Crypt</span>
                  </button>
                )}

                {/* Direct buttons for connected next destinations so players are never stuck */}
                {availableNextNodeIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 text-amber-400" /> Available Next Paths:
                    </div>
                    {availableNextNodeIds.map((nextId) => {
                      const target = worldMap.nodes.find((n) => n.id === nextId);
                      if (!target) return null;
                      return (
                        <button
                          key={target.id}
                          id={`travel_to_${target.id}_btn`}
                          onClick={() => moveToNode(target.id)}
                          className="w-full flex items-center justify-between rounded-xl border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 p-2.5 text-xs font-bold text-amber-200 shadow-md cursor-pointer transition-all text-left"
                        >
                          <div className="flex items-center gap-2">
                            {getNodeIcon(target.type)}
                            <div>
                              <div className="font-semibold text-slate-100">{target.name}</div>
                              <div className="text-[10px] text-amber-400 capitalize">Type: {target.type} • Threat Lv.{target.threatLevel}</div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-amber-400" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-500 italic">
                {selectedNode?.completed
                  ? 'Area already cleared. Select next highlighted node.'
                  : 'Follow the glowing connecting path to reach this destination.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
