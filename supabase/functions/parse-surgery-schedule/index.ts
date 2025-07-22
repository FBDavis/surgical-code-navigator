import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { extractedText } = await req.json()
    
    if (!extractedText) {
      throw new Error('No extracted text provided')
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a medical coding expert specializing in surgical procedures. Parse the given surgery schedule text and extract:

1. Patient cases with their procedures
2. Associated CPT codes (Current Procedural Terminology codes)
3. Estimated RVU values if mentioned
4. Surgeon names if mentioned
5. Procedure dates/times if mentioned

Return the results in this exact JSON format:
{
  "cases": [
    {
      "patientIdentifier": "Patient initials or MRN (if available)",
      "procedure": "Description of the surgical procedure",
      "cptCodes": [
        {
          "code": "12345",
          "description": "Procedure description",
          "rvu": 15.2 (if available, otherwise null)
        }
      ],
      "surgeon": "Dr. Name (if mentioned)",
      "date": "YYYY-MM-DD (if mentioned, otherwise null)",
      "time": "HH:MM (if mentioned, otherwise null)"
    }
  ],
  "summary": {
    "totalCases": 3,
    "uniqueCPTCodes": ["12345", "67890"],
    "totalRVU": 45.6 (if calculable, otherwise null)
  }
}

Important:
- Only extract real CPT codes (5-digit codes)
- Don't invent or guess codes that aren't clearly stated
- Be conservative - only include information that is clearly visible in the text
- If no CPT codes are found, return empty arrays but still parse other information`
          },
          {
            role: 'user',
            content: `Please parse this surgery schedule text and extract the cases, procedures, and CPT codes:\n\n${extractedText}`
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
    const parsedContent = data.choices[0]?.message?.content

    if (!parsedContent) {
      throw new Error('No content returned from AI parsing')
    }

    let parsedData;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = parsedContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parsedContent);
      throw new Error('AI returned invalid JSON format');
    }

    return new Response(
      JSON.stringify(parsedData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error parsing surgery schedule:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred parsing the surgery schedule'
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