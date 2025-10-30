import { useState } from 'react';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Service, TimeSlot } from '../../types';
import { Plus, Minus, Info } from 'lucide-react';
import { format } from 'date-fns';
import { generateTimeSlots } from '../../data/mockData';

interface BookingWidgetProps {
  services: Service[];
  onContinue: (bookingData: any) => void;
  isSticky?: boolean;
}

export function BookingWidget({ services, onContinue, isSticky = false }: BookingWidgetProps) {
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState(1);
  const [duration, setDuration] = useState(60);

  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];
  const selectedServiceData = services.find(s => s.id === selectedService);

  const calculateTotal = () => {
    if (!selectedServiceData) return 0;
    return selectedServiceData.price;
  };

  const handleContinue = () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    onContinue({
      service: selectedServiceData,
      date: selectedDate,
      time: selectedTime,
      partySize,
      duration,
      totalPrice: calculateTotal(),
    });
  };

  const containerClasses = isSticky
    ? 'bg-white rounded-2xl shadow-soft p-6 sticky top-24'
    : 'bg-white rounded-2xl shadow-soft p-6';

  return (
    <div className={containerClasses}>
      <h5 className="mb-6">Book Now</h5>

      {/* Service Selection */}
      <div className="mb-6">
        <label className="block text-sm mb-2">
          Select Service
        </label>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a service..." />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{service.name}</span>
                  <span className="text-[var(--color-text-secondary)] ml-4">
                    ${service.price}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedServiceData && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            {selectedServiceData.duration} min • ${selectedServiceData.price}
          </p>
        )}
      </div>

      <Separator className="my-6" />

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm mb-2">
          Select Date
        </label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-xl border"
          disabled={(date) => date < new Date()}
        />
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="mb-6">
          <label className="block text-sm mb-2">
            Select Time
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {timeSlots
              .filter(slot => slot.status === 'available')
              .map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTime(slot.time)}
                  className={selectedTime === slot.time ? 'bg-[var(--color-secondary)]' : ''}
                >
                  {slot.time}
                </Button>
              ))}
          </div>
        </div>
      )}

      <Separator className="my-6" />

      {/* Party Size */}
      <div className="mb-6">
        <label className="block text-sm mb-2">
          Party Size
        </label>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPartySize(Math.max(1, partySize - 1))}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-lg min-w-[3ch] text-center">
            {partySize}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPartySize(partySize + 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Price Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--color-text-secondary)]">Service</span>
          <span>${selectedServiceData?.price || 0}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--color-text-secondary)]">Booking Fee</span>
          <span>$2</span>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <span>Total</span>
          <span className="text-xl">${calculateTotal() + 2}</span>
        </div>
      </div>

      {/* WhatsApp Info */}
      <div className="bg-[var(--color-accent-whatsapp)]10 rounded-lg p-3 mb-6 flex items-start gap-2">
        <Info className="w-5 h-5 text-[var(--color-accent-whatsapp)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Confirmation and updates will be sent via WhatsApp
        </p>
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selectedService || !selectedDate || !selectedTime}
        className="w-full bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white h-12"
      >
        Continue to Details
      </Button>
    </div>
  );
}
