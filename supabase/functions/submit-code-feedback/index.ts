import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { addOnCode, primaryCodes, feedback, justification, rvu } = await req.json()
    
    // For now, just log the feedback for learning
    // In production, this would store feedback in a database for ML training
    console.log('Code Feedback Received:', {
      addOnCode,
      primaryCodes,
      feedback, // 'up' or 'down'
      justification,
      rvu,
      timestamp: new Date().toISOString()
    })

    // Here you would typically:
    // 1. Store feedback in a database
    // 2. Update ML model training data
    // 3. Adjust recommendation algorithms based on feedback patterns

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Feedback received and will improve future recommendations'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error processing feedback:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred processing the feedback'
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