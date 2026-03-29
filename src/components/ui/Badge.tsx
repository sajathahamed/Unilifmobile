import React from 'react';
import { Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'secondary';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
  rounded?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  rounded = true,
}) => {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: theme.colors.successLight, text: theme.colors.onSuccess || theme.colors.success };
      case 'warning':
        return { bg: theme.colors.warningLight, text: theme.colors.onWarning || theme.colors.warning };
      case 'error':
        return { bg: theme.colors.errorLight, text: theme.colors.onError || theme.colors.error };
      case 'info':
        return { bg: theme.colors.infoLight, text: theme.colors.onInfo || theme.colors.info };
      case 'secondary':
        return { bg: theme.colors.backgroundSecondary, text: theme.colors.textSecondary };
      case 'neutral':
        return { bg: theme.colors.backgroundTertiary, text: theme.colors.text };
      default:
        return { bg: theme.colors.primaryLight, text: theme.colors.onPrimary || theme.colors.primary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingVertical: size === 'sm' ? 2 : 4,
          paddingHorizontal: size === 'sm' ? 8 : 12,
          borderRadius: rounded ? theme.borderRadius.full : theme.borderRadius.sm,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: size === 'sm' ? theme.typography.fontSize.xs - 2 : theme.typography.fontSize.xs,
            fontWeight: theme.typography.fontWeight.bold as any,
          },
          textStyle,
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: 0.5,
  },
});

