import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Star, Award, Crown, Zap } from 'lucide-react';
import { FriendGroups } from './gamification/FriendGroups';
import { Leaderboards } from './gamification/Leaderboards';
import { Achievements } from './gamification/Achievements';
import { WeeklyAssessment } from './gamification/WeeklyAssessment';
import { SocialDiscovery } from './gamification/SocialDiscovery';
import { useToast } from '@/hooks/use-toast';

export const GamificationHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    weeklyRank: 0,
    friendGroupsCount: 0,
    recentAwards: []
  });

  useEffect(() => {
    if (user) {
      loadGamificationStats();
    }
  }, [user]);

  const loadGamificationStats = async () => {
    try {
      // Get user achievements count
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('*, achievement_types(*)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(3);

      // Get friend groups count
      const { data: groups } = await supabase
        .from('friend_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      // Get weekly rank (simplified)
      const { data: leaderboard } = await supabase
        .from('leaderboard_entries')
        .select('rank_position')
        .eq('user_id', user.id)
        .eq('period_type', 'weekly')
        .order('period_start', { ascending: false })
        .limit(1);

      setStats({
        totalAchievements: achievements?.length || 0,
        weeklyRank: leaderboard?.[0]?.rank_position || 0,
        friendGroupsCount: groups?.length || 0,
        recentAwards: achievements || []
      });
    } catch (error) {
      console.error('Error loading gamification stats:', error);
    }
  };

  const generateWeeklyAssessment = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week

      const { data, error } = await supabase.functions.invoke('weekly-ai-assessment', {
        body: {
          user_id: user.id,
          week_start: weekStart.toISOString().split('T')[0],
          week_end: weekEnd.toISOString().split('T')[0]
        }
      });

      if (error) throw error;

      toast({
        title: "Weekly Assessment Generated! 🎉",
        description: "Check your new funny awards and insights!",
      });

      loadGamificationStats(); // Refresh stats
    } catch (error) {
      console.error('Error generating assessment:', error);
      toast({
        title: "Assessment Failed",
        description: "Could not generate weekly assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Surgical Champions Arena
        </h1>
        <p className="text-muted-foreground text-lg">
          Compete, achieve, and connect with fellow surgeons
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{stats.totalAchievements}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Rank</p>
                <p className="text-2xl font-bold">#{stats.weeklyRank || 'Unranked'}</p>
              </div>
              <Crown className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Friend Groups</p>
                <p className="text-2xl font-bold">{stats.friendGroupsCount}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardContent className="p-6 relative">
            <Button 
              onClick={generateWeeklyAssessment}
              disabled={loading}
              className="w-full h-full flex items-center gap-2"
              variant="ghost"
            >
              <Zap className="h-5 w-5" />
              {loading ? 'Generating...' : 'AI Assessment'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Awards */}
      {stats.recentAwards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Awards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stats.recentAwards.map((award: any) => (
                <Badge 
                  key={award.id} 
                  variant="outline" 
                  className={`bg-gradient-to-r ${getRarityColor(award.achievement_types?.rarity)} text-white border-0 px-3 py-2`}
                >
                  <span className="mr-2">{award.achievement_types?.icon}</span>
                  {award.achievement_types?.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="groups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friend Groups
          </TabsTrigger>
          <TabsTrigger value="leaderboards" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Leaderboards
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Weekly AI
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <FriendGroups onStatsUpdate={loadGamificationStats} />
        </TabsContent>

        <TabsContent value="leaderboards">
          <Leaderboards />
        </TabsContent>

        <TabsContent value="achievements">
          <Achievements />
        </TabsContent>

        <TabsContent value="assessment">
          <WeeklyAssessment />
        </TabsContent>

        <TabsContent value="discover">
          <SocialDiscovery onStatsUpdate={loadGamificationStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};