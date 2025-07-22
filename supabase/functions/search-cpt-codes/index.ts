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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { procedureDescription, specialty } = await req.json()
    
    console.log('Search CPT codes request:', { procedureDescription, specialty });
    
    const openaiApiKey = Deno.env.get('OpCoder AI Key')
    if (!openaiApiKey) {
      throw new Error('OpCoder AI Key not configured')
    }

    // First, get primary CPT codes
    const specialtyContext = specialty ? ` Focus specifically on ${specialty.replace('_', ' ')} procedures and commonly used codes in this specialty.` : '';
    
    const primaryPrompt = `You are a medical coding expert specializing in ${specialty ? specialty.replace('_', ' ') : 'general medicine'}. Given this surgical procedure description: "${procedureDescription}"${specialtyContext}

Please identify the PRIMARY CPT codes that would be billable for this specific procedure. 

Return your response in this exact JSON format:
[
  {
    "code": "XXXXX",
    "description": "Brief but clear description of the procedure",
    "rvu": X.XX,
    "modifiers": ["XX", "YY"],
    "category": "surgery|anesthesia|radiology|pathology|medicine",
    "is_primary": true,
    "position": 1,
    "whenNeeded": "Brief note about when this code applies"
  }
]

Guidelines:
- Include only PRIMARY procedures that are separately billable
- Provide realistic RVU values (typical range 1-50 for most procedures)
- Include appropriate modifiers if commonly used
- Focus on the main procedure described
- Limit to 3-5 most relevant codes
- Use proper CPT code format (5 digits)

Order the results by billing priority and RVU value from highest to lowest.`

    const primaryResponse = await Promise.race([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Primary request timeout')), 25000)
      )
    ])

    if (!primaryResponse.ok) {
      console.error('Primary OpenAI API error:', primaryResponse.statusText)
      throw new Error(`Primary OpenAI API error: ${primaryResponse.statusText}`)
    }

    const primaryData = await primaryResponse.json()
    const primaryContent = primaryData.choices[0]?.message?.content

    if (!primaryContent) {
      throw new Error('No primary response from OpenAI')
    }

    console.log('Primary response received, getting associated codes...')

    // Now get associated codes
    const associatedPrompt = `You are a medical coding expert. For this procedure: "${procedureDescription}"${specialtyContext}

Please identify ASSOCIATED/ADDITIONAL CPT codes that commonly go with this procedure. These are NOT the main procedure codes, but supporting services like:
- Anesthesia codes
- Imaging/radiology 
- Pathology/lab work
- Add-on codes
- Assistant surgeon codes
- Modifier-based variations

Return your response in this exact JSON format:
[
  {
    "code": "XXXXX",
    "description": "Brief description of the associated service",
    "rvu": X.XX,
    "modifiers": ["XX"],
    "category": "anesthesia|radiology|pathology|medicine|surgery",
    "is_primary": false,
    "position": 2,
    "whenNeeded": "Brief note about when this associated code applies"
  }
]

Guidelines:
- Focus on commonly billed ASSOCIATED services, not primary procedures
- Include anesthesia codes if applicable
- Include imaging codes if typically ordered
- Include pathology codes if specimens are typically sent
- Provide realistic RVU values
- Limit to 5-8 most relevant associated codes
- Use proper CPT code format (5 digits)
- Mark all as "is_primary": false
- Start position numbering after primary codes

Example categories:
- Anesthesia: 00XXX codes
- Radiology: 7XXXX codes  
- Pathology: 8XXXX codes
- Add-on codes: Often have "+XXXXX" format but use 5 digits
- Medicine: 9XXXX codes

Don't repeat the main procedure - only supporting/associated services.

IMPORTANT: If no associated codes commonly apply to this procedure type, return an empty array: []

Return only valid, realistic associated codes that would commonly be billed alongside this procedure type.`

    const associatedResponse = await Promise.race([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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
          max_tokens: 1500,
          temperature: 0.1,
        }),
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Associated request timeout')), 20000)
      )
    ])

    if (!associatedResponse.ok) {
      console.error('Associated OpenAI API error:', associatedResponse.statusText)
      throw new Error(`Associated OpenAI API error: ${associatedResponse.statusText}`)
    }

    const associatedData = await associatedResponse.json()
    const associatedContent = associatedData.choices[0]?.message?.content

    console.log('Both responses received, parsing...')

    // Parse both responses
    let primaryCodes = []
    let associatedCodes = []

    try {
      // Parse primary codes
      const cleanPrimaryContent = primaryContent.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim()
      primaryCodes = JSON.parse(cleanPrimaryContent)
      
      // Parse associated codes
      if (associatedContent) {
        const cleanAssociatedContent = associatedContent.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim()
        associatedCodes = JSON.parse(cleanAssociatedContent)
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Primary content:', primaryContent)
      console.error('Associated content:', associatedContent)
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Ensure arrays
    if (!Array.isArray(primaryCodes)) {
      primaryCodes = []
    }
    if (!Array.isArray(associatedCodes)) {
      associatedCodes = []
    }

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