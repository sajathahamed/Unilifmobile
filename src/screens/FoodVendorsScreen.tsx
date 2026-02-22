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
                onPress={() => navigation.navigate('FoodMenu', { vendorId: item.id, vendorName: item.name ?? 'Vendor' })}
                activeOpacity={0.8}
              >
                <Card elevated>
                  <View style={styles.row}>
                    <View style={[styles.vendorIcon, { backgroundColor: theme.colors.primaryDark + '15' }]}>
                      <Ionicons name="storefront-outline" size={36} color={theme.colors.primary} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.vendorName, { color: theme.colors.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.vendorType, { color: theme.colors.textSecondary }]}>
                        {item.type} · {item.location}
                      </Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={[styles.rating, { color: theme.colors.text }]}>
                          {item.rating ?? '—'}
                        </Text>
                        <View
                          style={[
                            styles.openBadge,
                            { backgroundColor: item.is_open ? theme.colors.successLight : theme.colors.errorLight },
                          ]}
                        >
                          <Text
                            style={[
                              styles.openText,
                              { color: item.is_open ? theme.colors.success : theme.colors.error },
                            ]}
                          >
                            {item.is_open ? 'Open' : 'Closed'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vendorIcon: {
    width: 68,
    height: 68,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  vendorName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  vendorType: { fontSize: 13, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 13, fontWeight: '700', marginRight: 8 },
  openBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  openText: { fontSize: 11, fontWeight: '700' },
});
