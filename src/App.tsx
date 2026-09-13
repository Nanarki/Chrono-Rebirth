import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeaderBar } from './components/HeaderBar';
import { WorldMapView } from './components/WorldMapView';
import { CombatView } from './components/CombatView';
import { PartySheetModal } from './components/PartySheetModal';
import { InventoryModal } from './components/InventoryModal';
import { ResearchSanctumModal } from './components/ResearchSanctumModal';
import { DungeonModal } from './components/DungeonModal';
import { MerchantModal } from './components/MerchantModal';
import { CampModal } from './components/CampModal';
import { SanctuaryModal } from './components/SanctuaryModal';
import { NewRunSetupModal } from './components/NewRunSetupModal';

const GameMain: React.FC = () => {
  const { isRunActive, combat, activeModal } = useGame();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Universal Tactical Header Bar */}
      <HeaderBar />

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col">
        {!isRunActive ? (
          <NewRunSetupModal />
        ) : combat ? (
          <CombatView />
        ) : (
          <WorldMapView />
        )}
      </main>

      {/* Modal Dialogs & Overlays */}
      {activeModal === 'party_sheet' && <PartySheetModal />}
      {activeModal === 'inventory' && <InventoryModal />}
      {activeModal === 'research' && <ResearchSanctumModal />}
      {activeModal === 'dungeon' && <DungeonModal />}
      {activeModal === 'merchant' && <MerchantModal />}
      {activeModal === 'camp' && <CampModal />}
      {activeModal === 'sanctuary' && <SanctuaryModal />}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <GameMain />
      </GameProvider>
    </ErrorBoundary>
  );
}
