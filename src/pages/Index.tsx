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
import { Analytics } from './Analytics';
import { CommonProcedures } from './CommonProcedures';
import { ProcedureCount } from './ProcedureCount';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('home');
  const isGuest = searchParams.get('guest') === 'true';

  // Simple tab setting based on URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    } else if (location.pathname === '/dashboard') {
      setActiveTab('home');
    } else if (location.pathname === '/new-case') {
      setActiveTab('newcase');
    } else if (location.pathname === '/search-codes') {
      setActiveTab('search');
    } else if (location.pathname === '/view-cases') {
      setActiveTab('viewcases');
    } else if (location.pathname === '/camera-schedule') {
      setActiveTab('camera');
    } else if (location.pathname === '/resident-tracker') {
      setActiveTab('resident');
    } else if (location.pathname === '/settings') {
      setActiveTab('settings');
    } else {
      setActiveTab('home');
    }
  }, [location.pathname, searchParams]);

  // Handle auth redirect
  useEffect(() => {
    if (!loading && !user && !isGuest) {
      navigate('/auth');
    }
  }, [user, loading, isGuest, navigate]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    
    switch (tab) {
      case 'home':
        navigate('/dashboard');
        break;
      case 'analytics':
        navigate('/?tab=analytics' + (params.toString() ? '&' + params.toString() : ''));
        break;
      case 'common':
        navigate('/?tab=common' + (params.toString() ? '&' + params.toString() : ''));
        break;
      case 'procedures':
        navigate('/?tab=procedures' + (params.toString() ? '&' + params.toString() : ''));
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Show loading only if actually loading
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

  // Redirect if no access
  if (!user && !isGuest) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <Analytics />;
      case 'common':
        return <CommonProcedures />;
      case 'procedures':
        return <ProcedureCount />;
      default:
        return <Dashboard onTabChange={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen">
        <div className="Navigation">
          <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        <div className="md:ml-64 p-0 pb-20 md:pb-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;