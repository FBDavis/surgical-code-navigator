
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { ReferralReminders } from '@/components/ReferralReminders';
import { ReferralProgress } from '@/components/ReferralProgress';
import { 
  CheckCircle, 
  Crown, 
  Users, 
  Shield, 
  Zap, 
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const Subscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  // Handle subscription callback messages
  useEffect(() => {
    const status = searchParams.get('subscription');
    
    if (status === 'success') {
      toast({
        title: "Welcome to OpCoder Premium! 🎉",
        description: "Your subscription is now active. Enjoy your first month free!",
        duration: 5000,
      });
    } else if (status === 'cancelled') {
      toast({
        title: "Subscription Cancelled",
        description: "You can still start a subscription anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const features = [
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      title: "AI-Powered Code Search",
      description: "Advanced CPT code recommendations with 99%+ accuracy"
    },
    {
      icon: <Crown className="h-5 w-5 text-purple-500" />,
      title: "Unlimited Cases",
      description: "Create and manage unlimited surgical cases and procedures"
    },
    {
      icon: <Users className="h-5 w-5 text-blue-500" />,
      title: "Team Collaboration",
      description: "Share cases and communicate with your surgical team"
    },
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security for patient data protection"
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      title: "Schedule Integration",
      description: "Import surgery schedules and auto-create cases"
    },
    {
      icon: <Star className="h-5 w-5 text-pink-500" />,
      title: "Priority Support",
      description: "Get help from our medical coding experts"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      specialty: "General Surgery",
      quote: "OpCoder has transformed how I handle surgical coding. The AI suggestions are incredibly accurate and save me hours each week."
    },
    {
      name: "Dr. Michael Chen",
      specialty: "Orthopedic Surgery", 
      quote: "The referral program is fantastic! I've earned 4 free months just by sharing with colleagues."
    },
    {
      name: "Dr. Emily Rodriguez",
      specialty: "Plastic Surgery",
      quote: "As a resident, the case logging feature helps me stay on track with ACGME requirements effortlessly."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">OpCoder Premium</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The complete medical coding solution for surgeons, residents, and medical professionals
          </p>
        </div>

        {/* Subscription Manager */}
        <SubscriptionManager />

        {/* Referral Progress */}
        <ReferralProgress />

        {/* Features Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Premium Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Simple, Transparent Pricing</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">$19.99</div>
              <div className="text-muted-foreground">per month</div>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>First month FREE</strong> for all new subscribers!
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-left max-w-sm mx-auto">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Unlimited AI code searches</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Unlimited case management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Advanced RVU analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Team collaboration tools</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Priority support</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Program Highlight */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Users className="h-6 w-6" />
              Referral Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-green-700 dark:text-green-300">
              Love OpCoder? Share it with colleagues and earn free months!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">1</div>
                <div className="text-sm text-green-700 dark:text-green-300">Referral</div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">1</div>
                <div className="text-sm text-green-700 dark:text-green-300">Free Month</div>
              </div>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                <strong>Maximum 6 free months</strong> through successful referrals
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">What Our Users Say</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="p-6 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.specialty}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">How does the referral program work?</h3>
              <p className="text-muted-foreground">Share your unique referral code with colleagues. When they subscribe, you both get benefits - you earn a free month (up to 6 total).</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Is my data secure?</h3>
              <p className="text-muted-foreground">Absolutely. We're HIPAA compliant and use enterprise-grade encryption to protect all patient and practice data.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">What support is available?</h3>
              <p className="text-muted-foreground">Premium subscribers get priority support from our medical coding experts, including live chat, email support, and access to our knowledge base with coding guidelines and best practices.</p>
            </div>
          </CardContent>
        </Card>

        {/* Referral Reminders Component */}
        <ReferralReminders 
          isSubscribed={subscriptionStatus?.subscribed} 
          freeMonthsLeft={subscriptionStatus?.free_months_remaining || 0} 
        />
      </div>
    </div>
  );
};
