import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/auth';

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatar: string;
  role: 'user' | 'admin';
  isVerified: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (userData: User) => void; // Updated to accept user data
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      // If no token, we don't even try to fetch the profile
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authApi.getProfile();
        if (profile) {
          setUser(profile);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // If the token is invalid or expired, clean up
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  /** * Updates state after a successful login. 
   * The authApi.login service already handles localStorage.
   */
  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  /** * Calls the backend logout and clears local state.
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false);
      setUser(null);
      // Logic for redirecting to login page usually goes here
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {!isLoading && children} 
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