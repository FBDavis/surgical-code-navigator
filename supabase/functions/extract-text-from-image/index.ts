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
    const { imageBase64 } = await req.json()
    
    if (!imageBase64) {
      throw new Error('No image data provided')
    }

    const openaiApiKey = Deno.env.get('OpCoder AI Key')
    if (!openaiApiKey) {
      throw new Error('OpCoder AI Key not configured')
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
            content: 'You are an OCR (Optical Character Recognition) system. Extract ONLY the exact text that is visible in the image. Do not interpret, summarize, or add any medical context. Return word-for-word what you see written, including abbreviations, numbers, dates, and formatting as they appear. If text is unclear, mark it as [unclear] but otherwise output only the literal text visible.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the exact text visible in this image. Return only what is literally written - do not interpret, expand, or add medical context.'
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