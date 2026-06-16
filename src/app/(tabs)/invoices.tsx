import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useData, Invoice, Estimate } from '@/context/DataContext';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/use-theme';
import {
  Search,
  Plus,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  FileCheck,
  AlertCircle,
} from 'lucide-react-native';

const SEGMENTS = ['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Estimates'];

// ── Status config ────────────────────────────────────────────────
function getStatusConfig(status: string, isEstimate = false, isDark = false) {
  const s = isEstimate ? status : status;
  switch (s) {
    case 'Paid':
    case 'Accepted':
      return { color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5', border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0', Icon: CheckCircle2, gradA: '#059669', gradB: '#10B981' };
    case 'Overdue':
    case 'Declined':
      return { color: '#EF4444', bg: isDark ? 'rgba(239, 44, 44, 0.15)' : '#FEE2E2', border: isDark ? 'rgba(239, 44, 44, 0.3)' : '#FECACA', Icon: AlertCircle, gradA: '#DC2626', gradB: '#EF4444' };
    case 'Sent':
      return { color: '#3B82F6', bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE', border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE', Icon: Send, gradA: '#1D4ED8', gradB: '#3B82F6' };
    case 'Converted':
      return { color: '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE', border: isDark ? 'rgba(139, 92, 246, 0.3)' : '#DDD6FE', Icon: FileCheck, gradA: '#6D28D9', gradB: '#8B5CF6' };
    case 'Draft':
      return { color: isDark ? '#9CA3AF' : '#6B7280', bg: isDark ? 'rgba(156, 163, 175, 0.15)' : '#F3F4F6', border: isDark ? 'rgba(156, 163, 175, 0.3)' : '#E5E7EB', Icon: FileText, gradA: '#4B5563', gradB: '#9CA3AF' };
    default:
      return { color: isDark ? '#9CA3AF' : '#6B7280', bg: isDark ? 'rgba(156, 163, 175, 0.15)' : '#F3F4F6', border: isDark ? 'rgba(156, 163, 175, 0.3)' : '#E5E7EB', Icon: Clock, gradA: '#4B5563', gradB: '#9CA3AF' };
  }
}

function formatCurrency(val: number, currency: string) {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val); }
  catch { return `${currency} ${val.toFixed(2)}`; }
}

function formatDate(dateStr: string) {
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return dateStr; }
}

