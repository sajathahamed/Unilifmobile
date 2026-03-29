import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { getFoodMenuByVendor, getFoodItemsByVendor, getFoodStallById } from '@lib/index';
import type { FoodCategoryWithItems } from '@lib/index';
import { FoodItem, FoodStall } from '@app-types/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@app-types/index';
import { useCart } from '@context/CartContext';
import { Ionicons } from '@expo/vector-icons';

export type FoodMenuScreenProps = NativeStackScreenProps<AppStackParamList, 'FoodMenu'>;

type MenuSection = {
  title: string;
  data: FoodItem[];
};

function sectionsFromCategories(categories: FoodCategoryWithItems[]): MenuSection[] {
  return categories
    .map((cat) => ({
      title: cat.name?.trim() || 'Other',
      data: (cat.food_items ?? [])
        .filter((row) => row.is_available !== false)
        .map(
          (row): FoodItem => ({
            id: row.id,
            vendor_id: row.vendor_id,
            category_id: row.category_id,
            name: row.name,
            price: row.price,
            image_url: row.image_url,
            is_available: row.is_available ?? true,
          })
        ),
    }))
    .filter((s) => s.data.length > 0);
}

export const FoodMenuScreen: React.FC<FoodMenuScreenProps> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { vendorId, vendorName } = route.params;
  const stallId = Number(vendorId);
  const { addItem, totalCount, cartItems } = useCart();
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [stall, setStall] = useState<FoodStall | null>(null);
  const [loading, setLoading] = useState(true);

  const displayVendorName = stall?.shop_name?.trim() || vendorName;

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    const [menuRes, stallRes] = await Promise.all([
      getFoodMenuByVendor(stallId),
      getFoodStallById(stallId),
    ]);

    if (stallRes.data) {
      setStall(stallRes.data as FoodStall);
    } else {
      setStall(null);
    }

    const { data: categories, error } = menuRes;
    if (!error && categories && categories.length > 0) {
      const built = sectionsFromCategories(categories);
      if (built.length > 0) {
        setSections(built);
        setLoading(false);
        return;
      }
    }

    const { data: flatItems } = await getFoodItemsByVendor(stallId);
    if (flatItems && (flatItems as FoodItem[]).length > 0) {
      setSections([
        {
          title: 'Menu',
          data: flatItems as FoodItem[],
        },
      ]);
    } else {
      setSections([]);
    }
    setLoading(false);
  }, [stallId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const itemCount = useMemo(() => sections.reduce((n, s) => n + s.data.length, 0), [sections]);

  const isInCart = (id: number) => cartItems.some((i) => i.id === id);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const locationLine = [stall?.area, stall?.city, stall?.address].filter(Boolean).join(' · ') || null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ResponsiveContainer>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{displayVendorName}</Text>
          {stall?.category ? (
            <Text style={[styles.categoryPill, { color: theme.colors.primary }]}>
              {stall.category}
            </Text>
          ) : null}
          {stall?.owner_name ? (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {stall.owner_name}
              </Text>
            </View>
          ) : null}
          {stall?.phone ? (
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{stall.phone}</Text>
            </View>
          ) : null}
          {locationLine ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                {locationLine}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.subtitle, { color: theme.colors.textTertiary }]}>
            {itemCount > 0
              ? `${itemCount} items · ${sections.length} ${sections.length === 1 ? 'category' : 'categories'}`
              : 'Browse categories and dishes below when available'}
          </Text>
        </View>

        {itemCount === 0 ? (
          <View style={styles.center}>
            <Ionicons name="restaurant-outline" size={64} color={theme.colors.border} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No menu items yet</Text>
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 24 }}>
              Add rows in food_items with vendor_id = {stallId} and a valid category_id from food_categories
              for this restaurant.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            stickySectionHeadersEnabled
            contentContainerStyle={{ padding: 16, paddingBottom: totalCount > 0 ? 140 : 120 }}
            renderSectionHeader={({ section: { title } }) => (
              <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <Card elevation="sm" variant="secondary" border={false} style={styles.menuItemCard}>
                <View style={styles.itemRow}>
                  <View
                    style={[styles.iconBox, { backgroundColor: theme.colors.primary + '10' }]}
                  >
                    <Ionicons name="restaurant-outline" size={28} color={theme.colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
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
                          vendorId: stallId,
                          vendorName: displayVendorName,
                          imageUrl: item.image_url ?? undefined,
                        })
                      }
                      style={[
                        styles.addButton,
                        {
                          backgroundColor: isInCart(item.id)
                            ? theme.colors.success
                            : theme.colors.primary,
                          shadowColor: isInCart(item.id)
                            ? theme.colors.success
                            : theme.colors.primary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isInCart(item.id) ? 'checkmark' : 'add'}
                        size={24}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}

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
                RM{' '}
                {cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}
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
  categoryPill: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  metaText: { fontSize: 14, flex: 1 },
  subtitle: { fontSize: 13, marginTop: 10, opacity: 0.85 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  sectionHeader: {
    paddingVertical: 10,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  menuItemCard: {
    borderRadius: 20,
    marginBottom: 0,
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
  itemName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
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
    borderColor: '#4F46E5',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  cartBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, flex: 1 },
  cartBtnTotal: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
