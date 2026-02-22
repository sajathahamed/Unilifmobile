import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@app-types/index';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@hooks/useToast';

export type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { resetPassword, loading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');

  const handleReset = async () => {
    const { success, error } = await resetPassword(email.trim());
    if (!success && error) {
      showToast({ type: 'error', title: 'Reset failed', message: error });
    } else if (success) {
      showToast({ type: 'success', title: 'Email sent', message: 'Check your inbox for reset instructions.' });
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Reset password</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>We will send you a reset link</Text>

          <View style={{ height: 24 }} />
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Button label="Send reset link" onPress={handleReset} loading={loading} />

          <View style={styles.footerRow}>
            <Text style={{ color: theme.colors.textSecondary }}>Remembered?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: theme.colors.primary, fontWeight: '700', marginLeft: 6 }}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
});
