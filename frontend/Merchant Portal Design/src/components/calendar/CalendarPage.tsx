import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';

interface CalendarPageProps {
  onNavigate: (page: string) => void;
}

interface TimeSlot {
  id: string;
  time: string;
  status: 'open' | 'hold' | 'booked' | 'cancelled';
  customer?: string;
  service?: string;
  staff?: string;
}

interface DayData {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

const mockCalendarData: DayData[] = [
  {
    date: '2024-03-18',
    dayName: 'Mon',
    slots: [
      { id: '1', time: '9:00 AM', status: 'open' },
      { id: '2', time: '10:00 AM', status: 'booked', customer: 'Sarah Johnson', service: 'Haircut', staff: 'Emma' },
      { id: '3', time: '11:00 AM', status: 'hold', customer: 'Mike Chen', service: 'Beard Trim' },
      { id: '4', time: '12:00 PM', status: 'open' },
      { id: '5', time: '1:00 PM', status: 'booked', customer: 'Lisa Wong', service: 'Hair Color', staff: 'Emma' },
      { id: '6', time: '2:00 PM', status: 'cancelled', customer: 'John Doe', service: 'Haircut' },
    ]
  },
  {
    date: '2024-03-19',
    dayName: 'Tue',
    slots: [
      { id: '7', time: '9:00 AM', status: 'booked', customer: 'Anna Taylor', service: 'Deep Conditioning', staff: 'Emma' },
      { id: '8', time: '10:00 AM', status: 'open' },
      { id: '9', time: '11:00 AM', status: 'open' },
      { id: '10', time: '12:00 PM', status: 'booked', customer: 'David Kim', service: 'Haircut', staff: 'Alex' },
      { id: '11', time: '1:00 PM', status: 'hold', customer: 'Grace Lee' },
      { id: '12', time: '2:00 PM', status: 'open' },
    ]
  },
  // Add more days...
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-green-100 text-green-700 hover:bg-green-200';
    case 'hold':
      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
    case 'booked':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
    case 'cancelled':
      return 'bg-red-100 text-red-700 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'open':
      return 'Available';
    case 'hold':
      return 'On Hold';
    case 'booked':
      return 'Booked';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export function CalendarPage({ onNavigate }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const renderWeekView = () => (
    <div className="space-y-4">
      {/* Time slots grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {mockCalendarData.map((day) => (
          <Card key={day.date} className="min-h-[400px]">
            <CardHeader className="pb-3">
              <div className="text-center">
                <p className="font-semibold">{day.dayName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(day.date).getDate()}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {day.slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "w-full p-2 rounded-lg text-left transition-colors text-xs",
                    getStatusColor(slot.status)
                  )}
                >
                  <div className="font-medium">{slot.time}</div>
                  {slot.customer && (
                    <div className="truncate">{slot.customer}</div>
                  )}
                  {slot.service && (
                    <div className="truncate text-xs opacity-75">{slot.service}</div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium">Status:</span>
            {['open', 'hold', 'booked', 'cancelled'].map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded", getStatusColor(status))} />
                <span className="text-sm">{getStatusLabel(status)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMonthView = () => (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {/* Calendar headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-sm">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {Array.from({ length: 35 }, (_, i) => {
            const dayNumber = i - 6; // Adjust for starting day
            const isCurrentMonth = dayNumber > 0 && dayNumber <= 31;
            const bookedCount = Math.floor(Math.random() * 8);
            
            return (
              <div
                key={i}
                className={cn(
                  "p-2 min-h-[80px] border rounded-lg",
                  isCurrentMonth ? "bg-background" : "bg-muted"
                )}
              >
                {isCurrentMonth && (
                  <>
                    <div className="text-sm font-medium">{dayNumber}</div>
                    {bookedCount > 0 && (
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {bookedCount} booked
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar & Bookings</h1>
          <p className="text-muted-foreground">Manage your availability and bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onNavigate('bookings')}>
            <Eye className="h-4 w-4 mr-2" />
            View All Bookings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Booking
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[150px] text-center">
                {formatDate(currentDate)}
              </h2>
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>

            {/* View mode and filters */}
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="emma">Emma</SelectItem>
                  <SelectItem value="alex">Alex</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Content */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsContent value="week">
          {renderWeekView()}
        </TabsContent>
        <TabsContent value="month">
          {renderMonthView()}
        </TabsContent>
        <TabsContent value="day">
          <Card>
            <CardHeader>
              <CardTitle>Day View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Day view implementation would go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Slot Details Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedSlot.time} Slot</span>
                <Badge variant={selectedSlot.status === 'open' ? 'secondary' : 'default'}>
                  {getStatusLabel(selectedSlot.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSlot.customer && (
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-muted-foreground">{selectedSlot.customer}</p>
                </div>
              )}
              
              {selectedSlot.service && (
                <div>
                  <p className="text-sm font-medium">Service</p>
                  <p className="text-sm text-muted-foreground">{selectedSlot.service}</p>
                </div>
              )}
              
              {selectedSlot.staff && (
                <div>
                  <p className="text-sm font-medium">Staff</p>
                  <p className="text-sm text-muted-foreground">{selectedSlot.staff}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedSlot.status === 'open' && (
                  <Button size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Book Slot
                  </Button>
                )}
                
                {selectedSlot.status !== 'open' && (
                  <>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setSelectedSlot(null)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}