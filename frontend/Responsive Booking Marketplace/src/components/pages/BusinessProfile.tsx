import { useState } from 'react';
import { Business, Service, Review } from '../../types';
import { BookingWidget } from '../business/BookingWidget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Star,
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Share2,
  Heart,
  CheckCircle,
  Info,
} from 'lucide-react';

interface BusinessProfileProps {
  business: Business;
  services: Service[];
  reviews: Review[];
  onStartBooking: (bookingData: any) => void;
  onWhatsAppClick: () => void;
}

export function BusinessProfile({
  business,
  services,
  reviews,
  onStartBooking,
  onWhatsAppClick,
}: BusinessProfileProps) {
  const [activeTab, setActiveTab] = useState('about');

  const getPriceRange = (level: number) => '$'.repeat(level);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Hero Section */}
      <div className="bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-6">
            <span className="cursor-pointer hover:text-[var(--color-text-primary)]">Home</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-[var(--color-text-primary)] capitalize">
              {business.category}
            </span>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">{business.name}</span>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2>{business.name}</h2>
                    <Badge className="bg-[var(--color-secondary)]10 text-[var(--color-secondary)] capitalize">
                      {business.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg">{business.rating}</span>
                      <span className="text-[var(--color-text-secondary)]">
                        ({business.reviewCount} reviews)
                      </span>
                    </div>
                    <span className="text-[var(--color-text-secondary)]">
                      {getPriceRange(business.priceRange)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-4">
                    <MapPin className="w-5 h-5" />
                    <span>{business.address}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {business.whatsappEnabled && (
                  <Badge className="bg-[var(--color-accent-whatsapp)] text-white border-none">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    WhatsApp Auto
                  </Badge>
                )}
                {business.instantConfirm && (
                  <Badge className="bg-[var(--color-highlight)] text-white border-none">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Instant Confirm
                  </Badge>
                )}
                {business.badges.includes('Free Cancellation') && (
                  <Badge variant="outline">Free Cancellation</Badge>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-4">
                <Button
                  onClick={onWhatsAppClick}
                  className="flex-1 bg-[var(--color-accent-whatsapp)] hover:bg-[#1FA855] text-white"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Message on WhatsApp
                </Button>
                <Button
                  onClick={() => window.location.href = `tel:${business.phone}`}
                  variant="outline"
                  className="flex-1"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call
                </Button>
              </div>
            </div>

            {/* Right: Image Gallery Preview */}
            <div className="lg:w-96">
              <div className="grid grid-cols-2 gap-2">
                {business.gallery.slice(0, 4).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={image}
                      alt={`${business.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Tabs Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start mb-8">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about">
                <div className="bg-white rounded-2xl p-8 shadow-soft">
                  <h4 className="mb-4">About Us</h4>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    {business.description}
                  </p>

                  <Separator className="my-6" />

                  <h5 className="mb-4">Opening Hours</h5>
                  <div className="space-y-2">
                    {Object.entries(business.hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className="text-[var(--color-text-secondary)]">{day}</span>
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <h5 className="mb-4">Contact</h5>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      <span>{business.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      <span>{business.address}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services">
                <div className="bg-white rounded-2xl p-8 shadow-soft">
                  <h4 className="mb-6">Services & Pricing</h4>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="border border-[var(--color-border)] rounded-xl p-6"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="mb-2">{service.name}</h5>
                            <p className="text-[var(--color-text-secondary)] text-sm">
                              {service.description}
                            </p>
                          </div>
                          <span className="text-xl">${service.price}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{service.duration} min</span>
                          </div>
                          {service.staff && service.staff.length > 0 && (
                            <span>Staff: {service.staff.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Policies Tab */}
              <TabsContent value="policies">
                <div className="bg-white rounded-2xl p-8 shadow-soft">
                  <h4 className="mb-6">Things to Know Before Booking</h4>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-5 h-5 text-[var(--color-secondary)]" />
                        <h6>Cancellation Policy</h6>
                      </div>
                      <p className="text-[var(--color-text-secondary)]">
                        {business.policies.cancellation}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-5 h-5 text-[var(--color-secondary)]" />
                        <h6>Deposit Requirements</h6>
                      </div>
                      <p className="text-[var(--color-text-secondary)]">
                        {business.policies.deposit}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-5 h-5 text-[var(--color-secondary)]" />
                        <h6>Late Arrival</h6>
                      </div>
                      <p className="text-[var(--color-text-secondary)]">
                        {business.policies.lateArrival}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <div className="bg-white rounded-2xl p-8 shadow-soft">
                  <div className="flex items-center justify-between mb-6">
                    <h4>Customer Reviews</h4>
                    <Button variant="outline">Write a Review</Button>
                  </div>

                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-[var(--color-border)] pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)]20 flex items-center justify-center">
                              <span>{review.customerName[0]}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span>{review.customerName}</span>
                                {review.verified && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                <div className="flex items-center">
                                  {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className="w-3 h-3 fill-yellow-400 text-yellow-400"
                                    />
                                  ))}
                                </div>
                                <span>•</span>
                                <span>{review.date.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[var(--color-text-secondary)]">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Booking Widget */}
          <div className="lg:w-96">
            <BookingWidget
              services={services}
              onContinue={onStartBooking}
              isSticky
            />
          </div>
        </div>
      </div>
    </div>
  );
}
