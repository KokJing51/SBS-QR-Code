import { Search, Calendar, CheckCircle } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Search & Browse',
      description: 'Find salons, restaurants, or sports venues by location, date, and category',
      color: 'var(--color-secondary)',
    },
    {
      icon: Calendar,
      title: 'Pick Your Slot',
      description: 'Choose your preferred date, time, and service with real-time availability',
      color: 'var(--color-secondary)',
    },
    {
      icon: CheckCircle,
      title: 'Confirm Instantly',
      description: 'Get instant confirmation via WhatsApp with all booking details',
      color: 'var(--color-accent-whatsapp)',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">How it works</h2>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto">
            Book your next appointment in three simple steps — powered by AI and WhatsApp automation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center">
                <div className="relative mb-6 inline-block">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-soft"
                    style={{ backgroundColor: `${step.color}15` }}
                  >
                    <Icon
                      className="w-10 h-10"
                      style={{ color: step.color }}
                    />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-24 w-16 h-0.5 bg-[var(--color-border)]" />
                  )}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm">
                    {index + 1}
                  </div>
                </div>
                <h4 className="mb-3">{step.title}</h4>
                <p className="text-[var(--color-text-secondary)]">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
