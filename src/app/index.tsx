import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { AnimatedIcon } from '@/components/animated-icon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Spacing } from '@/constants/theme';
import { Lock } from 'lucide-react-native';

export default function Index() {
  const router = useRouter();
  const { user, isLoading: authLoading, isBiometricEnabled, triggerBiometricUnlock } = useAuth();
  const { businessProfile, isLoading: dataLoading } = useData();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingNavigation, setCheckingNavigation] = useState(true);

  // Authenticate user if biometric lock is active, then proceed
  useEffect(() => {
    if (authLoading || dataLoading) return;

    async function checkAuthAndNavigate() {
      try {
        if (!user) {
          // Check if onboarding is completed
          const onboarded = await AsyncStorage.getItem('@invonest_onboarded');
          if (onboarded === 'true') {
            router.replace('/(auth)/login');
          } else {
            router.replace('/(auth)/onboarding');
          }
          return;
        }

        // User is logged in
        if (isBiometricEnabled && !isUnlocked) {
          const success = await triggerBiometricUnlock();
          if (success) {
            setIsUnlocked(true);
          } else {
            setCheckingNavigation(false);
            return; // Stay on splash screen with unlock button
          }
        } else {
          setIsUnlocked(true);
        }

        // Navigate immediately since DataContext has finished loading states
        if (businessProfile && businessProfile.name && businessProfile.name !== 'My Business') {
          router.replace('/(tabs)/dashboard');
        } else {
          router.replace('/business-setup');
        }
      } catch (err) {
        console.error('Error during index navigation logic:', err);
      }
    }

    checkAuthAndNavigate();
  }, [user, authLoading, dataLoading, isUnlocked, isBiometricEnabled, businessProfile]);

  const handleManualUnlock = async () => {
    const success = await triggerBiometricUnlock();
    if (success) {
      setIsUnlocked(true);
    }
  };

  if (authLoading || dataLoading || (user && isBiometricEnabled && !isUnlocked && checkingNavigation)) {
    return (
      <ThemedView style={styles.container}>
        <AnimatedIcon />
        <ActivityIndicator size="large" color="#208AEF" style={styles.loader} />
      </ThemedView>
    );
  }

  // Show "App is Locked" screen with unlock action if biometrics prompt was canceled
  if (user && isBiometricEnabled && !isUnlocked) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.lockIconContainer}>
          <Lock size={64} color="#208AEF" />
        </View>
        <ThemedText type="subtitle" style={styles.title}>InvoNest is Locked</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          Authenticate to access your invoices and clients.
        </ThemedText>
        <Button 
          title="Unlock with Biometrics" 
          onPress={handleManualUnlock}
          style={styles.unlockButton}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AnimatedIcon />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  loader: {
    marginTop: Spacing.four,
  },
  lockIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  unlockButton: {
    width: '80%',
  },
});
