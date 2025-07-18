import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-REFERRAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { referredEmail } = await req.json();
    if (!referredEmail) throw new Error("Referred email is required");
    logStep("Processing referral", { referredEmail });

    // Generate unique referral code
    const { data: codeData, error: codeError } = await supabaseClient.rpc('generate_referral_code');
    if (codeError) throw new Error(`Failed to generate referral code: ${codeError.message}`);
    const referralCode = codeData;
    logStep("Generated referral code", { referralCode });

    // Create referral record
    const { data: referralData, error: referralError } = await supabaseClient
      .from('referrals')
      .insert({
        referrer_user_id: user.id,
        referrer_email: user.email,
        referred_email: referredEmail,
        referral_code: referralCode,
        status: 'pending'
      })
      .select()
      .single();

    if (referralError) throw new Error(`Failed to create referral: ${referralError.message}`);
    logStep("Referral created", { referralId: referralData.id });

    // TODO: Send referral email with the referral code
    // This would integrate with an email service like Resend or SendGrid

    return new Response(JSON.stringify({
      success: true,
      referralCode,
      message: "Referral created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-referral", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});