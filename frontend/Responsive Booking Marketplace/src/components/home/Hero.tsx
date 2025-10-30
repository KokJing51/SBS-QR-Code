import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { MapPin, Calendar as CalendarIcon, Clock, Users, Search } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface HeroProps {
  onSearch: (params: any) => void;
}

export function Hero({ onSearch }: HeroProps) {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = () => {
    onSearch({
      location,
      date,
      time,
      partySize,
      category,
    });
  };

  return (
    <div className="relative bg-gradient-to-br from-[var(--color-primary)] to-[#2D2D44] text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-secondary)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-accent-whatsapp)] rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="mb-6 text-white">
            Book anything, instantly
          </h1>
          <p className="text-xl text-gray-200 mb-2">
            Salons, restaurants, sports venues — all in one place
          </p>
          <p className="text-lg text-[var(--color-accent-whatsapp)]">
            ✓ Confirmed via WhatsApp automation
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Location */}
            <div className="lg:col-span-2">
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
                <Input
                  placeholder="Orchard, Marina Bay..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 w-4 h-4" />
                    {date ? format(date, 'MMM d') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                Time
              </label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <SelectValue placeholder="Any time" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Party Size */}
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                Party Size
              </label>
              <Select value={partySize} onValueChange={setPartySize}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <SelectValue placeholder="People" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="salon">Salons</SelectItem>
                  <SelectItem value="restaurant">Restaurants</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSearch}
            className="w-full mt-6 bg-[var(--color-secondary)] hover:bg-[#6B7AE5] text-white h-12"
          >
            <Search className="mr-2 w-5 h-5" />
            Search
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-8 mt-12 text-center">
          <div>
            <div className="text-3xl mb-2">500+</div>
            <div className="text-gray-300 text-sm">Verified Businesses</div>
          </div>
          <div>
            <div className="text-3xl mb-2">50k+</div>
            <div className="text-gray-300 text-sm">Happy Customers</div>
          </div>
          <div>
            <div className="text-3xl mb-2">24/7</div>
            <div className="text-gray-300 text-sm">WhatsApp Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
