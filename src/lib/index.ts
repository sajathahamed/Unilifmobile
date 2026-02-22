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
} from './db';
