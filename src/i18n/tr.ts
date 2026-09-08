export const tr = {
  appName: 'Rıfkı',
  menu: {
    newGame: 'Yeni Oyun',
    continueGame: 'Devam Et',
    stats: 'İstatistik',
    settings: 'Ayarlar',
    theme: 'Tema',
  },
  newGame: {
    title: 'Yeni Oyun',
    difficulty: 'Zorluk',
    medium: 'Orta',
    hard: 'Zor',
    playerName: 'Adınız',
    opponent1: 'Rakip 1',
    opponent2: 'Rakip 2',
    opponent3: 'Rakip 3',
    start: 'Başla',
  },
  table: {
    handLabel: (handNo: number, total: number) => `El ${handNo}/${total}`,
  },
  contracts: {
    NO_TRICKS: 'El Almaz',
    NO_HEARTS: 'Kupa Almaz',
    NO_MEN: 'Erkek Almaz',
    NO_QUEENS: 'Kız Almaz',
    RIFKI: 'Rıfkı',
    LAST_TWO: 'Son İki',
    TRUMP: 'Koz',
  },
  handOver: {
    title: 'El Sonu',
    continue: 'Devam',
  },
  scoreTable: {
    title: 'Skor Tablosu',
  },
  gameOver: {
    title: 'Oyun Sonu',
    congrats: (name: string) => `Tebrikler ${name}!`,
    playAgain: 'Yeniden Oyna',
    mainMenu: 'Ana Menü',
  },
  settings: {
    title: 'Ayarlar',
    mustTrumpWhenVoid: 'Renk yokken koz zorunlu',
    earlyEnd: 'Ceza bitince el erken kapansın',
    confirmPlay: 'Onaylı oynama',
    animationSpeed: 'Animasyon hızı',
    haptics: 'Titreşim',
    sound: 'Ses',
  },
  theme: {
    title: 'Tema',
  },
  stats: {
    title: 'İstatistik',
    gamesPlayed: 'Oynanan oyun',
    winRate: 'Kazanma oranı',
    bestScore: 'En iyi skor',
    byContract: 'Kontrat bazında ortalama',
  },
  exitConfirm: {
    title: 'Oyundan çık?',
    message: 'İlerleme kaydedilir.',
    confirm: 'Çık',
    cancel: 'Vazgeç',
  },
};

export type TrKeys = typeof tr;
