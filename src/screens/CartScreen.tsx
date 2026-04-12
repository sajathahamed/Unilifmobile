import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
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
import { createFoodOrder, createFoodOrderItems, supabase, getFoodStallById } from '@lib/index';
import { FoodStall } from '@app-types/database';
import { Ionicons } from '@expo/vector-icons';
import { sendDialogSms } from '@services/smsService';
import { Input } from '@components/ui/Input';
import { validateFoodOrder, getErrorMessage } from '@utils/validationUtils';

export type CartScreenProps = NativeStackScreenProps<AppStackParamList, 'Cart'>;

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { cartItems, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
   const [specialNotes, setSpecialNotes] = useState('');
   const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery');
   const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stall, setStall] = useState<FoodStall | null>(null);

  const loadStall = useCallback(async () => {
    if (cartItems.length === 0) {
      setStall(null);
      return;
    }
    const id = Number(cartItems[0].vendorId);
    const { data } = await getFoodStallById(id);
    setStall(data ? (data as FoodStall) : null);
  }, [cartItems]);

  useEffect(() => {
    loadStall();
  }, [loadStall]);

  const handleCheckout = async () => {
    if (!userProfile?.id || cartItems.length === 0) return;
     // Validate form with comprehensive validation
     const validation = validateFoodOrder(cartItems, phone, specialNotes, deliveryMethod);
     if (!validation.valid) {
       setFormErrors(validation.errors);
       const errorMessage = getErrorMessage(validation.errors);
       Alert.alert('Validation Error', errorMessage);
       return;
     }
     setFormErrors({});

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
      const deliveryText = deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup';
      const smsMsg = `Hi ${userProfile.name}, your order from ${vendorName} (${deliveryText}) has been confirmed! Ref: FO-${orderData.id}. Total: RS ${totalAmount.toFixed(2)}.`;
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
            {stall?.shop_name || cartItems[0]?.vendorName}
          </Text>
        </View>

        {stall ? (
          <Card elevation="sm" variant="secondary" border={false} style={styles.stallCard}>
            <Text style={[styles.stallCardTitle, { color: theme.colors.text }]}>Restaurant details</Text>
            {stall.owner_name ? (
              <Text style={[styles.stallLine, { color: theme.colors.textSecondary }]}>
                Owner: {stall.owner_name}
              </Text>
            ) : null}
            {stall.phone ? (
              <Text style={[styles.stallLine, { color: theme.colors.textSecondary }]}>Phone: {stall.phone}</Text>
            ) : null}
            {[stall.area, stall.city, stall.address].filter(Boolean).length > 0 ? (
              <Text style={[styles.stallLine, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                {[stall.area, stall.city, stall.address].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </Card>
        ) : null}

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
                    RS {(item.price * item.quantity).toFixed(2)}
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
                    <Text style={[styles.formTitle, { color: theme.colors.text }]}>Order Details</Text>

                    {/* Delivery Method Selection */}
                    <Text style={[styles.fieldLabel, { color: theme.colors.text, marginBottom: 8 }]}>
                      Delivery Method *
                    </Text>
                    <View style={styles.deliveryOptions}>
                      <TouchableOpacity
                        style={[
                          styles.deliveryBtn,
                          {
                            backgroundColor: deliveryMethod === 'pickup' ? theme.colors.primary : theme.colors.backgroundSecondary,
                            borderColor: formErrors.deliveryMethod ? '#EF4444' : 'transparent',
                          },
                        ]}
                        onPress={() => setDeliveryMethod('pickup')}
                      >
                        <Ionicons
                          name="bag-check-outline"
                          size={20}
                          color={deliveryMethod === 'pickup' ? '#fff' : theme.colors.text}
                        />
                        <Text
                          style={[
                            styles.deliveryBtnText,
                            { color: deliveryMethod === 'pickup' ? '#fff' : theme.colors.text },
                          ]}
                        >
                          Pickup
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.deliveryBtn,
                          {
                            backgroundColor: deliveryMethod === 'delivery' ? theme.colors.primary : theme.colors.backgroundSecondary,
                            borderColor: formErrors.deliveryMethod ? '#EF4444' : 'transparent',
                          },
                        ]}
                        onPress={() => setDeliveryMethod('delivery')}
                      >
                        <Ionicons
                          name="bicycle-outline"
                          size={20}
                          color={deliveryMethod === 'delivery' ? '#fff' : theme.colors.text}
                        />
                        <Text
                          style={[
                            styles.deliveryBtnText,
                            { color: deliveryMethod === 'delivery' ? '#fff' : theme.colors.text },
                          ]}
                        >
                          Delivery
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {formErrors.deliveryMethod && (
                      <Text style={[styles.errorText, { color: '#EF4444' }]}>{formErrors.deliveryMethod}</Text>
                    )}

                    {/* Phone Number Input */}
                    <Text style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16, marginBottom: 8 }]}>
                      Phone Number *
                    </Text>
                    <Input
                      label="Phone Number for Updates"
                      placeholder="e.g. 0771234567"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      leftElement={<Ionicons name="call-outline" size={18} color={theme.colors.textTertiary} />}
                    />
                    {formErrors.phone && (
                      <Text style={[styles.errorText, { color: '#EF4444' }]}>{formErrors.phone}</Text>
                    )}

                    {/* Special Notes */}
                    <Text style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16, marginBottom: 8 }]}>
                      Special Instructions (Optional)
                    </Text>
                    <TextInput
                      placeholder="e.g. Extra spicy, no onions, etc."
                      placeholderTextColor={theme.colors.placeholder}
                      value={specialNotes}
                      onChangeText={setSpecialNotes}
                      maxLength={500}
                      multiline
                      numberOfLines={3}
                      style={[
                        styles.notesInput,
                        {
                          color: theme.colors.text,
                          backgroundColor: theme.colors.backgroundSecondary,
                          borderColor: formErrors.specialNotes ? '#EF4444' : theme.colors.border,
                        },
                      ]}
                    />
                    <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
                      {specialNotes.length}/500
                    </Text>
                    {formErrors.specialNotes && (
                      <Text style={[styles.errorText, { color: '#EF4444' }]}>{formErrors.specialNotes}</Text>
                    )}
                  </View>
              </Card>

              <Card elevation="md" border={false} style={styles.totalCard}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Order Total</Text>
                  <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
                    RS {totalAmount.toFixed(2)}
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
  stallCard: { marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 16 },
  stallCardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  stallLine: { fontSize: 13, marginBottom: 4 },
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
   fieldLabel: { fontSize: 14, fontWeight: '700' },
   errorText: { fontSize: 11, marginTop: 4, marginBottom: 8, fontWeight: '500' },
   charCount: { fontSize: 11, marginTop: 4, marginBottom: 8, textAlign: 'right' },
   deliveryOptions: { flexDirection: 'row', gap: 12, marginBottom: 12 },
   deliveryBtn: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     gap: 8,
     paddingVertical: 12,
     borderRadius: 12,
     borderWidth: 1.5,
   },
   deliveryBtnText: { fontSize: 14, fontWeight: '600' },
   notesInput: {
     padding: 12,
     borderWidth: 1.5,
     borderRadius: 10,
     fontSize: 14,
     height: 80,
     textAlignVertical: 'top',
   },
  totalCard: { padding: 20, borderRadius: 24 },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalAmount: { fontSize: 26, fontWeight: '800' },
  placeOrderBtn: { height: 56, borderRadius: 16 },
  footerHint: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 16 },
});
