import { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthFlags } from '@stores/auth.store';

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, authInitialized } = useAuthFlags();

  if (!authInitialized) {
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
