import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onAuthClick: () => void;
}

export function Navbar({ onNavigate, currentPage, onAuthClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Browse', page: 'browse' },
    { label: 'Categories', page: 'categories' },
    { label: 'How it works', page: 'how-it-works' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-accent-whatsapp)] flex items-center justify-center">
              <span className="text-white">B</span>
            </div>
            <span className="text-[var(--color-primary)]">Fein Booking</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => onNavigate(link.page)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Auth Button */}
          <div className="hidden md:block">
            <Button
              onClick={onAuthClick}
              variant="outline"
              className="border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)] hover:text-white"
            >
              Sign in
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-[var(--color-text-primary)]" />
            ) : (
              <Menu className="w-6 h-6 text-[var(--color-text-primary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-white">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => {
                  onNavigate(link.page);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-2"
              >
                {link.label}
              </button>
            ))}
            <Button
              onClick={() => {
                onAuthClick();
                setMobileMenuOpen(false);
              }}
              variant="outline"
              className="w-full border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)] hover:text-white"
            >
              Sign in
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}