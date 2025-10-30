import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Business, Service } from '../../types';
import { Calendar, Clock, Users, DollarSign, CheckCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface BookingFlowProps {
  business: Business;
  initialData: {
    service: Service;
    date: Date;
    time: string;
    partySize: number;
    totalPrice: number;
  };
  onComplete: (bookingData: any) => void;
  onBack: () => void;
}

export function BookingFlow({ business, initialData, onComplete, onBack }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    whatsappUpdates: true,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    onComplete({
      ...initialData,
      ...formData,
      business,
    });
  };

  const steps = [
    { number: 1, label: 'Details' },
    { number: 2, label: 'Date & Time' },
    { number: 3, label: 'Your Info' },
    { number: 4, label: 'Review' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      step >= s.number
                        ? 'bg-[var(--color-secondary)] text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step > s.number ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      s.number
                    )}
                  </div>
                  <span
                    className={`text-sm mt-2 ${
                      step >= s.number ? 'text-[var(--color-text-primary)]' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 transition-colors ${
                      step > s.number ? 'bg-[var(--color-secondary)]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-8">
          {/* Step 1: Details (Skip - already selected) */}
          {step === 1 && (
            <div>
              <h3 className="mb-6">Booking Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-xl">
                  <span className="text-[var(--color-text-secondary)]">Service</span>
                  <span>{initialData.service.name}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-xl">
                  <span className="text-[var(--color-text-secondary)]">Duration</span>
                  <span>{initialData.service.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-xl">
                  <span className="text-[var(--color-text-secondary)]">Party Size</span>
                  <span>{initialData.partySize} {initialData.partySize === 1 ? 'person' : 'people'}</span>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={onBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time (Already selected, just confirm) */}
          {step === 2 && (
            <div>
              <h3 className="mb-6">Date & Time</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-xl">
                  <Calendar className="w-8 h-8 text-[var(--color-secondary)]" />
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Date</div>
                    <div className="text-lg">{format(initialData.date, 'EEEE, MMMM d, yyyy')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-xl">
                  <Clock className="w-8 h-8 text-[var(--color-secondary)]" />
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Time</div>
                    <div className="text-lg">{initialData.time}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Your Info */}
          {step === 3 && (
            <div>
              <h3 className="mb-6">Your Information</h3>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+65 9123 4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    WhatsApp notifications will be sent to this number
                  </p>
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Special Requests (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requests or notes for the business..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
                <div className="flex items-start gap-3 p-4 bg-[var(--color-accent-whatsapp)]10 rounded-xl">
                  <Checkbox
                    id="whatsapp"
                    checked={formData.whatsappUpdates}
                    onCheckedChange={(checked) => handleInputChange('whatsappUpdates', checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="whatsapp" className="cursor-pointer">
                      Send me updates via WhatsApp
                    </Label>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Get booking confirmations, reminders, and updates through WhatsApp
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!formData.name || !formData.phone}
                  className="flex-1 bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white"
                >
                  Review Booking
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h3 className="mb-6">Review Your Booking</h3>
              
              {/* Business Info */}
              <div className="mb-6 p-6 bg-[var(--color-surface)] rounded-xl">
                <h5 className="mb-4">{business.name}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Service</span>
                    <span>{initialData.service.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Date</span>
                    <span>{format(initialData.date, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Time</span>
                    <span>{initialData.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Duration</span>
                    <span>{initialData.service.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Party Size</span>
                    <span>{initialData.partySize}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6 p-6 bg-[var(--color-surface)] rounded-xl">
                <h6 className="mb-4">Contact Information</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Name</span>
                    <span>{formData.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Phone</span>
                    <span>{formData.phone}</span>
                  </div>
                  {formData.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-secondary)]">Email</span>
                      <span>{formData.email}</span>
                    </div>
                  )}
                </div>
                {formData.notes && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">Notes:</span>
                    <p className="text-sm mt-1">{formData.notes}</p>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="mb-6 p-6 bg-[var(--color-surface)] rounded-xl">
                <h6 className="mb-4">Payment Summary</h6>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Service Fee</span>
                    <span>${initialData.service.price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Booking Fee</span>
                    <span>$2</span>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-2xl">${initialData.totalPrice + 2}</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-[var(--color-highlight)] hover:bg-[#00A874] text-white"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
