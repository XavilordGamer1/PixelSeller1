// src/pages/Payment.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePixelContext } from '../context/PixelContext';
import { ArrowLeft } from 'lucide-react';
import { updatePixelContent, logPurchase } from '../services/pixelService';
import { redeemCoupon } from '../services/db'; // <-- Importar redeemCoupon
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import type { OnApproveData, CreateOrderData } from "@paypal/paypal-js";

const Payment = () => {
  // --- OBTENER appliedCoupon DEL CONTEXTO ---
  const { selectedPixels, setPaymentCompleted, appliedCoupon } = usePixelContext();
  const [{ isPending }] = usePayPalScriptReducer();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedPixels.length === 0) {
      navigate('/selection');
    }
  }, [selectedPixels, navigate]);

  // --- LÓGICA DE CÁLCULO DE PRECIOS ACTUALIZADA ---
  const basePrice = selectedPixels.length;
  const discountPercentage = appliedCoupon?.discount_percentage ?? 0;
  const discountAmount = (basePrice * discountPercentage) / 100;
  const finalAmount = (basePrice - discountAmount).toFixed(2); // PayPal necesita un string con 2 decimales

  const createOrder = (_data: CreateOrderData, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          description: `Compra de ${selectedPixels.length} pixeles en Thoughts Wall con un descuento de ${discountPercentage}%`,
          amount: {
            currency_code: "USD",
            value: finalAmount, // <-- USAR EL PRECIO FINAL
          },
        },
      ],
    });
  };

  const onApprove = async (_data: OnApproveData, actions: any) => {
    if (!actions.order) {
      throw new Error("Order actions are not available");
    }

    try {
      const order = await actions.order.capture();
      console.log("Respuesta de captura de orden:", order);

      if (order.status === 'COMPLETED') {
        console.log("¡El pago fue completado exitosamente!");

        // --- NUEVO: REDIMIR CUPÓN SI SE USÓ ---
        if (appliedCoupon) {
          await redeemCoupon(appliedCoupon.id);
        }
        
        const pixelIds = selectedPixels.map((p: any) => p.id);
        await logPurchase(order.id, pixelIds);
        
        const updatedPixels = selectedPixels.map((pixel: any) => ({
          ...pixel,
          status: 'sold',
          owner: 'demoUser' // O el usuario real si tienes un sistema de autenticación
        }));
        await updatePixelContent(updatedPixels);
        
        setPaymentCompleted(true);
        navigate('/pixel-content');

      } else {
        console.error("El pago no fue completado. Estado:", order.status);
        alert("Tu pago no pudo ser procesado. Por favor, inténtalo de nuevo.");
      }

    } catch (error) {
      console.error("Ocurrió un error al capturar el pago:", error);
      alert("Tu pago no pudo ser procesado. Por favor, revisa tus fondos o contacta a soporte.");
    }
  };

  const onError = (err: any) => {
    console.error("Error en el pago de PayPal:", err);
    alert("Ha ocurrido un error durante el pago. Por favor, inténtalo de nuevo.");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/selection')}
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
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected Pixels ({selectedPixels.length}):</span>
                  <span className="font-medium">${basePrice.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-gray-600">Discount ({discountPercentage}%):</span>
                    <span className="font-medium">- ${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-800 font-bold">Total:</span>
                  <span className="text-blue-600 font-bold">${finalAmount}</span>
                </div>
              </div>
            </div>

            {isPending ? (
              <div className="flex items-center justify-center py-3 px-4 bg-gray-200 text-gray-600 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                Loading PayPal...
              </div>
            ) : (
              <PayPalButtons
                style={{ layout: 'vertical' }}
                createOrder={createOrder}
                onApprove={onApprove}
                onError={onError}
                key={finalAmount} // <-- Clave para forzar la recreación del botón si el total cambia
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;