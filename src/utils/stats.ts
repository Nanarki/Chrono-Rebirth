import { EquipmentItem, HeroCharacter, Stats } from '../types/game';

/**
 * Calculates the total effective stats for a hero:
 * baseStats + weapon + armor + accessory + persistent artifacts
 */
export function getEffectiveStats(hero: HeroCharacter): Stats {
  const defaultStats: Stats = {
    maxHp: 100,
    maxMp: 30,
    atk: 10,
    mag: 10,
    def: 5,
    res: 5,
    spd: 10,
    critRate: 0.05,
  };

  const stats: Stats = {
    ...defaultStats,
    ...(hero && hero.baseStats ? hero.baseStats : {}),
  };

  if (!hero || !hero.equipment) {
    return stats;
  }

  // Equipment slots
  const gearList = [
    hero.equipment.weapon,
    hero.equipment.armor,
    hero.equipment.accessory,
  ].filter(Boolean) as EquipmentItem[];

  gearList.forEach((item) => {
    if (item && item.stats) {
      Object.entries(item.stats).forEach(([k, v]) => {
        if (typeof v === 'number' && k in stats) {
          (stats as any)[k] = ((stats as any)[k] || 0) + v;
        }
      });
    }
  });

  // Persistent artifacts
  if (hero.equipment.artifacts && Array.isArray(hero.equipment.artifacts)) {
    hero.equipment.artifacts.forEach((art) => {
      if (art && art.stats) {
        Object.entries(art.stats).forEach(([k, v]) => {
          if (typeof v === 'number' && k in stats) {
            (stats as any)[k] = ((stats as any)[k] || 0) + v;
          }
        });
      }
    });
  }

  // Ensure minimum thresholds
  stats.maxHp = Math.max(10, Math.round(stats.maxHp));
  stats.maxMp = Math.max(5, Math.round(stats.maxMp));
  stats.atk = Math.max(1, Math.round(stats.atk));
  stats.mag = Math.max(1, Math.round(stats.mag));
  stats.def = Math.max(0, Math.round(stats.def));
  stats.res = Math.max(0, Math.round(stats.res));
  stats.spd = Math.max(1, Math.round(stats.spd));
  stats.critRate = Math.max(0.01, Math.min(0.9, stats.critRate));

  return stats;
}
