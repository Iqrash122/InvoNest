import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  StyleProp, 
  ViewStyle, 
  TextStyle,
  View
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const theme = useTheme();

  const getStyles = () => {
    let bg = '#208AEF'; // Default blue accent
    let border = 'transparent';
    let textCol = '#FFFFFF';

    if (variant === 'secondary') {
      bg = theme.backgroundElement;
      textCol = theme.text;
    } else if (variant === 'danger') {
      bg = '#EF4444';
      textCol = '#FFFFFF';
    } else if (variant === 'outline') {
      bg = 'transparent';
      border = theme.border;
      textCol = theme.text;
    }

    if (disabled) {
      bg = theme.backgroundSelected;
      textCol = theme.textSecondary;
      border = 'transparent';
    }

    return { bg, border, textCol };
  };

  const { bg, border, textCol } = getStyles();

  const sizePadding = {
    small: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, borderRadius: 8 },
    medium: { paddingVertical: Spacing.two + 2, paddingHorizontal: Spacing.four, borderRadius: 12 },
    large: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.five, borderRadius: 16 },
  }[size];

  const sizeText = {
    small: { fontSize: 13, fontWeight: '600' as const },
    medium: { fontSize: 15, fontWeight: '600' as const },
    large: { fontSize: 17, fontWeight: 'bold' as const },
  }[size];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border !== 'transparent' ? 1 : 0,
        },
        sizePadding,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textCol} />
      ) : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: textCol }, sizeText, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.two,
  },
  text: {
    textAlign: 'center',
  },
});