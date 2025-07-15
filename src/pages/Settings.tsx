import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const Settings = () => {
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and data</p>
      </div>

      <div className="grid gap-6">
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