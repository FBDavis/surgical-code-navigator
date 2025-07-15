import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export const SpecialtyBranding = () => {
  const { profile, user } = useAuth();
  
  useEffect(() => {
    // Apply specialty theme colors if available
    const specialty = profile?.specialty || user?.user_metadata?.specialty;
    const theme = profile?.specialty_theme || user?.user_metadata?.specialty_theme;
    
    if (theme && theme.primary_color) {
      document.documentElement.style.setProperty('--primary', theme.primary_color);
      document.documentElement.style.setProperty('--medical-blue', theme.primary_color);
    }
    
    if (theme && theme.accent_color) {
      document.documentElement.style.setProperty('--accent', theme.accent_color);
      document.documentElement.style.setProperty('--medical-accent', theme.accent_color);
    }
  }, [profile, user]);

  const getSpecialtyDisplayName = (specialty: string) => {
    const names = {
      orthopedics: "Orthopedics",
      general_surgery: "General Surgery", 
      plastic_surgery: "Plastic Surgery",
      ent: "ENT (Otolaryngology)",
      cardiothoracic: "Cardiothoracic Surgery",
      neurosurgery: "Neurosurgery",
      urology: "Urology",
      gynecology: "Gynecology",
      ophthalmology: "Ophthalmology",
      dermatology: "Dermatology",
      gastroenterology: "Gastroenterology",
      emergency_medicine: "Emergency Medicine",
      family_medicine: "Family Medicine",
      internal_medicine: "Internal Medicine",
      radiology: "Radiology",
      anesthesiology: "Anesthesiology",
      pathology: "Pathology",
      psychiatry: "Psychiatry",
      pediatrics: "Pediatrics",
      oncology: "Oncology"
    };
    return names[specialty as keyof typeof names] || "General Medicine";
  };

  const specialty = profile?.specialty || user?.user_metadata?.specialty;
  const theme = profile?.specialty_theme || user?.user_metadata?.specialty_theme;
  
  if (!specialty) return null;

  return (
    <div className="text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: `hsl(${theme?.primary_color || '195 100% 28%'})` }}
        />
        {getSpecialtyDisplayName(specialty)}
      </span>
    </div>
  );
};