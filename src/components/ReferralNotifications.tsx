import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Gift, 
  Users, 
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FloatingReferralProps {
  onDismiss: () => void;
}

export const FloatingReferralBanner = ({ onDismiss }: FloatingReferralProps) => {
  const { subscriptionStatus } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after 10 seconds for subscribed users
    if (subscriptionStatus?.subscribed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [subscriptionStatus]);

  if (!isVisible || !subscriptionStatus?.subscribed) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 animate-slide-in-right"
      style={{ maxWidth: '320px' }}
    >
      <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  Limited Time
                </Badge>
              </div>
              
              <h3 className="font-semibold text-sm mb-1">Earn Free Months! 🎉</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Refer colleagues and get up to 6 months free. Start sharing now!
              </p>
              
              <div className="flex gap-2">
                <Button size="sm" className="text-xs h-7 px-3">
                  <Gift className="h-3 w-3 mr-1" />
                  Share Now
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7 px-3"
                  onClick={handleDismiss}
                >
                  Later
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ReferralSuccessToastProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ReferralSuccessToast = ({ isVisible, onClose }: ReferralSuccessToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Referral Sent! 🚀
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                You're one step closer to earning a free month!
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};