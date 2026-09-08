import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { rankLabel, suitSymbol } from '../engine/cards';
import { Card as CardModel } from '../engine/types';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/useTheme';

const CARD_RATIO = 7 / 5; // width:height = 5:7

export function cardWidthForScreen(): number {
  const screenWidth = Dimensions.get('window').width;
  return Math.min(screenWidth / 7.5, 72);
}

type Props = {
  card?: CardModel; // omit for a face-down card
  faceDown?: boolean;
  width?: number;
  dimmed?: boolean; // oynanamayan kart: %50 soluk
  selected?: boolean;
};

export function PlayingCard({ card, faceDown, width, dimmed, selected }: Props) {
  const theme = useTheme();
  const w = width ?? cardWidthForScreen();
  const h = w * CARD_RATIO;
  const isRed = !!card && (card.suit === 'H' || card.suit === 'D');
  const suitColor = isRed ? theme.suitRed : theme.suitBlack;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} opacity={dimmed ? 0.5 : 1}>
      <Rect
        x={1}
        y={1}
        width={w - 2}
        height={h - 2}
        rx={w * 0.08}
        fill={faceDown ? theme.cardBack : theme.cardFace}
        stroke={selected ? theme.accent : theme.cardBorder}
        strokeWidth={selected ? 2.5 : 1}
      />
      {faceDown ? (
        <CardBackPattern width={w} height={h} theme={theme} />
      ) : card ? (
        <CardFace card={card} width={w} height={h} suitColor={suitColor} />
      ) : null}
    </Svg>
  );
}

function CornerIndex({
  x,
  y,
  card,
  color,
  fontSize,
}: {
  x: number;
  y: number;
  card: CardModel;
  color: string;
  fontSize: number;
}) {
  return (
    <G>
      <SvgText x={x} y={y} fontSize={fontSize} fontWeight="700" fill={color} textAnchor="start">
        {rankLabel(card.rank)}
      </SvgText>
      <SvgText x={x} y={y + fontSize * 0.95} fontSize={fontSize * 0.85} fill={color} textAnchor="start">
        {suitSymbol(card.suit)}
      </SvgText>
    </G>
  );
}

function CardFace({
  card,
  width,
  height,
  suitColor,
}: {
  card: CardModel;
  width: number;
  height: number;
  suitColor: string;
}) {
  const fontSize = width * 0.22;
  const centerFontSize = width * 0.42;

  return (
    <>
      <CornerIndex x={width * 0.1} y={height * 0.16} card={card} color={suitColor} fontSize={fontSize} />
      <G rotation={180} origin={`${width / 2}, ${height / 2}`}>
        <CornerIndex x={width * 0.1} y={height * 0.16} card={card} color={suitColor} fontSize={fontSize} />
      </G>
      <SvgText
        x={width / 2}
        y={height / 2 + centerFontSize * 0.35}
        fontSize={centerFontSize}
        fill={suitColor}
        textAnchor="middle"
      >
        {suitSymbol(card.suit)}
      </SvgText>
    </>
  );
}

function CardBackPattern({ width, height, theme }: { width: number; height: number; theme: Theme }) {
  const color = theme.cardBackPattern;
  const margin = width * 0.12;
  const innerW = width - margin * 2;
  const innerH = height - margin * 2;
  const cols = 4;
  const rows = 6;
  const cellW = innerW / cols;
  const cellH = innerH / rows;
  const frame = (
    <Rect x={margin} y={margin} width={innerW} height={innerH} fill="none" stroke={color} strokeWidth={1.5} rx={4} />
  );

  if (theme.backPattern === 'stripe') {
    const step = innerH / 6;
    const lines = [];
    for (let i = 1; i < 6; i++) {
      const y = margin + step * i;
      lines.push(<Line key={i} x1={margin} y1={y} x2={width - margin} y2={y} stroke={color} strokeWidth={1.5} opacity={0.6} />);
    }
    return (
      <G>
        {lines}
        {frame}
      </G>
    );
  }

  if (theme.backPattern === 'tile') {
    const items = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = margin + cellW * (c + 0.5);
        const cy = margin + cellH * (r + 0.5);
        items.push(
          <Circle key={`${r}-${c}`} cx={cx} cy={cy} r={Math.min(cellW, cellH) * 0.22} fill={color} opacity={0.55} />,
        );
      }
    }
    return (
      <G>
        {items}
        {frame}
      </G>
    );
  }

  // diamond (baklava)
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = margin + cellW * (c + 0.5);
      const cy = margin + cellH * (r + 0.5);
      const size = Math.min(cellW, cellH) * 0.5;
      items.push(
        <Rect
          key={`${r}-${c}`}
          x={cx - size / 2}
          y={cy - size / 2}
          width={size}
          height={size}
          rotation={45}
          origin={`${cx}, ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          opacity={0.6}
        />,
      );
    }
  }
  return (
    <G>
      {items}
      {frame}
    </G>
  );
}
