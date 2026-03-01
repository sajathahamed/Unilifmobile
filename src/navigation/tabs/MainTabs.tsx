import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '@app-types/index';
import { HomeScreen } from '@screens/HomeScreen';
import { FoodVendorsScreen } from '@screens/FoodVendorsScreen';
import { LaundryScreen } from '@screens/LaundryScreen';
import { PlannerScreen } from '@screens/PlannerScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_HEIGHT = 60;
const CENTER_BUTTON_SIZE = 60;
const CENTER_BUTTON_ELEVATION = 15;
const MIN_TOUCH_SIZE = 48;

const getIconName = (routeName: string): keyof typeof Ionicons.glyphMap => {
  switch (routeName) {
    case 'Home':
      return 'home-outline';
    case 'Food':
      return 'fast-food-outline';
    case 'Laundry':
      return 'water-outline';
    case 'Planner':
      return 'map-outline';
    case 'Profile':
      return 'person-outline';
    default:
      return 'home-outline';
  }
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;
  const centerIndex = Math.floor(state.routes.length / 2);

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.tabBarContent} pointerEvents="box-none">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;
          const isCenter = index === centerIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconColor = isFocused
            ? theme.colors.primary
            : theme.colors.textSecondary;

          const iconName = getIconName(route.name);

          if (isCenter) {
            return (
              <View key={route.key} style={styles.centerTabWrapper}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[
                    styles.centerButton,
                    {
                      backgroundColor: theme.colors.primary,
                      transform: [{ translateY: -CENTER_BUTTON_ELEVATION }],
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={iconName}
                    size={28}
                    color={theme.colors.surface}
                  />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.centerLabel,
                    {
                      color: isFocused
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {typeof label === 'string' ? label : route.name}
                </Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                <Ionicons name={iconName} size={24} color={iconColor} />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: iconColor },
                ]}
                numberOfLines={1}
              >
                {typeof label === 'string' ? label : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Food" component={FoodVendorsScreen} options={{ title: 'Food' }} />
      <Tab.Screen name="Laundry" component={LaundryScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    paddingVertical: 6,
  },
  tabIconContainer: {
    width: MIN_TOUCH_SIZE,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  centerTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
