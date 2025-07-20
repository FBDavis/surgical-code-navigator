import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  license_number: string | null;
  practice_name: string | null;
  default_rvu_rate: number | null;
  specialty_id: string | null;
  specialty_theme: any;
  user_role: string | null;
  subspecialty: string | null;
  onboarding_completed: boolean;
  year_of_training: number | null;
  institution: string | null;
  board_certification: string[] | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  free_months_remaining?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  checkSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string, specialty?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  const checkSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      // Also get free months remaining from subscribers table
      const { data: subscriberData } = await supabase
        .from('subscribers')
        .select('free_months_remaining')
        .eq('user_id', user?.id)
        .single();
      
      setSubscriptionStatus({
        ...data,
        free_months_remaining: subscriberData?.free_months_remaining || 0
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session retrieved:', !!session, error);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          console.log('User set:', !!session?.user, session?.user?.email);
          
          if (session?.user) {
            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            console.log('Profile fetch:', !!profileData, profileError);
            if (!profileError && profileData && mounted) {
              setProfile(profileData);
            }
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session);
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Fetch user profile
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              console.log('Profile fetch in auth change:', !!profileData, error?.message);
              if (!error && profileData && mounted) {
                setProfile(profileData);
              }
            } catch (error) {
              console.error('Error fetching profile in auth change:', error);
            }
          } else {
            setProfile(null);
            setSubscriptionStatus(null);
          }
          
          // Always set loading to false after handling auth state change
          setLoading(false);
          
          // Check subscription status when user logs in
          if (session?.user) {
            setTimeout(() => {
              checkSubscription();
            }, 0);
          }
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string, specialty?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Get specialty theme based on selection
    const getSpecialtyTheme = (spec: string) => {
      const themes = {
        orthopedics: { primary_color: "220 90% 45%", accent_color: "220 50% 85%", name: "Orthopedics" },
        general_surgery: { primary_color: "0 90% 45%", accent_color: "0 50% 85%", name: "General Surgery" },
        plastic_surgery: { primary_color: "280 90% 45%", accent_color: "280 50% 85%", name: "Plastic Surgery" },
        ent: { primary_color: "120 90% 35%", accent_color: "120 50% 85%", name: "ENT" },
        cardiothoracic: { primary_color: "340 90% 45%", accent_color: "340 50% 85%", name: "Cardiothoracic" },
        neurosurgery: { primary_color: "260 90% 45%", accent_color: "260 50% 85%", name: "Neurosurgery" },
        urology: { primary_color: "200 90% 45%", accent_color: "200 50% 85%", name: "Urology" },
        gynecology: { primary_color: "320 90% 45%", accent_color: "320 50% 85%", name: "Gynecology" },
        ophthalmology: { primary_color: "180 90% 35%", accent_color: "180 50% 85%", name: "Ophthalmology" },
        dermatology: { primary_color: "40 90% 45%", accent_color: "40 50% 85%", name: "Dermatology" },
        emergency_medicine: { primary_color: "10 90% 45%", accent_color: "10 50% 85%", name: "Emergency Medicine" },
        anesthesiology: { primary_color: "160 90% 35%", accent_color: "160 50% 85%", name: "Anesthesiology" }
      };
      return themes[spec as keyof typeof themes] || { primary_color: "195 100% 28%", accent_color: "195 50% 88%", name: "General Medicine" };
    };
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
          specialty: specialty || null,
          specialty_theme: specialty ? getSpecialtyTheme(specialty) : null,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
      // Use hash router compatible navigation
      window.location.hash = '#/auth';
    }
    return { error };
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    subscriptionStatus,
    checkSubscription,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};