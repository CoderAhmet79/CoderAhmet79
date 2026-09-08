# Rıfkı — Mobil Uygulama Spesifikasyonu (V1)

> Bu dosya Claude Code için proje anayasasıdır. Kararlar burada yazılıdır; belirsiz bir durumda önce bu dosyaya bak, sonra sor. Adım adım, her adımda çalışan bir uygulama üret.

---

## 1. Özet

- **Oyun:** Rıfkı (Türk usulü 4 kişilik el alma oyunu, King/Barbu ailesi)
- **Format:** 1 insan oyuncu + 3 bilgisayar rakip, tek cihaz, çevrimdışı
- **Zorluk:** Orta ve Zor (tüm bilgisayar oyuncular aynı seviyede oynar, seviye oyun başında seçilir)
- **Yapay zeka:** Tamamen yerel, kural tabanlı + Monte Carlo simülasyonu. **Hiçbir harici API / LLM / abonelik yok.**
- **Tema:** Kartlar ve zemin için 5 tema, oyun içinde anında değiştirilebilir
- **Platform:** Android öncelikli (iOS kırılmasın ama V1'de test edilmez)
- **Dil:** Arayüz Türkçe. Kod, değişken adları ve yorumlar İngilizce.

---

## 2. Teknoloji Yığını

| Katman | Seçim | Not |
|---|---|---|
| Framework | Expo (SDK güncel sürüm) + React Native + TypeScript (strict) | Mevcut projelerle aynı yığın |
| Oyun motoru | Saf TypeScript, React'a bağımlılık yok | `src/engine/` altında, ayrı test edilir |
| Durum yönetimi | Zustand | Küçük, sade |
| Kart çizimi | `react-native-svg` ile programatik | Asset lisans sorunu yok, tema renkleri doğrudan uygulanır |
| Animasyon | `react-native-reanimated` | Kart atma / el toplama animasyonu, kutlama parçacık sistemi |
| Haptik | `expo-haptics` | Kazanma kutlamasında tek titreşim |
| Kalıcı veri | `@react-native-async-storage/async-storage` | Ayarlar, tema, istatistik, yarım kalan oyun |
| Test | Jest (motor ve AI için) | UI testi V1'de yok |
| Navigasyon | `expo-router` | Ekran sayısı az |

Kurallar:
- Motor (`src/engine`) ve AI (`src/ai`) React'tan tamamen bağımsız kalır; Node ortamında `jest` ile koşar.
- Rastgelelik için tek bir `Rng` arayüzü kullan; testlerde seed'lenebilir olsun (`seedrandom` benzeri basit bir PRNG yeterli).

---

## 3. Oyun Kuralları (Motor Bu Kuralları Uygular)

### 3.1 Temel
- 52 kart, 4 oyuncu, her ele 13'er kart. Joker yok.
- Kart sırası (yüksekten düşüğe): A, K, Q, J, 10 … 2.
- Toplam **20 el**: 12 ceza eli + 8 koz eli.
- Her oyuncu oyun boyunca **3 ceza + 2 koz** seçer.
- Her ceza türü oyun boyunca **en fazla 2 kez** seçilebilir (6 tür × 2 = 12).
- Kartlar **her elde tamamen rastgele** dağıtılır (Fisher–Yates). Hile, yönlendirme, "iyi el" ayarı yok.
- Oyun yönü: saat yönünün tersi (Türk kağıt oyunu geleneği).
- Dağıtan oyuncu her elde bir sonrakine geçer. Dağıtanın **sağındaki** oyuncu (yönde bir sonraki) o elin kontratını seçer ve ilk kartı atar.
- Elini alan oyuncu bir sonraki elin ilk kartını atar.

### 3.2 Renk Takibi
- Atılan renkten kart varsa **o renkten atmak zorunludur**.
- O renkten kart yoksa herhangi bir kart atılabilir (koz elinde bkz. 3.4).
- Eli, atılan renkteki en yüksek kart alır (koz elinde koz varsa en yüksek koz alır).

### 3.3 Ceza Kontratları

| Kontrat | Ceza | Toplam | Açıklama |
|---|---|---|---|
| El Almaz | -50 / el | -650 | Alınan her el ceza |
| Kupa Almaz | -30 / kupa | -390 | Alınan ellerdeki her kupa ceza |
| Erkek Almaz | -60 / kart | -480 | Alınan ellerdeki her Papaz (K) ve Vale (J) ceza |
| Kız Almaz | -100 / kart | -400 | Alınan ellerdeki her Kız (Q) ceza |
| Rıfkı | -320 | -320 | Kupa Papazı'nı (K♥) alan oyuncu ceza alır |
| Son İki | -180 / el | -360 | 12. ve 13. eli alan oyuncular ceza alır |

Özel kurallar:
- **Kupa Almaz** ve **Rıfkı** ellerinde, elinde başka renk varken **kupa ile ele başlanamaz**. Elinde yalnızca kupa kaldıysa kupa ile başlanabilir.
- **Rıfkı** elinde K♥ elden çıkar çıkmaz el biter; kalan kartlar oynanmaz (skor tek seferde yazılır).
- **Kız Almaz** elinde 4 kız çıkınca, **Erkek Almaz** elinde 8 erkek çıkınca el erken biter.
- **Son İki**'de 12. ve 13. el aynı kişiye giderse -360 alır.

### 3.4 Koz Kontratı
- Kontratı seçen oyuncu elini gördükten sonra koz rengini belirler (♠ ♥ ♦ ♣).
- Alınan her el **+50** (toplam +650).
- Renk yoksa **koz atmak zorunludur** (`mustTrumpWhenVoid`, varsayılan: açık — ayar olarak değiştirilebilir).
- Koz ile başlamak serbesttir.

### 3.5 Skor
- 20 el sonunda cezalar toplamı -5200, kozlar toplamı +5200 → oyun sıfır toplamlıdır.
- Skor tablosu 20 satır × 4 sütun; her satırda kontrat adı, seçen oyuncu, 4 puan ve kümülatif toplam.
- Oyun sonu sıralama: en yüksek toplam kazanır. Eşitlikte beraberlik.

### 3.6 Ayarlanabilir Kurallar (Ayarlar ekranı, `RuleSet` tipi)
```ts
type RuleSet = {
  mustTrumpWhenVoid: boolean;      // varsayılan true
  earlyEndOnPenaltyExhausted: boolean; // Rıfkı/Kız/Erkek erken bitiş, varsayılan true
};
```
Başka varyant V1'de yok.

---

## 4. Motor Mimarisi (`src/engine`)

### 4.1 Tipler
```ts
type Suit = 'S' | 'H' | 'D' | 'C';
type Rank = 2|3|4|5|6|7|8|9|10|11|12|13|14; // 11=J 12=Q 13=K 14=A
type Card = { suit: Suit; rank: Rank };      // id: `${suit}${rank}`
type PlayerId = 0 | 1 | 2 | 3;               // 0 = insan
type Contract =
  | 'NO_TRICKS' | 'NO_HEARTS' | 'NO_MEN' | 'NO_QUEENS' | 'RIFKI' | 'LAST_TWO'
  | 'TRUMP';

type Trick = { leader: PlayerId; plays: { player: PlayerId; card: Card }[]; winner?: PlayerId };

type HandState = {
  handNo: number;               // 1..20
  dealer: PlayerId;
  declarer: PlayerId;
  contract: Contract | null;
  trumpSuit: Suit | null;
  hands: Card[][];              // 4 oyuncunun eli
  currentTrick: Trick;
  completedTricks: Trick[];
  turn: PlayerId;
  finished: boolean;
  handScores: [number, number, number, number];
};

type GameState = {
  ruleSet: RuleSet;
  seed: number;
  players: { id: PlayerId; name: string; isHuman: boolean }[];
  contractsRemaining: Record<Contract, number>;         // global kalan (ceza 2'şer, TRUMP 8)
  playerQuota: Record<PlayerId, { penalty: number; trump: number }>; // 3 ve 2'den geri sayar
  scoreTable: HandScoreRow[];
  totals: [number, number, number, number];
  hand: HandState | null;
  phase: 'CHOOSE_CONTRACT' | 'CHOOSE_TRUMP' | 'PLAYING' | 'HAND_OVER' | 'GAME_OVER';
};
```

### 4.2 Saf fonksiyonlar (yan etkisiz, yeni state döndürür)
- `createGame(ruleSet, seed): GameState`
- `dealHand(state): GameState` — karıştır, dağıt, `phase = CHOOSE_CONTRACT`
- `availableContracts(state, player): Contract[]` — kota ve global kalanı denetler
- `chooseContract(state, contract): GameState`
- `chooseTrump(state, suit): GameState`
- `legalPlays(state, player): Card[]` — **AI ve UI yalnızca bu listeden seçer**
- `playCard(state, player, card): GameState` — eli tamamlar, kazananı belirler, erken bitişi kontrol eder
- `scoreHand(hand): [number, number, number, number]`
- `nextHand(state): GameState`

### 4.3 Bilgi ayrımı
- `publicView(state, player): PublicState` — o oyuncunun görebileceği her şey (kendi eli, oynanmış kartlar, kontrat, skorlar, kimin hangi renkte "renksiz" olduğu). AI **yalnızca** `PublicState` alır, tam state'e erişemez. Bu, adil oyunun garantisidir.

---

## 5. Yapay Zeka (`src/ai`)

### 5.1 Ortak arayüz
```ts
interface Agent {
  chooseContract(view: PublicState, options: Contract[]): Contract;
  chooseTrump(view: PublicState): Suit;
  chooseCard(view: PublicState, legal: Card[]): Card;
}
```
Her bilgisayar oyuncu `createAgent(level: 'MEDIUM' | 'HARD', rng)` ile oluşturulur.

### 5.2 El değerlendirme (`evaluateHand`)
Her kontrat için elin "ne kadar iyi olduğunu" tahmin eden puan fonksiyonları:
- **NO_TRICKS:** düşük kart ve kısa yüksek renk sayısı; A/K sayısı ceza.
- **NO_HEARTS:** kupa sayısı ve kupa yüksekliği; kupasız el çok iyi.
- **NO_MEN:** eldeki K/J sayısı ve onları "besleyecek" düşük kart varlığı.
- **NO_QUEENS:** eldeki Q sayısı; Q'nun altında kaç düşük kart var.
- **RIFKI:** K♥ elde mi, kupa uzunluğu, A♥ var mı (A♥ tehlikelidir).
- **LAST_TWO:** düşük kart sayısı, uzun renk yokluğu.
- **TRUMP (renk başına):** en uzun renk, A/K sayısı, boş renk sayısı.

`chooseContract` seçenekler arasından beklenen puanı en yüksek olanı alır. Ceza ellerinde "beklenen kayıp" küçük olanı, koz elinde beklenen kazancı büyük olanı.

### 5.3 Kart takibi (`CardTracker`)
`PublicState`'ten türetilir:
- Oynanmış tüm kartlar
- Her oyuncunun hangi renkte kesin "renksiz" olduğu (renge uymadı → yok)
- Kalan kartlar kümesi ve her oyuncunun kalan kart sayısı

### 5.4 Orta seviye (MEDIUM)
Sezgisel kurallar + kart takibi:
- Ceza eli, ele başlıyorsa: en güvenli düşük kart (o renkte oynanmamış daha yüksek kart çok).
- Ceza eli, renge uyuyorsa: eli **alamayacağı** en yüksek kart; alacaksa en düşük.
- Renge uyamıyorsa: en tehlikeli kartı at (Rıfkı'da K♥, Kız'da Q, Erkek'te K/J, Kupa'da yüksek kupa, El Almaz'da yüksek kart).
- Son İki: 11. ele kadar yüksekleri harca, son iki eli düşüklerle geç.
- Koz: ası varsa erken çek, kozları say, rakip kozları bitince yan renkleri işle.
- Kontrat seçiminde %10 rastgele "insan hatası" (ikinci en iyiyi seçme).

### 5.5 Zor seviye (HARD) — Monte Carlo (PIMC)
```
chooseCard(view, legal):
  if legal.length == 1 → return legal[0]
  results = map legal → []
  repeat N kez (N = 300, süre sınırı 400 ms):
    world = sampleWorld(view)      // bilinmeyen kartları kısıtlara uyarak rastgele dağıt
    for card in legal:
      sim = playOut(world, card, MediumAgent)  // eli sonuna kadar orta seviye ile oyna
      results[card].push(sim.scoreForMe)
  return argmax(mean(results[card]))
```
- `sampleWorld`: kalan kartları, her oyuncunun kalan kart sayısına ve "renksiz" kısıtlarına uyarak dağıtır. Uymayan örneklemi at, yeniden dene (reddetme örneklemesi; kısıtlar sıkıysa önce kısıtlı oyunculara dağıt).
- Kontrat seçimi: her aday kontrat için 40 örneklem dünyada eli oynat, ortalama puanı en yüksek olanı seç.
- Koz rengi seçimi: aynı yöntemle 4 renk denenir.
- Hesaplama UI'yı dondurmasın: `InteractionManager.runAfterInteractions` + yield (`await new Promise(r => setTimeout(r, 0))`) ile 20 simülasyonda bir kontrolü UI'ya ver. V1'de worker thread yok.
- Zaman bütçesi aşıldıysa o ana kadarki sonuçla karar ver.

### 5.6 AI doğrulama
- `scripts/selfplay.ts`: 4 AI'yı headless 1000 oyun oynatır; ortalama puanları ve kontrat dağılımını yazdırır.
- Kabul kriteri: HARD, 3 MEDIUM'a karşı ortalamada anlamlı şekilde pozitif (+200 ve üzeri / oyun).
- Motor, herhangi bir simülasyonda kural dışı kart görürse `throw` eder (test güvencesi).

---

## 6. Ekranlar ve Akış

1. **Ana Menü** — Yeni Oyun, Devam Et (yarım oyun varsa), İstatistik, Ayarlar, Tema.
2. **Yeni Oyun** — Zorluk (Orta / Zor), oyuncu adı, 3 rakibin adları (varsayılan Türkçe isimler, ör. Kemal, Ayşe, Selim), Başla.
3. **Oyun Masası** — ana ekran (bkz. 7).
4. **Kontrat Seçimi** — insan sırasında alt sayfa (bottom sheet): kalan kontratlar, her birinin yanında kaç kez daha seçilebileceği; seçilemeyenler soluk; koz seçilirse renk seçimi ikinci adım.
5. **El Sonu** — o elin puanları, "Devam" butonu; tek dokunuşla geçilir.
6. **Skor Tablosu** — 20 satırlık matris, tamamlanmış kontratlar işaretli, kümülatif toplam. Masadan her an açılır.
7. **Oyun Sonu** — sıralama, toplam puan, "Yeniden Oyna" / "Ana Menü". İnsan oyuncu birinci ise ekrana girişte **kutlama efekti** oynar (bkz. 7.1).
8. **Ayarlar** — kurallar (RuleSet), animasyon hızı, titreşim, ses açık/kapalı (V1'de ses yok, anahtar hazır dursun).
9. **Tema** — 5 tema kartı, canlı önizleme (3 kart + zemin parçası), tek dokunuşla uygulanır.
10. **İstatistik** — oynanan oyun, kazanma oranı, en iyi skor, kontrat bazında ortalama.

---

## 7. Oyun Masası UX

- Dikey mod, tek el kullanım. İnsan oyuncu **altta**, rakipler sol / üst / sağ.
- İnsan eli: kartlar yelpaze şeklinde, **oynanabilir kartlar normal, oynanamazlar %50 soluk ve dokunulamaz**.
- **Kart oynama tek dokunuş.** Dokun → kart masaya uçar. Sürükleme yok. (Ayarlarda "onaylı oynama" seçeneği: ilk dokunuş kartı hafif kaldırır, ikinci dokunuş oynar.)
- Masanın ortasında 4 slot; her oyuncunun attığı kart kendi tarafına yakın slotta.
- El tamamlanınca kartlar 600 ms görünür kalır, sonra kazanana doğru toplanır. Kazananın adı kısa süre parlar.
- Üst şerit: el numarası (ör. "El 7/20"), kontrat adı ve varsa koz rengi simgesi, kontratı seçen oyuncu.
- Her rakibin yanında: ad, bu eldeki anlık puanı, sıra kendisindeyken kenar parlaması.
- **"Son el" butonu:** bir önceki elin 4 kartını küçük bir kutuda gösterir (ceza ellerinde kritik).
- Bilgisayar düşünme süresi: MEDIUM 400–700 ms, HARD gerçek hesap süresi (en az 500 ms görünür). Kartlar birbirine yapışık atılmasın.
- Geri tuşu masada: "Oyundan çık? İlerleme kaydedilir." onayı.
- Otomatik kayıt: her kart hamlesinden sonra `GameState` AsyncStorage'a yazılır; uygulama kapansa da "Devam Et" çalışır.

### 7.1 Kazanma Kutlaması (Konfeti + Havai Fişek)

**Tetikleme:** Oyun sonunda insan oyuncunun toplam puanı tek başına en yüksekse (beraberlikte tetiklenmez). Bilgisayar kazanırsa hiçbir efekt yok; sadece sıralama gösterilir.

**Süre:** Tam **10 saniye**. Sonra parçacıklar 1 s içinde solup kaybolur; Oyun Sonu ekranı altta zaten görünür durumdadır, efekt üstte tam ekran şeffaf bir katmandır (`pointerEvents="none"`, butonlar efekt sürerken de basılabilir).

**İçerik:**
- **Konfeti:** Üstten dökülen 120–160 parçacık. Dikdörtgen, daire ve şerit olmak üzere 3 şekil; her parçacık rastgele boyut (6–14 px), rastgele dönüş hızı, hafif yana salınım (sinüs) ve yerçekimi ile düşer. Renkler temanın `accent` rengi + 5 sabit canlı renk (`#FF5252 #FFD740 #69F0AE #40C4FF #E040FB`).
- **Havai fişek:** 10 saniye boyunca 0.8–1.4 s aralıkla ekranın üst yarısında rastgele noktalarda patlama. Her patlama: merkezden dışa 24–36 kıvılcım, 1.2 s ömür, yerçekimi ile hafif düşüş, sonlara doğru solma. Patlama rengi tek renk veya iki renk karışımı; ardışık patlamalar farklı renk.
- **Başlık:** Ekranın ortasında "Tebrikler {oyuncuAdı}!" metni, ölçek 0.6→1.0 yaylı (spring) giriş, altında toplam puan. Metin efektle aynı anda gelir, efekt bitince kalır.
- **Titreşim:** Başlangıçta tek `Haptics.notificationAsync(Success)`; ayarlarda titreşim kapalıysa yok.

**Teknik:**
- `expo-haptics` eklenir.
- Efekt `src/components/Celebration.tsx` içinde, tek bileşen, prop: `durationMs=10000`, `onFinished`.
- Çizim: `react-native-reanimated` + `react-native-svg` ile kendi parçacık sistemi. Parçacık konumları tek bir `useFrameCallback` döngüsünde JS tarafında değil, mümkün olduğunca UI thread'de (shared value) güncellenir. Her parçacık ayrı `Animated.View` yerine tek bir SVG üzerinde `<Rect>/<Circle>` olarak çizilir.
- Performans hedefi: orta segment Android cihazda 60 fps, JS thread'i bloklamaz. Cihaz düşükse (`PixelRatio` ve ekran alanına göre basit kontrol) parçacık sayısı yarıya iner.
- Bu bileşen yalnızca Oyun Sonu ekranında kullanılır; masada el kazanma gibi ara anlarda kutlama yoktur.
- Harici konfeti paketi kullanılmaz (bağımlılık ve tema uyumu için). Zorunlu kalınırsa yalnızca `react-native-confetti-cannon` kabul edilir ve renkler yine temadan gelir.

**Test:** Headless test yok; manuel kabul: kazanma → efekt tam 10 s → solma → ekran normal. Kaybetme → efekt yok. Efekt sırasında "Ana Menü" butonuna basılabilir ve efekt temizlenir (unmount'ta zamanlayıcılar iptal edilir).

---

## 8. Temalar

Tema = zemin + kart yüzü + kart sırtı + vurgu rengi + metin renkleri. `src/theme/themes.ts` içinde tek kaynak. Tüm renkler bu nesneden okunur; kodda sabit renk yok.

```ts
type Theme = {
  id: string; name: string;
  table: string;          // zemin
  tableAccent: string;    // zemin dokusu / kenar
  cardFace: string; cardBorder: string;
  suitRed: string; suitBlack: string;
  cardBack: string; cardBackPattern: string;
  accent: string;         // butonlar, sıra vurgusu
  text: string; textMuted: string;
  surface: string;        // paneller, bottom sheet
  isDark: boolean;
};
```

| # | id | Ad | table | cardFace | cardBack | accent | Karakter |
|---|---|---|---|---|---|---|---|
| 1 | `classic` | Klasik Yeşil | `#1B5E3A` | `#FAF7F0` | `#8B1E2D` | `#D4AF37` | Geleneksel çuha masa, altın vurgu |
| 2 | `night` | Gece Mavisi | `#0F1B2D` | `#F4F6FA` | `#1F3A5F` | `#4FC3F7` | Koyu, göz yormayan, gece oyunu |
| 3 | `kahve` | Kahvehane | `#6B3F25` | `#FFF8E7` | `#2F1B10` | `#E0A458` | Ahşap ton, sıcak, nostaljik |
| 4 | `bordo` | Osmanlı Bordo | `#5C1A2B` | `#FBF6EC` | `#2B0F17` | `#C9A227` | Bordo + altın, çini deseni sırt |
| 5 | `sade` | Sade Açık | `#E9ECEF` | `#FFFFFF` | `#343A40` | `#2E7D32` | Açık, minimal, yüksek kontrast |

Kurallar:
- Kırmızı renkler (`suitRed`) koyu zeminlerde `#E53935` civarı, açık zeminde `#C62828`; siyah renkler koyu zeminde `#1A1A1A`, açık zeminde `#111111`. Kart yüzü ile en az 7:1 kontrast.
- Kart sırtı: basit geometrik SVG deseni (baklava, çini, çizgi); tema başına bir desen.
- Tema değişimi anında uygulanır, oyun kesilmez. Seçim AsyncStorage'da saklanır.
- Kart boyutu ekran genişliğine göre: el yelpazesinde kart genişliği `min(screenWidth / 7.5, 72)`, oran 5:7.
- Köşe indeksleri (rank + suit) büyük ve okunaklı; küçük ekranda tek bakışta anlaşılır.

---

## 9. Dizin Yapısı

```
src/
  engine/        cards.ts, deck.ts, rules.ts, scoring.ts, game.ts, publicView.ts, types.ts
  ai/            agent.ts, evaluate.ts, tracker.ts, medium.ts, hard.ts, sampler.ts
  store/         gameStore.ts (Zustand), settingsStore.ts, statsStore.ts, persistence.ts
  theme/         themes.ts, ThemeProvider.tsx, useTheme.ts
  components/    Card.tsx (SVG), Hand.tsx, TableCenter.tsx, OpponentSeat.tsx, TopBar.tsx,
                 ContractSheet.tsx, ScoreTable.tsx, LastTrickPopover.tsx, Celebration.tsx
  i18n/          tr.ts (tüm arayüz metinleri buradan; kodda sabit Türkçe metin yok)
app/             expo-router ekranları
scripts/         selfplay.ts
__tests__/       engine/*.test.ts, ai/*.test.ts
```

---

## 10. Testler (Motor ve AI için zorunlu)

- Dağıtım: 52 farklı kart, 13'er, seed ile tekrarlanabilir.
- `legalPlays`: renk takibi, kupa ile başlama yasağı, koz zorunluluğu, tek kupa kalınca kupa başlama izni.
- El kazananı: normal renk, koz, koz atılmamış koz eli.
- Skor: 6 ceza + koz için tam puan tabloları; 20 el sonunda toplam = 0.
- Kontrat kotası: bir oyuncu 4. cezayı seçemez, 3. kozu seçemez; global 3. aynı cezayı kimse seçemez.
- Erken bitiş: K♥ çıkınca Rıfkı eli biter; 4 kız çıkınca Kız eli biter.
- AI: hiçbir agent hiçbir durumda `legalPlays` dışında kart döndürmez (1000 rastgele oyun).
- Sampler: örneklenen dünyalar renksizlik kısıtlarını ve kart sayılarını ihlal etmez.

---

## 11. Uygulama Planı (Claude Code için sıra)

Her adım sonunda `npm test` yeşil ve uygulama açılır durumda olsun.

1. **Proje iskeleti** — Expo + TS strict + Jest + expo-router + Zustand kurulumu, boş ekranlar.
2. **Motor** — tipler, deste, dağıtım, `legalPlays`, `playCard`, el kazananı, skor, kota; testleriyle.
3. **Headless oyun** — 4 rastgele agent ile 20 eli komut satırında sonuna kadar oynatan script. Toplam 0 çıkıyorsa motor doğrudur.
4. **MEDIUM agent** — evaluate + tracker + sezgisel kart seçimi; selfplay ile rastgeleyi net yenmeli.
5. **Tema sistemi + SVG kart bileşeni** — 5 tema, tema ekranı, canlı önizleme.
6. **Oyun masası UI** — el, masa, rakipler, tek dokunuşla oynama, animasyon, kontrat sheet, el sonu, skor tablosu.
7. **Kalıcılık** — otomatik kayıt, Devam Et, ayarlar, istatistik.
8. **HARD agent** — sampler + PIMC + zaman bütçesi; UI'yı dondurmadan çalışır; selfplay ile MEDIUM'u yenmeli.
9. **Kutlama efekti** — `Celebration.tsx`, yalnızca insan kazanınca 10 s konfeti + havai fişek (bkz. 7.1); 60 fps kontrolü.
10. **Cila** — son el kutusu, onaylı oynama, geri tuşu akışı, boş durumlar, Android geri/kesinti testleri.

---

## 12. Kapsam Dışı (V1'de yapılmaz)

- Çevrimiçi / çok oyunculu, hesap, sunucu
- Ses ve müzik (anahtar dursun, içerik yok) — kutlama efekti de sessizdir
- Reklam, satın alma
- Kolay seviye, ipucu sistemi, geri alma
- Bölgesel kural varyantları (3.6'daki iki anahtar dışında)
- Tablet / yatay mod düzeni
- iOS'a özel test ve optimizasyon

---

## 13. Çalışma İlkeleri

- Küçük, çalışan artımlar. Bir adım bitmeden diğerine geçme.
- Motor ve AI'da hız için okunabilirlikten fedakârlık yapma; sadece PIMC iç döngüsünde optimize et.
- UI'da kural mantığı **yazma**; UI yalnızca motoru çağırır ve sonucu çizer.
- Tüm arayüz metinleri `i18n/tr.ts`'ten gelir; ileride Almanca/İngilizce eklenebilir.
- Belirsiz kural durumunda bu dosyaya bağlı kal; dosyada yoksa en yaygın Türk kuralını uygula ve dosyaya not düş.
