export { supabase, signInWithEmail, signUpWithEmail, signOut, resetPassword, getCurrentUser, getSession, getUserRole, getUserProfile } from './supabase';
export { signInWithGoogle, onAuthStateChange } from './google-auth';
export {
    getTimetableForStudent,
    getOpenVendors,
    getFoodCourtStalls,
    getFoodStallById,
    getFoodItemsByVendor,
    getFoodMenuByVendor,
    createFoodOrder,
    createFoodOrderItems,
    getFoodOrderById,
    getActiveFoodOrderForStudent,
    getActiveFoodOrdersForStudent,
    getLaundryServices,
    getLaundryShops,
    getLaundryOrdersForStudent,
    getActiveLaundryOrderForStudent,
    createLaundryOrder,
    getNotificationsForUser,
    markNotificationRead,
    getTripsForUser,
    createTrip,
    updateTripWithAI,
    // New trip plan functions
    createTripPlan,
    getTripPlansForUser,
    getTripPlanById,
    voidTripPlan,
    getVoidedTripPlans,
    upsertUserGoogle,
    createTimetableEntry,
    getCourses,
} from './db';
export type { TripPlanInsert, FoodCategoryWithItems } from './db';

