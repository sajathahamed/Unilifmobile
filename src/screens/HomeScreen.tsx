import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAuth } from '@context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { useDashboardStats } from '@hooks/useDashboardStats';
import { useNotifications } from '@hooks/useNotifications';
import { StatCard } from '@components/dashboard/StatCard';
import { NotificationPanel } from '@components/dashboard/NotificationPanel';
import { AppStackParamList, MainTabParamList } from '@app-types/index';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const navigation = useNavigation<HomeNav>();
  const [notificationPanelVisible, setNotificationPanelVisible] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const stats = useDashboardStats();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const bellRotation = useSharedValue(0);
  useEffect(() => {
    if (unreadCount > 0) {
      bellRotation.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 80 }),
          withTiming(8, { duration: 80 }),
          withTiming(-6, { duration: 60 }),
          withTiming(6, { duration: 60 }),
          withTiming(0, { duration: 80 })
        ),
        2,
        true
      );
    }
  }, [unreadCount, bellRotation]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotation.value}deg` }],
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayLabel = () => {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[d.getDay()]}, ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await stats.refetch();
    setRefreshing(false);
  };

  const nextClassDisplay = stats.nextClass
    ? `${stats.nextClass.time} · ${stats.nextClass.subject}`
    : '—';

  if (stats.loading && !stats.laundryCount && !stats.foodCount && !stats.tripCount && !stats.nextClass) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <ResponsiveContainer>
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonLine, { backgroundColor: theme.colors.border }]} />
            <View style={[styles.skeletonLineShort, { backgroundColor: theme.colors.border, marginTop: 8 }]} />
          </View>
          <View style={styles.skeletonGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[styles.skeletonCard, { backgroundColor: theme.colors.backgroundSecondary }]}
              />
            ))}
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
              {getGreeting().toUpperCase()}
            </Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {userProfile?.name || 'Student'} 👋
            </Text>
            <Text style={[styles.date, { color: theme.colors.textTertiary }]}>{todayLabel()}</Text>
          </View>
          <Pressable
            onPress={() => setNotificationPanelVisible(true)}
            style={[styles.bellWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}
          >
            <Animated.View style={bellStyle}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            </Animated.View>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Error state */}
        {stats.error && (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorLight, borderColor: theme.colors.error }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{stats.error}</Text>
            <Button label="Retry" onPress={() => stats.refetch()} variant="outline" size="sm" style={styles.retryBtn} />
          </View>
        )}

        {/* 2x2 Stat cards */}
        <View style={styles.grid}>
          <StatCard
            title="Laundry"
            value={stats.laundryCount}
            icon="shirt-outline"
            accentColor={theme.colors.dashboardLaundry}
            onPress={() => navigation.navigate('Laundry')}
            delay={0}
            animateValue
          />
          <StatCard
            title="Trips"
            value={stats.tripCount}
            icon="map-outline"
            accentColor={theme.colors.dashboardTrip}
            onPress={() => navigation.navigate('Planner')}
            delay={100}
            animateValue
          />
          <StatCard
            title="Food"
            value={stats.foodCount}
            icon="restaurant-outline"
            accentColor={theme.colors.dashboardFood}
            onPress={() => navigation.navigate('Food')}
            delay={200}
            animateValue
          />
          <StatCard
            title="Class"
            value={nextClassDisplay}
            icon="school-outline"
            accentColor={theme.colors.dashboardTimetable}
            onPress={() => navigation.navigate('Timetable')}
            delay={300}
          />
        </View>

        {/* Quick actions */}
        <View style={styles.quickSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            <TouchableOpacity
              style={[styles.pill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('Laundry')}
            >
              <View style={[styles.pillIcon, { backgroundColor: theme.colors.dashboardLaundry + '15' }]}>
                <Ionicons name="add" size={16} color={theme.colors.dashboardLaundry} />
              </View>
              <Text style={[styles.pillText, { color: theme.colors.text }]}>Laundry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.pill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('Food')}
            >
              <View style={[styles.pillIcon, { backgroundColor: theme.colors.dashboardFood + '15' }]}>
                <Ionicons name="add" size={16} color={theme.colors.dashboardFood} />
              </View>
              <Text style={[styles.pillText, { color: theme.colors.text }]}>Order Food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('Planner')}
            >
              <View style={[styles.pillIcon, { backgroundColor: theme.colors.dashboardTrip + '15' }]}>
                <Ionicons name="map-outline" size={16} color={theme.colors.dashboardTrip} />
              </View>
              <Text style={[styles.pillText, { color: theme.colors.text }]}>Plan Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('Timetable')}
            >
              <View style={[styles.pillIcon, { backgroundColor: theme.colors.dashboardTimetable + '15' }]}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.dashboardTimetable} />
              </View>
              <Text style={[styles.pillText, { color: theme.colors.text }]}>Timetable Scheduling</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Upcoming schedule */}
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Timetable')}>
              <Text style={[styles.viewAll, { color: theme.colors.primary }]}>View Calendar</Text>
            </TouchableOpacity>
          </View>
          
          {stats.upcomingEvents.length === 0 ? (
            <Card variant="secondary" border={false} style={styles.emptyCard}>
              <Text style={{ color: theme.colors.textTertiary, textAlign: 'center' }}>
                No events scheduled for today
              </Text>
            </Card>
          ) : (
            <View style={styles.scheduleList}>
              {stats.upcomingEvents.map((ev, i) => (
                <TouchableOpacity
                  key={ev.id}
                  activeOpacity={0.7}
                  style={[styles.scheduleCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => navigation.navigate(ev.type === 'class' ? 'Timetable' : 'Planner')}
                >
                  <View style={[styles.scheduleBar, { backgroundColor: ev.type === 'class' ? theme.colors.dashboardTimetable : theme.colors.dashboardTrip }]} />
                  <View style={styles.scheduleContent}>
                    <Text style={[styles.scheduleTitle, { color: theme.colors.text }]}>{ev.title}</Text>
                    <View style={styles.scheduleTimeRow}>
                      <Ionicons 
                        name={ev.type === 'class' ? "time-outline" : "location-outline"} 
                        size={14} 
                        color={theme.colors.textTertiary} 
                        style={{ marginRight: 4 }} 
                      />
                      <Text style={[styles.scheduleSub, { color: theme.colors.textSecondary }]}>
                        {ev.time}{ev.subtitle ? ` · ${ev.subtitle}` : ''}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.borderSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <NotificationPanel
        visible={notificationPanelVisible}
        onClose={() => setNotificationPanelVisible(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  bellWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  errorBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: { fontSize: 14, flex: 1, marginRight: 12 },
  retryBtn: { minWidth: 80 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginBottom: 32,
  },
  quickSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  scheduleBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 16,
  },
  scheduleContent: { flex: 1 },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleSub: { fontSize: 13 },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    paddingVertical: 32,
    borderRadius: 20,
  },
  skeletonHeader: {
    padding: 20,
    marginBottom: 16,
  },
  skeletonLine: {
    height: 24,
    width: '70%',
    borderRadius: 8,
  },
  skeletonLineShort: {
    height: 16,
    width: '50%',
    borderRadius: 6,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
  },
  skeletonCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 24,
    maxWidth: 160,
  },
});
