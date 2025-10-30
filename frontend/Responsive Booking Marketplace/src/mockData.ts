import { Business, Service, Review } from '../types';

export const mockBusinesses: Business[] = [
  {
    id: '1',
    name: 'Lumière Salon',
    category: 'salon',
    description: 'Premium hair and beauty salon with expert stylists and luxurious treatments.',
    image: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    rating: 4.8,
    reviewCount: 156,
    priceRange: 3,
    location: 'Orchard Road',
    distance: 1.2,
    nextAvailable: 'Today 2:00 PM',
    badges: ['WhatsApp Auto', 'Instant Confirm'],
    whatsappEnabled: true,
    instantConfirm: true,
    phone: '+6591234567',
    address: '123 Orchard Road, #02-45, Singapore 238123',
    policies: {
      cancellation: 'Free cancellation up to 24 hours before appointment',
      deposit: 'S$20 deposit required for bookings over S$100',
      lateArrival: 'Please arrive 10 minutes early. Late arrivals may result in shortened service time',
    },
    gallery: [
      'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1719858511928-94db73c8de67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    hours: {
      'Mon-Fri': '10:00 AM - 9:00 PM',
      'Sat-Sun': '9:00 AM - 8:00 PM',
    },
  },
  {
    id: '2',
    name: 'Kopitiam 88',
    category: 'restaurant',
    description: 'Authentic local cuisine in a cozy setting. Family-friendly with traditional favorites.',
    image: 'https://images.unsplash.com/photo-1600470944938-b301e41001c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    rating: 4.6,
    reviewCount: 289,
    priceRange: 2,
    location: 'Chinatown',
    distance: 2.5,
    nextAvailable: 'Today 6:30 PM',
    badges: ['WhatsApp Auto', 'Free Cancellation'],
    whatsappEnabled: true,
    instantConfirm: true,
    phone: '+6591234568',
    address: '45 Smith Street, Singapore 058934',
    policies: {
      cancellation: 'Free cancellation up to 2 hours before reservation',
      deposit: 'No deposit required for parties under 6',
      lateArrival: 'Tables held for 15 minutes. Please call if running late',
    },
    gallery: [
      'https://images.unsplash.com/photo-1600470944938-b301e41001c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1756397481872-ed981ef72a51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    hours: {
      'Mon-Sun': '11:00 AM - 11:00 PM',
    },
  },
  {
    id: '3',
    name: 'Ace Courts',
    category: 'sports',
    description: 'Premier indoor sports facility with badminton, tennis, and squash courts.',
    image: 'https://images.unsplash.com/photo-1624024834874-2a1611305604?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    rating: 4.9,
    reviewCount: 342,
    priceRange: 3,
    location: 'Kallang',
    distance: 3.8,
    nextAvailable: 'Tomorrow 8:00 AM',
    badges: ['WhatsApp Auto', 'Instant Confirm', 'Free Cancellation'],
    whatsappEnabled: true,
    instantConfirm: true,
    phone: '+6591234569',
    address: '100 Stadium Road, Singapore 397714',
    policies: {
      cancellation: 'Free cancellation up to 6 hours before booking',
      deposit: 'Full payment required at booking',
      lateArrival: 'Court time starts at booked time. No extensions for late arrivals',
    },
    gallery: [
      'https://images.unsplash.com/photo-1624024834874-2a1611305604?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1703565391056-3e8b33cfe2c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    hours: {
      'Mon-Sun': '6:00 AM - 11:00 PM',
    },
  },
  {
    id: '4',
    name: 'The Jade Garden',
    category: 'restaurant',
    description: 'Fine dining with contemporary Asian fusion cuisine and elegant ambiance.',
    image: 'https://images.unsplash.com/photo-1756397481872-ed981ef72a51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    rating: 4.7,
    reviewCount: 198,
    priceRange: 4,
    location: 'Marina Bay',
    distance: 4.2,
    nextAvailable: 'Today 7:00 PM',
    badges: ['WhatsApp Auto'],
    whatsappEnabled: true,
    instantConfirm: false,
    phone: '+6591234570',
    address: '1 Marina Boulevard, #02-01, Singapore 018989',
    policies: {
      cancellation: 'Free cancellation up to 24 hours before reservation',
      deposit: 'S$50 per person deposit required',
      lateArrival: 'Please arrive on time. Reservations held for 15 minutes',
    },
    gallery: [
      'https://images.unsplash.com/photo-1756397481872-ed981ef72a51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    hours: {
      'Mon-Sun': '12:00 PM - 3:00 PM, 6:00 PM - 11:00 PM',
    },
  },
  {
    id: '5',
    name: 'Bliss Spa & Wellness',
    category: 'salon',
    description: 'Tranquil spa offering massage, facials, and holistic wellness treatments.',
    image: 'https://images.unsplash.com/photo-1719858511928-94db73c8de67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    rating: 4.9,
    reviewCount: 412,
    priceRange: 4,
    location: 'Sentosa',
    distance: 6.5,
    nextAvailable: 'Tomorrow 10:00 AM',
    badges: ['WhatsApp Auto', 'Instant Confirm', 'Free Cancellation'],
    whatsappEnabled: true,
    instantConfirm: true,
    phone: '+6591234571',
    address: '8 Sentosa Gateway, Sentosa Island, Singapore 098269',
    policies: {
      cancellation: 'Free cancellation up to 48 hours before appointment',
      deposit: 'S$50 deposit required, deducted from final bill',
      lateArrival: 'Arrive 15 minutes early for consultation. Late arrivals may result in shortened treatment',
    },
    gallery: [
      'https://images.unsplash.com/photo-1719858511928-94db73c8de67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    hours: {
      'Mon-Sun': '9:00 AM - 10:00 PM',
    },
  },
  {
    id: '6',
    name: 'PowerPlay Sports Arena',
    category: 'sports',
    description: 'Multi-sport facility with basketball, futsal, and volleyball courts.',
    image: 'https://images.unsplash.com/photo-1703565391056-3e8b33cfe2c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    rating: 4.5,
    reviewCount: 267,
    priceRange: 2,
    location: 'Tampines',
    distance: 8.3,
    nextAvailable: 'Today 5:00 PM',
    badges: ['WhatsApp Auto', 'Free Cancellation'],
    whatsappEnabled: true,
    instantConfirm: true,
    phone: '+6591234572',
    address: '3 Tampines Street 92, Singapore 528893',
    policies: {
      cancellation: 'Free cancellation up to 4 hours before booking',
      deposit: 'No deposit required',
      lateArrival: 'Grace period of 10 minutes. After that, booking may be forfeited',
    },
    gallery: [
      'https://images.unsplash.com/photo-1703565391056-3e8b33cfe2c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    hours: {
      'Mon-Sun': '7:00 AM - 11:00 PM',
    },
  },
];

