import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useAuth } from '@context/AuthContext';
import { getNotificationsForUser, markNotificationRead } from '@lib/index';
import { Notification } from '@app-types/database';
import { Ionicons } from '@expo/vector-icons';

export const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await getNotificationsForUser(userProfile.id);
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [userProfile?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRead = async (id: number) => {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <ResponsiveContainer>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ResponsiveContainer>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Notifications</Text>
          {notifications.some(n => !n.is_read) && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.unreadText}>
                {notifications.filter(n => !n.is_read).length}
              </Text>
            </View>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.colors.border} />
            <Text style={{ color: theme.colors.textSecondary }}>No notifications yet</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => !item.is_read && handleRead(item.id)} activeOpacity={0.8}>
                <Card elevated style={{ opacity: item.is_read ? 0.75 : 1 }}>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: item.is_read ? theme.colors.border : theme.colors.primary },
                      ]}
                    />
                    <View style={styles.flex}>
                      <Text style={[styles.notifTitle, { color: theme.colors.text }]}>
                        {item.title}
                      </Text>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                        {item.message}
                      </Text>
                      <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                    {!item.is_read && (
                      <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.primary} />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '800' },
  unreadBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  flex: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  date: { fontSize: 11, marginTop: 4 },
});
