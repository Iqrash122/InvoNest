import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';

function AppContent() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="business-setup" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="invoice/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="invoice/[id]" />
        <Stack.Screen name="estimate/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="estimate/[id]" />
        <Stack.Screen name="client/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="client/[id]" />
        <Stack.Screen name="product/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="product/index" />
        <Stack.Screen name="payment/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="payment/index" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="templates" />
        <Stack.Screen name="premium" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
