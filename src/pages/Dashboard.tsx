import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeCard } from '@/components/HomeCard';
import { StatsOverview } from '@/components/StatsOverview';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  History, 
  BarChart3, 
  Settings, 
  Stethoscope,
  FileText,
  TrendingUp,
  Calendar,
  LogOut,
  User,
  Clock,
  Activity,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { TutorialTooltip } from '@/components/TutorialTooltip';
import { TutorialHub, useTutorial, TutorialTrigger } from '@/components/TutorialManager';
import { basicNavigationTutorial, codeSearchTutorial, onboardingSequence } from '@/components/TutorialDefinitions';
import { SpecialtyBranding } from '@/components/SpecialtyBranding';
import { dashboardTutorial, generalTips } from '@/components/TutorialData';

interface DashboardProps {
  onTabChange?: (tab: string) => void;
}

export const Dashboard = ({ onTabChange }: DashboardProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [showTutorialHub, setShowTutorialHub] = useState(false);
  const { completedTutorials, startTutorial } = useTutorial();

  useEffect(() => {
    setMounted(true);
    
    // Check if this is a new user and show tutorial hub
    const hasSeenOnboarding = localStorage.getItem(`onboarding-seen-${user?.id}`);
    const isNewUser = !hasSeenOnboarding && user && completedTutorials.length === 0;
    
    if (isNewUser) {
      // Delay to allow UI to settle
      setTimeout(() => {
        setShowTutorialHub(true);
        localStorage.setItem(`onboarding-seen-${user.id}`, 'true');
      }, 1000);
    }
  }, [user, completedTutorials]);

  // Mock data for demonstration
  const totalSearches = 1247;
  const recentSearches = 23;
  const thisMonth = 156;
  const totalRVUs = 2847.65;
  const commonProcedures = 47;

  const handleNavigation = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      switch (tab) {
        case 'search':
          navigate('/?tab=search');
          break;
        case 'newcase':
          navigate('/?tab=newcase');
          break;
        case 'analytics':
          navigate('/?tab=analytics');
          break;
        case 'settings':
          navigate('/?tab=settings');
          break;
        default:
          navigate('/');
      }
    }
  };

  const recentCodes = [
    { code: '47562', description: 'Laparoscopic cholecystectomy', rvu: 10.61, date: '2024-01-10' },
    { code: '44970', description: 'Laparoscopic appendectomy', rvu: 8.56, date: '2024-01-09' },
    { code: '49650', description: 'Laparoscopic hernia repair', rvu: 12.33, date: '2024-01-08' },
  ];

  const topCodes = [
    { code: '47562', count: 15, rvu: 10.61 },
    { code: '49650', count: 12, rvu: 12.33 },
    { code: '44970', count: 8, rvu: 8.56 },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 dashboard-main">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="p-3 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
              <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                <Stethoscope className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start flex-col md:flex-row md:items-center gap-1 md:gap-2">
                  <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">
                    Welcome, {profile?.display_name || user?.email?.split('@')[0] || 'Doctor'}! 👋
                  </h1>
                  <div className="md:hidden">
                    <TutorialTooltip {...dashboardTutorial} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm md:text-base text-muted-foreground">Your intelligent coding companion</p>
                  <SpecialtyBranding />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end space-x-2">
              <div className="hidden md:flex items-center space-x-2">
                <TutorialTooltip 
                  {...generalTips} 
                  className="mr-2"
                />
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="md:ml-2">
                <LogOut className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-6 space-y-6 md:space-y-8 pb-20 md:pb-6">
        {/* Quick Actions - Mobile Priority */}
        <div className="block md:hidden quick-actions">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Quick Actions
            </h2>
            <div className="flex gap-2">
              <TutorialTrigger 
                tutorial={basicNavigationTutorial} 
                variant="icon"
                className="h-8 w-8"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTutorialHub(true)}
                className="h-8 px-3 text-xs"
              >
                <GraduationCap className="w-3 h-3 mr-1" />
                Tutorials
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleNavigation('search')}
              className="h-20 flex-col gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg touch-manipulation"
            >
              <Search className="w-6 h-6" />
              <span className="font-medium text-sm">Find Codes</span>
            </Button>
            <Button
              onClick={() => handleNavigation('newcase')}
              className="h-20 flex-col gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg touch-manipulation"
            >
              <FileText className="w-6 h-6" />
              <span className="font-medium text-sm">New Case</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview 
          totalSearches={totalSearches}
          recentSearches={recentSearches}
          thisMonth={thisMonth}
          totalRVUs={totalRVUs}
        />

        {/* Main Feature Cards - Desktop Priority */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Features</h2>
            <div className="flex gap-2">
              <TutorialTrigger 
                tutorial={basicNavigationTutorial}
                variant="button"
                className="h-9"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Quick Tour
              </TutorialTrigger>
              <Button
                variant="outline"
                onClick={() => setShowTutorialHub(true)}
                className="h-9"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                All Tutorials
              </Button>
            </div>
          </div>
          
          <HomeCard
            title="Find Codes"
            description="Search for CPT codes using procedure descriptions or keywords"
            icon={Search}
            onClick={() => handleNavigation('search')}
            gradient="from-blue-500/20 to-blue-600/5"
          />
          
          <HomeCard
            title="Common Procedures"
            description="Access your most frequently used CPT codes and procedures"
            icon={History}
            onClick={() => {}}
            count={commonProcedures}
            gradient="from-green-500/20 to-green-600/5"
          />
          
          <HomeCard
            title="Total Procedure Count"
            description="View comprehensive statistics and procedure analytics"
            icon={FileText}
            onClick={() => {}}
            count={thisMonth}
            gradient="from-purple-500/20 to-purple-600/5"
          />
          
          <HomeCard
            title="Analytics"
            description="Detailed RVU analytics and reporting dashboard"
            icon={BarChart3}
            onClick={() => handleNavigation('analytics')}
            gradient="from-orange-500/20 to-orange-600/5"
          />
          
          <HomeCard
            title="Settings"
            description="Configure compensation rates and personal preferences"
            icon={Settings}
            onClick={() => handleNavigation('settings')}
            gradient="from-slate-500/20 to-slate-600/5"
          />
        </div>

        {/* Mobile: Simplified Feature Grid */}
        <div className="block md:hidden">
          <h2 className="text-lg font-semibold text-foreground mb-3">More Features</h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <HomeCard
                title="Common Procedures"
                description="Your most used codes"
                icon={History}
                onClick={() => {}}
                count={commonProcedures}
                gradient="from-green-500/20 to-green-600/5"
              />
              
              <HomeCard
                title="Analytics"
                description="RVU analytics"
                icon={BarChart3}
                onClick={() => handleNavigation('analytics')}
                gradient="from-orange-500/20 to-orange-600/5"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <HomeCard
                title="Procedures"
                description="Total this month"
                icon={FileText}
                onClick={() => {}}
                count={thisMonth}
                gradient="from-purple-500/20 to-purple-600/5"
              />
              
              <HomeCard
                title="Settings"
                description="Configure app"
                icon={Settings}
                onClick={() => handleNavigation('settings')}
                gradient="from-slate-500/20 to-slate-600/5"
              />
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Recent Activity & Top Procedures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCodes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {item.code}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">{item.rvu} RVU</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Procedures */}
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle>Most Common Procedures</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCodes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <Badge variant="outline" className="font-mono">
                        {item.code}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{item.count} times</p>
                      <p className="text-xs text-muted-foreground">{item.rvu} RVU each</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tutorial Hub Modal */}
      <TutorialHub 
        isOpen={showTutorialHub} 
        onClose={() => setShowTutorialHub(false)} 
      />
    </div>
  );
};