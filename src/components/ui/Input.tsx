import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { useTheme } from '@theme/index';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const { theme } = useTheme();
  const isError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isError ? theme.colors.error : theme.colors.border,
            color: theme.colors.text,
          },
          inputStyle,
        ]}
        placeholderTextColor={theme.colors.placeholder}
        {...props}
      />
      {helperText && !isError && <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>{helperText}</Text>}
      {isError && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
});
