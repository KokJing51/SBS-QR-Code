import { Button } from '../ui/button';
import { MessageCircle } from 'lucide-react';

interface MobileBottomNavProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  onWhatsAppClick?: () => void;
  price?: number;
  disabled?: boolean;
}

export function MobileBottomNav({
  primaryLabel,
  onPrimaryClick,
  onWhatsAppClick,
  price,
  disabled,
}: MobileBottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--color-border)] p-4 shadow-lg">
      <div className="flex items-center gap-3">
        {onWhatsAppClick && (
          <Button
            onClick={onWhatsAppClick}
            variant="outline"
            className="border-[var(--color-accent-whatsapp)] text-[var(--color-accent-whatsapp)] hover:bg-[var(--color-accent-whatsapp)] hover:text-white"
            size="icon"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <Button
            onClick={onPrimaryClick}
            disabled={disabled}
            className="w-full bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white h-12"
          >
            {price ? (
              <div className="flex items-center justify-between w-full">
                <span>{primaryLabel}</span>
                <span>${price}</span>
              </div>
            ) : (
              primaryLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
