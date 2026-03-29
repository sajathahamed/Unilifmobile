import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from '@app-types/index';
import { MainTabs } from '../tabs/MainTabs';
import { FoodMenuScreen } from '@screens/FoodMenuScreen';
import { CartScreen } from '@screens/CartScreen';
import { OrderTrackingScreen } from '@screens/OrderTrackingScreen';
import { VoidTripsScreen } from '@screens/VoidTripsScreen';
import { TimetableScreen } from '@screens/TimetableScreen';
import { DeliveryAdminLogin } from '../../screens/delivery/DeliveryAdminLogin';
import { AdminDashboard } from '../../screens/delivery/AdminDashboard';
import { DeliveryPersonLogin } from '../../screens/delivery/DeliveryPersonLogin';
import { DeliveryPersonDashboard } from '../../screens/delivery/DeliveryPersonDashboard';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStackNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name="FoodMenu" component={FoodMenuScreen} options={{ title: 'Menu' }} />
    <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Cart' }} />
    <Stack.Screen
      name="OrderTracking"
      component={OrderTrackingScreen}
      options={{ title: 'Order Tracking', headerBackVisible: false }}
    />
    <Stack.Screen
      name="VoidTrips"
      component={VoidTripsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Timetable"
      component={TimetableScreen}
      options={{ title: 'Class Schedule' }}
    />
    <Stack.Screen name="DeliveryAdminLogin" component={DeliveryAdminLogin} options={{ headerShown: false }} />
    <Stack.Screen name="DeliveryAdminDashboard" component={AdminDashboard} options={{ headerShown: false }} />
    <Stack.Screen name="DeliveryPersonLogin" component={DeliveryPersonLogin} options={{ headerShown: false }} />
    <Stack.Screen name="DeliveryPersonDashboard" component={DeliveryPersonDashboard} options={{ headerShown: false }} />
  </Stack.Navigator>
);
