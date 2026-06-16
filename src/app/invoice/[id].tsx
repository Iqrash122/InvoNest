import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData, Invoice } from '@/context/DataContext';
import { shareInvoicePDF, shareReceiptPDF } from '@/utils/pdfGenerator';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/hooks/use-theme';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Share2,
  CreditCard,
  Edit3,
  Trash2,
  Copy,
  FileText,
  FileCheck,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Receipt,
  AlertCircle,
} from 'lucide-react-native';

// ── Status config ───────────────────────────────────────────────
function getStatusConfig(status: string) {
  switch (status) {
    case 'Paid':
      return { color: '#10B981', bg: '#D1FAE5', gradStart: '#059669', gradEnd: '#10B981', label: 'PAID' };
    case 'Overdue':
      return { color: '#EF4444', bg: '#FEE2E2', gradStart: '#DC2626', gradEnd: '#EF4444', label: 'OVERDUE' };
    case 'Sent':
      return { color: '#3B82F6', bg: '#DBEAFE', gradStart: '#1D4ED8', gradEnd: '#3B82F6', label: 'SENT' };
    case 'Partially Paid':
      return { color: '#F59E0B', bg: '#FEF3C7', gradStart: '#D97706', gradEnd: '#F59E0B', label: 'PARTIALLY PAID' };
    case 'Draft':
      return { color: '#6B7280', bg: '#F3F4F6', gradStart: '#4B5563', gradEnd: '#6B7280', label: 'DRAFT' };
    default:
      return { color: '#6B7280', bg: '#F3F4F6', gradStart: '#4B5563', gradEnd: '#6B7280', label: status.toUpperCase() };
  }
}

function formatCurrencyVal(val: any, currency: string) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return `${currency} 0.00`;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

function formatDateVal(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

// ── Section header ──────────────────────────────────────────────
function SectionHeader({ label, icon }: { label: string; icon: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={sh.row}>
      <View style={[sh.iconWrap, { backgroundColor: theme.backgroundSelected }]}>{icon}</View>
      <Text style={[sh.text, { color: theme.text }]}>{label}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
});

// ── Action pill button ──────────────────────────────────────────
function ActionPill({
  label, icon, onPress, color = '#1E3A8A', loading = false,
}: { label: string; icon: React.ReactNode; onPress: () => void; color?: string; loading?: boolean }) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[ap.btn, { borderColor: color, backgroundColor: theme.backgroundElement }]} activeOpacity={0.75}>
      {loading ? <ActivityIndicator size="small" color={color} /> : icon}
      <Text style={[ap.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const ap = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  label: { fontSize: 12, fontWeight: '700' },
});

