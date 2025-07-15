import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from './Dashboard';
import { SearchCodes } from './SearchCodes';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('home');

  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    // Check if coming from guest access using searchParams
    const guest = searchParams.get('guest');
    console.log('Guest parameter:', guest);
    if (guest === 'true') {
      console.log('Setting guest mode to true');
      setGuestMode(true);
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('Auth check - user:', !!user, 'loading:', loading, 'guestMode:', guestMode);
    if (!loading && !user && !guestMode) {
      console.log('Redirecting to auth');
      navigate('/auth');
    }
  }, [user, loading, guestMode, navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !guestMode) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'search':
        return <SearchCodes />;
      case 'analytics':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Analytics Dashboard</h2>
            <p className="text-muted-foreground">Detailed RVU analytics and reporting coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
            <p className="text-muted-foreground">Compensation rate settings and preferences coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
    </div>
  );
};

export default Index;
