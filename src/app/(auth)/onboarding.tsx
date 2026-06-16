import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Receipt, Users, CloudLightning, ShieldCheck } from 'lucide-react-native';

const SLIDES = [
  {
    title: 'Professional Invoicing',
    description: 'Create and send elegant PDF invoices, estimates, and payment receipts in seconds.',
    icon: Receipt,
    color: '#208AEF',
  },
  {
    title: 'Client Relationships',
    description: 'Keep track of client details, notes, tag VIP clients, and check their invoice histories.',
    icon: Users,
    color: '#8B5CF6',
  },
  {
    title: 'Offline-First Storage',
    description: 'Create invoices anywhere without signal. InvoNest caches everything and syncs when online.',
    icon: CloudLightning,
    color: '#10B981',
  },
  {
    title: 'Biometric Security',
    description: 'Keep your financial logs secure with on-device Face ID/Fingerprint app locks.',
    icon: ShieldCheck,
    color: '#F59E0B',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = async () => {
    if (activeIndex < SLIDES.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      await AsyncStorage.setItem('@invonest_onboarded', 'true');
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('@invonest_onboarded', 'true');
    router.replace('/(auth)/login');
  };

  const currentSlide = SLIDES[activeIndex];
  const SlideIcon = currentSlide.icon;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <ThemedText style={styles.skipText} themeColor="textSecondary">Skip</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.slideContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${currentSlide.color}15` }]}>
          <SlideIcon size={72} color={currentSlide.color} />
        </View>

        <ThemedText type="subtitle" style={styles.title}>
          {currentSlide.title}
        </ThemedText>
        
        <ThemedText style={styles.description} themeColor="textSecondary">
          {currentSlide.description}
        </ThemedText>
      </View>

      <View style={styles.footer}>
        {/* Bullet indicators */}
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.indicator,
                { 
                  backgroundColor: idx === activeIndex ? currentSlide.color : '#D1D5DB',
                  width: idx === activeIndex ? 20 : 8 
                }
              ]}
            />
          ))}
        </View>

        <Button
          title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: currentSlide.color }]}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'space-between',
  },
  header: {
    height: 40,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: Spacing.one,
  },
  skipText: {
    fontWeight: '600',
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.five,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.four,
    marginBottom: Spacing.three,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
  },
});
