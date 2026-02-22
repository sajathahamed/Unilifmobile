import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { AuthContextType, AuthState, User } from '@app-types/index';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  resetPassword as supabaseResetPassword,
  getUserRole,
  getUserProfile,
  signInWithGoogle as supabaseSignInWithGoogle,
  getSession,
  onAuthStateChange,
} from '@lib/index';
import { supabase } from '@lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    session: null,
    loading: true,
    error: null,
  });

  // Load initial session
  useEffect(() => {
    const init = async () => {
      const { session } = await getSession();
      if (session?.user) {
        const { role } = await getUserRole(session.user.email || '');
        const { data: profile } = await getUserProfile(session.user.email || '');
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          userProfile: profile ?? null,
          loading: false,
          error: null,
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    init();

    const { data: authListener } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { role } = await getUserRole(session.user.email || '');
        const { data: profile } = await getUserProfile(session.user.email || '');
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          userProfile: profile ?? null,
          loading: false,
          error: null,
        }));
      } else {
        setState({ user: null, userProfile: null, session: null, loading: false, error: null });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { error } = await signInWithEmail(email, password);
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }
    setState(prev => ({ ...prev, loading: false, error: null }));
    return { success: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { error } = await signUpWithEmail(email, password, name, 'student');
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }
    setState(prev => ({ ...prev, loading: false, error: null }));
    return { success: true };
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    const { error } = await supabaseSignOut();
    if (error) {
      Alert.alert('Sign out error', error.message);
    }
    setState({ user: null, userProfile: null, session: null, loading: false, error: null });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { error } = await supabaseResetPassword(email);
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }
    setState(prev => ({ ...prev, loading: false, error: null }));
    return { success: true };
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await getUserProfile(session.user.email || '');
      setState(prev => ({ ...prev, user: session.user, session, userProfile: profile ?? null }));
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { error } = await supabaseSignInWithGoogle();
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }
    setState(prev => ({ ...prev, loading: false, error: null }));
    return { success: true };
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      resetPassword,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
