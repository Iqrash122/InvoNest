import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as firebaseAuth, isConfigured } from '@/services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticateWithBiometrics } from '@/utils/biometrics';

export interface User {
  uid: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isBiometricEnabled: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<boolean>;
  triggerBiometricUnlock: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    // Load biometric preference
    async function loadBiometricsPref() {
      try {
        const val = await AsyncStorage.getItem('@invonest_biometrics_enabled');
        setIsBiometricEnabled(val === 'true');
      } catch (e) {
        console.error('Error loading biometrics pref:', e);
      }
    }
    loadBiometricsPref();

    if (isConfigured && firebaseAuth) {
      // Firebase auth state listener
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser && firebaseUser.email) {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
      return unsubscribe;
    } else {
      // Offline fallback state listener
      async function loadLocalUser() {
        try {
          const storedUser = await AsyncStorage.getItem('@invonest_current_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error('Error loading local user:', e);
        } finally {
          setIsLoading(false);
        }
      }
      loadLocalUser();
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (isConfigured && firebaseAuth) {
      try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return !!cred.user;
      } catch (e) {
        console.error('Firebase login error:', e);
        return false;
      }
    } else {
      // Offline local login
      try {
        const usersStr = await AsyncStorage.getItem('@invonest_local_users');
        const users = usersStr ? JSON.parse(usersStr) : {};

        // Auto-create demo account if it doesn't exist
        if (email === 'demo@invonest.com' && !users[email]) {
          users[email] = 'password123';
          await AsyncStorage.setItem('@invonest_local_users', JSON.stringify(users));
        }

        // Auto-register if user doesn't exist (local demo mode ease-of-use)
        if (!users[email]) {
          users[email] = password;
          await AsyncStorage.setItem('@invonest_local_users', JSON.stringify(users));
        }

        if (users[email] === password) {
          const localUser = { uid: `local_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, email };
          await AsyncStorage.setItem('@invonest_current_user', JSON.stringify(localUser));
          setUser(localUser);
          return true;
        }
        return false;
      } catch (e) {
        console.error('Local login error:', e);
        return false;
      }
    }
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    if (isConfigured && firebaseAuth) {
      try {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        return !!cred.user;
      } catch (e) {
        console.error('Firebase signup error:', e);
        return false;
      }
    } else {
      // Offline local signup
      try {
        const usersStr = await AsyncStorage.getItem('@invonest_local_users');
        const users = usersStr ? JSON.parse(usersStr) : {};
        
        if (users[email]) {
          return false;
        }

        users[email] = password;
        await AsyncStorage.setItem('@invonest_local_users', JSON.stringify(users));

        const localUser = { uid: `local_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, email };
        await AsyncStorage.setItem('@invonest_current_user', JSON.stringify(localUser));
        setUser(localUser);
        return true;
      } catch (e) {
        console.error('Local signup error:', e);
        return false;
      }
    }
  };

  const logout = async () => {
    if (isConfigured && firebaseAuth) {
      try {
        await firebaseSignOut(firebaseAuth);
      } catch (e) {
        console.error('Firebase logout error:', e);
      }
    } else {
      try {
        await AsyncStorage.removeItem('@invonest_current_user');
        setUser(null);
      } catch (e) {
        console.error('Local logout error:', e);
      }
    }
  };

  const toggleBiometrics = async (enabled: boolean): Promise<boolean> => {
    try {
      if (enabled) {
        // Authenticate once before enabling
        const success = await authenticateWithBiometrics('Confirm authentication to enable biometric lock');
        if (!success) return false;
      }
      await AsyncStorage.setItem('@invonest_biometrics_enabled', enabled ? 'true' : 'false');
      setIsBiometricEnabled(enabled);
      return true;
    } catch (e) {
      console.error('Toggle biometrics error:', e);
      return false;
    }
  };

  const triggerBiometricUnlock = async (): Promise<boolean> => {
    return await authenticateWithBiometrics('Unlock InvoNest to view financial dashboards');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isBiometricEnabled,
        login,
        signup,
        logout,
        toggleBiometrics,
        triggerBiometricUnlock
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}