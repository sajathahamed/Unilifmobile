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
import { createFoodOrder, createFoodOrderItems, supabase } from '@lib/index';
import { Ionicons } from '@expo/vector-icons';
import { sendDialogSms } from '@services/smsService';
import { Input } from '@components/ui/Input';

export type CartScreenProps = NativeStackScreenProps<AppStackParamList, 'Cart'>;

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { cartItems, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');

  const handleCheckout = async () => {
    if (!userProfile?.id || cartItems.length === 0) return;
    
    if (!phone || phone.length < 9) {
      Alert.alert('Phone Required', 'Please enter a valid phone number for order updates.');
      return;
    }

    // All items must be from same vendor
    const vendorId = cartItems[0].vendorId;
    const vendorName = cartItems[0].vendorName;
    const allSameVendor = cartItems.every(item => item.vendorId === vendorId);
    if (!allSameVendor) {
      Alert.alert('Cart Error', 'All items must be from the same vendor.');
      return;
    }

    setLoading(true);
    const itemsSummary = cartItems.map(i => `${i.name} x${i.quantity}`).join(', ');
    const { data: orderData, error: orderError } = await createFoodOrder(
      String(vendorId),
      userProfile.email || '',
      userProfile.name || '',
      phone,
      totalAmount,
      itemsSummary,
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

    // Update order status to confirmed
    await supabase
      .from('food_orders')
      .update({ status: 'confirmed' })
      .eq('id', orderData.id);

    // Send SMS Confirmation
    try {
      const smsMsg = `Hi ${userProfile.name}, your order from ${vendorName} has been confirmed! Ref: FO-${orderData.id}. Total: RM ${totalAmount.toFixed(2)}.`;
      await sendDialogSms([phone], smsMsg);
    } catch (e) {
      console.error('Failed to send order confirmation SMS:', e);
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
            <Card elevation="sm" variant="secondary" border={false} style={styles.itemCard}>
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
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
          ListFooterComponent={() => (
            <View style={{ gap: 12, marginTop: 12 }}>
              <Card elevation="sm" border={false} padded={false}>
                 <View style={styles.checkoutForm}>
                    <Text style={[styles.formTitle, { color: theme.colors.text }]}>Contact Information</Text>
                    <Input
                      label="Phone Number for Updates"
                      placeholder="e.g. 0771234567"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      leftElement={<Ionicons name="call-outline" size={18} color={theme.colors.textTertiary} />}
                    />
                 </View>
              </Card>

              <Card elevation="md" border={false} style={styles.totalCard}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Order Total</Text>
                  <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
                    RM {totalAmount.toFixed(2)}
                  </Text>
                </View>
                <View style={{ height: 20 }} />
                <Button
                  label={loading ? 'Processing...' : 'Confirm & Place Order'}
                  onPress={handleCheckout}
                  disabled={loading}
                  style={styles.placeOrderBtn}
                />
                <Text style={styles.footerHint}>
                  You will receive an SMS confirmation after placing the order.
                </Text>
              </Card>
            </View>
          )}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 4, opacity: 0.7 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  itemCard: { borderRadius: 16, padding: 16 },
  itemName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  itemPrice: { fontSize: 15, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 16, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  checkoutForm: { padding: 16 },
  formTitle: { fontSize: 14, fontWeight: '800', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  totalCard: { padding: 20, borderRadius: 24 },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalAmount: { fontSize: 26, fontWeight: '800' },
  placeOrderBtn: { height: 56, borderRadius: 16 },
  footerHint: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 16 },
});
