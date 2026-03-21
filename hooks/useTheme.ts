import { useColorScheme } from 'react-native';
import { colors } from '@/constants/theme';

export const useTheme = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? colors.dark : colors.light;
};
