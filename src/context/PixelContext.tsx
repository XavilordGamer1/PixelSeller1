import React, { createContext, useState, useContext, ReactNode } from 'react';

interface PixelContextType {
  selectedPixels: any[];
  setSelectedPixels: React.Dispatch<React.SetStateAction<any[]>>;
  processingPayment: boolean;
  setProcessingPayment: React.Dispatch<React.SetStateAction<boolean>>;
  paymentCompleted: boolean;
  setPaymentCompleted: React.Dispatch<React.SetStateAction<boolean>>;
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

  const resetState = () => {
    setSelectedPixels([]);
    setProcessingPayment(false);
    setPaymentCompleted(false);
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
        resetState
      }}
    >
      {children}
    </PixelContext.Provider>
  );
};