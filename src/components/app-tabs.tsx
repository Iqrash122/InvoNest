import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors, Spacing } from '@/constants/theme';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react-native';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#208AEF',
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 14,
          left: 16,
          right: 16,
          borderRadius: 20,
          backgroundColor: theme.backgroundElement === '#212225' ? 'rgba(33, 34, 37, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          height: 64,
          paddingBottom: Platform.OS === 'ios' ? 0 : 0,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          borderWidth: 1,
          borderColor: theme.border,
        },
        tabBarItemStyle: {
          height: 52,
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: -2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={focused ? 20 : 18} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Invoices',
          tabBarIcon: ({ color, focused }) => (
            <FileSpreadsheet size={focused ? 20 : 18} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, focused }) => (
            <Users size={focused ? 20 : 18} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <BarChart3 size={focused ? 20 : 18} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={focused ? 20 : 18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

