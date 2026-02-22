import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Card } from '@components/ui/Card';
import { useTheme } from '@theme/index';
import { useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '@app-types/index';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const vendors = [
  { id: 1, name: 'Campus Grill', type: 'Burgers', rating: 4.6, location: 'North Wing', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349' },
  { id: 2, name: 'Green Bowl', type: 'Salads', rating: 4.8, location: 'Library Plaza', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836' },
  { id: 3, name: 'Pasta House', type: 'Italian', rating: 4.5, location: 'Main Hall', image: 'https://images.unsplash.com/photo-1528697203043-733dafdaa316' },
];

export const FoodVendorsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      {vendors.map(vendor => (
        <TouchableOpacity key={vendor.id} onPress={() => navigation.navigate('FoodMenu', { vendorId: vendor.id, vendorName: vendor.name })}>
          <Card elevated style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Image source={{ uri: vendor.image }} style={{ width: 88, height: 88, borderRadius: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.colors.text }]}>{vendor.name}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>{vendor.type} • {vendor.location}</Text>
                <Text style={{ color: theme.colors.accent, marginTop: 4 }}>⭐ {vendor.rating}</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  name: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
});
