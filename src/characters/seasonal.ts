// Seasonal character drops — auto-unlock during date windows.
// characterId must exist in CHARACTER_REGISTRY.
// Dates are MM-DD strings (no year) for annual recurrence.

interface SeasonalDrop {
  characterId: string;
  startMD: string;
  endMD: string;
}

const SEASONAL_DROPS: SeasonalDrop[] = [
  { characterId: 'zen_frog',   startMD: '03-20', endMD: '06-20' }, // Spring (Northern)
  { characterId: 'otter',      startMD: '06-21', endMD: '09-22' }, // Summer
  { characterId: 'red_panda',  startMD: '09-23', endMD: '12-20' }, // Autumn
  { characterId: 'penguin',    startMD: '12-21', endMD: '03-20' }, // Winter
];

function todayMD(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

function isInWindow(today: string, start: string, end: string): boolean {
  if (start <= end) {
    return today >= start && today <= end;
  }
  // Wraps year boundary (e.g. Dec 21 → Mar 19)
  return today >= start || today <= end;
}

export function getActiveSeasonalDrops(): string[] {
  const today = todayMD();
  return SEASONAL_DROPS
    .filter(d => isInWindow(today, d.startMD, d.endMD))
    .map(d => d.characterId);
}

export async function applySeasonalDrops(
  currentUnlocked: string[],
): Promise<{ updated: string[]; newDrops: string[] }> {
  const active = getActiveSeasonalDrops();
  const set = new Set(currentUnlocked);
  const newDrops = active.filter(id => !set.has(id));
  if (!newDrops.length) return { updated: currentUnlocked, newDrops: [] };
  return { updated: [...currentUnlocked, ...newDrops], newDrops };
}
