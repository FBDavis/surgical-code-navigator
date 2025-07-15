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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { procedureDescription } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `You are a medical coding expert. Given this surgical procedure description: "${procedureDescription}"

Please identify all relevant CPT codes that would be billable for this procedure. For each code, provide:
1. The CPT code number
2. A brief description
3. The current RVU value (approximate if exact not known)
4. Any relevant modifiers that would maximize billing
5. The category (Surgery, Radiology, etc.)

Format your response as a JSON array of objects with this structure:
{
  "code": "12345",
  "description": "Brief description",
  "rvu": 10.5,
  "modifiers": ["59", "78"],
  "category": "Surgery"
}

Order the results by RVU value from highest to lowest. Include primary procedure codes and any applicable add-on codes.`

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
            content: 'You are a medical coding expert specializing in CPT codes and RVU values. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Try to parse the JSON response
    let cptCodes: CPTCode[]
    try {
      cptCodes = JSON.parse(content)
    } catch (e) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        cptCodes = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from OpenAI')
      }
    }

    // Ensure it's an array
    if (!Array.isArray(cptCodes)) {
      throw new Error('Response is not an array')
    }

    // Sort by RVU descending
    cptCodes.sort((a, b) => b.rvu - a.rvu)

    return new Response(
      JSON.stringify({ codes: cptCodes }),
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