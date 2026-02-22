import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '@components/ui/Card';
import { useTheme } from '@theme/index';

const notifications = [
  { id: 1, title: 'Order ready', message: 'Your food order is ready for pickup.', time: '2h ago' },
  { id: 2, title: 'Class cancelled', message: 'Math 201 at 11:00 is cancelled today.', time: '4h ago' },
];

export const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Notifications</Text>
      {notifications.map(notification => (
        <Card key={notification.id} elevated style={{ marginBottom: 12 }}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{notification.title}</Text>
          <Text style={{ color: theme.colors.textSecondary }}>{notification.message}</Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 }}>{notification.time}</Text>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
});
