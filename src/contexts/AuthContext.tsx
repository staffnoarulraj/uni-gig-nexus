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

  const getUserProfile = async (userId: string): Promise<AuthUser | null> => {
    // Try student profile first
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single();

    if (studentProfile) {
      const { data: authUser } = await supabase.auth.getUser();
      return {
        id: userId,
        email: authUser.user?.email || '',
        userType: 'student',
        name: studentProfile.full_name
      };
    }

    // Try employer profile
    const { data: employerProfile } = await supabase
      .from('employer_profiles')
      .select('company_name')
      .eq('user_id', userId)
      .single();

    if (employerProfile) {
      const { data: authUser } = await supabase.auth.getUser();
      return {
        id: userId,
        email: authUser.user?.email || '',
        userType: 'employer',
        name: employerProfile.company_name
      };
    }

    return null;
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const userProfile = await getUserProfile(authUser.id);
        setUser(userProfile);
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await getUserProfile(session.user.id);
          setUser(userProfile);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userType: 'student' | 'employer', name: string) => {
    try {
      // 1. Create the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            user_type: userType,
            name: name
          }
        }
      });

      if (error || !data.user) {
        return { user: null, error };
      }

      // 2. Insert the profile after successful auth signup
      if (userType === 'student') {
        const { error: profileError } = await supabase
          .from('student_profiles')
          .insert([{ user_id: data.user.id, full_name: name }]);
        if (profileError) {
          console.error('Error creating student profile:', profileError);
          return { user: null, error: profileError as any };
        }
      } else {
        const { error: profileError } = await supabase
          .from('employer_profiles')
          .insert([{ user_id: data.user.id, company_name: name }]);
        if (profileError) {
          console.error('Error creating employer profile:', profileError);
          return { user: null, error: profileError as any };
        }
      }

      // 3. Create AuthUser object
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        userType,
        name
      };

      setUser(authUser);
      return { user: authUser, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { user: null, error };
      }

      const userProfile = await getUserProfile(data.user.id);
      if (!userProfile) {
        return { user: null, error: new Error('User profile not found') as AuthError };
      }

      setUser(userProfile);
      return { user: userProfile, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
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