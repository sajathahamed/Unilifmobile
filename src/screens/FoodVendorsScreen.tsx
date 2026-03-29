import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { getFoodCourtStalls } from '@lib/index';
import { Vendor, FoodItem } from '@app-types/database';

export interface FoodCourtVendor extends Vendor {
  food_items?: (FoodItem & { category_id?: number | null })[];
  food_categories?: { id: number; name: string }[];
}
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '@app-types/index';
import { Ionicons } from '@expo/vector-icons';

export const FoodVendorsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [vendors, setVendors] = useState<FoodCourtVendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    const { data } = await getFoodCourtStalls();
    if (data) setVendors(data as FoodCourtVendor[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

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
          <Text style={[styles.title, { color: theme.colors.text }]}>Food Court</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {vendors.length} vendors open
          </Text>
        </View>
        {vendors.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="fast-food-outline" size={64} color={theme.colors.border} />
            <Text style={{ color: theme.colors.textSecondary }}>No vendors open right now</Text>
          </View>
        ) : (
          <FlatList
            key={isTablet ? 'tablet-grid' : 'phone-list'}
            data={vendors}
            numColumns={isTablet ? 2 : 1}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            columnWrapperStyle={isTablet ? { gap: 16 } : undefined}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={isTablet ? { flex: 1 } : undefined}
                onPress={() => navigation.navigate('FoodMenu', { vendorId: item.id, vendorName: item.shop_name ?? 'Vendor' })}
                activeOpacity={0.8}
              >
                <Card elevation="sm" variant="secondary" border={false} style={styles.vendorCard}>
                  <View style={styles.imageHeader}>
                    <View style={[styles.vendorIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                      <Ionicons name="storefront-outline" size={32} color={theme.colors.primary} />
                    </View>
                    <View style={[styles.openBadge, { backgroundColor: item.is_open ? theme.colors.successLight : theme.colors.errorLight }]}>
                      <Text style={[styles.openText, { color: item.is_open ? theme.colors.onSuccess : theme.colors.error }]}>
                        {item.is_open ? 'OPEN' : 'CLOSED'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={[styles.vendorName, { color: theme.colors.text }]} numberOfLines={1}>
                      {item.shop_name}
                    </Text>
                    <Text style={[styles.vendorType, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {item.food_categories && item.food_categories.length > 0 
                        ? item.food_categories.slice(0, 3).map(c => c.name).filter(Boolean).join(' • ')
                        : item.category}
                      {(item.area || item.city) ? ` · ${item.area || item.city}` : ''}
                    </Text>
                    {item.phone ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={14} color={theme.colors.textTertiary} />
                        <Text style={[styles.infoText, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                          {item.phone}
                        </Text>
                      </View>
                    ) : null}
                    {item.owner_name ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={14} color={theme.colors.textTertiary} />
                        <Text style={[styles.infoText, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                          {item.owner_name}
                        </Text>
                      </View>
                    ) : null}

                    {item.food_items && item.food_items.length > 0 && (
                      <View style={styles.itemsPreviewContainer}>
                        {item.food_items.slice(0, 3).map((food) => (
                          <View key={food.id} style={styles.previewItem}>
                            {food.image_url ? (
                              <Image source={{ uri: food.image_url }} style={styles.previewImage} />
                            ) : (
                              <View style={[styles.previewImage, styles.previewImagePlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Ionicons name="fast-food" size={16} color={theme.colors.primary} />
                              </View>
                            )}
                            <Text style={[styles.previewText, { color: theme.colors.text }]} numberOfLines={1}>{food.name}</Text>
                            <Text style={[styles.previewPrice, { color: theme.colors.textTertiary }]} numberOfLines={1}>RM {Number(food.price||0).toFixed(2)}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.footerRow}>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={[styles.rating, { color: theme.colors.text }]}>
                          {(item as any).rating ?? '4.8'}
                        </Text>
                      </View>
                      <View style={styles.dot} />
                      <Text style={[styles.timeText, { color: theme.colors.textTertiary }]}>
                        20-30 min
                      </Text>
                      <TouchableOpacity style={styles.arrowBox}>
                         <Ionicons name="arrow-forward-circle" size={24} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4, letterSpacing: 0.2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  vendorCard: {
    borderRadius: 24,
    padding: 0,
    overflow: 'hidden',
    marginBottom: 4,
  },
  imageHeader: {
    padding: 16,
    paddingBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vendorIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardBody: {
    padding: 16,
  },
  vendorName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  vendorType: { fontSize: 13, marginBottom: 6, opacity: 0.8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 12, flex: 1 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 14, fontWeight: '700' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#94A3B8', marginHorizontal: 8 },
  timeText: { fontSize: 13, fontWeight: '500' },
  arrowBox: {
    marginLeft: 'auto',
  },
  itemsPreviewContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  previewItem: {
    flex: 1,
    gap: 4,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  previewImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewPrice: {
    fontSize: 10,
    fontWeight: '500',
  },
});
