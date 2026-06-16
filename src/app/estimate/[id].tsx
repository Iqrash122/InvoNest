import React from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData, Estimate, Invoice } from '@/context/DataContext';
import { shareInvoicePDF } from '@/utils/pdfGenerator';
import * as Sharing from 'expo-sharing';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Share2, 
  Edit3, 
  Trash2, 
  Copy, 
  FileText,
  Calendar,
  Building,
  CheckCircle,
  XCircle,
  FileSpreadsheet
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

export default function EstimateDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const estimateId = params.id as string;
  const insets = useSafeAreaInsets();

  const { estimates, clients, businessProfile, deleteEstimate, saveEstimate, convertToInvoice, themeMode } = useData();
  const theme = useTheme();
  const isDark = themeMode === 'dark';

  const estimate = estimates.find((e) => e.id === estimateId);
  const client = clients.find((c) => c?.id === estimate?.clientId);

  if (!estimate) {
    return (
      <ThemedView style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Estimate not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const activeCurrency = estimate.currency;

  const formatCurrencyVal = (val: any) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return `${activeCurrency} 0.00`;
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: activeCurrency }).format(num);
    } catch {
      return `${activeCurrency} ${num.toFixed(2)}`;
    }
  };

  const formatDateVal = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleSharePDF = async () => {
    try {
      if (!client || !businessProfile) {
        Alert.alert('Error', 'Missing client or business details to compile PDF.');
        return;
      }
      // Re-use invoice pdf compiler by transforming estimate properties to invoice model structure
      const mockInvoice = {
        invoiceNumber: estimate.estimateNumber,
        dueDate: estimate.validUntil,
        createdAt: estimate.createdAt,
        items: estimate.items,
        subtotal: estimate.subtotal,
        tax: estimate.tax,
        discount: estimate.discount,
        total: estimate.total,
        currency: estimate.currency,
        status: estimate.status,
        notes: estimate.notes
      };

      await shareInvoicePDF(mockInvoice, client, businessProfile, estimate.templateId);
    } catch (err: any) {
      console.error('Estimate PDF Generation Error:', err);
      Alert.alert('PDF Error', `Failed to generate estimate PDF: ${err?.message || String(err)}`);
    }
  };

  const handleStatusUpdate = async (status: 'Accepted' | 'Declined' | 'Sent') => {
    try {
      const updated = { ...estimate, status };
      await saveEstimate(updated);
    } catch (err) {
      Alert.alert('Error', 'Failed to update estimate status.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Estimate', 'Are you sure you want to permanently delete this quote/estimate?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          await deleteEstimate(estimateId);
          router.back();
        } 
      }
    ]);
  };

  const handleConvertToInvoice = async () => {
    Alert.alert(
      'Convert to Invoice',
      'This will create a new draft invoice based on this estimate\'s items and client details. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: async () => {
            try {
              const newInvoiceId = await convertToInvoice(estimateId);
              Alert.alert('Conversion Successful', 'Estimate converted successfully! View draft invoice now.', [
                { text: 'View Invoice', onPress: () => router.replace(`/invoice/${newInvoiceId}`) },
                { text: 'Dismiss' }
              ]);
            } catch (err) {
              Alert.alert('Error', 'Failed to convert estimate to invoice.');
            }
          }
        }
      ]
    );
  };

  let badgeColor = '#60646C';
  if (estimate.status === 'Accepted' || estimate.status === 'Converted') badgeColor = '#10B981';
  else if (estimate.status === 'Declined') badgeColor = '#EF4444';
  else if (estimate.status === 'Sent') badgeColor = '#208AEF';

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.appHeader, { paddingTop, paddingBottom: Spacing.four, height: 'auto', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={[styles.appTitle, { color: '#FFF' }]}>Estimate Preview</ThemedText>
        <TouchableOpacity onPress={handleSharePDF} style={styles.shareHeaderBtn}>
          <Share2 size={18} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>ESTIMATE STATUS</Text>
              <Text style={[styles.statusVal, { color: badgeColor }]}>{estimate.status}</Text>
            </View>
            <View style={[styles.statusIconBox, { backgroundColor: `${badgeColor}15` }]}>
              <FileText size={28} color={badgeColor} />
            </View>
          </View>
        </Card>

        {/* Action Controls Card */}
        <Card style={styles.actionsCard}>
          {estimate.status !== 'Converted' ? (
            <Button
              title="Convert to Invoice"
              onPress={handleConvertToInvoice}
              style={styles.convertBtn}
              icon={<FileSpreadsheet size={16} color="#FFF" style={{ marginRight: 6 }} />}
            />
          ) : (
            <View style={[styles.convertedNotice, { backgroundColor: isDark ? 'rgba(32, 138, 239, 0.15)' : '#E6F4FE' }]}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.convertedNoticeText}>Converted to Invoice</Text>
            </View>
          )}

          <View style={styles.statusActionsRow}>
            {estimate.status !== 'Converted' && (
              <>
                <TouchableOpacity 
                  onPress={() => handleStatusUpdate('Accepted')} 
                  style={[styles.statusActionBtn, { backgroundColor: isDark ? 'rgba(30, 126, 52, 0.15)' : '#E3FBE3' }]}
                >
                  <CheckCircle size={14} color="#1E7E34" />
                  <Text style={[styles.statusActionText, { color: '#1E7E34' }]}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleStatusUpdate('Declined')} 
                  style={[styles.statusActionBtn, { backgroundColor: isDark ? 'rgba(197, 57, 41, 0.15)' : '#FCE8E6' }]}
                >
                  <XCircle size={14} color="#C53929" />
                  <Text style={[styles.statusActionText, { color: '#C53929' }]}>Decline</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={[styles.minorActionsRow, { borderTopColor: theme.border }]}>
            {estimate.status !== 'Converted' && (
              <TouchableOpacity onPress={() => router.push(`/estimate/create?id=${estimateId}`)} style={styles.minorActionItem}>
                <Edit3 size={16} color={theme.textSecondary} />
                <Text style={[styles.minorActionText, { color: theme.textSecondary }]}>Edit</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleDelete} style={styles.minorActionItem}>
              <Trash2 size={16} color="#EF4444" />
              <Text style={[styles.minorActionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Client & Date Details */}
        <Card title="Billing Details">
          <View style={styles.detailsBlock}>
            <Building size={18} color={theme.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>Billed To</Text>
              <Text style={[styles.clientNameText, { color: theme.text }]}>{client?.name || 'Unknown Client'}</Text>
              {client?.email && <Text style={[styles.clientSubText, { color: theme.textSecondary }]}>{client.email}</Text>}
              {client?.address && <Text style={[styles.clientSubText, { color: theme.textSecondary }]}>{client.address}</Text>}
            </View>
          </View>

          <View style={[styles.detailsSeparator, { backgroundColor: theme.border }]} />

          <View style={styles.detailsBlock}>
            <Calendar size={18} color={theme.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.metaLabel}>Created</Text>
                <Text style={[styles.dateValText, { color: theme.text }]}>{formatDateVal(estimate.createdAt)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>Valid Until</Text>
                <Text style={[styles.dateValText, { color: estimate.status === 'Draft' || estimate.status === 'Sent' ? '#EF4444' : theme.text }]}>
                  {formatDateVal(estimate.validUntil)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Line Items Table */}
        <Card title="Items Summary">
          {estimate.items.map((item, idx) => (
            <View key={idx} style={[styles.lineItemRow, { borderBottomColor: idx === estimate.items.length - 1 ? 'transparent' : theme.border }]}>
              <View style={styles.itemLeft}>
                <Text style={[styles.itemDescText, { color: theme.text }]}>{item.description}</Text>
                <Text style={[styles.itemQtyText, { color: theme.textSecondary }]}>
                  Qty: {item.qty} • Rate: {formatCurrencyVal(item.rate)}
                  {item.taxRate ? ` • Tax: ${item.taxRate}%` : ''}
                </Text>
              </View>
              <Text style={[styles.itemAmountText, { color: theme.text }]}>{formatCurrencyVal(item.amount)}</Text>
            </View>
          ))}
          
          <View style={[styles.invoiceTotals, { borderTopColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal:</Text>
              <Text style={[styles.summaryVal, { color: theme.text }]}>{formatCurrencyVal(estimate.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Tax:</Text>
              <Text style={[styles.summaryVal, { color: theme.text }]}>{formatCurrencyVal(estimate.tax)}</Text>
            </View>
            {estimate.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Discount:</Text>
                <Text style={[styles.summaryVal, { color: '#10B981' }]}>-{formatCurrencyVal(estimate.discount)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryGrandRow, { borderTopColor: theme.border }]}>
              <Text style={[styles.grandTotalLabel, { color: theme.text }]}>Grand Total:</Text>
              <Text style={styles.grandTotalVal}>{formatCurrencyVal(estimate.total)}</Text>
            </View>
          </View>
        </Card>

        {estimate.notes ? (
          <Card title="Notes / Terms">
            <Text style={[styles.notesText, { color: theme.text }]}>{estimate.notes}</Text>
          </Card>
        ) : null}

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: Spacing.one,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  shareHeaderBtn: {
    padding: Spacing.one,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  statusCard: {
    marginVertical: 0,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  statusVal: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statusIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsCard: {
    marginVertical: 0,
    paddingBottom: Spacing.two,
  },
  convertBtn: {
    alignSelf: 'stretch',
    marginBottom: Spacing.two,
  },
  convertedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E6F4FE',
    paddingVertical: Spacing.two,
    borderRadius: 12,
    marginBottom: Spacing.two,
  },
  convertedNoticeText: {
    color: '#208AEF',
    fontWeight: '800',
    fontSize: 14,
  },
  statusActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.three,
  },
  statusActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  statusActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  minorActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: Spacing.three,
  },
  minorActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minorActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  detailsBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  clientSubText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  detailsSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: Spacing.three,
  },
  dateValText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flex: 1,
    marginRight: Spacing.two,
  },
  itemDescText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemQtyText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  itemAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  invoiceTotals: {
    marginTop: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: Spacing.three,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  summaryGrandRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: Spacing.two,
    marginTop: Spacing.two,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#208AEF',
  },
  notesText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
});
