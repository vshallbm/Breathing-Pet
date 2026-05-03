// Inline SVGs for each character (120×120 viewBox, consistent style).
// Used in overlay.ts and buddy.ts to render the selected mascot.

const CAT = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="65" r="38" fill="#f5c2a0"/>
  <ellipse cx="60" cy="65" rx="24" ry="22" fill="#fff8f0"/>
  <polygon points="25,38 35,55 15,55" fill="#f5c2a0"/>
  <polygon points="95,38 105,55 85,55" fill="#f5c2a0"/>
  <circle cx="48" cy="62" r="6" fill="#333"/>
  <circle cx="72" cy="62" r="6" fill="#333"/>
  <circle cx="50" cy="60" r="2" fill="#fff"/>
  <circle cx="74" cy="60" r="2" fill="#fff"/>
  <ellipse cx="60" cy="72" rx="5" ry="3" fill="#e8a090"/>
  <path d="M52,78 Q60,84 68,78" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="38" y1="66" x2="20" y2="62" stroke="#888" stroke-width="1.2"/>
  <line x1="38" y1="70" x2="20" y2="70" stroke="#888" stroke-width="1.2"/>
  <line x1="38" y1="74" x2="20" y2="76" stroke="#888" stroke-width="1.2"/>
  <line x1="82" y1="66" x2="100" y2="62" stroke="#888" stroke-width="1.2"/>
  <line x1="82" y1="70" x2="100" y2="70" stroke="#888" stroke-width="1.2"/>
  <line x1="82" y1="74" x2="100" y2="76" stroke="#888" stroke-width="1.2"/>
</svg>`;

const DOG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="62" r="40" fill="#e8c99a"/>
  <ellipse cx="60" cy="68" rx="22" ry="18" fill="#fff5e6"/>
  <ellipse cx="32" cy="50" rx="10" ry="20" fill="#d4a97a" transform="rotate(-15 32 50)"/>
  <ellipse cx="88" cy="50" rx="10" ry="20" fill="#d4a97a" transform="rotate(15 88 50)"/>
  <path d="M48,62 Q48,67 54,67" stroke="#555" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M72,62 Q72,67 66,67" stroke="#555" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="74" rx="9" ry="6" fill="#c8856a"/>
  <ellipse cx="60" cy="71" rx="5" ry="3" fill="#b07060"/>
  <path d="M52,82 Q60,88 68,82" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="42" y1="70" x2="24" y2="66" stroke="#aaa" stroke-width="1.2"/>
  <line x1="42" y1="74" x2="24" y2="74" stroke="#aaa" stroke-width="1.2"/>
  <line x1="78" y1="70" x2="96" y2="66" stroke="#aaa" stroke-width="1.2"/>
  <line x1="78" y1="74" x2="96" y2="74" stroke="#aaa" stroke-width="1.2"/>
</svg>`;

const CAPYBARA = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="70" rx="44" ry="32" fill="#b8956a"/>
  <ellipse cx="60" cy="68" rx="28" ry="20" fill="#d4b48a"/>
  <ellipse cx="38" cy="42" rx="8" ry="10" fill="#b8956a"/>
  <ellipse cx="82" cy="42" rx="8" ry="10" fill="#b8956a"/>
  <circle cx="50" cy="62" r="5" fill="#222"/>
  <circle cx="70" cy="62" r="5" fill="#222"/>
  <circle cx="51" cy="61" r="1.5" fill="#fff"/>
  <circle cx="71" cy="61" r="1.5" fill="#fff"/>
  <ellipse cx="60" cy="76" rx="12" ry="7" fill="#a07850"/>
  <ellipse cx="60" cy="73" rx="6" ry="3.5" fill="#8a6040"/>
  <path d="M53,82 Q60,87 67,82" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>`;

const RED_PANDA = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="65" r="36" fill="#d2622a"/>
  <ellipse cx="60" cy="70" rx="20" ry="17" fill="#f5dcc8"/>
  <ellipse cx="30" cy="38" rx="9" ry="11" fill="#d2622a"/>
  <ellipse cx="30" cy="36" rx="5" ry="7" fill="#fff0e0"/>
  <ellipse cx="90" cy="38" rx="9" ry="11" fill="#d2622a"/>
  <ellipse cx="90" cy="36" rx="5" ry="7" fill="#fff0e0"/>
  <circle cx="50" cy="60" r="6" fill="#1a1a1a"/>
  <circle cx="70" cy="60" r="6" fill="#1a1a1a"/>
  <circle cx="52" cy="58" r="2" fill="#fff"/>
  <circle cx="72" cy="58" r="2" fill="#fff"/>
  <ellipse cx="60" cy="73" rx="5" ry="3.5" fill="#1a1a1a"/>
  <path d="M52,80 Q60,86 68,80" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="45" cy="63" rx="8" ry="4" fill="#b84010" opacity="0.5"/>
  <ellipse cx="75" cy="63" rx="8" ry="4" fill="#b84010" opacity="0.5"/>
  <line x1="40" y1="67" x2="22" y2="63" stroke="#884010" stroke-width="1.2"/>
  <line x1="40" y1="71" x2="22" y2="71" stroke="#884010" stroke-width="1.2"/>
  <line x1="80" y1="67" x2="98" y2="63" stroke="#884010" stroke-width="1.2"/>
  <line x1="80" y1="71" x2="98" y2="71" stroke="#884010" stroke-width="1.2"/>
</svg>`;

