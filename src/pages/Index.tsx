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

  // Check for guest mode immediately from URL params
  const isGuestMode = searchParams.get('guest') === 'true';

  useEffect(() => {
    console.log('Auth check - user:', !!user, 'loading:', loading, 'isGuestMode:', isGuestMode);
    if (!loading && !user && !isGuestMode) {
      console.log('Redirecting to auth');
      navigate('/auth');
    }
  }, [user, loading, isGuestMode, navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    // Preserve guest mode parameter if it exists
    if (isGuestMode) {
      params.set('guest', 'true');
    }
    navigate(`/?${params.toString()}`);
  };

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

  if (!user && !isGuestMode) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard onTabChange={handleTabChange} />;
      case 'search':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-6">
              <SearchCodes />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-6">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">Analytics Dashboard</h2>
                <p className="text-muted-foreground">Detailed RVU analytics and reporting coming soon...</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-6">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
                <p className="text-muted-foreground">Compensation rate settings and preferences coming soon...</p>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard onTabChange={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
    </div>
  );
};

export default Index;
