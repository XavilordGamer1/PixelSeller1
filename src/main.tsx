// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

// Opciones iniciales para el script de PayPal
const initialOptions = {
  clientId: "AVMvpHH1UfWFsifMFGkqdpteyk4o5wd0pkn3bhTYKCYJpyB4frTSaS1YSi1jg_1OVT4wsFC4hRn2h1NJ", // ✅ Corregido
  currency: "USD",
  intent: "capture",
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PayPalScriptProvider options={initialOptions}>
      <App />
    </PayPalScriptProvider>
  </StrictMode>
);