import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData, Estimate, InvoiceItem } from '@/context/DataContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Plus, ArrowLeft, Check, Clipboard } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

const TEMPLATES: ('classic' | 'modern' | 'minimal')[] = ['classic', 'modern', 'minimal'];

export default function CreateEstimate() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id as string;
  const insets = useSafeAreaInsets();

  const { estimates, clients, products, businessProfile, saveEstimate, themeMode } = useData();
  const theme = useTheme();
  const isDark = themeMode === 'dark';

  const [clientId, setClientId] = useState('');
  const [estimateNumber, setEstimateNumber] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('This estimate is valid for 30 days from creation.');
  const [validUntil, setValidUntil] = useState('');
  const [templateId, setTemplateId] = useState<'classic' | 'modern' | 'minimal'>('classic');

  // Selector Modals
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Set defaults
  useEffect(() => {
    if (editId) {
      const est = estimates.find((e) => e.id === editId);
      if (est) {
        /* eslint-disable react-hooks/set-state-in-effect -- Populate estimate values when loading edit details */
        setClientId(est.clientId);
        setEstimateNumber(est.estimateNumber);
        setItems(est.items);
        setDiscount(String(est.discount));
        setNotes(est.notes || '');
        setValidUntil(est.validUntil.split('T')[0]);
        setTemplateId(est.templateId);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } else {
      // Create mode
      const lastEstimate = estimates.reduce((max, est) => {
        const num = parseInt(est.estimateNumber.replace(/[^0-9]/g, ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      setEstimateNumber(`EST-${String(lastEstimate + 1).padStart(4, '0')}`);
      setTemplateId(businessProfile?.defaultTemplate || 'classic');
      
      // Default 30 days valid until
      const future = new Date();
      future.setDate(future.getDate() + 30);
      setValidUntil(future.toISOString().split('T')[0]);
      
      // Add one empty item
      setItems([{ description: '', qty: 1, rate: 0, taxRate: businessProfile?.defaultTaxRate || 0, amount: 0 }]);
    }
  }, [editId, estimates, businessProfile]);

  const getClientName = (id: string) => {
    const cli = clients.find((c) => c.id === id);
    return cli ? cli.name : 'Select Client *';
  };

  const handleAddItemRow = () => {
    setItems([...items, { description: '', qty: 1, rate: 0, taxRate: businessProfile?.defaultTaxRate || 0, amount: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length === 1) {
      Alert.alert('Form Alert', 'An estimate must contain at least one line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[idx] };

    if (field === 'description') {
      item.description = value;
    } else {
      const numVal = parseFloat(value) || 0;
      if (field === 'qty') item.qty = numVal;
      if (field === 'rate') item.rate = numVal;
      if (field === 'taxRate') item.taxRate = numVal;
    }
    
    // Recalculate item amount
    const base = item.qty * item.rate;
    const taxValue = base * (item.taxRate / 100);
    item.amount = base + taxValue;

    updated[idx] = item;
    setItems(updated);
  };

  const openProductSelector = (idx: number) => {
    if (products.length === 0) {
      Alert.alert('Catalog Empty', 'You have no products in your catalog. Navigate to Settings -> Catalog to add items.');
      return;
    }
    setActiveItemIndex(idx);
    setIsProductModalVisible(true);
  };

  const handleSelectProduct = (prod: any) => {
    if (activeItemIndex !== null) {
      handleItemChange(activeItemIndex, 'description', prod.name);
      handleItemChange(activeItemIndex, 'rate', prod.price);
      handleItemChange(activeItemIndex, 'taxRate', prod.taxRate);
    }
    setIsProductModalVisible(false);
    setActiveItemIndex(null);
  };

  // Math totals
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const tax = items.reduce((sum, item) => sum + (item.qty * item.rate * (item.taxRate / 100)), 0);
  const discountVal = parseFloat(discount) || 0;
  const total = Math.max(subtotal + tax - discountVal, 0);

  const handleSave = async () => {
    if (!clientId) {
      Alert.alert('Validation Error', 'Please select a client.');
      return;
    }
    if (!estimateNumber) {
      Alert.alert('Validation Error', 'Estimate Number is required.');
      return;
    }
    if (items.some((i) => !i.description.trim() || i.qty <= 0 || i.rate <= 0)) {
      Alert.alert('Validation Error', 'All items must have a description, positive quantity, and positive unit rate.');
      return;
    }

    try {
      const estData: Omit<Estimate, 'id'> = {
        estimateNumber,
        clientId,
        items,
        subtotal,
        tax,
        discount: discountVal,
        total,
        currency: businessProfile?.currency || 'USD',
        status: editId ? (estimates.find((e) => e.id === editId)?.status || 'Draft') : 'Draft',
        validUntil: new Date(validUntil).toISOString(),
        createdAt: editId ? (estimates.find((e) => e.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        templateId,
        notes
      };

      await saveEstimate({ ...estData, id: editId });
      router.back();
    } catch (err) {
      Alert.alert('Save Error', 'Failed to save the estimate.');
    }
  };

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.appHeader, { paddingTop, paddingBottom: Spacing.four, height: 'auto', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={[styles.appTitle, { color: '#FFF' }]}>{editId ? 'Edit Estimate' : 'Create Estimate'}</ThemedText>
        <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Client Picker */}
        <Card style={styles.cardSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Client Information</Text>
          <TouchableOpacity 
            style={[styles.clientPicker, { backgroundColor: theme.background, borderColor: theme.border }]} 
            onPress={() => setIsClientModalVisible(true)}
          >
            <Text style={[styles.clientPickerText, { color: clientId ? theme.text : theme.textSecondary }]}>
              {getClientName(clientId)}
            </Text>
            <Plus size={18} color="#208AEF" />
          </TouchableOpacity>
        </Card>

        {/* Metadata */}
        <Card style={styles.cardSection}>
          <Input
            label="Estimate Number *"
            placeholder="EST-0001"
            value={estimateNumber}
            onChangeText={setEstimateNumber}
          />

          <Input
            label="Valid Until (YYYY-MM-DD) *"
            placeholder="2026-07-30"
            value={validUntil}
            onChangeText={setValidUntil}
          />
        </Card>

        {/* Line Items */}
        <Card style={styles.cardSection}>
          <View style={styles.itemsHeaderRow}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Line Items</Text>
            <TouchableOpacity onPress={handleAddItemRow} style={styles.addBtnRow}>
              <Plus size={14} color="#208AEF" />
              <Text style={styles.addBtnText}>Add Row</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, idx) => (
            <View key={idx} style={[styles.itemRowWrapper, { borderBottomColor: theme.border }]}>
              <View style={styles.itemRowHeader}>
                <Text style={[styles.rowNumberText, { color: theme.textSecondary }]}>Item #{idx + 1}</Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity 
                    onPress={() => openProductSelector(idx)} 
                    style={[styles.catalogBtn, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F3E8FF' }]}
                  >
                    <Clipboard size={14} color="#8B5CF6" />
                    <Text style={styles.catalogBtnText}>Catalog</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveItemRow(idx)}>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <Input
                placeholder="Quote item description"
                value={item.description}
                onChangeText={(val) => handleItemChange(idx, 'description', val)}
                containerStyle={{ marginBottom: Spacing.two }}
              />

              <View style={styles.itemInputsGrid}>
                <Input
                  label="Qty"
                  value={String(item.qty || '')}
                  onChangeText={(val) => handleItemChange(idx, 'qty', val)}
                  keyboardType="numeric"
                  containerStyle={styles.gridInput}
                />
                <Input
                  label="Rate"
                  value={String(item.rate || '')}
                  onChangeText={(val) => handleItemChange(idx, 'rate', val)}
                  keyboardType="numeric"
                  containerStyle={styles.gridInput}
                />
                <Input
                  label="Tax (%)"
                  value={String(item.taxRate || '')}
                  onChangeText={(val) => handleItemChange(idx, 'taxRate', val)}
                  keyboardType="numeric"
                  containerStyle={styles.gridInput}
                />
              </View>
            </View>
          ))}
        </Card>

        {/* Templates styles */}
        <Card style={styles.cardSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PDF Template Style</Text>
          <View style={styles.templateRow}>
            {TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl}
                onPress={() => setTemplateId(tpl)}
                style={[
                  styles.templateTab,
                  { 
                    backgroundColor: templateId === tpl ? (isDark ? 'rgba(32, 138, 239, 0.15)' : '#E6F4FE') : theme.background,
                    borderColor: templateId === tpl ? '#208AEF' : 'transparent',
                    borderWidth: 1.5,
                  }
                ]}
              >
                <Text style={[styles.templateTabText, { color: theme.text }]}>{tpl}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Calculations */}
        <Card style={styles.cardSection}>
          <Input
            label="Flat Discount Offset ($)"
            value={discount}
            onChangeText={setDiscount}
            keyboardType="numeric"
          />

          <Input
            label="Notes & Terms"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={styles.notesArea}
          />

          <View style={[styles.totalsArea, { borderTopColor: theme.border }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Subtotal:</Text>
              <Text style={[styles.totalVal, { color: theme.text }]}>{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Tax:</Text>
              <Text style={[styles.totalVal, { color: theme.text }]}>{tax.toFixed(2)}</Text>
            </View>
            {discountVal > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#10B981' }]}>Discount:</Text>
                <Text style={[styles.totalVal, { color: '#10B981' }]}>-{discountVal.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow, { borderTopColor: theme.border }]}>
              <Text style={[styles.grandTotalLabel, { color: theme.text }]}>Estimate Total:</Text>
              <Text style={styles.grandTotalVal}>{total.toFixed(2)}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* CLIENT PICKER */}
      <Modal visible={isClientModalVisible} onClose={() => setIsClientModalVisible(false)} title="Select Client">
        {clients.length === 0 ? (
          <View style={styles.emptySelector}>
            <Text style={[styles.emptySelectorText, { color: theme.textSecondary }]}>No client records found.</Text>
            <Button title="+ Create Client" onPress={() => { setIsClientModalVisible(false); router.push('/client/create'); }} />
          </View>
        ) : (
          <View style={styles.modalList}>
            {clients.map((c) => (
              <TouchableOpacity 
                key={c.id} 
                style={[styles.modalItem, { backgroundColor: theme.background }, clientId === c.id && [styles.modalItemSelected, { backgroundColor: theme.backgroundSelected }]]}
                onPress={() => { setClientId(c.id); setIsClientModalVisible(false); }}
              >
                <Text style={[styles.modalItemText, { color: theme.text }]}>{c.name}</Text>
                {clientId === c.id && <Check size={18} color="#208AEF" />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Modal>

      {/* PRODUCT PICKER */}
      <Modal visible={isProductModalVisible} onClose={() => setIsProductModalVisible(false)} title="Select Product/Service">
        <View style={styles.modalList}>
          {products.map((p) => (
            <TouchableOpacity 
              key={p.id} 
              style={[styles.modalItem, { backgroundColor: theme.background }]}
              onPress={() => handleSelectProduct(p)}
            >
              <View>
                <Text style={[styles.modalItemText, { color: theme.text }]}>{p.name}</Text>
                <Text style={[styles.modalItemSub, { color: theme.textSecondary }]}>Price: ${p.price} • Tax: {p.taxRate}%</Text>
              </View>
              <ChevronRightIcon size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </ThemedView>
  );
}

// Simple icon placeholder
function ChevronRightIcon({ size, color }: any) {
  return <Text style={{ color, fontSize: size, fontWeight: 'bold' }}>&gt;</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  saveHeaderBtn: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    backgroundColor: '#E6F4FE',
  },
  saveHeaderText: {
    color: '#208AEF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  cardSection: {
    marginVertical: 0,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: Spacing.two,
  },
  clientPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  clientPickerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  addBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    color: '#208AEF',
    fontSize: 13,
    fontWeight: '700',
  },
  itemRowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: Spacing.three,
    marginBottom: Spacing.three,
  },
  itemRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  rowNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  catalogBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  itemInputsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridInput: {
    flex: 1,
    marginBottom: 0,
  },
  templateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  templateTab: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    alignItems: 'center',
  },
  templateTabText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#374151',
  },
  notesArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  totalsArea: {
    marginTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: Spacing.three,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  totalVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  grandTotalRow: {
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
  emptySelector: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  emptySelectorText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
  },
  modalList: {
    gap: 4,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  modalItemSelected: {
    backgroundColor: '#E6F4FE',
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalItemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
