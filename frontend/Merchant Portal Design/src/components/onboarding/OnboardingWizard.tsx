import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Calendar } from '../ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Upload, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Plus, 
  Trash2,
  Camera,
  CheckCircle
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface BusinessData {
  name: string;
  industry: string;
  address: string;
  timezone: string;
  about: string;
  policies: string;
  cancellationPolicy: string;
  depositRequired: boolean;
  services: any[];
  staff: any[];
  workingHours: any;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessData, setBusinessData] = useState<BusinessData>({
    name: '',
    industry: '',
    address: '',
    timezone: '',
    about: '',
    policies: '',
    cancellationPolicy: '',
    depositRequired: false,
    services: [],
    staff: [],
    workingHours: {}
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addService = () => {
    const newService = {
      id: Date.now(),
      name: '',
      duration: 30,
      price: 0,
      description: ''
    };
    setBusinessData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
  };

  const addStaff = () => {
    const newStaff = {
      id: Date.now(),
      name: '',
      bio: '',
      services: []
    };
    setBusinessData(prev => ({
      ...prev,
      staff: [...prev.staff, newStaff]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input 
                    id="business-name" 
                    value={businessData.name}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your business name" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={businessData.industry} onValueChange={(value) => setBusinessData(prev => ({ ...prev, industry: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salon">Salon & Beauty</SelectItem>
                      <SelectItem value="restaurant">Restaurant & Dining</SelectItem>
                      <SelectItem value="sports">Sports & Recreation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Logo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload logo</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Photo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload cover</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={businessData.address}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={businessData.timezone} onValueChange={(value) => setBusinessData(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                      <SelectItem value="CST">Central Time (CST)</SelectItem>
                      <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                      <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">About & Policies</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="about">About Your Business</Label>
                  <Textarea 
                    id="about"
                    value={businessData.about}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, about: e.target.value }))}
                    placeholder="Tell customers about your business, what makes you special..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policies">Things to Know Before Booking</Label>
                  <Textarea 
                    id="policies"
                    value={businessData.policies}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, policies: e.target.value }))}
                    placeholder="Important information for customers before they book..."
                    className="min-h-[100px]"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Booking Policies</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cancellation">Cancellation & No-show Policy</Label>
                    <Textarea 
                      id="cancellation"
                      value={businessData.cancellationPolicy}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                      placeholder="Describe your cancellation policy and no-show fees..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Deposit</Label>
                      <p className="text-sm text-muted-foreground">
                        Require customers to pay a deposit when booking
                      </p>
                    </div>
                    <Switch 
                      checked={businessData.depositRequired}
                      onCheckedChange={(checked) => setBusinessData(prev => ({ ...prev, depositRequired: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {businessData.industry === 'salon' && 'Services'}
                {businessData.industry === 'restaurant' && 'Menu & Tables'}
                {businessData.industry === 'sports' && 'Resources & Sessions'}
              </h3>
              
              {businessData.industry === 'salon' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Add the services you offer</p>
                    <Button onClick={addService} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                  
                  {businessData.services.map((service, index) => (
                    <Card key={service.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Service Name</Label>
                            <Input placeholder="e.g., Haircut" />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration (minutes)</Label>
                            <Input type="number" placeholder="60" />
                          </div>
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <Input type="number" placeholder="50" />
                          </div>
                          <div className="flex items-end">
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {businessData.services.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                      <p className="text-muted-foreground">No services added yet</p>
                    </div>
                  )}
                </div>
              )}

              {businessData.industry === 'restaurant' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Table Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>2-person tables</Label>
                        <Input type="number" placeholder="4" />
                      </div>
                      <div className="space-y-2">
                        <Label>4-person tables</Label>
                        <Input type="number" placeholder="6" />
                      </div>
                      <div className="space-y-2">
                        <Label>6-person tables</Label>
                        <Input type="number" placeholder="2" />
                      </div>
                      <div className="space-y-2">
                        <Label>8+ person tables</Label>
                        <Input type="number" placeholder="1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Menu Link (Optional)</Label>
                    <Input placeholder="https://your-menu-link.com" />
                  </div>
                </div>
              )}

              {businessData.industry === 'sports' && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Court/Field Types</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tennis Courts</Label>
                        <Input type="number" placeholder="2" />
                      </div>
                      <div className="space-y-2">
                        <Label>Basketball Courts</Label>
                        <Input type="number" placeholder="1" />
                      </div>
                      <div className="space-y-2">
                        <Label>Session Duration (minutes)</Label>
                        <Input type="number" placeholder="90" />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Capacity per Session</Label>
                        <Input type="number" placeholder="8" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {businessData.industry === 'salon' && 'Stylists'}
                {businessData.industry === 'restaurant' && 'Staff'}
                {businessData.industry === 'sports' && 'Coaches'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Add your team members</p>
                  <Button onClick={addStaff} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                </div>
                
                {businessData.staff.map((member, index) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback>
                              <Camera className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <Input placeholder="Staff member name" />
                            <Textarea placeholder="Brief bio or specialties..." className="min-h-[60px]" />
                          </div>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {businessData.industry === 'salon' && (
                          <div className="space-y-2">
                            <Label>Specializes in</Label>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">Haircuts</Badge>
                              <Badge variant="secondary">Coloring</Badge>
                              <Badge variant="outline">+ Add service</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {businessData.staff.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">No team members added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Schedule & Availability</h3>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Working Hours</h4>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-20">
                        <Label>{day}</Label>
                      </div>
                      <Switch defaultChecked={day !== 'Sunday'} />
                      <Input placeholder="9:00 AM" className="w-24" />
                      <span>to</span>
                      <Input placeholder="6:00 PM" className="w-24" />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Booking Settings</h4>
                    <div className="space-y-2">
                      <Label>Break between bookings (minutes)</Label>
                      <Input type="number" placeholder="15" />
                    </div>
                    <div className="space-y-2">
                      <Label>Book ahead limit (days)</Label>
                      <Input type="number" placeholder="30" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Preview Availability</h4>
                    <div className="border rounded-lg p-4">
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="text-center">
                          <p className="font-medium">Mon</p>
                          <div className="space-y-1 mt-2">
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">9:00</div>
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">10:00</div>
                            <div className="bg-gray-100 text-gray-500 p-1 rounded text-xs">11:00</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Tue</p>
                          <div className="space-y-1 mt-2">
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">9:00</div>
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">10:00</div>
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">11:00</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Wed</p>
                          <div className="space-y-1 mt-2">
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">9:00</div>
                            <div className="bg-red-100 text-red-700 p-1 rounded text-xs">10:00</div>
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">11:00</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Thu</p>
                          <div className="space-y-1 mt-2">
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">9:00</div>
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">10:00</div>
                            <div className="bg-green-100 text-green-700 p-1 rounded text-xs">11:00</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-100 rounded"></div>
                          <span>Available</span>
                          <div className="w-3 h-3 bg-red-100 rounded"></div>
                          <span>Booked</span>
                          <div className="w-3 h-3 bg-gray-100 rounded"></div>
                          <span>Blocked</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Setup Your Business</CardTitle>
                <CardDescription>
                  Complete your profile to start receiving automated bookings
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          
          <CardContent>
            {renderStep()}
          </CardContent>
          
          <div className="flex justify-between p-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <Button onClick={handleNext}>
              {currentStep === totalSteps ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}