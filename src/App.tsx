import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LayoutProvider } from './contexts/LayoutContext';
import MainLayout from './components/Layout/MainLayout'; // <-- Agrega esta importación
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LayoutProvider>
        <MainLayout />
      </LayoutProvider>
    </BrowserRouter>
  );
};

export default App;