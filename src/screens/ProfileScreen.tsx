import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAuth } from '@context/AuthContext';
import { Button } from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';
import { Card } from '@components/ui/Card';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { Ionicons } from '@expo/vector-icons';

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  textColor: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, color, textColor }) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={styles.flex}>
      <Text style={[styles.infoLabel, { color: textColor + '99' }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: textColor }]}>{value}</Text>
    </View>
  </View>
);

export const ProfileScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { userProfile, signOut } = useAuth();

  const roleLabels: Record<string, string> = {
    student: 'Student',
    lecturer: 'Lecturer',
    admin: 'Admin',
    vendor: 'Vendor',
    delivery: 'Delivery Agent',
    super_admin: 'Super Admin',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ResponsiveContainer>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Profile Header */}
          <Card elevated style={styles.card}>
            <View style={styles.avatarSection}>
              <Avatar name={userProfile?.name || 'User'} size={80} />
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {userProfile?.name || 'User'}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '18' }]}>
                <Text style={[styles.roleText, { color: theme.colors.primary }]}>
                  {roleLabels[userProfile?.role || 'student']}
                </Text>
              </View>
            </View>
          </Card>

          {/* Info */}
          <Card elevated style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Info</Text>
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={userProfile?.email || '—'}
              color={theme.colors.primary}
              textColor={theme.colors.text}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="id-card-outline"
              label="Role"
              value={roleLabels[userProfile?.role || 'student']}
              color={theme.colors.secondary}
              textColor={theme.colors.text}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="calendar-outline"
              label="Member Since"
              value={
                userProfile?.created_at
                  ? new Date(userProfile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
                  : '—'
              }
              color={theme.colors.accent}
              textColor={theme.colors.text}
            />
          </Card>

          {/* Settings */}
          <Card elevated style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
            <View style={styles.settingRow}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.text + '18' }]}>
                <Ionicons
                  name={theme.isDark ? 'moon-outline' : 'sunny-outline'}
                  size={18}
                  color={theme.colors.text}
                />
              </View>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                {theme.isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <Switch
                value={theme.isDark}
                onValueChange={toggleTheme}
                trackColor={{ true: theme.colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          {/* Logout */}
          <Button
            label="Sign Out"
            variant="outline"
            onPress={signOut}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: { marginBottom: 16 },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  name: { fontSize: 22, fontWeight: '800' },
  roleBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  roleText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#0001', marginVertical: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