export const mockServices: { [businessId: string]: Service[] } = {
  '1': [
    {
      id: 's1',
      name: 'Haircut & Styling',
      description: 'Professional haircut with wash and blow dry',
      duration: 60,
      price: 88,
      staff: ['Emily Chen', 'Sarah Tan'],
    },
    {
      id: 's2',
      name: 'Hair Coloring',
      description: 'Full color treatment with toner',
      duration: 120,
      price: 220,
      staff: ['Emily Chen'],
    },
    {
      id: 's3',
      name: 'Manicure & Pedicure',
      description: 'Complete nail care with gel polish',
      duration: 90,
      price: 98,
      staff: ['Linda Wong'],
    },
  ],
  '3': [
    {
      id: 's4',
      name: 'Badminton Court',
      description: 'Premium indoor badminton court',
      duration: 60,
      price: 35,
    },
    {
      id: 's5',
      name: 'Tennis Court',
      description: 'Professional tennis court with lighting',
      duration: 60,
      price: 45,
    },
  ],
  '5': [
    {
      id: 's6',
      name: 'Swedish Massage',
      description: 'Relaxing full-body massage',
      duration: 90,
      price: 158,
      staff: ['Therapist Anna', 'Therapist Maya'],
    },
    {
      id: 's7',
      name: 'Signature Facial',
      description: 'Deep cleansing and hydrating facial',
      duration: 75,
      price: 188,
      staff: ['Therapist Anna'],
    },
  ],
};

export const mockReviews: { [businessId: string]: Review[] } = {
  '1': [
    {
      id: 'r1',
      customerName: 'Jennifer L.',
      rating: 5,
      comment: 'Emily did an amazing job with my hair! The WhatsApp booking was super convenient.',
      date: new Date('2025-10-15'),
      verified: true,
    },
    {
      id: 'r2',
      customerName: 'Michael T.',
      rating: 5,
      comment: 'Great service and atmosphere. Very professional staff.',
      date: new Date('2025-10-10'),
      verified: true,
    },
    {
      id: 'r3',
      customerName: 'Amanda K.',
      rating: 4,
      comment: 'Love my new haircut! Booking through WhatsApp made it so easy.',
      date: new Date('2025-10-05'),
      verified: true,
    },
  ],
  '2': [
    {
      id: 'r4',
      customerName: 'David S.',
      rating: 5,
      comment: 'Authentic flavors! The laksa is amazing. Easy to book via WhatsApp.',
      date: new Date('2025-10-16'),
      verified: true,
    },
    {
      id: 'r5',
      customerName: 'Rachel W.',
      rating: 4,
      comment: 'Good food and friendly service. Great for families.',
      date: new Date('2025-10-12'),
      verified: true,
    },
  ],
  '3': [
    {
      id: 'r6',
      customerName: 'Kevin L.',
      rating: 5,
      comment: 'Best courts in the area! Clean facilities and easy WhatsApp booking.',
      date: new Date('2025-10-17'),
      verified: true,
    },
    {
      id: 'r7',
      customerName: 'Sophie M.',
      rating: 5,
      comment: 'Love playing here. The automated booking system is fantastic!',
      date: new Date('2025-10-14'),
      verified: true,
    },
  ],
};

export const generateTimeSlots = (date: Date) => {
  const slots = [];
  for (let hour = 9; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const random = Math.random();
      let status: 'available' | 'booked' | 'disabled' = 'available';
      
      if (random > 0.7) {
        status = 'booked';
      } else if (random > 0.9) {
        status = 'disabled';
      }
      
      slots.push({ time: timeString, status });
    }
  }
  return slots;
};
