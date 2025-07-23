import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeCard } from '@/components/HomeCard';
import { StatsOverview } from '@/components/StatsOverview';
import { FloatingReferralBanner } from '@/components/ReferralNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
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
  const { user, profile, signOut, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [showTutorialHub, setShowTutorialHub] = useState(false);
  const [showReferralBanner, setShowReferralBanner] = useState(false);
  const { completedTutorials, startTutorial } = useTutorial();
  const dashboardStats = useDashboardStats();
  
  // Check if user is in guest mode
  const isGuest = !user && new URLSearchParams(window.location.search).get('guest') === 'true';

  useEffect(() => {
    setMounted(true);
    
    // Check if this is a brand new user (first time ever logging in)
    const hasSeenOnboarding = localStorage.getItem(`onboarding-seen-${user?.id}`);
    const isNewUser = !hasSeenOnboarding && user && completedTutorials.length === 0;
    
    // Only show for truly new users (account created within last 5 minutes)
    if (isNewUser && user) {
      const userCreatedAt = new Date(user.created_at).getTime();
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes in milliseconds
      
      const isTrulyNewUser = userCreatedAt > fiveMinutesAgo;
      
      if (isTrulyNewUser) {
        // Delay to allow UI to settle
        setTimeout(() => {
          setShowTutorialHub(true);
          localStorage.setItem(`onboarding-seen-${user.id}`, 'true');
        }, 2000);
      } else {
        // Mark as seen for existing users to prevent future popups
        localStorage.setItem(`onboarding-seen-${user.id}`, 'true');
      }
    }
    
    // Show referral banner for subscribed users after some interaction
    if (subscriptionStatus?.subscribed && user) {
      const timer = setTimeout(() => {
        setShowReferralBanner(true);
      }, 45000); // Show after 45 seconds
      
      return () => clearTimeout(timer);
    }
  }, [user, completedTutorials, subscriptionStatus]);

  // Get real data from the hook
  const {
    totalSearches,
    recentSearches,
    thisMonth,
    totalRVUs,
    commonProcedures,
    recentCodes,
    topCodes,
    loading: statsLoading
  } = dashboardStats;

  const handleNavigation = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      switch (tab) {
        case 'search':
          navigate('/search-codes');
          break;
        case 'newcase':
          navigate('/new-case');
          break;
        case 'common':
          navigate('/view-cases?tab=common');
          break;
        case 'analytics':
          navigate('/view-cases?tab=analytics');
          break;
        case 'procedures':
          navigate('/view-cases?tab=procedures');
          break;
        case 'viewcases':
          navigate('/view-cases');
          break;
        case 'settings':
          navigate('/settings');
          break;
        case 'camera':
          navigate('/camera-schedule');
          break;
        case 'resident':
          navigate('/resident-tracker');
          break;
        case 'messages':
          navigate('/messages');
          break;
        case 'gamification':
          navigate('/gamification');
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  const handleSignIn = () => {
    navigate('/auth?auth=true');
  };

  // Recent codes and top codes are now provided by the hook

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 dashboard-main">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
              <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                <Stethoscope className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start flex-col md:flex-row md:items-center gap-1 md:gap-2">
                  <h1 className="text-base md:text-2xl font-bold text-foreground leading-tight truncate">
                    Welcome Dr. {(() => {
                      const name = profile?.display_name || user?.email?.split('@')[0] || 'Doctor';
                      // Extract last name - if it contains spaces, take the last word
                      const nameParts = name.split(' ');
                      if (nameParts.length > 1) {
                        return nameParts[nameParts.length - 1];
                      }
                      // If no spaces, try to extract from email format like "fbdavis229"
                      const emailName = name.toLowerCase();
                      if (emailName.includes('davis')) return 'Davis';
                      if (emailName.includes('smith')) return 'Smith';
                      if (emailName.includes('johnson')) return 'Johnson';
                      // Default to capitalizing the name or part of it
                      return name.charAt(0).toUpperCase() + name.slice(1, 8);
                    })()}
                  </h1>
                  <div className="md:hidden">
                    <TutorialTooltip {...dashboardTutorial} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs md:text-base text-muted-foreground">Your intelligent coding companion</p>
                  <SpecialtyBranding />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 flex-shrink-0">
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
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 md:space-y-8 pb-24 md:pb-6">
        {/* Guest Mode Banner */}
        {isGuest && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Testing Mode - Limited Functionality</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      You're using OpCoder in guest mode. Sign up or sign in for full access, data persistence, and HIPAA compliance.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={handleSignIn} className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    Sign In
                  </Button>
                  <Button size="sm" onClick={handleSignIn} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up Free
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Quick Actions - Mobile Priority */}
        <div className="block md:hidden quick-actions">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Quick Actions
            </h2>
            <div className="flex gap-1">
              <TutorialTrigger 
                tutorial={basicNavigationTutorial} 
                variant="icon"
                className="h-7 w-7"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTutorialHub(true)}
                className="h-7 px-2 text-xs"
              >
                <GraduationCap className="w-3 h-3 mr-1" />
                Tips
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleNavigation('search')}
              className="h-18 flex-col gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg touch-manipulation px-2"
            >
              <Search className="w-5 h-5" />
              <span className="font-medium text-xs">Find Codes</span>
            </Button>
            <Button
              onClick={() => handleNavigation('newcase')}
              className="h-18 flex-col gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg touch-manipulation px-2"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium text-xs">New Case</span>
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
            onClick={() => handleNavigation('common')}
            count={commonProcedures}
            gradient="from-green-500/20 to-green-600/5"
          />
          
          <HomeCard
            title="Analytics Dashboard"
            description="RVU analytics, revenue tracking, and productivity trends"
            icon={BarChart3}
            onClick={() => handleNavigation('analytics')}
            gradient="from-orange-500/20 to-orange-600/5"
          />
          
          <HomeCard
            title="Procedures Overview"
            description="Comprehensive procedure statistics and profitability analysis"
            icon={FileText}
            onClick={() => handleNavigation('procedures')}
            count={thisMonth}
            gradient="from-purple-500/20 to-purple-600/5"
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
          <h2 className="text-base font-semibold text-foreground mb-3">More Features</h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <HomeCard
                title="Common"
                description="Most used codes"
                icon={History}
                onClick={() => handleNavigation('common')}
                count={commonProcedures}
                gradient="from-green-500/20 to-green-600/5"
              />
              
              <HomeCard
                title="Analytics"
                description="RVU tracking"
                icon={BarChart3}
                onClick={() => handleNavigation('analytics')}
                gradient="from-orange-500/20 to-orange-600/5"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <HomeCard
                title="Procedures"
                description="This month"
                icon={FileText}
                onClick={() => handleNavigation('procedures')}
                count={thisMonth}
                gradient="from-purple-500/20 to-purple-600/5"
              />
              
              <HomeCard
                title="Settings"
                description="App config"
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
                {statsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading recent activity...
                  </div>
                ) : recentCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity. Start by searching for codes or creating cases!
                  </div>
                ) : (
                  recentCodes.map((item, index) => (
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
                  ))
                )}
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
                {statsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading procedure data...
                  </div>
                ) : topCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No procedures yet. Create your first case to see your most common procedures!
                  </div>
                ) : (
                  topCodes.map((item, index) => (
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
                  ))
                )}
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

      {/* Floating Referral Banner for Subscribed Users */}
      {showReferralBanner && (
        <FloatingReferralBanner 
          onDismiss={() => setShowReferralBanner(false)} 
        />
      )}
    </div>
  );
};