export { supabase, signInWithEmail, signUpWithEmail, signOut, resetPassword, getCurrentUser, getSession, getUserRole, getUserProfile } from './supabase';
export { signInWithGoogle, onAuthStateChange } from './google-auth';
export {
    getTimetableForStudent,
    getOpenVendors,
    getFoodItemsByVendor,
    createFoodOrder,
    createFoodOrderItems,
    getFoodOrderById,
    getActiveFoodOrderForStudent,
    getLaundryServices,
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
} from './db';
export type { TripPlanInsert } from './db';

