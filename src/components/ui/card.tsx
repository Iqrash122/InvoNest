import React from 'react';
import { StyleSheet, View, Text, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ title, children, style }: CardProps) {
  const theme = useTheme();

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.backgroundElement, 
        borderColor: theme.border,
      }, 
      style
    ]}>
      {title && (
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.four,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.four,
  },
});