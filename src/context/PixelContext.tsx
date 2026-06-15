import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Coupon } from '../services/db'; // Importar la interfaz Coupon

interface PixelContextType {
  selectedPixels: any[];
  setSelectedPixels: React.Dispatch<React.SetStateAction<any[]>>;
  processingPayment: boolean;
  setProcessingPayment: React.Dispatch<React.SetStateAction<boolean>>;
  paymentCompleted: boolean;
  setPaymentCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  appliedCoupon: Coupon | null; // <-- NUEVO
  setAppliedCoupon: React.Dispatch<React.SetStateAction<Coupon | null>>; // <-- NUEVO
  resetState: () => void;
}

const PixelContext = createContext<PixelContextType | undefined>(undefined);

export const usePixelContext = () => {
  const context = useContext(PixelContext);
  if (!context) {
    throw new Error('usePixelContext must be used within a PixelProvider');
  }
  return context;
};

interface PixelProviderProps {
  children: ReactNode;
}

export const PixelProvider: React.FC<PixelProviderProps> = ({ children }) => {
  const [selectedPixels, setSelectedPixels] = useState<any[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null); // <-- NUEVO

  const resetState = () => {
    setSelectedPixels([]);
    setProcessingPayment(false);
    setPaymentCompleted(false);
    setAppliedCoupon(null); // <-- AÑADIDO AL RESET
  };

  return (
    <PixelContext.Provider
      value={{
        selectedPixels,
        setSelectedPixels,
        processingPayment,
        setProcessingPayment,
        paymentCompleted,
        setPaymentCompleted,
        appliedCoupon, // <-- NUEVO
        setAppliedCoupon, // <-- NUEVO
        resetState
      }}
    >
      {children}
    </PixelContext.Provider>
  );
};