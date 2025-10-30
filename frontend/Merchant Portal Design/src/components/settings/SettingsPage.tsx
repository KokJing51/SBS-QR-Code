import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Users, 
  CreditCard, 
  Shield, 
  Bell, 
  Download,
  Save,
  Plus,
  Edit,
  Trash2,
  Key,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'staff' | 'viewer';
  avatar?: string;
  lastActive: string;
  invited: boolean;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@stylecraftsalon.com',
    role: 'owner',
    lastActive: '2024-03-18T14:30:00Z',
    invited: false
  },
  {
    id: '2',
    name: 'Emma Rodriguez',
    email: 'emma@stylecraftsalon.com',
    role: 'staff',
    lastActive: '2024-03-18T13:15:00Z',
    invited: false
  },
  {
    id: '3',
    name: 'Alex Johnson',
    email: 'alex@stylecraftsalon.com',
    role: 'staff',
    lastActive: '2024-03-18T12:45:00Z',
    invited: false
  },
  {
    id: '4',
    name: 'Sarah Manager',
    email: 'sarah@stylecraftsalon.com',
    role: 'admin',
    lastActive: 'Never',
    invited: true
  }
];

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-700';
    case 'admin':
      return 'bg-blue-100 text-blue-700';
    case 'staff':
      return 'bg-green-100 text-green-700';
    case 'viewer':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  
  const [notificationSettings, setNotificationSettings] = useState({
    newBookings: true,
    cancellations: true,
    reminders: false,
    lowInventory: true,
    systemUpdates: true,
    email: true,
    sms: false,
    whatsapp: true
  });

  const [paymentSettings, setPaymentSettings] = useState({
    stripeConnected: true,
    depositPercentage: 25,
    refundPolicy: 'auto',
    currency: 'USD'
  });

  const handleInviteTeamMember = () => {
    if (inviteEmail) {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole as any,
        lastActive: 'Never',
        invited: true
      };
      setTeamMembers(prev => [...prev, newMember]);
      setInviteEmail('');
    }
  };

  const handleRemoveTeamMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleExportData = (type: string) => {
    console.log(`Exporting ${type} data...`);
    // Implement data export
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and business preferences</p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team">Team & Access</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Data & Privacy</TabsTrigger>
        </TabsList>

        {/* Team & Access */}
        <TabsContent value="team">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage who has access to your booking system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Invite new member */}
                  <div className="flex gap-2 p-4 border rounded-lg bg-muted/50">
                    <Input
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleInviteTeamMember}>
                      <Plus className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </div>

                  {/* Team members list */}
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              <Badge className={getRoleBadgeColor(member.role)}>
                                {member.role}
                              </Badge>
                              {member.invited && (
                                <Badge variant="outline" className="text-xs">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Last active: {member.lastActive === 'Never' ? 'Never' : new Date(member.lastActive).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role !== 'owner' && (
                            <>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveTeamMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>
                  What each role can access in your system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-purple-700">Owner</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Full system access</li>
                        <li>• Billing & payments</li>
                        <li>• Team management</li>
                        <li>• Settings & integrations</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700">Admin</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Booking management</li>
                        <li>• Content updates</li>
                        <li>• Staff schedules</li>
                        <li>• Customer data</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-700">Staff</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Own bookings</li>
                        <li>• Schedule management</li>
                        <li>• Customer interactions</li>
                        <li>• Limited reporting</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Viewer</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Read-only access</li>
                        <li>• View bookings</li>
                        <li>• Basic reporting</li>
                        <li>• No editing rights</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Processing
                </CardTitle>
                <CardDescription>
                  Configure how you accept payments and deposits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> This is a placeholder interface. Real payment processing would require proper PCI compliance and secure handling of financial data.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Stripe Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept credit cards and online payments
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Deposit Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Deposit Percentage</Label>
                      <Select
                        value={paymentSettings.depositPercentage.toString()}
                        onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, depositPercentage: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No deposit required</SelectItem>
                          <SelectItem value="25">25%</SelectItem>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="100">Full payment upfront</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={paymentSettings.currency} onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Refund Policy</h4>
                  <Select value={paymentSettings.refundPolicy} onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, refundPolicy: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatic refunds within 24h</SelectItem>
                      <SelectItem value="manual">Manual review required</SelectItem>
                      <SelectItem value="no-refund">No refunds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Recent payment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: '1', customer: 'Sarah Johnson', amount: 50, status: 'completed', date: '2024-03-18' },
                    { id: '2', customer: 'Mike Chen', amount: 25, status: 'pending', date: '2024-03-18' },
                    { id: '3', customer: 'Lisa Wong', amount: 80, status: 'completed', date: '2024-03-17' },
                    { id: '4', customer: 'John Doe', amount: 35, status: 'refunded', date: '2024-03-16' }
                  ].map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.customer}</p>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${transaction.amount}</p>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Export Transactions
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Event Notifications</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'newBookings', label: 'New bookings', description: 'When customers make new appointments' },
                      { key: 'cancellations', label: 'Cancellations', description: 'When bookings are cancelled' },
                      { key: 'reminders', label: 'Appointment reminders', description: 'Daily summary of upcoming appointments' },
                      { key: 'lowInventory', label: 'Low inventory alerts', description: 'When product stock is running low' },
                      { key: 'systemUpdates', label: 'System updates', description: 'Important platform announcements' }
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{notification.label}</Label>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                        </div>
                        <Switch
                          checked={notificationSettings[notification.key as keyof typeof notificationSettings] as boolean}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [notification.key]: checked }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Delivery Methods</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'email', label: 'Email notifications', description: 'Receive alerts via email' },
                      { key: 'sms', label: 'SMS notifications', description: 'Receive alerts via text message' },
                      { key: 'whatsapp', label: 'WhatsApp notifications', description: 'Receive alerts via WhatsApp' }
                    ].map((method) => (
                      <div key={method.key} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{method.label}</Label>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                        <Switch
                          checked={notificationSettings[method.key as keyof typeof notificationSettings] as boolean}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [method.key]: checked }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data & Privacy */}
        <TabsContent value="privacy">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Data & Privacy
                </CardTitle>
                <CardDescription>
                  Manage your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Figma Make is not designed for collecting PII or securing sensitive data. Use this for demonstration and prototyping purposes only.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h4 className="font-medium">Data Export</h4>
                  <p className="text-sm text-muted-foreground">
                    Download your business data in various formats
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => handleExportData('bookings')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Bookings
                    </Button>
                    <Button variant="outline" onClick={() => handleExportData('customers')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Customers
                    </Button>
                    <Button variant="outline" onClick={() => handleExportData('analytics')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Analytics
                    </Button>
                    <Button variant="outline" onClick={() => handleExportData('all')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Privacy Policy</h4>
                  <Textarea
                    placeholder="Enter your privacy policy that will be displayed to customers..."
                    className="min-h-[120px]"
                    defaultValue="We collect and process personal information only as necessary to provide our booking services. Customer data is encrypted and stored securely. We do not share personal information with third parties except as required by law."
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Data Retention</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Data Retention</Label>
                      <Select defaultValue="2-years">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-year">1 Year</SelectItem>
                          <SelectItem value="2-years">2 Years</SelectItem>
                          <SelectItem value="5-years">5 Years</SelectItem>
                          <SelectItem value="indefinite">Indefinite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Booking History Retention</Label>
                      <Select defaultValue="5-years">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-year">1 Year</SelectItem>
                          <SelectItem value="2-years">2 Years</SelectItem>
                          <SelectItem value="5-years">5 Years</SelectItem>
                          <SelectItem value="indefinite">Indefinite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Danger Zone</h4>
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-red-800">Delete All Data</p>
                        <p className="text-sm text-red-600">
                          Permanently delete all customer data, bookings, and analytics. This action cannot be undone.
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}