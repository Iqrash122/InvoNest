import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  Cpu, 
  Eye, 
  BadgeAlert, 
  Mic, 
  Camera, 
  Languages 
} from 'lucide-react-native';

const FEATURES = [
  { icon: Mic, label: 'Voice-to-Invoice AI', desc: 'Describe work naturally; AI fills fields.' },
  { icon: Camera, label: 'Snap-to-Invoice OCR', desc: 'Scan bills/notes to extract items.' },
  { icon: BadgeAlert, label: 'Late Payment Predictor', desc: 'Calculates payment likelihood scores.' },
  { icon: Sparkles, label: 'Unlimited invoices & clients', desc: 'No monthly billing caps.' },
  { icon: Eye, label: 'Template overrides & signatures', desc: 'Custom invoice layout styles.' },
  { icon: Languages, label: 'Multi-lingual invoice exports', desc: 'Translates invoice text dynamically.' },
];

export default function PremiumUpgrade() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleSubscribe = async () => {
    setIsPurchasing(true);
    // Simulate payment transaction
    setTimeout(async () => {
      try {
        await AsyncStorage.setItem('@invonest_premium_subscribed', 'true');
        setIsPurchasing(false);
        Alert.alert(
          'Purchase Successful', 
          'Welcome to InvoNest Premium! All AI capabilities and templates are now unlocked.',
          [{ text: 'Great!', onPress: () => router.back() }]
        );
      } catch (err) {
        setIsPurchasing(false);
      }
    }, 2000);
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
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText style={[styles.appTitle, { color: '#FFFFFF' }]}>InvoNest Premium</ThemedText>
        <View style={{ width: 20 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Top Hero Banner */}
        <View style={styles.heroRow}>
          <View style={styles.heroIconBox}>
            <Sparkles size={40} color="#F59E0B" />
          </View>
          <Text style={styles.heroTitle}>Upgrade to Premium</Text>
          <Text style={styles.heroSub}>Supercharge your billing with AI & custom branding</Text>
        </View>

        {/* Feature List Grid */}
        <Card title="Unlocked Premium Features" style={styles.featuresCard}>
          <View style={styles.featuresList}>
            {FEATURES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <View key={idx} style={styles.featureItemRow}>
                  <View style={styles.featureIconContainer}>
                    <Icon size={18} color="#208AEF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureLabel}>{item.label}</Text>
                    <Text style={styles.featureDesc}>{item.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Plans Selection Options */}
        <Text style={styles.planTitle}>Choose Your Plan</Text>
        
        <View style={styles.plansContainer}>
          <TouchableOpacity 
            onPress={() => setSelectedPlan('monthly')}
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected
            ]}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Monthly Plan</Text>
              <View style={[styles.radioCircle, selectedPlan === 'monthly' && styles.radioCircleActive]} />
            </View>
            <Text style={styles.planPrice}>$9.99<Text style={styles.planDuration}>/mo</Text></Text>
            <Text style={styles.planTerms}>Billed monthly, cancel anytime.</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setSelectedPlan('yearly')}
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.planCardSelected
            ]}
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Best Value (Save 25%)</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Yearly Plan</Text>
              <View style={[styles.radioCircle, selectedPlan === 'yearly' && styles.radioCircleActive]} />
            </View>
            <Text style={styles.planPrice}>$89.99<Text style={styles.planDuration}>/yr</Text></Text>
            <Text style={styles.planTerms}>Equivalent to $7.50/month. Billed annually.</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <Button
          title={isPurchasing ? 'Processing Transaction...' : 'Subscribe Now'}
          onPress={handleSubscribe}
          loading={isPurchasing}
          style={styles.subscribeBtn}
          icon={!isPurchasing && <Check size={18} color="#FFF" style={{ marginRight: 6 }} />}
        />

        <Text style={styles.guaranteeText}>30-Day Money Back Guarantee. Secured Checkout.</Text>

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
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  heroRow: {
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  heroSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: Spacing.four,
    fontWeight: '500',
  },
  featuresCard: {
    marginBottom: Spacing.four,
  },
  featuresList: {
    gap: 16,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  featureDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
    marginBottom: Spacing.three,
  },
  plansContainer: {
    gap: 12,
    marginBottom: Spacing.five,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: Spacing.three,
    alignSelf: 'stretch',
  },
  planCardSelected: {
    borderColor: '#208AEF',
    backgroundColor: '#F9FAFB',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
  },
  planBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  radioCircleActive: {
    borderColor: '#208AEF',
    backgroundColor: '#208AEF',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  planDuration: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  planTerms: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: Spacing.one,
    fontWeight: '500',
  },
  subscribeBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#F59E0B',
  },
  guaranteeText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: Spacing.three,
    fontWeight: '600',
  },
});
