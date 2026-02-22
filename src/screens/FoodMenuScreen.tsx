import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@theme/index';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@app-types/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';

const menuItems = [
  { id: 1, name: 'Cheeseburger', price: 8.99, description: 'Juicy beef patty with cheese', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349' },
  { id: 2, name: 'Veggie Bowl', price: 10.5, description: 'Fresh greens with avocado', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836' },
  { id: 3, name: 'Pasta Carbonara', price: 12.0, description: 'Creamy sauce with bacon', image: 'https://images.unsplash.com/photo-1528697203043-733dafdaa316' },
];

export type FoodMenuScreenProps = NativeStackScreenProps<AppStackParamList, 'FoodMenu'>;

export const FoodMenuScreen: React.FC<FoodMenuScreenProps> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { vendorId, vendorName } = route.params;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{vendorName}</Text>
      <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>Popular picks</Text>

      {menuItems.map(item => (
        <Card key={item.id} elevated style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Image source={{ uri: item.image }} style={{ width: 96, height: 96, borderRadius: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
              <Text style={{ color: theme.colors.textSecondary }}>{item.description}</Text>
              <Text style={{ color: theme.colors.text, fontWeight: '700', marginTop: 6 }}>${item.price.toFixed(2)}</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
                <Button label="Add" onPress={() => navigation.navigate('Cart')} variant="primary" style={{ flex: 1, paddingVertical: 10 }} />
                <Button label="Customize" onPress={() => {}} variant="outline" style={{ flex: 1, paddingVertical: 10 }} />
              </View>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
});
