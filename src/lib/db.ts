import { supabase, isSupabaseConfigured } from './supabase';

// ── Timetable ─────────────────────────────────────────────
export const getTimetableForStudent = async (studentId: number, dayOfWeek?: string) => {
    let query = supabase
        .from('timetable')
        .select(`
      *,
      courses (
        course_code,
        course_name,
        lecturer,
        colour
      )
    `)
        .eq('student_id', studentId);

    if (dayOfWeek) {
        query = query.ilike('day_of_week', dayOfWeek);
    }

    const { data, error } = await query.order('start_time');
    return { data, error };
};

export const createTimetableEntry = async (entry: any) => {
    const { data, error } = await supabase
        .from('timetable')
        .insert(entry)
        .select()
        .single();
    return { data, error };
};

export const getCourses = async () => {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('course_name');
    return { data, error };
};

// ── Vendors ───────────────────────────────────────────────
export const getOpenVendors = async () => {
    const { data, error } = await supabase
        .from('food_stalls')
        .select('*')
        .eq('is_open', true);
    return { data, error };
};

// ── Food Items ────────────────────────────────────────────
export const getFoodItemsByVendor = async (vendorId: number) => {
    const { data, error } = await supabase
        .from('food_items')
        .select(`
      *,
      food_categories (
        name
      )
    `)
        .eq('vendor_id', vendorId)
        .eq('is_available', true)
        .order('name');
    return { data, error };
};

// ── Food Orders ───────────────────────────────────────────
export const createFoodOrder = async (
    foodStallId: string,
    customerEmail: string,
    customerName: string,
    customerPhone: string,
    total: number,
    items?: string,
    notes?: string,
    deliveryAddress?: string,
) => {
    const orderRef = `FO-${Date.now()}`;
    const { data, error } = await supabase
        .from('food_orders')
        .insert({
            food_stall_id: foodStallId,
            customer_email: customerEmail,
            customer_name: customerName,
            customer_phone: customerPhone,
            total,
            items: items || null,
            notes: notes || null,
            delivery_address: deliveryAddress || null,
            order_ref: orderRef,
            status: 'pending',
        })
        .select()
        .single();
    return { data, error };
};

export const createFoodOrderItems = async (
    items: { order_id: number; food_id: number; qty: number; price: number }[]
) => {
    const { data, error } = await supabase.from('food_order_items').insert(items).select();
    return { data, error };
};

export const getFoodOrderById = async (orderId: number) => {
    const { data, error } = await supabase
        .from('food_orders')
        .select('*, food_stalls(shop_name)')
        .eq('id', orderId)
        .single();
    return { data, error };
};

export const getActiveFoodOrderForStudent = async (customerEmail: string) => {
    const { data, error } = await supabase
        .from('food_orders')
        .select('*, food_stalls(shop_name)')
        .eq('customer_email', customerEmail)
        .not('status', 'eq', 'delivered')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    return { data, error };
};

/** All active (non-delivered) food orders for a student — for dashboard count */
export const getActiveFoodOrdersForStudent = async (customerEmail: string) => {
    const { data, error } = await supabase
        .from('food_orders')
        .select('id')
        .eq('customer_email', customerEmail)
        .not('status', 'eq', 'delivered')
        .order('created_at', { ascending: false });
    return { data, error };
};

