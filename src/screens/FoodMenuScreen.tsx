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
                <Card elevation="sm" variant="secondary" border={false} style={styles.menuItemCard}>
                  <View style={styles.itemRow}>
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: theme.colors.primary + '10' },
                      ]}
                    >
                      <Ionicons name="restaurant-outline" size={28} color={theme.colors.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {(item as any).food_categories?.name && (
                        <Text style={[styles.category, { color: theme.colors.primary }]}>
                          {(item as any).food_categories.name}
                        </Text>
                      )}
                      <Text style={[styles.price, { color: theme.colors.text }]}>
                        RM {Number(item.price ?? 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.actionColumn}>
                       <TouchableOpacity 
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
                         style={[
                           styles.addButton, 
                           { 
                             backgroundColor: isInCart(item.id) ? theme.colors.success : theme.colors.primary,
                             shadowColor: isInCart(item.id) ? theme.colors.success : theme.colors.primary 
                           }
                         ]}
                       >
                         <Ionicons 
                           name={isInCart(item.id) ? "checkmark" : "add"} 
                           size={24} 
                           color="#fff" 
                         />
                       </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              </View>
            )}
          />
        )}

        {/* Floating Cart Button */}
        {totalCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.cartBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={styles.cartBtnContent}>
              <View style={styles.cartIconWrapper}>
                <Ionicons name="cart" size={20} color="#fff" />
                <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                   <Text style={styles.badgeText}>{totalCount}</Text>
                </View>
              </View>
              <Text style={styles.cartBtnText}>View your cart</Text>
              <Text style={styles.cartBtnTotal}>
                RM {cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4, opacity: 0.7 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  menuItemCard: {
    borderRadius: 20,
    marginBottom: 8,
    padding: 12,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemInfo: { flex: 1 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  category: { fontSize: 11, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  price: { fontSize: 17, fontWeight: '800' },
  actionColumn: {
    paddingLeft: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cartBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  cartBtnContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  cartIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5', // Will use theme.colors.primary in runtime if needed, but #4F46E5 is a safe default for indigo
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  cartBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, flex: 1 },
  cartBtnTotal: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
