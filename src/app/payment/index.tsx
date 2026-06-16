import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Spacing } from '@/constants/theme';
import { Payment, useData } from '@/context/DataContext';
import { useTheme } from '@/hooks/use-theme';
import { shareReceiptPDF } from '@/utils/pdfGenerator';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, DollarSign, Filter, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaymentHistory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { payments, invoices, clients, businessProfile } = useData();

  const [clientIdFilter, setClientIdFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);

  const activeCurrency = businessProfile?.currency || 'USD';

  const formatCurrencyVal = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: activeCurrency }).format(val);
  };

  const formatDateVal = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getClientName = (clientId: string) => {
    const cli = clients.find((c) => c.id === clientId);
    return cli ? cli.name : 'Unknown Client';
  };

  const getInvoiceNumberForPayment = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    return inv ? inv.invoiceNumber : '#Unlinked';
  };

  const getClientNameForPayment = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    return inv ? getClientName(inv.clientId) : 'Unknown Client';
  };

  // Perform filtration
  const getFilteredPayments = (): Payment[] => {
    return payments.filter((p) => {
      const inv = invoices.find((i) => i.id === p.invoiceId);

      // Client ID filter
      if (clientIdFilter !== 'all' && inv?.clientId !== clientIdFilter) {
        return false;
      }

      const pDate = new Date(p.date).getTime();

      // Start Date filter
      if (startDate) {
        const sDate = new Date(startDate).getTime();
        if (isNaN(sDate) || pDate < sDate) return false;
      }

      // End Date filter
      if (endDate) {
        const eDate = new Date(endDate).getTime();
        if (isNaN(eDate) || pDate > eDate + 24 * 60 * 60 * 1000) return false; // cover entire end day
      }

      return true;
    });
  };

  const filteredPayments = getFilteredPayments().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalFilteredSum = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleShareReceiptPDF = async (pay: Payment) => {
    try {
      const inv = invoices.find((i) => i.id === pay.invoiceId);
      if (!inv) return;
      const cli = clients.find((c) => c.id === inv.clientId);
      if (!cli || !businessProfile) return;

      await shareReceiptPDF(pay, inv, cli, businessProfile);
    } catch (err: any) {
      console.error('Receipt PDF Error:', err);
      Alert.alert('Receipt Error', `Failed to generate receipt PDF: ${err?.message || String(err)}`);
    }
  };

  const getFilterClientLabel = () => {
    if (clientIdFilter === 'all') return 'All Clients';
    const cli = clients.find((c) => c.id === clientIdFilter);
    return cli ? cli.name : 'All Clients';
  };

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={styles.container}>
      {/* Hero Header */}
      <LinearGradient
        colors={['#0F172A', '#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop }]}
      >
        {/* Nav row */}
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBack}>
            <ArrowLeft size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <Text style={styles.heroNavTitle}>Payment History</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Amount hero */}
        <View style={styles.heroBody}>
          <Text style={styles.heroAmount}>{formatCurrencyVal(totalFilteredSum)}</Text>
          <Text style={styles.heroAmountLabel}>Total Collected in Range</Text>
        </View>
      </LinearGradient>

      {/* Main List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filters Summary Box */}
        <View style={[styles.filtersCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {/* Header row */}
          <View style={[styles.filtersHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.filtersHeaderLeft}>
              <View style={styles.filterIconWrap}>
                <Filter size={13} color="#208AEF" />
              </View>
              <Text style={[styles.filtersTitle, { color: theme.text }]}>Filter Payments</Text>
            </View>
            {(clientIdFilter !== 'all' || startDate !== '' || endDate !== '') && (
              <TouchableOpacity
                onPress={() => {
                  setClientIdFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Fields Content */}
          <View style={styles.filtersContent}>
            <View style={styles.filterFieldsRow}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CLIENT</Text>
              <TouchableOpacity
                style={[styles.clientPicker, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setIsClientModalVisible(true)}
              >
                <Text style={[styles.clientPickerText, { color: theme.text }]}>{getFilterClientLabel()}</Text>
                <Filter size={14} color="#208AEF" />
              </TouchableOpacity>
            </View>

            <View style={styles.datesGrid}>
              <Input
                label="Start Date"
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
                containerStyle={styles.dateField}
              />
              <Input
                label="End Date"
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
                containerStyle={styles.dateField}
              />
            </View>
          </View>
        </View>
        {filteredPayments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <DollarSign size={40} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No payments matching the filters were found.
            </Text>
          </View>
        ) : (
          filteredPayments.map((pay) => (
            <View
              key={pay.id}
              style={[
                styles.paymentCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border }
              ]}
            >
              {/* Colored left bar */}
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.cardLeftBar}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              />

              {/* Status icon badge */}
              <View style={styles.iconBadge}>
                <DollarSign size={16} color="#10B981" />
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <View style={styles.cardBodyLeft}>
                  <Text style={styles.paymentTotal}>{formatCurrencyVal(pay.amount)}</Text>
                  <Text style={[styles.paymentClient, { color: theme.text }]}>
                    {getClientNameForPayment(pay.invoiceId)}
                  </Text>
                  <Text style={[styles.paymentSub, { color: theme.textSecondary }]}>
                    Inv: {getInvoiceNumberForPayment(pay.invoiceId)} • {pay.method.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardBodyRight}>
                  <Text style={[styles.paymentDate, { color: theme.textSecondary }]}>
                    {formatDateVal(pay.date)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleShareReceiptPDF(pay)}
                    style={styles.receiptBtn}
                    activeOpacity={0.7}
                  >
                    <Share2 size={11} color="#208AEF" />
                    <Text style={styles.receiptBtnText}>Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Client selector modal */}
      <Modal visible={isClientModalVisible} onClose={() => setIsClientModalVisible(false)} title="Filter by Client">
        <View style={styles.modalList}>
          <TouchableOpacity
            style={[
              styles.modalItem,
              { backgroundColor: theme.backgroundElement },
              clientIdFilter === 'all' && [styles.modalItemSelected, { backgroundColor: theme.backgroundSelected }]
            ]}
            onPress={() => { setClientIdFilter('all'); setIsClientModalVisible(false); }}
          >
            <Text style={[styles.modalItemText, { color: theme.text }]}>All Clients</Text>
            {clientIdFilter === 'all' && <Text style={{ color: '#208AEF', fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>

          {clients.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.modalItem,
                { backgroundColor: theme.backgroundElement },
                clientIdFilter === c.id && [styles.modalItemSelected, { backgroundColor: theme.backgroundSelected }]
              ]}
              onPress={() => { setClientIdFilter(c.id); setIsClientModalVisible(false); }}
            >
              <Text style={[styles.modalItemText, { color: theme.text }]}>{c.name}</Text>
              {clientIdFilter === c.id && <Text style={{ color: '#208AEF', fontWeight: 'bold' }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroBack: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroBody: {
    alignItems: 'center',
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroAmountLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  backBtn: {
    padding: Spacing.one,
  },
  filtersCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  filtersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(32, 138, 239, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  filtersContent: {
    padding: 16,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  filterFieldsRow: {
    marginBottom: 0,
  },
  clientPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  clientPickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  datesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  dateField: {
    flex: 1,
    marginBottom: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: 10,
    marginTop: 20
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingRight: 14,
    gap: 12,
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
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBodyLeft: {
    flex: 1,
    marginRight: Spacing.two,
  },
  cardBodyRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  paymentTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  paymentClient: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  paymentSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  paymentDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(32, 138, 239, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  receiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#208AEF',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
  },
  emptyIcon: {
    marginBottom: Spacing.two,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalList: {
    gap: 8,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalItemSelected: {
    borderColor: '#208AEF',
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
