import { MessageCircle, CheckCircle, Bell, Calendar } from 'lucide-react';
import { Button } from '../ui/button';

export function WhatsAppBanner() {
  const features = [
    {
      icon: CheckCircle,
      text: 'Instant booking confirmations',
    },
    {
      icon: Bell,
      text: 'Real-time reminders & updates',
    },
    {
      icon: Calendar,
      text: 'Easy rescheduling via chat',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-[var(--color-accent-whatsapp)] to-[#1FA855]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-12 shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[var(--color-accent-whatsapp)]10 text-[var(--color-accent-whatsapp)] px-4 py-2 rounded-full mb-6">
                <MessageCircle className="w-5 h-5" />
                <span>Powered by WhatsApp Automation</span>
              </div>

              <h2 className="mb-4">
                Book smarter with WhatsApp
              </h2>
              <p className="text-[var(--color-text-secondary)] text-lg mb-8">
                Our AI-powered WhatsApp bot handles your entire booking journey — from confirmation to reminders, all in your favorite messaging app.
              </p>

              <div className="space-y-4 mb-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-accent-whatsapp)]10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[var(--color-accent-whatsapp)]" />
                      </div>
                      <span className="text-[var(--color-text-primary)]">
                        {feature.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Button className="bg-[var(--color-accent-whatsapp)] hover:bg-[#1FA855] text-white">
                <MessageCircle className="mr-2 w-5 h-5" />
                Learn More
              </Button>
            </div>

            {/* Right Side - Mock Chat Interface */}
            <div className="relative">
              <div className="bg-[#E8F5E9] rounded-3xl p-8 shadow-lg">
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-soft">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-accent-whatsapp)] flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div>Bookly.AI Bot</div>
                      <small className="text-[var(--color-text-secondary)]">
                        Automated booking assistant
                      </small>
                    </div>
                  </div>
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm p-3 mb-2">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      ✅ Your booking at <strong>Lumière Salon</strong> is confirmed!
                    </p>
                  </div>
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm p-3 mb-2">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      📅 Oct 20, 2025 at 2:00 PM<br />
                      💇‍♀️ Haircut & Styling with Emily Chen<br />
                      📍 123 Orchard Road
                    </p>
                  </div>
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm p-3">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      Reference: <strong>BKA-4821</strong><br />
                      I'll remind you 1 hour before! 😊
                    </p>
                  </div>
                </div>
                <small className="text-[var(--color-text-secondary)] block text-center">
                  All updates delivered via WhatsApp
                </small>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[var(--color-accent-whatsapp)]20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[var(--color-highlight)]20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
