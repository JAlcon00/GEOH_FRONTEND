import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

import Home from '../../pages/Home';
import Clientes from '../../pages/Clientes';
import Usuario from '../../pages/Usuario';
//import Inmueble from '../../pages/Inmueble';
//import Documentos from '../../pages/Documentos';



const MainLayout: React.FC = () => {
  const { collapsed } = useLayout();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{
          marginLeft: collapsed ? '80px' : '200px',
          marginTop: '64px',
        }}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/usuarios" element={<Usuario />} /> 
              {/* <Route path="/inmuebles" element={<Inmueble />} /> */}
              {/* <Route path="/documentos" element={<Documentos />} /> */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;