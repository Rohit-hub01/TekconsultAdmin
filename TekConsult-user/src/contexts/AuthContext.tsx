// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Consultant } from '@/data/mockData';
import { authAPI, userAPI } from '@/services/api';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  consultant: Consultant | null;
  role: 'user' | 'consultant' | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  sendOtp: (email: string) => Promise<{ success: boolean; role: 'user' | 'consultant' | null }>;
  verifyOtp: (email: string, otp: string, roleHint?: 'user' | 'consultant') => Promise<boolean>;
  verifyOtpStandalone: (email: string, otp: string) => Promise<boolean>;
  logout: () => void;
  updateWalletBalance: (amount: number) => void;
  setToken: (token: string) => void;
  updateProfileName: (firstName: string, lastName?: string) => void;
  refreshAuthenticatedProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    consultant: null,
    role: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check for stored auth on mount
    const storedAuth = localStorage.getItem('authState');
    if (storedAuth) {
      setAuthState(prev => ({
        ...JSON.parse(storedAuth),
        isLoading: false
      }));
    } else {
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, []);

  const refreshAuthenticatedProfile = async () => {
    if (!authState.isAuthenticated || authState.role !== 'user') return;

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const profile = await userAPI.getUserById(userId);
      if (!profile) return;

      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      if (!fullName) return;

      setAuthState((prev) => {
        if (!prev.user) return prev;

        if (
          prev.user.name === fullName &&
          (prev.user as any).firstName === profile.firstName &&
          (prev.user as any).lastName === profile.lastName
        ) {
          return prev;
        }

        const updatedUser = {
          ...prev.user,
          ...profile,
          name: fullName,
        };

        const newState: AuthState = {
          ...prev,
          user: updatedUser,
        };

        localStorage.setItem('authState', JSON.stringify(newState));
        return newState;
      });
    } catch (error) {
      console.error('Failed to refresh authenticated user profile:', error);
    }
  };

  useEffect(() => {
    refreshAuthenticatedProfile();
  }, [authState.isAuthenticated, authState.role]);

  const sendOtp = async (email: string): Promise<{ success: boolean; role: 'user' | 'consultant' | null }> => {
    try {
      await authAPI.generateEmailOTP(email);

      return {
        success: true,
        role: null,
      };
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw error;
    }
  };

  const verifyOtp = async (email: string, otp: string, roleHint?: 'user' | 'consultant'): Promise<boolean> => {
    try {
      const response = await authAPI.loginWithEmailOtp(email, otp);
      console.log('Login response:', response);

      const authData = response?.data;
      const apiUser = authData?.user;

      if (authData && authData.token && apiUser) {
        // Determine role - use the roleName from the API user object if available
        const isConsultant = apiUser?.roleName === 'Consultant' || roleHint === 'consultant';

        // Create user/consultant object
        let user: User | null = null;
        let consultant: Consultant | null = null;

        if (isConsultant) {
          // Normalizing Consultant Object
          const rawConsultant = apiUser;
          consultant = {
            ...rawConsultant,
            id: rawConsultant.userId || rawConsultant.UserId || rawConsultant.id || rawConsultant.consultantId || rawConsultant.ConsultantId || '',
            joiningDate: rawConsultant.createdOn || rawConsultant.CreatedOn,
            name: rawConsultant.firstName ? `${rawConsultant.firstName} ${rawConsultant.lastName || ''}`.trim() : rawConsultant.name
          };
        } else {
          // Normalizing User Object
          const rawUser = apiUser;
          user = {
            ...rawUser,
            id: rawUser.id || rawUser.userId || rawUser.UserId || '',
            joiningDate: rawUser.createdOn || rawUser.CreatedOn,
            name: rawUser.firstName ? `${rawUser.firstName} ${rawUser.lastName || ''}`.trim() : rawUser.name
          };
        }

        const newState: AuthState = {
          isAuthenticated: true,
          user,
          consultant,
          role: isConsultant ? 'consultant' : 'user',
          token: authData.token,
          isLoading: false,
        };

        // ✅ Extract the REAL userId from the JWT token
        let realUserId = '';
        try {
          const payload = JSON.parse(atob(authData.token.split('.')[1]));
          realUserId =
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
            payload.sub ||
            payload.nameid ||
            payload.UserId ||
            '';
        } catch (e) {
          console.warn('[Auth] Failed to decode JWT:', e);
          realUserId = (user?.id || consultant?.id || '').toString();
        }

        setAuthState(newState);
        localStorage.setItem('authState', JSON.stringify(newState));
        localStorage.setItem('authToken', authData.token);
        localStorage.setItem('token', authData.token);        // legacy key used by other API calls
        localStorage.setItem('userId', realUserId);
        localStorage.setItem('userRole', isConsultant ? 'consultant' : 'user');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  };

  const verifyOtpStandalone = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await authAPI.verifyEmailOTP(email, otp);
      return response && response.success;
    } catch (error) {
      console.error('Error in standalone OTP verification:', error);
      return false;
    }
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      consultant: null,
      role: null,
      token: null,
      isLoading: false,
    });
    localStorage.removeItem('authState');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');       // legacy key
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
  };

  const updateWalletBalance = (amount: number) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, walletBalance: authState.user.walletBalance + amount };
      const newState = { ...authState, user: updatedUser };
      setAuthState(newState);
      localStorage.setItem('authState', JSON.stringify(newState));
    }
  };

  const setToken = (token: string) => {
    const newState = { ...authState, token };
    setAuthState(newState);
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token);
    localStorage.setItem('authState', JSON.stringify(newState));
  };

  const updateProfileName = (firstName: string, lastName?: string) => {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    if (!fullName) return;

    const newState: AuthState = {
      ...authState,
      user: authState.user ? { ...authState.user, name: fullName } : authState.user,
      consultant: authState.consultant ? { ...authState.consultant, name: fullName } : authState.consultant,
    };

    setAuthState(newState);
    localStorage.setItem('authState', JSON.stringify(newState));
  };

  return (
    <AuthContext.Provider value={{ ...authState, sendOtp, verifyOtp, verifyOtpStandalone, logout, updateWalletBalance, setToken, updateProfileName, refreshAuthenticatedProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { AuthContextType, AuthState };
