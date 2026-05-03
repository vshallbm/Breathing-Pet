export interface CharacterDef {
  id: string;
  label: string;
  tier: 'free' | 'plus' | 'premium';
  svgPlaceholder: string;
}

export const CHARACTER_REGISTRY: CharacterDef[] = [
  { id: 'cat', label: 'Calm Cat', tier: 'free', svgPlaceholder: 'cat-calm' },
  { id: 'dog', label: 'Sleepy Dog', tier: 'free', svgPlaceholder: 'dog-calm' },
  { id: 'capybara', label: 'Capybara', tier: 'plus', svgPlaceholder: 'capybara-calm' },
  { id: 'red_panda', label: 'Red Panda', tier: 'plus', svgPlaceholder: 'red-panda-calm' },
  { id: 'bunny', label: 'Bunny', tier: 'plus', svgPlaceholder: 'bunny-calm' },
  { id: 'penguin', label: 'Penguin', tier: 'plus', svgPlaceholder: 'penguin-calm' },
  { id: 'axolotl', label: 'Axolotl', tier: 'premium', svgPlaceholder: 'axolotl-calm' },
  { id: 'zen_frog', label: 'Zen Frog', tier: 'premium', svgPlaceholder: 'zen-frog-calm' },
  { id: 'otter', label: 'Otter', tier: 'premium', svgPlaceholder: 'otter-calm' },
];
