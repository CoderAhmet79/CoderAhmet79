import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { cardId } from '../engine/cards';
import { HandState, PlayerId, Trick } from '../engine/types';
import { cardWidthForScreen, PlayingCard } from './Card';

type SeatPosition = 'bottom' | 'left' | 'top' | 'right';

const SEAT_BY_OFFSET: SeatPosition[] = ['bottom', 'left', 'top', 'right'];
const CARD_RATIO = 7 / 5;

function seatFor(myId: PlayerId, player: PlayerId): SeatPosition {
  const offset = (player - myId + 4) % 4;
  return SEAT_BY_OFFSET[offset];
}

// Her kart, hangi taraftan atıldığını belli edecek kadar merkezden kayar,
// ama esas olarak ortada üst üste yığılır (gerçek bir masadaki gibi).
const PILE_OFFSET = 12;
const SEAT_SHIFT: Record<SeatPosition, { x: number; y: number }> = {
  bottom: { x: 0, y: PILE_OFFSET },
  top: { x: 0, y: -PILE_OFFSET },
  left: { x: -PILE_OFFSET, y: 0 },
  right: { x: PILE_OFFSET, y: 0 },
};

// Atılmış gibi görünmesi için sabit ama düzensiz bir açı deseni (oynama
// sırasına göre).
const PILE_ROTATIONS = [-7, 5, -4, 8];

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
  const width = cardWidthForScreen() * 1.5;
  const height = width * CARD_RATIO;

  return (
    <View style={styles.center}>
      {trick.plays.map((play, index) => {
        const shift = SEAT_SHIFT[seatFor(myId, play.player)];
        const rotate = PILE_ROTATIONS[index % PILE_ROTATIONS.length];
        return (
          <Animated.View
            key={cardId(play.card)}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(250)}
            style={[
              styles.slot,
              {
                zIndex: index,
                transform: [
                  { translateX: -width / 2 + shift.x },
                  { translateY: -height / 2 + shift.y },
                  { rotate: `${rotate}deg` },
                ],
              },
            ]}
          >
            <PlayingCard card={play.card} width={width} />
          </Animated.View>
        );
      })}
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
    top: '50%',
    left: '50%',
  },
});
