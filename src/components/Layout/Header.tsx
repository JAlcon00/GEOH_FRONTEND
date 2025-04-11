import React, { useState, useEffect } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { PlusOutlined } from '@ant-design/icons';
import ClienteForm from '../cliente/clienteForm';
import logo from '../../img/OlsonShort.svg';

const Header: React.FC = () => {
  const { collapsed, isMobile } = useLayout();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    document.body.style.overflow = showForm ? 'hidden' : 'auto';
  }, [showForm]);

  return (
    <header
      className={`
        fixed top-0 left-0 z-10
        transition-all duration-300
        flex items-center
        
        h-16  /* Un poco más alto que h-14 para mejor presencia */
        shadow-xl /* Sombra más marcada */

        /* Gradiente suave con rojos institucionales */
        bg-gradient-to-r from-red-900 to-red-800
        ${collapsed
          ? 'ml-[80px] w-[calc(100%-80px)]'
          : 'ml-[200px] w-[calc(100%-200px)]'
        }
      `}
    >
    <div className="flex w-full items-center justify-between px-3 sm:px-4 md:px-6">
      
      {/* Contenedor para el título */}
      <div className="min-w-0 flex items-center mr-2">
        <h1
        className="
          text-white
          font-semibold
          text-sm sm:text-base md:text-lg
          truncate
          overflow-hidden
          whitespace-nowrap
          max-w-full
        "
        /* Ajuste opcional, si deseas un alto de línea pequeño:
           style={{ lineHeight: '1.2rem' }} 
        */
        >
        Panel de Control
        </h1>
      </div>
      
      {/* Contenedor para el botón + el logo */}
      <div className="flex items-center space-x-6 m-2">
        {/* Botón para crear nueva solicitud */}
        <button
        onClick={() => setShowForm(true)}
        aria-label="Crear nueva solicitud"
        className="
          flex items-center justify-center
          px-2 py-1 sm:px-3 sm:py-2
          bg-red-700 hover:bg-red-600
          text-white text-xs sm:text-sm
          rounded-full
          transition-colors duration-200
          font-medium
          shadow-md
        "
        >
        <PlusOutlined className="mr-0 sm:mr-2" />
        <span className="hidden sm:inline">Nueva solicitud</span>
        </button>
        
        {/* Logo */}
        <img
        src={logo}
        alt="logo"
        className="h-6 w-auto sm:h-8 object-contain"
        />
      </div>
    </div>

      {/* Modal con el formulario */}
      {showForm && (
        <div
          className="fixed bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            top: 0,
            left: isMobile ? 0 : collapsed ? '80px' : '200px',
            right: 0,
            bottom: 0,
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="
              bg-white p-6 rounded-lg shadow-lg
              max-h-[90vh] overflow-y-auto
              w-full max-w-4xl mx-4
            "
            onClick={(e) => e.stopPropagation()}
          >
            <ClienteForm />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
