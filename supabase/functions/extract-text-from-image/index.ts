import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Extract text function called, method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing request...')
    const { imageBase64 } = await req.json()
    console.log('Image data received, length:', imageBase64?.length || 'no data')
    
    if (!imageBase64) {
      throw new Error('No image data provided')
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OpCoder AI Key')
    if (!openaiApiKey) {
      throw new Error('OpenAI API Key not configured')
    }

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
            content: 'You are a medical text extraction expert. Extract all readable text from medical documents, surgical notes, and medical images. Focus on procedure descriptions, diagnoses, and medical terminology. Return only the extracted text without additional commentary.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all readable text from this medical document or image, focusing on surgical procedures, diagnoses, and medical information.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const extractedText = data.choices[0]?.message?.content

    if (!extractedText) {
      throw new Error('No text could be extracted from the image')
    }

    return new Response(
      JSON.stringify({ extractedText }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error extracting text:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred extracting text from the image'
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