import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DictationSuggestions {
  originalText: string;
  suggestedEdits: {
    section: string;
    original: string;
    suggested: string;
    reason: string;
    rvuImpact: number;
  }[];
  improvedDictation: string;
  additionalCodes: {
    code: string;
    description: string;
    rvu: number;
    justification: string;
  }[];
  totalRvuIncrease: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dictationText } = await req.json()
    
    if (!dictationText) {
      throw new Error('No dictation text provided')
    }

    const openaiApiKey = Deno.env.get('OpCoder AI Key')
    if (!openaiApiKey) {
      throw new Error('OpCoder AI Key not configured')
    }

    const prompt = `You are a medical coding optimization expert. Analyze this surgical dictation and provide specific suggestions to maximize billing accuracy and RVU capture.

Original Dictation: "${dictationText}"

Please provide:
1. Specific edits to improve billing documentation
2. Additional procedures that could be documented
3. More specific terminology that supports higher RVU codes
4. Missing details that could justify additional CPT codes

Format your response as JSON with this structure:
{
  "originalText": "original text",
  "suggestedEdits": [
    {
      "section": "procedure description section name",
      "original": "original text excerpt",
      "suggested": "improved text",
      "reason": "why this improves billing",
      "rvuImpact": 2.5
    }
  ],
  "improvedDictation": "complete improved dictation text",
  "additionalCodes": [
    {
      "code": "12345",
      "description": "procedure description",
      "rvu": 5.0,
      "justification": "why this code applies"
    }
  ],
  "totalRvuIncrease": 15.5
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
            content: 'You are a medical coding optimization expert specializing in surgical dictation improvement for maximum billing accuracy. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.2,
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

    // Parse the JSON response
    let suggestions: DictationSuggestions
    try {
      suggestions = JSON.parse(content)
    } catch (e) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from AI')
      }
    }

    return new Response(
      JSON.stringify(suggestions),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error analyzing dictation:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred analyzing the dictation'
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