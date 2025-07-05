// src/components/PaymentConfirmButton.tsx
// import React from 'react';
import { usePixelContext } from '../context/PixelContext';

const PaymentConfirmButton = () => {
  const { selectedPixels } = usePixelContext();

  const handleConfirm = () => {
    if (selectedPixels.length === 0) {
      alert('No hay píxeles seleccionados para comprar');
      return;
    }
  };

  return (
    <button
      disabled={selectedPixels.length === 0}
      onClick={handleConfirm}
      className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      Confirmar Compra
    </button>
  );
};

export default PaymentConfirmButton;
