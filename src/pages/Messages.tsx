import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { TeamMessaging } from "@/components/TeamMessaging";

const Messages = () => {
  const [activeTab, setActiveTab] = useState('messages');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="container mx-auto px-4 py-8 md:ml-64">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Team Messages</h1>
            <p className="text-muted-foreground">
              Collaborate with your team and discuss cases and codes
            </p>
          </div>
          
          <TeamMessaging />
        </div>
      </main>
    </div>
  );
};

export default Messages;