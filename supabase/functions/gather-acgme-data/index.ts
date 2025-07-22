import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OpCoder AI Key');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { specialty_id, specialty_name } = await req.json();
    
    console.log(`Gathering ACGME data for specialty: ${specialty_name}`);

    if (!openaiApiKey) {
      throw new Error('OpCoder AI Key not found');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate ACGME case requirements using AI
    const acgmePrompt = `You are a medical education expert with comprehensive knowledge of ACGME case requirements. 

Generate detailed case requirements for the surgical specialty: "${specialty_name}"

Provide a comprehensive JSON array of case requirements with the following structure:
[
  {
    "category": "Major Cases",
    "subcategory": "General",
    "min_required": 200,
    "max_allowed": null,
    "description": "Total major cases as primary surgeon",
    "cpt_codes": ["47562", "47563", "44970"],
    "confidence_level": 0.95,
    "source": "ACGME Program Requirements"
  }
]

Include all major categories for ${specialty_name}:
- Minimum case numbers for graduation
- Specific procedural categories
- CPT codes for each category
- Primary surgeon vs assistant requirements
- Any subspecialty breakdowns

Be specific and accurate. Include confidence levels (0.0-1.0) based on how certain you are about each requirement.
Focus on current ACGME requirements as of 2024.

Return ONLY the JSON array, no other text.`;

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
            content: 'You are a medical education expert specializing in ACGME requirements. Provide accurate, detailed case requirements in valid JSON format only.'
          },
          {
            role: 'user',
            content: acgmePrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('Generated content:', generatedContent);

    // Parse the JSON response
    let requirements;
    try {
      requirements = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('AI returned invalid JSON format');
    }

    // Validate and insert requirements into database
    const insertData = requirements.map((req: any) => ({
      specialty_id,
      category: req.category,
      subcategory: req.subcategory || null,
      min_required: req.min_required || 0,
      max_allowed: req.max_allowed || null,
      description: req.description || '',
      cpt_codes: req.cpt_codes || [],
      ai_generated: true,
      confidence_level: req.confidence_level || 0.8,
      source: req.source || 'AI Generated from ACGME Knowledge',
      needs_review: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Clear existing AI-generated requirements for this specialty
    const { error: deleteError } = await supabase
      .from('case_requirements')
      .delete()
      .eq('specialty_id', specialty_id)
      .eq('ai_generated', true);

    if (deleteError) {
      console.error('Error deleting old requirements:', deleteError);
    }

    // Insert new requirements
    const { data: insertedData, error: insertError } = await supabase
      .from('case_requirements')
      .insert(insertData)
      .select();

    if (insertError) {
      console.error('Error inserting requirements:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log(`Successfully generated ${insertedData.length} requirements for ${specialty_name}`);

    return new Response(JSON.stringify({
      success: true,
      requirements_generated: insertedData.length,
      data: insertedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gather-acgme-data function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});