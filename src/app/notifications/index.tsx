import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAllScheduledReminders, cancelScheduledReminder } from '@/utils/notifications';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Calendar,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  BellOff,
  Zap,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useData } from '@/context/DataContext';

interface ScheduledReminder {
  id: string;
  title: string;
  body: string;
  invoiceId?: string;
  triggerType?: string;
}

interface HistoryItem {
  id: string;
  title: string;
  body: string;
  date: string;
  type: 'reminder' | 'late_fee' | 'overdue';
}

function getHistoryIcon(type: string) {
  if (type === 'late_fee') return { Icon: AlertTriangle, color: '#EF4444', bg: '#FEE2E2' };
  if (type === 'overdue') return { Icon: Clock, color: '#F59E0B', bg: '#FEF3C7' };
  return { Icon: CheckCircle2, color: '#10B981', bg: '#D1FAE5' };
}

// ─── Swipeable notification card ────────────────────────────────
function NotifCard({
  item,
  onCancel,
}: {
  item: ScheduledReminder;
  onCancel: (id: string) => void;
}) {
  const scale = new Animated.Value(1);
  const theme = useTheme();
  const { themeMode } = useData();
  const isDark = themeMode === 'dark';

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const isBell = item.triggerType?.toLowerCase().includes('calendar') || item.triggerType?.toLowerCase().includes('daily');

  return (
    <Animated.View style={[nc.wrap, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, { transform: [{ scale }] }]}>
      <View style={nc.leftBar} />
      <View style={nc.body}>
        <View style={[nc.iconWrap, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' }]}>
          <BellRing size={18} color="#8B5CF6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[nc.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[nc.bodyText, { color: theme.textSecondary }]} numberOfLines={2}>{item.body}</Text>
          {item.triggerType && (
            <View style={nc.badgeRow}>
              <Clock size={10} color="#8B5CF6" />
              <Text style={nc.badge}>{item.triggerType}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => onCancel(item.id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[nc.deleteBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Trash2 size={15} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const nc = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  leftBar: { width: 4, backgroundColor: '#8B5CF6' },
  body: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', gap: 12, padding: 14,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 3 },
  bodyText: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  badge: { fontSize: 10, fontWeight: '700', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── History log card ────────────────────────────────────────────
function HistoryCard({ item }: { item: HistoryItem }) {
  const theme = useTheme();
  const { themeMode } = useData();
  const isDark = themeMode === 'dark';
  const { Icon, color, bg } = getHistoryIcon(item.type);
  const badgeBg = isDark ? `rgba(${item.type === 'late_fee' ? '239, 68, 68' : item.type === 'overdue' ? '245, 158, 11' : '16, 185, 129'}, 0.15)` : bg;
  return (
    <View style={[hc.wrap, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[hc.iconWrap, { backgroundColor: badgeBg }]}>
        <Icon size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[hc.title, { color: theme.text }]}>{item.title}</Text>
        <Text style={[hc.body, { color: theme.textSecondary }]}>{item.body}</Text>
      </View>
      <Text style={[hc.date, { color: theme.textSecondary }]}>{item.date}</Text>
    </View>
  );
}

const hc = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  body: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  date: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', flexShrink: 0, marginTop: 2 },
});

// ═══════════════════════════════════════════════════════════════
export default function NotificationsCenter() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { themeMode, invoices } = useData();
  const isDark = themeMode === 'dark';
  const [activeTab, setActiveTab] = useState<'scheduled' | 'history'>('scheduled');
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: 'hist_1',
      title: 'Reminder Sent: INV-0002',
      body: 'Friendly reminder that invoice for VIP Client is due in 3 days.',
      date: '3 days ago',
      type: 'reminder',
    },
    {
      id: 'hist_2',
      title: 'Late Fee Applied: INV-0001',
      body: '2% late fee automatically added to total after grace period.',
      date: '1 week ago',
      type: 'late_fee',
    },
  ]);

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  useEffect(() => {
    async function loadNotifications() {
      if (Platform.OS === 'web') {
        setScheduled([
          { id: 'sched_1', title: 'Upcoming: INV-0004 due soon', body: 'Due in 3 days for Corporate Client.', triggerType: 'Calendar Trigger' },
          { id: 'sched_2', title: 'Overdue: INV-0003 warning', body: 'Repeating overdue notification.', triggerType: 'Daily Trigger' },
        ]);
        return;
      }
      try {
        const list = await getAllScheduledReminders();
        const mapped: ScheduledReminder[] = list
          .map((item: any) => ({
            id: item.identifier,
            title: item.content.title || 'Invoice Reminder',
            body: item.content.body || '',
            invoiceId: item.content.data?.invoiceId ? String(item.content.data.invoiceId) : undefined,
            triggerType: (item.trigger as any)?.type || 'Calendar',
          }))
          .filter((item: any) => {
            // Only show reminders for invoices belonging to the active user
            return invoices.some((inv) => inv.id === item.invoiceId);
          });
        setScheduled(mapped);
      } catch (err) {
        console.warn('Failed to load scheduled notifications:', err);
      }
    }
    loadNotifications();
  }, [invoices]);

  const handleCancelReminder = async (id: string) => {
    if (Platform.OS !== 'web') {
      try { await cancelScheduledReminder(id); } catch { /* ignore */ }
    }
    setScheduled((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearHistory = () => setHistory([]);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ─── HERO HEADER ──────────────────────────────────────── */}
      <LinearGradient
        colors={['#2E1065', '#4C1D95', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop }]}
      >
        {/* Nav */}
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBack}>
            <ArrowLeft size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <Text style={styles.heroNavTitle}>Notification Center</Text>
          {/* Notif count badge */}
          <View style={styles.heroBadgeWrap}>
            {scheduled.length > 0 && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{scheduled.length}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Summary row */}
        <View style={styles.heroStats}>
          <View style={styles.heroStatBox}>
            <BellRing size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroStatNum}>{scheduled.length}</Text>
            <Text style={styles.heroStatLabel}>Scheduled</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatBox}>
            <History size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroStatNum}>{history.length}</Text>
            <Text style={styles.heroStatLabel}>Activity Logs</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatBox}>
            <Zap size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroStatNum}>{scheduled.filter(s => s.triggerType?.toLowerCase().includes('daily')).length}</Text>
            <Text style={styles.heroStatLabel}>Recurring</Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'scheduled' && [styles.tabActive, { backgroundColor: theme.backgroundElement }]]}
            onPress={() => setActiveTab('scheduled')}
          >
            <Bell size={13} color={activeTab === 'scheduled' ? '#7C3AED' : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, activeTab === 'scheduled' && [styles.tabTextActive, { color: isDark ? '#A78BFA' : '#7C3AED' }]]}>
              Scheduled
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && [styles.tabActive, { backgroundColor: theme.backgroundElement }]]}
            onPress={() => setActiveTab('history')}
          >
            <History size={13} color={activeTab === 'history' ? '#7C3AED' : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, activeTab === 'history' && [styles.tabTextActive, { color: isDark ? '#A78BFA' : '#7C3AED' }]]}>
              Activity Log
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── SCHEDULED TAB ──────────────────────────────────── */}
        {activeTab === 'scheduled' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <BellRing size={15} color="#8B5CF6" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Reminders</Text>
              </View>
              <View style={[styles.sectionCountBadge, { backgroundColor: theme.backgroundSelected }]}>
                <Text style={[styles.sectionCountText, { color: isDark ? '#A78BFA' : '#7C3AED' }]}>{scheduled.length}</Text>
              </View>
            </View>

            {scheduled.length === 0 ? (
              <View style={styles.emptyWrap}>
                <LinearGradient
                  colors={isDark ? ['rgba(124, 58, 237, 0.1)', 'rgba(124, 58, 237, 0.2)'] : ['#EDE9FE', '#F5F3FF']}
                  style={styles.emptyIconCircle}
                >
                  <BellOff size={36} color="#8B5CF6" />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Active Reminders</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  Invoice reminders will appear here once scheduled from the invoice screen.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyAction, { backgroundColor: theme.backgroundSelected }]}
                  onPress={() => router.back()}
                >
                  <ChevronRight size={14} color="#7C3AED" />
                  <Text style={[styles.emptyActionText, { color: isDark ? '#A78BFA' : '#7C3AED' }]}>Go to Invoices</Text>
                </TouchableOpacity>
              </View>
            ) : (
              scheduled.map((item) => (
                <NotifCard key={item.id} item={item} onCancel={handleCancelReminder} />
              ))
            )}

            {scheduled.length > 0 && (
              <TouchableOpacity
                style={[styles.clearAllBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' }]}
                onPress={() => scheduled.forEach((s) => handleCancelReminder(s.id))}
              >
                <Trash2 size={14} color="#EF4444" />
                <Text style={styles.clearAllText}>Cancel All Reminders</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ─── HISTORY TAB ────────────────────────────────────── */}
        {activeTab === 'history' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <History size={15} color="#8B5CF6" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Activity Log</Text>
              </View>
              <View style={[styles.sectionCountBadge, { backgroundColor: theme.backgroundSelected }]}>
                <Text style={[styles.sectionCountText, { color: isDark ? '#A78BFA' : '#7C3AED' }]}>{history.length}</Text>
              </View>
            </View>

            {history.length === 0 ? (
              <View style={styles.emptyWrap}>
                <LinearGradient
                  colors={isDark ? ['rgba(124, 58, 237, 0.1)', 'rgba(124, 58, 237, 0.2)'] : ['#EDE9FE', '#F5F3FF']}
                  style={styles.emptyIconCircle}
                >
                  <History size={36} color="#8B5CF6" />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Activity Yet</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  Sent reminders and auto-applied late fees will be logged here.
                </Text>
              </View>
            ) : (
              <>
                {/* Legend */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.legendText, { color: theme.textSecondary }]}>Reminder</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={[styles.legendText, { color: theme.textSecondary }]}>Late Fee</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[styles.legendText, { color: theme.textSecondary }]}>Overdue</Text>
                  </View>
                </View>

                {history.map((item) => (
                  <HistoryCard key={item.id} item={item} />
                ))}

                <TouchableOpacity 
                  style={[styles.clearAllBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' }]} 
                  onPress={handleClearHistory}
                >
                  <Trash2 size={14} color="#EF4444" />
                  <Text style={styles.clearAllText}>Clear Activity Log</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <View style={{ height: Spacing.six }} />
      </ScrollView>
    </ThemedView>
  );
}

// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Hero
  hero: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroBack: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroNavTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  heroBadgeWrap: { width: 38, alignItems: 'flex-end' },
  heroBadge: {
    backgroundColor: '#EF4444', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  // Stats row
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 18,
    gap: 0,
  },
  heroStatBox: { flex: 1, alignItems: 'center', gap: 4 },
  heroStatNum: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  heroStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 4,
    marginBottom: -1, // Bleed into border radius
    marginTop: 0,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 10,
  },
  tabActive: { backgroundColor: '#FFF' },
  tabText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: '#7C3AED' },

  // Scroll
  scrollContent: { paddingTop: 22, paddingHorizontal: Spacing.four },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionCountBadge: {
    backgroundColor: '#EDE9FE', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  sectionCountText: { fontSize: 12, fontWeight: '800', color: '#7C3AED' },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyIconCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
  emptyAction: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EDE9FE', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14, marginTop: 4,
  },
  emptyActionText: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },

  // Clear all
  clearAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 10,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA',
  },
  clearAllText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },

  // Legend
  legendRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
});
