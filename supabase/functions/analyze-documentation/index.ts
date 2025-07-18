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

    const openaiApiKey = Deno.env.get('OpCoder AI Key')
    if (!openaiApiKey) {
      throw new Error('OpCoder AI Key not configured')
    }

    const selectedCodesStr = selectedCodes.map((c: any) => `${c.code} (${c.description})`).join(', ')
    const specialtyContext = specialty ? ` This is for ${specialty.replace('_', ' ')} specialty.` : ''

    const prompt = `You are a medical coding compliance expert. Analyze this operative dictation for documentation completeness and billing compliance issues.${specialtyContext}

Dictation: "${dictationText}"
${selectedCodes.length > 0 ? `Selected CPT Codes: ${selectedCodesStr}` : ''}

Analyze for:
1. CRITICAL missing elements for billing (laterality, depth, specific anatomy)
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