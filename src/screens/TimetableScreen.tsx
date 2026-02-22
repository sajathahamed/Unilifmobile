import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAuth } from '@context/AuthContext';
import { Card } from '@components/ui/Card';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { getTimetableForStudent } from '@lib/index';
import { Timetable } from '@app-types/database';
import { Ionicons } from '@expo/vector-icons';

const DAY_COLORS = [
  '#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#14B8A6', '#8B5CF6', '#EC4899',
];

export const TimetableScreen: React.FC = () => {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const today = getDayName();

  const fetchTimetable = useCallback(async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await getTimetableForStudent(userProfile.id, today);
    if (data) setTimetable(data as Timetable[]);
    setLoading(false);
  }, [userProfile?.id, today]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ResponsiveContainer>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Today's Schedule</Text>
          <Text style={[styles.day, { color: theme.colors.primary }]}>{today}</Text>
        </View>
        {timetable.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.border} />
            <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
              No classes today
            </Text>
          </View>
        ) : (
          <FlatList
            data={timetable}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item, index }) => {
              const course = (item as any).courses;
              const color = course?.colour || DAY_COLORS[index % DAY_COLORS.length];
              return (
                <Card elevated>
                  <View style={styles.row}>
                    <View style={[styles.colorBar, { backgroundColor: color }]} />
                    <View style={styles.flex}>
                      <Text style={[styles.courseCode, { color: theme.colors.textSecondary }]}>
                        {course?.course_code || 'N/A'}
                      </Text>
                      <Text style={[styles.courseName, { color: theme.colors.text }]}>
                        {course?.course_name || 'Subject'}
                      </Text>
                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={13} color={theme.colors.textTertiary} />
                        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                          {item.start_time?.slice(0, 5)} – {item.end_time?.slice(0, 5)}
                        </Text>
                        <Ionicons name="location-outline" size={13} color={theme.colors.textTertiary} />
                        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                          {item.location}
                        </Text>
                      </View>
                      {course?.lecturer && (
                        <View style={styles.metaRow}>
                          <Ionicons name="person-outline" size={13} color={theme.colors.textTertiary} />
                          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                            {course.lecturer}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              );
            }}
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  day: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  empty: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  flex: { flex: 1 },
  colorBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    minHeight: 70,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    marginRight: 8,
  },
});
