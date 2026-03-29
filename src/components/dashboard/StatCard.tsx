import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

const CARD_SIZE = 160;
const SPRING_CONFIG = { damping: 15, stiffness: 150 };

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  onPress: () => void;
  delay?: number;
  animateValue?: boolean; // count-up for numbers
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  accentColor,
  onPress,
  delay = 0,
  animateValue = false,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const [displayNum, setDisplayNum] = useState(
    typeof value === 'number' && animateValue ? 0 : typeof value === 'number' ? value : 0
  );

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, SPRING_CONFIG);
    }, delay);
    return () => clearTimeout(t);
  }, [delay, opacity, translateY]);

  useEffect(() => {
    if (typeof value === 'number' && !animateValue) {
      setDisplayNum(value);
      return;
    }
    if (typeof value !== 'number' || !animateValue) return;
    const target = value;
    const duration = 600;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - p) * (1 - p);
      setDisplayNum(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    setDisplayNum(0);
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value, animateValue]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, SPRING_CONFIG);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const gradientColors = theme.isDark 
    ? [`${accentColor}15`, `${accentColor}05`] 
    : [`${accentColor}08`, `${accentColor}03`];
  
  const displayText = typeof value === 'number' && animateValue ? displayNum : value;

  return (
    <Animated.View style={[styles.wrapper, animatedCardStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.touchable,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.borderRadius.xl,
            ...theme.shadow.sm,
          }
        ]}
      >
        <LinearGradient
          colors={gradientColors as [string, string]}
          style={styles.gradient}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${accentColor}12` }]}>
            <Ionicons name={icon} size={22} color={accentColor} />
          </View>
          
          <View style={styles.bottomContent}>
            <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
              {displayText}
            </Text>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          
          <View style={styles.decorIcon}>
            <Ionicons name={icon} size={70} color={accentColor} style={{ opacity: 0.04 }} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
    maxWidth: CARD_SIZE,
    aspectRatio: 1,
  },
  touchable: {
    flex: 1,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContent: {
    zIndex: 2,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  decorIcon: {
    position: 'absolute',
    bottom: -15,
    right: -10,
    zIndex: 1,
  },
});

