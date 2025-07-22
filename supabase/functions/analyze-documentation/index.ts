import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentationIssue {
  type: 'missing_laterality' | 'incomplete_depth' | 'missing_modifier' | 'bundling_violation' | 'compliance_issue';
  severity: 'critical' | 'high' | 'medium' | 'low';
  code?: string;
  field: string;
  message: string;
  suggestion: string;
  rvuImpact?: number;
  compliance?: {
    policy: string;
    reference: string;
  };
}

interface DocumentationAnalysis {
  issues: DocumentationIssue[];
  completenessScore: number;
  missingElements: string[];
  requiredModifiers: {
    code: string;
    modifier: string;
    reason: string;
  }[];
  complianceWarnings: {
    type: string;
    message: string;
    severity: string;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dictationText, selectedCodes = [], specialty } = await req.json()
    
    if (!dictationText) {
      throw new Error('No dictation text provided')
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const selectedCodesStr = selectedCodes.map((c: any) => `${c.code} (${c.description})`).join(', ')
    const specialtyContext = specialty ? ` This is for ${specialty.replace('_', ' ')} specialty.` : ''

    // Define codes that typically don't require laterality
    const nonLateralCodes = [
      // General/abdominal procedures
      '44970', '47562', '47563', '49650', '43770', '44180', '44238', '44970',
      // Cardiovascular procedures
      '33533', '33534', '33535', '33536', '93017', '93303', '93306', '93307',
      // Endoscopic procedures
      '43235', '43239', '43249', '43270', '45378', '45380', '45385',
      // Anesthesia codes
      '00100', '00102', '00103', '00104', '00120', '00124', '00126',
      // Pathology codes
      '88305', '88307', '88309', '88311', '88312', '88313', '88314',
      // Radiology codes (unless specifically bilateral)
      '70450', '70460', '70470', '71250', '71260', '71270', '72125', '72126', '72127',
      // Laboratory codes
      '80047', '80048', '80050', '80053', '80061', '85025', '85027',
      // E&M codes
      '99201', '99202', '99203', '99204', '99205', '99211', '99212', '99213', '99214', '99215'
    ];

    const prompt = `You are a medical coding compliance expert. Analyze this operative dictation for documentation completeness and billing compliance issues.${specialtyContext}

Dictation: "${dictationText}"
${selectedCodes.length > 0 ? `Selected CPT Codes: ${selectedCodesStr}` : ''}

IMPORTANT LATERALITY GUIDANCE:
- Only flag missing laterality for codes that typically require it (orthopedic, ophthalmology, ENT, vascular procedures on paired organs/structures)
- Do NOT flag laterality issues for these types of codes: ${nonLateralCodes.join(', ')} and similar general/systemic procedures
- Focus laterality warnings on procedures involving paired anatomical structures (shoulders, knees, eyes, ears, kidneys, breasts, hands, feet, etc.)

Analyze for:
1. CRITICAL missing elements for billing (laterality for paired structures only, depth, specific anatomy)
2. Incomplete documentation that could lead to claim denials
3. Required modifiers based on the procedures described
4. Potential bundling violations (CCI edits)
5. LCD/NCD compliance issues
6. Missing elements that support higher complexity codes

For each issue found, categorize by:
- Type: missing_laterality, incomplete_depth, missing_modifier, bundling_violation, compliance_issue
- Severity: critical (will cause denial), high (likely audit), medium (optimization), low (minor)
- Specific field that needs documentation
- Clear suggestion for improvement
- Potential RVU impact if addressed

Format as JSON:
{
  "issues": [
    {
      "type": "missing_laterality",
      "severity": "critical", 
      "code": "29827",
      "field": "procedure laterality",
      "message": "Arthroscopy code requires laterality documentation",
      "suggestion": "Specify 'right shoulder' or 'left shoulder' arthroscopy",
      "rvuImpact": 0,
      "compliance": {
        "policy": "CMS Documentation Requirements",
        "reference": "LCD-12345"
      }
    }
  ],
  "completenessScore": 85,
  "missingElements": ["specific incision length", "closure method details"],
  "requiredModifiers": [
    {
      "code": "29827",
      "modifier": "RT",
      "reason": "Right side procedure requires RT modifier"
    }
  ],
  "complianceWarnings": [
    {
      "type": "bundling",
      "message": "CPT 29827 and 29826 may have CCI bundling issues",
      "severity": "high"
    }
  ]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a medical coding compliance expert specializing in documentation requirements and billing compliance. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from AI')
    }

    let analysis: DocumentationAnalysis
    try {
      analysis = JSON.parse(content)
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from AI')
      }
    }

    return new Response(
      JSON.stringify(analysis),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error analyzing documentation:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred analyzing the documentation'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})