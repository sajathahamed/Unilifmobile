import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@app-types/index';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@hooks/useToast';

export type SignupScreenProps = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { signUp, signInWithGoogle, loading } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    const { success, error } = await signUp(email.trim(), password, name.trim());
    if (!success && error) {
      showToast({ type: 'error', title: 'Signup failed', message: error });
    } else if (success) {
      showToast({ type: 'success', title: 'Account created', message: 'You are now signed in.' });
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ResponsiveContainer>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Create your account</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Join UniLife today</Text>

              <View style={{ height: 24 }} />
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={name}
                onChangeText={setName}
              />
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

              <Button label="Create account" onPress={handleSignup} loading={loading} />

              <View style={{ height: 12 }} />
              <Button label="Continue with Google" onPress={handleGoogle} variant="outline" />

              <View style={styles.footerRow}>
                <Text style={{ color: theme.colors.textSecondary }}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ padding: 8 }}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </ResponsiveContainer>
      </TouchableWithoutFeedback>
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
