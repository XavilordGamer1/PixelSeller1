// src/components/Footer.tsx
import { Facebook, Mail } from 'lucide-react';

const Footer = () => {
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
            {/* Espacio para futuros enlaces o información */}
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <div className="flex items-center space-x-3">
               <Mail className="h-5 w-5 text-gray-400" />
               <span className="text-gray-400 hover:text-white transition-colors">
                 tcoecm@gmail.com
               </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              {/* --- ENLACE A FACEBOOK --- */}
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