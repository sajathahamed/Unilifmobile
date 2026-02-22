import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app-types/index';
import { AuthStackNavigator } from './stacks/AuthStack';
import { AppStackNavigator } from './stacks/AppStack';
import { ProfileScreen } from '@screens/ProfileScreen';
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

export const RootNavigator = () => {
  const { theme } = useTheme();
  const { session, loading, userProfile } = useAuth();

  if (loading) {
    return <Loader fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer theme={theme.isDark ? DarkTheme : DefaultTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          (userProfile?.role === 'student' || !userProfile?.role) ? (
            <RootStack.Screen name="App" component={AppStackNavigator} />
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
