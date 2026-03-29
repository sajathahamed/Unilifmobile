import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useAuth } from '@context/AuthContext';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { getTimetableForStudent, getCourses, createTimetableEntry } from '@lib/index';
import { Timetable, Course } from '@app-types/database';
import { Ionicons } from '@expo/vector-icons';
import { sendDialogSms } from '@services/smsService';

const DAY_COLORS = [
  '#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#14B8A6', '#8B5CF6', '#EC4899',
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TimetableScreen: React.FC = () => {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const today = getDayName();

  const fetchData = useCallback(async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    setLoading(true);
    
    const [timetableRes, coursesRes] = await Promise.all([
      getTimetableForStudent(userProfile.id, today),
      getCourses()
    ]);

    if (timetableRes.data) setTimetable(timetableRes.data as Timetable[]);
    if (coursesRes.data) setCourses(coursesRes.data as Course[]);
    
    setLoading(false);
  }, [userProfile?.id, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddEntry = async () => {
    if (!userProfile?.id || !selectedCourseId || !location) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    const { error } = await createTimetableEntry({
      student_id: userProfile.id,
      course_id: selectedCourseId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      location: location,
      academic_year: '2025/2026'
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setModalVisible(false);
      fetchData();
      Alert.alert('Success', 'Class added to your schedule.');
    }
    setSubmitting(false);
  };

  const sendTestReminder = async (item: Timetable) => {
    const p = (item as any).courses;
    const msg = `Reminder: Your ${p?.course_name || 'Class'} starts at ${item.start_time?.slice(0, 5)} at ${item.location}. Don't be late!`;
    
    // For demo purposes, we'll ask for a number or use a dummy if we don't have one in profile yet
    // In a real app, this would be scheduled or triggered by a backend
    Alert.prompt(
      'Send Test Reminder',
      'Enter phone number to receive a test SMS reminder for this class:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: async (phone: string | undefined) => {
            if (phone) {
              const res = await sendDialogSms([phone], msg);
              if (res.success) Alert.alert('Sent', 'SMS reminder sent successfully!');
              else Alert.alert('Failed', res.error);
            }
          }
        }
      ]
    );
  };

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
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>University Schedule</Text>
            <Text style={[styles.day, { color: theme.colors.primary }]}>{today}'s Classes</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {timetable.length === 0 ? (
          <View style={styles.center}>
            <View style={[styles.emptyIconBox, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.border} />
            </View>
            <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
              No classes scheduled for today
            </Text>
            <Button 
              label="Add your first class" 
              variant="outline" 
              size="sm" 
              onPress={() => setModalVisible(true)} 
            />
          </View>
        ) : (
          <FlatList
            data={timetable}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item, index }) => {
              const course = (item as any).courses;
              const color = course?.colour || DAY_COLORS[index % DAY_COLORS.length];
              return (
                <Card elevation="sm" variant="secondary" border={false} style={styles.classCard}>
                  <View style={styles.row}>
                    <View style={[styles.timeBox, { backgroundColor: color + '15' }]}>
                      <Text style={[styles.timeText, { color: color }]}>{item.start_time?.slice(0, 5)}</Text>
                      <Text style={[styles.timeSub, { color: theme.colors.textTertiary }]}>AM</Text>
                    </View>
                    <View style={styles.flex}>
                      <View style={styles.cardHeader}>
                         <Text style={[styles.courseCode, { color: color }]}>
                           {course?.course_code || 'N/A'}
                         </Text>
                         <TouchableOpacity onPress={() => sendTestReminder(item)}>
                            <Ionicons name="notifications-outline" size={18} color={theme.colors.primary} />
                         </TouchableOpacity>
                      </View>
                      <Text style={[styles.courseName, { color: theme.colors.text }]} numberOfLines={1}>
                        {course?.course_name || 'Subject'}
                      </Text>
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="location-outline" size={12} color={theme.colors.textTertiary} />
                          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                            {item.location}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                           <Ionicons name="person-outline" size={12} color={theme.colors.textTertiary} />
                           <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                             {course?.lecturer || 'Staff'}
                           </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            }}
          />
        )}

        {/* Add Class Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add New Class</Text>
                 <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color={theme.colors.textTertiary} />
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={styles.label}>Select Course</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll}>
                  {courses.map((c: Course) => (
                    <TouchableOpacity 
                      key={c.id}
                      onPress={() => setSelectedCourseId(c.id)}
                      style={[
                        styles.courseItem, 
                        { 
                          borderColor: selectedCourseId === c.id ? theme.colors.primary : theme.colors.border,
                          backgroundColor: selectedCourseId === c.id ? theme.colors.primary + '10' : theme.colors.backgroundSecondary
                        }
                      ]}
                    >
                      <Text style={{ color: selectedCourseId === c.id ? theme.colors.primary : theme.colors.text }}>{c.course_code}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.label}>Day of Week</Text>
                <View style={styles.dayGrid}>
                   {DAYS_OF_WEEK.map(d => (
                     <TouchableOpacity 
                       key={d} 
                       onPress={() => setDayOfWeek(d)}
                       style={[
                         styles.dayPill, 
                         { 
                           backgroundColor: dayOfWeek === d ? theme.colors.primary : theme.colors.backgroundSecondary 
                         }
                       ]}
                     >
                       <Text style={{ fontSize: 11, color: dayOfWeek === d ? '#fff' : theme.colors.textSecondary }}>{d.slice(0, 3)}</Text>
                     </TouchableOpacity>
                   ))}
                </View>

                <View style={[styles.row, { gap: 16, marginTop: 16 }]}>
                   <View style={styles.flex}>
                     <Input 
                        label="Start Time" 
                        value={startTime} 
                        onChangeText={setStartTime} 
                        placeholder="HH:MM" 
                        leftElement={<Ionicons name="time-outline" size={18} color={theme.colors.textTertiary} />}
                      />
                   </View>
                   <View style={styles.flex}>
                     <Input 
                        label="End Time" 
                        value={endTime} 
                        onChangeText={setEndTime} 
                        placeholder="HH:MM" 
                        leftElement={<Ionicons name="time-outline" size={18} color={theme.colors.textTertiary} />}
                      />
                   </View>
                </View>

                <Input 
                  label="Location / Room" 
                  value={location} 
                  onChangeText={setLocation} 
                  placeholder="e.g. Block A, Room 302" 
                  leftElement={<Ionicons name="location-outline" size={18} color={theme.colors.textTertiary} />}
                />

                <Button 
                  label={submitting ? "Adding..." : "Save Schedule"} 
                  onPress={handleAddEntry} 
                  disabled={submitting}
                  style={{ marginTop: 20 }}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  day: { fontSize: 14, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 16, textAlign: 'center', fontWeight: '500' },
  classCard: { borderRadius: 20, padding: 12 },
  row: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  timeBox: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 16, fontWeight: '800' },
  timeSub: { fontSize: 10, fontWeight: '700' },
  flex: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  courseCode: { fontSize: 12, fontWeight: '800' },
  courseName: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  courseScroll: { marginBottom: 16 },
  courseItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, marginRight: 8 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
});

