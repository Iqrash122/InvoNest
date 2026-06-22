import { useWindowDimensions } from 'react-native';

/** Design baseline width (standard phone, e.g. iPhone 14) */
const BASE_WIDTH = 390;

/**
 * Returns helpers to build responsive sizes that scale proportionally
 * to the device screen width.
 *
 * - `scale(size)` — linear scale relative to BASE_WIDTH
 * - `moderateScale(size, factor?)` — softer scale; won't shrink/grow as aggressively
 * - `isSmallDevice` — true if width < 360 (e.g. iPhone SE, small Android)
 * - `width` / `height` — raw screen dimensions
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const ratio = width / BASE_WIDTH;

  const scale = (size: number) => Math.round(size * ratio);

  const moderateScale = (size: number, factor = 0.5) =>
    Math.round(size + (scale(size) - size) * factor);

  const isSmallDevice = width < 360;

  return { scale, moderateScale, isSmallDevice, width, height };
}
