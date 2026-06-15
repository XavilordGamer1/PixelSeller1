// src/pages/Selection.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PixelGrid from '../components/PixelGrid';
import { fetchPixelData, updatePixelContent, logPurchase } from '../services/pixelService';
import { usePixelContext } from '../context/PixelContext';
import { ShoppingCart, Check, Hand, Loader2 } from 'lucide-react';
import { PixelData, verifyCoupon, redeemCoupon } from '../services/db';
import { FEATURES } from '../config'; // Importar el interruptor de funcionalidades

const Selection = () => {
  const [loading, setLoading] = useState(true);
  const [pixelData, setPixelData] = useState<PixelData[]>([]);
  const { selectedPixels, setSelectedPixels, appliedCoupon, setAppliedCoupon, setPaymentCompleted } = usePixelContext();
  const navigate = useNavigate();

  // --- NUEVOS ESTADOS PARA CUPONES ---
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [isProcessingFreeOrder, setIsProcessingFreeOrder] = useState(false);

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

  // --- LÓGICA DE CÁLCULO DE PRECIOS ---
  const basePrice = selectedPixels.length;
  const discountPercentage = appliedCoupon?.discount_percentage ?? 0;
  const discountAmount = (basePrice * discountPercentage) / 100;
  const finalPrice = basePrice - discountAmount;

  // --- NUEVA FUNCIÓN PARA APLICAR CUPÓN ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsVerifyingCoupon(true);
    setCouponError('');
    setAppliedCoupon(null);

    const validCoupon = await verifyCoupon(couponCode.trim());
    if (validCoupon) {
      setAppliedCoupon(validCoupon);
    } else {
      setCouponError('Invalid or expired coupon code.');
    }
    setIsVerifyingCoupon(false);
  };
  
  // --- NUEVA FUNCIÓN PARA CHECKOUT GRATUITO ---
  const handleFreeCheckout = async () => {
      if (!appliedCoupon || appliedCoupon.discount_percentage !== 100 || selectedPixels.length === 0) return;
      setIsProcessingFreeOrder(true);
      try {
          // 1. Redimir el cupón en la BD
          await redeemCoupon(appliedCoupon.id);
          
          // 2. Actualizar el estado de los píxeles a 'vendido'
          const updatedPixels = selectedPixels.map((pixel: any) => ({
              ...pixel,
              status: 'sold',
              owner: `coupon_${appliedCoupon.code}` 
          }));
          await updatePixelContent(updatedPixels);
          
          // 3. Registrar la "compra" gratuita
          const pixelIds = selectedPixels.map((p: any) => p.id);
          await logPurchase(`COUPON-${appliedCoupon.code}`, pixelIds);
          
          // 4. Marcar el pago como completado y navegar al siguiente paso
          setPaymentCompleted(true);
          navigate('/pixel-content');

      } catch (error) {
          console.error("Error processing free checkout:", error);
          alert("An error occurred. Please try again.");
      } finally {
          setIsProcessingFreeOrder(false);
      }
  };

  // --- FUNCIÓN UNIFICADA PARA PROCEDER ---
  const handleProceed = () => {
    if (selectedPixels.length === 0) return;

    if (finalPrice <= 0 && appliedCoupon?.discount_percentage === 100) {
      handleFreeCheckout();
    } else {
      navigate('/payment');
    }
  };

  const handleClearSelection = () => {
    setSelectedPixels([]);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Select Your Pixels</h1>
        <p className="text-md md:text-lg text-gray-600 max-w-2xl mx-auto">
          Each pixel costs $1. Choose the pixels you want to purchase and make them your own!
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-gray-800">Your Selection</h3>
          </div>
          <p className="text-gray-700">
            <span className="font-bold">{selectedPixels.length}</span> pixels selected
          </p>
          {appliedCoupon && (
            <p className="text-green-600">
              - ${discountAmount.toFixed(2)} ({discountPercentage}%) discount applied
            </p>
          )}
          <p className="text-gray-700 font-bold mt-1">
            Total: <span className="text-blue-600">${finalPrice.toFixed(2)}</span>
          </p>

          {/* --- SECCIÓN DE CUPÓN --- */}
          {FEATURES.COUPONS_ENABLED && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-1">
                Discount Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="coupon"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isVerifyingCoupon}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={isVerifyingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center"
                >
                  {isVerifyingCoupon ? <Loader2 className="animate-spin h-5 w-5" /> : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-sm mt-1">{couponError}</p>}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              className={`w-full px-4 py-2 rounded-md transition-colors flex items-center justify-center font-semibold ${
                selectedPixels.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleProceed}
              disabled={selectedPixels.length === 0 || isProcessingFreeOrder}
            >
              {isProcessingFreeOrder ? (
                 <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Completing...</>
              ) : (
                 <><Check className="h-5 w-5 inline mr-1" /> {finalPrice <= 0 ? 'Complete Order' : 'Proceed to Payment'}</>
              )}
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
          <div className="relative overflow-auto max-w-full border border-gray-200 rounded-lg mt-8">
            <div className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-left">
                <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-4 md:mb-0">Pixel Canvas (134 × 320)</h2>
                <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 mr-2 border border-gray-300"></div>
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-400 mr-2 border border-gray-300"></div>
                    <span className="text-sm text-gray-600">Purchased</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-400 mr-2 border border-gray-300"></div>
                    <span className="text-sm text-gray-600">Selected</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center text-sm text-blue-800 bg-blue-100 p-2 rounded-lg flex items-center justify-center gap-2">
                <Hand className="h-4 w-4 flex-shrink-0" />
                <span><strong>Tip:</strong> Hold down on the grid to start selecting pixels.</span>
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