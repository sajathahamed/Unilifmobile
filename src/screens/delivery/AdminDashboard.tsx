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
    Modal,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { getPendingDeliveries, getAvailableRiders, assignOrderToRider } from '../../lib/db';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AdminDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const [admin, setAdmin] = useState<any>(null);
    const [foodOrders, setFoodOrders] = useState<any[]>([]);
    const [laundryOrders, setLaundryOrders] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Assignment Modal State
    const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const adminStr = await AsyncStorage.getItem('delivery_admin');
            if (adminStr) setAdmin(JSON.parse(adminStr));

            const [deliveriesRes, ridersRes] = await Promise.all([
                getPendingDeliveries(),
                getAvailableRiders()
            ]);

            if (deliveriesRes.error) {
                console.error('Error fetching deliveries:', deliveriesRes.error);
            } else {
                setFoodOrders(deliveriesRes.food);
                setLaundryOrders(deliveriesRes.laundry);
            }

            if (ridersRes.error) {
                console.error('Error fetching riders:', ridersRes.error);
            } else {
                setRiders(ridersRes.data || []);
            }
        } catch (err) {
            console.error('AdminDashboard load error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const openAssignmentModal = (order: any, type: 'food' | 'laundry') => {
        setSelectedOrder({ ...order, type });
        setAssignmentModalVisible(true);
    };

    const handleAssign = async (riderId: string) => {
        if (!selectedOrder) return;

        setAssigning(true);
        try {
            const { error } = await assignOrderToRider(
                selectedOrder.id,
                selectedOrder.type,
                riderId,
                admin?.id
            );

            if (error) {
                Alert.alert('Assignment Error', 'Successfully failed to assign order.');
            } else {
                Alert.alert('Success', 'Order assigned successfully.');
                setAssignmentModalVisible(false);
                loadData();
            }
        } catch (err) {
            Alert.alert('Error', 'Communication error with server.');
        } finally {
            setAssigning(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('delivery_admin');
        navigation.replace('DeliveryAdminLogin');
    };

    const OrderCard = ({ item, type }: { item: any; type: 'food' | 'laundry' }) => (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => openAssignmentModal(item, type)}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: type === 'food' ? '#FF634720' : '#4169E120' }]}>
                    <Ionicons 
                        name={type === 'food' ? 'restaurant' : 'shirt'} 
                        size={14} 
                        color={type === 'food' ? '#FF6347' : '#4169E1'} 
                    />
                    <Text style={[styles.typeText, { color: type === 'food' ? '#FF6347' : '#4169E1' }]}>
                        {type.toUpperCase()}
                    </Text>
                </View>
                <Text style={[styles.orderRef, { color: theme.colors.textSecondary }]}>#{item.order_ref || item.id}</Text>
            </View>
            
            <View style={styles.cardBody}>
                <Text style={[styles.shopName, { color: theme.colors.text }]}>
                    {type === 'food' ? item.food_stalls?.shop_name : item.laundry_shops?.shop_name}
                </Text>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                        {type === 'food' ? item.food_stalls?.area : item.laundry_shops?.area}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{item.customer_name}</Text>
                </View>
            </View>
            
            <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.priceText, { color: theme.colors.primary }]}>Rs {Number(item.total).toFixed(2)}</Text>
                <View style={[styles.assignBtn, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.assignBtnText}>Assign Rider</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
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
                <View>
                    <Text style={[styles.welcome, { color: theme.colors.textSecondary }]}>Administrator</Text>
                    <Text style={[styles.name, { color: theme.colors.text }]}>Assignment Hub</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: theme.colors.surface }]}>
                    <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Pending Assignments</Text>
                        <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.countText}>{foodOrders.length + laundryOrders.length}</Text>
                        </View>
                    </View>

                    {[...foodOrders.map(o => ({ ...o, type: 'food' })), ...laundryOrders.map(o => ({ ...o, type: 'laundry' }))].map((order) => (
                        <OrderCard key={order.type + order.id} item={order} type={order.type as any} />
                    ))}

                    {foodOrders.length === 0 && laundryOrders.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="sparkles" size={48} color={theme.colors.border} />
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>All caught up!</Text>
                            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>No pending orders to assign.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Rider Assignment Modal */}
            <Modal visible={assignmentModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Rider</Text>
                            <TouchableOpacity onPress={() => setAssignmentModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                            Assigning: {selectedOrder?.order_ref || selectedOrder?.id}
                        </Text>

                        <FlatList
                            data={riders}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.riderCard, { borderColor: theme.colors.border }]}
                                    onPress={() => handleAssign(item.id)}
                                    disabled={assigning}
                                >
                                    <View style={[styles.riderAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
                                        <Ionicons name="person" size={20} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.riderInfo}>
                                        <Text style={[styles.riderName, { color: theme.colors.text }]}>{item.name}</Text>
                                        <Text style={[styles.riderMeta, { color: theme.colors.textSecondary }]}>{item.vehicle_type} • {item.phone}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                <View style={styles.noRiders}>
                                    <Ionicons name="alert-circle-outline" size={32} color={theme.colors.error} />
                                    <Text style={[styles.noRidersText, { color: theme.colors.textSecondary }]}>No online riders available.</Text>
                                </View>
                            )}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />

                        {assigning && (
                            <View style={styles.assigningOverlay}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
    welcome: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
    name: { fontSize: 24, fontWeight: '800' },
    logoutBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    container: { flex: 1 },
    section: { padding: 24, paddingTop: 8 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    countBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
    countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    typeText: { fontSize: 10, fontWeight: '800' },
    orderRef: { fontSize: 12, fontWeight: '600' },
    cardBody: { gap: 4, marginBottom: 12 },
    shopName: { fontSize: 16, fontWeight: '700' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 13 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
    priceText: { fontSize: 15, fontWeight: '800' },
    assignBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    assignBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
    emptyText: { fontSize: 18, fontWeight: '700' },
    emptySubtext: { fontSize: 14, textAlign: 'center' },
    
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    modalSubtitle: { fontSize: 14, marginBottom: 20 },
    riderCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8 },
    riderAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    riderInfo: { flex: 1 },
    riderName: { fontSize: 16, fontWeight: '700' },
    riderMeta: { fontSize: 12, marginTop: 2 },
    noRiders: { alignItems: 'center', padding: 40, gap: 12 },
    noRidersText: { fontSize: 14, fontWeight: '600' },
    assigningOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
});

export default AdminDashboard;
