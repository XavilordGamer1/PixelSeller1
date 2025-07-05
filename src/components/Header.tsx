// src/components/Header.tsx
// import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Grid, Image } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();


  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4">
          {/* Izquierda: Logo y título */}
          <div className="flex items-center mb-4 md:mb-0">
            <Grid className="h-8 w-8 text-blue-600 mr-2" />
            <Link to="/" className="text-2xl font-bold text-gray-800">
              PixelCanvas
            </Link>
          </div>
          {/* Derecha: Solo muestra "Gallery" y el botón GET PIXELS */}
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Gallery
            </Link>
            <button
              onClick={() => navigate('/selection')}
              className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              GET PIXELS
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
