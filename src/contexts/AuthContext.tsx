import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthError } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  userType: 'student' | 'employer';
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signUp: (email: string, password: string, userType: 'student' | 'employer', name: string) => Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch user profile data
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          let name = userData.email; // fallback
          
          if (userData.user_type === 'student') {
            const { data: profile } = await supabase
              .from('student_profiles')
              .select('full_name')
              .eq('user_id', user.id)
              .single();
            if (profile) name = profile.full_name;
          } else {
            const { data: profile } = await supabase
              .from('employer_profiles')
              .select('company_name')
              .eq('user_id', user.id)
              .single();
            if (profile) name = profile.company_name;
          }

          setUser({
            id: user.id,
            email: userData.email,
            userType: userData.user_type as 'student' | 'employer',
            name
          });
        }
      }
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
        } else if (event === 'SIGNED_IN' && session) {
          getUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userData) {
          let name = userData.email;
          
          if (userData.user_type === 'student') {
            const { data: profile } = await supabase
              .from('student_profiles')
              .select('full_name')
              .eq('user_id', data.user.id)
              .single();
            if (profile) name = profile.full_name;
          } else {
            const { data: profile } = await supabase
              .from('employer_profiles')
              .select('company_name')
              .eq('user_id', data.user.id)
              .single();
            if (profile) name = profile.company_name;
          }

          const authUser: AuthUser = {
            id: data.user.id,
            email: userData.email,
            userType: userData.user_type as 'student' | 'employer',
            name
          };

          setUser(authUser);
          return { user: authUser, error: null };
        }
      }

      return { user: null, error: new Error('User data not found') as AuthError };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, userType: 'student' | 'employer', name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      if (data.user) {
        // Create user record
        const { error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: email,
              password_hash: '', // This will be handled by auth
              user_type: userType,
            }
          ]);

        if (userError) {
          return { user: null, error: userError as any };
        }

        // Create profile record
        if (userType === 'student') {
          await supabase
            .from('student_profiles')
            .insert([
              {
                user_id: data.user.id,
                full_name: name,
              }
            ]);
        } else {
          await supabase
            .from('employer_profiles')
            .insert([
              {
                user_id: data.user.id,
                company_name: name,
              }
            ]);
        }

        const authUser: AuthUser = {
          id: data.user.id,
          email: email,
          userType: userType,
          name
        };

        setUser(authUser);
        return { user: authUser, error: null };
      }

      return { user: null, error: new Error('Signup failed') as AuthError };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};