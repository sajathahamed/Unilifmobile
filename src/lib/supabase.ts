import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database, UserRole } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Use AsyncStorage — SecureStore has a 2048-byte limit which JWT sessions exceed
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error.message);
  }

  return { data, error };
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  role: string = 'student'
) => {
  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (authError) {
    return { data: null, error: authError };
  }

  // Insert user into users table
  if (authData.user) {
    const payload: Database['public']['Tables']['users']['Insert'] = {
      name,
      email,
      role: role as UserRole,
    };

    const { error: insertError } = await supabase.from('users').insert(payload);

    if (insertError) {
      console.error('Error inserting user into database:', insertError);
    }
  }

  return { data: authData, error: null };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'unilife://auth/reset-password',
  });
  return { data, error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Get user role from database
export const getUserRole = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', email)
    .single();

  return { role: (data?.role as UserRole) || 'student', error };
};

// Get user profile from database
export const getUserProfile = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  return { data, error };
};