export default function Invoices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { invoices, estimates, clients, businessProfile, themeMode } = useData();
  const [activeSegment, setActiveSegment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = themeMode === 'dark';
  const currency = businessProfile?.currency || 'USD';

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown Client';

  const getFilteredItems = (): (Invoice | Estimate)[] => {
    const q = searchQuery.toLowerCase().trim();
    if (activeSegment === 'Estimates') {
      return estimates.filter(e => {
        const name = getClientName(e.clientId).toLowerCase();
        return name.includes(q) || e.estimateNumber.toLowerCase().includes(q);
      });
    }
    return invoices.filter(inv => {
      const name = getClientName(inv.clientId).toLowerCase();
      const match = name.includes(q) || inv.invoiceNumber.toLowerCase().includes(q);
      if (activeSegment === 'All') return match;
      return match && inv.status === activeSegment;
    });
  };

  const filteredItems = getFilteredItems().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Count per segment
  const segmentCounts: Record<string, number> = {
    All: invoices.length,
    Draft: invoices.filter(i => i.status === 'Draft').length,
    Sent: invoices.filter(i => i.status === 'Sent').length,
    Paid: invoices.filter(i => i.status === 'Paid').length,
    Overdue: invoices.filter(i => i.status === 'Overdue').length,
    Estimates: estimates.length,
  };

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={styles.container}>
      {/* ─── HEADER ───────────────────────────────────────────── */}
      <LinearGradient
        colors={['#0F172A', '#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>BILLING</Text>
            <Text style={styles.headerTitle}>Invoices</Text>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.statChip}>
              <Text style={styles.statNum}>{invoices.filter(i => i.status === 'Overdue').length}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: 'rgba(16,185,129,0.25)' }]}>
              <Text style={[styles.statNum, { color: '#6EE7B7' }]}>{invoices.filter(i => i.status === 'Paid').length}</Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
          </View>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
          <Search size={16} color={theme.textSecondary} />
          <TextInput
            placeholder="Search invoice # or client…"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.searchClear, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Segment tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentsScroll}
          style={styles.segmentsRow}
        >
          {SEGMENTS.map((seg) => {
            const active = activeSegment === seg;
            const count = segmentCounts[seg];
            return (
              <Pressable
                key={seg}
                onPress={() => setActiveSegment(seg)}
                style={[
                  styles.segTab,
                  active && { backgroundColor: theme.background }
                ]}
              >
                <Text style={[
                  styles.segText,
                  active && { color: theme.text }
                ]}>
                  {seg}
                </Text>
                {count > 0 && (
                  <View style={[
                    styles.segBadge,
                    active && { backgroundColor: theme.backgroundSelected }
                  ]}>
                    <Text style={[
                      styles.segBadgeText,
                      active && { color: theme.text }
                    ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* ─── LIST ─────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <LinearGradient colors={isDark ? ['#1E293B', '#0F172A'] : ['#EFF6FF', '#DBEAFE']} style={styles.emptyIconCircle}>
              <FileSpreadsheet size={40} color={isDark ? '#60A5FA' : '#3B82F6'} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {searchQuery ? 'No results found' : `No ${activeSegment === 'All' ? 'Invoices' : activeSegment}`}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery
                ? 'Try a different search term or filter.'
                : `Tap + to create a new ${activeSegment === 'Estimates' ? 'estimate' : 'invoice'}.`}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push(activeSegment === 'Estimates' ? '/estimate/create' : '/invoice/create')}
            >
              <Plus size={15} color="#FFF" />
              <Text style={styles.emptyBtnText}>
                {activeSegment === 'Estimates' ? 'New Estimate' : 'New Invoice'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map((item) => {
            const isEstimate = 'estimateNumber' in item;
            const itemNum = isEstimate ? (item as Estimate).estimateNumber : (item as Invoice).invoiceNumber;
            const sc = getStatusConfig(item.status, isEstimate, isDark);
            const { Icon } = sc;
            const clientName = getClientName(item.clientId);
            const dueLabel = isEstimate
              ? `Valid until: ${formatDate((item as Estimate).validUntil)}`
              : `Due: ${formatDate((item as Invoice).dueDate)}`;
            const isOverdue = !isEstimate && (item as Invoice).status === 'Overdue';

            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(isEstimate ? `/estimate/${item.id}` : `/invoice/${item.id}`)}
                style={({ pressed }) => [styles.cardWrap, pressed && { opacity: 0.92 }]}
              >
                <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  {/* Colored left bar */}
                  <LinearGradient
                    colors={[sc.gradA, sc.gradB]}
                    style={styles.cardLeftBar}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  />

                  {/* Status icon */}
                  <View style={[styles.statusIconWrap, { backgroundColor: sc.bg }]}>
                    <Icon size={18} color={sc.color} />
                  </View>

                  {/* Main info */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <Text style={[styles.itemNum, { color: theme.text }]}>{itemNum}</Text>
                      <Text style={[styles.itemAmount, { color: theme.text }]}>{formatCurrency(item.total, currency)}</Text>
                    </View>
                    <View style={styles.cardMidRow}>
                      <Text style={[styles.clientName, { color: theme.textSecondary }]} numberOfLines={1}>{clientName}</Text>
                      <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                        <Text style={[styles.statusText, { color: sc.color }]}>
                          {isEstimate ? `EST · ${item.status}` : item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardFootRow}>
                      <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        {formatDate(item.createdAt)}
                      </Text>
                      <Text style={[styles.dateText, isOverdue ? styles.overdueDateText : { color: theme.textSecondary }]}>
                        {dueLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── FAB ──────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push(activeSegment === 'Estimates' ? '/estimate/create' : '/invoice/create')}
        style={styles.fabWrap}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#1D4ED8', '#3B82F6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Plus size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerEyebrow: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerStats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statChip: {
    backgroundColor: 'rgba(239,68,68,0.25)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center',
  },
  statNum: { fontSize: 16, fontWeight: '900', color: '#FCA5A5' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14, height: 46, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14 },
  searchClear: { fontSize: 14, fontWeight: '700' },

  // Segments
  segmentsRow: { marginHorizontal: -Spacing.four },
  segmentsScroll: { paddingHorizontal: Spacing.four, gap: 8 },
  segTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  segTabActive: { backgroundColor: '#FFF' },
  segText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  segTextActive: { color: '#1D4ED8' },
  segBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  segBadgeActive: { backgroundColor: '#EFF6FF' },
  segBadgeText: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  segBadgeTextActive: { color: '#1D4ED8' },

  // List
  listContent: { paddingHorizontal: Spacing.four, paddingTop: 4 },

  // Card
  cardWrap: { marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    paddingVertical: 14,
    paddingRight: 14,
    gap: 12,
  },
  cardLeftBar: { width: 4, alignSelf: 'stretch', flexShrink: 0 },
  statusIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemNum: { fontSize: 14, fontWeight: '800' },
  itemAmount: { fontSize: 16, fontWeight: '900' },
  cardMidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  clientName: { fontSize: 12, fontWeight: '600', flex: 1 },
  statusPill: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2, flexShrink: 0,
  },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardFootRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateText: { fontSize: 11, fontWeight: '500' },
  overdueDateText: { color: '#EF4444', fontWeight: '700' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    backgroundColor: '#3B82F6', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // FAB
  fabWrap: {
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 104 : 94, 
    right: Spacing.four,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  fab: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
