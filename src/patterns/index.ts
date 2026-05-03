import type { BreathingPattern } from '../content/breathing-engine';
import { box4444 } from './box-4-4-4-4';
import { coherent55 } from './coherent-5-5';

export const PATTERN_REGISTRY: Record<string, BreathingPattern> = {
  [box4444.id]: box4444,
  [coherent55.id]: coherent55,
};

export function getPattern(id: string): BreathingPattern {
  return PATTERN_REGISTRY[id] ?? box4444;
}

export { box4444, coherent55 };
