import React, { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface TabFadeTransitionProps {
  children: React.ReactNode;
}

export function TabFadeTransition({ children }: TabFadeTransitionProps) {
  const isFocused = useIsFocused();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(15); // Subtle slide transition from right

  useEffect(() => {
    if (isFocused) {
      opacity.value = withTiming(1, { duration: 250 });
      translateX.value = withTiming(0, { duration: 250 });
    } else {
      // Instantly reset values when losing focus so they are ready for the next entry
      opacity.value = 0;
      translateX.value = 15;
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
