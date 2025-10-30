import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { CheckCircle, MessageCircle, Calendar as CalendarIcon, MapPin, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';

interface ConfirmationPageProps {
  booking: {
    referenceCode: string;
    business: {
      name: string;
      address: string;
      phone: string;
    };
    service: {
      name: string;
      duration: number;
    };
    date: Date;
    time: string;
    partySize: number;
    customerName: string;
    customerPhone: string;
    totalPrice: number;
  };
  onWhatsAppClick: () => void;
  onReschedule: () => void;
  onViewBookings: () => void;
  onHome: () => void;
}

export function ConfirmationPage({
  booking,
  onWhatsAppClick,
  onReschedule,
  onViewBookings,
  onHome,
}: ConfirmationPageProps) {
  const handleAddToCalendar = () => {
    // Mock calendar export
    alert('Calendar export functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-highlight)]10 to-[var(--color-secondary)]10 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-[var(--color-highlight)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="mb-3">Booking Confirmed!</h2>
          <p className="text-[var(--color-text-secondary)] text-lg">
            Your reservation has been confirmed
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-soft p-8 mb-6">
          {/* Reference Code */}
          <div className="text-center mb-8 p-6 bg-[var(--color-surface)] rounded-xl">
            <div className="text-sm text-[var(--color-text-secondary)] mb-2">
              Reference Code
            </div>
            <div className="text-3xl tracking-wider mb-2">
              {booking.referenceCode}
            </div>
            <Badge className="bg-[var(--color-accent-whatsapp)] text-white border-none">
              <MessageCircle className="w-3 h-3 mr-1" />
              WhatsApp confirmation sent
            </Badge>
          </div>

          <Separator className="my-8" />

          {/* Booking Details */}
          <div className="space-y-6">
            <div>
              <h5 className="mb-4">{booking.business.name}</h5>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-[var(--color-secondary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Date & Time</div>
                    <div>{format(booking.date, 'EEEE, MMMM d, yyyy')}</div>
                    <div>{booking.time}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[var(--color-secondary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Service</div>
                    <div>{booking.service.name}</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {booking.service.duration} minutes • {booking.partySize} {booking.partySize === 1 ? 'person' : 'people'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[var(--color-secondary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Location</div>
                    <div>{booking.business.address}</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h6 className="mb-3">Customer Information</h6>
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Name</span>
                  <span>{booking.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Phone</span>
                  <span>{booking.customerPhone}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--color-text-secondary)]">Total Paid</span>
                <span className="text-2xl">${booking.totalPrice + 2}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={onWhatsAppClick}
            className="w-full bg-[var(--color-accent-whatsapp)] hover:bg-[#1FA855] text-white h-12"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Open WhatsApp Chat
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleAddToCalendar}
              variant="outline"
              className="h-12"
            >
              <Download className="w-5 h-5 mr-2" />
              Add to Calendar
            </Button>
            <Button
              onClick={onReschedule}
              variant="outline"
              className="h-12"
            >
              <CalendarIcon className="w-5 h-5 mr-2" />
              Reschedule
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>What's next?</strong> We've sent all the details to your WhatsApp ({booking.customerPhone}). 
            You'll receive a reminder 1 hour before your appointment.
          </p>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" onClick={onViewBookings}>
            View My Bookings
          </Button>
          <span className="text-[var(--color-text-secondary)]">•</span>
          <Button variant="ghost" onClick={onHome}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
