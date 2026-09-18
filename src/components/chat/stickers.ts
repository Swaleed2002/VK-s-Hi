// Collection of beautifully rendered vector stickers (SVG data URIs)
// Licensed under permissive MIT / public domain SVG illustrations

export interface Sticker {
  id: string;
  name: string;
  category: string;
  svg: string;
}

const createSvgDataUrl = (svgContent: string) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
};

export const STICKERS: Sticker[] = [
  {
    id: 'hi-wave',
    name: 'Hi!',
    category: 'Greetings',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="#FFD93D"/>
        <circle cx="42" cy="50" r="6" fill="#2C3E50"/>
        <circle cx="78" cy="50" r="6" fill="#2C3E50"/>
        <path d="M42 75 Q60 95 78 75" fill="none" stroke="#2C3E50" stroke-width="5" stroke-linecap="round"/>
        <rect x="25" y="10" width="70" height="28" rx="14" fill="#10B981"/>
        <text x="60" y="29" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="white" text-anchor="middle">HI! 👋</text>
      </svg>
    `)
  },
  {
    id: 'thumbs-up',
    name: 'Awesome',
    category: 'Reactions',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#10B981"/>
        <path d="M45 68 C45 65 48 60 52 60 L68 60 C73 60 77 64 77 68 L77 82 C77 86 73 90 68 90 L50 90 C47 90 45 88 45 85 Z" fill="#FFFFFF"/>
        <path d="M52 60 L58 35 C59 31 63 28 67 30 C71 32 72 37 70 41 L66 60" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="35" y="60" width="10" height="30" rx="3" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'heart-love',
    name: 'Love',
    category: 'Love',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#FEE2E2"/>
        <path d="M60 95 L28 60 C15 45 25 22 45 24 C53 25 58 30 60 35 C62 30 67 25 75 24 C95 22 105 45 92 60 Z" fill="#EF4444"/>
        <circle cx="48" cy="42" r="4" fill="#FFFFFF" opacity="0.6"/>
      </svg>
    `)
  },
  {
    id: 'laughing',
    name: 'LOL',
    category: 'Fun',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#FBBF24"/>
        <path d="M35 48 L48 53 L35 58" fill="none" stroke="#1F2937" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M85 48 L72 53 L85 58" fill="none" stroke="#1F2937" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M38 70 Q60 105 82 70 Z" fill="#991B1B"/>
        <path d="M48 70 Q60 82 72 70 Z" fill="#FFFFFF"/>
        <ellipse cx="25" cy="55" rx="5" ry="8" fill="#60A5FA"/>
        <ellipse cx="95" cy="55" rx="5" ry="8" fill="#60A5FA"/>
      </svg>
    `)
  },
  {
    id: 'cool',
    name: 'Cool',
    category: 'Mood',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#F59E0B"/>
        <path d="M25 50 Q45 42 60 50 Q75 42 95 50 L92 64 Q75 58 60 64 Q45 58 28 64 Z" fill="#111827"/>
        <line x1="20" y1="52" x2="100" y2="52" stroke="#111827" stroke-width="4"/>
        <path d="M45 80 Q60 95 75 80" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'fire',
    name: 'Fire',
    category: 'Reactions',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#FFF7ED"/>
        <path d="M60 18 C60 18 75 40 75 55 C75 48 72 42 70 40 C85 50 90 70 85 82 C80 94 65 102 55 102 C35 102 28 85 32 70 C35 55 48 40 50 25 C52 38 58 45 60 18 Z" fill="#EA580C"/>
        <path d="M60 55 C65 65 72 75 68 85 C65 92 56 95 52 90 C45 82 50 72 55 65 Z" fill="#FACC15"/>
      </svg>
    `)
  },
  {
    id: 'party',
    name: 'Party',
    category: 'Celebration',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#EEF2FF"/>
        <path d="M30 90 L75 25 L85 65 Z" fill="#6366F1"/>
        <circle cx="75" cy="25" r="7" fill="#F59E0B"/>
        <circle cx="35" cy="40" r="4" fill="#EC4899"/>
        <circle cx="95" cy="45" r="5" fill="#10B981"/>
        <circle cx="85" cy="85" r="4" fill="#3B82F6"/>
        <path d="M40 75 Q60 55 50 40" fill="none" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
        <path d="M50 85 Q70 70 80 80" fill="none" stroke="#EC4899" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'star-struck',
    name: 'Star',
    category: 'Reactions',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#FBBF24"/>
        <polygon points="42,35 45,46 56,46 47,52 50,63 42,56 34,63 37,52 28,46 39,46" fill="#B45309"/>
        <polygon points="78,35 81,46 92,46 83,52 86,63 78,56 70,63 73,52 64,46 75,46" fill="#B45309"/>
        <path d="M40 75 Q60 100 80 75 Z" fill="#991B1B"/>
      </svg>
    `)
  },
  {
    id: 'thinking',
    name: 'Thinking',
    category: 'Mood',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="55" r="48" fill="#FBBF24"/>
        <ellipse cx="44" cy="45" rx="5" ry="7" fill="#1F2937"/>
        <ellipse cx="76" cy="45" rx="5" ry="7" fill="#1F2937"/>
        <line x1="38" y1="35" x2="52" y2="38" stroke="#1F2937" stroke-width="4" stroke-linecap="round"/>
        <line x1="72" y1="35" x2="84" y2="33" stroke="#1F2937" stroke-width="4" stroke-linecap="round"/>
        <path d="M50 75 Q65 70 72 75" fill="none" stroke="#1F2937" stroke-width="4" stroke-linecap="round"/>
        <rect x="42" y="85" width="36" height="12" rx="6" fill="#D97706"/>
      </svg>
    `)
  },
  {
    id: 'clap',
    name: 'Bravo',
    category: 'Reactions',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#ECFDF5"/>
        <path d="M45 40 L65 60 C70 65 70 75 62 80 L48 68" fill="#10B981"/>
        <path d="M75 40 L55 60 C50 65 50 75 58 80 L72 68" fill="#059669"/>
        <circle cx="35" cy="35" r="3" fill="#10B981"/>
        <circle cx="85" cy="35" r="3" fill="#059669"/>
        <circle cx="60" cy="25" r="4" fill="#F59E0B"/>
      </svg>
    `)
  },
  {
    id: '100-points',
    name: '100',
    category: 'Reactions',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#DC2626"/>
        <text x="60" y="68" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="white" text-anchor="middle">100</text>
        <line x1="30" y1="80" x2="90" y2="80" stroke="white" stroke-width="4" stroke-linecap="round"/>
        <line x1="35" y1="88" x2="85" y2="88" stroke="white" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'rocket',
    name: 'Rocket',
    category: 'Fun',
    svg: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#1E293B"/>
        <path d="M60 20 C75 35 80 65 75 80 L45 80 C40 65 45 35 60 20 Z" fill="#F8FAFC"/>
        <circle cx="60" cy="45" r="8" fill="#0284C7"/>
        <path d="M45 70 L30 85 L45 85 Z" fill="#EF4444"/>
        <path d="M75 70 L90 85 L75 85 Z" fill="#EF4444"/>
        <polygon points="50,80 70,80 60,105" fill="#F59E0B"/>
      </svg>
    `)
  }
];
