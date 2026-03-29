import { useCallback, useEffect, useState } from 'react';
import {
  getTimetableForStudent,
  getLaundryOrdersForStudent,
  getTripPlansForUser,
  getActiveFoodOrdersForStudent,
} from '@lib/index';
import { useAuth } from '@context/AuthContext';

export interface NextClass {
  subject: string;
  time: string;
  room: string | null;
}

export interface UpcomingEvent {
  id: number;
  type: 'class' | 'trip';
  title: string;
  time: string;
  subtitle?: string;
  location?: string;
}

export interface DashboardStats {
  laundryCount: number;
  tripCount: number;
  foodCount: number;
  nextClass: NextClass | null;
  upcomingEvents: UpcomingEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const REFRESH_INTERVAL_MS = 60 * 1000;

export function useDashboardStats(): DashboardStats {
  const { userProfile } = useAuth();
  const [laundryCount, setLaundryCount] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [foodCount, setFoodCount] = useState(0);
  const [nextClass, setNextClass] = useState<NextClass | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);

    const studentId = userProfile.id;
    const email = userProfile.email || '';
    const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    try {
      const [timetableRes, laundryRes, tripRes, foodRes] = await Promise.all([
        getTimetableForStudent(studentId, today),
        getLaundryOrdersForStudent(email),
        getTripPlansForUser(studentId, 'active'),
        getActiveFoodOrdersForStudent(email),
      ]);

      if (laundryRes.data && Array.isArray(laundryRes.data)) {
        const active = (laundryRes.data as any[]).filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled');
        setLaundryCount(active.length);
      } else {
        setLaundryCount(0);
      }

      if (tripRes.data && Array.isArray(tripRes.data)) {
        setTripCount(tripRes.data.length);
      } else {
        setTripCount(0);
      }

      if (foodRes.data && Array.isArray(foodRes.data)) {
        setFoodCount(foodRes.data.length);
      } else {
        setFoodCount(0);
      }

        // Process Classes
        const classes = (timetableRes.data as any[]) || [];
        const withTime = classes
          .filter((c: any) => c.start_time)
          .map((c: any) => {
            const [h, m] = (c.start_time || '').toString().split(':').map(Number);
            return { ...c, startMinutes: (h || 0) * 60 + (m || 0) };
          })
          .sort((a: any, b: any) => a.startMinutes - b.startMinutes);
        
        const next = withTime.find((c: any) => c.startMinutes >= nowMinutes) || withTime[0];
        if (next) {
          setNextClass({
            subject: (next.courses?.course_name as string) || 'Class',
            time: (next.start_time || '').toString().slice(0, 5),
            room: next.location || null,
          });
        } else {
          setNextClass(null);
        }

        const classEvents: UpcomingEvent[] = withTime.slice(0, 3).map((c: any) => ({
          id: c.id,
          type: 'class' as const,
          title: (c.courses?.course_name as string) || 'Class',
          time: (c.start_time || '').toString().slice(0, 5),
          subtitle: c.location || (c.courses?.lecturer as string),
        }));

        // Process Trip Schedule (Itinerary)
        const tripEvents: UpcomingEvent[] = [];
        if (tripRes.data && Array.isArray(tripRes.data) && tripRes.data.length > 0) {
          const activeTrip = tripRes.data[0]; // Take most recent active trip
          const itinerary = activeTrip.itinerary_json;
          
          if (itinerary && Array.isArray(itinerary)) {
             // Extract 3 activities from day 1 or current day
             const dailyActivities = itinerary[0]?.activities || [];
             dailyActivities.slice(0, 3).forEach((act: any, idx: number) => {
                tripEvents.push({
                   id: 10000 + idx, // offset ID
                   type: 'trip',
                   title: act.activity,
                   time: act.time,
                   subtitle: activeTrip.destination,
                   location: act.location
                });
             });
          }
        }

        setUpcomingEvents([...tripEvents, ...classEvents].slice(0, 5));
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, userProfile?.email]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const id = setInterval(fetchStats, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchStats]);

  return {
    laundryCount,
    tripCount,
    foodCount,
    nextClass,
    upcomingEvents,
    loading,
    error,
    refetch: fetchStats,
  };
}
