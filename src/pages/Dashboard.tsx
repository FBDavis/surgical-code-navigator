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
  Activity
} from 'lucide-react';

export const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data for demonstration
  const totalSearches = 1247;
  const recentSearches = 23;
  const thisMonth = 156;
  const totalRVUs = 2847.65;
  const commonProcedures = 47;

  const handleNavigation = (tab: string) => {
    switch (tab) {
      case 'search':
        navigate('/?tab=search');
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary rounded-lg">
                <Stethoscope className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome to OpCoder, {profile?.display_name || user?.email?.split('@')[0] || 'Doctor'}! 👋
                </h1>
                <p className="text-muted-foreground">Your intelligent medical coding companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Stats Overview */}
        <StatsOverview 
          totalSearches={totalSearches}
          recentSearches={recentSearches}
          thisMonth={thisMonth}
          totalRVUs={totalRVUs}
        />

        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
};