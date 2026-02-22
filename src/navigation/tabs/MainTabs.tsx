import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@app-types/index';
import { HomeScreen } from '@screens/HomeScreen';
import { TimetableScreen } from '@screens/TimetableScreen';
import { FoodVendorsScreen } from '@screens/FoodVendorsScreen';
import { LaundryStatusScreen } from '@screens/LaundryStatusScreen';
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
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'Timetable') iconName = 'calendar-outline';
          if (route.name === 'Food') iconName = 'fast-food-outline';
          if (route.name === 'Laundry') iconName = 'water-outline';
          if (route.name === 'Profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Timetable" component={TimetableScreen} />
      <Tab.Screen name="Food" component={FoodVendorsScreen} options={{ title: 'Food' }} />
      <Tab.Screen name="Laundry" component={LaundryStatusScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
