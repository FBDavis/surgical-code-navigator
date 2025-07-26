import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Medal, Trophy, TrendingUp, Calendar, Users } from 'lucide-react';

export const Leaderboards = () => {
  const { user } = useAuth();
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<any[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      // Weekly leaderboard
      const { data: weekly } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          profiles (
            display_name,
            email
          )
        `)
        .eq('period_type', 'weekly')
        .order('rank_position', { ascending: true })
        .limit(10);

      // Monthly leaderboard
      const { data: monthly } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          profiles (
            display_name,
            email
          )
        `)
        .eq('period_type', 'monthly')
        .order('rank_position', { ascending: true })
        .limit(10);

      // All-time leaderboard
      const { data: allTime } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          profiles (
            display_name,
            email
          )
        `)
        .eq('period_type', 'all_time')
        .order('rank_position', { ascending: true })
        .limit(10);

      setWeeklyLeaderboard(weekly || []);
      setMonthlyLeaderboard(monthly || []);
      setAllTimeLeaderboard(allTime || []);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-semibold text-muted-foreground">#{position}</span>;
    }
  };

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default: return 'bg-gradient-to-r from-primary/60 to-primary';
    }
  };

  const LeaderboardCard = ({ entries, period }: { entries: any[], period: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {period === 'weekly' && <Calendar className="h-5 w-5" />}
          {period === 'monthly' && <TrendingUp className="h-5 w-5" />}
          {period === 'all_time' && <Trophy className="h-5 w-5" />}
          {period.charAt(0).toUpperCase() + period.slice(1).replace('_', ' ')} Champions
        </CardTitle>
        <CardDescription>
          Top performers by RVU generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No rankings available yet</p>
              <p className="text-sm text-muted-foreground">Complete some cases to appear on the leaderboard!</p>
            </div>
          ) : (
            entries.map((entry, index) => {
              const isCurrentUser = entry.user_id === user?.id;
              const displayName = entry.profiles?.display_name || entry.profiles?.email || 'Unknown User';
              
              return (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    isCurrentUser ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getRankBadgeColor(entry.rank_position)}`}>
                      {entry.rank_position <= 3 ? getRankIcon(entry.rank_position) : entry.rank_position}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{displayName}</p>
                        {isCurrentUser && <Badge variant="outline">You</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{entry.total_cases} cases</span>
                        <span>•</span>
                        <span>{Number(entry.total_rvu).toFixed(1)} RVU</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {Number(entry.total_rvu).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">RVU</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Leaderboards</h2>
        <p className="text-muted-foreground">See how you stack up against other surgeons</p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            This Week
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            This Month
          </TabsTrigger>
          <TabsTrigger value="all_time" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            All Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <LeaderboardCard entries={weeklyLeaderboard} period="weekly" />
        </TabsContent>

        <TabsContent value="monthly">
          <LeaderboardCard entries={monthlyLeaderboard} period="monthly" />
        </TabsContent>

        <TabsContent value="all_time">
          <LeaderboardCard entries={allTimeLeaderboard} period="all_time" />
        </TabsContent>
      </Tabs>
    </div>
  );
};