import React, { Fragment } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Colors from '@/constants/colors';

export interface TrendSeries {
  label: string;
  color: string;
  values: number[];
}

interface TrendLineChartProps {
  xLabels: string[];
  series: TrendSeries[];
  height?: number;
}

const CHART_WIDTH = 300;
const PADDING = 10;

function buildPaths(values: number[], stepX: number, innerHeight: number) {
  if (values.length === 0) return { linePath: '', areaPath: '', points: [] as { x: number; y: number }[] };
  const max = Math.max(1, ...values);
  const points = values.map((v, i) => ({
    x: PADDING + i * stepX,
    y: PADDING + innerHeight - (v / max) * innerHeight,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = `${linePath} L${last.x},${PADDING + innerHeight} L${first.x},${PADDING + innerHeight} Z`;
  return { linePath, areaPath, points };
}

export default function TrendLineChart({ xLabels, series, height = 140 }: TrendLineChartProps) {
  const innerWidth = CHART_WIDTH - PADDING * 2;
  const innerHeight = height - PADDING * 2;
  const n = xLabels.length;
  const stepX = n > 1 ? innerWidth / (n - 1) : 0;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${CHART_WIDTH} ${height}`}>
        <Defs>
          {series.map((s, idx) => (
            <LinearGradient key={s.label} id={`trend-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={s.color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={s.color} stopOpacity={0} />
            </LinearGradient>
          ))}
        </Defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={f}
            x1={PADDING}
            x2={CHART_WIDTH - PADDING}
            y1={PADDING + innerHeight * f}
            y2={PADDING + innerHeight * f}
            stroke={Colors.gray[100]}
            strokeWidth={1}
          />
        ))}
        {series.map((s, idx) => {
          const { linePath, areaPath, points } = buildPaths(s.values, stepX, innerHeight);
          return (
            <Fragment key={s.label}>
              <Path d={areaPath} fill={`url(#trend-grad-${idx})`} stroke="none" />
              <Path d={linePath} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={Colors.white} stroke={s.color} strokeWidth={2} />
              ))}
            </Fragment>
          );
        })}
      </Svg>
      <View style={styles.xLabelsRow}>
        {xLabels.map((l, i) => (
          <Text key={`${l}-${i}`} style={styles.xLabel}>{l}</Text>
        ))}
      </View>
      <View style={styles.legendRow}>
        {series.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  xLabelsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  xLabel: { fontSize: 10, color: Colors.gray[500] },
  legendRow: {
    flexDirection: 'row' as const,
    gap: 16,
    marginTop: 12,
    justifyContent: 'center' as const,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: Colors.gray[600], fontWeight: '600' as const },
});
