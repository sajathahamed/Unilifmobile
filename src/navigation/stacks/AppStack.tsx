import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from '@app-types/index';
import { MainTabs } from '../tabs/MainTabs';
import { FoodMenuScreen } from '@screens/FoodMenuScreen';
import { CartScreen } from '@screens/CartScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStackNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name="FoodMenu" component={FoodMenuScreen} options={{ title: 'Menu' }} />
    <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
  </Stack.Navigator>
);
