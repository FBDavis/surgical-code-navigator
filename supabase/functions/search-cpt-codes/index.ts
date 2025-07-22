import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CPTCode {
  code: string
  description: string
  rvu: number
  modifiers?: string[]
  category: string
  is_primary?: boolean
  position?: number
  whenNeeded?: string
}

interface SearchResponse {
  primaryCodes: CPTCode[]
  associatedCodes: CPTCode[]
}

serve(async (req) => {
  console.log('Search CPT codes function called, method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing search request...')
    const { procedureDescription, specialty } = await req.json()
    
    console.log('Search CPT codes request:', { procedureDescription, specialty });
    
    const openaiApiKey = Deno.env.get('OpCoder AI Key')
    if (!openaiApiKey) {
      throw new Error('OpCoder AI Key not configured')
    }

    // Single optimized prompt for both primary and associated codes
    const specialtyContext = specialty ? ` Focus specifically on ${specialty.replace('_', ' ')} procedures and commonly used codes in this specialty.` : '';
    
    const optimizedPrompt = `You are a medical coding expert. Given this surgical procedure: "${procedureDescription}"${specialtyContext}

Analyze and return BOTH primary billable CPT codes AND commonly associated codes in this EXACT JSON format:

{
  "primaryCodes": [
    {
      "code": "XXXXX",
      "description": "Brief description",
      "rvu": X.XX,
      "modifiers": ["XX", "YY"],
      "category": "surgery|anesthesia|radiology|pathology|medicine",
      "is_primary": true,
      "position": 1,
      "whenNeeded": "Brief note"
    }
  ],
  "associatedCodes": [
    {
      "code": "XXXXX", 
      "description": "Brief description",
      "rvu": X.XX,
      "modifiers": ["XX"],
      "category": "surgery|anesthesia|radiology|pathology|medicine",
      "is_primary": false,
      "position": 2,
      "whenNeeded": "Brief note"
    }
  ]
}

Primary codes: Main billable procedures (typically 1-3 codes, highest RVU)
Associated codes: Additional services like anesthesia, imaging, pathology, add-ons

Order by RVU value descending. Include realistic RVU values and relevant modifiers.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a medical coding expert specializing in CPT codes and RVU values. Always respond with valid JSON only. Be concise and accurate.'
          },
          {
            role: 'user',
            content: optimizedPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText)
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    console.log('OpenAI response received, parsing...')

    // Parse the response
    let parsedResponse
    try {
      // Clean up the response if it has markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim()
      parsedResponse = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Content:', content)
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Validate and structure the response
    const primaryCodes = parsedResponse.primaryCodes || []
    const associatedCodes = parsedResponse.associatedCodes || []

    // Sort by RVU value descending
    const sortedPrimary = primaryCodes.sort((a: any, b: any) => (b.rvu || 0) - (a.rvu || 0))
    const sortedAssociated = associatedCodes.sort((a: any, b: any) => (b.rvu || 0) - (a.rvu || 0))

    console.log(`Returning ${sortedPrimary.length} primary codes and ${sortedAssociated.length} associated codes`)

    return new Response(
      JSON.stringify({
        primaryCodes: sortedPrimary,
        associatedCodes: sortedAssociated
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in search-cpt-codes function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while searching for CPT codes',
        primaryCodes: [],
        associatedCodes: []
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