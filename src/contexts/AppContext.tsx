import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

type Page = 'home' | 'discussions' | 'salons' | 'annonces' | 'commerces' | 'associations' | 'evenements' | 'messages' | 'profile' | 'moderation' | 'admin' | 'carte';

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  photo_profil_url: string | null;
  prenom: string | null;
  nom: string | null;
  commune_id: string | null;
  account_type: string | null;
  role: string | null;
  created_at: string;
}

interface AppContextType {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  user: User | null;
  userProfile: UserProfile | null;
  userRole: 'user' | 'admin' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setUserProfile(data as UserProfile);
      setUserRole(data.role === 'admin' ? 'admin' : 'user');
    } else {
      setUserRole('user');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setUserRole(null);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setUserRole(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentPage('home');
  };

  return (
    <AppContext.Provider value={{ currentPage, setCurrentPage, user, userProfile, userRole, loading, signOut, refreshProfile }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
