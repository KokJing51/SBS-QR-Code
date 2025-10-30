import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MessageSquare, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface AuthPageProps {
  onLogin: () => void;
  onStartOnboarding: () => void;
}

export function AuthPage({ onLogin, onStartOnboarding }: AuthPageProps) {
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [whatsAppConnected, setWhatsAppConnected] = useState(false);

  const handleLogin = () => {
    onLogin();
  };

  const handleSignUp = () => {
    onStartOnboarding();
  };

  const handleConnectWhatsApp = () => {
    setIsConnectingWhatsApp(true);
    // Simulate API call
    setTimeout(() => {
      setIsConnectingWhatsApp(false);
      setWhatsAppConnected(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <MessageSquare className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Fein Booking</h1>
          <p className="text-muted-foreground">Automate your bookings with WhatsApp AI</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter your password" />
                </div>
                <Button onClick={handleLogin} className="w-full">
                  Sign In
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input id="business-name" placeholder="Your business name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="Enter your email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" placeholder="Create a password" />
                </div>
                <Button onClick={handleSignUp} className="w-full">
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* WhatsApp Connection Step */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Connect WhatsApp
            </CardTitle>
            <CardDescription>
              Enable automated booking responses on WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!whatsAppConnected ? (
              <>
                <Alert>
                  <AlertDescription>
                    You'll need a Meta Cloud API key and verified phone number to enable WhatsApp automation.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="api-key">Meta Cloud API Key</Label>
                  <Input id="api-key" placeholder="YOUR_API_KEY_HERE" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Business Phone</Label>
                  <Input id="phone" placeholder="+1234567890" />
                </div>
                <Button 
                  onClick={handleConnectWhatsApp} 
                  disabled={isConnectingWhatsApp}
                  className="w-full"
                >
                  {isConnectingWhatsApp ? 'Connecting...' : 'Connect WhatsApp'}
                </Button>
              </>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-green-600">WhatsApp Connected Successfully!</p>
                <p className="text-xs text-muted-foreground">Your automated booking system is ready</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}