import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@app-types/index';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@hooks/useToast';
import { Ionicons } from '@expo/vector-icons';

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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

  const scrollPaddingTop = insets.top + 28;
  const scrollPaddingBottom = Math.max(insets.bottom, 24) + 16;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ResponsiveContainer>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: scrollPaddingTop,
                paddingBottom: scrollPaddingBottom,
              },
            ]}
          >
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back 👋</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Please enter your details to sign in
                </Text>
              </View>

              <View style={styles.form}>
                <Input
                  label="Email Address"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  value={email}
                  onChangeText={setEmail}
                />
                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry
                  returnKeyType="done"
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotPass}
                >
                  <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>

                <Button
                  label="Sign In"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.mainBtn}
                />

                <View style={styles.dividerContainer}>
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                  <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>OR</Text>
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                </View>

                <Button
                  label="Continue with Google"
                  onPress={handleGoogle}
                  variant="secondary"
                  leftIcon={<Ionicons name="logo-google" size={20} color={theme.colors.primary} />}
                  style={styles.googleBtn}
                />
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.signupBtn}>
                  <Text style={[styles.signupText, { color: theme.colors.primary }]}>
                    Create account
                  </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mainBtn: {
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '700',
  },
  googleBtn: {
    marginBottom: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 15,
  },
  signupBtn: {
    paddingHorizontal: 8,
  },
  signupText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
