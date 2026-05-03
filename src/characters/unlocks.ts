const MILESTONE_SESSIONS = [7, 30, 100];

export function checkMilestone(totalSessions: number): number | null {
  for (const m of MILESTONE_SESSIONS) {
    if (totalSessions === m) return m;
  }
  return null;
}

export function shouldUnlockDog(totalSessions: number): boolean {
  return totalSessions >= 7;
}
