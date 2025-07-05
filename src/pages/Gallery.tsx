// src/pages/Gallery.tsx
import React, { useEffect, useState, useCallback } from 'react';
import PixelGridGallery from '../components/PixelGridGallery';
import { fetchPixelData } from '../services/pixelService';
import { PixelData } from '../services/db';

const ROWS = 134;
const COLUMNS = 320;
const TOTAL_PIXELS = ROWS * COLUMNS;

// Esta función crea la cuadrícula base con todos los píxeles como "disponibles"
const createBaseGrid = (): PixelData[] => {
  const baseGrid: PixelData[] = [];
  for (let i = 0; i < TOTAL_PIXELS; i++) {
    baseGrid.push({
      id: i + 1, // Asumimos que los IDs son secuenciales de 1 a 42880
      x: (i % COLUMNS) + 1,
      y: Math.floor(i / COLUMNS) + 1,
      status: 'available',
      imageUrl: null,
      owner: null,
    });
  }
  return baseGrid;
};

const Gallery: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pixelData, setPixelData] = useState<PixelData[]>([]);
  const [availableCount, setAvailableCount] = useState(TOTAL_PIXELS);

  const loadPixelData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Crea la cuadrícula base en el navegador, es súper rápido.
      const baseGrid = createBaseGrid();

      // 2. Pide a Supabase SOLO los píxeles vendidos.
      const soldPixels = await fetchPixelData();

      // 3. Fusiona los datos
      if (soldPixels.length > 0) {
        const soldPixelsMap = new Map(soldPixels.map(p => [p.id, p]));
        const finalGrid = baseGrid.map(p => soldPixelsMap.get(p.id!) || p);
        setPixelData(finalGrid);
      } else {
        // Si no hay píxeles vendidos, solo muestra la cuadrícula base.
        setPixelData(baseGrid);
      }
      
      setAvailableCount(TOTAL_PIXELS - soldPixels.length);

    } catch (error) {
      console.error("Failed to fetch pixel data:", error);
      // En caso de error, muestra la cuadrícula base.
      setPixelData(createBaseGrid());
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar la data al montar el componente.
  useEffect(() => {
    loadPixelData();
  }, [loadPixelData]);

  // Forzar la recarga cada vez que la ventana gane foco.
  useEffect(() => {
    const handleFocus = async () => {
      console.log("La ventana recuperó el foco. Recargando la data de píxeles.");
      await loadPixelData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadPixelData]);

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
            <PixelGridGallery pixelData={pixelData} rows={ROWS} columns={COLUMNS} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;