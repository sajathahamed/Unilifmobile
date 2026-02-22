import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { UserRole, User } from './database';

export type { User, UserRole } from './database';

export interface AuthState {
  user: SupabaseUser | null;
  userProfile: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  FoodMenu: { vendorId: number; vendorName: string };
  Cart: undefined;
  OrderTracking: { orderId: number };
};

export type MainTabParamList = {
  Home: undefined;
  Food: undefined;
  Laundry: undefined;
  Planner: undefined;
  Profile: undefined;
};

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  vendorId: number;
  vendorName: string;
  imageUrl?: string;
}

export interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalCount: number;
}

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}
