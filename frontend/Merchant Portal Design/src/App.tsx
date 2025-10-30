import React, { useState } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { Layout } from './components/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { CalendarPage } from './components/calendar/CalendarPage';
import { BookingsPage } from './components/bookings/BookingsPage';
import { ContentManager } from './components/content/ContentManager';
import { AutomationsPage } from './components/automations/AutomationsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { Toaster } from './components/ui/sonner';

type AppState = 'auth' | 'onboarding' | 'app';
type AppPage = 'dashboard' | 'calendar' | 'bookings' | 'content' | 'automations' | 'settings';

export default function App() {
  const [appState, setAppState] = useState<AppState>('auth');
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');

  const handleLogin = () => {
    setAppState('app');
    setCurrentPage('dashboard');
  };

  const handleStartOnboarding = () => {
    setAppState('onboarding');
  };

  const handleCompleteOnboarding = () => {
    setAppState('app');
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setAppState('auth');
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as AppPage);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'calendar':
        return <CalendarPage onNavigate={handleNavigate} />;
      case 'bookings':
        return <BookingsPage onNavigate={handleNavigate} />;
      case 'content':
        return <ContentManager onNavigate={handleNavigate} />;
      case 'automations':
        return <AutomationsPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (appState === 'auth') {
    return (
      <>
        <AuthPage 
          onLogin={handleLogin} 
          onStartOnboarding={handleStartOnboarding} 
        />
        <Toaster />
      </>
    );
  }

  if (appState === 'onboarding') {
    return (
      <>
        <OnboardingWizard onComplete={handleCompleteOnboarding} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {renderCurrentPage()}
      </Layout>
      <Toaster />
    </>
  );
}