import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CPTCode {
  code: string;
  description: string;
  rvu: number;
  modifiers?: string[];
  category: string;
  is_primary?: boolean;
  position?: number;
}

interface SearchResponse {
  primaryCodes: CPTCode[];
  associatedCodes: CPTCode[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { procedureDescription } = await req.json()
    
    const openaiApiKey = Deno.env.get('OpCoder AI Key')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // First, get primary CPT codes
    const primaryPrompt = `You are a medical coding expert. Given this surgical procedure description: "${procedureDescription}"

Please identify the PRIMARY CPT codes that would be billable for this specific procedure. For each code, provide:
1. The CPT code number
2. A brief description
3. The current RVU value (approximate if exact not known)
4. Any relevant modifiers that would maximize billing
5. The category (Surgery, Radiology, etc.)
6. Position order (1 for primary, 2 for secondary, etc.)

Format your response as a JSON array of objects with this structure:
{
  "code": "12345",
  "description": "Brief description",
  "rvu": 10.5,
  "modifiers": ["59", "78"],
  "category": "Surgery",
  "is_primary": true,
  "position": 1
}

Order the results by billing priority and RVU value from highest to lowest.`

    const primaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a medical coding expert specializing in CPT codes and RVU values. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: primaryPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    })

    if (!primaryResponse.ok) {
      throw new Error(`OpenAI API error: ${primaryResponse.statusText}`)
    }

    const primaryData = await primaryResponse.json()
    const primaryContent = primaryData.choices[0]?.message?.content

    if (!primaryContent) {
      throw new Error('No response from OpenAI for primary codes')
    }

    // Parse primary codes
    let primaryCodes: CPTCode[]
    try {
      primaryCodes = JSON.parse(primaryContent)
    } catch (e) {
      const jsonMatch = primaryContent.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        primaryCodes = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from OpenAI for primary codes')
      }
    }

    // Get commonly associated codes
    const primaryCodesStr = primaryCodes.map(c => `${c.code} (${c.description})`).join(', ')
    
    const associatedPrompt = `You are a medical coding expert. Given these PRIMARY CPT codes: ${primaryCodesStr}

Please identify COMMONLY ASSOCIATED CPT codes that are frequently billed together with these primary procedures. These should be:
- Complementary procedures often performed at the same time
- Related diagnostic codes
- Common add-on procedures
- Commonly required ancillary services

For example:
- Trigger release (26055) often associated with flexor tenosynovectomy (26145)
- Carpal tunnel release often with nerve conduction studies
- Joint injections often with imaging guidance

For each associated code, provide:
1. The CPT code number
2. A brief description
3. The current RVU value
4. Any relevant modifiers
5. The category
6. Position order for billing

Format as JSON array with same structure as before but set is_primary to false.`

    const associatedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a medical coding expert specializing in CPT codes and commonly associated procedures. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: associatedPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    })

    let associatedCodes: CPTCode[] = []
    if (associatedResponse.ok) {
      const associatedData = await associatedResponse.json()
      const associatedContent = associatedData.choices[0]?.message?.content
      
      if (associatedContent) {
        try {
          associatedCodes = JSON.parse(associatedContent)
        } catch (e) {
          const jsonMatch = associatedContent.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            associatedCodes = JSON.parse(jsonMatch[0])
          }
        }
      }
    }

    // Ensure arrays and sort by RVU descending
    if (!Array.isArray(primaryCodes)) {
      throw new Error('Primary codes response is not an array')
    }
    if (!Array.isArray(associatedCodes)) {
      associatedCodes = []
    }

    primaryCodes.sort((a, b) => b.rvu - a.rvu)
    associatedCodes.sort((a, b) => b.rvu - a.rvu)

    const response: SearchResponse = {
      primaryCodes,
      associatedCodes
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred processing your request' 
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