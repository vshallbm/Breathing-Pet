import type { BreathingPattern } from '../content/breathing-engine';

export const box4444: BreathingPattern = {
  id: 'box_4_4_4_4',
  label: 'Box (4-4-4-4)',
  phases: [
    { label: 'inhale', seconds: 4 },
    { label: 'holdIn', seconds: 4 },
    { label: 'exhale', seconds: 4 },
    { label: 'holdOut', seconds: 4 },
  ],
};
