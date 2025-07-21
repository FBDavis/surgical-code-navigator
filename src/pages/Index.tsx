import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from './Dashboard';
import { SearchCodes } from './SearchCodes';
import { NewCase } from './NewCase';
import { ViewCases } from './ViewCases';
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
    // Set active tab based on current route
    const path = location.pathname;
    if (path === '/dashboard') {
      setActiveTab('home');
    } else if (path === '/new-case') {
      setActiveTab('newcase');
    } else if (path === '/search-codes') {
      setActiveTab('search');
    } else if (path === '/view-cases') {
      setActiveTab('viewcases');
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
      setActiveTab('home');
    } else {
      // Check for tab parameter as fallback
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveTab(tab);
      } else {
        setActiveTab('home');
      }
    }
  }, [location.pathname, searchParams]);

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
      case 'viewcases':
        route = '/view-cases';
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

  // Only show loading if we're not in guest mode and auth is actually loading
  if (loading && !isGuest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if user exists OR if in guest mode
  const hasAccess = user || isGuest;
  
  // Use useEffect to handle navigation to prevent render phase updates
  useEffect(() => {
    if (!hasAccess && !loading) {
      navigate('/auth');
    }
  }, [hasAccess, loading, navigate]);
  
  if (!hasAccess) {
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
      case 'viewcases':
        return (
          <div className="min-h-screen">
            <div className="Navigation">
              <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="md:ml-64 p-3 md:p-6 pb-20 md:pb-6">
              <ViewCases />
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
