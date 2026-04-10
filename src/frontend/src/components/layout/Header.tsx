import {
  DownOutlined,
  LogoutOutlined,
  MenuOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Space, Typography } from 'antd';
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLogout } from '@hooks/useAuth';
import { useCurrentUser } from '@stores/auth.store';
import { useUiStore } from '@stores/ui.store';
import { roleLabels } from '@utils/format';
import { uiText } from '@/constants/uiText';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const routeLabelMap: Record<string, string> = uiText.layout.routes;

export const Header = () => {
  const location = useLocation();
  const user = useCurrentUser();
  const { setMobileSidebarOpen } = useUiStore();
  const logoutMutation = useLogout();

  const breadcrumbItems = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const items = parts.map((part, index) => {
      const path = `/${parts.slice(0, index + 1).join('/')}`;
      const isLast = index === parts.length - 1;
      const title = routeLabelMap[part] || part;
      return {
        title: isLast ? (
          <span className="app-header__crumb app-header__crumb--current" title={title}>
            {title}
          </span>
        ) : (
          <Link className="app-header__crumb" to={path} title={title}>
            {title}
          </Link>
        )
      };
    });

    return [
      {
        title: (
          <Link className="app-header__crumb" to="/dashboard" title="Home">
            {uiText.common.home}
          </Link>
        )
      },
      ...items
    ];
  }, [location.pathname]);

  return (
    <AntHeader
      className="app-header-glass"
      style={{
        background: 'rgba(255,255,255,0.84)',
        minHeight: 88,
        height: 'auto',
        lineHeight: 'normal',
        padding: '12px 20px',
        borderBottom: '1px solid rgba(160, 182, 204, 0.24)'
      }}
    >
      <div className="app-header-layout">
        <div className="app-header__left">
          <Button
            className="mobile-nav-trigger"
            shape="circle"
            icon={<MenuOutlined />}
            onClick={() => setMobileSidebarOpen(true)}
            style={{ display: 'none' }}
          />
          <div className="app-header__breadcrumb">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <Space size={18} className="app-header__right">
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  label: uiText.layout.logout,
                  icon: <LogoutOutlined />,
                  onClick: () => logoutMutation.mutate()
                }
              ]
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                style={{ background: 'linear-gradient(135deg, #0f6cbd 0%, #13908c 100%)' }}
                icon={<UserOutlined />}
              />
              <Space size={4}>
                <Text strong>{user?.name || uiText.common.unknown}</Text>
                <Text type="secondary">({user ? roleLabels[user.role] : '-'})</Text>
              </Space>
              <DownOutlined />
            </Space>
          </Dropdown>
        </Space>
      </div>
    </AntHeader>
  );
};
