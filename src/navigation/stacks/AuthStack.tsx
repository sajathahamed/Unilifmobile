import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@app-types/index';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { SignupScreen } from '@screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '@screens/auth/ForgotPasswordScreen';
import { DeliveryAdminLogin } from '@screens/delivery/DeliveryAdminLogin';
import { DeliveryPersonLogin } from '@screens/delivery/DeliveryPersonLogin';
import { AdminDashboard } from '@screens/delivery/AdminDashboard';
import { DeliveryPersonDashboard } from '@screens/delivery/DeliveryPersonDashboard';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="DeliveryAdminLogin" component={DeliveryAdminLogin} />
    <Stack.Screen name="DeliveryPersonLogin" component={DeliveryPersonLogin} />
    <Stack.Screen name="DeliveryAdminDashboard" component={AdminDashboard} />
    <Stack.Screen name="DeliveryPersonDashboard" component={DeliveryPersonDashboard} />
  </Stack.Navigator>
);
