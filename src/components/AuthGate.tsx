import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SignInScreen } from './SignInScreen';
import { LoadingIndicator } from './LoadingIndicator';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <LoadingIndicator message="Authenticating..." />
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return <>{children}</>;
}
