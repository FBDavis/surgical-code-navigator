import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CPTCode {
  code: string;
  description: string;
  rvu: number;
  modifiers?: string[];
  category: string;
  is_primary?: boolean;
  position?: number;
}

interface CreateCaseRequest {
  caseName: string;
  procedureDescription: string;
  procedureDate?: string;
  patientMrn?: string;
  notes?: string;
  codes: CPTCode[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { authorization: authHeader },
      },
    })

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    const {
      caseName,
      procedureDescription,
      procedureDate,
      patientMrn,
      notes,
      codes
    }: CreateCaseRequest = await req.json()

    if (!caseName || !codes || codes.length === 0) {
      throw new Error('Case name and codes are required')
    }

    // Calculate total RVU and estimated value
    const totalRvu = codes.reduce((sum, code) => sum + code.rvu, 0)
    
    // Get user's default RVU rate
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_rvu_rate')
      .eq('user_id', user.id)
      .single()

    const rvuRate = profile?.default_rvu_rate || 65.00
    const estimatedValue = totalRvu * rvuRate

    // Create the case
    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert({
        user_id: user.id,
        case_name: caseName,
        procedure_description: procedureDescription,
        procedure_date: procedureDate || null,
        patient_mrn: patientMrn || null,
        notes: notes || null,
        total_rvu: totalRvu,
        estimated_value: estimatedValue,
        status: 'active'
      })
      .select()
      .single()

    if (caseError || !newCase) {
      throw new Error(`Failed to create case: ${caseError?.message}`)
    }

    // Add the CPT codes to the case
    const caseCodesData = codes.map((code, index) => ({
      case_id: newCase.id,
      user_id: user.id,
      cpt_code: code.code,
      description: code.description,
      rvu: code.rvu,
      modifiers: code.modifiers || [],
      category: code.category,
      is_primary: code.is_primary || index === 0,
      position: code.position || index + 1
    }))

    const { error: codesError } = await supabase
      .from('case_codes')
      .insert(caseCodesData)

    if (codesError) {
      // If codes insertion fails, try to clean up the case
      await supabase.from('cases').delete().eq('id', newCase.id)
      throw new Error(`Failed to add codes to case: ${codesError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        case: newCase,
        message: `Case "${caseName}" created successfully with ${codes.length} codes`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error creating case:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred creating the case'
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