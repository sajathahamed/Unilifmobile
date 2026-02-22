import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { useTheme } from '@theme/index';

const laundryOrders = [
  { id: 1, service: 'Campus Laundry', status: 'In Progress', eta: 'Today 5:00 PM', total: 12.5 },
  { id: 2, service: 'Fresh Wash', status: 'Ready for Pickup', eta: 'Ready now', total: 9.0 },
];

export const LaundryStatusScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Laundry Status</Text>
      {laundryOrders.map(order => (
        <Card key={order.id} elevated style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.name, { color: theme.colors.text }]}>{order.service}</Text>
              <Text style={{ color: theme.colors.textSecondary }}>ETA: {order.eta}</Text>
              <Text style={{ color: theme.colors.textSecondary }}>Total: ${order.total.toFixed(2)}</Text>
            </View>
            <Badge
              label={order.status}
              variant={order.status === 'Ready for Pickup' ? 'success' : 'warning'}
            />
          </View>
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
  },
});
