import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@client/src/hooks/use-auth';
import { onUnauthorized } from '@client/src/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { admin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = onUnauthorized(() => {
      void logout();
      navigate('/login', { replace: true });
    });
    return cleanup;
  }, [logout, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground text-sm">加载中...</div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
