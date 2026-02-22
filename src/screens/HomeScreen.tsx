import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAuth } from '@context/AuthContext';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, MainTabParamList } from '@app-types/index';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  getTimetableForStudent,
  getActiveFoodOrderForStudent,
  getActiveLaundryOrderForStudent,
  getNotificationsForUser,
} from '@lib/index';
import { Timetable, FoodOrder, LaundryOrder, Notification } from '@app-types/database';
import { Ionicons } from '@expo/vector-icons';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const navigation = useNavigation<HomeNav>();

  const [todayClasses, setTodayClasses] = useState<Timetable[]>([]);
  const [activeOrder, setActiveOrder] = useState<FoodOrder | null>(null);
  const [laundryOrder, setLaundryOrder] = useState<LaundryOrder | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;
    const studentId = userProfile.id;
    const today = getDayName();

    const [timetableRes, foodRes, laundryRes, notifRes] = await Promise.all([
      getTimetableForStudent(studentId, today),
      getActiveFoodOrderForStudent(studentId),
      getActiveLaundryOrderForStudent(studentId),
      getNotificationsForUser(studentId),
    ]);

    if (timetableRes.data) setTodayClasses(timetableRes.data as Timetable[]);
    if (foodRes.data) setActiveOrder(foodRes.data as FoodOrder);
    if (laundryRes.data) setLaundryOrder(laundryRes.data as LaundryOrder);
    if (notifRes.data) setNotifications(notifRes.data.slice(0, 3) as Notification[]);
  }, [userProfile?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const statusColor = (status: string | null) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'preparing': return theme.colors.info;
      case 'ready': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ResponsiveContainer>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        >
          {/* Greeting */}
          <Card elevated style={styles.card}>
            <View style={styles.row}>
              <Avatar name={userProfile?.name || 'User'} size={56} />
              <View style={styles.flex}>
                <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                  {getGreeting()} 👋
                </Text>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {userProfile?.name || 'Student'}
                </Text>
              </View>
              <Badge label={userProfile?.role || 'student'} variant="primary" />
            </View>
          </Card>

          {/* Today's Classes */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Today's Classes
          </Text>
          {todayClasses.length === 0 ? (
            <Card elevated style={styles.card}>
              <Text style={{ color: theme.colors.textSecondary }}>No classes today 🎉</Text>
            </Card>
          ) : (
            todayClasses.map(cls => (
              <Card key={cls.id} elevated style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.primary }]} />
                  <View style={styles.flex}>
                    <Text style={[styles.courseName, { color: theme.colors.text }]}>
                      {(cls as any).courses?.course_name || 'Course'}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                      {cls.start_time?.slice(0, 5)} – {cls.end_time?.slice(0, 5)} · {cls.location}
                    </Text>
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>
                      {(cls as any).courses?.lecturer}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}

          {/* Active Food Order */}
          {activeOrder && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Active Food Order
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder.id })}
              >
                <Card elevated style={styles.card}>
                  <View style={styles.row}>
                    <Ionicons name="fast-food-outline" size={36} color={theme.colors.primary} />
                    <View style={styles.flex}>
                      <Text style={[styles.courseName, { color: theme.colors.text }]}>
                        {(activeOrder as any).vendors?.name || 'Vendor'}
                      </Text>
                      <Text style={[{ color: statusColor(activeOrder.status) }]}>
                        {activeOrder.status?.charAt(0).toUpperCase()}{activeOrder.status?.slice(1)}
                      </Text>
                      <Text style={{ color: theme.colors.textSecondary }}>
                        Total: RM {Number(activeOrder.total ?? 0).toFixed(2)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                  </View>
                </Card>
              </TouchableOpacity>
            </>
          )}

          {/* Active Laundry */}
          {laundryOrder && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Laundry Status
              </Text>
              <Card elevated style={styles.card}>
                <View style={styles.row}>
                  <Ionicons name="water-outline" size={36} color={theme.colors.info} />
                  <View style={styles.flex}>
                    <Text style={[styles.courseName, { color: theme.colors.text }]}>
                      {(laundryOrder as any).laundry_services?.name || 'Laundry'}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary }}>
                      {laundryOrder.status}
                    </Text>
                  </View>
                </View>
              </Card>
            </>
          )}

          {/* Recent Notifications */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Notifications
          </Text>
          {notifications.length === 0 ? (
            <Card elevated style={styles.card}>
              <Text style={{ color: theme.colors.textSecondary }}>You're all caught up ✨</Text>
            </Card>
          ) : (
            notifications.map(n => (
              <Card key={n.id} elevated style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.notifDot, { backgroundColor: n.is_read ? theme.colors.border : theme.colors.primary }]} />
                  <View style={styles.flex}>
                    <Text style={[styles.notifTitle, { color: theme.colors.text }]}>{n.title}</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{n.message}</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  colorDot: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
});
