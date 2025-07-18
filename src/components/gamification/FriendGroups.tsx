import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Crown, Share, Trophy, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FriendGroupsProps {
  onStatsUpdate: () => void;
}

export const FriendGroups: React.FC<FriendGroupsProps> = ({ onStatsUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    is_public: false
  });

  useEffect(() => {
    if (user) {
      loadFriendGroups();
    }
  }, [user]);

  const loadFriendGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('friend_group_members')
        .select(`
          *,
          friend_groups (
            *,
            friend_group_members (
              user_id,
              role,
              profiles (
                display_name,
                email
              )
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading friend groups:', error);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) return;
    
    setLoading(true);
    try {
      const { data: group, error: groupError } = await supabase
        .from('friend_groups')
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          created_by: user.id,
          is_public: newGroup.is_public
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('friend_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      toast({
        title: "Group Created! 🎉",
        description: `${newGroup.name} is ready for members.`,
      });

      setNewGroup({ name: '', description: '', is_public: false });
      setShowCreateDialog(false);
      loadFriendGroups();
      onStatsUpdate();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Creation Failed",
        description: "Could not create group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;

    setLoading(true);
    try {
      // Find group by code
      const { data: group, error: groupError } = await supabase
        .from('friend_groups')
        .select('*')
        .eq('group_code', joinCode.toUpperCase())
        .single();

      if (groupError) throw new Error('Group not found');

      // Check if already a member
      const { data: existing } = await supabase
        .from('friend_group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast({
          title: "Already a Member",
          description: "You're already in this group!",
          variant: "destructive"
        });
        return;
      }

      // Join the group
      const { error: memberError } = await supabase
        .from('friend_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member'
        });

      if (memberError) throw memberError;

      toast({
        title: "Joined Group! 🎉",
        description: `Welcome to ${group.name}!`,
      });

      setJoinCode('');
      loadFriendGroups();
      onStatsUpdate();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Join Failed",
        description: "Could not join group. Check the code and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied!",
      description: "Share this code with friends to invite them.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Friend Groups</h2>
          <p className="text-muted-foreground">Compete and collaborate with your surgical colleagues</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Friend Group</DialogTitle>
                <DialogDescription>
                  Start a new group to compete and share achievements with colleagues.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Elite Surgeons Squad"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A group for competitive surgeons..."
                  />
                </div>
                <Button onClick={createGroup} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex gap-2">
            <Input
              placeholder="Enter group code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-32"
            />
            <Button onClick={joinGroup} disabled={loading} variant="outline">
              Join
            </Button>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((membership) => {
          const group = membership.friend_groups;
          const members = group.friend_group_members || [];
          const isAdmin = membership.role === 'admin';
          
          return (
            <Card key={group.id} className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {group.name}
                      {isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                    </CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </div>
                  <Badge variant={group.is_public ? "default" : "secondary"}>
                    {group.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyGroupCode(group.group_code)}
                    className="flex items-center gap-2"
                  >
                    <Share className="h-3 w-3" />
                    {group.group_code}
                  </Button>
                </div>

                {/* Member avatars */}
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((member: any, index: number) => (
                    <div
                      key={member.user_id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xs font-semibold border-2 border-background"
                      title={member.profiles?.display_name || member.profiles?.email || 'Unknown'}
                    >
                      {(member.profiles?.display_name || member.profiles?.email || 'U')[0].toUpperCase()}
                    </div>
                  ))}
                  {members.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold border-2 border-background">
                      +{members.length - 5}
                    </div>
                  )}
                </div>

                {/* Group actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Trophy className="h-3 w-3 mr-1" />
                    Leaderboard
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Target className="h-3 w-3 mr-1" />
                    Challenges
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty state */}
        {groups.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Friend Groups Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a group or join one to start competing with colleagues!
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};