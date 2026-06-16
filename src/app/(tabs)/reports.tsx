import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { useData } from '@/context/DataContext';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { IncomeTrendsChart, OutstandingRatioChart } from '@/components/ui/charts';
import { Spacing } from '@/constants/theme';
import { shareReportPDF } from '@/utils/pdfGenerator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  Download,
  DollarSign,
  Briefcase,
  Percent,
  Receipt,
  Users,
  Award,
  BarChart3,
  PieChart,
  Share2,
} from 'lucide-react-native';

function formatCurrency(val: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);
  } catch {
    return `${currency} ${val.toFixed(2)}`;
  }
}

function formatShort(val: number, currency = 'USD') {
  try {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
  } catch {
    return `${val.toFixed(0)}`;
  }
}

// ── KPI metric card ──────────────────────────────────────────────
function KpiCard({
  label, value, subValue, icon: Icon, color, gradStart, gradEnd,
}: {
  label: string; value: string; subValue?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string; gradStart: string; gradEnd: string;
}) {
  const theme = useTheme();
  return (
    <View style={[kpi.wrap, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <LinearGradient
        colors={[gradStart, gradEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={kpi.iconBox}
      >
        <Icon size={18} color="#FFF" />
      </LinearGradient>
      <Text style={[kpi.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[kpi.value, { color }]}>{value}</Text>
      {subValue ? <Text style={[kpi.sub, { color: theme.textSecondary }]}>{subValue}</Text> : null}
    </View>
  );
}
const kpi = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  sub: { fontSize: 10, fontWeight: '500' },
});

// ── Section heading ──────────────────────────────────────────────
function SectionHead({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ size?: number; color?: string }> }) {
  const theme = useTheme();
  return (
    <View style={sh.row}>
      <View style={[sh.iconBox, { backgroundColor: theme.backgroundSelected }]}><Icon size={14} color={theme.text} /></View>
      <Text style={[sh.text, { color: theme.text }]}>{label}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconBox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
});

// ── Ranked client row ────────────────────────────────────────────
function RankRow({ rank, name, amount, maxAmount, currency }: {
  rank: number; name: string; amount: number; maxAmount: number; currency: string;
}) {
  const theme = useTheme();
  const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  const rankColors = ['#F59E0B', '#9CA3AF', '#CD7C2F'];
  const rankColor = rank <= 3 ? rankColors[rank - 1] : theme.textSecondary;
  return (
    <View style={rr.wrap}>
      <View style={[rr.rankBadge, { backgroundColor: rank <= 3 ? `${rankColor}20` : theme.backgroundSelected }]}>
        <Text style={[rr.rankNum, { color: rankColor }]}>{rank}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={rr.topRow}>
          <Text style={[rr.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
          <Text style={rr.amount}>{formatCurrency(amount, currency)}</Text>
        </View>
        <View style={[rr.barBg, { backgroundColor: theme.backgroundSelected }]}>
          <LinearGradient
            colors={rank === 1 ? ['#F59E0B', '#FBBF24'] : rank === 2 ? ['#9CA3AF', '#D1D5DB'] : ['#10B981', '#34D399']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[rr.barFill, { width: `${pct}%` }]}
          />
        </View>
      </View>
    </View>
  );
}
const rr = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  rankBadge: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rankNum: { fontSize: 13, fontWeight: '900' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 13, fontWeight: '700', flex: 1, marginRight: 8 },
  amount: { fontSize: 13, fontWeight: '800', color: '#10B981' },
  barBg: { height: 5, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});

// ═══════════════════════════════════════════════════════════════
export default function Reports() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { invoices, clients, payments, businessProfile } = useData();
  const currency = businessProfile?.currency || 'USD';

  // ── Calculations ─────────────────────────────────────────────
  const totalInvoiced = invoices.reduce((s, inv) => s + inv.total, 0);
  const totalPaid = payments.reduce((s, pay) => s + pay.amount, 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);
  const totalOverdue = invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((s, inv) => {
      const paid = payments.filter(p => p.invoiceId === inv.id).reduce((x, p) => x + p.amount, 0);
      return s + Math.max(0, inv.total - paid);
    }, 0);
  const totalUnpaid = Math.max(0, totalOutstanding - totalOverdue);
  const totalTax = invoices.reduce((s, inv) => s + inv.tax, 0);
  const collectionsEff = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;
  const activeClients = clients.filter(c => invoices.some(i => i.clientId === c.id)).length;

  // Monthly trends
  const getIncomeTrendsData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curIdx = new Date().getMonth();
    const last6: { month: string; amount: number; monthNum: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (curIdx - i + 12) % 12;
      last6.push({ month: months[idx], amount: 0, monthNum: idx });
    }
    payments.forEach((pay) => {
      const month = new Date(pay.date).getMonth();
      const m = last6.find(x => x.monthNum === month);
      if (m) m.amount += pay.amount;
    });
    return last6.map(({ month, amount }) => ({ month, amount }));
  };

  // Client earnings leaderboard
  const getClientEarnings = () => {
    const map: Record<string, number> = {};
    payments.forEach((pay) => {
      const inv = invoices.find(i => i.id === pay.invoiceId);
      if (inv) map[inv.clientId] = (map[inv.clientId] || 0) + pay.amount;
    });
    return Object.entries(map)
      .map(([cid, amount]) => ({ name: clients.find(c => c.id === cid)?.name || 'Unknown', amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const trendsData = getIncomeTrendsData();
  const clientEarnings = getClientEarnings();
  const maxClientAmt = clientEarnings[0]?.amount || 0;

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  const handleExport = async () => {
    try {
      await shareReportPDF(
        {
          totalInvoiced,
          totalPaid,
          totalOutstanding,
          totalOverdue,
          totalTax,
          collectionsEff,
          activeClients,
          clientEarnings,
          currency,
        },
        businessProfile || { name: 'My Business' }
      );
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Failed to generate financial report.');
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <ThemedView style={styles.container}>
      {/* ─── HERO HEADER (Pinned to top) ───────────────────────── */}
      <LinearGradient
        colors={['#0F2027', '#203A43', '#1E3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop }]}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroEyebrow}>Business Analytics</Text>
            <Text style={styles.heroTitle}>Financial Reports</Text>
          </View>
          <TouchableOpacity onPress={handleExport} style={styles.shareBtn}>
            <Share2 size={16} color="#FFF" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Big revenue number */}
        <View style={styles.heroBigStat}>
          <Text style={styles.heroBigNum}>{formatShort(totalPaid, currency)}</Text>
          <Text style={styles.heroBigLabel}>Total Revenue Collected</Text>
        </View>

        {/* Mini stats row */}
        <View style={styles.heroMiniRow}>
          <View style={styles.heroMiniItem}>
            <Text style={styles.heroMiniVal}>{formatShort(totalInvoiced, currency)}</Text>
            <Text style={styles.heroMiniLabel}>Invoiced</Text>
          </View>
          <View style={styles.heroMiniDivider} />
          <View style={styles.heroMiniItem}>
            <Text style={[styles.heroMiniVal, { color: '#EF4444' }]}>{formatShort(totalOverdue, currency)}</Text>
            <Text style={styles.heroMiniLabel}>Overdue</Text>
          </View>
          <View style={styles.heroMiniDivider} />
          <View style={styles.heroMiniItem}>
            <Text style={[styles.heroMiniVal, { color: '#F59E0B' }]}>{collectionsEff.toFixed(0)}%</Text>
            <Text style={styles.heroMiniLabel}>Collection Rate</Text>
          </View>
          <View style={styles.heroMiniDivider} />
          <View style={styles.heroMiniItem}>
            <Text style={styles.heroMiniVal}>{activeClients}</Text>
            <Text style={styles.heroMiniLabel}>Clients</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ─── SCROLLABLE CONTENT ─────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* ─── KPI GRID ──────────────────────────────────────── */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <KpiCard
                label="Revenue"
                value={formatShort(totalPaid, currency)}
                subValue={`of ${formatShort(totalInvoiced, currency)} invoiced`}
                icon={DollarSign}
                color="#10B981"
                gradStart="#059669"
                gradEnd="#10B981"
              />
              <KpiCard
                label="Outstanding"
                value={formatShort(totalOutstanding, currency)}
                subValue={`${totalOutstanding > 0 ? ((totalOutstanding / totalInvoiced) * 100).toFixed(0) : 0}% of total`}
                icon={Briefcase}
                color="#3B82F6"
                gradStart="#1D4ED8"
                gradEnd="#3B82F6"
              />
            </View>
            <View style={styles.kpiRow}>
              <KpiCard
                label="Collection Rate"
                value={`${collectionsEff.toFixed(1)}%`}
                subValue={collectionsEff >= 80 ? '✦ Excellent' : collectionsEff >= 50 ? '▲ Average' : '▼ Needs work'}
                icon={Percent}
                color="#8B5CF6"
                gradStart="#6D28D9"
                gradEnd="#8B5CF6"
              />
              <KpiCard
                label="Tax Collected"
                value={formatShort(totalTax, currency)}
                subValue={`across ${invoices.length} invoices`}
                icon={Receipt}
                color="#F59E0B"
                gradStart="#D97706"
                gradEnd="#F59E0B"
              />
            </View>
          </View>

          {/* ─── INCOME TRENDS CHART ───────────────────────────── */}
          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <SectionHead label="Monthly Cashflow" icon={BarChart3} />
            <IncomeTrendsChart data={trendsData} currency={currency} />
          </View>

          {/* ─── DISTRIBUTION CHART ────────────────────────────── */}
          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <SectionHead label="Payment Distribution" icon={PieChart} />
            <OutstandingRatioChart
              paid={totalPaid}
              unpaid={totalUnpaid}
              overdue={totalOverdue}
              currency={currency}
            />
          </View>

          {/* ─── CLIENT LEADERBOARD ────────────────────────────── */}
          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <SectionHead label="Top Clients by Revenue" icon={Award} />
            {clientEarnings.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Users size={32} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No client revenue recorded yet.</Text>
              </View>
            ) : (
              clientEarnings.map((item, idx) => (
                <RankRow
                  key={idx}
                  rank={idx + 1}
                  name={item.name}
                  amount={item.amount}
                  maxAmount={maxClientAmt}
                  currency={currency}
                />
              ))
            )}
          </View>

          {/* ─── EXPORT BUTTON ─────────────────────────────────── */}
          <TouchableOpacity onPress={handleExport} style={styles.exportBtnWrap} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1E3A8A', '#3B82F6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.exportBtn}
            >
              <Download size={18} color="#FFF" />
              <Text style={styles.exportBtnText}>Export & Share Report</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Hero
  hero: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroEyebrow: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 1.5, marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12,
    marginTop: 4,
  },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  heroBigStat: { alignItems: 'flex-start', marginBottom: 20 },
  heroBigNum: { fontSize: 44, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
  heroBigLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: '500' },

  heroMiniRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  heroMiniItem: { flex: 1, alignItems: 'center', gap: 3 },
  heroMiniVal: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  heroMiniLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  heroMiniDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center' },

  // Content
  content: { paddingHorizontal: Spacing.four, paddingTop: 20 },

  // KPI grid
  kpiGrid: { gap: 10, marginBottom: 14 },
  kpiRow: { flexDirection: 'row', gap: 10 },

  // Section card
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  // Export
  exportBtnWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 0 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  exportBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
});
