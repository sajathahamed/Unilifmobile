import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@app-types/index';
import { HomeScreen } from '@screens/HomeScreen';
import { FoodVendorsScreen } from '@screens/FoodVendorsScreen';
import { LaundryScreen } from '@screens/LaundryScreen';
import { PlannerScreen } from '@screens/PlannerScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'Food') iconName = 'fast-food-outline';
          if (route.name === 'Laundry') iconName = 'water-outline';
          if (route.name === 'Planner') iconName = 'map-outline';
          if (route.name === 'Profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Food" component={FoodVendorsScreen} options={{ title: 'Food' }} />
      <Tab.Screen name="Laundry" component={LaundryScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
