import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useTheme } from '@theme/index';

const cartItems = [
  { id: 1, name: 'Cheeseburger', price: 8.99, qty: 1 },
  { id: 2, name: 'Veggie Bowl', price: 10.5, qty: 2 },
];

export const CartScreen: React.FC = () => {
  const { theme } = useTheme();
  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Your Cart</Text>
      {cartItems.map(item => (
        <Card key={item.id} elevated style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
              <Text style={{ color: theme.colors.textSecondary }}>Qty {item.qty}</Text>
            </View>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>${(item.price * item.qty).toFixed(2)}</Text>
          </View>
        </Card>
      ))}

      <Card elevated>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.name, { color: theme.colors.text }]}>Total</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 18 }}>${total.toFixed(2)}</Text>
        </View>
        <Button label="Checkout" onPress={() => {}} style={{ marginTop: 12 }} />
      </Card>
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
