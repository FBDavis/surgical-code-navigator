import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CPTCode {
  code: string;
  description: string;
  rvu?: number;
}

interface WallpaperRequest {
  cptCodes: CPTCode[];
  surgeonName?: string;
  theme?: 'medical' | 'surgical' | 'professional' | 'modern';
  backgroundColor?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cptCodes, surgeonName, theme = 'medical', backgroundColor }: WallpaperRequest = await req.json()
    
    if (!cptCodes || cptCodes.length === 0) {
      throw new Error('No CPT codes provided')
    }

    const openaiApiKey = Deno.env.get('OpCoder AI Key')
    if (!openaiApiKey) {
      throw new Error('OpCoder AI Key not configured')
    }

    // Create a professional wallpaper design prompt
    const wallpaperPrompt = `Create a professional medical wallpaper design with the following elements:

Theme: ${theme} medical design
Background: Clean, professional ${backgroundColor || 'gradient medical blue'} background
Content: Display these CPT codes in an organized, readable format:

${cptCodes.map((code, index) => 
  `${index + 1}. ${code.code} - ${code.description}${code.rvu ? ` (${code.rvu} RVU)` : ''}`
).join('\n')}

${surgeonName ? `\nSurgeon: Dr. ${surgeonName}` : ''}

Design requirements:
- Professional medical aesthetic
- Clean, readable typography
- Organized layout with proper spacing
- Medical color scheme (blues, whites, subtle greens)
- High-quality 16:9 wallpaper format
- Subtle medical-themed background elements (stethoscope, medical cross, etc.)
- Modern, minimalist design
- Easy to read on desktop/mobile screens

Style: Clean, professional, medical, high-resolution wallpaper`

    // Generate wallpaper using DALL-E
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: wallpaperPrompt,
        n: 1,
        size: '1792x1024', // 16:9 aspect ratio for wallpapers
        quality: 'high',
        style: 'natural'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const imageUrl = data.data[0]?.url

    if (!imageUrl) {
      throw new Error('No image generated')
    }

    // Fetch the generated image and convert to base64
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch generated image')
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))

    return new Response(
      JSON.stringify({ 
        wallpaper: `data:image/png;base64,${base64Image}`,
        metadata: {
          cptCodes: cptCodes.length,
          surgeonName,
          theme,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error generating wallpaper:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred generating the wallpaper'
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