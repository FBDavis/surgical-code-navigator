import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { 
      requirement_id, 
      feedback_type, 
      original_value, 
      suggested_value, 
      description 
    } = await req.json();

    console.log(`Submitting feedback for requirement: ${requirement_id}`);

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader || '' }
      }
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('case_requirement_feedback')
      .insert({
        requirement_id,
        user_id: user.id,
        feedback_type,
        original_value,
        suggested_value,
        description,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log(`Feedback submitted successfully: ${feedback.id}`);

    return new Response(JSON.stringify({
      success: true,
      feedback_id: feedback.id,
      message: 'Feedback submitted successfully. Thank you for helping improve ACGME data accuracy!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in submit-requirement-feedback function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});