import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`${step}${details ? `: ${JSON.stringify(details, null, 2)}` : ''}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OpCoder AI Key');
    if (!openAIApiKey) {
      throw new Error('OpCoder AI Key not found');
    }

    const { user_id, week_start, week_end } = await req.json();
    logStep('Starting weekly AI assessment', { user_id, week_start, week_end });

    // Get user's cases for the week
    const { data: cases, error: casesError } = await supabaseClient
      .from('cases')
      .select(`
        *,
        case_codes (
          cpt_code,
          description,
          rvu,
          category,
          modifiers
        )
      `)
      .eq('user_id', user_id)
      .gte('procedure_date', week_start)
      .lte('procedure_date', week_end);

    if (casesError) {
      logStep('Error fetching cases', casesError);
      throw casesError;
    }

    logStep('Fetched cases', { count: cases?.length || 0 });

    // Get user profile for context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // Calculate weekly stats
    const totalCases = cases?.length || 0;
    const totalRVU = cases?.reduce((sum, case_item) => {
      return sum + (case_item.case_codes?.reduce((codeSum: number, code: any) => 
        codeSum + (parseFloat(code.rvu) || 0), 0) || 0);
    }, 0) || 0;

    // Analyze CPT codes and procedures
    const cptCodeCounts: Record<string, number> = {};
    const specialtyBreakdown: Record<string, number> = {};
    
    cases?.forEach(case_item => {
      case_item.case_codes?.forEach((code: any) => {
        cptCodeCounts[code.cpt_code] = (cptCodeCounts[code.cpt_code] || 0) + 1;
        const category = code.category || 'Other';
        specialtyBreakdown[category] = (specialtyBreakdown[category] || 0) + 1;
      });
    });

    const assessmentData = {
      total_cases: totalCases,
      total_rvu: totalRVU,
      cpt_code_counts: cptCodeCounts,
      specialty_breakdown: specialtyBreakdown,
      most_common_procedure: Object.entries(cptCodeCounts).sort(([,a], [,b]) => b - a)[0],
      cases_summary: cases?.map(c => ({
        name: c.case_name,
        date: c.procedure_date,
        codes: c.case_codes?.map((code: any) => code.cpt_code)
      }))
    };

    logStep('Assessment data calculated', assessmentData);

    // Generate AI insights and funny awards
    const prompt = `
You are a witty AI assistant for surgeons who analyzes their weekly performance and creates funny, motivational awards. 
Analyze this surgeon's week and generate:

1. A brief, encouraging insight about their performance
2. 3-5 funny, specific awards based on their actual cases and procedures

Week Summary:
- Total Cases: ${totalCases}
- Total RVU: ${totalRVU.toFixed(2)}
- Most Common Procedure: ${assessmentData.most_common_procedure?.[0] || 'None'} (${assessmentData.most_common_procedure?.[1] || 0} times)
- Specialty Breakdown: ${JSON.stringify(specialtyBreakdown)}
- CPT Code Counts: ${JSON.stringify(cptCodeCounts)}

User Profile: ${profile?.display_name || 'Unknown'}, ${profile?.user_role || 'Surgeon'}

Create funny awards that are:
- Specific to their actual procedures and numbers
- Encouraging and positive
- Clever/witty but professional
- Include emojis
- Reference specific CPT codes or case types when relevant

Examples of funny award styles:
- "Gallbladder Gobbler 🪣" for multiple cholecystectomies
- "Knee Whisperer 🦴" for lots of knee procedures
- "RVU Rocket 🚀" for high RVU generation
- "Speed Demon ⚡" for high case volume
- "Night Owl 🦉" for late cases

Return your response as JSON with:
{
  "insights": "brief encouraging paragraph about their week",
  "funny_awards": [
    {
      "title": "Award Title",
      "description": "Funny description of why they earned it",
      "emoji": "🏆",
      "criteria_met": "specific numbers or achievements"
    }
  ]
}
`;

    logStep('Calling OpenAI for AI assessment');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a witty AI assistant that creates funny, encouraging awards for surgeons based on their case performance.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    const aiContent = openAIData.choices[0].message.content;
    
    logStep('OpenAI response received', { content: aiContent });

    let aiResult;
    try {
      aiResult = JSON.parse(aiContent);
    } catch (e) {
      // Fallback if AI doesn't return proper JSON
      aiResult = {
        insights: "Great work this week! Keep up the excellent surgical skills.",
        funny_awards: [{
          title: "Surgical Superstar",
          description: `Completed ${totalCases} cases with ${totalRVU.toFixed(0)} RVUs`,
          emoji: "⭐",
          criteria_met: `${totalCases} cases, ${totalRVU.toFixed(0)} RVUs`
        }]
      };
    }

    // Store the assessment
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('weekly_assessments')
      .upsert({
        user_id,
        week_start,
        week_end,
        assessment_data: assessmentData,
        ai_insights: aiResult.insights,
        funny_awards: aiResult.funny_awards
      }, {
        onConflict: 'user_id,week_start'
      })
      .select()
      .single();

    if (assessmentError) {
      logStep('Error storing assessment', assessmentError);
      throw assessmentError;
    }

    // Create achievement records for funny awards
    for (const award of aiResult.funny_awards) {
      // Check if achievement type exists, create if not
      const { data: existingType } = await supabaseClient
        .from('achievement_types')
        .select('id')
        .eq('name', award.title)
        .single();

      let achievementTypeId;
      if (!existingType) {
        const { data: newType, error: typeError } = await supabaseClient
          .from('achievement_types')
          .insert({
            name: award.title,
            description: award.description,
            icon: award.emoji,
            category: 'ai_generated',
            rarity: 'common',
            criteria: { ai_generated: true }
          })
          .select('id')
          .single();

        if (typeError) {
          logStep('Error creating achievement type', typeError);
          continue;
        }
        achievementTypeId = newType.id;
      } else {
        achievementTypeId = existingType.id;
      }

      // Award the achievement
      const weekFormat = new Date(week_start).toISOString().slice(0, 4) + '-W' + 
        String(Math.ceil((new Date(week_start).getTime() - new Date(new Date(week_start).getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))).padStart(2, '0');

      await supabaseClient
        .from('user_achievements')
        .upsert({
          user_id,
          achievement_type_id: achievementTypeId,
          week_earned: weekFormat,
          ai_generated: true,
          metadata: {
            criteria_met: award.criteria_met,
            assessment_id: assessment.id
          }
        }, {
          onConflict: 'user_id,achievement_type_id,week_earned'
        });
    }

    logStep('Assessment completed successfully');

    return new Response(JSON.stringify({
      success: true,
      assessment: assessment,
      ai_insights: aiResult.insights,
      funny_awards: aiResult.funny_awards
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logStep('Error in weekly AI assessment', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate weekly assessment',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});