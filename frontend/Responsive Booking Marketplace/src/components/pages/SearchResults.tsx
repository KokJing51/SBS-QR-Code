import { useState } from 'react';
import { Business } from '../../types';
import { FilterPanel } from '../search/FilterPanel';
import { BusinessCard } from '../search/BusinessCard';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { SlidersHorizontal, Map, LayoutGrid } from 'lucide-react';

interface SearchResultsProps {
  businesses: Business[];
  onBusinessClick: (businessId: string) => void;
}

export function SearchResults({ businesses, onBusinessClick }: SearchResultsProps) {
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h3 className="mb-2">{businesses.length} businesses found</h3>
          <p className="text-[var(--color-text-secondary)]">
            Showing results in Singapore • Today
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <FilterPanel isMobile />
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="available">Next Available</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="hidden md:flex items-center gap-2 bg-white rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-[var(--color-secondary)]' : ''}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className={viewMode === 'map' ? 'bg-[var(--color-secondary)]' : ''}
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Desktop Filter Panel */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterPanel />
          </div>

          {/* Results */}
          <div className="flex-1">
            {viewMode === 'grid' ? (
              <div className="space-y-6">
                {businesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    onClick={() => onBusinessClick(business.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-soft h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-secondary)]" />
                  <h5 className="mb-2">Map View</h5>
                  <p className="text-[var(--color-text-secondary)]">
                    Interactive map view with business locations
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {businesses.length === 0 && (
              <div className="bg-white rounded-2xl p-12 shadow-soft text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-[var(--color-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <SlidersHorizontal className="w-10 h-10 text-[var(--color-text-secondary)]" />
                  </div>
                  <h4 className="mb-2">No results found</h4>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Try adjusting your filters or search criteria
                  </p>
                  <Button
                    variant="outline"
                    className="border-[var(--color-secondary)] text-[var(--color-secondary)]"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
