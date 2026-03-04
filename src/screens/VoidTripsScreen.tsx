import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useAuth } from '@context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getVoidedTripPlans } from '@lib/db';

interface VoidedTrip {
    id: number;
    destination: string;
    days: number;
    travelers: number;
    budget_lkr: number;
    total_cost_lkr: number;
    room_type: string;
    travel_type: string;
    summary: string;
    voided_at: string;
    void_reason: string;
    created_at: string;
}

export const VoidTripsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const { userProfile } = useAuth();

    const [trips, setTrips] = useState<VoidedTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadVoidedTrips = useCallback(async () => {
        if (!userProfile?.id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await getVoidedTripPlans(userProfile.id);
            if (error) {
                console.error('Error loading voided trips:', error);
                Alert.alert('Error', 'Failed to load voided trips');
            } else {
                setTrips(data || []);
            }
        } catch (error) {
            console.error('Load voided trips error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userProfile?.id]);

    useEffect(() => {
        loadVoidedTrips();
    }, [loadVoidedTrips]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadVoidedTrips();
    }, [loadVoidedTrips]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatLKR = (amount: number) => {
        return `LKR ${amount?.toLocaleString() || '0'}`;
    };

    const renderTripCard = ({ item }: { item: VoidedTrip }) => (
        <Card elevated>
            <View style={styles.tripCard}>
                <View style={[styles.iconBox, { backgroundColor: '#EF444420' }]}>
                    <Ionicons name="close-circle-outline" size={28} color="#EF4444" />
                </View>
                <View style={styles.tripInfo}>
                    <Text style={[styles.destText, { color: theme.colors.text }]}>{item.destination}</Text>
                    <Text style={[styles.tripMeta, { color: theme.colors.textSecondary }]}>
                        {item.days} day{item.days > 1 ? 's' : ''} · {item.travelers} traveler{item.travelers > 1 ? 's' : ''}
                    </Text>
                    <Text style={[styles.tripMeta, { color: theme.colors.textSecondary }]}>
                        Budget: {formatLKR(item.budget_lkr)} · Est: {formatLKR(item.total_cost_lkr)}
                    </Text>
                    <View style={styles.tripTags}>
                        <View style={[styles.tag, { backgroundColor: theme.colors.backgroundSecondary }]}>
                            <Ionicons name="person-outline" size={10} color={theme.colors.textSecondary} />
                            <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                                {item.travel_type || 'solo'}
                            </Text>
                        </View>
                        <View style={[styles.tag, { backgroundColor: theme.colors.backgroundSecondary }]}>
                            <Ionicons name="bed-outline" size={10} color={theme.colors.textSecondary} />
                            <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                                {item.room_type || 'standard'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.voidInfo, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                        <Ionicons name="information-circle-outline" size={14} color="#DC2626" />
                        <View style={styles.voidInfoText}>
                            <Text style={[styles.voidedAt, { color: '#DC2626' }]}>
                                Voided: {formatDate(item.voided_at)}
                            </Text>
                            {item.void_reason && (
                                <Text style={[styles.voidReason, { color: '#7F1D1D' }]}>
                                    Reason: {item.void_reason}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#EF444420' }]}>
                    <Text style={[styles.statusText, { color: '#EF4444' }]}>Voided</Text>
                </View>
            </View>
        </Card>
    );

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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>Voided Trips</Text>
                <View style={{ width: 40 }} />
            </View>

            <ResponsiveContainer>
                {trips.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="trash-outline" size={64} color={theme.colors.border} />
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No voided trips</Text>
                        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                            Trips that you void will appear here
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={trips}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={{ padding: 16 }}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        renderItem={renderTripCard}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[theme.colors.primary]}
                                tintColor={theme.colors.primary}
                            />
                        }
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontSize: 20, fontWeight: '800' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    emptySubtext: { fontSize: 14, marginTop: -8, textAlign: 'center' },
    tripCard: { flexDirection: 'row', alignItems: 'flex-start' },
    iconBox: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    tripInfo: { flex: 1 },
    destText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    tripMeta: { fontSize: 12, marginBottom: 4 },
    tripTags: { flexDirection: 'row', gap: 6, marginBottom: 8 },
    tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    tagText: { fontSize: 10, textTransform: 'capitalize' },
    voidInfo: { 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        gap: 6, 
        padding: 8, 
        borderRadius: 8, 
        borderWidth: 1,
    },
    voidInfoText: { flex: 1 },
    voidedAt: { fontSize: 11, fontWeight: '600' },
    voidReason: { fontSize: 10, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});

export default VoidTripsScreen;
