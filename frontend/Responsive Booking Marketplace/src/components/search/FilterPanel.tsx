import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { X } from 'lucide-react';
import { useState } from 'react';

interface FilterPanelProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export function FilterPanel({ onClose, isMobile }: FilterPanelProps) {
  const [date, setDate] = useState<Date>();
  const [priceRange, setPriceRange] = useState([1, 4]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft h-fit sticky top-24">
      {isMobile && (
        <div className="flex items-center justify-between mb-6">
          <h5>Filters</h5>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Categories */}
      <div className="mb-6">
        <h6 className="mb-4">Category</h6>
        <div className="space-y-3">
          {[
            { id: 'salon', label: 'Salons & Spas' },
            { id: 'restaurant', label: 'Restaurants' },
            { id: 'sports', label: 'Sports & Fitness' },
          ].map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox id={category.id} />
              <Label htmlFor={category.id} className="cursor-pointer">
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Date */}
      <div className="mb-6">
        <h6 className="mb-4">Date</h6>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-xl border"
        />
      </div>

      <Separator className="my-6" />

      {/* Price Range */}
      <div className="mb-6">
        <h6 className="mb-4">Price Range</h6>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={1}
            max={4}
            step={1}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
            <span>{'$'.repeat(priceRange[0])}</span>
            <span>{'$'.repeat(priceRange[1])}</span>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Rating */}
      <div className="mb-6">
        <h6 className="mb-4">Rating</h6>
        <div className="space-y-3">
          {[4.5, 4.0, 3.5, 3.0].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox id={`rating-${rating}`} />
              <Label htmlFor={`rating-${rating}`} className="cursor-pointer">
                {rating}+ stars
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Features */}
      <div className="mb-6">
        <h6 className="mb-4">Features</h6>
        <div className="space-y-3">
          {[
            { id: 'whatsapp', label: 'WhatsApp Booking' },
            { id: 'instant', label: 'Instant Confirm' },
            { id: 'free-cancel', label: 'Free Cancellation' },
            { id: 'open-now', label: 'Open Now' },
          ].map((feature) => (
            <div key={feature.id} className="flex items-center space-x-2">
              <Checkbox id={feature.id} />
              <Label htmlFor={feature.id} className="cursor-pointer">
                {feature.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white">
        Apply Filters
      </Button>
      <Button variant="ghost" className="w-full mt-2">
        Clear All
      </Button>
    </div>
  );
}
