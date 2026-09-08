import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { cardId } from '../engine/cards';
import { HandState, PlayerId, Trick } from '../engine/types';
import { cardWidthForScreen, PlayingCard } from './Card';

type SeatPosition = 'bottom' | 'left' | 'top' | 'right';

const SEAT_BY_OFFSET: SeatPosition[] = ['bottom', 'left', 'top', 'right'];

function seatFor(myId: PlayerId, player: PlayerId): SeatPosition {
  const offset = (player - myId + 4) % 4;
  return SEAT_BY_OFFSET[offset];
}

// Bir trick tamamlandığında (4. kart oynandığında), motor currentTrick'i
// hemen sıfırlar. Kullanıcının kazananı görebilmesi için tamamlanan trick'i
// 600 ms boyunca ekranda "dondurup" sonra gerçek (yeni, boş) trick'e döneriz.
export function TableCenter({ hand, myId }: { hand: HandState; myId: PlayerId }) {
  const [frozenTrick, setFrozenTrick] = useState<Trick | null>(null);
  const prevCompletedCount = useRef(hand.completedTricks.length);

  useEffect(() => {
    if (hand.completedTricks.length > prevCompletedCount.current) {
      const finishedTrick = hand.completedTricks[hand.completedTricks.length - 1];
      setFrozenTrick(finishedTrick);
      prevCompletedCount.current = hand.completedTricks.length;
      const timer = setTimeout(() => setFrozenTrick(null), 600);
      return () => clearTimeout(timer);
    }
    prevCompletedCount.current = hand.completedTricks.length;
    return undefined;
  }, [hand.completedTricks.length, hand.completedTricks]);

  const trick = frozenTrick ?? hand.currentTrick;
  const width = cardWidthForScreen() * 0.8;

  return (
    <View style={styles.center}>
      {trick.plays.map((play) => (
        <Animated.View
          key={cardId(play.card)}
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(250)}
          style={[styles.slot, slotStyle[seatFor(myId, play.player)]]}
        >
          <PlayingCard card={play.card} width={width} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: {
    position: 'absolute',
  },
});

const slotStyle = StyleSheet.create({
  bottom: { bottom: 4, alignSelf: 'center' },
  left: { left: '4%', top: '38%' },
  top: { top: 4, alignSelf: 'center' },
  right: { right: '4%', top: '38%' },
});
