import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '@/context/DataContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react-native';


export default function TemplatesGallery() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { businessProfile, saveBusinessProfile } = useData();

  const currentDefault = businessProfile?.defaultTemplate || 'classic';

  const handleSetDefault = async (templateId: 'classic' | 'modern' | 'minimal') => {
    if (!businessProfile) return;
    try {
      await saveBusinessProfile({
        ...businessProfile,
        defaultTemplate: templateId,
      });
      Alert.alert('Default Template Set', `"${templateId.toUpperCase()}" template is now configured as your default layout for new invoices.`);
    } catch (err) {
      Alert.alert('Error', 'Failed to update default template.');
    }
  };

  const paddingTop = Platform.select({
    android: Math.max(insets.top + Spacing.two, 45),
    ios: Math.max(insets.top, 40),
    default: Spacing.four,
  });

  return (
    <ThemedView style={styles.container}>
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
        <ThemedText style={[styles.appTitle, { color: '#FFF' }]}>Templates Gallery</ThemedText>
        <View style={{ width: 20 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Choose a default invoice template layout style. You can still override this selection on individual invoices.
        </Text>

        {LAYOUTS.map((tpl) => {
          const isDefault = currentDefault === tpl.id;
          return (
            <Card key={tpl.id} style={styles.tplCard}>
              <View style={styles.cardHeader}>
                <View style={styles.titleCol}>
                  <Text style={styles.tplName}>{tpl.name}</Text>
                  <Text style={styles.tplDesc}>{tpl.desc}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => handleSetDefault(tpl.id)}
                  style={styles.defaultCheckbox}
                >
                  {isDefault ? (
                    <CheckCircle2 size={24} color="#208AEF" />
                  ) : (
                    <Circle size={24} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Layout Graphic Preview */}
              {tpl.preview}

              <Button
                title={isDefault ? 'Default Template Active' : 'Set as Default'}
                onPress={() => handleSetDefault(tpl.id)}
                variant={isDefault ? 'primary' : 'outline'}
                style={styles.selectBtn}
                disabled={isDefault}
              />
            </Card>
          );
        })}
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
  },
  backBtn: {
    padding: Spacing.one,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  subtitle: {
    fontSize: 14,
    color: '#60646C',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: Spacing.one,
  },
  tplCard: {
    padding: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  titleCol: {
    flex: 1,
    marginRight: Spacing.two,
  },
  tplName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  tplDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  defaultCheckbox: {
    padding: 2,
  },
  selectBtn: {
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
  tplPreviewBox: {
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: Spacing.two,
    gap: 8,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  // Classic Preview Styles
  classicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classicLogo: {
    width: 30,
    height: 12,
    backgroundColor: '#9CA3AF',
    borderRadius: 2,
  },
  classicTitle: {
    width: 25,
    height: 12,
    backgroundColor: '#475569',
    borderRadius: 2,
  },
  classicDetails: {
    width: '40%',
    height: 10,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  classicTable: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  classicTotals: {
    width: 40,
    height: 12,
    backgroundColor: '#475569',
    alignSelf: 'flex-end',
    borderRadius: 2,
  },
  // Modern Preview Styles
  modernColorbar: {
    height: 4,
    backgroundColor: '#208AEF',
    marginHorizontal: -Spacing.two,
    marginTop: -Spacing.two,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  modernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  modernLogo: {
    width: 20,
    height: 10,
    backgroundColor: '#208AEF',
    borderRadius: 2,
  },
  modernStatus: {
    width: 30,
    height: 10,
    backgroundColor: '#E6F4FE',
    borderRadius: 2,
  },
  modernDetails: {
    width: '30%',
    height: 8,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  modernTable: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  modernTotals: {
    width: 35,
    height: 10,
    backgroundColor: '#208AEF',
    alignSelf: 'flex-end',
    borderRadius: 2,
  },
  // Minimal Preview Styles
  minimalHeader: {
    width: 35,
    height: 12,
    backgroundColor: '#111827',
    borderRadius: 2,
  },
  minimalDetails: {
    width: '20%',
    height: 8,
    backgroundColor: '#9CA3AF',
    borderRadius: 2,
  },
  minimalTable: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  minimalTotals: {
    width: 30,
    height: 10,
    backgroundColor: '#111827',
    alignSelf: 'flex-end',
    borderRadius: 2,
  },
});

const LAYOUTS = [
  {
    id: 'classic' as const,
    name: 'Classic Layout',
    desc: 'Traditional business layout. Perfect for standard B2B billing with bold headers, solid tables, and detailed currency totals.',
    color: '#475569',
    preview: (
      <View style={styles.tplPreviewBox}>
        {/* Simple layout blocks representing Classic */}
        <View style={styles.classicHeader}>
          <View style={styles.classicLogo} />
          <View style={styles.classicTitle} />
        </View>
        <View style={styles.dividerLine} />
        <View style={styles.classicDetails} />
        <View style={styles.classicTable} />
        <View style={styles.classicTotals} />
      </View>
    ),
  },
  {
    id: 'modern' as const,
    name: 'Modern Colorbar',
    desc: 'Features a vibrant top gradient bar and clean status badges. Looks great for digital agencies and creative freelancers.',
    color: '#208AEF',
    preview: (
      <View style={styles.tplPreviewBox}>
        {/* Simple layout blocks representing Modern */}
        <View style={styles.modernColorbar} />
        <View style={styles.modernHeader}>
          <View style={styles.modernLogo} />
          <View style={styles.modernStatus} />
        </View>
        <View style={styles.modernDetails} />
        <View style={styles.modernTable} />
        <View style={styles.modernTotals} />
      </View>
    ),
  },
  {
    id: 'minimal' as const,
    name: 'Minimalist Line',
    desc: 'Editorial design focusing on typography, whitespace, and clean single-line divider borders. Sleek and high-end.',
    color: '#0F172A',
    preview: (
      <View style={styles.tplPreviewBox}>
        {/* Simple layout blocks representing Minimal */}
        <View style={styles.minimalHeader} />
        <View style={styles.dividerLine} />
        <View style={styles.minimalDetails} />
        <View style={styles.minimalTable} />
        <View style={styles.minimalTotals} />
      </View>
    ),
  },
];
