import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Gallery from './pages/Gallery';
import Selection from './pages/Selection';
import Payment from './pages/Payment';
import PixelContent from './pages/PixelContent';
import { PixelProvider } from './context/PixelContext';
import { setupPixelDatabase } from './services/pixelService'; // ✅ Importar función
import { initializePixelDatabase } from './services/db';

initializePixelDatabase();

function App() {
  useEffect(() => {
    // ✅ Ejecuta una vez al iniciar la app
    setupPixelDatabase().catch((error) => {
      console.error('Error al inicializar la base de datos de píxeles:', error);
    });
     initializePixelDatabase();
  }, []);

  return (
    <Router>
      <PixelProvider>
        <div className="min-h-screen flex flex-col bg-slate-50">
          {/* <h1>Inicializando base de datos...</h1> */}
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Gallery />} />
              <Route path="/selection" element={<Selection />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/pixel-content" element={<PixelContent />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </PixelProvider>
    </Router>
  );
}

export default App;
