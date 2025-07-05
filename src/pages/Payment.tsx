// src/components/Payment.tsx
import  { useState, useEffect } from 'react';  //React,
import { useNavigate } from 'react-router-dom';
import { usePixelContext } from '../context/PixelContext';
import { CreditCard, Check, ArrowLeft } from 'lucide-react';
import { updatePixelContent } from '../services/pixelService';

const Payment = () => {
  const { selectedPixels, processingPayment, setProcessingPayment, setPaymentCompleted } = usePixelContext();
  const [isPayPalLoaded, setIsPayPalLoaded] = useState(false);
  const navigate = useNavigate();

  // Si no hay píxeles seleccionados, redirige a la selección.
  useEffect(() => {
    if (selectedPixels.length === 0) {
      navigate('/selection');
    }
  }, [selectedPixels, navigate]);

  // Simula la carga del SDK de PayPal.
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPayPalLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Procesa el pago y actualiza la base de datos (localStorage).
  const handlePayment = async () => {
    setProcessingPayment(true);
    try {
      // Simula el retardo del pago.
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mostrar el contenido de localStorage antes de actualizar.
      console.log("Antes de actualizar localStorage:", localStorage.getItem("PIXELS_STORAGE"));

      // Mapea los píxeles seleccionados asignando nuevos valores.
      const updatedPixels = selectedPixels.map((pixel: any) => ({
        ...pixel,
        status: 'sold',
        imageUrl: "",
        owner: 'demoUser'
      }));

      await updatePixelContent(updatedPixels);

      // Mostrar el contenido de localStorage después de actualizar.
      console.log("Después de actualizar localStorage:", localStorage.getItem("PIXELS_STORAGE"));

      setProcessingPayment(false);
      setPaymentCompleted(true);
      navigate('/pixel-content');
    } catch (error) {
      console.error("Error processing payment and updating pixels:", error);
      setProcessingPayment(false);
    }
  };

  const handleBackToSelection = () => {
    navigate('/selection');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={handleBackToSelection}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Selection
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Complete Your Purchase</h1>
            <p className="mt-2 opacity-90">Secure payment via PayPal</p>
          </div>
          
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Selected Pixels:</span>
                  <span className="font-medium">{selectedPixels.length}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Price per Pixel:</span>
                  <span className="font-medium">$1.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-800 font-bold">Total:</span>
                  <span className="text-blue-600 font-bold">${selectedPixels.length}.00</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    checked
                    readOnly
                    className="h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="paypal" className="ml-2 flex items-center">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium">PayPal</span>
                    <span className="ml-2 text-sm text-gray-500">(Only payment method available)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                By proceeding with the payment, you agree to purchase the selected pixels.
                After completing the payment, you will be redirected to customize your pixels.
              </p>
            </div>

            {isPayPalLoaded ? (
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center font-medium ${
                  processingPayment
                    ? 'bg-gray-400 text-gray-100 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                }`}
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Pay with PayPal
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-center py-3 px-4 bg-gray-200 text-gray-600 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                Loading PayPal...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
