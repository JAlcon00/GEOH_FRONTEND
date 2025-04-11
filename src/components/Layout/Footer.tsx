// src/components/Layout/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer
      className="
        bg-gray-800
        text-white
        py-4 sm:py-6 md:py-8
        transition-all
        duration-300
      "
    >
      <div className="px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
        <p className="text-xs sm:text-sm text-center sm:text-left">
          &copy; {new Date().getFullYear()} Olson Capital. Todos los derechos reservados.
        </p>
        <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-center justify-center">
          <a
            href="#"
            className="text-sm hover:text-gray-400 transition duration-300"
          >
            Política de Privacidad
          </a>
          <a
            href="#"
            className="text-sm hover:text-gray-400 transition duration-300"
          >
            Términos de Servicio
          </a>
          <a
            href="#"
            className="text-sm hover:text-gray-400 transition duration-300"
          >
            Contacto
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
