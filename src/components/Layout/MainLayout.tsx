import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

import Home from '../../pages/Home';
import Clientes from '../../pages/Clientes';
import Usuario from '../../pages/Usuario';
import Login from '../../pages/Login';

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('tipo_usuario');
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const MainLayout: React.FC = () => {
  const { collapsed } = useLayout();
  const location = useLocation();

  const isLoginOrRegisterPage = location.pathname === '/login';

  return (
    <div className="flex min-h-screen bg-gray-100">
      {!isLoginOrRegisterPage && <Sidebar />}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{
          marginLeft: !isLoginOrRegisterPage ? (collapsed ? '80px' : '200px') : undefined,
          marginTop: !isLoginOrRegisterPage ? '64px' : undefined,
        }}
      >
        {!isLoginOrRegisterPage && <Header />}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <PrivateRoute>
                    <Clientes />
                  </PrivateRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <PrivateRoute>
                    <Usuario />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </main>
        {!isLoginOrRegisterPage && <Footer />}
      </div>
    </div>
  );
};

export default MainLayout;