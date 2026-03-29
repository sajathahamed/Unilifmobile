import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { useTheme } from '@theme/index';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  leftElement,
  rightElement,
  onFocus,
  onBlur,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isError = Boolean(error);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = isError
    ? theme.colors.error
    : isFocused
    ? theme.colors.primary
    : theme.colors.border;

  const backgroundColor = isFocused
    ? theme.colors.surface
    : theme.colors.backgroundSecondary;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
              fontWeight: theme.typography.fontWeight.medium as any,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor,
            borderColor,
            borderRadius: theme.borderRadius.md,
            borderWidth: isFocused || isError ? 1.5 : 1,
          },
        ]}
      >
        {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.md,
            },
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
      {helperText && !isError && (
        <Text style={[styles.helper, { color: theme.colors.textTertiary }]}>{helperText}</Text>
      )}
      {isError && (
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
    minHeight: 52,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  leftElement: {
    marginRight: 8,
  },
  rightElement: {
    marginLeft: 8,
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
    marginLeft: 4,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
});

