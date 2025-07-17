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
        // First check if user has a student profile
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (studentProfile) {
          setUser({
            id: user.id,
            email: user.email || '',
            userType: 'student',
            name: studentProfile.full_name
          });
        } else {
          // Check for employer profile
          const { data: employerProfile } = await supabase
            .from('employer_profiles')
            .select('company_name')
            .eq('user_id', user.id)
            .single();
          
          if (employerProfile) {
            setUser({
              id: user.id,
              email: user.email || '',
              userType: 'employer',
              name: employerProfile.company_name
            });
          }
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
        // First check if user has a student profile
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('full_name')
          .eq('user_id', data.user.id)
          .single();
        
        if (studentProfile) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || '',
            userType: 'student',
            name: studentProfile.full_name
          };
          setUser(authUser);
          return { user: authUser, error: null };
        }
        
        // Check for employer profile
        const { data: employerProfile } = await supabase
          .from('employer_profiles')
          .select('company_name')
          .eq('user_id', data.user.id)
          .single();
        
        if (employerProfile) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || '',
            userType: 'employer',
            name: employerProfile.company_name
          };
          setUser(authUser);
          return { user: authUser, error: null };
        }
      }

      return { user: null, error: new Error('User profile not found') as AuthError };
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
        // Create profile record
        if (userType === 'student') {
          const { error: profileError } = await supabase
            .from('student_profiles')
            .insert([
              {
                user_id: data.user.id,
                full_name: name,
              }
            ]);
          
          if (profileError) {
            return { user: null, error: profileError as any };
          }
        } else {
          const { error: profileError } = await supabase
            .from('employer_profiles')
            .insert([
              {
                user_id: data.user.id,
                company_name: name,
              }
            ]);
          
          if (profileError) {
            return { user: null, error: profileError as any };
          }
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