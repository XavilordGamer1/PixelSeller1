// src/pages/Gallery.tsx
import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
import PixelGridGallery from '../components/PixelGridGallery';
import { fetchPixelData } from '../services/pixelService';

const ROWS = 134;
const COLUMNS = 320;
const TOTAL_PIXELS = ROWS * COLUMNS;

const Gallery: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pixelData, setPixelData] = useState<any[]>([]);

  const loadPixelData = async () => {
    try {
      const data = await fetchPixelData();
      console.log("Pixel data loaded:", data);
      setPixelData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch pixel data:", error);
      setLoading(false);
    }
  };

  // Cargar la data al montar el componente.
  useEffect(() => {
    loadPixelData();
  }, []);

  // Forzar la recarga cada vez que la ventana gane foco.
  useEffect(() => {
    const handleFocus = async () => {
      console.log("La ventana recuperó el foco. Recargando la data de píxeles.");
      await loadPixelData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Calcular el número de píxeles disponibles:
  // Si hay datos, se cuentan aquellos con status "available".
  // Si no hay data, se asume que TODOS están disponibles.
  const availableCount =
    pixelData.length > 0
      ? pixelData.filter((p) => p.status === 'available').length
      : TOTAL_PIXELS;

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="w-full bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-center items-center">
          <p className="text-2xl font-bold text-white">
            Available Pixels: <span>{availableCount}</span> / {TOTAL_PIXELS}
          </p>
        </div>
      </header>
      <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="w-full h-full overflow-auto">
            <PixelGridGallery pixelData={pixelData} rows={134} columns={320} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