// ── Laundry ───────────────────────────────────────────────
export const getLaundryServices = async () => {
    if (!isSupabaseConfigured) {
        const err = new Error('Supabase client not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
        console.error(err.message);
        return { data: null, error: err as any };
    }

    const { data, error } = await supabase.from('laundry_services').select('*');
    if (error) console.error('getLaundryServices error:', error);
    else console.log(`getLaundryServices: fetched ${Array.isArray(data) ? data.length : 0} services`);
    return { data, error };
};

export const getLaundryShops = async () => {
    if (!isSupabaseConfigured) {
        const err = new Error('Supabase client not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
        console.error(err.message);
        return { data: null, error: err as any };
    }

    const { data, error } = await supabase
        .from('laundry_shops')
        .select('*')
        .eq('is_open', true);
    if (error) console.error('getLaundryShops error:', error);
    else console.log(`getLaundryShops: fetched ${Array.isArray(data) ? data.length : 0} shops`);
    return { data, error };
};

export const getLaundryOrdersForStudent = async (customerEmail: string) => {
    const { data, error } = await supabase
        .from('laundry_orders')
        .select('*, laundry_shops(shop_name, address)')
        .eq('customer_phone', customerEmail) // Using customer_phone as filter — see note below
        .order('created_at', { ascending: false });
    // NOTE: The schema has no email column on laundry_orders.
    // We filter by customer_phone here, but the caller should pass
    // whichever identifier is most appropriate.
    return { data, error };
};

export const getActiveLaundryOrderForStudent = async (customerEmail: string) => {
    const { data, error } = await supabase
        .from('laundry_orders')
        .select('*, laundry_shops(shop_name, address)')
        .eq('customer_phone', customerEmail)
        .not('status', 'eq', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    return { data, error };
};

export const createLaundryOrder = async (
    laundryShopId: string,
    customerName: string,
    customerPhone: string,
    total: number,
    itemsDescription?: string | null,
    pickupAddress?: string | null,
    deliveryAddress?: string | null,
    notes?: string | null,
    userId?: number | null,
) => {
    const orderRef = `LO-${Date.now()}`;
    const { data, error } = await supabase
        .from('laundry_orders')
        .insert({
            laundry_shop_id: laundryShopId,
            customer_name: customerName,
            customer_phone: customerPhone,
            total,
            status: 'pending',
            items_description: itemsDescription || null,
            pickup_address: pickupAddress || null,
            delivery_address: deliveryAddress || null,
            notes: notes || null,
            order_ref: orderRef,
        })
        .select()
        .single();

    // Create a simple in-app notification for the user so they can see the order
    try {
        if (data && !error && userId) {
            const noteTitle = 'Laundry Order Placed';
            const noteMessage = `Your laundry order (Ref: ${orderRef}) has been placed. Total: Rs ${Number(total).toFixed(2)}.`;
            await supabase.from('notifications').insert({ user_id: userId, title: noteTitle, message: noteMessage });
        }
    } catch (e) {
        console.error('Failed to create notification for laundry order:', e);
    }
    return { data, error };
};

// ── Notifications ─────────────────────────────────────────
export const getNotificationsForUser = async (userId: number) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { data, error };
};

export const markNotificationRead = async (notificationId: number) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    return { error };
};

// ── Trips / Planner ───────────────────────────────────────
export const getTripsForUser = async (userId: number) => {
    const { data, error } = await supabase
        .from('trips')
        .select('*, trip_itinerary(*)')
        .eq('user_id', userId)
        .order('id', { ascending: false });
    return { data, error };
};

export const createTrip = async (
    destination: string,
    days: number,
    budget: number,
    userId: number
) => {
    const { data, error } = await supabase
        .from('trips')
        .insert({
            destination,
            days,
            budget,
            user_id: userId,
            status: 'planning',
        })
        .select()
        .single();
    return { data, error };
};

export const updateTripWithAI = async (tripId: number, aiSummary: string) => {
    const { data, error } = await supabase
        .from('trips')
        .update({ ai_summary: aiSummary })
        .eq('id', tripId)
        .select()
        .single();
    return { data, error };
};

// ── Trip Plans (Enhanced) ─────────────────────────────────
export interface TripPlanInsert {
    user_id: number;
    destination: string;
    days: number;
    budget_lkr: number;
    travelers: number;
    room_type: string;
    travel_type?: string;
    transport_mode?: string;
    food_preference?: string;
    summary?: string;
    itinerary_json?: any;
    hotel_details_json?: any;
    food_places_json?: any;
    transport_details_json?: any;
    cost_breakdown_json?: any;
    travel_tips_json?: any;
    total_cost_lkr: number;
    total_cost_usd?: number;
    budget_sufficient?: boolean;
    budget_message?: string;
}

export const createTripPlan = async (tripPlan: TripPlanInsert) => {
    const { data, error } = await supabase
        .from('trip_plans')
        .insert({
            ...tripPlan,
            status: 'active',
        })
        .select()
        .single();
    return { data, error };
};

export const getTripPlansForUser = async (userId: number, status: 'active' | 'void' | 'all' = 'active') => {
    let query = supabase
        .from('trip_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    return { data, error };
};

export const getTripPlanById = async (tripPlanId: number) => {
    const { data, error } = await supabase
        .from('trip_plans')
        .select('*')
        .eq('id', tripPlanId)
        .single();
    return { data, error };
};

export const voidTripPlan = async (tripPlanId: number, reason?: string) => {
    const { data, error } = await supabase
        .from('trip_plans')
        .update({
            status: 'void',
            voided_at: new Date().toISOString(),
            void_reason: reason || 'Voided by user',
        })
        .eq('id', tripPlanId)
        .select()
        .single();
    return { data, error };
};

export const getVoidedTripPlans = async (userId: number) => {
    const { data, error } = await supabase
        .from('trip_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'void')
        .order('voided_at', { ascending: false });
    return { data, error };
};

// ── User with Google Auth ─────────────────────────────────
export const upsertUserGoogle = async (email: string, name: string, googleId: string, photoUrl?: string) => {
    // First try to find existing user
    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .or(`google_id.eq.${googleId},email.eq.${email}`)
        .single();

    if (existingUser) {
        // Update existing user
        const { data, error } = await supabase
            .from('users')
            .update({
                name: name || existingUser.name,
                google_id: googleId,
                photo_url: photoUrl,
                auth_provider: 'google',
            })
            .eq('id', existingUser.id)
            .select()
            .single();
        return { data, error, isNewUser: false };
    }

    // Create new user
    const { data, error } = await supabase
        .from('users')
        .insert({
            name,
            email,
            role: 'student',
            google_id: googleId,
            photo_url: photoUrl,
            auth_provider: 'google',
        } as any)
        .select()
        .single();
    return { data, error, isNewUser: true };
};

// ── Delivery System (Multi-Role) ─────────────────────

export const deliveryAdminLogin = async (email: string, passwordHash: string) => {
    // Simple verification against the new delivery_admins table
    const { data, error } = await supabase
        .from('delivery_admins')
        .select('*')
        .eq('email', email)
        .eq('password_hash', passwordHash) // In real app, use bcrypt/auth-provider
        .maybeSingle();
    return { data, error };
};

export const deliveryPersonLogin = async (email: string, passwordHash: string) => {
    const { data, error } = await supabase
        .from('delivery_persons')
        .select('*')
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .maybeSingle();
    return { data, error };
};

export const getAvailableRiders = async () => {
    const { data, error } = await supabase
        .from('delivery_persons')
        .select('*')
        .eq('status', 'online');
    return { data, error };
};

export const getPendingDeliveries = async () => {
    // Fetch unassigned orders from both sources
    const { data: food, error: foodErr } = await supabase
        .from('food_orders')
        .select('*, food_stalls(shop_name, area)')
        .eq('delivery_status', 'not_assigned')
        .order('created_at', { ascending: true });

    const { data: laundry, error: laundryErr } = await supabase
        .from('laundry_orders')
        .select('*, laundry_shops(shop_name, area)')
        .eq('delivery_status', 'not_assigned')
        .order('created_at', { ascending: true });

    return { 
        food: food || [], 
        laundry: laundry || [], 
        error: foodErr || laundryErr 
    };
};

export const assignOrderToRider = async (
    orderId: number, 
    orderType: 'food' | 'laundry', 
    riderId: string,
    adminId?: string
) => {
    const table = orderType === 'food' ? 'food_orders' : 'laundry_orders';
    
    // 1. Update the order table
    const { data, error } = await supabase
        .from(table)
        .update({
            assigned_delivery_person_id: riderId,
            delivery_status: 'assigned'
        } as any)
        .eq('id', orderId)
        .select()
        .single();

    // 2. Log in assignments history if successful
    if (!error && data) {
        await supabase.from('delivery_assignments').insert({
            order_id: orderId,
            order_type: orderType,
            delivery_person_id: riderId,
            assigned_by_admin_id: adminId || null,
            status: 'assigned'
        });
    }

    return { data, error };
};

export const getRiderAssignedOrders = async (riderId: string) => {
    const { data: food, error: foodErr } = await supabase
        .from('food_orders')
        .select('*, food_stalls(shop_name, area, lat, lng)')
        .eq('assigned_delivery_person_id', riderId)
        .not('delivery_status', 'eq', 'delivered');

    const { data: laundry, error: laundryErr } = await supabase
        .from('laundry_orders')
        .select('*, laundry_shops(shop_name, area, lat, lng)')
        .eq('assigned_delivery_person_id', riderId)
        .not('delivery_status', 'eq', 'delivered');

    return { 
        orders: [
            ...(food || []).map(f => ({ ...f, type: 'food' })), 
            ...(laundry || []).map(l => ({ ...l, type: 'laundry' }))
        ], 
        error: foodErr || laundryErr 
    };
};

export const updateDeliveryStatus = async (
    orderId: number, 
    orderType: 'food' | 'laundry', 
    status: string
) => {
    const table = orderType === 'food' ? 'food_orders' : 'laundry_orders';
    const { data, error } = await supabase
        .from(table)
        .update({ delivery_status: status } as any)
        .eq('id', orderId)
        .select()
        .single();

    // If delivered, update assignment record too
    if (!error && status === 'delivered') {
        await supabase
            .from('delivery_assignments')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('order_id', orderId)
            .eq('order_type', orderType);
    }

    return { data, error };
};

export const updateRiderAvailability = async (riderId: string, status: 'online' | 'offline' | 'busy') => {
    const { data, error } = await supabase
        .from('delivery_persons')
        .update({ status } as any)
        .eq('id', riderId)
        .select()
        .single();
    return { data, error };
};

