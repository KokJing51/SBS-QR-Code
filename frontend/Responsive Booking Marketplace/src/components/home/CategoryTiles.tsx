import { Scissors, UtensilsCrossed, Trophy } from 'lucide-react';
import { Button } from '../ui/button';

interface CategoryTilesProps {
  onCategoryClick: (category: string) => void;
}

export function CategoryTiles({ onCategoryClick }: CategoryTilesProps) {
  const categories = [
    {
      id: 'salon',
      name: 'Salons & Spas',
      description: 'Haircuts, coloring, massages, facials and more',
      icon: Scissors,
      color: '#7F8CFF',
      businesses: '120+ venues',
    },
    {
      id: 'restaurant',
      name: 'Restaurants & Cafés',
      description: 'Reserve tables at your favorite dining spots',
      icon: UtensilsCrossed,
      color: '#00C389',
      businesses: '250+ venues',
    },
    {
      id: 'sports',
      name: 'Sports & Fitness',
      description: 'Book courts, classes, and training sessions',
      icon: Trophy,
      color: '#7F8CFF',
      businesses: '80+ venues',
    },
  ];

  return (
    <section className="py-24 gradient-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">Browse by category</h2>
          <p className="text-[var(--color-text-secondary)] text-lg">
            Discover and book services across multiple industries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => onCategoryClick(category.id)}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${category.color}15` }}
                >
                  <Icon
                    className="w-8 h-8"
                    style={{ color: category.color }}
                  />
                </div>
                <h4 className="mb-3">{category.name}</h4>
                <p className="text-[var(--color-text-secondary)] mb-4">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {category.businesses}
                  </span>
                  <Button
                    variant="ghost"
                    className="text-[var(--color-secondary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]10"
                  >
                    Explore →
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
