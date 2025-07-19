import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Search, BarChart3, Settings, Menu, X, FilePlus, LogOut, Camera, MessageSquare, GraduationCap, Crown, Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTutorial } from '@/components/TutorialManager';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { startTutorial } = useTutorial();

  const tabs = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'newcase', label: 'New Case', icon: FilePlus },
    { id: 'search', label: 'Find Codes', icon: Search },
    { id: 'camera', label: 'Schedule Scanner', icon: Camera },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'resident', label: 'Resident Tracker', icon: GraduationCap },
    { id: 'gamification', label: 'Gamification', icon: Trophy },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  const startAppTutorial = () => {
    const fullAppTutorial = {
      id: 'full-app-walkthrough',
      title: 'Complete App Walkthrough',
      description: 'A comprehensive tour of all OpCoder features',
      category: 'workflow' as const,
      icon: 'app',
      estimatedTime: 15,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to OpCoder!',
          content: 'This comprehensive tutorial will guide you through all the features of OpCoder, your AI-powered surgical coding assistant.',
          position: 'center' as const,
          highlight: 'Take your time with each step to get the most out of this walkthrough.'
        },
        {
          id: 'dashboard-overview',
          title: 'Dashboard Overview',
          content: 'This is your main dashboard where you can see your coding statistics, recent activity, and quick access to key features.',
          element: '.md\\:ml-64',
          position: 'center' as const,
          tips: [
            'View your monthly RVU totals and coding statistics',
            'See recent activity and case history',
            'Access quick actions for common tasks'
          ]
        },
        {
          id: 'navigation-menu',
          title: 'Navigation Menu',
          content: 'Use the sidebar (desktop) or bottom navigation (mobile) to navigate between different features.',
          element: '.md\\:w-64',
          position: 'right' as const,
          tips: [
            'Click any menu item to navigate to that section',
            'Your current location is highlighted',
            'Mobile users can access more options via the menu button'
          ]
        },
        {
          id: 'new-case-intro',
          title: 'Creating New Cases',
          content: 'Let\'s explore how to create a new case. Click "New Case" to see the case creation interface.',
          position: 'center' as const,
          tips: ['Enter case details like patient MRN and procedure date', 'Use AI to search for relevant CPT codes', 'Add multiple codes to a single case']
        },
        {
          id: 'code-search-intro', 
          title: 'AI-Powered Code Search',
          content: 'The Find Codes feature uses AI to help you find the right CPT codes based on procedure descriptions.',
          position: 'center' as const,
          tips: ['Describe procedures in detail for better results', 'Use medical terminology when possible', 'Review AI suggestions carefully']
        },
        {
          id: 'schedule-scanner',
          title: 'Schedule Scanner',
          content: 'Upload photos of surgery schedules and let AI extract the procedures and suggest appropriate codes.',
          position: 'center' as const,
          tips: ['Take clear photos of schedule documents', 'AI will extract procedure information', 'Review and edit extracted data']
        },
        {
          id: 'resident-tracking',
          title: 'Resident Case Tracking',
          content: 'For residents and fellows, track your cases against ACGME requirements and monitor your progress.',
          position: 'center' as const,
          tips: ['Log cases according to ACGME categories', 'Track progress toward requirements', 'Generate reports for reviews']
        },
        {
          id: 'analytics-overview',
          title: 'Analytics & Reporting',
          content: 'View detailed analytics about your coding patterns, RVU trends, and productivity metrics.',
          position: 'center' as const,
          tips: ['Monitor monthly RVU totals', 'Track coding efficiency trends', 'Export reports for practice management']
        },
        {
          id: 'settings-tour',
          title: 'Settings & Customization',
          content: 'Customize your experience, set default RVU rates, manage your profile, and configure preferences.',
          position: 'center' as const,
          tips: ['Set your default RVU compensation rate', 'Customize app preferences', 'Manage account settings']
        },
        {
          id: 'tutorial-complete',
          title: 'Tutorial Complete!',
          content: 'You\'ve completed the full OpCoder walkthrough! You can restart this tutorial anytime from the navigation menu.',
          position: 'center' as const,
          highlight: 'Remember: You can access individual feature tutorials from the help icons throughout the app.',
          tips: [
            'Use the dictation features for faster input',
            'Review AI suggestions carefully before accepting',
            'Check your analytics regularly to track progress',
            'Customize your settings for optimal workflow'
          ]
        }
      ]
    };
    
    startTutorial(fullAppTutorial);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-card border-b border-medical-accent/10 p-3 safe-area-pt">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary truncate">CPT Surgeon</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-9 w-9 p-0"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
        
        {isMenuOpen && (
          <div className="mt-3 space-y-1 max-h-96 overflow-y-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start h-11 text-left"
                >
                  <IconComponent className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </Button>
              );
            })}
              
              {/* Tutorial Button for Mobile */}
              <div className="border-t pt-2 mt-2">
                <Button
                  variant="ghost"
                  onClick={startAppTutorial}
                  className="w-full justify-start h-11 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <BookOpen className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span>Start Tutorial</span>
                </Button>
              </div>
              
              <div className="border-t pt-2 mt-2">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start h-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span>Logout</span>
                </Button>
              </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-medical-accent/10">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 px-4 bg-gradient-primary">
            <h1 className="text-xl font-bold text-primary-foreground">CPT Surgeon</h1>
          </div>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      "w-full justify-start group",
                      activeTab === tab.id 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-medical-light"
                    )}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    {tab.label}
                  </Button>
                );
              })}
              
              {/* Tutorial Button */}
              <div className="border-t pt-2 mt-2">
                <Button
                  variant="ghost"
                  onClick={startAppTutorial}
                  className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <BookOpen className="w-5 h-5 mr-3" />
                  Start Tutorial
                </Button>
              </div>
            </nav>
            
            {/* Logout Button at Bottom */}
            <div className="px-2 pb-2">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-medical-accent/10 z-50 safe-area-pb">
        <div className="grid grid-cols-5 gap-0.5 p-1">
          {tabs.slice(0, 5).map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-col h-16 px-1 py-2 rounded-lg text-center min-w-0",
                  isActive 
                    ? "text-primary bg-primary/10 font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <IconComponent className={cn("w-5 h-5 mb-1", isActive && "text-primary")} />
                <span className={cn(
                  "text-xs leading-tight break-words",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {tab.label.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
};