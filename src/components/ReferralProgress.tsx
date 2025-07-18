import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Users, 
  TrendingUp, 
  Share2,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  freeMonthsEarned: number;
  pendingReferrals: number;
}

export const ReferralProgress = () => {
  const { user, subscriptionStatus } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    successfulReferrals: 0,
    freeMonthsEarned: 0,
    pendingReferrals: 0
  });
  const [referralCode, setReferralCode] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user && subscriptionStatus?.subscribed) {
      loadReferralStats();
    }
  }, [user, subscriptionStatus]);

  const loadReferralStats = async () => {
    if (!user) return;

    try {
      // Get referral stats
      const { data: referrals } = await supabase
        .from('referrals')
        .select('status, referral_code')
        .eq('referrer_user_id', user.id);

      if (referrals && referrals.length > 0) {
        setReferralCode(referrals[0].referral_code);
        
        const successful = referrals.filter(r => r.status === 'converted').length;
        const pending = referrals.filter(r => r.status === 'pending').length;
        
        setStats({
          totalReferrals: referrals.length,
          successfulReferrals: successful,
          freeMonthsEarned: successful,
          pendingReferrals: pending
        });
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    
    toast({
      title: "Link Copied! 🎉",
      description: "Share with colleagues to earn free months",
    });
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    const text = "Check out OpCoder - AI-powered medical coding that saves hours every week! Get started with my referral link:";
    
    if (navigator.share) {
      navigator.share({
        title: 'OpCoder - AI Medical Coding Assistant',
        text: text,
        url: referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

  if (!subscriptionStatus?.subscribed) return null;

  const progressPercentage = Math.min((stats.freeMonthsEarned / 6) * 100, 100);
  const remainingSlots = 6 - stats.freeMonthsEarned;

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <Gift className="h-5 w-5" />
          Referral Progress
          {stats.freeMonthsEarned > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.freeMonthsEarned} months earned!
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-700 dark:text-green-300">Free Months Progress</span>
            <span className="font-medium text-green-700 dark:text-green-300">
              {stats.freeMonthsEarned}/6
            </span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {remainingSlots > 0 && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {remainingSlots} more free months available!
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.totalReferrals}</div>
            <div className="text-xs text-green-700 dark:text-green-300">Total Sent</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingReferrals}</div>
            <div className="text-xs text-green-700 dark:text-green-300">Pending</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">{stats.successfulReferrals}</div>
            <div className="text-xs text-green-700 dark:text-green-300">Converted</div>
          </div>
        </div>

        {/* Referral Code & Actions */}
        {referralCode && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-sm font-medium mb-2 text-green-700 dark:text-green-300">
                Your Referral Code:
              </div>
              <div className="flex items-center justify-center gap-2">
                <code className="text-lg font-mono bg-white dark:bg-gray-800 px-4 py-2 rounded border">
                  {referralCode}
                </code>
                {showSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={copyReferralLink} 
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button 
                onClick={shareReferralLink} 
                variant="outline" 
                className="border-green-600 text-green-600 hover:bg-green-50"
                size="sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {stats.freeMonthsEarned < 6 && (
          <div className="text-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800/30 dark:to-emerald-800/30 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              {remainingSlots === 6 ? "Start referring to earn free months!" : 
               remainingSlots === 1 ? "One more referral for maximum benefits!" :
               `Refer ${remainingSlots} more colleagues for free months!`}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Each successful referral = 1 month free
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};