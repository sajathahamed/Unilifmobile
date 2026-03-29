import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { useTheme } from '@theme/index';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: theme.colors.backgroundSecondary,
          text: theme.colors.primary,
          border: 'transparent',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: theme.colors.primary,
          border: theme.colors.primary,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: theme.colors.primary,
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: theme.colors.error,
          text: theme.colors.textInverse,
          border: 'transparent',
        };
      case 'success':
        return {
          bg: theme.colors.success,
          text: theme.colors.textInverse,
          border: 'transparent',
        };
      default:
        return {
          bg: theme.colors.primary,
          text: theme.colors.textInverse,
          border: 'transparent',
        };
    }
  };

  const { bg, text, border } = getColors();

  const getPadding = () => {
    switch (size) {
      case 'sm': return { py: 8, px: 12, font: 14 };
      case 'lg': return { py: 16, px: 24, font: 18 };
      default: return { py: 12, px: 20, font: 16 };
    }
  };

  const { py, px, font } = getPadding();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border !== 'transparent' ? 1.5 : 0,
          paddingVertical: py,
          paddingHorizontal: px,
          opacity: disabled || loading ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !disabled && !loading ? 0.97 : 1 }],
          borderRadius: theme.borderRadius.md,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: text,
                fontSize: font,
                fontWeight: theme.typography.fontWeight.semiBold as any,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

