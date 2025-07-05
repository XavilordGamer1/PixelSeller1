// src/pages/Selection.tsx
import { useState, useEffect } from 'react';  //React
import { useNavigate } from 'react-router-dom';
import PixelGrid from '../components/PixelGrid';
import { fetchPixelData } from '../services/pixelService';
import { usePixelContext } from '../context/PixelContext';
import { ShoppingCart, Check } from 'lucide-react';
import { PixelData } from '../services/db';

const Selection = () => {
  const [loading, setLoading] = useState(true);
  const [pixelData, setPixelData] = useState<PixelData[]>([]);
  const { selectedPixels, setSelectedPixels } = usePixelContext();
  const navigate = useNavigate();

  useEffect(() => {
    const loadPixelData = async () => {
      try {
        const data = await fetchPixelData();
        setPixelData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch pixel data:', error);
        setLoading(false);
      }
    };
    loadPixelData();
  }, []);

  const handleProceedToPayment = () => {
    if (selectedPixels.length > 0) {
      navigate('/payment');
    }
  };

  const handleClearSelection = () => {
    setSelectedPixels([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Select Your Pixels</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Each pixel costs $1. Choose the pixels you want to purchase and make them your own!
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-gray-800">Your Selection</h3>
          </div>
          <p className="text-gray-700">
            <span className="font-bold">{selectedPixels.length}</span> pixels selected
          </p>
          <p className="text-gray-700">
            Total: <span className="font-bold">${selectedPixels.length}.00</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className={`w-full px-4 py-2 rounded-md transition-colors ${
                selectedPixels.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleProceedToPayment}
              disabled={selectedPixels.length === 0}
            >
              <Check className="h-5 w-5 inline mr-1" />
              Proceed to Payment
            </button>
            <button
              className={`w-full px-4 py-2 rounded-md transition-colors ${
                selectedPixels.length > 0
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleClearSelection}
              disabled={selectedPixels.length === 0}
            >
              Clear Selection
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="relative overflow-auto max-w-full border border-gray-200 rounded-lg">
            <div className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-700">Pixel Canvas (134 × 320)</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 mr-2"></div>
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-400 mr-2"></div>
                    <span className="text-sm text-gray-600">Purchased</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-400 mr-2"></div>
                    <span className="text-sm text-gray-600">Selected</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-1 md:p-2">
              <PixelGrid 
                pixelData={pixelData} 
                selectable={true} 
                rows={134} 
                columns={320} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Selection;
