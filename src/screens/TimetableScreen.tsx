import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '@components/ui/Card';
import { useTheme } from '@theme/index';

const sampleTimetable = [
  { day: 'Monday', course: 'CS101', time: '09:00 - 10:30', location: 'Room 201' },
  { day: 'Tuesday', course: 'Math 201', time: '11:00 - 12:30', location: 'Room 105' },
  { day: 'Wednesday', course: 'Physics 101', time: '14:00 - 15:30', location: 'Lab 3' },
];

export const TimetableScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      {sampleTimetable.map((item, index) => (
        <Card key={index} elevated style={{ marginBottom: 12 }}>
          <Text style={[styles.day, { color: theme.colors.primary }]}>{item.day}</Text>
          <Text style={[styles.course, { color: theme.colors.text }]}>{item.course}</Text>
          <Text style={{ color: theme.colors.textSecondary }}>{item.time} • {item.location}</Text>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  day: {
    fontSize: 14,
    fontWeight: '700',
  },
  course: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 4,
  },
});
