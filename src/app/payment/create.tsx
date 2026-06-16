import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData, Payment } from '@/context/DataContext';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  CheckCircle,
  Banknote,
  Building2,
  FileSignature,
  HelpCircle,
  Calendar,
  Hash,
  AlertCircle,
  TrendingUp,
} from 'lucide-react-native';

// ── Method config ────────────────────────────────────────────────
const METHOD_CONFIG: {
  id: 'cash' | 'bank' | 'cheque' | 'other';
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  bg: string;
}[] = [
  { id: 'cash',   label: 'Cash',   Icon: Banknote,       color: '#10B981', bg: '#D1FAE5' },
  { id: 'bank',   label: 'Bank',   Icon: Building2,      color: '#3B82F6', bg: '#DBEAFE' },
  { id: 'cheque', label: 'Cheque', Icon: FileSignature,  color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'other',  label: 'Other',  Icon: HelpCircle,     color: '#6B7280', bg: '#F3F4F6' },
];

function formatCurrency(val: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);
  } catch {
    return `${currency} ${val.toFixed(2)}`;
  }
}

// ── Premium input field ──────────────────────────────────────────
function Field({
  label, icon, value, onChangeText, placeholder, keyboardType = 'default', disabled,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const theme = useTheme();
  const { themeMode } = useData();
  const isDark = themeMode === 'dark';
  return (
    <View style={fi.wrap}>
      <Text style={[fi.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[
        fi.row, 
        { backgroundColor: theme.background, borderColor: theme.border },
        focused && { borderColor: '#10B981', backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4' },
        disabled && fi.rowDisabled
      ]}>
        <View style={fi.iconWrap}>{icon}</View>
        <TextInput
          style={[fi.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType={keyboardType}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}
const fi = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14, height: 52,
  },
  rowDisabled: { opacity: 0.55 },
  iconWrap: { width: 22, alignItems: 'center' },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
});

// ═══════════════════════════════════════════════════════════════
export default function RecordPayment() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const invoiceId = params.invoiceId as string;
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { invoices, clients, payments, savePayment, themeMode } = useData();
  const isDark = themeMode === 'dark';

  const invoice = invoices.find((i) => i.id === invoiceId);
  const client = clients.find((c) => c.id === invoice?.clientId);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState<'cash' | 'bank' | 'cheque' | 'other'>('cash');
  const [reference, setReference] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currency = invoice?.currency || 'USD';
  const invoiceTotal = invoice?.total ?? 0;
  const previousPayments = payments
    .filter((p) => p.invoiceId === invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(invoiceTotal - previousPayments, 0);
  const paidPercent = invoiceTotal > 0 ? Math.min((previousPayments / invoiceTotal) * 100, 100) : 0;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setAmount(remainingBalance > 0 ? String(remainingBalance) : '');
    setDate(new Date().toISOString().split('T')[0]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [remainingBalance]);

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  if (!invoice) {
    return (
      <ThemedView style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={[styles.errorTitle, { color: theme.text }]}>Invoice not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.errorBack, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5' }]}
        >
          <Text style={[styles.errorBackText, { color: isDark ? '#A7F3D0' : '#059669' }]}>← Go Back</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const handleSave = async () => {
    const numAmt = parseFloat(amount);
    if (!amount || isNaN(numAmt) || numAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive payment amount.');
      return;
    }
    if (numAmt > remainingBalance + 0.01) {
      Alert.alert(
        'Amount Exceeds Balance',
        `You entered ${formatCurrency(numAmt, currency)} but the remaining balance is only ${formatCurrency(remainingBalance, currency)}.`
      );
      return;
    }
    if (!date) {
      Alert.alert('Date Required', 'Please enter a payment date.');
      return;
    }

    setIsLoading(true);
    try {
      const paymentData: Omit<Payment, 'id'> = {
        invoiceId,
        amount: numAmt,
        date: new Date(date).toISOString(),
        method,
        reference: reference.trim() || undefined,
      };
      await savePayment(paymentData);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMethod = METHOD_CONFIG.find((m) => m.id === method)!;

  // ── Render ────────────────────────────────────────────────────
  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ─── HERO HEADER ──────────────────────────────────────── */}
      <LinearGradient
        colors={['#064E3B', '#065F46', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop }]}
      >
        {/* Nav */}
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBack}>
            <ArrowLeft size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Record Payment</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.heroSaveBtn, isLoading && { opacity: 0.7 }]}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#10B981" />
              : <Text style={styles.heroSaveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        {/* Invoice summary */}
        <View style={styles.heroSummary}>
          <View style={styles.heroSummaryLeft}>
            <Text style={styles.heroInvNum}>{invoice.invoiceNumber}</Text>
            <Text style={styles.heroClientName}>{client?.name || 'Unknown Client'}</Text>
            <Text style={styles.heroRemaining}>{formatCurrency(remainingBalance, currency)}</Text>
            <Text style={styles.heroRemainingLabel}>Remaining Balance</Text>
          </View>
          <View style={styles.heroCircleWrap}>
            <View style={styles.heroCircle}>
              <Text style={styles.heroCirclePct}>{Math.round(100 - paidPercent)}%</Text>
              <Text style={styles.heroCircleLabel}>due</Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${paidPercent}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              Paid: {formatCurrency(previousPayments, currency)}
            </Text>
            <Text style={styles.progressText}>
              Total: {formatCurrency(invoiceTotal, currency)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── AMOUNT FIELD ──────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
            <TrendingUp size={16} color="#10B981" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Payment Details</Text>
          </View>

          {/* Amount */}
          <View style={[styles.amountWrap, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4', borderColor: '#10B981' }]}>
            <Text style={styles.amountCurrencySymbol}>{currency}</Text>
            <TextInput
              style={[styles.amountInput, { color: isDark ? '#A7F3D0' : '#064E3B' }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#CBD5E1'}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>
          <Text style={[styles.amountHint, { color: theme.textSecondary }]}>
            Max: {formatCurrency(remainingBalance, currency)}
          </Text>

          {/* Quick fill buttons */}
          <View style={styles.quickFillRow}>
            {[25, 50, 75, 100].map((pct) => {
              const fillAmt = (remainingBalance * pct) / 100;
              return (
                <TouchableOpacity
                  key={pct}
                  style={[styles.quickFillBtn, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4', borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#D1FAE5' }]}
                  onPress={() => setAmount(fillAmt.toFixed(2))}
                >
                  <Text style={[styles.quickFillText, { color: isDark ? '#A7F3D0' : '#059669' }]}>{pct}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── METHOD SELECTOR ───────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Payment Method</Text>
          </View>

          <View style={styles.methodGrid}>
            {METHOD_CONFIG.map((m) => {
              const active = method === m.id;
              const { Icon } = m;
              const activeBg = isDark ? `rgba(${m.id === 'cash' ? '16, 185, 129' : m.id === 'bank' ? '59, 130, 246' : m.id === 'cheque' ? '139, 92, 246' : '107, 114, 128'}, 0.15)` : m.bg;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  style={[
                    styles.methodCard,
                    { 
                      borderColor: active ? m.color : theme.border, 
                      backgroundColor: active ? activeBg : theme.background 
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.methodIconCircle, { backgroundColor: active ? m.color : (isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB') }]}>
                    <Icon size={18} color={active ? '#FFF' : theme.textSecondary} />
                  </View>
                  <Text style={[styles.methodLabel, { color: active ? m.color : theme.textSecondary }]}>
                    {m.label}
                  </Text>
                  {active && (
                    <View style={[styles.methodCheck, { backgroundColor: m.color }]}>
                      <CheckCircle size={10} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── DATE & REFERENCE ──────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
            <Calendar size={16} color="#10B981" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Additional Info</Text>
          </View>

          <Field
            label="Payment Date *"
            icon={<Calendar size={16} color="#10B981" />}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            disabled={isLoading}
          />

          <Field
            label="Reference / Note"
            icon={<Hash size={16} color={theme.textSecondary} />}
            value={reference}
            onChangeText={setReference}
            placeholder="Txn ID, Check #, Wire code…"
            disabled={isLoading}
          />
        </View>

        {/* ─── SUMMARY CARD ──────────────────────────────────── */}
        <View style={[styles.card, styles.summaryCard, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Invoice Total</Text>
            <Text style={[styles.summaryVal, { color: theme.text }]}>{formatCurrency(invoiceTotal, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Previously Paid</Text>
            <Text style={[styles.summaryVal, { color: '#10B981' }]}>{formatCurrency(previousPayments, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>This Payment</Text>
            <Text style={[styles.summaryVal, { color: selectedMethod.color }]}>
              {parseFloat(amount) > 0 ? formatCurrency(parseFloat(amount), currency) : '—'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryGrandRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.summaryGrandLabel, { color: theme.text }]}>Balance After</Text>
            <Text style={[styles.summaryGrandVal, { color: remainingBalance - (parseFloat(amount) || 0) <= 0 ? '#10B981' : '#EF4444' }]}>
              {formatCurrency(Math.max(remainingBalance - (parseFloat(amount) || 0), 0), currency)}
            </Text>
          </View>
        </View>

        {/* ─── SAVE BUTTON ───────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          style={styles.saveButtonWrap}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#059669', '#10B981']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            {isLoading
              ? <ActivityIndicator color="#FFF" size="small" />
              : (
                <>
                  <CheckCircle size={18} color="#FFF" />
                  <Text style={styles.saveButtonText}>Confirm Payment</Text>
                </>
              )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: Spacing.six }} />
      </ScrollView>
    </ThemedView>
  );
}

// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Error
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.four },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  errorBack: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: '#D1FAE5', borderRadius: 12 },
  errorBackText: { fontSize: 14, fontWeight: '700', color: '#059669' },

  // Hero
  hero: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
  },
  heroNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  heroBack: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  heroSaveBtn: {
    backgroundColor: '#FFF', borderRadius: 10,
    paddingVertical: 7, paddingHorizontal: 16, minWidth: 56, alignItems: 'center',
  },
  heroSaveText: { fontSize: 14, fontWeight: '800', color: '#10B981' },

  heroSummary: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 },
  heroSummaryLeft: { flex: 1 },
  heroInvNum: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', letterSpacing: 1.5, marginBottom: 4 },
  heroClientName: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  heroRemaining: { fontSize: 34, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  heroRemainingLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontWeight: '500' },

  heroCircleWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroCirclePct: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  heroCircleLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  progressSection: { gap: 6 },
  progressBg: {
    width: '100%', height: 5, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Scroll content
  scrollContent: { paddingTop: 20, paddingHorizontal: Spacing.four },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.6 },

  // Amount input
  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 16,
    borderWidth: 2, borderColor: '#10B981',
    paddingHorizontal: 16, height: 64,
    marginBottom: 8,
  },
  amountCurrencySymbol: { fontSize: 22, fontWeight: '700', color: '#10B981', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '900', color: '#064E3B' },
  amountHint: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginBottom: 14, marginLeft: 4 },

  // Quick fill
  quickFillRow: { flexDirection: 'row', gap: 8 },
  quickFillBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 10,
    paddingVertical: 8, borderWidth: 1, borderColor: '#D1FAE5',
  },
  quickFillText: { fontSize: 12, fontWeight: '800', color: '#059669' },

  // Method grid
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodCard: {
    width: '47%', borderRadius: 14,
    borderWidth: 2, padding: 14,
    alignItems: 'center', gap: 8,
    position: 'relative',
  },
  methodIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  methodLabel: { fontSize: 13, fontWeight: '700' },
  methodCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  // Summary card
  summaryCard: { backgroundColor: '#FAFBFF' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  summaryVal: { fontSize: 13, fontWeight: '700', color: '#374151' },
  summaryGrandRow: {
    borderTopWidth: 1.5, borderTopColor: '#E2E8F0',
    paddingTop: 10, marginTop: 6, marginBottom: 0,
  },
  summaryGrandLabel: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  summaryGrandVal: { fontSize: 16, fontWeight: '900' },

  // Save button
  saveButtonWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  saveButtonText: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
});
