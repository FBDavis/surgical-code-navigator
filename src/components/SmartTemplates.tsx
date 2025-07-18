import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Copy, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateSection {
  title: string;
  content: string;
  codes: string[];
  rvuImpact: number;
}

interface SmartTemplate {
  name: string;
  specialty: string;
  description: string;
  sections: TemplateSection[];
  totalRvu: number;
  keywords: string[];
}

interface SmartTemplatesProps {
  currentText: string;
  specialty?: string;
  onInsertTemplate: (template: string) => void;
}

export const SmartTemplates = ({ currentText, specialty, onInsertTemplate }: SmartTemplatesProps) => {
  const [suggestedTemplates, setSuggestedTemplates] = useState<SmartTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const { toast } = useToast();

  // Mock templates based on specialty and current text
  const templates: SmartTemplate[] = [
    {
      name: "Arthroscopic Rotator Cuff Repair",
      specialty: "orthopedic_surgery",
      description: "Complete template for arthroscopic rotator cuff repair with optimal documentation",
      sections: [
        {
          title: "Preoperative Diagnosis",
          content: "Right shoulder rotator cuff tear, full-thickness involving supraspinatus tendon with retraction",
          codes: ["29827"],
          rvuImpact: 0
        },
        {
          title: "Procedure Details",
          content: "Arthroscopic examination revealed full-thickness tear of supraspinatus tendon measuring 2.5cm with retraction to level of glenoid rim. Tear edges were debrided to healthy tissue. Double-row repair performed using 2 medial anchors and 2 lateral anchors with high-strength suture.",
          codes: ["29827", "29806"],
          rvuImpact: 5.2
        },
        {
          title: "Additional Procedures",
          content: "Subacromial decompression performed with removal of Type II acromion undersurface. Coracoacromial ligament released. AC joint evaluated - no degenerative changes requiring intervention.",
          codes: ["29826"],
          rvuImpact: 3.1
        }
      ],
      totalRvu: 18.4,
      keywords: ["rotator cuff", "arthroscopic", "shoulder", "repair", "tear"]
    },
    {
      name: "Laparoscopic Cholecystectomy with IOC",
      specialty: "general_surgery", 
      description: "Comprehensive template for laparoscopic cholecystectomy with intraoperative cholangiography",
      sections: [
        {
          title: "Preoperative Diagnosis", 
          content: "Acute cholecystitis with cholelithiasis, moderate risk for choledocholithiasis",
          codes: ["47562"],
          rvuImpact: 0
        },
        {
          title: "Procedure Details",
          content: "Four-port laparoscopic approach utilized. Critical view of safety achieved with clear identification of hepatocystic triangle, single artery, and single duct entering gallbladder. Intraoperative cholangiography performed via cystic artery demonstrating patent common bile duct with normal flow into duodenum, no filling defects identified.",
          codes: ["47563", "74300"],
          rvuImpact: 2.8
        },
        {
          title: "Findings and Closure",
          content: "Gallbladder removed intact in specimen bag. Hemostasis achieved. Liver bed inspected - no bleeding or perforation. All ports removed under direct visualization with fascial closure of 12mm port sites.",
          codes: [],
          rvuImpact: 0
        }
      ],
      totalRvu: 12.8,
      keywords: ["cholecystectomy", "laparoscopic", "gallbladder", "cholangiography", "biliary"]
    }
  ];

  useEffect(() => {
    if (currentText.length > 20) {
      // Simple keyword matching for template suggestions
      const relevantTemplates = templates.filter(template => {
        if (specialty && template.specialty !== specialty) return false;
        
        return template.keywords.some(keyword => 
          currentText.toLowerCase().includes(keyword.toLowerCase())
        );
      });

      setSuggestedTemplates(relevantTemplates);
      setShowTemplates(relevantTemplates.length > 0);
    } else {
      setSuggestedTemplates([]);
      setShowTemplates(false);
    }
  }, [currentText, specialty]);

  const handleInsertSection = (section: TemplateSection) => {
    onInsertTemplate(section.content);
    toast({
      title: "Template Section Inserted",
      description: `Added ${section.title} to your dictation`,
    });
  };

  const handleInsertFullTemplate = (template: SmartTemplate) => {
    const fullTemplate = template.sections.map(section => 
      `${section.title}:\n${section.content}\n`
    ).join('\n');
    
    onInsertTemplate(fullTemplate);
    toast({
      title: "Full Template Inserted",
      description: `Added complete ${template.name} template`,
    });
  };

  if (!showTemplates || suggestedTemplates.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-600" />
        <h3 className="font-medium text-amber-800">Smart Templates</h3>
        <Badge variant="secondary" className="text-amber-700">
          {suggestedTemplates.length} suggested
        </Badge>
      </div>

      <div className="space-y-4">
        {suggestedTemplates.map((template, index) => (
          <div key={index} className="border border-amber-200 rounded-lg p-3 bg-white/60">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-amber-900">{template.name}</h4>
                <p className="text-sm text-amber-700">{template.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">
                  +{template.totalRvu} RVU
                </div>
                <div className="text-xs text-muted-foreground">
                  ≈ ${(template.totalRvu * 52).toFixed(0)}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              {template.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="flex items-center justify-between p-2 bg-amber-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-amber-800">{section.title}</div>
                    <div className="text-xs text-amber-600 truncate">
                      {section.content.substring(0, 60)}...
                    </div>
                    {section.codes.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {section.codes.map(code => (
                          <Badge key={code} variant="outline" className="text-xs font-mono">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInsertSection(section)}
                    className="ml-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleInsertFullTemplate(template)}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                Insert Full Template
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};