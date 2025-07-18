import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Gift, 
  Users, 
  X, 
  Share2, 
  Clock,
  Crown,
  Star,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Reminder {
  id: string;
  reminder_type: string;
  shown_count: number;
  last_shown: string | null;
  dismissed: boolean;
  dismissed_until: string | null;
}

interface ReferralRemindersProps {
  isSubscribed?: boolean;
  freeMonthsLeft?: number;
}

export const ReferralReminders = ({ isSubscribed = false, freeMonthsLeft = 0 }: ReferralRemindersProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentReminder, setCurrentReminder] = useState<Reminder | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Check for reminders to show
  const checkReminders = async () => {
    if (!user || !isSubscribed) return;

    try {
      // Get user's referral code
      const { data: referrals } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_user_id', user.id)
        .limit(1);

      if (referrals && referrals.length > 0) {
        setReferralCode(referrals[0].referral_code);
      }

      // Check for active reminders
      const { data: reminders } = await supabase
        .from('subscription_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .or('dismissed_until.is.null,dismissed_until.lt.now()')
        .order('created_at', { ascending: true })
        .limit(1);

      if (reminders && reminders.length > 0) {
        const reminder = reminders[0];
        
        // Check if we should show this reminder based on timing rules
        const shouldShow = shouldShowReminder(reminder);
        
        if (shouldShow) {
          setCurrentReminder(reminder);
          setShowReminderModal(true);
          
          // Update shown count
          await supabase
            .from('subscription_reminders')
            .update({ 
              shown_count: reminder.shown_count + 1,
              last_shown: new Date().toISOString()
            })
            .eq('id', reminder.id);
        }
      }
      
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  };

  // Determine if reminder should be shown based on type and timing
  const shouldShowReminder = (reminder: Reminder): boolean => {
    const now = new Date();
    const lastShown = reminder.last_shown ? new Date(reminder.last_shown) : null;
    const timeSinceLastShown = lastShown ? now.getTime() - lastShown.getTime() : Infinity;
    
    switch (reminder.reminder_type) {
      case 'refer_friend':
        // Show every 3 days, max 5 times
        return !lastShown || (timeSinceLastShown > 3 * 24 * 60 * 60 * 1000 && reminder.shown_count < 5);
      
      case 'trial_ending':
        // Show once per day in the last 3 days of trial
        return !lastShown || timeSinceLastShown > 24 * 60 * 60 * 1000;
      
      case 'upgrade_prompt':
        // Show every 7 days
        return !lastShown || timeSinceLastShown > 7 * 24 * 60 * 60 * 1000;
      
      default:
        return true;
    }
  };

  // Dismiss reminder
  const dismissReminder = async (dismissDuration?: string) => {
    if (!currentReminder) return;

    try {
      const dismissedUntil = dismissDuration 
        ? new Date(Date.now() + parseDuration(dismissDuration)).toISOString()
        : null;

      await supabase
        .from('subscription_reminders')
        .update({ 
          dismissed: !dismissDuration, // Permanently dismiss if no duration
          dismissed_until: dismissedUntil
        })
        .eq('id', currentReminder.id);

      setShowReminderModal(false);
      setCurrentReminder(null);
      
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  // Parse duration string to milliseconds
  const parseDuration = (duration: string): number => {
    const durations: { [key: string]: number } = {
      '1hour': 60 * 60 * 1000,
      '1day': 24 * 60 * 60 * 1000,
      '3days': 3 * 24 * 60 * 60 * 1000,
      '1week': 7 * 24 * 60 * 60 * 1000,
    };
    return durations[duration] || 24 * 60 * 60 * 1000;
  };

  // Copy referral link
  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard"
    });
  };

  // Share referral link
  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    const text = "Check out OpCoder - the AI-powered medical coding assistant! Use my referral code to get started.";
    
    if (navigator.share) {
      navigator.share({
        title: 'OpCoder - Medical Coding Assistant',
        text: text,
        url: referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

  useEffect(() => {
    // Check reminders when component mounts and user is subscribed
    if (isSubscribed) {
      // Initial check after 5 seconds
      setTimeout(checkReminders, 5000);
      
      // Periodic check every 30 minutes
      const interval = setInterval(checkReminders, 30 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, isSubscribed]);

  // Render reminder content based on type
  const renderReminderContent = () => {
    if (!currentReminder) return null;

    switch (currentReminder.reminder_type) {
      case 'refer_friend':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Earn Free Months!</h3>
              <p className="text-muted-foreground">
                Refer colleagues and get up to 6 free months of OpCoder. You currently have {freeMonthsLeft} free months remaining.
              </p>
            </div>
            
            <Alert>
              <Star className="h-4 w-4" />
              <AlertDescription>
                <strong>1 referral = 1 free month</strong> (up to 6 months maximum)
              </AlertDescription>
            </Alert>
            
            {referralCode && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-sm font-medium mb-2">Your Referral Code:</div>
                  <code className="text-lg font-mono bg-muted px-4 py-2 rounded border">
                    {referralCode}
                  </code>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={copyReferralLink} className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button onClick={shareReferralLink} variant="outline" className="flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'upgrade_prompt':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Unlock Full Potential</h3>
              <p className="text-muted-foreground">
                Get unlimited access to all premium features including advanced analytics, case management, and priority support.
              </p>
            </div>
            
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>First month FREE</strong> when you upgrade today!
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <p>Stay connected with OpCoder for the latest updates and features!</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={showReminderModal} onOpenChange={() => setShowReminderModal(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {currentReminder?.reminder_type === 'refer_friend' && 'Refer Friends'}
              {currentReminder?.reminder_type === 'upgrade_prompt' && 'Upgrade Account'}
              {currentReminder?.reminder_type === 'trial_ending' && 'Trial Ending Soon'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissReminder()}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {renderReminderContent()}
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                onClick={() => dismissReminder('1day')}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                Remind Tomorrow
              </Button>
              <Button
                onClick={() => dismissReminder('1week')}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                In 1 Week
              </Button>
            </div>
            
            <Button
              onClick={() => dismissReminder()}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              Don't show again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};