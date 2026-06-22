import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IncomeGoalProgressBar, OutstandingRatioChart } from '@/components/ui/charts';
import { Spacing } from '@/constants/theme';
import { useData } from '@/context/DataContext';
import { useResponsive } from '@/hooks/use-responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import {
  ArrowRight,
  Bell,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Receipt,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  FileCheck
} from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Status config ────────────────────────────────────────────────
function getStatusConfig(status: string) {
  switch (status) {
    case 'Paid':
      return { color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0', Icon: CheckCircle2, gradA: '#059669', gradB: '#10B981' };
    case 'Overdue':
      return { color: '#EF4444', bg: '#FEE2E2', border: '#FECACA', Icon: AlertCircle, gradA: '#DC2626', gradB: '#EF4444' };
    case 'Sent':
      return { color: '#3B82F6', bg: '#DBEAFE', border: '#BFDBFE', Icon: Send, gradA: '#1D4ED8', gradB: '#3B82F6' };
    case 'Partially Paid':
      return { color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A', Icon: Clock, gradA: '#D97706', gradB: '#F59E0B' };
    case 'Draft':
      return { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', Icon: FileText, gradA: '#4B5563', gradB: '#9CA3AF' };
    default:
      return { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', Icon: Clock, gradA: '#4B5563', gradB: '#9CA3AF' };
  }
}

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { moderateScale, isSmallDevice } = useResponsive();
  const { invoices, estimates, clients, payments, businessProfile, themeMode } = useData();
  const isDark = themeMode === 'dark';

  const activeCurrency = businessProfile?.currency || 'USD';

  // Calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);

  const totalOverdue = invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((sum, inv) => {
      const invoicePaid = payments.filter(p => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0);
      return sum + Math.max(0, inv.total - invoicePaid);
    }, 0);

  const totalUnpaid = Math.max(0, totalOutstanding - totalOverdue);

  // Let's set a mock income target (e.g. 10000 or user settings if available)
  const incomeGoal = 10000;

  const formatCurrencyVal = (val: any) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return `${activeCurrency} 0.00`;
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: activeCurrency, maximumFractionDigits: 0 }).format(num);
    } catch {
      return `${activeCurrency} ${num.toFixed(0)}`;
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  // Recent invoices limit to 4
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const paddingTop = Platform.select({
    android: Math.max(insets.top, 24),
    ios: Math.max(insets.top, 44),
    default: 0,
  });

  return (
    <ThemedView style={[styles.container, { paddingTop }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: Spacing.two }}>
            <ThemedText style={[styles.businessName, { fontSize: moderateScale(22) }]}>{businessProfile?.name || 'InvoNest'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.greetingText}>Welcome to your billing dashboard</ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={[styles.notificationBtn, { backgroundColor: theme.backgroundSelected, width: moderateScale(40), height: moderateScale(40), borderRadius: moderateScale(20) }]}
          >
            <Bell size={moderateScale(20)} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Premium Balance Card */}
        <View style={styles.premiumCardContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#2563EB', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumCard}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.premiumBalanceLabel}>TOTAL OUTSTANDING</Text>
              <Text style={[styles.premiumBalanceAmount, { fontSize: moderateScale(36) }]}>{formatCurrencyVal(totalOutstanding)}</Text>
            </View>
            <View style={styles.premiumBalanceSplitRow}>
              <View style={styles.splitCol}>
                <Text style={styles.premiumSplitLabel}>OPEN INVOICES</Text>
                <Text style={styles.premiumSplitVal}>{formatCurrencyVal(totalUnpaid)}</Text>
              </View>
              <View style={styles.premiumSplitDivider} />
              <View style={styles.splitCol}>
                <Text style={styles.premiumSplitLabel}>OVERDUE</Text>
                <Text style={[styles.premiumSplitVal, { color: '#FCA5A5' }]}>{formatCurrencyVal(totalOverdue)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Action Buttons Grid */}
        <View style={styles.actionGrid}>
          <Pressable style={styles.actionItem} onPress={() => router.push('/invoice/create')}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(32, 138, 239, 0.15)' : '#E6F4FE', width: moderateScale(50), height: moderateScale(50), borderRadius: moderateScale(25) }]}>
              <Receipt size={moderateScale(22)} color="#208AEF" />
            </View>
            <Text style={[styles.actionText, { color: theme.text, fontSize: moderateScale(12) }]}>+ Invoice</Text>
          </Pressable>

          <Pressable style={styles.actionItem} onPress={() => router.push('/estimate/create')}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F3E8FF', width: moderateScale(50), height: moderateScale(50), borderRadius: moderateScale(25) }]}>
              <FileText size={moderateScale(22)} color="#8B5CF6" />
            </View>
            <Text style={[styles.actionText, { color: theme.text, fontSize: moderateScale(12) }]}>+ Estimate</Text>
          </Pressable>

          <Pressable style={styles.actionItem} onPress={() => router.push('/client/create')}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', width: moderateScale(50), height: moderateScale(50), borderRadius: moderateScale(25) }]}>
              <UserPlus size={moderateScale(22)} color="#10B981" />
            </View>
            <Text style={[styles.actionText, { color: theme.text, fontSize: moderateScale(12) }]}>+ Client</Text>
          </Pressable>

          <Pressable style={styles.actionItem} onPress={() => router.push('/payment')}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED', width: moderateScale(50), height: moderateScale(50), borderRadius: moderateScale(25) }]}>
              <DollarSign size={moderateScale(22)} color="#F97316" />
            </View>
            <Text style={[styles.actionText, { color: theme.text, fontSize: moderateScale(12) }]}>Payments</Text>
          </Pressable>
        </View>

        {/* Analytics Visuals Card */}
        <Card title="Monthly Analytics" style={styles.chartsCard}>
          <IncomeGoalProgressBar current={totalPaid} target={incomeGoal} currency={activeCurrency} />

          <View style={[styles.chartDivider, { backgroundColor: theme.border }]} />

          <Text style={[styles.chartSectionTitle, { color: theme.text }]}>Outstanding Ratio</Text>
          <OutstandingRatioChart paid={totalPaid} unpaid={totalUnpaid} overdue={totalOverdue} currency={activeCurrency} />
        </Card>

        {/* Recent Invoices Listing */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Recent Invoices</ThemedText>
          <Pressable style={styles.seeAllBtn} onPress={() => router.push('/invoices')}>
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight size={14} color="#208AEF" />
          </Pressable>
        </View>

        {recentInvoices.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FileSpreadsheet size={40} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No invoices created yet.</Text>
            <Button
              title="Create First Invoice"
              onPress={() => router.push('/invoice/create')}
              size="small"
              style={styles.emptyBtn}
            />
          </Card>
        ) : (
          <View style={styles.invoicesList}>
            {recentInvoices.map((inv) => {
              const sc = getStatusConfig(inv.status);
              const { Icon } = sc;

              return (
                <Pressable
                  key={inv.id}
                  onPress={() => router.push(`/invoice/${inv.id}`)}
                  style={({ pressed }) => [styles.invoiceItemPressable, pressed && { opacity: 0.9 }]}
                >
                  <View style={[styles.invoiceItemCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    {/* Colored left bar */}
                    <LinearGradient
                      colors={[sc.gradA, sc.gradB]}
                      style={styles.cardLeftBar}
                      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    />

                    {/* Status icon */}
                    <View style={[styles.statusIconWrap, { backgroundColor: sc.bg }]}>
                      <Icon size={15} color={sc.color} />
                    </View>

                    {/* Card Body */}
                    <View style={styles.cardBody}>
                      <View style={styles.cardTopRow}>
                        <Text style={[styles.invNumber, { color: theme.text }]}>{inv.invoiceNumber}</Text>
                        <Text style={[styles.invTotal, { color: theme.text }]}>{formatCurrencyVal(inv.total)}</Text>
                      </View>
                      <View style={styles.cardMidRow}>
                        <Text style={[styles.invClient, { color: theme.textSecondary }]} numberOfLines={1}>
                          {getClientName(inv.clientId)}
                        </Text>
                        <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                          <Text style={[styles.statusText, { color: sc.color }]}>
                            {inv.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    marginTop: Spacing.two,
  },
  businessName: {
    fontWeight: '800',
  },
  notificationBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    marginTop: 2,
  },
  premiumCardContainer: {
    marginBottom: Spacing.four,
    borderRadius: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumCard: {
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    borderRadius: 20,
    overflow: 'hidden',
  },
  premiumBalanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  splitCol: {
    alignItems: 'center',
    flex: 1,
  },
  premiumBalanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    marginTop: Spacing.two,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  premiumBalanceSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: Spacing.four,
    marginTop: Spacing.one,
  },
  premiumSplitLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  premiumSplitVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    color: '#FFFFFF',
  },
  premiumSplitDivider: {
    width: 1,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  chartsCard: {
    marginBottom: Spacing.four,
  },
  chartDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: Spacing.three,
  },
  chartSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: '#208AEF',
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  emptyIcon: {
    marginBottom: Spacing.two,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyBtn: {
    marginTop: Spacing.three,
  },
  invoicesList: {
    gap: 8, // tighter gap between cards
  },
  invoiceItemPressable: {
    alignSelf: 'stretch',
  },
  invoiceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    paddingVertical: 10,
    paddingRight: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeftBar: {
    width: 4,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  invTotal: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  invClient: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  statusPill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
