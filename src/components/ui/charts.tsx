import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface IncomeTrendsChartProps {
  data: { month: string; amount: number }[];
  currency?: string;
}

export function IncomeTrendsChart({ data, currency = 'USD' }: IncomeTrendsChartProps) {
  const theme = useTheme();
  const maxAmount = data.reduce((max, item) => (item.amount > max ? item.amount : max), 1) || 1;
  const hasAnyData = data.some(d => d.amount > 0);

  const formatVal = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return val.toFixed(0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartRow}>
        {/* Y Axis */}
        <View style={styles.yAxis}>
          <Text style={[styles.axisText, { color: theme.textSecondary }]}>{formatVal(maxAmount)}</Text>
          <Text style={[styles.axisText, { color: theme.textSecondary }]}>{formatVal(maxAmount / 2)}</Text>
          <Text style={[styles.axisText, { color: theme.textSecondary }]}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { bottom: '33%' }]} />
          <View style={[styles.gridLine, { bottom: '66%' }]} />

          {data.map((item, index) => {
            const heightPct = hasAnyData ? (item.amount / maxAmount) * 100 : 0;
            const isHighest = item.amount === maxAmount && item.amount > 0;
            return (
              <View key={index} style={styles.barCol}>
                {/* Tooltip on tallest bar */}
                {isHighest && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>{formatVal(item.amount)}</Text>
                  </View>
                )}
                <View style={styles.barTrack}>
                  {heightPct > 0 ? (
                    <LinearGradient
                      colors={isHighest ? ['#1D4ED8', '#3B82F6'] : ['#60A5FA', '#93C5FD']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.barFill,
                        { height: `${Math.max(heightPct, 5)}%` },
                      ]}
                    />
                  ) : (
                    <View style={styles.barEmpty} />
                  )}
                </View>
                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{item.month}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {!hasAnyData && (
        <Text style={styles.noDataText}>No payment data recorded yet</Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
interface IncomeGoalProps {
  current: number;
  target: number;
  currency?: string;
}

export function IncomeGoalProgressBar({ current, target, currency = 'USD' }: IncomeGoalProps) {
  const theme = useTheme();
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  const fmt = (val: number) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
    } catch { return `${val}`; }
  };

  return (
    <View style={styles.goalContainer}>
      <View style={styles.goalTextRow}>
        <Text style={[styles.goalLabel, { color: theme.textSecondary }]}>Monthly Income Goal</Text>
        <Text style={[styles.goalValues, { color: theme.text }]}>
          {fmt(current)} <Text style={{ color: theme.textSecondary, fontWeight: 'normal' }}>/ {fmt(target)}</Text>
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
        <LinearGradient
          colors={pct >= 100 ? ['#059669', '#10B981'] : ['#1D4ED8', '#3B82F6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${pct}%` }]}
        />
      </View>
      <Text style={[styles.goalSubtext, { color: theme.textSecondary }]}>
        {pct.toFixed(0)}% of monthly target achieved
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
interface OutstandingChartProps {
  paid: number;
  unpaid: number;
  overdue: number;
  currency?: string;
}

export function OutstandingRatioChart({ paid, unpaid, overdue, currency = 'USD' }: OutstandingChartProps) {
  const theme = useTheme();
  const total = paid + unpaid + overdue;

  const getPct = (val: number) => (total > 0 ? (val / total) * 100 : 0);

  const fmt = (val: number) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
    } catch { return `${val}`; }
  };

  const segments = [
    { label: 'Collected', value: paid, pct: getPct(paid), color1: '#059669', color2: '#10B981' },
    { label: 'Open', value: unpaid, pct: getPct(unpaid), color1: '#1D4ED8', color2: '#3B82F6' },
    { label: 'Overdue', value: overdue, pct: getPct(overdue), color1: '#DC2626', color2: '#EF4444' },
  ];

  return (
    <View style={styles.ratioContainer}>
      {/* Stacked bar */}
      <View style={styles.ratioTrack}>
        {total === 0 ? (
          <View style={[styles.ratioBar, { width: '100%', backgroundColor: '#F3F4F6' }]} />
        ) : (
          segments.map((s) =>
            s.value > 0 ? (
              <LinearGradient
                key={s.label}
                colors={[s.color1, s.color2]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.ratioBar, { width: `${s.pct}%` }]}
              />
            ) : null
          )
        )}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {segments.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <LinearGradient
              colors={[s.color1, s.color2]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.legendIndicator}
            />
            <View>
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{s.label}</Text>
              <Text style={[styles.legendValue, { color: theme.text }]}>{fmt(s.value)}</Text>
              <Text style={styles.legendPct}>{s.pct.toFixed(0)}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // Income chart
  container: {
    height: 190,
    alignSelf: 'stretch',
    paddingVertical: Spacing.one,
  },
  chartRow: {
    flex: 1,
    flexDirection: 'row',
  },
  yAxis: {
    width: 34,
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    alignItems: 'flex-end',
    paddingRight: Spacing.one + 2,
  },
  axisText: {
    fontSize: 9,
    fontWeight: '700',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 2,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 6,
    backgroundColor: '#1E3A8A',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tooltipText: { fontSize: 9, color: '#FFF', fontWeight: '800' },
  barTrack: {
    width: 20,
    height: '80%',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barEmpty: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '700',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Goal progress bar
  goalContainer: { alignSelf: 'stretch' },
  goalTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  goalLabel: { fontSize: 14, fontWeight: '600' },
  goalValues: { fontSize: 14, fontWeight: '700' },
  progressTrack: {
    height: 12,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  progressBar: { height: '100%', borderRadius: 8 },
  goalSubtext: { fontSize: 11, marginTop: 6, fontWeight: '500' },

  // Ratio chart
  ratioContainer: { alignSelf: 'stretch' },
  ratioTrack: {
    height: 18,
    borderRadius: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginBottom: Spacing.three + 4,
    backgroundColor: '#F3F4F6',
  },
  ratioBar: { height: '100%' },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 4,
    marginTop: 3,
    flexShrink: 0,
  },
  legendLabel: { fontSize: 11, fontWeight: '600' },
  legendValue: { fontSize: 13, fontWeight: '800', marginTop: 1 },
  legendPct: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 1 },
});
