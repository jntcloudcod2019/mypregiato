import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthUser, AuthUser } from '@/hooks/use-auth-user';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isModel: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authData = useAuthUser();

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
