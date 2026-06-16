import { useColorScheme as useRNColorScheme } from 'react-native';
import { useData } from '@/context/DataContext';

export function useColorScheme() {
  const systemScheme = useRNColorScheme();
  try {
    const data = useData();
    if (data && data.themeMode) {
      return data.themeMode === 'system' ? systemScheme : data.themeMode;
    }
  } catch (e) {
    // Fallback if called outside DataProvider context
  }
  return systemScheme;
}
