import React from 'react';
import { View, Text, StyleSheet, Image, ImageStyle, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface AvatarProps {
  name: string;
  size?: number;
  source?: string | null;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 48, source, containerStyle, imageStyle }) => {
  const { theme } = useTheme();
  const initials = name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, imageStyle]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primaryLight,
        },
        containerStyle,
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.textInverse }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
