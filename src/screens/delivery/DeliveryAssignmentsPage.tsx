import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@context/AuthContext';

export const DeliveryAssignmentsPage: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const { userProfile } = useAuth();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAssignments();
    }, [userProfile?.id]);

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('delivery_assignments')
                .select(`
                    id,
                    order_id,
                    order_type,
                    delivery_person_id,
                    assigned_by_admin_id,
                    status,
                    assigned_at,
                    completed_at
                `)
                .or(`delivery_person_id.eq.${userProfile?.id},assigned_by_admin_id.eq.${userProfile?.id}`)
                .order('assigned_at', { ascending: false });

            if (!error && data) {
                setAssignments(data);
            }
        } catch (err) {
            console.error('Load assignments error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAssignments();
    }, []);

    const AssignmentCard = ({ item }: { item: any }) => {
        const statusColor =
            item.status === 'completed'
                ? theme.colors.success
                : item.status === 'cancelled'
                ? theme.colors.error
                : theme.colors.primary;

        return (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.typeBadge, { 
                        backgroundColor: item.order_type === 'food' ? '#FF634720' : '#4169E120'
                    }]}>
                        <Ionicons
                            name={item.order_type === 'food' ? 'restaurant' : 'shirt'}
                            size={14}
                            color={item.order_type === 'food' ? '#FF6347' : '#4169E1'}
                        />
                        <Text style={[styles.typeText, { 
                            color: item.order_type === 'food' ? '#FF6347' : '#4169E1'
                        }]}>
                            {item.order_type.toUpperCase()}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="cube-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            Order #{item.order_id}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            Assigned: {new Date(item.assigned_at).toLocaleDateString()} {new Date(item.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    {item.completed_at && (
                        <View style={styles.infoRow}>
                            <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.success} />
                            <Text style={[styles.infoText, { color: theme.colors.success }]}>
                                Completed: {new Date(item.completed_at).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>Assignment History</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={assignments}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => <AssignmentCard item={item} />}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-done-outline" size={64} color={theme.colors.border} />
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No assignments yet</Text>
                        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                            Assignments will appear here once orders are assigned.
                        </Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#0001'
    },
    title: { fontSize: 20, fontWeight: '800' },
    listContainer: { padding: 16, paddingBottom: 32 },
    card: { 
        borderRadius: 16, 
        borderWidth: 1, 
        padding: 16, 
        marginBottom: 12,
        elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    typeText: { fontSize: 11, fontWeight: '800' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '800' },
    cardBody: { gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 13 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 16 },
    emptyText: { fontSize: 18, fontWeight: '700' },
    emptySubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});

export default DeliveryAssignmentsPage;
