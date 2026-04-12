import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app-types/index';
import { AuthStackNavigator } from './stacks/AuthStack';
import { AppStackNavigator } from './stacks/AppStack';
import { ProfileScreen } from '@screens/ProfileScreen';
import { AdminDashboard } from '@screens/delivery/AdminDashboard';
import { DeliveryPersonDashboard } from '@screens/delivery/DeliveryPersonDashboard';
import { DeliveryAssignmentsPage } from '@screens/delivery/DeliveryAssignmentsPage';
import { useTheme } from '@theme/index';
import { useAuth } from '@context/AuthContext';
import { Loader } from '@components/Loader';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const FallbackStack = createNativeStackNavigator();

const FallbackNavigator = () => (
  <FallbackStack.Navigator>
    <FallbackStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Dashboard' }} />
  </FallbackStack.Navigator>
);

const DeliveryAdminNavigator = () => (
  <FallbackStack.Navigator screenOptions={{ headerShown: false }}>
    <FallbackStack.Screen name="DeliveryAdminDashboard" component={AdminDashboard} />
    <FallbackStack.Screen name="DeliveryAssignments" component={DeliveryAssignmentsPage} />
  </FallbackStack.Navigator>
);

const DeliveryRiderNavigator = () => (
  <FallbackStack.Navigator screenOptions={{ headerShown: false }}>
    <FallbackStack.Screen name="DeliveryPersonDashboard" component={DeliveryPersonDashboard} />
  </FallbackStack.Navigator>
);

export const RootNavigator = () => {
  const { theme } = useTheme();
  const { session, loading, userProfile } = useAuth();
  const role = userProfile?.role;

  if (loading) {
    return <Loader fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer theme={theme.isDark ? DarkTheme : DefaultTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          (role === 'student' || role === 'lecturer' || role === 'vendor' || !role) ? (
            <RootStack.Screen name="App" component={AppStackNavigator} />
          ) : role === 'delivery' ? (
            <RootStack.Screen name="App" component={DeliveryRiderNavigator} />
          ) : role === 'admin' || role === 'super_admin' ? (
            <RootStack.Screen name="App" component={DeliveryAdminNavigator} />
          ) : (
            <RootStack.Screen name="App" component={FallbackNavigator} />
          )
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
