import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from './Dashboard';
import { SearchCodes } from './SearchCodes';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');

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
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content */}
      <div className="md:ml-64 min-h-screen">
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
