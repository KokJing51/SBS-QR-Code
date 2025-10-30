import { Button } from '../ui/button';
import { Search, Home } from 'lucide-react';

interface NotFoundProps {
  onGoHome: () => void;
  onBrowse: () => void;
}

export function NotFound({ onGoHome, onBrowse }: NotFoundProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-secondary)]10 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl mb-4 text-[var(--color-secondary)] opacity-50">
            404
          </div>
          <div className="w-24 h-24 bg-[var(--color-secondary)]20 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-12 h-12 text-[var(--color-secondary)]" />
          </div>
        </div>

        {/* Content */}
        <h2 className="mb-4">Page Not Found</h2>
        <p className="text-[var(--color-text-secondary)] text-lg mb-8">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onGoHome}
            className="bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Button>
          <Button onClick={onBrowse} variant="outline">
            <Search className="w-5 h-5 mr-2" />
            Browse Businesses
          </Button>
        </div>

        {/* Suggestions */}
        <div className="mt-12 p-6 bg-white rounded-2xl shadow-soft text-left">
          <h6 className="mb-3">Quick Links</h6>
          <div className="space-y-2">
            <button
              onClick={onBrowse}
              className="block w-full text-left text-[var(--color-text-secondary)] hover:text-[var(--color-secondary)] transition-colors"
            >
              → Browse all businesses
            </button>
            <button
              onClick={() => onBrowse()}
              className="block w-full text-left text-[var(--color-text-secondary)] hover:text-[var(--color-secondary)] transition-colors"
            >
              → Popular salons
            </button>
            <button
              onClick={() => onBrowse()}
              className="block w-full text-left text-[var(--color-text-secondary)] hover:text-[var(--color-secondary)] transition-colors"
            >
              → Top restaurants
            </button>
            <button
              onClick={() => onBrowse()}
              className="block w-full text-left text-[var(--color-text-secondary)] hover:text-[var(--color-secondary)] transition-colors"
            >
              → Sports facilities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
