import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  MessageSquare, 
  Zap, 
  Clock, 
  Settings, 
  CheckCircle, 
  Save,
  Edit,
  Copy,
  Smartphone,
  Bot,
  Send,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '../ui/utils';

interface AutomationsPageProps {
  onNavigate: (page: string) => void;
}

interface MessageTemplate {
  id: string;
  name: string;
  trigger: string;
  message: string;
  enabled: boolean;
  variables: string[];
}

const mockTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Booking Confirmation',
    trigger: 'booking_confirmed',
    message: 'Hi {{customer_name}}! 👋 Your booking is confirmed for {{service}} with {{staff_name}} on {{date}} at {{time}}. Our address: {{business_address}}. See you soon!',
    enabled: true,
    variables: ['customer_name', 'service', 'staff_name', 'date', 'time', 'business_address']
  },
  {
    id: '2',
    name: '24-Hour Reminder',
    trigger: 'reminder_24h',
    message: 'Hi {{customer_name}}! This is a friendly reminder that you have a {{service}} appointment tomorrow at {{time}} with {{staff_name}}. Reply "confirm" to confirm or "reschedule" if you need to change. 📅',
    enabled: true,
    variables: ['customer_name', 'service', 'time', 'staff_name']
  },
  {
    id: '3',
    name: '3-Hour Reminder',
    trigger: 'reminder_3h',
    message: 'Hi {{customer_name}}! Your {{service}} appointment is in 3 hours at {{time}}. We\'re located at {{business_address}}. Looking forward to seeing you! ✨',
    enabled: true,
    variables: ['customer_name', 'service', 'time', 'business_address']
  },
  {
    id: '4',
    name: 'Reschedule Prompt',
    trigger: 'reschedule_request',
    message: 'No problem! I can help you reschedule your {{service}} appointment. Here are some available times:\n\n{{available_slots}}\n\nReply with the number of your preferred time slot.',
    enabled: true,
    variables: ['service', 'available_slots']
  }
];

