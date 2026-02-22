import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '@theme/index';
import { useAuth } from '@context/AuthContext';
import { Button } from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';

export const ProfileScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { userProfile, signOut } = useAuth();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Avatar name={userProfile?.name || 'User'} size={80} />
        <Text style={[styles.name, { color: theme.colors.text }]}>{userProfile?.name || 'User'}</Text>
        <Text style={{ color: theme.colors.textSecondary }}>{userProfile?.email}</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>Dark mode</Text>
        <Switch value={theme.isDark} onValueChange={toggleTheme} />
      </View>

      <View style={{ height: 12 }} />
      <Button label="Sign out" onPress={signOut} variant="outline" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  name: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
  },
});
