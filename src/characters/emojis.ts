export const CHAR_EMOJIS: Record<string, string> = {
  cat:       '🐱',
  dog:       '🐶',
  capybara:  '🦫',
  red_panda: '🦝',
  bunny:     '🐰',
  penguin:   '🐧',
  axolotl:   '🦎',
  zen_frog:  '🐸',
  otter:     '🦦',
};

export function getCharEmoji(characterId: string): string {
  return CHAR_EMOJIS[characterId] ?? '🐾';
}
