import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    RefreshControl,
    Switch,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { getRiderAssignedOrders, updateDeliveryStatus, updateRiderAvailability, getRiderAvailability } from '../../lib/db';
import { useAuth } from '@context/AuthContext';

export const DeliveryPersonDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const { userProfile, signOut } = useAuth();
    const [rider, setRider] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

    useEffect(() => {
        console.log('🚴 [RIDER] Dashboard mounted', { userId: userProfile?.id, userName: userProfile?.name });
        loadRider();
    }, [userProfile?.id]);

    const loadRider = async () => {
        setLoading(true);
        console.log('📥 [RIDER] Loading rider profile and orders...');
        try {
            if (userProfile) {
                const { status } = await getRiderAvailability(String(userProfile.id));
                console.log('✅ [RIDER] Status loaded:', status);
                const riderData = {
                    id: userProfile.id,
                    name: userProfile.name,
                    email: userProfile.email,
                    status,
                };
                setRider(riderData);
                setIsOnline(status === 'online');
                await fetchOrders(String(riderData.id));
            }
        } catch (err) {
            console.error('❌ [RIDER] Rider load error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchOrders = async (riderId: string) => {
        try {
            console.log('📦 [RIDER] Fetching assigned orders for riderId:', riderId);
            const { orders: riderOrders, error } = await getRiderAssignedOrders(riderId);
            if (!error) {
                console.log('✅ [RIDER] Orders loaded:', riderOrders?.length || 0);
                setOrders(riderOrders || []);
            } else {
                console.error('❌ [RIDER] Error fetching orders:', error);
            }
        } catch (err) {
            console.error('❌ [RIDER] Fetch orders error:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        if (rider) {
            setRefreshing(true);
            fetchOrders(rider.id);
        }
    }, [rider]);

    const toggleAvailability = async (value: boolean) => {
        if (!rider) return;

        const newStatus = value ? 'online' : 'offline';
        console.log('🔄 [RIDER] Updating availability:', { riderId: rider.id, newStatus });
        const { error } = await updateRiderAvailability(rider.id, newStatus);
        
        if (!error) {
            console.log('✅ [RIDER] Status updated successfully:', newStatus);
            setIsOnline(value);
            const updatedRider = { ...rider, status: newStatus };
            setRider(updatedRider);
        } else {
            console.error('❌ [RIDER] Status sync failed:', error);
            Alert.alert('Status Sync Failed', 'Check your connection.');
        }
    };

    const handleStatusUpdate = async (orderId: number, type: 'food' | 'laundry', currentStatus: string) => {
        let nextStatus = '';
        let confirmMsg = '';

        if (currentStatus === 'assigned') {
            nextStatus = 'picked_up';
            confirmMsg = 'Confirming that you have picked up this order?';
        } else if (currentStatus === 'picked_up') {
            nextStatus = 'delivered';
            confirmMsg = 'Confirming successful delivery of this order?';
        } else {
            return;
        }

        Alert.alert(
            'Update Status',
            confirmMsg,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setUpdatingStatus(orderId);
                        console.log('📤 [RIDER] Updating order status:', { orderId, type, currentStatus, nextStatus });
                        const { error } = await updateDeliveryStatus(orderId, type, nextStatus);
                        if (error) {
                            console.error('❌ [RIDER] Status update failed:', error);
                            Alert.alert('Update Failed', 'Failed to update order status.');
                        } else {
                            console.log('✅ [RIDER] Order status updated:', { orderId, newStatus: nextStatus });
                            if (rider) fetchOrders(rider.id);
                        }
                        setUpdatingStatus(null);
                    }
                }
            ]
        );
    };

    const openMaps = (lat: number, lng: number) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        Linking.openURL(url);
    };

    const handleLogout = async () => {
        if (isOnline) {
            Alert.alert('Active Shift', 'Please go offline before logging out.');
            return;
        }
        await signOut();
    };

    const OrderCard = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: item.type === 'food' ? '#FF634720' : '#4169E120' }]}>
                    <Ionicons 
                        name={item.type === 'food' ? 'restaurant' : 'shirt'} 
                        size={14} 
                        color={item.type === 'food' ? '#FF6347' : '#4169E1'} 
                    />
                    <Text style={[styles.typeText, { color: item.type === 'food' ? '#FF6347' : '#4169E1' }]}>
                        {item.type.toUpperCase()}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.delivery_status === 'assigned' ? '#F59E0B20' : '#22C55E20' }]}>
                    <Text style={[styles.statusText, { color: item.delivery_status === 'assigned' ? '#F59E0B' : '#22C55E' }]}>
                        {item.delivery_status?.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={[styles.shopName, { color: theme.colors.text }]}>
                    {item.type === 'food' ? item.food_stalls?.shop_name : item.laundry_shops?.shop_name}
                </Text>
                <Text style={[styles.customerName, { color: theme.colors.textSecondary }]}>To: {item.customer_name}</Text>
                <Text style={[styles.customerName, { color: theme.colors.textSecondary }]}>Contact: {item.customer_phone || 'No phone available'}</Text>
                <View style={styles.addressRow}>
                    <Ionicons name="location" size={16} color={theme.colors.error} />
                    <Text style={[styles.addressText, { color: theme.colors.text }]} numberOfLines={2}>
                        {item.delivery_address || 'Address not specified'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                {(item.lat && item.lng) && (
                    <TouchableOpacity 
                        style={[styles.actionBtn, { borderColor: theme.colors.primary }]}
                        onPress={() => openMaps(item.lat, item.lng)}
                    >
                        <Ionicons name="navigate-circle-outline" size={20} color={theme.colors.primary} />
                        <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Navigate</Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                    style={[styles.statusBtn, { 
                        backgroundColor: item.delivery_status === 'assigned' ? theme.colors.primary : theme.colors.success 
                    }]}
                    onPress={() => handleStatusUpdate(item.id, item.type, item.delivery_status)}
                    disabled={updatingStatus === item.id}
                >
                    {updatingStatus === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name={item.delivery_status === 'assigned' ? 'cube-outline' : 'checkmark-circle-outline'} size={20} color="#fff" />
                            <Text style={styles.statusBtnText}>
                                {item.delivery_status === 'assigned' ? 'Picked Up' : 'Mark Delivered'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
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
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={[styles.welcome, { color: theme.colors.textSecondary }]}>Delivery Pilot</Text>
                        <Text style={[styles.title, { color: theme.colors.text }]}>{rider?.name || 'Rider'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>
                
                <View style={[styles.statusSwitchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={styles.statusLabelGroup}>
                        <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.colors.success : theme.colors.error }]} />
                        <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
                            {isOnline ? 'Active Shift (Online)' : 'Off Duty (Offline)'}
                        </Text>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={toggleAvailability}
                        trackColor={{ false: theme.colors.border, true: theme.colors.success + '50' }}
                        thumbColor={isOnline ? theme.colors.success : theme.colors.textSecondary}
                    />
                </View>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.type + item.id}
                renderItem={({ item }) => <OrderCard item={item} />}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bicycle" size={64} color={theme.colors.border} />
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No active tasks</Text>
                        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                            {isOnline ? "Waiting for orders to be assigned..." : "Please go online to receive tasks."}
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
    header: { padding: 20, paddingTop: 24, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    welcome: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
    title: { fontSize: 24, fontWeight: '800', marginTop: 4 },
    logoutBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    statusSwitchBar: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 12, 
        paddingHorizontal: 16, 
        borderRadius: 16, 
        borderWidth: 1,
        elevation: 2,
    },
    statusLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusLabel: { fontSize: 14, fontWeight: '700' },
    listContainer: { padding: 16, paddingTop: 0, paddingBottom: 32 },
    card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, elevation: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    typeText: { fontSize: 11, fontWeight: '800' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '800' },
    cardBody: { gap: 6, marginBottom: 20 },
    shopName: { fontSize: 18, fontWeight: '800' },
    customerName: { fontSize: 14, fontWeight: '600' },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
    addressText: { flex: 1, fontSize: 14, lineHeight: 20 },
    cardActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, borderWidth: 1.5, gap: 8 },
    actionBtnText: { fontSize: 14, fontWeight: '700' },
    statusBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8, elevation: 2 },
    statusBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 120, gap: 12 },
    emptyText: { fontSize: 20, fontWeight: '800' },
    emptySubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
});

export default DeliveryPersonDashboard;
