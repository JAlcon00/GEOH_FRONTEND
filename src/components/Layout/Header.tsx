import React, { useState, useEffect } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { PlusOutlined } from '@ant-design/icons';
import ClienteForm from '../cliente/clienteForm';
import logo from '../../img/OlsonShort.svg';

const Header: React.FC = () => {
    const { collapsed } = useLayout();
    const [showForm, setShowForm] = useState(false);



    useEffect(() => {
        if (showForm) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [showForm]);


    return (
        <header
            className={`bg-red-900 shadow fixed top-0 left-0 z-10 transition-all duration-300`}
            style={{
                width: collapsed ? 'calc(100% - 80px)' : 'calc(100% - 200px)',
                marginLeft: collapsed ? '80px' : '200px',
                height: '64px',
            }}
        >
            <div className="flex flex-col sm:flex-row justify-between items-center h-full px-4 md:px-6">
                <div className="flex items-center justify-between w-full sm:w-auto">

                    <h1 className="text-white text-sm sm:text-lg font-semibold ml-2 sm:ml-4">
                        Panel de Control
                    </h1>
                </div>

                <nav className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto mt -2 sm:mt-0">
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full sm:w-auto px-4 py-2 border-none bg-red-950 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                    >
                        <PlusOutlined className="mr-1 sm:mr-2" />
                        Nueva solicitud
                    </button>
                    <div className="flex items-center">
                        <img
                            src={logo}
                            alt="logo"
                            className="h-8 sm:h-12 w-auto shadow-lg"
                        />
                    </div>
                </nav>
            </div>

            {showForm && (
                <div
                    className="fixed bg-black bg-opacity-50 flex items-center justify-center z-50"
                    style={{
                        top: 0,
                        left: collapsed ? '80px' : '200px',
                        right: 0,
                        bottom: 0,
                    }}
                    onClick={() => setShowForm(false)}
                >
                    <div
                        className="bg-white p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto w-full max-w-4xl mx-4 sm:mx-0"
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