// ═══════════════════════════════════════════════════════════════
export default function InvoiceDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const invoiceId = params.id as string;
  const insets = useSafeAreaInsets();

  const { invoices, clients, payments, businessProfile, deleteInvoice, saveInvoice, themeMode } = useData();
  const theme = useTheme();
  const isDark = themeMode === 'dark';

  const invoice = invoices.find((i) => i.id === invoiceId);
  const client = clients.find((c) => c?.id === invoice?.clientId);
  const invoicePayments = payments.filter((p) => p.invoiceId === invoiceId);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState<string | null>(null);

  if (!invoice) {
    return (
      <ThemedView style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={[styles.errorTitle, { color: theme.text }]}>Invoice not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.errorBack, { backgroundColor: isDark ? 'rgba(32, 138, 239, 0.15)' : '#EEF2FF' }]}
        >
          <Text style={[styles.errorBackText, { color: isDark ? '#60A5FA' : '#4F46E5' }]}>← Go Back</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const sc = getStatusConfig(invoice.status);
  const currency = invoice.currency;
  const totalPaid = invoicePayments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(invoice.total - totalPaid, 0);

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  const handleSharePDF = async () => {
    if (!client || !businessProfile) {
      Alert.alert('Missing Info', 'Client or business profile info is required.');
      return;
    }
    setPdfLoading(true);
    try {
      const invoiceForPDF = {
        ...invoice,
        amountPaid: totalPaid,
        balanceDue: remaining,
      };
      await shareInvoicePDF(invoiceForPDF, client, businessProfile, invoice.templateId);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      Alert.alert('PDF Error', `Failed to generate PDF: ${err?.message || String(err)}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShareReceiptPDF = async (pay: any) => {
    if (!client || !businessProfile) return;
    setReceiptLoading(pay.id);
    try {
      await shareReceiptPDF(pay, invoice, client, businessProfile);
    } catch (err: any) {
      console.error('Receipt PDF Error:', err);
      Alert.alert('Error', `Failed to generate receipt PDF: ${err?.message || String(err)}`);
    } finally {
      setReceiptLoading(null);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Invoice',
      `Permanently delete ${invoice.invoiceNumber}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => { await deleteInvoice(invoiceId); router.back(); },
        },
      ]
    );
  };

  const handleDuplicate = async () => {
    try {
      const lastNum = invoices.reduce((max, inv) => {
        const n = parseInt(inv.invoiceNumber.replace(/[^0-9]/g, ''), 10);
        return !isNaN(n) && n > max ? n : max;
      }, 0);
      const invoiceNumber = `INV-${String(lastNum + 1).padStart(4, '0')}`;
      const data: Omit<Invoice, 'id'> = {
        invoiceNumber,
        clientId: invoice.clientId,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        lateFee: 0,
        total: invoice.total,
        currency: invoice.currency,
        status: 'Draft',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        templateId: invoice.templateId,
        notes: invoice.notes,
      };
      await saveInvoice(data);
      Alert.alert('Duplicated!', `Created ${invoiceNumber} as Draft.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to duplicate invoice.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ─── HERO HEADER ─────────────────────────────────────── */}
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
          <Text style={styles.heroNavTitle}>Invoice Details</Text>
          <TouchableOpacity onPress={handleSharePDF} style={styles.heroShareBtn}>
            {pdfLoading
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Share2 size={18} color="#FFF" />}
          </TouchableOpacity>
        </View>

        {/* Amount hero */}
        <View style={styles.heroBody}>
          <Text style={styles.heroInvNum}>{invoice.invoiceNumber}</Text>
          <Text style={styles.heroAmount}>{formatCurrencyVal(remaining, currency)}</Text>
          <Text style={styles.heroAmountLabel}>Amount Pending</Text>

          {/* Status pill */}
          <View style={[styles.heroStatusPill, { backgroundColor: `${sc.color}25`, borderColor: `${sc.color}60` }]}>
            {invoice.status === 'Paid'
              ? <FileCheck size={13} color={sc.color} />
              : <FileText size={13} color={sc.color} />}
            <Text style={[styles.heroStatusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Progress bar (paid vs total) */}
        {invoice.status !== 'Draft' && invoice.total > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((totalPaid / invoice.total) * 100, 100)}%`, backgroundColor: sc.color },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {formatCurrencyVal(totalPaid, currency)} paid of {formatCurrencyVal(invoice.total, currency)}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── ACTION BUTTONS ROW ─────────────────────────────── */}
        <View style={styles.actionRow}>
          <ActionPill
            label="Share PDF"
            icon={<Share2 size={15} color="#1E3A8A" />}
            onPress={handleSharePDF}
            color="#1E3A8A"
            loading={pdfLoading}
          />
          {invoice.status !== 'Paid' && (
            <ActionPill
              label="Record Payment"
              icon={<CreditCard size={15} color="#059669" />}
              onPress={() => router.push(`/payment/create?invoiceId=${invoiceId}`)}
              color="#059669"
            />
          )}
        </View>

        {/* ─── QUICK ACTIONS ──────────────────────────────────── */}
        <View style={[styles.quickActionsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => router.push(`/invoice/create?id=${invoiceId}`)}
          >
            <View style={[styles.quickIconBox, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF' }]}>
              <Edit3 size={16} color="#4F46E5" />
            </View>
            <Text style={[styles.quickLabel, { color: theme.text }]}>Edit</Text>
          </TouchableOpacity>

          <View style={[styles.quickDivider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.quickItem} onPress={handleDuplicate}>
            <View style={[styles.quickIconBox, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED' }]}>
              <Copy size={16} color="#EA580C" />
            </View>
            <Text style={[styles.quickLabel, { color: theme.text }]}>Duplicate</Text>
          </TouchableOpacity>

          <View style={[styles.quickDivider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.quickItem} onPress={handleDelete}>
            <View style={[styles.quickIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}>
              <Trash2 size={16} color="#EF4444" />
            </View>
            <Text style={[styles.quickLabel, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* ─── CLIENT CARD ────────────────────────────────────── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <SectionHeader label="Billed To" icon={<User size={14} color="#4F46E5" />} />
          <Text style={[styles.clientName, { color: theme.text }]}>{client?.name || 'Unknown Client'}</Text>
          {client?.email && (
            <View style={styles.clientInfoRow}>
              <Mail size={13} color={theme.textSecondary} />
              <Text style={[styles.clientInfoText, { color: theme.textSecondary }]}>{client.email}</Text>
            </View>
          )}
          {client?.phone && (
            <View style={styles.clientInfoRow}>
              <Phone size={13} color={theme.textSecondary} />
              <Text style={[styles.clientInfoText, { color: theme.textSecondary }]}>{client.phone}</Text>
            </View>
          )}
          {client?.address && (
            <View style={styles.clientInfoRow}>
              <MapPin size={13} color={theme.textSecondary} />
              <Text style={[styles.clientInfoText, { color: theme.textSecondary }]}>{client.address}</Text>
            </View>
          )}

          {/* Dates row */}
          <View style={[styles.datesRow, { borderTopColor: theme.border }]}>
            <View style={[styles.dateBox, { backgroundColor: theme.background }]}>
              <Calendar size={14} color={theme.textSecondary} />
              <View>
                <Text style={styles.dateBoxLabel}>Issued</Text>
                <Text style={[styles.dateBoxVal, { color: theme.text }]}>{formatDateVal(invoice.createdAt)}</Text>
              </View>
            </View>
            <View style={[styles.dateBox, styles.dateBoxRight, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FFF9F9' }]}>
              <Calendar size={14} color={invoice.status !== 'Paid' ? '#EF4444' : '#10B981'} />
              <View>
                <Text style={styles.dateBoxLabel}>Due Date</Text>
                <Text style={[styles.dateBoxVal, { color: invoice.status !== 'Paid' ? '#EF4444' : '#10B981' }]}>
                  {formatDateVal(invoice.dueDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── LINE ITEMS ──────────────────────────────────────── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <SectionHeader label="Items Summary" icon={<FileText size={14} color="#4F46E5" />} />

          {/* Table header */}
          <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.tableHeaderCell, { flex: 1, color: theme.textSecondary }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderRight, { width: 50, color: theme.textSecondary }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderRight, { width: 80, color: theme.textSecondary }]}>Amount</Text>
          </View>

          {invoice.items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                { borderBottomColor: idx === invoice.items.length - 1 ? 'transparent' : theme.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemDesc, { color: theme.text }]}>{item.description}</Text>
                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {formatCurrencyVal(item.rate, currency)} / unit{item.taxRate ? ` · Tax ${item.taxRate}%` : ''}
                </Text>
              </View>
              <Text style={[styles.tableCell, { width: 50, textAlign: 'right', color: theme.text }]}>{item.qty}</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { width: 80, textAlign: 'right', color: theme.text }]}>
                {formatCurrencyVal(item.amount, currency)}
              </Text>
            </View>
          ))}

          {/* Totals */}
          <View style={[styles.totalsBox, { borderTopColor: theme.border }]}>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { color: theme.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.totalsVal, { color: theme.text }]}>{formatCurrencyVal(invoice.subtotal, currency)}</Text>
            </View>
            {invoice.tax > 0 && (
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { color: theme.textSecondary }]}>Tax</Text>
                <Text style={[styles.totalsVal, { color: theme.text }]}>{formatCurrencyVal(invoice.tax, currency)}</Text>
              </View>
            )}
            {invoice.discount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { color: '#10B981' }]}>Discount</Text>
                <Text style={[styles.totalsVal, { color: '#10B981' }]}>
                  -{formatCurrencyVal(invoice.discount, currency)}
                </Text>
              </View>
            )}
            {invoice.lateFee > 0 && (
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { color: '#EF4444' }]}>Late Fee</Text>
                <Text style={[styles.totalsVal, { color: '#EF4444' }]}>
                  +{formatCurrencyVal(invoice.lateFee, currency)}
                </Text>
              </View>
            )}
            <View style={[styles.grandRow, { borderTopColor: theme.border }]}>
              <Text style={[styles.grandLabel, { color: theme.text }]}>Grand Total</Text>
              <LinearGradient
                colors={[sc.gradStart, sc.gradEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.grandAmtBadge}
              >
                <Text style={styles.grandAmt}>{formatCurrencyVal(invoice.total, currency)}</Text>
              </LinearGradient>
            </View>

            {remaining > 0 && invoice.status !== 'Draft' && (
              <View style={[styles.totalsRow, { marginTop: 4 }]}>
                <Text style={[styles.totalsLabel, { color: '#F59E0B' }]}>Remaining</Text>
                <Text style={[styles.totalsVal, { color: '#F59E0B', fontWeight: '800' }]}>
                  {formatCurrencyVal(remaining, currency)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── PAYMENTS ────────────────────────────────────────── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <SectionHeader label="Recorded Payments" icon={<Receipt size={14} color="#4F46E5" />} />

          {invoicePayments.length === 0 ? (
            <View style={styles.emptyPayments}>
              <Receipt size={28} color={theme.textSecondary} />
              <Text style={[styles.emptyPaymentsText, { color: theme.textSecondary }]}>No payments recorded yet</Text>
              {invoice.status !== 'Paid' && (
                <TouchableOpacity
                  onPress={() => router.push(`/payment/create?invoiceId=${invoiceId}`)}
                  style={[styles.recordPayBtn, { backgroundColor: isDark ? 'rgba(32, 138, 239, 0.15)' : '#EEF6FF' }]}
                >
                  <CreditCard size={14} color="#208AEF" />
                  <Text style={styles.recordPayBtnText}>Record a Payment</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {invoicePayments.map((pay) => (
                <View key={pay.id} style={[styles.payCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <View style={styles.payCardLeft}>
                    <View style={[styles.payMethodBadge, { backgroundColor: isDark ? 'rgba(32, 138, 239, 0.15)' : '#E6F4FE' }]}>
                      <Text style={styles.payMethodText}>{pay.method.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.payAmt}>{formatCurrencyVal(pay.amount, currency)}</Text>
                      <Text style={[styles.payDate, { color: theme.textSecondary }]}>{formatDateVal(pay.date)}</Text>
                      {pay.reference ? <Text style={[styles.payRef, { color: theme.textSecondary }]}>Ref: {pay.reference}</Text> : null}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleShareReceiptPDF(pay)}
                    style={[styles.receiptBtn, { backgroundColor: isDark ? 'rgba(32, 138, 239, 0.15)' : '#EEF6FF' }]}
                    activeOpacity={0.75}
                  >
                    {receiptLoading === pay.id
                      ? <ActivityIndicator size="small" color="#208AEF" />
                      : (
                        <>
                          <Share2 size={13} color="#208AEF" />
                          <Text style={styles.receiptBtnText}>Receipt</Text>
                          <ChevronRight size={12} color="#208AEF" />
                        </>
                      )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── NOTES ───────────────────────────────────────────── */}
        {invoice.notes ? (
          <View style={[styles.sectionCard, { marginBottom: Spacing.six, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <SectionHeader label="Notes & Terms" icon={<FileText size={14} color="#4F46E5" />} />
            <Text style={[styles.notesText, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB', color: theme.text }]}>{invoice.notes}</Text>
          </View>
        ) : (
          <View style={{ height: Spacing.six }} />
        )}
      </ScrollView>
    </ThemedView>
  );
}

// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Error
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.four },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  errorBack: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: '#EEF2FF', borderRadius: 12 },
  errorBackText: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },

  // Hero
  hero: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
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
  heroShareBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBody: { alignItems: 'center', marginBottom: 20 },
  heroInvNum: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, marginBottom: 6 },
  heroAmount: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  heroAmountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, marginBottom: 14 },
  heroStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1,
  },
  heroStatusText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  // Progress
  progressWrap: { alignItems: 'center', gap: 6 },
  progressBg: {
    width: '100%', height: 4, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },

  // Content
  scrollContent: { paddingTop: 18, paddingHorizontal: Spacing.four },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },

  // Quick actions
  quickActionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickItem: { flex: 1, alignItems: 'center', gap: 6 },
  quickIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#374151' },
  quickDivider: { width: 1, height: 36, backgroundColor: '#F3F4F6' },

  // Section card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  // Client
  clientName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10 },
  clientInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  clientInfoText: { fontSize: 13, color: '#6B7280', flex: 1 },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateBox: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12,
  },
  dateBoxRight: { backgroundColor: '#FFF9F9' },
  dateBoxLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  dateBoxVal: { fontSize: 13, fontWeight: '700', color: '#1F2937' },

  // Table
  tableHeader: {
    flexDirection: 'row', paddingBottom: 8,
    borderBottomWidth: 2, borderBottomColor: '#F3F4F6', marginBottom: 4,
  },
  tableHeaderCell: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableHeaderRight: { textAlign: 'right' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1,
  },
  tableCell: { fontSize: 13, color: '#374151', fontWeight: '500' },
  tableCellBold: { fontWeight: '800', color: '#111827' },
  itemDesc: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  itemMeta: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  // Totals
  totalsBox: {
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalsLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  totalsVal: { fontSize: 13, color: '#374151', fontWeight: '700' },
  grandRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 12,
    borderTopWidth: 1.5, borderTopColor: '#E5E7EB',
  },
  grandLabel: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  grandAmtBadge: { borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14 },
  grandAmt: { fontSize: 18, fontWeight: '900', color: '#FFF' },

  // Payments
  emptyPayments: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyPaymentsText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  recordPayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4, backgroundColor: '#EEF6FF',
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10,
  },
  recordPayBtnText: { fontSize: 13, fontWeight: '700', color: '#208AEF' },
  payCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  payCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  payMethodBadge: {
    backgroundColor: '#E6F4FE', borderRadius: 8,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  payMethodText: { fontSize: 10, fontWeight: '800', color: '#208AEF', letterSpacing: 0.5 },
  payAmt: { fontSize: 15, fontWeight: '800', color: '#10B981' },
  payDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1, fontWeight: '500' },
  payRef: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  receiptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EEF6FF', borderRadius: 10,
    paddingVertical: 7, paddingHorizontal: 10,
  },
  receiptBtnText: { fontSize: 11, fontWeight: '700', color: '#208AEF' },

  // Notes
  notesText: {
    fontSize: 13, color: '#4B5563', lineHeight: 20,
    backgroundColor: '#FFFBEB', borderRadius: 10,
    padding: 12, borderLeftWidth: 3, borderLeftColor: '#F59E0B',
  },
});
