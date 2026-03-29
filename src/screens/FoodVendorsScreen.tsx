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
import { getOpenVendors } from '@lib/index';
import { Vendor } from '@app-types/database';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '@app-types/index';
import { Ionicons } from '@expo/vector-icons';

export const FoodVendorsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    const { data } = await getOpenVendors();
    if (data) setVendors(data as Vendor[]);
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
            contentContainerStyle={{ padding: 16 }}
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
                      {item.category} · {item.area || item.city || 'Location'}
                    </Text>

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
  vendorType: { fontSize: 13, marginBottom: 12, opacity: 0.8 },
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
});
