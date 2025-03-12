import React from 'react';

const Footer: React.FC = () => {
    
    return (
        <footer className="bg-gray-800 text-white py-4 sm:py-6 md:py-8">
            
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-center">
                    <p className="text-xs sm:text-sm text-center sm:text-left">
                        &copy; {new Date().getFullYear()} Olson Capital. Todos los derechos reservados.
                    </p>
                    <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-center">
                        <a 
                            href="#" 
                            className="text-sm hover:text-gray-400 transition duration-300 w-full sm:w-auto text-center"
                        >
                            Política de Privacidad
                        </a>
                        <a 
                            href="#" 
                            className="text-sm hover:text-gray-400 transition duration-300 w-full sm:w-auto text-center"
                        >
                            Términos de Servicio
                        </a>
                        <a 
                            href="#" 
                            className="text-sm hover:text-gray-400 transition duration-300 w-full sm:w-auto text-center"
                        >
                            Contacto
                        </a>
                    </nav>
                </div>
            </div>
        </footer>
    );
};

export default Footer;