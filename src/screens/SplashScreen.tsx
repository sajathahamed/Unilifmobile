import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@theme/index';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app-types/index';

export type SplashScreenProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { session, loading } = useAuth();
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (session) {
        navigation.replace('App');
      } else if (!loading) {
        navigation.replace('Auth');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [session, loading, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={[styles.logoCircle, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={[styles.logoText, { color: theme.colors.textInverse }]}>UL</Text>
        </View>
      </Animated.View>
      <Text style={[styles.title, { color: theme.colors.text }]}>UniLife</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Student life, organized.</Text>
      <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
});
