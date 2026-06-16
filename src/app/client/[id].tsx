import React from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, Platform, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData, Invoice, Estimate } from '@/context/DataContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Tag, 
  FileText,
  Clock,
  Receipt,
  FileSpreadsheet
} from 'lucide-react-native';

export default function ClientDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const clientId = params.id as string;
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { clients, invoices, estimates, payments, businessProfile, deleteClient } = useData();

  const client = clients.find((c) => c.id === clientId);
  
  // Filter invoices and estimates for this client
  const clientInvoices = invoices.filter((inv) => inv.clientId === clientId);
  const clientEstimates = estimates.filter((est) => est.clientId === clientId);

  if (!client) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Text style={styles.errorText}>Client profile not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const activeCurrency = businessProfile?.currency || 'USD';

  const formatCurrencyVal = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: activeCurrency }).format(val);
  };

  const formatDateVal = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Math totals
  const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
  
  // Calculate paid amount from the payments array for this client's invoices
  const totalPaid = payments
    .filter(pay => clientInvoices.some(inv => inv.id === pay.invoiceId))
    .reduce((sum, pay) => sum + pay.amount, 0);
    
  const totalOutstanding = Math.max(0, totalBilled - totalPaid);

  // Combine invoices and estimates into history list
  const historyList = [
    ...clientInvoices.map((inv) => ({ ...inv, isEstimate: false })),
    ...clientEstimates.map((est) => ({ ...est, isEstimate: true }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDelete = () => {
    Alert.alert(
      'Delete Client', 
      'Are you sure you want to permanently delete this client? Invoices associated with this client will remain but display as unlinked.', 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteClient(clientId);
            router.back();
          } 
        }
      ]
    );
  };

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.appHeader, { paddingTop, paddingBottom: Spacing.four, height: 'auto', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={[styles.appTitle, { color: '#FFF' }]}>Client Profile</ThemedText>
        <TouchableOpacity onPress={() => router.push(`/client/create?id=${clientId}`)} style={styles.editHeaderBtn}>
          <Edit3 size={18} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Core Card Info */}
        <Card style={styles.profileCard}>
          <Text style={[styles.clientName, { color: theme.text }]}>{client.name}</Text>
          
          {client.tags && client.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {client.tags.map((tag) => (
                <View key={tag} style={[styles.tagPill, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.tagPillText, { color: theme.textSecondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.contactsBlock, { borderTopColor: theme.border }]}>
            {client.email && (
              <View style={styles.contactRow}>
                <Mail size={16} color={theme.textSecondary} style={styles.contactIcon} />
                <Text style={[styles.contactText, { color: theme.text }]}>{client.email}</Text>
              </View>
            )}
            
            {client.phone && (
              <View style={styles.contactRow}>
                <Phone size={16} color={theme.textSecondary} style={styles.contactIcon} />
                <Text style={[styles.contactText, { color: theme.text }]}>{client.phone}</Text>
              </View>
            )}

            {client.address && (
              <View style={styles.contactRow}>
                <MapPin size={16} color={theme.textSecondary} style={styles.contactIcon} />
                <Text style={[styles.contactText, { flex: 1, color: theme.text }]}>{client.address}</Text>
              </View>
            )}
          </View>

          {client.notes ? (
            <View style={[styles.notesBox, { backgroundColor: theme.backgroundSelected }]}>
              <Text style={[styles.notesTitle, { color: theme.textSecondary }]}>Notes:</Text>
              <Text style={[styles.notesText, { color: theme.text }]}>{client.notes}</Text>
            </View>
          ) : null}
        </Card>

        {/* Action triggers */}
        <Card style={styles.actionsCard}>
          <View style={styles.actionGridRow}>
            <Button
              title="+ Invoice"
              onPress={() => router.push(`/invoice/create?clientId=${clientId}`)}
              style={styles.actionBtn}
              icon={<Receipt size={16} color="#FFF" style={{ marginRight: 6 }} />}
            />
            <Button
              title="+ Estimate"
              onPress={() => router.push(`/estimate/create?clientId=${clientId}`)}
              variant="secondary"
              style={styles.actionBtn}
              icon={<FileText size={16} color={theme.text} style={{ marginRight: 6 }} />}
            />
          </View>
          <TouchableOpacity onPress={handleDelete} style={[styles.deleteLinkBtn, { borderTopColor: theme.border }]}>
            <Trash2 size={14} color="#EF4444" />
            <Text style={styles.deleteLinkText}>Remove Client Record</Text>
          </TouchableOpacity>
        </Card>

        {/* Earnings Card */}
        <Card title="Financial Analytics" style={styles.metricsCard}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Billed</Text>
              <Text style={[styles.metricVal, { color: theme.text }]}>{formatCurrencyVal(totalBilled)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: '#10B981' }]}>Total Paid</Text>
              <Text style={[styles.metricVal, { color: '#10B981' }]}>{formatCurrencyVal(totalPaid)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: '#EF4444' }]}>Outstanding</Text>
              <Text style={[styles.metricVal, { color: '#EF4444' }]}>{formatCurrencyVal(totalOutstanding)}</Text>
            </View>
          </View>
        </Card>

        {/* Invoices History list */}
        <View style={styles.historyHeaderRow}>
          <Text style={[styles.historySectionTitle, { color: theme.text }]}>Billing & Quotes History</Text>
        </View>

        {historyList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FileSpreadsheet size={40} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No invoices or quotes recorded for this client.</Text>
          </Card>
        ) : (
          <View style={styles.historyList}>
            {historyList.map((item) => {
              const num = item.isEstimate ? (item as any).estimateNumber : (item as any).invoiceNumber;
              const status = item.status;
              
              let badgeColor = '#60646C';
              if (status === 'Paid' || status === 'Accepted') badgeColor = '#10B981';
              else if (status === 'Overdue' || status === 'Declined') badgeColor = '#EF4444';
              else if (status === 'Sent') badgeColor = '#208AEF';

              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.isEstimate ? `/estimate/${item.id}` : `/invoice/${item.id}`)}
                  style={styles.historyItemPressable}
                >
                  <Card style={styles.historyItemCard}>
                    <View style={styles.historyItemMain}>
                      <View>
                        <Text style={[styles.histNum, { color: theme.text }]}>{num}</Text>
                        <Text style={[styles.histDate, { color: theme.textSecondary }]}>{formatDateVal(item.createdAt)}</Text>
                      </View>
                      <View style={styles.histRight}>
                        <Text style={[styles.histTotal, { color: theme.text }]}>{formatCurrencyVal(item.total)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${badgeColor}15` }]}>
                          <Text style={[styles.statusText, { color: badgeColor }]}>
                            {item.isEstimate ? `Estimate: ${status}` : status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
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
  },
  backBtn: {
    padding: Spacing.one,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  editHeaderBtn: {
    padding: Spacing.one,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  profileCard: {
    marginVertical: 0,
  },
  clientName: {
    fontSize: 22,
    fontWeight: '900',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.two,
  },
  tagPill: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  contactsBlock: {
    marginTop: Spacing.three,
    gap: 10,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    marginRight: 10,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesBox: {
    marginTop: Spacing.three,
    padding: Spacing.two + 2,
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsCard: {
    marginVertical: 0,
  },
  actionGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  deleteLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  deleteLinkText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsCard: {
    marginVertical: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  historyHeaderRow: {
    marginTop: Spacing.two,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  emptyIcon: {
    marginBottom: Spacing.two,
  },
  emptyText: {
    fontSize: 13,
  },
  historyList: {
    gap: Spacing.one,
  },
  historyItemPressable: {
    alignSelf: 'stretch',
  },
  historyItemCard: {
    padding: Spacing.three,
    marginVertical: 0,
  },
  historyItemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  histNum: {
    fontSize: 14,
    fontWeight: '700',
  },
  histDate: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  histRight: {
    alignItems: 'flex-end',
  },
  histTotal: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

