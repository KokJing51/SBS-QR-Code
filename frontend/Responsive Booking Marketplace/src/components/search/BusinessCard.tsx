import { Business } from '../../types';
import { Star, MapPin, MessageCircle, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface BusinessCardProps {
  business: Business;
  onClick: () => void;
}

export function BusinessCard({ business, onClick }: BusinessCardProps) {
  const getPriceRange = (level: number) => '$'.repeat(level);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
    >
      <div className="md:flex">
        {/* Image */}
        <div className="relative md:w-64 h-48 md:h-auto overflow-hidden flex-shrink-0">
          <img
            src={business.image}
            alt={business.name}
            className="w-full h-full object-cover"
          />
          {business.whatsappEnabled && (
            <Badge className="absolute top-4 right-4 bg-[var(--color-accent-whatsapp)] text-white border-none">
              <MessageCircle className="w-3 h-3 mr-1" />
              WhatsApp Auto
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5>{business.name}</h5>
                  {business.instantConfirm && (
                    <Badge className="bg-[var(--color-highlight)] text-white border-none text-xs">
                      Instant
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-3">
                  <span className="capitalize">{business.category}</span>
                  <span>•</span>
                  <span>{getPriceRange(business.priceRange)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{business.rating}</span>
              <span className="text-[var(--color-text-secondary)] text-sm">
                ({business.reviewCount} reviews)
              </span>
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2">
              {business.description}
            </p>

            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <MapPin className="w-4 h-4" />
              <span>{business.location}</span>
              {business.distance && (
                <>
                  <span>•</span>
                  <span>{business.distance} km away</span>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
            {business.nextAvailable ? (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-highlight)]" />
                <span className="text-sm">
                  <span className="text-[var(--color-text-secondary)]">Next:</span>{' '}
                  <span>{business.nextAvailable}</span>
                </span>
              </div>
            ) : (
              <div />
            )}
            <Button
              className="bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
