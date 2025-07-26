import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw, User, Mail, Building, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const Settings = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { profile, updateProfile, loading, user, session } = useAuth();
  

  
  const [profileData, setProfileData] = useState({
    display_name: '',
    license_number: '',
    practice_name: '',
    default_rvu_rate: 65,
    institution: '',
    user_role: '',
    subspecialty: '',
    year_of_training: null,
  });

  // Update profile data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        display_name: profile.display_name || '',
        license_number: profile.license_number || '',
        practice_name: profile.practice_name || '',
        default_rvu_rate: profile.default_rvu_rate || 65,
        institution: profile.institution || '',
        user_role: profile.user_role || '',
        subspecialty: profile.subspecialty || '',
        year_of_training: profile.year_of_training || null,
      });
    }
  }, [profile]);

  const handleResetUserData = async () => {
    setIsResetting(true);
    try {
      const { error } = await supabase.rpc('reset_user_data');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Data Reset Successfully",
        description: "All your cases and data have been cleared from the dashboard.",
        variant: "default",
      });
      
      // Refresh the page to show the clean dashboard
      window.location.reload();
    } catch (error) {
      console.error('Error resetting user data:', error);
      toast({
        title: "Reset Failed",
        description: "There was an error resetting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { error } = await updateProfile(profileData);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and data</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading profile...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={profileData.display_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={profileData.license_number}
                      onChange={(e) => setProfileData(prev => ({ ...prev, license_number: e.target.value }))}
                      placeholder="123456"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="practice_name">Practice Name</Label>
                    <Input
                      id="practice_name"
                      value={profileData.practice_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, practice_name: e.target.value }))}
                      placeholder="City General Hospital"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    <Input
                      id="institution"
                      value={profileData.institution}
                      onChange={(e) => setProfileData(prev => ({ ...prev, institution: e.target.value }))}
                      placeholder="University Medical Center"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user_role">Role</Label>
                    <Select value={profileData.user_role} onValueChange={(value) => setProfileData(prev => ({ ...prev, user_role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attending">Attending Physician</SelectItem>
                        <SelectItem value="resident">Resident</SelectItem>
                        <SelectItem value="fellow">Fellow</SelectItem>
                        <SelectItem value="nurse_practitioner">Nurse Practitioner</SelectItem>
                        <SelectItem value="physician_assistant">Physician Assistant</SelectItem>
                        <SelectItem value="medical_student">Medical Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default_rvu_rate">Default RVU Rate ($)</Label>
                    <Input
                      id="default_rvu_rate"
                      type="number"
                      value={profileData.default_rvu_rate}
                      onChange={(e) => setProfileData(prev => ({ ...prev, default_rvu_rate: parseFloat(e.target.value) || 65 }))}
                      placeholder="65"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating}
                  className="w-full md:w-auto"
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Manage your dashboard data and reset options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
              <h3 className="font-semibold text-destructive mb-2">Reset Dashboard Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete all your cases, CPT codes, and reset your profile settings to defaults. 
                This action cannot be undone.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="flex items-center gap-2"
                    disabled={isResetting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Reset All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Cases and associated CPT codes</li>
                        <li>RVU calculations and estimates</li>
                        <li>Custom settings (will reset to defaults)</li>
                      </ul>
                      Your account and profile information will remain, but all dashboard data will be cleared.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleResetUserData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isResetting}
                    >
                      {isResetting ? 'Resetting...' : 'Yes, Reset Everything'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Additional settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Compensation rate settings and other preferences coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};