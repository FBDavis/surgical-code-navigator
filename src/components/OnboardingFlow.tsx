import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, ArrowRight, Stethoscope, GraduationCap, FileText, Code, Shield, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const roleOptions = [
  {
    id: 'practicing_surgeon',
    title: 'Practicing Surgeon',
    description: 'Board-certified surgeon in practice',
    icon: Stethoscope,
    color: 'text-blue-600'
  },
  {
    id: 'resident',
    title: 'Resident',
    description: 'Surgical resident in training',
    icon: GraduationCap,
    color: 'text-green-600'
  },
  {
    id: 'fellow',
    title: 'Fellow',
    description: 'Subspecialty fellowship training',
    icon: GraduationCap,
    color: 'text-purple-600'
  },
  {
    id: 'scribe',
    title: 'Medical Scribe',
    description: 'Documentation specialist',
    icon: FileText,
    color: 'text-orange-600'
  },
  {
    id: 'coder',
    title: 'Medical Coder',
    description: 'CPT coding specialist',
    icon: Code,
    color: 'text-red-600'
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Healthcare administration',
    icon: Shield,
    color: 'text-gray-600'
  }
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    institution: '',
    yearOfTraining: '',
    subspecialty: '',
    boardCertification: []
  });
  const { toast } = useToast();

  const loadSpecialties = async () => {
    const { data } = await supabase
      .from('surgical_specialties')
      .select('*')
      .order('name');
    setSpecialties(data || []);
  };

  const handleRoleSelect = async (role: string) => {
    setSelectedRole(role);
    if (['practicing_surgeon', 'resident', 'fellow'].includes(role)) {
      await loadSpecialties();
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_role: selectedRole,
          specialty_id: selectedSpecialty || null,
          display_name: formData.displayName,
          institution: formData.institution,
          year_of_training: formData.yearOfTraining ? parseInt(formData.yearOfTraining) : null,
          subspecialty: formData.subspecialty,
          onboarding_completed: true
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update onboarding progress
      const { error: progressError } = await supabase
        .from('onboarding_progress')
        .update({
          role_selected: true,
          specialty_selected: !!selectedSpecialty,
          preferences_set: true,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      toast({
        title: "Welcome aboard!",
        description: "Your profile has been set up successfully.",
      });

      onComplete();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: "Setup Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderRoleSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What's your role?</h2>
        <p className="text-muted-foreground">Help us customize your experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roleOptions.map((role) => {
          const IconComponent = role.icon;
          return (
            <Card
              key={role.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedRole === role.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
              }`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className="flex items-start space-x-3">
                <IconComponent className={`w-6 h-6 ${role.color} mt-1`} />
                <div>
                  <h3 className="font-medium">{role.title}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Button 
        onClick={() => setCurrentStep(2)}
        disabled={!selectedRole}
        className="w-full"
      >
        Continue <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  const renderSpecialtySelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Select Your Specialty</h2>
        <p className="text-muted-foreground">
          {selectedRole === 'practicing_surgeon' && "We'll curate relevant codes and branding for your specialty"}
          {['resident', 'fellow'].includes(selectedRole) && "We'll reference ACGME requirements for your case tracking"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Primary Specialty</Label>
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your specialty" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty.id} value={specialty.id}>
                  {specialty.name} ({specialty.abbreviation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {['resident', 'fellow'].includes(selectedRole) && (
          <>
            <div>
              <Label>Subspecialty (Optional)</Label>
              <Input
                value={formData.subspecialty}
                onChange={(e) => setFormData({ ...formData, subspecialty: e.target.value })}
                placeholder="e.g., Trauma, Spine, Hand Surgery"
              />
            </div>
            <div>
              <Label>Year of Training</Label>
              <Select 
                value={formData.yearOfTraining} 
                onValueChange={(value) => setFormData({ ...formData, yearOfTraining: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRole === 'resident' && [1, 2, 3, 4, 5, 6, 7].map(year => (
                    <SelectItem key={year} value={year.toString()}>PGY-{year}</SelectItem>
                  ))}
                  {selectedRole === 'fellow' && [1, 2, 3].map(year => (
                    <SelectItem key={year} value={year.toString()}>Fellow Year {year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <Button onClick={() => setCurrentStep(3)} className="w-full">
        Continue <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Complete Your Profile</h2>
        <p className="text-muted-foreground">Just a few more details</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Display Name</Label>
          <Input
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Dr. John Smith"
          />
        </div>

        <div>
          <Label>Institution</Label>
          <Input
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            placeholder="Hospital or Medical School"
          />
        </div>
      </div>

      <Button onClick={completeOnboarding} className="w-full">
        <CheckCircle className="w-4 h-4 mr-2" />
        Complete Setup
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
            <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
            <div className={`h-1 w-16 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
          </div>
        </div>

        {currentStep === 1 && renderRoleSelection()}
        {currentStep === 2 && renderSpecialtySelection()}
        {currentStep === 3 && renderPersonalInfo()}
      </Card>
    </div>
  );
};