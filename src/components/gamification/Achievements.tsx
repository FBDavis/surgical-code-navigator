import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Award, Zap, Target, Calendar } from 'lucide-react';

export const Achievements = () => {
  const { user } = useAuth();
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      // Load user's achievements
      const { data: earned } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement_types (*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      // Load all available achievements
      const { data: all } = await supabase
        .from('achievement_types')
        .select('*')
        .order('rarity', { ascending: false });

      setUserAchievements(earned || []);
      setAllAchievements(all || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
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

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 shadow-yellow-400/20';
      case 'epic': return 'border-purple-400 shadow-purple-400/20';
      case 'rare': return 'border-blue-400 shadow-blue-400/20';
      default: return 'border-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'specialty': return <Target className="h-5 w-5" />;
      case 'performance': return <Zap className="h-5 w-5" />;
      case 'volume': return <Trophy className="h-5 w-5" />;
      case 'ai_generated': return <Star className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  const isAchievementEarned = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_type_id === achievementId);
  };

  const getAchievementDate = (achievementId: string) => {
    const earned = userAchievements.find(ua => ua.achievement_type_id === achievementId);
    return earned ? new Date(earned.earned_at).toLocaleDateString() : null;
  };

  const AchievementCard = ({ achievement, earned = false, earnedDate = null }: any) => (
    <Card className={`relative overflow-hidden transition-all hover:scale-105 ${
      earned ? `border-2 ${getRarityBorder(achievement.rarity)} shadow-lg` : 'opacity-60'
    }`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(achievement.rarity)} opacity-10`} />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${earned ? '' : 'grayscale'}`}>
              {achievement.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{achievement.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${earned ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white border-0` : ''}`}
                >
                  {achievement.rarity}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getCategoryIcon(achievement.category)}
                  {achievement.category}
                </Badge>
              </div>
            </div>
          </div>
          
          {earned && (
            <div className="flex flex-col items-end">
              <Trophy className="h-6 w-6 text-yellow-500" />
              {earnedDate && (
                <span className="text-xs text-muted-foreground mt-1">
                  {earnedDate}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <CardDescription className="text-sm">
          {achievement.description}
        </CardDescription>
        
        {!earned && achievement.criteria && (
          <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
            <p className="font-medium">Requirements:</p>
            <p className="text-muted-foreground">
              {Object.entries(achievement.criteria).map(([key, value]) => 
                `${key.replace('_', ' ')}: ${value}`
              ).join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  const earnedAchievements = allAchievements.filter(a => isAchievementEarned(a.id));
  const availableAchievements = allAchievements.filter(a => !isAchievementEarned(a.id));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Achievement Gallery</h2>
        <p className="text-muted-foreground">
          {earnedAchievements.length} of {allAchievements.length} achievements unlocked
        </p>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-4">
          <div 
            className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(earnedAchievements.length / allAchievements.length) * 100}%` }}
          />
        </div>
      </div>

      <Tabs defaultValue="earned" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="earned" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Earned ({earnedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Available ({availableAchievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {earnedAchievements.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
                  <p className="text-muted-foreground">
                    Complete cases and procedures to start earning achievements!
                  </p>
                </CardContent>
              </Card>
            ) : (
              earnedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  earned={true}
                  earnedDate={getAchievementDate(achievement.id)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                earned={false}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};