import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { getFoodItemsByVendor } from '@lib/index';
import { FoodItem } from '@app-types/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@app-types/index';
import { useCart } from '@context/CartContext';
import { Ionicons } from '@expo/vector-icons';

export type FoodMenuScreenProps = NativeStackScreenProps<AppStackParamList, 'FoodMenu'>;

export const FoodMenuScreen: React.FC<FoodMenuScreenProps> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { vendorId, vendorName } = route.params;
  const { addItem, totalCount, cartItems } = useCart();
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    const { data } = await getFoodItemsByVendor(vendorId);
    if (data) setMenuItems(data as FoodItem[]);
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const isInCart = (id: number) => cartItems.some(i => i.id === id);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ResponsiveContainer>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{vendorName}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {menuItems.length} items available
          </Text>
        </View>

        {menuItems.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="restaurant-outline" size={64} color={theme.colors.border} />
            <Text style={{ color: theme.colors.textSecondary }}>No items available</Text>
          </View>
        ) : (
          <FlatList
            key={isTablet ? 'tablet-grid' : 'phone-list'}
            data={menuItems}
            numColumns={isTablet ? 2 : 1}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: totalCount > 0 ? 96 : 32 }}
            columnWrapperStyle={isTablet ? { gap: 16 } : undefined}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            renderItem={({ item }) => (
              <View style={isTablet ? { flex: 1 } : undefined}>
                <Card elevated>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: theme.colors.primaryDark + '12' },
                      ]}
                    >
                      <Ionicons name="restaurant-outline" size={32} color={theme.colors.primary} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                      {(item as any).food_categories?.name && (
                        <Text style={[styles.category, { color: theme.colors.primary }]}>
                          {(item as any).food_categories.name}
                        </Text>
                      )}
                      <Text style={[styles.price, { color: theme.colors.text }]}>
                        RM {Number(item.price ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Button
                      label={isInCart(item.id) ? '✓ Added to Cart' : 'Add to Cart'}
                      variant={isInCart(item.id) ? 'outline' : 'primary'}
                      onPress={() =>
                        addItem({
                          id: item.id,
                          name: item.name ?? '',
                          price: Number(item.price ?? 0),
                          vendorId,
                          vendorName,
                          imageUrl: item.image_url ?? undefined,
                        })
                      }
                    />
                  </View>
                </Card>
              </View>
            )}
          />
        )}

        {/* Floating Cart Button */}
        {totalCount > 0 && (
          <TouchableOpacity
            style={[styles.cartBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="cart-outline" size={22} color="#fff" />
            <Text style={styles.cartBtnText}>View Cart</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  category: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '800' },
  cartBtn: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cartBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cartBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cartBadgeText: { color: '#4F46E5', fontWeight: '800', fontSize: 13 },
});
