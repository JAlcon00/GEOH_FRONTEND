import React, { useState, useEffect } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import ClienteForm from '../cliente/clienteForm';
import { getProfile } from '../../services/auth.service';

const Header: React.FC = () => {
  const { collapsed, isMobile } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [usuario, setUsuario] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = showForm ? 'hidden' : 'auto';
  }, [showForm]);

  useEffect(() => {
    const fetchUsuario = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await getProfile(token);
          setUsuario(data.nombre || data.usuario?.nombre || '');
        } catch (error) {
          setUsuario(null);
        }
      }
    };
    fetchUsuario();
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 z-10
        transition-all duration-500 ease-in-out
        flex items-center
        
        h-14 sm:h-16 /* Ajuste de altura responsivo */
        shadow-xl /* Sombra más marcada */

        /* Gradiente suave con rojos institucionales */
        bg-gradient-to-r from-red-900 to-red-700
        ${collapsed
          ? isMobile ? 'ml-0 w-full' : 'ml-[80px] w-[calc(100%-80px)]' 
          : isMobile ? 'ml-0 w-full' : 'ml-[200px] w-[calc(100%-200px)]'
        }
      `}
    >
    <div className="flex w-full items-center justify-between px-2 sm:px-3 md:px-6">
      
      {/* Contenedor para el título con icono */}
      <div className="min-w-0 flex items-center mr-2 animate-fadeIn">
        {/* Saludo al usuario */}
      {usuario && (
        <span className="text-white font-semibold text-xs sm:text-sm md:text-base mr-2 animate-fadeIn">
          Hola {usuario}
        </span>
      )}
      </div>
      
      

      {/* Contenedor para el botón + el logo */}
      <div className="flex items-center space-x-3 sm:space-x-6 m-1 sm:m-2">
        {/* Botón para crear nueva solicitud con animación de hover y mayor contraste */}
        <button
          onClick={() => setShowForm(true)}
          aria-label="Crear nueva solicitud"
          className="
            flex items-center justify-center
            px-2.5 py-1.5 sm:px-4 sm:py-2
            bg-white text-red-800 border border-red-700
            hover:bg-red-900 hover:text-white
            rounded-full
            transition-all duration-300 ease-in-out
            hover:scale-130 hover:shadow-2xl
            transform active:scale-95
            font-semibold
            shadow-lg
            focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-opacity-50
            text-xs sm:text-sm
            w-auto hover:w-auto
            group
          "
        >
        <span className="flex items-center justify-center w-full gap-1 sm:gap-2">
          <PlusOutlined className="text-xs sm:text-sm flex-shrink-0" />
          <span className="hidden xs:inline">Nueva solicitud</span>
        </span>
        </button>
        
        {/* Logo con animación sutil y shadow para contraste */}
        
      </div>
    </div>

      {/* Modal con el formulario - animación mejorada */}
      {showForm && (
        <div
          className="fixed bg-black bg-opacity-50 flex items-center justify-center z-50
              animate-fadeIn transition-opacity duration-300"
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
              bg-white p-3 sm:p-5 md:p-6 rounded-lg shadow-lg
              max-h-[95vh] sm:max-h-[90vh] overflow-y-auto
              w-[95%] sm:w-full
              sm:max-w-4xl md:max-w-6xl lg:max-w-7xl
              mx-2 sm:mx-4
              transform transition-all duration-300
              animate-scaleIn
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 sm:mb-4 pb-2 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                <PlusOutlined className="mr-2 text-white" />
                
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors hover:bg-gray-100 rounded-full p-1 
                transform hover:rotate-90 duration-300"
              >
                <CloseOutlined className="text-base sm:text-lg" />
              </button>
            </div>
            <ClienteForm />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
