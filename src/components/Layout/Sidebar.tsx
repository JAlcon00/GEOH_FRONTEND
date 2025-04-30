import React from 'react';
import { Layout, Menu } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const { collapsed, toggleCollapsed } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();

  const tipoUsuario = localStorage.getItem('tipo_usuario');

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Inicio',
      onClick: () => {
        // Fuerza una recarga completa al ir a Home
        window.location.href = '/';
      },
      className: 'hover:bg-red-800',
    },
    {
      key: '/clientes',
      icon: <TeamOutlined />,
      label: 'Clientes',
      onClick: () => navigate('/clientes'),
      className: 'hover:bg-red-800',
    },
    // Solo mostrar Usuarios si es administrador
    ...(tipoUsuario === 'administrador' ? [{
      key: '/usuarios',
      icon: <UserOutlined />,
      label: 'Usuarios',
      onClick: () => navigate('/usuarios'),
      className: 'hover:bg-red-800',
    }] : []),
    {
      key: '/logout',
      icon: <DisconnectOutlined />,
      label: 'Cerrar Sesión',
      onClick: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('tipo_usuario');
        window.location.href = '/login';
      },
      className: 'hover:bg-red-800',
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      className="h-screen bg-red-900 text-white"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        width: collapsed ? '80px' : '200px',
        transition: 'width 0.2s ease-in-out',
      }}
    >
      <div className="h-16 flex items-center justify-center px-4">
        <h2
          className={`
            text-white font-semibold truncate
            ${collapsed ? 'text-lg' : 'text-xl'}
            transition-all duration-300
            w-full text-center
          `}
        >
          {collapsed ? 'GH' : 'Geo-H'}
        </h2>
      </div>
      
      <div className="flex justify-center py-2 border-t border-b border-red-900">
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-expanded={!collapsed}
          className="text-white text-lg hover:text-red-300 transition-colors duration-200 p-2"
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>
      
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        className="bg-red-900 mt-2"
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar;