import React from 'react';
import { Layout } from 'antd';
import { useLayout } from '../contexts/LayoutContext';
import ClienteManager from '../components/cliente/clienteManager';

const { Content } = Layout;

const Clientes: React.FC = () => {
    const { collapsed } = useLayout();

    return (
        <Content
            className="m-4 p-4 bg-white rounded-lg shadow-sm"
            style={{
                marginLeft: collapsed ? '10px' : '50px',
                marginTop: '64px',
                transition: 'all 0.3s ease-in-out',
                minHeight: 'calc(100vh - 64px)',
            }}
        >
            
            <ClienteManager />
        </Content>
    );
};

export default Clientes;