const BUNNY = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="42" cy="38" rx="10" ry="26" fill="#f0ece8"/>
  <ellipse cx="42" cy="38" rx="5" ry="20" fill="#f4b8c0"/>
  <ellipse cx="78" cy="38" rx="10" ry="26" fill="#f0ece8"/>
  <ellipse cx="78" cy="38" rx="5" ry="20" fill="#f4b8c0"/>
  <circle cx="60" cy="70" r="34" fill="#f5f0ec"/>
  <ellipse cx="60" cy="72" rx="20" ry="17" fill="#fff"/>
  <circle cx="50" cy="64" r="6" fill="#3a2a8a"/>
  <circle cx="70" cy="64" r="6" fill="#3a2a8a"/>
  <circle cx="52" cy="62" r="2" fill="#fff"/>
  <circle cx="72" cy="62" r="2" fill="#fff"/>
  <ellipse cx="60" cy="74" rx="5" ry="3" fill="#f4a0b0"/>
  <path d="M53,80 Q60,86 67,80" stroke="#888" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="40" y1="70" x2="22" y2="66" stroke="#ccc" stroke-width="1.2"/>
  <line x1="40" y1="74" x2="22" y2="74" stroke="#ccc" stroke-width="1.2"/>
  <line x1="80" y1="70" x2="98" y2="66" stroke="#ccc" stroke-width="1.2"/>
  <line x1="80" y1="74" x2="98" y2="74" stroke="#ccc" stroke-width="1.2"/>
</svg>`;

const PENGUIN = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="68" rx="32" ry="38" fill="#1a1a2e"/>
  <ellipse cx="60" cy="76" rx="18" ry="24" fill="#f5f0e8"/>
  <ellipse cx="38" cy="58" rx="6" ry="12" fill="#1a1a2e" transform="rotate(-20 38 58)"/>
  <ellipse cx="82" cy="58" rx="6" ry="12" fill="#1a1a2e" transform="rotate(20 82 58)"/>
  <circle cx="52" cy="56" r="7" fill="#f5f0e8"/>
  <circle cx="68" cy="56" r="7" fill="#f5f0e8"/>
  <circle cx="52" cy="56" r="4.5" fill="#1a1a2e"/>
  <circle cx="68" cy="56" r="4.5" fill="#1a1a2e"/>
  <circle cx="53" cy="55" r="1.5" fill="#fff"/>
  <circle cx="69" cy="55" r="1.5" fill="#fff"/>
  <ellipse cx="60" cy="66" rx="7" ry="4" fill="#e8a020"/>
  <ellipse cx="44" cy="98" rx="9" ry="4" fill="#e8a020"/>
  <ellipse cx="76" cy="98" rx="9" ry="4" fill="#e8a020"/>
</svg>`;

const AXOLOTL = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="72" rx="36" ry="28" fill="#f4a8c0"/>
  <ellipse cx="60" cy="68" rx="22" ry="18" fill="#ffd0e4"/>
  <ellipse cx="28" cy="50" rx="5" ry="14" fill="#f48aaa" transform="rotate(-20 28 50)"/>
  <ellipse cx="28" cy="40" rx="4" ry="8" fill="#f48aaa" transform="rotate(-30 28 40)"/>
  <ellipse cx="22" cy="45" rx="3" ry="10" fill="#f48aaa" transform="rotate(-10 22 45)"/>
  <ellipse cx="92" cy="50" rx="5" ry="14" fill="#f48aaa" transform="rotate(20 92 50)"/>
  <ellipse cx="92" cy="40" rx="4" ry="8" fill="#f48aaa" transform="rotate(30 92 40)"/>
  <ellipse cx="98" cy="45" rx="3" ry="10" fill="#f48aaa" transform="rotate(10 98 45)"/>
  <circle cx="50" cy="64" r="6" fill="#333"/>
  <circle cx="70" cy="64" r="6" fill="#333"/>
  <circle cx="52" cy="62" r="2" fill="#fff"/>
  <circle cx="72" cy="62" r="2" fill="#fff"/>
  <path d="M52,76 Q60,82 68,76" stroke="#d06080" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <circle cx="48" cy="70" r="3" fill="#f090b0" opacity="0.7"/>
  <circle cx="72" cy="70" r="3" fill="#f090b0" opacity="0.7"/>
</svg>`;

const ZEN_FROG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="68" r="34" fill="#6abf69"/>
  <ellipse cx="60" cy="74" rx="20" ry="16" fill="#a8d8a8"/>
  <ellipse cx="38" cy="46" rx="14" ry="10" fill="#6abf69"/>
  <ellipse cx="82" cy="46" rx="14" ry="10" fill="#6abf69"/>
  <circle cx="38" cy="44" r="7" fill="#fff"/>
  <circle cx="82" cy="44" r="7" fill="#fff"/>
  <circle cx="38" cy="44" r="4.5" fill="#1a3a1a"/>
  <circle cx="82" cy="44" r="4.5" fill="#1a3a1a"/>
  <circle cx="39" cy="43" r="1.5" fill="#fff"/>
  <circle cx="83" cy="43" r="1.5" fill="#fff"/>
  <path d="M50,78 Q60,86 70,78" stroke="#2a6a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M36,88 Q40,80 48,84" stroke="#4a8a4a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M84,88 Q80,80 72,84" stroke="#4a8a4a" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

const OTTER = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="70" rx="40" ry="28" fill="#8b6343"/>
  <ellipse cx="60" cy="68" rx="25" ry="18" fill="#c8a070"/>
  <ellipse cx="30" cy="46" rx="10" ry="13" fill="#8b6343"/>
  <ellipse cx="90" cy="46" rx="10" ry="13" fill="#8b6343"/>
  <circle cx="50" cy="62" r="6" fill="#2a1a0a"/>
  <circle cx="70" cy="62" r="6" fill="#2a1a0a"/>
  <circle cx="52" cy="60" r="2" fill="#fff"/>
  <circle cx="72" cy="60" r="2" fill="#fff"/>
  <ellipse cx="60" cy="72" rx="10" ry="6" fill="#a07850"/>
  <ellipse cx="60" cy="70" rx="5" ry="3" fill="#7a5830"/>
  <path d="M53,80 Q60,86 67,80" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="42" y1="66" x2="24" y2="62" stroke="#705030" stroke-width="1.2"/>
  <line x1="42" y1="70" x2="24" y2="70" stroke="#705030" stroke-width="1.2"/>
  <line x1="78" y1="66" x2="96" y2="62" stroke="#705030" stroke-width="1.2"/>
  <line x1="78" y1="70" x2="96" y2="70" stroke="#705030" stroke-width="1.2"/>
  <ellipse cx="40" cy="86" rx="12" ry="7" fill="#7a5430" transform="rotate(-15 40 86)"/>
  <ellipse cx="80" cy="86" rx="12" ry="7" fill="#7a5430" transform="rotate(15 80 86)"/>
</svg>`;

export const MASCOT_SVGS: Record<string, string> = {
  cat: CAT,
  dog: DOG,
  capybara: CAPYBARA,
  red_panda: RED_PANDA,
  bunny: BUNNY,
  penguin: PENGUIN,
  axolotl: AXOLOTL,
  zen_frog: ZEN_FROG,
  otter: OTTER,
};

export function getMascotSvg(characterId: string): string {
  return MASCOT_SVGS[characterId] ?? MASCOT_SVGS['cat'];
}
