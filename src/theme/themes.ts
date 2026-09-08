export type ThemeId = 'classic' | 'night' | 'kahve' | 'bordo' | 'sade';
export type CardBackPattern = 'diamond' | 'stripe' | 'tile';

export type Theme = {
  id: ThemeId;
  name: string;
  table: string; // zemin
  tableAccent: string; // zemin dokusu / kenar
  cardFace: string;
  cardBorder: string;
  suitRed: string;
  suitBlack: string;
  cardBack: string;
  cardBackPattern: string;
  backPattern: CardBackPattern;
  accent: string; // butonlar, sıra vurgusu
  text: string;
  textMuted: string;
  surface: string; // paneller, bottom sheet
  isDark: boolean;
};

// Kırmızı: koyu zeminlerde ~#E53935, açık zeminde #C62828.
// Siyah: koyu zeminde #1A1A1A, açık zeminde #111111.
export const themes: Theme[] = [
  {
    id: 'classic',
    name: 'Klasik Yeşil',
    table: '#1B5E3A',
    tableAccent: '#2E7D32',
    cardFace: '#FAF7F0',
    cardBorder: '#D8D0BE',
    suitRed: '#E53935',
    suitBlack: '#1A1A1A',
    cardBack: '#8B1E2D',
    cardBackPattern: '#D4AF37',
    backPattern: 'diamond',
    accent: '#D4AF37',
    text: '#FAF7F0',
    textMuted: '#CBBFA0',
    surface: '#164A30',
    isDark: true,
  },
  {
    id: 'night',
    name: 'Gece Mavisi',
    table: '#0F1B2D',
    tableAccent: '#16283F',
    cardFace: '#F4F6FA',
    cardBorder: '#C7CEDA',
    suitRed: '#E53935',
    suitBlack: '#1A1A1A',
    cardBack: '#1F3A5F',
    cardBackPattern: '#4FC3F7',
    backPattern: 'stripe',
    accent: '#4FC3F7',
    text: '#F4F6FA',
    textMuted: '#9FB0C6',
    surface: '#152538',
    isDark: true,
  },
  {
    id: 'kahve',
    name: 'Kahvehane',
    table: '#6B3F25',
    tableAccent: '#7C4A2C',
    cardFace: '#FFF8E7',
    cardBorder: '#E4D4B0',
    suitRed: '#E53935',
    suitBlack: '#1A1A1A',
    cardBack: '#2F1B10',
    cardBackPattern: '#E0A458',
    backPattern: 'diamond',
    accent: '#E0A458',
    text: '#FFF8E7',
    textMuted: '#D8C6A0',
    surface: '#59341E',
    isDark: true,
  },
  {
    id: 'bordo',
    name: 'Osmanlı Bordo',
    table: '#5C1A2B',
    tableAccent: '#6D2436',
    cardFace: '#FBF6EC',
    cardBorder: '#E6D8B8',
    suitRed: '#E53935',
    suitBlack: '#1A1A1A',
    cardBack: '#2B0F17',
    cardBackPattern: '#C9A227',
    backPattern: 'tile',
    accent: '#C9A227',
    text: '#FBF6EC',
    textMuted: '#DCC9A0',
    surface: '#4C1524',
    isDark: true,
  },
  {
    id: 'sade',
    name: 'Sade Açık',
    table: '#E9ECEF',
    tableAccent: '#DDE1E6',
    cardFace: '#FFFFFF',
    cardBorder: '#C7CCD1',
    suitRed: '#C62828',
    suitBlack: '#111111',
    cardBack: '#343A40',
    cardBackPattern: '#2E7D32',
    backPattern: 'stripe',
    accent: '#2E7D32',
    text: '#212529',
    textMuted: '#495057',
    surface: '#FFFFFF',
    isDark: false,
  },
];

export const defaultThemeId: ThemeId = 'classic';

export function getTheme(id: ThemeId): Theme {
  return themes.find((t) => t.id === id) ?? themes[0];
}
