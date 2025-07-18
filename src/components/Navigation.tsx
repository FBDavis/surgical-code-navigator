import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Search, BarChart3, Settings, Menu, X, FilePlus, LogOut, Camera, MessageSquare, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuth();

  const tabs = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'newcase', label: 'New Case', icon: FilePlus },
    { id: 'search', label: 'Find Codes', icon: Search },
    { id: 'camera', label: 'Schedule Scanner', icon: Camera },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'resident', label: 'Resident Tracker', icon: GraduationCap },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-card border-b border-medical-accent/10 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">CPT Surgeon</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
        
        {isMenuOpen && (
          <div className="mt-4 space-y-2">
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
                  className="w-full justify-start"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
            <div className="border-t pt-2">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
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
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-medical-accent/10 z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {tabs.slice(0, 5).map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-col h-12 space-y-1",
                  activeTab === tab.id ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
};