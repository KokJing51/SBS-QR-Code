import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { 
  Upload, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Camera,
  DollarSign,
  Clock,
  User,
  FileText,
  Image as ImageIcon,
  Star
} from 'lucide-react';
import { unsplash_tool } from '../ui/utils';

interface ContentManagerProps {
  onNavigate: (page: string) => void;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
  category: string;
}

interface StaffMember {
  id: string;
  name: string;
  bio: string;
  photo?: string;
  specialties: string[];
  active: boolean;
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Haircut & Style',
    description: 'Professional haircut with wash and style',
    duration: 60,
    price: 50,
    active: true,
    category: 'Hair'
  },
  {
    id: '2',
    name: 'Hair Coloring',
    description: 'Full color service including consultation',
    duration: 120,
    price: 80,
    active: true,
    category: 'Hair'
  },
  {
    id: '3',
    name: 'Beard Trim',
    description: 'Precision beard trimming and styling',
    duration: 30,
    price: 25,
    active: true,
    category: 'Grooming'
  },
  {
    id: '4',
    name: 'Deep Conditioning',
    description: 'Intensive hair treatment and conditioning',
    duration: 45,
    price: 40,
    active: true,
    category: 'Treatment'
  }
];

const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'Emma Rodriguez',
    bio: 'Senior stylist with 8 years of experience. Specializes in color and modern cuts.',
    specialties: ['Hair Coloring', 'Haircut & Style', 'Deep Conditioning'],
    active: true
  },
  {
    id: '2',
    name: 'Alex Johnson',
    bio: 'Master barber and grooming specialist. Expert in traditional and modern styles.',
    specialties: ['Haircut & Style', 'Beard Trim'],
    active: true
  }
];

export function ContentManager({ onNavigate }: ContentManagerProps) {
  const [businessProfile, setBusinessProfile] = useState({
    name: 'StyleCraft Salon',
    about: 'We are a modern salon focused on providing exceptional hair and beauty services in a relaxing environment. Our experienced stylists stay up-to-date with the latest trends and techniques.',
    thingsToKnow: 'Please arrive 10 minutes early for your appointment. We have a 24-hour cancellation policy. Consultations are complimentary for first-time color clients.',
    address: '123 Main Street, Downtown',
    phone: '(555) 123-4567',
    email: 'hello@stylecraftsalon.com'
  });

  const [services, setServices] = useState<Service[]>(mockServices);
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const handleSaveProfile = () => {
    // Save business profile
    console.log('Saving business profile:', businessProfile);
  };

  const handleAddService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      name: '',
      description: '',
      duration: 60,
      price: 0,
      active: true,
      category: 'Hair'
    };
    setEditingService(newService);
  };

  const handleSaveService = (service: Service) => {
    if (service.id && services.find(s => s.id === service.id)) {
      setServices(prev => prev.map(s => s.id === service.id ? service : s));
    } else {
      setServices(prev => [...prev, { ...service, id: Date.now().toString() }]);
    }
    setEditingService(null);
  };

  const handleDeleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const handleAddStaff = () => {
    const newStaff: StaffMember = {
      id: Date.now().toString(),
      name: '',
      bio: '',
      specialties: [],
      active: true
    };
    setEditingStaff(newStaff);
  };

  const handleSaveStaff = (staffMember: StaffMember) => {
    if (staffMember.id && staff.find(s => s.id === staffMember.id)) {
      setStaff(prev => prev.map(s => s.id === staffMember.id ? staffMember : s));
    } else {
      setStaff(prev => [...prev, { ...staffMember, id: Date.now().toString() }]);
    }
    setEditingStaff(null);
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaff(prev => prev.filter(s => s.id !== staffId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Content Manager</h1>
          <p className="text-muted-foreground">Manage your business profile and services</p>
        </div>
        <Button onClick={handleSaveProfile}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        {/* Business Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Update your basic business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input
                      id="business-name"
                      value={businessProfile.name}
                      onChange={(e) => setBusinessProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={businessProfile.phone}
                      onChange={(e) => setBusinessProfile(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={businessProfile.email}
                      onChange={(e) => setBusinessProfile(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={businessProfile.address}
                      onChange={(e) => setBusinessProfile(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About Your Business</CardTitle>
                <CardDescription>Tell customers about your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="about">About Us</Label>
                  <Textarea
                    id="about"
                    value={businessProfile.about}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, about: e.target.value }))}
                    className="min-h-[100px]"
                    placeholder="Describe your business, what makes you unique..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Policies</CardTitle>
                <CardDescription>Important information for customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="policies">Things to Know Before Booking</Label>
                  <Textarea
                    id="policies"
                    value={businessProfile.thingsToKnow}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, thingsToKnow: e.target.value }))}
                    className="min-h-[100px]"
                    placeholder="Cancellation policies, preparation instructions, etc."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Services ({services.length})</span>
                  <Button onClick={handleAddService}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </CardTitle>
                <CardDescription>Manage your service offerings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{service.name}</h3>
                          <Badge variant={service.active ? 'default' : 'secondary'}>
                            {service.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{service.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {service.duration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {service.price}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingService(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Team Members ({staff.length})</span>
                  <Button onClick={handleAddStaff}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                </CardTitle>
                <CardDescription>Manage your staff and their specialties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={member.photo} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{member.name}</h3>
                          <Badge variant={member.active ? 'default' : 'secondary'}>
                            {member.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{member.bio}</p>
                        <div className="flex flex-wrap gap-2">
                          {member.specialties.map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingStaff(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStaff(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
              <CardDescription>Showcase your work and salon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Upload Photos</h3>
                  <p className="text-muted-foreground mb-4">
                    Add photos of your work, salon, and team
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photos
                  </Button>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="relative aspect-square">
                      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingService.id && services.find(s => s.id === editingService.id) ? 'Edit Service' : 'Add Service'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input
                  value={editingService.name}
                  onChange={(e) => setEditingService(prev => prev && { ...prev, name: e.target.value })}
                  placeholder="e.g., Haircut & Style"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingService.description}
                  onChange={(e) => setEditingService(prev => prev && { ...prev, description: e.target.value })}
                  placeholder="Describe this service..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={editingService.duration}
                    onChange={(e) => setEditingService(prev => prev && { ...prev, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService(prev => prev && { ...prev, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editingService.active}
                  onCheckedChange={(checked) => setEditingService(prev => prev && { ...prev, active: checked })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingService(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => editingService && handleSaveService(editingService)}
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingStaff.id && staff.find(s => s.id === editingStaff.id) ? 'Edit Team Member' : 'Add Team Member'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    <Camera className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  Upload Photo
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff(prev => prev && { ...prev, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={editingStaff.bio}
                  onChange={(e) => setEditingStaff(prev => prev && { ...prev, bio: e.target.value })}
                  placeholder="Brief bio and experience..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Specialties</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editingStaff.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                      <button
                        onClick={() => setEditingStaff(prev => prev && {
                          ...prev,
                          specialties: prev.specialties.filter(s => s !== specialty)
                        })}
                        className="ml-1 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    !editingStaff.specialties.includes(service.name) && (
                      <Button
                        key={service.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStaff(prev => prev && {
                          ...prev,
                          specialties: [...prev.specialties, service.name]
                        })}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {service.name}
                      </Button>
                    )
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editingStaff.active}
                  onCheckedChange={(checked) => setEditingStaff(prev => prev && { ...prev, active: checked })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingStaff(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => editingStaff && handleSaveStaff(editingStaff)}
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}