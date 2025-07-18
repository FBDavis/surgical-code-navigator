import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Crown, 
  Gift, 
  RefreshCw, 
  ExternalLink,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
  trial_end: string | null;
  free_months_remaining: number;
  stripe_customer_id: string | null;
}

interface ReferralData {
  referral_code: string;
  total_referrals: number;
  successful_referrals: number;
  pending_rewards: number;
}

export const SubscriptionManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load subscription status
  const loadSubscriptionStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Check subscription status
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription status",
          variant: "destructive"
        });
        return;
      }

      setSubscription(data);
      
      // Load referral data
      await loadReferralData();
      
    } catch (error) {
      console.error('Subscription check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load referral information
  const loadReferralData = async () => {
    if (!user) return;

    try {
      // Get user's referral code and stats
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('referral_code, status')
        .eq('referrer_user_id', user.id);

      if (error) throw error;

      // If no referral code exists, create one
      if (referrals.length === 0) {
        const { error: createError } = await supabase
          .from('referrals')
          .insert({
            referrer_user_id: user.id,
            referrer_email: user.email!,
            referred_email: '', // Will be filled when someone uses the code
            referral_code: await generateReferralCode()
          });

        if (createError) throw createError;
        
        // Reload data
        await loadReferralData();
        return;
      }

      const referralCode = referrals[0].referral_code;
      const totalReferrals = referrals.length;
      const successfulReferrals = referrals.filter(r => r.status === 'converted').length;

      // Get pending rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('applied', false);

      if (rewardsError) throw rewardsError;

      setReferralData({
        referral_code: referralCode,
        total_referrals: totalReferrals,
        successful_referrals: successfulReferrals,
        pending_rewards: rewards?.length || 0
      });

    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  };

  // Generate unique referral code
  const generateReferralCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_referral_code');
    if (error) throw error;
    return data;
  };

  // Start subscription process
  const handleSubscribe = async () => {
    if (!user) return;

    try {
      setProcessingPayment(true);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          price_id: 'price_1999', // $19.99/month
          success_url: `${window.location.origin}/dashboard?subscription=success`,
          cancel_url: `${window.location.origin}/dashboard?subscription=cancelled`
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      window.open(data.url, '_blank');
      
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // Manage subscription (customer portal)
  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;

      window.open(data.url, '_blank');
      
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive"
      });
    }
  };

  // Copy referral link
  const copyReferralLink = () => {
    if (!referralData) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${referralData.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard"
    });
  };

  useEffect(() => {
    loadSubscriptionStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSubscribed = subscription?.subscribed;
  const freeMonthsLeft = subscription?.free_months_remaining || 0;
  const isInTrial = subscription?.trial_end && new Date(subscription.trial_end) > new Date();

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSubscribed ? (
            <div className="space-y-4">
              <Alert>
                <Gift className="h-4 w-4" />
                <AlertDescription>
                  <strong>First month FREE!</strong> Start your subscription and get immediate access to all premium features.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleSubscribe}
                  disabled={processingPayment}
                  className="flex-1"
                >
                  {processingPayment ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Start Subscription - $19.99/month
                </Button>
                
                <Button variant="outline" onClick={loadSubscriptionStatus}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="font-medium">Active Subscription</span>
                <Badge variant="outline" className="text-success border-success">
                  {subscription.subscription_tier}
                </Badge>
              </div>
              
              {freeMonthsLeft > 0 && (
                <Alert>
                  <Gift className="h-4 w-4" />
                  <AlertDescription>
                    You have <strong>{freeMonthsLeft} free month{freeMonthsLeft !== 1 ? 's' : ''}</strong> remaining from referrals!
                  </AlertDescription>
                </Alert>
              )}
              
              {isInTrial && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Free trial ends: {new Date(subscription.trial_end!).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button variant="outline" onClick={handleManageSubscription}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Gift className="h-4 w-4" />
            <AlertDescription>
              <strong>Earn free months!</strong> Get 1 free month for each friend who subscribes. Maximum 6 free months total.
            </AlertDescription>
          </Alert>
          
          {referralData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{referralData.successful_referrals}</div>
                  <div className="text-sm text-muted-foreground">Successful Referrals</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-success">{freeMonthsLeft}</div>
                  <div className="text-sm text-muted-foreground">Free Months Left</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{referralData.pending_rewards}</div>
                  <div className="text-sm text-muted-foreground">Pending Rewards</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{6 - freeMonthsLeft}</div>
                  <div className="text-sm text-muted-foreground">Months Earned</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Referral Code:</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded border text-center font-mono text-lg">
                    {referralData.referral_code}
                  </code>
                  <Button onClick={copyReferralLink} variant="outline">
                    Copy Link
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Share your referral code with colleagues. When they subscribe, you both get benefits!
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};