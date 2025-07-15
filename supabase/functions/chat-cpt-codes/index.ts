import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CPTCode {
  code: string;
  description: string;
  rvu: number;
  modifiers?: string[];
  category: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      procedureDescription, 
      selectedCodes, 
      searchResults,
      chatHistory = []
    } = await req.json();
    
    const openaiApiKey = Deno.env.get('OpCoder AI Key');
    if (!openaiApiKey) {
      throw new Error('OpCoder AI Key not configured');
    }

    // Build context for the AI
    const systemPrompt = `You are an expert medical coding assistant specializing in CPT codes. You're helping a healthcare provider confirm and refine their CPT code selection for a specific procedure.

CONTEXT:
- Original procedure description: "${procedureDescription}"
- Currently selected codes: ${selectedCodes.map((code: CPTCode) => `${code.code} (${code.description}, ${code.rvu} RVU)`).join(', ')}
- Available search results: ${searchResults.map((code: CPTCode) => `${code.code} (${code.description}, ${code.rvu} RVU)`).join(', ')}

Your role is to:
1. Answer questions about the appropriateness of selected codes
2. Suggest additions or modifications to the code selection
3. Explain coding rationale and guidelines
4. Help optimize the billing accuracy and completeness

Keep responses concise but thorough. Focus on practical coding advice and be specific about CPT code recommendations.`;

    const messages: ChatMessage[] = [
      { role: 'user', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: assistantResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-cpt-codes function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process chat message',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});