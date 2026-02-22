import React from 'react';
import { Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', style, textStyle }) => {
  const { theme } = useTheme();

  const backgroundColor = (() => {
    switch (variant) {
      case 'success':
        return theme.colors.successLight;
      case 'warning':
        return theme.colors.warningLight;
      case 'error':
        return theme.colors.errorLight;
      case 'neutral':
        return theme.colors.backgroundTertiary;
      default:
        return theme.colors.primaryLight;
    }
  })();

  const textColor = (() => {
    switch (variant) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      case 'neutral':
        return theme.colors.text;
      default:
        return theme.colors.primary;
    }
  })();

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <Text style={[styles.text, { color: textColor }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
