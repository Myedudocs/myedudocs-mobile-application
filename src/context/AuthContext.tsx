import React, { createContext, useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { clearApiCache, BASE_URL } from '../service/api.service';
import { connectSocket, disconnectSocket, getSocket } from '../service/socketService';

const googleClientId = "388392832057-bne7f64qudvrooqbacud41tte0i7fitp.apps.googleusercontent.com";

// Define the shape of your User data based on your API
interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  token: string;
  profile_image?: string;
  coins?: number;
  mobile?: string;
  Status?: string;
  createdAt?: string;
  authProvider?: 'local' | 'google';
  googleId?: string;
  examTarget?: string;
  classLevel?: string;
  language?: string;
  avatar?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the Context
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Create the Provider
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a stable ref to the logout function so the socket listener never
  // captures a stale closure.
  const logoutRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // 3. GLOBAL LOGOUT: Clears storage & locks down the app
  const logout = useCallback(async () => {
    try {
      // Remove the user token
      await AsyncStorage.removeItem('edudocs');

      // Evict in-memory API cache
      clearApiCache();

      // Tear down the socket so we don't receive stale events after logout
      disconnectSocket();

      // Also sign out of Google if logged in
      try {
        await GoogleSignin.signOut();
      } catch (e) {}

      // Setting user to null triggers the AuthGuard in AppNavigator
      // to instantly kick them out to the Login screen.
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  // Keep ref in sync so socket listener always calls the latest logout
  logoutRef.current = logout;

  // 1. Initial Load: Check if user is already logged in
  useEffect(() => {
    // Configure Google Sign-In once globally
    GoogleSignin.configure({
      webClientId: googleClientId,
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });

    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('edudocs');
        if (storedUser) {
          const parsed: User = JSON.parse(storedUser);
          setUser(parsed);

          // Auto-sync fresh profile from server (fetches authProvider, googleId, etc.)
          try {
            const profileRes = await fetch(`${BASE_URL}/student/profile`, {
              headers: { Authorization: `Bearer ${parsed.token}` },
            });
            const profileData = await profileRes.json();
            if (profileData?.success && profileData?.user) {
              const fullUser: User = {
                ...parsed,
                ...profileData.user,
                id: parsed.id || profileData.user.id || profileData.user._id,
                token: parsed.token,
              };
              setUser(fullUser);
              await AsyncStorage.setItem('edudocs', JSON.stringify(fullUser));
            }
          } catch (_) {}

          // Reconnect socket for already-logged-in users (app restart / resume)
          const sock = connectSocket(parsed.id, 'student');
          sock.off('force_logout');
          sock.on('force_logout', () => {
            console.log('[Socket] force_logout received — logging out immediately');
            logoutRef.current?.();
          });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        // A slight delay ensures the Splash Screen animations finish nicely
        setTimeout(() => setIsLoading(false), 2500);
      }
    };

    checkAuth();

    // Cleanup on unmount (should never happen for AuthProvider, but good practice)
    return () => {
      disconnectSocket();
    };
  }, []);

  // 2. GLOBAL LOGIN: Saves to storage, updates app state, and connects the socket
  const login = useCallback(async (userData: User) => {
    try {
      await AsyncStorage.setItem('edudocs', JSON.stringify(userData));
      setUser(userData);

      // Connect socket and register the force_logout listener immediately
      const sock = connectSocket(userData.id, 'student');
      // Remove any previous listener to avoid duplicates on re-login
      sock.off('force_logout');
      sock.on('force_logout', () => {
        console.log('[Socket] force_logout received — logging out immediately');
        logoutRef.current?.();
      });
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  }, []);

  const authContextValue = useMemo(() => ({
    user,
    token: user?.token || null,
    isLoading,
    login,
    logout
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook so you can easily grab the logout function from ANY screen!
export const useAuth = () => useContext(AuthContext);