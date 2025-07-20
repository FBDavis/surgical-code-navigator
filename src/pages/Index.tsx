import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';
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
    console.log('User details:', user ? { id: user.id, email: user.email } : 'No user');
    
    // If user is logged in but URL still has guest=true, remove it
    if (!loading && user && isGuest) {
      console.log('Removing guest parameter for authenticated user');
      const currentParams = new URLSearchParams(searchParams);
      currentParams.delete('guest');
      const newUrl = location.pathname + (currentParams.toString() ? '?' + currentParams.toString() : '');
      console.log('Navigating to:', newUrl);
      navigate(newUrl, { replace: true });
      return;
    }
    
    if (!loading && !user && !isGuest) {
      // Check if user explicitly wants to authenticate or is accessing a protected action
      const wantsAuth = searchParams.get('auth') === 'true';
      const needsAuth = location.pathname.includes('/new-case') || 
                        location.pathname.includes('/search-codes') ||
                        location.pathname.includes('/settings') ||
                        location.pathname.includes('/resident-tracker');
      
      if (wantsAuth || needsAuth) {
        console.log('Redirecting to auth');
        const currentPath = location.pathname;
        const currentParams = searchParams.toString();
        const returnTo = encodeURIComponent(currentPath + (currentParams ? `?${currentParams}` : ''));
        const authUrl = `/auth?returnTo=${returnTo}`;
        navigate(authUrl);
      } else {
        // Show auth option for better UX
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
    } else if (path === '/resident-tracker') {
      setActiveTab('resident');
    } else if (path === '/gamification') {
      setActiveTab('gamification');
    } else if (path === '/settings') {
      setActiveTab('settings');
    } else if (path === '/subscription') {
      setActiveTab('subscription');
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
      case 'gamification':
        route = '/gamification';
        break;
      case 'subscription':
        route = '/subscription';
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
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-0 pb-20 md:pb-6">
              <Dashboard onTabChange={handleTabChange} />
            </div>
          </div>
        );
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
      case 'gamification':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-3 md:p-6 pb-20 md:pb-6">
              <div className="text-center py-8 md:py-12">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">Gamification Hub</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6">Access achievements, leaderboards, and AI insights...</p>
                <button 
                  onClick={() => handleTabChange('home')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </button>
              </div>
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
