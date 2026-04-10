import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { useAdminMode, useAuthFlags } from '@stores/auth.store';

export const AdminRoute = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthFlags();
  const adminMode = useAdminMode();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!adminMode) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="Bạn không có quyền truy cập chức năng này"
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Về Dashboard
          </Button>
        }
      />
    );
  }

  return <Outlet />;
};