export function AutomationsPage({ onNavigate }: AutomationsPageProps) {
  const [automationSettings, setAutomationSettings] = useState({
    autoHoldSlots: true,
    holdDuration: 10,
    autoConfirm: true,
    smartResponses: true,
    reminder24h: true,
    reminder3h: true
  });

  const [integrationKeys, setIntegrationKeys] = useState({
    metaApiKey: 'whapp_abc123xyz789',
    phoneNumber: '+1234567890',
    webhookUrl: 'https://api.bookingbot.com/webhook/whatsapp'
  });

  const [templates, setTemplates] = useState<MessageTemplate[]>(mockTemplates);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const handleSaveSettings = () => {
    console.log('Saving automation settings:', automationSettings);
    // Show toast notification
  };

  const handleSaveTemplate = (template: MessageTemplate) => {
    setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    setEditingTemplate(null);
    console.log('Template saved:', template);
  };

  const handleToggleTemplate = (templateId: string, enabled: boolean) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, enabled } : t
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Automations</h1>
          <p className="text-muted-foreground">Configure automated responses and integrations</p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {/* Status Overview */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>WhatsApp automation is active:</strong> Your AI assistant is responding to customer inquiries, holding slots automatically, and sending confirmations without manual intervention.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Automation Settings</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        {/* Automation Settings */}
        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Response Settings
                </CardTitle>
                <CardDescription>
                  Configure how your AI assistant handles customer inquiries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-hold Slots on Inquiry</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically reserve time slots when customers inquire about availability
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.autoHoldSlots}
                    onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, autoHoldSlots: checked }))}
                  />
                </div>

                {automationSettings.autoHoldSlots && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="hold-duration">Hold Duration (minutes)</Label>
                    <Select
                      value={automationSettings.holdDuration.toString()}
                      onValueChange={(value) => setAutomationSettings(prev => ({ ...prev, holdDuration: parseInt(value) }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-confirm When Details Complete</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically confirm bookings when all required information is collected
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.autoConfirm}
                    onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, autoConfirm: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Smart Response Generation</Label>
                    <p className="text-sm text-muted-foreground">
                      Use AI to generate contextual responses to customer questions
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.smartResponses}
                    onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, smartResponses: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Reminder Settings
                </CardTitle>
                <CardDescription>
                  Automatic appointment reminders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>24-Hour Reminder</Label>
                    <p className="text-sm text-muted-foreground">
                      Send reminder 24 hours before appointment
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.reminder24h}
                    onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, reminder24h: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>3-Hour Reminder</Label>
                    <p className="text-sm text-muted-foreground">
                      Send reminder 3 hours before appointment
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.reminder3h}
                    onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, reminder3h: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Performance</CardTitle>
                <CardDescription>This week's automation metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <div className="text-sm text-muted-foreground">Messages Auto-handled</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">47</div>
                    <div className="text-sm text-muted-foreground">Auto-confirmed Bookings</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">2.3s</div>
                    <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Message Templates */}
        <TabsContent value="templates">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>
                  Customize automated messages sent to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant={template.enabled ? 'default' : 'secondary'}>
                            {template.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.trigger.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.enabled}
                            onCheckedChange={(checked) => handleToggleTemplate(template.id, checked)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-3 mb-3">
                        <p className="text-sm whitespace-pre-wrap">{template.message}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integration */}
        <TabsContent value="integration">
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You'll need a Meta Cloud API account and WhatsApp Business phone number to enable automations.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  WhatsApp Business API
                </CardTitle>
                <CardDescription>
                  Configure your WhatsApp Business integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Meta Cloud API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="api-key"
                      type="password"
                      value={integrationKeys.metaApiKey}
                      onChange={(e) => setIntegrationKeys(prev => ({ ...prev, metaApiKey: e.target.value }))}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(integrationKeys.metaApiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your API key from the Meta for Developers console
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Business Phone Number</Label>
                  <Input
                    id="phone"
                    value={integrationKeys.phoneNumber}
                    onChange={(e) => setIntegrationKeys(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be verified with WhatsApp Business
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook">Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhook"
                      value={integrationKeys.webhookUrl}
                      onChange={(e) => setIntegrationKeys(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="flex-1"
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(integrationKeys.webhookUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure this URL in your Meta webhook settings
                  </p>
                </div>

                <div className="pt-4">
                  <Button className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Meta API Connection</span>
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WhatsApp Business Verification</span>
                    <Badge className="bg-green-100 text-green-700">Verified</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Webhook Status</span>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Message</span>
                    <span className="text-sm text-muted-foreground">2 minutes ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Edit Message Template</CardTitle>
              <CardDescription>
                Customize the automated message. Use variables in double curly braces.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => prev && { ...prev, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Message Content</Label>
                <Textarea
                  value={editingTemplate.message}
                  onChange={(e) => setEditingTemplate(prev => prev && { ...prev, message: e.target.value })}
                  className="min-h-[120px]"
                  placeholder="Hi {{customer_name}}! Your booking is confirmed..."
                />
              </div>

              <div className="space-y-2">
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {['customer_name', 'service', 'staff_name', 'date', 'time', 'business_address', 'business_name', 'price'].map((variable) => (
                    <Button
                      key={variable}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(end, text.length);
                          const newValue = before + `{{${variable}}}` + after;
                          setEditingTemplate(prev => prev && { ...prev, message: newValue });
                        }
                      }}
                    >
                      {`{{${variable}}}`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {editingTemplate.message
                      .replace(/\{\{customer_name\}\}/g, 'John Doe')
                      .replace(/\{\{service\}\}/g, 'Haircut & Style')
                      .replace(/\{\{staff_name\}\}/g, 'Emma')
                      .replace(/\{\{date\}\}/g, 'March 20, 2024')
                      .replace(/\{\{time\}\}/g, '2:00 PM')
                      .replace(/\{\{business_address\}\}/g, '123 Main St')
                      .replace(/\{\{business_name\}\}/g, 'StyleCraft Salon')
                      .replace(/\{\{price\}\}/g, '$50')
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingTemplate(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => editingTemplate && handleSaveTemplate(editingTemplate)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}