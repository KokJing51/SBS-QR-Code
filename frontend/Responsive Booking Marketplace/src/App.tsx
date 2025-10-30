import { useState } from 'react';
import { AuthModal } from './components/auth/AuthModal';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { ScrollToTop } from './components/shared/ScrollToTop';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Hero } from './components/home/Hero';
import { HowItWorks } from './components/home/HowItWorks';
import { CategoryTiles } from './components/home/CategoryTiles';
import { FeaturedBusinesses } from './components/home/FeaturedBusinesses';
import { WhatsAppBanner } from './components/home/WhatsAppBanner';
import { SearchResults } from './components/pages/SearchResults';
import { BusinessProfile } from './components/pages/BusinessProfile';
import { BookingFlow } from './components/booking/BookingFlow';
import { ConfirmationPage } from './components/booking/ConfirmationPage';
import { MyBookings } from './components/pages/MyBookings';
import { mockBusinesses, mockServices, mockReviews } from './data/mockData';
import { Booking } from './types';

type Page =
  | 'home'
  | 'browse'
  | 'business-profile'
  | 'booking-flow'
  | 'confirmation'
  | 'my-bookings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  // Get current business data
  const selectedBusiness = selectedBusinessId
    ? mockBusinesses.find((b) => b.id === selectedBusinessId)
    : null;
  const selectedServices = selectedBusinessId
    ? mockServices[selectedBusinessId] || []
    : [];
  const selectedReviews = selectedBusinessId
    ? mockReviews[selectedBusinessId] || []
    : [];

  // Navigation handlers
  const handleNavigate = (page: string) => {
    if (page === 'home') {
      setCurrentPage('home');
      setSelectedBusinessId(null);
    } else if (page === 'browse' || page === 'categories') {
      setCurrentPage('browse');
    } else if (page === 'how-it-works') {
      setCurrentPage('home');
      setTimeout(() => {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleSearch = (params: any) => {
    setCurrentPage('browse');
    toast.success('Searching for businesses...');
  };

  const handleCategoryClick = (category: string) => {
    setCurrentPage('browse');
    toast.info(`Showing ${category} venues`);
  };

  const handleBusinessClick = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setCurrentPage('business-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartBooking = (data: any) => {
    setBookingData(data);
    setCurrentPage('booking-flow');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToProfile = () => {
    setCurrentPage('business-profile');
  };

  const handleCompleteBooking = (data: any) => {
    const referenceCode = `BKA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = {
      id: Date.now().toString(),
      referenceCode,
      business: data.business,
      service: data.service,
      date: data.date,
      time: data.time,
      partySize: data.partySize,
      customerName: data.name,
      customerPhone: data.phone,
      customerEmail: data.email,
      notes: data.notes,
      status: 'upcoming',
      whatsappUpdates: data.whatsappUpdates,
      totalPrice: data.totalPrice,
    };

    setMyBookings((prev) => [newBooking, ...prev]);
    setConfirmedBooking(newBooking);
    setCurrentPage('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success('Booking confirmed!');
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/6591234567', '_blank');
    toast.info('Opening WhatsApp...');
  };

  const handleReschedule = () => {
    if (selectedBusinessId && selectedBusiness) {
      setCurrentPage('business-profile');
      toast.info('Select a new date and time');
    }
  };

  const handleViewBookings = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      toast.info('Please sign in to view your bookings');
    } else {
      setCurrentPage('my-bookings');
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    toast.success('Successfully signed in!');
  };

  const handleCancelBooking = (bookingId: string) => {
    setMyBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
    );
    toast.success('Booking cancelled');
  };

  return (
    <div className="min-h-screen">
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onAuthClick={() => setAuthModalOpen(true)}
      />

      {/* Home Page */}
      {currentPage === 'home' && (
        <>
          <Hero onSearch={handleSearch} />
          <div id="how-it-works">
            <HowItWorks />
          </div>
          <CategoryTiles onCategoryClick={handleCategoryClick} />
          <FeaturedBusinesses
            businesses={mockBusinesses}
            onBusinessClick={handleBusinessClick}
          />
          <WhatsAppBanner />
          <Footer />
        </>
      )}

      {/* Search/Browse Results */}
      {currentPage === 'browse' && (
        <>
          <SearchResults
            businesses={mockBusinesses}
            onBusinessClick={handleBusinessClick}
          />
          <Footer />
        </>
      )}

      {/* Business Profile */}
      {currentPage === 'business-profile' && selectedBusiness && (
        <>
          <BusinessProfile
            business={selectedBusiness}
            services={selectedServices}
            reviews={selectedReviews}
            onStartBooking={handleStartBooking}
            onWhatsAppClick={handleWhatsAppClick}
          />
          <Footer />
        </>
      )}

      {/* Booking Flow */}
      {currentPage === 'booking-flow' && selectedBusiness && bookingData && (
        <>
          <BookingFlow
            business={selectedBusiness}
            initialData={bookingData}
            onComplete={handleCompleteBooking}
            onBack={handleBackToProfile}
          />
          <Footer />
        </>
      )}

      {/* Confirmation Page */}
      {currentPage === 'confirmation' && confirmedBooking && (
        <>
          <ConfirmationPage
            booking={confirmedBooking}
            onWhatsAppClick={handleWhatsAppClick}
            onReschedule={handleReschedule}
            onViewBookings={handleViewBookings}
            onHome={() => handleNavigate('home')}
          />
          <Footer />
        </>
      )}

      {/* My Bookings */}
      {currentPage === 'my-bookings' && (
        <>
          <MyBookings
            bookings={myBookings}
            onReschedule={(id) => {
              const booking = myBookings.find((b) => b.id === id);
              if (booking) {
                setSelectedBusinessId(booking.business.id);
                setCurrentPage('business-profile');
                toast.info('Select a new date and time');
              }
            }}
            onCancel={handleCancelBooking}
            onWhatsAppClick={handleWhatsAppClick}
          />
          <Footer />
        </>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" />
      <ScrollToTop />
    </div>
  );
}