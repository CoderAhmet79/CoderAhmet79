import * as Haptics from 'expo-haptics';
import { useEffect, useMemo } from 'react';
import { Dimensions, PixelRatio, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Rect } from 'react-native-svg';

import { tr } from '../i18n/tr';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme/useTheme';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const FIXED_COLORS = ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB'];
const SPARK_LIFE_MS = 1200;
const SPARK_GRAVITY = 220; // px/s^2, hafif düşüş

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

type ConfettiShape = 'rect' | 'circle' | 'strip';

type ConfettiSpec = {
  shape: ConfettiShape;
  x0: number;
  size: number;
  vy: number;
  startDelayMs: number;
  swayAmp: number;
  swaySpeed: number;
  swayPhase: number;
  spinSpeed: number;
  spinStart: number;
  color: string;
};

type SparkSpec = {
  bornMs: number;
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
};

function generateConfetti(accentColor: string, lowEnd: boolean, durationMs: number, width: number): ConfettiSpec[] {
  const baseCount = Math.round(randRange(120, 160));
  const count = lowEnd ? Math.round(baseCount / 2) : baseCount;
  const colors = [accentColor, ...FIXED_COLORS];
  const shapes: ConfettiShape[] = ['rect', 'circle', 'strip'];

  return Array.from({ length: count }, () => ({
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    x0: randRange(0, width),
    size: randRange(6, 14),
    vy: randRange(70, 150),
    startDelayMs: randRange(0, Math.max(0, durationMs - 1500)),
    swayAmp: randRange(10, 35),
    swaySpeed: randRange(1, 3),
    swayPhase: randRange(0, Math.PI * 2),
    spinSpeed: randRange(-180, 180),
    spinStart: randRange(0, 360),
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

function pickBurstColors(accentColor: string, lastColors: string[]): { primary: string; secondary?: string } {
  const palette = [accentColor, ...FIXED_COLORS];
  let primary = palette[Math.floor(Math.random() * palette.length)];
  let attempts = 0;
  while (lastColors.includes(primary) && attempts < 5) {
    primary = palette[Math.floor(Math.random() * palette.length)];
    attempts++;
  }
  const secondary = Math.random() < 0.5 ? palette[Math.floor(Math.random() * palette.length)] : undefined;
  return { primary, secondary };
}

function generateBursts(
  accentColor: string,
  lowEnd: boolean,
  durationMs: number,
  width: number,
  height: number,
): SparkSpec[] {
  const sparks: SparkSpec[] = [];
  let t = randRange(300, 900);
  let lastColors: string[] = [];

  while (t < durationMs - 200) {
    const baseSparkCount = Math.round(randRange(24, 36));
    const sparkCount = lowEnd ? Math.round(baseSparkCount / 2) : baseSparkCount;
    const { primary, secondary } = pickBurstColors(accentColor, lastColors);
    lastColors = secondary ? [primary, secondary] : [primary];

    const bx = randRange(width * 0.15, width * 0.85);
    const by = randRange(height * 0.08, height * 0.42);

    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + randRange(-0.15, 0.15);
      const speed = randRange(60, 160);
      sparks.push({
        bornMs: t,
        x0: bx,
        y0: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: secondary && i % 2 === 1 ? secondary : primary,
        size: randRange(3, 6),
      });
    }

    t += randRange(800, 1400);
  }

  return sparks;
}

type ConfettiMotion = {
  x: number;
  y: number;
  rotation: number;
  originX: number;
  originY: number;
  opacity: number;
};

function confettiMotion(spec: ConfettiSpec, elapsedMs: number, screenHeight: number): ConfettiMotion {
  'worklet';
  const active = elapsedMs >= spec.startDelayMs;
  const t = active ? (elapsedMs - spec.startDelayMs) / 1000 : 0;
  const y = -20 + spec.vy * t;
  const x = spec.x0 + spec.swayAmp * Math.sin(spec.swaySpeed * t + spec.swayPhase);
  const rotation = spec.spinStart + spec.spinSpeed * t;
  const visible = active && y < screenHeight + 20;
  return { x, y, rotation, originX: x, originY: y, opacity: visible ? 0.9 : 0 };
}

function CircleConfetti({
  spec,
  elapsed,
  screenHeight,
}: {
  spec: ConfettiSpec;
  elapsed: SharedValue<number>;
  screenHeight: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const m = confettiMotion(spec, elapsed.value, screenHeight);
    return { cx: m.x, cy: m.y, opacity: m.opacity, rotation: m.rotation, originX: m.originX, originY: m.originY };
  });
  return <AnimatedCircle animatedProps={animatedProps} r={spec.size / 2} fill={spec.color} />;
}

function RectConfetti({
  spec,
  elapsed,
  screenHeight,
}: {
  spec: ConfettiSpec;
  elapsed: SharedValue<number>;
  screenHeight: number;
}) {
  const width = spec.shape === 'strip' ? spec.size * 2.2 : spec.size;
  const height = spec.shape === 'strip' ? spec.size * 0.45 : spec.size;
  const animatedProps = useAnimatedProps(() => {
    const m = confettiMotion(spec, elapsed.value, screenHeight);
    return {
      x: m.x - width / 2,
      y: m.y - height / 2,
      opacity: m.opacity,
      rotation: m.rotation,
      originX: m.originX,
      originY: m.originY,
    };
  });
  return <AnimatedRect animatedProps={animatedProps} width={width} height={height} rx={1} fill={spec.color} />;
}

function ConfettiParticle(props: { spec: ConfettiSpec; elapsed: SharedValue<number>; screenHeight: number }) {
  return props.spec.shape === 'circle' ? <CircleConfetti {...props} /> : <RectConfetti {...props} />;
}

function Spark({ spec, elapsed }: { spec: SparkSpec; elapsed: SharedValue<number> }) {
  const animatedProps = useAnimatedProps(() => {
    const dt = elapsed.value - spec.bornMs;
    const active = dt >= 0 && dt <= SPARK_LIFE_MS;
    const t = Math.max(0, dt) / 1000;
    const x = spec.x0 + spec.vx * t;
    const y = spec.y0 + spec.vy * t + 0.5 * SPARK_GRAVITY * t * t;
    const lifeFrac = Math.min(1, Math.max(0, dt / SPARK_LIFE_MS));
    const opacity = active ? (1 - lifeFrac) * 0.95 : 0;
    return { cx: x, cy: y, opacity };
  });

  return <AnimatedCircle animatedProps={animatedProps} r={spec.size / 2} fill={spec.color} />;
}

function CelebrationTitle({ name, score }: { name: string; score: number }) {
  const theme = useTheme();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.titleWrap, style]} pointerEvents="none">
      <Text style={[styles.titleText, { color: theme.text }]}>{tr.gameOver.congrats(name)}</Text>
      <Text style={[styles.scoreText, { color: theme.accent }]}>{score}</Text>
    </Animated.View>
  );
}

