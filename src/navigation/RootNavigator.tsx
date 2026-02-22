import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app-types/index';
import { SplashScreen } from '@screens/SplashScreen';
import { AuthStackNavigator } from './stacks/AuthStack';
import { AppStackNavigator } from './stacks/AppStack';
import { useTheme } from '@theme/index';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { theme } = useTheme();
  return (
    <NavigationContainer theme={theme.isDark ? DarkTheme : DefaultTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        <RootStack.Screen name="App" component={AppStackNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
