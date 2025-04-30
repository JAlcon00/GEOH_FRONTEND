import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth.service';
import { LockOutlined, UserOutlined, RocketOutlined } from '@ant-design/icons';
import Loader from '../components/Layout/Loader';
import logo from '../img/OlsonShort.svg';

const Login: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya hay un token, redirigir al usuario autenticado a la página principal
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login(nombre, contrasena);
      localStorage.setItem('token', response.token); // Guardar el token en localStorage
      localStorage.setItem('tipo_usuario', response.usuario.tipo_usuario); // Guardar el tipo de usuario en localStorage
      navigate('/'); // Redirigir al usuario a la página principal
    } catch (err) {
      setError('Credenciales incorrectas. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if(loading) {
    return (
      <div className="min-h-screen min-w-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-700 to-red-500 fixed top-0 left-0 w-full h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-700 to-red-500 fixed top-0 left-0 w-full h-full">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-2xl max-w-md w-full flex flex-col justify-center items-center transition-all duration-300 text-gray-800 hover:shadow-[0_35px_60px_-15px_rgba(255,0,0,0.3)] sm:w-10/12 md:w-8/12 lg:w-6/12">
        {/* Logo centrado */}
        <img src={logo} alt="Logo" className="h-16 w-auto mb-4 drop-shadow-[0_4px_16px_rgba(255,255,255,0.85)]" />
        <h2 className="flex items-center gap-2 text-3xl font-bold mb-6 text-center text-red-700">
          <RocketOutlined />
          Iniciar Sesión
        </h2>
        {error && <p className="text-red-200 text-center mb-4 font-semibold animate-pulse">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="relative">
            <UserOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de Usuario"
              className="w-full pl-10 pr-4 py-3 border border-white/30 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-transform duration-200 hover:shadow-xl"
              required
            />
          </div>
          <div className="relative">
            <LockOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              id="contrasena"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Contraseña"
              className="w-full pl-10 pr-4 py-3 border border-white/30 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-transform duration-200 hover:shadow-xl"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-red-400 text-white py-3 px-4 rounded-lg transition-transform duration-200 transform hover:-translate-y-1 hover:shadow-2xl hover:bg-red-700 font-bold active:scale-95"
          >
            Iniciar Sesión
          </button>
        </form>
        
      </div>
    </div>
  );
  
};

export default Login;