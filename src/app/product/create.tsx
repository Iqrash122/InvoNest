import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData, Product } from '@/context/DataContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

export default function CreateProduct() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id as string;
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { products, saveProduct, businessProfile } = useData();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [taxRate, setTaxRate] = useState(String(businessProfile?.defaultTaxRate || '0'));
  const [unit, setUnit] = useState('pcs');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      const prod = products.find((p) => p.id === editId);
      if (prod) {
        /* eslint-disable react-hooks/set-state-in-effect -- Initialize catalog item form state fields from loaded context */
        setName(prod.name);
        setPrice(String(prod.price));
        setTaxRate(String(prod.taxRate));
        setUnit(prod.unit || 'pcs');
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    }
  }, [editId, products]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Item Name is required.');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a positive price.');
      return;
    }

    setIsLoading(true);
    try {
      const productData: Omit<Product, 'id'> = {
        name: name.trim(),
        price: parseFloat(price) || 0,
        taxRate: parseFloat(taxRate) || 0,
        unit: unit.trim() || undefined
      };

      await saveProduct({ ...productData, id: editId });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to save product details.');
    } finally {
      setIsLoading(false);
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
        <ThemedText style={[styles.appTitle, { color: '#FFF' }]}>{editId ? 'Edit Catalog Item' : 'Add Catalog Item'}</ThemedText>
        <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn} disabled={isLoading}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.cardSection}>
          <Input
            label="Item Name / Service Label *"
            placeholder="Graphic Design Consultancy"
            value={name}
            onChangeText={setName}
            disabled={isLoading}
          />

          <Input
            label={`Default Unit Price (${businessProfile?.currency || 'USD'}) *`}
            placeholder="150.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            disabled={isLoading}
          />

          <Input
            label="Default Tax Rate (%)"
            placeholder="15"
            value={taxRate}
            onChangeText={setTaxRate}
            keyboardType="numeric"
            disabled={isLoading}
          />

          <Input
            label="Billing Unit (e.g. hr, pcs, day)"
            placeholder="hr"
            value={unit}
            onChangeText={setUnit}
            disabled={isLoading}
          />
        </Card>

        <Button
          title="Save Catalog Item"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveBtn}
          icon={<Save size={18} color="#FFF" style={{ marginRight: 6 }} />}
        />
      </ScrollView>
    </ThemedView>
  );
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveHeaderText: {
    color: '#FFFFFF',
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
  saveBtn: {
    marginTop: Spacing.two,
  },
});
