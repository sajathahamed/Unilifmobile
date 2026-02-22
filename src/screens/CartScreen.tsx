import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@app-types/index';
import { createFoodOrder, createFoodOrderItems } from '@lib/index';
import { Ionicons } from '@expo/vector-icons';

export type CartScreenProps = NativeStackScreenProps<AppStackParamList, 'Cart'>;

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { cartItems, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!userProfile?.id || cartItems.length === 0) return;

    // All items must be from same vendor
    const vendorId = cartItems[0].vendorId;
    const allSameVendor = cartItems.every(item => item.vendorId === vendorId);
    if (!allSameVendor) {
      Alert.alert('Cart Error', 'All items must be from the same vendor.');
      return;
    }

    setLoading(true);
    const { data: orderData, error: orderError } = await createFoodOrder(
      userProfile.id,
      vendorId,
      totalAmount
    );

    if (orderError || !orderData) {
      Alert.alert('Checkout Failed', orderError?.message ?? 'Could not place order.');
      setLoading(false);
      return;
    }

    const orderItems = cartItems.map(item => ({
      order_id: orderData.id,
      food_id: item.id,
      qty: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await createFoodOrderItems(orderItems);
    if (itemsError) {
      Alert.alert('Order Error', itemsError.message);
      setLoading(false);
      return;
    }

    clearCart();
    setLoading(false);
    navigation.replace('OrderTracking', { orderId: orderData.id });
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <ResponsiveContainer>
          <View style={styles.center}>
            <Ionicons name="cart-outline" size={80} color={theme.colors.border} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Your cart is empty</Text>
            <Text style={{ color: theme.colors.textSecondary }}>Add items from a vendor to get started</Text>
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ResponsiveContainer>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Your Cart</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {cartItems[0]?.vendorName}
          </Text>
        </View>

        <FlatList
          data={cartItems}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Card elevated>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                  <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
                    RM {(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: theme.colors.backgroundTertiary }]}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={18} color={theme.colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.qty, { color: theme.colors.text }]}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
          ListFooterComponent={() => (
            <Card elevated style={{ marginTop: 12 }}>
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
                  RM {totalAmount.toFixed(2)}
                </Text>
              </View>
              <View style={{ height: 16 }} />
              <Button
                label={loading ? 'Placing Order…' : 'Place Order'}
                onPress={handleCheckout}
                disabled={loading}
              />
            </Card>
          )}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 16, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalAmount: { fontSize: 22, fontWeight: '800' },
});
