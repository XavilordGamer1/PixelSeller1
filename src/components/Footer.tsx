// import React from 'react';
import { Github, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">PixelCanvas</h3>
            <p className="text-sm leading-relaxed">
              Declare your love anonymously 💌, tag your favourite quote or graffiti 🎨, spark curiosity across social media 🌐, or showcase your brand’s logo right here — who knows, it might just become iconic! The pixel is yours… once you’ve claimed it, of course 😄.

              ⚠️ Please note: Any offensive, explicit, or sexual content will be removed without refund and may be reported to our support team for further action.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/selection" className="hover:text-white transition-colors">Buy Pixels</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm">
              Sign up for our newsletter to get updates on newly purchased pixels.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} PixelCanvas. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;