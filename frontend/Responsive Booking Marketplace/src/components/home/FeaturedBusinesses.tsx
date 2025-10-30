import { Business } from '../../types';
import { Star, MapPin, MessageCircle, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface FeaturedBusinessesProps {
  businesses: Business[];
  onBusinessClick: (businessId: string) => void;
}

export function FeaturedBusinesses({ businesses, onBusinessClick }: FeaturedBusinessesProps) {
  const getPriceRange = (level: number) => '$'.repeat(level);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="mb-2">Featured businesses</h2>
            <p className="text-[var(--color-text-secondary)]">
              Top-rated venues with instant WhatsApp booking
            </p>
          </div>
          <Button
            variant="outline"
            className="border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)] hover:text-white"
          >
            View all
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {businesses.slice(0, 6).map((business) => (
            <div
              key={business.id}
              onClick={() => onBusinessClick(business.id)}
              className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={business.image}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {business.whatsappEnabled && (
                    <Badge className="bg-[var(--color-accent-whatsapp)] text-white border-none">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      WhatsApp Auto
                    </Badge>
                  )}
                  {business.instantConfirm && (
                    <Badge className="bg-[var(--color-highlight)] text-white border-none">
                      Instant Confirm
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="mb-1">{business.name}</h5>
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
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

                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{business.location}</span>
                  {business.distance && (
                    <>
                      <span>•</span>
                      <span>{business.distance} km</span>
                    </>
                  )}
                </div>

                {business.nextAvailable && (
                  <div className="flex items-center gap-2 text-sm bg-[var(--color-surface)] rounded-lg px-3 py-2">
                    <Clock className="w-4 h-4 text-[var(--color-highlight)]" />
                    <span className="text-[var(--color-text-secondary)]">
                      Next available:
                    </span>
                    <span>{business.nextAvailable}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
