import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
  variant?: 'default' | 'secondary';
  border?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padded = true,
  elevation = 'none',
  elevated = false,
  variant = 'default',
  border = true,
}) => {
  const { theme } = useTheme();

  const activeElevation = elevation !== 'none' ? elevation : (elevated ? 'md' : 'none');

  const shadowStyle = (() => {
    switch (activeElevation) {
      case 'sm': return theme.shadow.sm;
      case 'md': return theme.shadow.md;
      case 'lg': return theme.shadow.lg;
      default: return theme.shadow.none;
    }
  })();

  const backgroundColor = variant === 'secondary'
    ? theme.colors.backgroundSecondary
    : theme.colors.surface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: theme.colors.border,
          borderWidth: border ? 1 : 0,
          padding: padded ? theme.spacing.md : 0,
          borderRadius: theme.borderRadius.lg,
          ...shadowStyle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});

