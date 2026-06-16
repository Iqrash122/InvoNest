import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TextInput,
  StyleProp,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  containerStyle,
  placeholderTextColor,
  style,
  value,
  onFocus,
  onBlur,
  placeholder,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Animated value: 0 = resting (inside), 1 = floated (on border)
  const animVal = useRef(new Animated.Value(value ? 1 : 0)).current;

  const hasValue = !!(value && value.length > 0);
  const shouldFloat = isFocused || hasValue;

  const animateLabel = (toValue: number) => {
    Animated.timing(animVal, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  React.useEffect(() => {
    animateLabel(shouldFloat ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFloat]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    animateLabel(1);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!hasValue) animateLabel(0);
    onBlur?.(e);
  };

  // Floating label interpolations
  const labelTop = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [13, -10],
  });
  const labelFontSize = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 12],
  });
  const labelColor = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.textSecondary, isFocused ? '#208AEF' : theme.textSecondary],
  });

  const activeBorderColor = error ? '#EF4444' : isFocused ? '#208AEF' : theme.border;
  const activeBorderWidth = isFocused ? 2 : 1;

  // If label is provided, we use the floating label style; otherwise classic
  if (label) {
    return (
      <View style={[styles.container, containerStyle]}>
        <View
          style={[
            styles.floatingInputContainer,
            {
              borderColor: activeBorderColor,
              borderWidth: activeBorderWidth,
              backgroundColor: theme.background,
              opacity: disabled ? 0.6 : 1,
              height: props.multiline ? undefined : 52,
              paddingVertical: props.multiline ? 18 : 0,
            },
          ]}
        >
          {/* Label floating over border */}
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: labelColor,
                backgroundColor: theme.background,
                // Hide the label bg gap in border only when floated
                paddingHorizontal: shouldFloat ? 4 : 0,
                left: icon ? 42 : 14,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Animated.Text>

          {icon && <View style={styles.iconContainer}>{icon}</View>}

          <TextInput
            editable={!disabled}
            placeholderTextColor="transparent"
            placeholder=""
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.floatingInput,
              {
                color: theme.text,
                paddingLeft: icon ? 0 : 14,
              },
              style,
            ]}
            {...props}
          />

          {rightIcon && (
            <View style={styles.rightIconContainer}>
              {onRightIconPress ? (
                <TouchableOpacity onPress={onRightIconPress}>{rightIcon}</TouchableOpacity>
              ) : (
                rightIcon
              )}
            </View>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  // No label — classic inline style (used in item grids etc.)
  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundSelected,
            borderColor: error ? '#EF4444' : isFocused ? '#208AEF' : theme.border,
            borderWidth: isFocused ? 2 : 1,
            opacity: disabled ? 0.6 : 1,
            height: props.multiline ? undefined : 50,
            paddingVertical: props.multiline ? Spacing.two : 0,
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          editable={!disabled}
          placeholderTextColor={placeholderTextColor || theme.textSecondary}
          placeholder={placeholder}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, { color: theme.text }, style]}
          {...props}
        />
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {onRightIconPress ? (
              <TouchableOpacity onPress={onRightIconPress}>{rightIcon}</TouchableOpacity>
            ) : (
              rightIcon
            )}
          </View>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.four,
    alignSelf: 'stretch',
  },
  // Floating label variant
  floatingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    position: 'relative',
    minHeight: 52,
  },
  floatingLabel: {
    position: 'absolute',
    fontWeight: '500',
    zIndex: 10,
  },
  floatingInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingTop: 4,
  },
  // Classic variant
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 50,
  },
  iconContainer: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  rightIconContainer: {
    marginLeft: Spacing.two,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: Spacing.one,
    fontWeight: '500',
  },
});