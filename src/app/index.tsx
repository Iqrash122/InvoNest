import React, { useEffect, useRef, useState } from 'react';
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
  const { isLoading: dataLoading } = useData();

  // Tracks whether biometrics passed so we can show the locked screen
  const [biometricPassed, setBiometricPassed] = useState<boolean | null>(null);

  // Guard: ensures router.replace is called exactly once per mount
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (authLoading || dataLoading) return;
    // Prevent any re-runs (e.g. from context updates) after first navigation
    if (hasNavigated.current) return;

    async function run() {
      // Claim the slot immediately — before any await — to block concurrent runs
      hasNavigated.current = true;

      try {
        // ── Not logged in ──────────────────────────────────────────
        if (!user) {
          const onboarded = await AsyncStorage.getItem('@invonest_onboarded');
          if (onboarded === 'true') {
            router.replace('/(auth)/login');
          } else {
            router.replace('/(auth)/onboarding');
          }
          return;
        }

        // ── Logged in: check biometrics ────────────────────────────
        if (isBiometricEnabled) {
          const success = await triggerBiometricUnlock();
          if (!success) {
            // Release the guard so the manual-unlock button can re-trigger
            hasNavigated.current = false;
            setBiometricPassed(false);
            return;
          }
        }

        // ── Navigate to correct screen ─────────────────────────────
        const setupDone = await AsyncStorage.getItem(`@invonest_setup_completed_${user.uid}`);
        if (setupDone === 'true') {
          router.replace('/(tabs)/dashboard');
        } else {
          router.replace('/business-setup');
        }
      } catch (err) {
        console.error('Index navigation error:', err);
        // Release guard so user isn't stuck on a blank screen
        hasNavigated.current = false;
      }
    }

    run();
  // Intentionally omit biometricPassed — we manage re-entry via hasNavigated ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, dataLoading, isBiometricEnabled]);

  // ── Manual biometric unlock ──────────────────────────────────────
  const handleManualUnlock = async () => {
    const success = await triggerBiometricUnlock();
    if (success) {
      setBiometricPassed(true);
      hasNavigated.current = false; // allow the effect to re-run and navigate
    }
  };

  // biometricPassed=true means the manual unlock succeeded — re-run the effect
  useEffect(() => {
    if (biometricPassed === true) {
      setBiometricPassed(null); // reset flag
      // hasNavigated was reset to false in handleManualUnlock, so the main
      // effect will fire on next render and navigate correctly
    }
  }, [biometricPassed]);

  // ── Loading splash ───────────────────────────────────────────────
  if (authLoading || dataLoading) {
    return (
      <ThemedView style={styles.container}>
        <AnimatedIcon />
        <ActivityIndicator size="large" color="#208AEF" style={styles.loader} />
      </ThemedView>
    );
  }

  // ── Biometric lock screen ────────────────────────────────────────
  if (user && isBiometricEnabled && biometricPassed === false) {
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

  // ── Splash while navigation is being decided ──────────────────────
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
