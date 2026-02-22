import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '@theme/index';

interface AlertProps {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning' | 'neutral';
  loading?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  message,
  type = 'neutral',
  loading = false,
  style,
  titleStyle,
  messageStyle,
}) => {
  const { theme } = useTheme();

  const backgroundColor = (() => {
    switch (type) {
      case 'success':
        return theme.colors.successLight;
      case 'error':
        return theme.colors.errorLight;
      case 'warning':
        return theme.colors.warningLight;
      case 'info':
        return theme.colors.infoLight;
      default:
        return theme.colors.backgroundTertiary;
    }
  })();

  const textColor = (() => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.text;
    }
  })();

  return (
    <View style={[styles.container, { backgroundColor, borderColor: theme.colors.border }, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }, titleStyle]}>{title}</Text>
        {loading && <ActivityIndicator size="small" color={textColor} />}
      </View>
      {message && <Text style={[styles.message, { color: theme.colors.text }, messageStyle]}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
  },
});
