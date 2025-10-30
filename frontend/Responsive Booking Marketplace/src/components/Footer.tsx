import { MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[var(--color-primary)] text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-accent-whatsapp)] flex items-center justify-center">
                <span>B</span>
              </div>
              <span>Fein Booking</span>
            </div>
            <p className="text-gray-300 text-sm">
              AI-powered booking marketplace integrated with WhatsApp automation.
            </p>
            <div className="flex items-center gap-2 text-[var(--color-accent-whatsapp)]">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">Powered by WhatsApp</span>
            </div>
          </div>

          {/* About */}
          <div>
            <h6 className="mb-4 text-white">About</h6>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  For Businesses
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h6 className="mb-4 text-white">Support</h6>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  WhatsApp Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h6 className="mb-4 text-white">Legal</h6>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  PDPA Compliance
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 Bookly.AI. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Built with ❤️ and powered by AI
          </p>
        </div>
      </div>
    </footer>
  );
}