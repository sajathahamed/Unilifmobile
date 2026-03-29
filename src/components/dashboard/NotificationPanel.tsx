import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Notification } from '@app-types/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NotificationCategory = 'laundry' | 'food' | 'trip' | 'class' | 'general';

function getCategoryFromTitle(title: string | null): NotificationCategory {
  if (!title) return 'general';
  const t = (title || '').toLowerCase();
  if (t.includes('laundry')) return 'laundry';
  if (t.includes('food') || t.includes('order')) return 'food';
  if (t.includes('trip') || t.includes('plan')) return 'trip';
  if (t.includes('class') || t.includes('timetable')) return 'class';
  return 'general';
}

function getIconAndColor(
  category: NotificationCategory,
  theme: { colors: Record<string, string> }
): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  switch (category) {
    case 'laundry':
      return { icon: 'shirt-outline', color: theme.colors.dashboardLaundry ?? theme.colors.success };
    case 'food':
      return { icon: 'fast-food-outline', color: theme.colors.dashboardFood ?? theme.colors.warning };
    case 'trip':
      return { icon: 'map-outline', color: theme.colors.dashboardTrip ?? theme.colors.info };
    case 'class':
      return { icon: 'school-outline', color: theme.colors.dashboardTimetable ?? theme.colors.primary };
    default:
      return { icon: 'notifications-outline', color: theme.colors.textSecondary };
  }
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString();
}

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  visible,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-400);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-400, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const renderItem = ({ item }: { item: Notification }) => {
    const category = getCategoryFromTitle(item.title);
    const { icon, color } = getIconAndColor(category, theme);
    return (
      <Pressable
        style={[styles.item, { backgroundColor: theme.colors.surface }]}
        onPress={() => onMarkAsRead(item.id)}
      >
        <View style={[styles.unreadBar, !item.is_read && { backgroundColor: color }]} />
        <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title || 'Notification'}
          </Text>
          <Text style={[styles.itemMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.message || ''}
          </Text>
          <Text style={[styles.itemTime, { color: theme.colors.textTertiary }]}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.panel,
          panelStyle,
          {
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={onMarkAllAsRead}>
              <Text style={[styles.markAll, { color: theme.colors.primary }]}>Mark all as read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyEmoji]}>🎉</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              You're all caught up!
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(n) => String(n.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  markAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemMessage: {
    fontSize: 13,
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});
