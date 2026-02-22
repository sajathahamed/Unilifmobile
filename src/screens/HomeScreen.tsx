import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@theme/index';
import { useAuth } from '@context/AuthContext';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { userProfile } = useAuth();

  const roleBadges: Record<string, string> = {
    student: 'Student',
    vendor: 'Vendor',
    delivery: 'Delivery',
    admin: 'Admin',
    super_admin: 'Super Admin',
    lecturer: 'Lecturer',
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Card elevated style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar name={userProfile?.name || 'User'} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Hi, {userProfile?.name || 'there'} 👋</Text>
            <Text style={{ color: theme.colors.textSecondary }}>
              Welcome to UniLife! Here's your overview.
            </Text>
          </View>
          <Badge label={roleBadges[userProfile?.role || 'student']} variant="primary" />
        </View>
      </Card>

      <Card elevated style={{ marginBottom: 16 }}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Today</Text>
        <Text style={{ color: theme.colors.textSecondary }}>No classes scheduled. Enjoy your day!</Text>
      </Card>

      <Card elevated style={{ marginBottom: 16 }}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          <Button label="Timetable" onPress={() => {}} variant="outline" style={{ flex: 1 }} />
          <Button label="Food" onPress={() => {}} variant="outline" style={{ flex: 1 }} />
          <Button label="Laundry" onPress={() => {}} variant="outline" style={{ flex: 1 }} />
        </View>
      </Card>

      <Card elevated>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Notifications</Text>
        <Text style={{ color: theme.colors.textSecondary }}>You're all caught up ✨</Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
});
