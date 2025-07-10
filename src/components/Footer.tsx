// src/components/Footer.tsx
import { useState } from 'react'; // 1. IMPORTAR useState
import { Facebook, Mail, Check } from 'lucide-react'; // 2. IMPORTAR el ícono Check

const Footer = () => {
  // 3. AÑADIR ESTADO para el mensaje de copiado
  const [copyText, setCopyText] = useState('tcoecm@gmail.com');

  // 4. CREAR FUNCIÓN para manejar la copia
  const handleCopyEmail = () => {
    navigator.clipboard.writeText('tcoecm@gmail.com').then(() => {
      // Si la copia es exitosa
      setCopyText('Copied!');
      // Vuelve al texto original después de 2 segundos
      setTimeout(() => {
        setCopyText('tcoecm@gmail.com');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err); // Manejo de errores
    });
  };

  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">PixelCanvas</h3>
            <p className="text-sm leading-relaxed">
              Hi, Declare your love anonymously 💌, tag your favourite graffiti 🎨, spark curiosity across social media 🌐, or showcase your brand’s logo right here — who knows, it might just become iconic! The pixel is yours… once you’ve claimed it, of course 😄.

              ⚠️ Please note: Any offensive, explicit, or sexual content will be removed without refund and may be reported to our support team for further action.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            {/* 5. MODIFICAR la sección del correo para que sea un botón */}
            <button
              onClick={handleCopyEmail}
              className="flex items-center space-x-3 group cursor-pointer"
            >
               <Mail className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
               <span className="text-gray-400 group-hover:text-white transition-colors relative">
                 {copyText}
                 {/* Mostrar el ícono de Check cuando se copia */}
                 {copyText === 'Copied!' && <Check className="h-5 w-5 text-green-400 absolute -right-6 top-0" />}
               </span>
            </button>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <a 
                href="https://www.facebook.com/share/1AxdbCXqG4/?mibextid=wwXIfr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} TCOEC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;