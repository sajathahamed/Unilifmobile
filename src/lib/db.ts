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

// ── Vendors ───────────────────────────────────────────────
export const getOpenVendors = async () => {
    const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_open', true)
        .order('rating', { ascending: false });
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
    studentId: number,
    vendorId: number,
    total: number
) => {
    const { data, error } = await supabase
        .from('food_orders')
        .insert({ student_id: studentId, vendor_id: vendorId, total, status: 'pending' })
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
        .select('*, vendors(name)')
        .eq('id', orderId)
        .single();
    return { data, error };
};

export const getActiveFoodOrderForStudent = async (studentId: number) => {
    const { data, error } = await supabase
        .from('food_orders')
        .select('*, vendors(name)')
        .eq('student_id', studentId)
        .not('status', 'eq', 'delivered')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
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

export const getLaundryOrdersForStudent = async (studentId: number) => {
    const { data, error } = await supabase
        .from('laundry_orders')
        .select('*, laundry_services(name, location)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
    return { data, error };
};

export const getActiveLaundryOrderForStudent = async (studentId: number) => {
    const { data, error } = await supabase
        .from('laundry_orders')
        .select('*, laundry_services(name, location)')
        .eq('student_id', studentId)
        .not('status', 'eq', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    return { data, error };
};

export const createLaundryOrder = async (
    studentId: number,
    laundryServiceId: number,
    orderType: string,
    totalPrice: number,
    itemsJson?: Record<string, number> | null,
    imageUrl?: string | null
) => {
    const { data, error } = await supabase
        .from('laundry_orders')
        .insert({
            student_id: studentId,
            laundry_service_id: laundryServiceId,
            order_type: orderType,
            total_price: totalPrice,
            status: 'pending',
            items_json: itemsJson,
            image_url: imageUrl,
        })
        .select()
        .single();

    // Create a simple in-app notification for the student so they can see the order
    try {
        if (data && !error) {
            const noteTitle = 'Laundry Order Placed';
            const noteMessage = `Your laundry order (ID: ${data.id}) with ${
                laundryServiceId
            } has been placed. Total: RM ${Number(totalPrice).toFixed(2)}.`;
            await supabase.from('notifications').insert({ user_id: studentId, title: noteTitle, message: noteMessage });
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
        .eq('created_by', userId)
        .order('id', { ascending: false });
    return { data, error };
};

export const createTrip = async (
    destination: string,
    days: number,
    estimatedBudget: number,
    createdBy: number
) => {
    const { data, error } = await supabase
        .from('trips')
        .insert({
            destination,
            days,
            estimated_budget: estimatedBudget,
            created_by: createdBy,
            status: 'planning',
        })
        .select()
        .single();
    return { data, error };
};

export const updateTripWithAI = async (tripId: number, aiSuggestions: string) => {
    const { data, error } = await supabase
        .from('trips')
        .update({ ai_suggestions: aiSuggestions })
        .eq('id', tripId)
        .select()
        .single();
    return { data, error };
};
