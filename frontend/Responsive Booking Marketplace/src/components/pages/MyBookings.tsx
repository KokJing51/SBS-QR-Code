import { useState } from 'react';
import { Booking } from '../../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Clock, MapPin, MessageCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface MyBookingsProps {
  bookings: Booking[];
  onReschedule: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
  onWhatsAppClick: (bookingId: string) => void;
}

export function MyBookings({
  bookings,
  onReschedule,
  onCancel,
  onWhatsAppClick,
}: MyBookingsProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const upcomingBookings = bookings.filter((b) => b.status === 'upcoming');
  const pastBookings = bookings.filter((b) => b.status === 'past');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  const handleCancelClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBookingId) {
      onCancel(selectedBookingId);
    }
    setCancelDialogOpen(false);
    setSelectedBookingId(null);
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <div className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image */}
        <div className="md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={booking.business.image}
            alt={booking.business.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h5 className="mb-1">{booking.business.name}</h5>
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="capitalize">{booking.business.category}</span>
                <span>•</span>
                <span className="text-[var(--color-text-secondary)]">
                  {booking.referenceCode}
                </span>
              </div>
            </div>
            <Badge
              variant={
                booking.status === 'upcoming'
                  ? 'default'
                  : booking.status === 'past'
                  ? 'secondary'
                  : 'destructive'
              }
              className={
                booking.status === 'upcoming'
                  ? 'bg-[var(--color-highlight)]'
                  : ''
              }
            >
              {booking.status}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span>{format(booking.date, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span>
                {booking.time} • {booking.service.duration} min
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span>{booking.business.location}</span>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Service</span>
              <span>{booking.service.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-[var(--color-text-secondary)]">Total</span>
              <span>${booking.totalPrice}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onWhatsAppClick(booking.id)}
              className="bg-[var(--color-accent-whatsapp)] hover:bg-[#1FA855] text-white"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            {booking.status === 'upcoming' && (
              <>
                <Button
                  onClick={() => onReschedule(booking.id)}
                  variant="outline"
                  size="sm"
                >
                  Reschedule
                </Button>
                <Button
                  onClick={() => handleCancelClick(booking.id)}
                  variant="outline"
                  size="sm"
                  className="text-[var(--color-error)] border-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
            {booking.status === 'past' && (
              <Button variant="outline" size="sm">
                Leave Review
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
      <div className="w-20 h-20 bg-[var(--color-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-10 h-10 text-[var(--color-text-secondary)]" />
      </div>
      <h5 className="mb-2">No bookings found</h5>
      <p className="text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="mb-2">My Bookings</h2>
          <p className="text-[var(--color-text-secondary)]">
            Manage your appointments and reservations
          </p>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-8">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="space-y-4">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              ) : (
                <EmptyState message="You don't have any upcoming bookings. Start exploring!" />
              )}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="space-y-4">
              {pastBookings.length > 0 ? (
                pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              ) : (
                <EmptyState message="Your past bookings will appear here." />
              )}
            </div>
          </TabsContent>

          <TabsContent value="cancelled">
            <div className="space-y-4">
              {cancelledBookings.length > 0 ? (
                cancelledBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              ) : (
                <EmptyState message="You don't have any cancelled bookings." />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
              Please check the cancellation policy for any applicable fees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-[var(--color-error)] hover:bg-red-600"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
