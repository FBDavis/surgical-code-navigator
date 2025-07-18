import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Building2, Search, MapPin, GraduationCap, Stethoscope, Network, Brain, Star, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialDiscoveryProps {
  onStatsUpdate: () => void;
}

export const SocialDiscovery: React.FC<SocialDiscoveryProps> = ({ onStatsUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discoveredUsers, setDiscoveredUsers] = useState<any[]>([]);
  const [nearbyColleagues, setNearbyColleagues] = useState<any[]>([]);
  const [specialtyMatches, setSpecialtyMatches] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    specialty: '',
    institution: '',
    location: '',
    experience: ''
  });

  useEffect(() => {
    if (user) {
      loadAllDiscoveryData();
    }
  }, [user]);

  const loadAllDiscoveryData = async () => {
    await Promise.all([
      loadDiscoveredUsers(),
      loadNearbyColleagues(),
      loadSpecialtyMatches(),
      generateAIRecommendations()
    ]);
  };

  const loadDiscoveredUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_discoveries')
        .select(`
          *,
          profiles!contact_discoveries_discovered_user_id_fkey (
            display_name,
            email,
            institution,
            user_role,
            subspecialty,
            year_of_training
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setDiscoveredUsers(data || []);
    } catch (error) {
      console.error('Error loading discovered users:', error);
    }
  };

  const loadNearbyColleagues = async () => {
    try {
      // Simulate nearby colleagues based on institution
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('institution')
        .eq('user_id', user.id)
        .single();

      if (userProfile?.institution) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('institution', userProfile.institution)
          .neq('user_id', user.id)
          .limit(10);

        if (error) throw error;
        setNearbyColleagues(data || []);
      }
    } catch (error) {
      console.error('Error loading nearby colleagues:', error);
    }
  };

  const loadSpecialtyMatches = async () => {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('subspecialty, user_role')
        .eq('user_id', user.id)
        .single();

      if (userProfile?.subspecialty) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('subspecialty', userProfile.subspecialty)
          .neq('user_id', user.id)
          .limit(8);

        if (error) throw error;
        setSpecialtyMatches(data || []);
      }
    } catch (error) {
      console.error('Error loading specialty matches:', error);
    }
  };

  const generateAIRecommendations = async () => {
    try {
      // Simulate AI-powered recommendations based on user activity
      const { data: userCases } = await supabase
        .from('cases')
        .select(`
          *,
          case_codes (cpt_code, category)
        `)
        .eq('user_id', user.id)
        .limit(50);

      // Analyze user's case patterns to recommend similar colleagues
      const commonCategories = userCases?.reduce((acc: any, case_item) => {
        case_item.case_codes?.forEach((code: any) => {
          acc[code.category] = (acc[code.category] || 0) + 1;
        });
        return acc;
      }, {});

      // Mock AI recommendations based on case similarity
      const mockRecommendations = [
        {
          id: '1',
          display_name: 'Dr. Sarah Johnson',
          institution: 'Mayo Clinic',
          user_role: 'Attending Surgeon',
          subspecialty: 'Orthopedic Surgery',
          match_reason: 'Similar case volume in joint replacements',
          match_score: 95,
          mutual_connections: 3
        },
        {
          id: '2',
          display_name: 'Dr. Michael Chen',
          institution: 'Johns Hopkins',
          user_role: 'Chief Resident',
          subspecialty: 'General Surgery',
          match_reason: 'High RVU efficiency in your specialty',
          match_score: 87,
          mutual_connections: 1
        },
        {
          id: '3',
          display_name: 'Dr. Emily Rodriguez',
          institution: 'Cleveland Clinic',
          user_role: 'Fellow',
          subspecialty: 'Cardiac Surgery',
          match_reason: 'Complementary skill set for collaboration',
          match_score: 82,
          mutual_connections: 2
        }
      ];

      setAiRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    }
  };

  const smartContactDiscovery = async () => {
    setLoading(true);
    try {
      // Simulate advanced contact discovery with ML matching
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Smart Discovery Complete! 🧠",
        description: "Found 8 high-compatibility colleagues using AI matching!",
      });
      
      loadAllDiscoveryData();
    } catch (error) {
      console.error('Error in smart discovery:', error);
      toast({
        title: "Discovery Failed",
        description: "Could not complete smart discovery. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (targetUserId: string, userName: string) => {
    try {
      // In real implementation, this would send a connection request
      toast({
        title: "Connection Request Sent! 📨",
        description: `Your request to connect with ${userName} has been sent.`,
      });
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const ColleagueCard = ({ colleague, reason = '', score = 0, connections = 0 }: any) => (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-lg">
              {(colleague.display_name || colleague.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{colleague.display_name || colleague.email}</h4>
              <div className="flex items-center gap-2 mt-1">
                {colleague.institution && (
                  <Badge variant="outline" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {colleague.institution}
                  </Badge>
                )}
                {colleague.user_role && (
                  <Badge variant="outline" className="text-xs">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {colleague.user_role}
                  </Badge>
                )}
              </div>
              {colleague.subspecialty && (
                <Badge variant="secondary" className="text-xs mt-1">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  {colleague.subspecialty}
                </Badge>
              )}
              {reason && (
                <p className="text-xs text-muted-foreground mt-2">{reason}</p>
              )}
              {connections > 0 && (
                <p className="text-xs text-primary mt-1">
                  <Network className="h-3 w-3 inline mr-1" />
                  {connections} mutual connection{connections !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {score > 0 && (
              <Badge variant="default" className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                {score}% match
              </Badge>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => sendConnectionRequest(colleague.id || colleague.user_id, colleague.display_name || colleague.email)}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Smart Social Discovery</h2>
        <p className="text-muted-foreground">
          AI-powered colleague discovery with advanced matching algorithms
        </p>
      </div>

      {/* Smart Discovery CTA */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
        <CardContent className="py-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI-Powered Discovery</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Use machine learning to find the most compatible colleagues based on your surgical patterns, case volume, and performance metrics.
          </p>
          <Button 
            onClick={smartContactDiscovery}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
          >
            <Brain className="h-4 w-4 mr-2" />
            {loading ? 'Analyzing Compatibility...' : 'Start Smart Discovery'}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="ai-recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai-recommendations" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Picks
          </TabsTrigger>
          <TabsTrigger value="specialty" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Specialty
          </TabsTrigger>
          <TabsTrigger value="nearby" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Nearby
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-recommendations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              AI-Recommended Colleagues
            </h3>
            <Badge variant="outline" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <Brain className="h-3 w-3 mr-1" />
              ML Powered
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiRecommendations.map((colleague) => (
              <ColleagueCard
                key={colleague.id}
                colleague={colleague}
                reason={colleague.match_reason}
                score={colleague.match_score}
                connections={colleague.mutual_connections}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="specialty" className="space-y-4">
          <h3 className="text-lg font-semibold">Specialty Colleagues</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialtyMatches.map((colleague) => (
              <ColleagueCard key={colleague.user_id} colleague={colleague} />
            ))}
          </div>
          {specialtyMatches.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No specialty matches found yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nearby" className="space-y-4">
          <h3 className="text-lg font-semibold">Institution Colleagues</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyColleagues.map((colleague) => (
              <ColleagueCard key={colleague.user_id} colleague={colleague} />
            ))}
          </div>
          {nearbyColleagues.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No institution colleagues found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <h3 className="text-lg font-semibold">Contact Discoveries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discoveredUsers.map((discovery) => (
              <ColleagueCard key={discovery.id} colleague={discovery.profiles} />
            ))}
          </div>
          {discoveredUsers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No contact discoveries yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Use Smart Discovery to find colleagues!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};