export type CelebrationProps = {
  playerName: string;
  score: number;
  durationMs?: number;
  onFinished?: () => void;
};

// Yalnızca Oyun Sonu ekranında, insan oyuncu oyunu tek başına kazandığında
// kullanılır: 10 saniye konfeti + havai fişek, ardından 1 saniyede söner.
// Başlık efekt bitince de ekranda kalır. Bkz. RIFKI_SPEC.md 7.1.
export function Celebration({ playerName, score, durationMs = 10000, onFinished }: CelebrationProps) {
  const theme = useTheme();
  const hapticsEnabled = useSettingsStore((s) => s.settings.hapticsEnabled);
  const elapsed = useSharedValue(0);

  const { width: screenW, height: screenH } = useMemo(() => Dimensions.get('window'), []);
  const lowEnd = useMemo(() => PixelRatio.get() * screenW * screenH < 1_500_000, [screenW, screenH]);

  const confettiSpecs = useMemo(
    () => generateConfetti(theme.accent, lowEnd, durationMs, screenW),
    [theme.accent, lowEnd, durationMs, screenW],
  );
  const sparks = useMemo(
    () => generateBursts(theme.accent, lowEnd, durationMs, screenW, screenH),
    [theme.accent, lowEnd, durationMs, screenW, screenH],
  );

  useFrameCallback((frameInfo) => {
    elapsed.value = frameInfo.timeSinceFirstFrame;
  }, true);

  useEffect(() => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [hapticsEnabled]);

  useEffect(() => {
    const timer = setTimeout(() => onFinished?.(), durationMs + 1000);
    return () => clearTimeout(timer);
  }, [durationMs, onFinished]);

  const groupAnimatedProps = useAnimatedProps(() => {
    const t = elapsed.value;
    const opacity = t > durationMs ? Math.max(0, 1 - (t - durationMs) / 1000) : 1;
    return { opacity };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={screenW} height={screenH} style={StyleSheet.absoluteFill}>
        <AnimatedG animatedProps={groupAnimatedProps}>
          {confettiSpecs.map((spec, i) => (
            <ConfettiParticle key={`c-${i}`} spec={spec} elapsed={elapsed} screenHeight={screenH} />
          ))}
          {sparks.map((spec, i) => (
            <Spark key={`s-${i}`} spec={spec} elapsed={elapsed} />
          ))}
        </AnimatedG>
      </Svg>
      <CelebrationTitle name={playerName} score={score} />
    </View>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
});
