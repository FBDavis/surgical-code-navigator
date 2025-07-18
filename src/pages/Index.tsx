import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from './Dashboard';
import { SearchCodes } from './SearchCodes';
import { NewCase } from './NewCase';
import CameraSchedule from './CameraSchedule';
import { Settings } from './Settings';
import ResidentTracker from './ResidentTracker';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('home');
  const isGuest = searchParams.get('guest') === 'true';

  useEffect(() => {
    console.log('Auth check - user:', !!user, 'loading:', loading, 'isGuest:', isGuest);
    // For beta distribution, default to guest mode if no explicit auth is requested
    // Only redirect to auth if explicitly requested (e.g., from a "Sign In" button)
    if (!loading && !user && !isGuest) {
      // Check if user explicitly wants to authenticate
      const wantsAuth = searchParams.get('auth') === 'true';
      if (wantsAuth) {
        console.log('Redirecting to auth');
        const currentPath = location.pathname;
        const currentParams = searchParams.toString();
        const returnTo = encodeURIComponent(currentPath + (currentParams ? `?${currentParams}` : ''));
        const authUrl = `/auth?returnTo=${returnTo}`;
        navigate(authUrl);
      } else {
        // Default to guest mode for easier beta testing
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('guest', 'true');
        const newUrl = location.pathname + '?' + currentParams.toString();
        navigate(newUrl, { replace: true });
      }
    }
  }, [user, loading, navigate, searchParams, isGuest, location.pathname]);

  useEffect(() => {
    // Set active tab based on current route
    const path = location.pathname;
    if (path === '/dashboard') {
      setActiveTab('home');
    } else if (path === '/new-case') {
      setActiveTab('newcase');
    } else if (path === '/search-codes') {
      setActiveTab('search');
    } else if (path === '/camera-schedule') {
      setActiveTab('camera');
    } else if (path === '/settings') {
      setActiveTab('settings');
    } else if (path === '/') {
      // For root path, redirect to dashboard to ensure proper navigation
      if (!loading) {
        const params = new URLSearchParams(searchParams);
        const routeWithParams = params.toString() ? `/dashboard?${params.toString()}` : '/dashboard';
        navigate(routeWithParams, { replace: true });
      }
    } else {
      // Check for tab parameter as fallback
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveTab(tab);
      } else {
        setActiveTab('home');
      }
    }
  }, [location.pathname, searchParams, loading, navigate]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    let route = '/';
    
    switch (tab) {
      case 'home':
        route = '/dashboard';
        break;
      case 'newcase':
        route = '/new-case';
        break;
      case 'search':
        route = '/search-codes';
        break;
      case 'camera':
        route = '/camera-schedule';
        break;
      case 'messages':
        route = '/messages';
        break;
      case 'resident':
        route = '/resident-tracker';
        break;
      case 'settings':
        route = '/settings';
        break;
      default:
        route = '/dashboard';
    }
    
    // Preserve guest parameter if it exists
    const routeWithParams = params.toString() ? `${route}?${params.toString()}` : route;
    navigate(routeWithParams);
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

  if (!user && !isGuest) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard onTabChange={handleTabChange} />;
      case 'newcase':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-3 md:p-6 pb-20 md:pb-6">
              <NewCase />
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-3 md:p-6 pb-20 md:pb-6">
              <SearchCodes />
            </div>
          </div>
        );
      case 'camera':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-3 md:p-6 pb-20 md:pb-6">
              <CameraSchedule />
            </div>
          </div>
        );
      case 'resident':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-3 md:p-6 pb-20 md:pb-6">
              <ResidentTracker />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-3 md:p-6 pb-20 md:pb-6">
              <div className="text-center py-8 md:py-12">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">Analytics Dashboard</h2>
                <p className="text-sm md:text-base text-muted-foreground">Detailed RVU analytics and reporting coming soon...</p>
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
            <div className="md:ml-64 p-3 md:p-6 pb-20 md:pb-6">
              <Settings />
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
