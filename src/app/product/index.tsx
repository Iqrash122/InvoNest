import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '@/context/DataContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Plus, PackageOpen, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

export default function ProductIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { products, deleteProduct, businessProfile } = useData();

  const activeCurrency = businessProfile?.currency || 'USD';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: activeCurrency }).format(price);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Item', `Are you sure you want to delete "${name}" from the catalog?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(id);
        } 
      }
    ]);
  };

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.appHeader, { paddingTop, paddingBottom: Spacing.four, height: 'auto', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={[styles.appTitle, { color: '#FFF' }]}>Product Catalog</ThemedText>
        <TouchableOpacity onPress={() => router.push('/product/create')} style={styles.addHeaderBtn}>
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Main List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {products.length === 0 ? (
          <Card style={styles.emptyCard}>
            <PackageOpen size={48} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Catalog is Empty</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Add products or services here to quickly import them when compiling invoices.</Text>
            <Button
              title="+ Add Item"
              onPress={() => router.push('/product/create')}
              size="small"
              style={styles.emptyBtn}
            />
          </Card>
        ) : (
          products.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/product/create?id=${item.id}`)}
              style={styles.itemWrapper}
            >
              <Card style={styles.itemCard}>
                <View style={styles.cardContent}>
                  <View style={styles.detailsCol}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                      Tax Rate: {item.taxRate}% {item.unit ? `• Unit: ${item.unit}` : ''}
                    </Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={[styles.itemPrice, { color: theme.text }]}>{formatPrice(item.price)}</Text>
                    <TouchableOpacity 
                      onPress={() => handleDelete(item.id, item.name)} 
                      style={styles.deleteBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/product/create')}
        style={styles.fab}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  },
  backBtn: {
    padding: Spacing.one,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  addHeaderBtn: {
    padding: Spacing.one,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  itemWrapper: {
    alignSelf: 'stretch',
  },
  itemCard: {
    padding: Spacing.three,
    marginVertical: 0,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
    marginRight: Spacing.two,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  deleteBtn: {
    padding: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  emptyIcon: {
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: Spacing.one,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  emptyBtn: {
    marginTop: Spacing.four,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
