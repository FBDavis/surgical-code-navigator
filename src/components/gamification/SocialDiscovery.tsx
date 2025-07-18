import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Building2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialDiscoveryProps {
  onStatsUpdate: () => void;
}

export const SocialDiscovery: React.FC<SocialDiscoveryProps> = ({ onStatsUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discoveredUsers, setDiscoveredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadDiscoveredUsers();
    }
  }, [user]);

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
            user_role
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setDiscoveredUsers(data || []);
    } catch (error) {
      console.error('Error loading discovered users:', error);
    }
  };

  const simulateContactDiscovery = async () => {
    setLoading(true);
    try {
      // Simulate finding colleagues (in real app, this would analyze contacts)
      toast({
        title: "Contact Scan Complete! 📱",
        description: "Found 3 colleagues using OpCoder. Send friend requests to connect!",
      });
      
      // In a real implementation, this would:
      // 1. Request contact permissions
      // 2. Hash phone numbers/emails (HIPAA-safe)
      // 3. Match with existing users
      // 4. Create contact_discoveries entries
      
    } catch (error) {
      console.error('Error scanning contacts:', error);
      toast({
        title: "Scan Failed",
        description: "Could not scan contacts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Discover Colleagues</h2>
        <p className="text-muted-foreground">
          Find and connect with fellow surgeons in a HIPAA-safe way
        </p>
      </div>

      {/* Contact Discovery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Colleagues
          </CardTitle>
          <CardDescription>
            Discover colleagues who are already using OpCoder through secure contact matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={simulateContactDiscovery}
            disabled={loading}
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            {loading ? 'Scanning Contacts...' : 'Scan My Contacts'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            No patient data is shared. Only hashed contact info for colleague discovery.
          </p>
        </CardContent>
      </Card>

      {/* Institution-based Discovery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Institution Colleagues
          </CardTitle>
          <CardDescription>
            Connect with surgeons from your hospital or institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Feature coming soon! Connect with colleagues from your institution.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Discovered Users */}
      {discoveredUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Discovered Colleagues</CardTitle>
            <CardDescription>People you might know using OpCoder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {discoveredUsers.map((discovery) => (
                <div key={discovery.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                      {(discovery.profiles?.display_name || discovery.profiles?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {discovery.profiles?.display_name || discovery.profiles?.email}
                      </p>
                      <div className="flex items-center gap-2">
                        {discovery.profiles?.institution && (
                          <Badge variant="outline" className="text-xs">
                            {discovery.profiles.institution}
                          </Badge>
                        )}
                        {discovery.profiles?.user_role && (
                          <Badge variant="outline" className="text-xs">
                            {discovery.profiles.user_role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};