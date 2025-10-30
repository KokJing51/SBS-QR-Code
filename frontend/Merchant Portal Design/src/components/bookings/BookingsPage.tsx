import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { 
  Search, 
  Filter, 
  Download, 
  MessageSquare, 
  Calendar,
  User,
  DollarSign,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  RotateCcw,
  RefreshCw,
  X
} from 'lucide-react';
import { cn } from '../ui/utils';

interface BookingsPageProps {
  onNavigate: (page: string) => void;
}

interface Booking {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  service: string;
  staff: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show';
  channel: 'whatsapp' | 'web';
  notes?: string;
  createdAt: string;
}

const mockBookings: Booking[] = [
  {
    id: 'BK001',
    customer: {
      name: 'Sarah Johnson',
      phone: '+1 (555) 123-4567',
      email: 'sarah.johnson@email.com'
    },
    service: 'Haircut & Style',
    staff: 'Emma',
    date: '2024-03-20',
    time: '10:00 AM',
    duration: 60,
    price: 50,
    status: 'confirmed',
    channel: 'whatsapp',
    notes: 'Prefers shorter length, similar to previous style',
    createdAt: '2024-03-18T14:30:00Z'
  },
  {
    id: 'BK002',
    customer: {
      name: 'Mike Chen',
      phone: '+1 (555) 234-5678',
      email: 'mike.chen@email.com'
    },
    service: 'Beard Trim',
    staff: 'Alex',
    date: '2024-03-20',
    time: '11:30 AM',
    duration: 30,
    price: 25,
    status: 'pending',
    channel: 'whatsapp',
    createdAt: '2024-03-18T15:45:00Z'
  },
  {
    id: 'BK003',
    customer: {
      name: 'Lisa Wong',
      phone: '+1 (555) 345-6789',
      email: 'lisa.wong@email.com'
    },
    service: 'Hair Coloring',
    staff: 'Emma',
    date: '2024-03-21',
    time: '1:00 PM',
    duration: 120,
    price: 80,
    status: 'confirmed',
    channel: 'web',
    notes: 'First time customer, discussed blonde highlights',
    createdAt: '2024-03-17T10:15:00Z'
  },
  {
    id: 'BK004',
    customer: {
      name: 'John Doe',
      phone: '+1 (555) 456-7890',
      email: 'john.doe@email.com'
    },
    service: 'Haircut',
    staff: 'Alex',
    date: '2024-03-19',
    time: '2:00 PM',
    duration: 45,
    price: 35,
    status: 'cancelled',
    channel: 'whatsapp',
    createdAt: '2024-03-16T09:20:00Z'
  },
  {
    id: 'BK005',
    customer: {
      name: 'Anna Taylor',
      phone: '+1 (555) 567-8901',
      email: 'anna.taylor@email.com'
    },
    service: 'Deep Conditioning',
    staff: 'Emma',
    date: '2024-03-18',
    time: '9:00 AM',
    duration: 45,
    price: 40,
    status: 'completed',
    channel: 'whatsapp',
    createdAt: '2024-03-15T16:30:00Z'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'completed':
      return 'bg-blue-100 text-blue-700';
    case 'no-show':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getChannelIcon = (channel: string) => {
  return channel === 'whatsapp' ? (
    <MessageSquare className="h-4 w-4 text-green-600" />
  ) : (
    <Calendar className="h-4 w-4 text-blue-600" />
  );
};

export function BookingsPage({ onNavigate }: BookingsPageProps) {
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filteredBookings = mockBookings.filter(booking => {
    const matchesSearch = booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || booking.channel === channelFilter;
    
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(filteredBookings.map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on bookings:`, selectedBookings);
    // Implement bulk actions
    setSelectedBookings([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage all your customer bookings</p>
        </div>
        <Button onClick={() => onNavigate('calendar')}>
          <Calendar className="h-4 w-4 mr-2" />
          View Calendar
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="web">Web Portal</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedBookings.length} booking(s) selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('confirm')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('cancel')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('message')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedBookings.includes(booking.id)}
                      onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.customer.name}</p>
                      <p className="text-sm text-muted-foreground">{booking.customer.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.service}</p>
                      <p className="text-sm text-muted-foreground">{booking.duration} min</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{new Date(booking.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{booking.time}</p>
                    </div>
                  </TableCell>
                  <TableCell>{booking.staff}</TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", getStatusColor(booking.status))}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getChannelIcon(booking.channel)}
                      <span className="capitalize text-sm">{booking.channel}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${booking.price}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Booking Detail Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="bg-background w-full max-w-md h-full shadow-xl overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Booking Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Booking Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Booking ID</span>
                  <span className="font-mono text-sm">{selectedBooking.id}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status</span>
                  <Badge className={cn("capitalize", getStatusColor(selectedBooking.status))}>
                    {selectedBooking.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Channel</span>
                  <div className="flex items-center gap-2">
                    {getChannelIcon(selectedBooking.channel)}
                    <span className="capitalize">{selectedBooking.channel}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Customer Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedBooking.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedBooking.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedBooking.customer.email}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Service Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Service Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedBooking.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Staff</span>
                    <span>{selectedBooking.staff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{selectedBooking.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{new Date(selectedBooking.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span>{selectedBooking.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">${selectedBooking.price}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-medium">Notes</h3>
                    <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <h3 className="font-medium">Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedBooking.status === 'pending' && (
                    <Button size="sm" className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                  )}
                  
                  {['confirmed', 'pending'].includes(selectedBooking.status) && (
                    <>
                      <Button size="sm" variant="outline" className="w-full">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reschedule
                      </Button>
                    </>
                  )}
                  
                  <Button size="sm" variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  
                  <Button size="sm" variant="outline" className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Refund
                  </Button>
                </div>
              </div>

              {/* Booking History */}
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium">Booking History</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(selectedBooking.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{new Date(selectedBooking.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}