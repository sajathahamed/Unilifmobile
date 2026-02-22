import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@app-types/index';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@hooks/useToast';

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { signIn, signInWithGoogle, loading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { success, error } = await signIn(email.trim(), password);
    if (!success && error) {
      showToast({ type: 'error', title: 'Login failed', message: error });
    }
  };

  const handleGoogle = async () => {
    const { success, error } = await signInWithGoogle();
    if (!success && error) {
      showToast({ type: 'error', title: 'Google sign-in failed', message: error });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back 👋</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Log in to continue</Text>

          <View style={{ height: 24 }} />
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600', textAlign: 'right', marginBottom: 16 }}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <Button label="Login" onPress={handleLogin} loading={loading} />

          <View style={{ height: 12 }} />
          <Button label="Continue with Google" onPress={handleGoogle} variant="outline" />

          <View style={styles.footerRow}>
            <Text style={{ color: theme.colors.textSecondary }}>New here?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={{ color: theme.colors.primary, fontWeight: '700', marginLeft: 6 }}>Create account</Text>
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
