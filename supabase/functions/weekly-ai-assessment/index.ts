import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, week_start, week_end } = await req.json()

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
      .lte('procedure_date', week_end)

    if (casesError) throw casesError

    // Calculate weekly stats
    const totalCases = cases?.length || 0
    const totalRVU = cases?.reduce((sum, case_item) => {
      return sum + (case_item.case_codes?.reduce((codeSum: number, code: any) => 
        codeSum + (parseFloat(code.rvu) || 0), 0) || 0)
    }, 0) || 0

    const avgRVUPerCase = totalCases > 0 ? totalRVU / totalCases : 0

    // Generate AI insights
    const insights = generateWeeklyInsights(cases || [], totalCases, totalRVU, avgRVUPerCase)
    
    // Generate funny awards
    const funnyAwards = generateFunnyAwards(cases || [], totalCases, totalRVU)

    // Save assessment to database
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('weekly_assessments')
      .upsert({
        user_id,
        week_start,
        week_end,
        assessment_data: {
          total_cases: totalCases,
          total_rvu: totalRVU,
          avg_rvu_per_case: avgRVUPerCase,
          case_breakdown: cases?.reduce((acc: any, case_item) => {
            case_item.case_codes?.forEach((code: any) => {
              const category = code.category || 'Other'
              acc[category] = (acc[category] || 0) + 1
            })
            return acc
          }, {})
        },
        ai_insights: insights,
        funny_awards: funnyAwards
      })
      .select()
      .single()

    if (assessmentError) throw assessmentError

    // Award any funny achievements
    await awardFunnyAchievements(supabaseClient, user_id, funnyAwards)

    return new Response(
      JSON.stringify({ success: true, assessment }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error generating weekly assessment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

function generateWeeklyInsights(cases: any[], totalCases: number, totalRVU: number, avgRVU: number): string {
  const insights = []

  if (totalCases === 0) {
    return "Take some time to rest and prepare for an amazing week ahead! Even the best surgeons need recovery time."
  }

  if (totalCases >= 10) {
    insights.push("🔥 You're absolutely crushing it this week with high case volume!")
  } else if (totalCases >= 5) {
    insights.push("⚡ Solid week with consistent surgical activity.")
  } else {
    insights.push("🎯 Quality over quantity - focused surgical precision this week.")
  }

  if (avgRVU > 15) {
    insights.push("💎 Your case complexity is impressive - handling high-value procedures like a pro.")
  } else if (avgRVU > 10) {
    insights.push("⭐ Great balance of procedure complexity and efficiency.")
  }

  if (totalRVU > 200) {
    insights.push("🚀 Outstanding RVU generation - you're in the top tier of performers!")
  }

  // Analyze case patterns
  const categoryBreakdown = cases.reduce((acc: any, case_item) => {
    case_item.case_codes?.forEach((code: any) => {
      const category = code.category || 'Other'
      acc[category] = (acc[category] || 0) + 1
    })
    return acc
  }, {})

  const primaryCategory = Object.keys(categoryBreakdown).reduce((a, b) => 
    categoryBreakdown[a] > categoryBreakdown[b] ? a : b, '')

  if (primaryCategory) {
    insights.push(`🎯 Your specialty focus this week was ${primaryCategory} procedures.`)
  }

  return insights.join(' ')
}

function generateFunnyAwards(cases: any[], totalCases: number, totalRVU: number): any[] {
  const awards = []

  // Case volume awards
  if (totalCases >= 15) {
    awards.push({
      emoji: '🤖',
      title: 'Surgical Machine',
      description: 'You handled more cases than some residents see in a month!',
      criteria_met: `${totalCases} cases completed`
    })
  } else if (totalCases === 1) {
    awards.push({
      emoji: '🎯',
      title: 'Precision Sniper',
      description: 'One case, one perfect outcome. Quality over quantity!',
      criteria_met: 'Single perfect case'
    })
  }

  // RVU awards
  if (totalRVU > 300) {
    awards.push({
      emoji: '💰',
      title: 'Money Maker',
      description: 'Your RVU game is so strong, accounting is jealous!',
      criteria_met: `${totalRVU.toFixed(1)} RVU generated`
    })
  } else if (totalRVU > 100) {
    awards.push({
      emoji: '⚡',
      title: 'Efficiency Expert',
      description: 'Solid RVU generation with surgical precision!',
      criteria_met: `${totalRVU.toFixed(1)} RVU generated`
    })
  }

  // Day of week patterns
  const dayPatterns = analyzeDayPatterns(cases)
  if (dayPatterns.mondayWarrior) {
    awards.push({
      emoji: '☕',
      title: 'Monday Warrior',
      description: 'You attack Mondays like they owe you money!',
      criteria_met: 'Heavy Monday case load'
    })
  }

  if (dayPatterns.fridayFinisher) {
    awards.push({
      emoji: '🍺',
      title: 'Friday Finisher',
      description: 'Ending the week strong - you earned that weekend!',
      criteria_met: 'Strong Friday performance'
    })
  }

  // Specialty-specific awards
  const hasComplexCases = cases.some(c => 
    c.case_codes?.some((code: any) => parseFloat(code.rvu) > 20)
  )

  if (hasComplexCases) {
    awards.push({
      emoji: '🧠',
      title: 'Complexity Crusher',
      description: 'Taking on the cases that make other surgeons nervous!',
      criteria_met: 'High-complexity procedures'
    })
  }

  // Random fun awards
  const randomAwards = [
    {
      emoji: '🦸',
      title: 'Surgical Superhero',
      description: 'Cape not included, but clearly not needed!',
      criteria_met: 'Outstanding week overall'
    },
    {
      emoji: '🎪',
      title: 'Multitasking Maestro',
      description: 'Juggling cases like a seasoned circus performer!',
      criteria_met: 'Diverse case portfolio'
    },
    {
      emoji: '🔬',
      title: 'Precision Pioneer',
      description: 'Your attention to detail is scientifically impressive!',
      criteria_met: 'Meticulous case documentation'
    }
  ]

  // Add a random award if none generated yet
  if (awards.length === 0) {
    awards.push(randomAwards[Math.floor(Math.random() * randomAwards.length)])
  }

  return awards.slice(0, 3) // Limit to 3 awards max
}

function analyzeDayPatterns(cases: any[]): any {
  const dayCount = cases.reduce((acc: any, case_item) => {
    const day = new Date(case_item.procedure_date).getDay()
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  return {
    mondayWarrior: (dayCount[1] || 0) >= 3,
    fridayFinisher: (dayCount[5] || 0) >= 2
  }
}

async function awardFunnyAchievements(supabaseClient: any, userId: string, awards: any[]) {
  for (const award of awards) {
    // Find matching achievement type
    const { data: achievementType } = await supabaseClient
      .from('achievement_types')
      .select('id')
      .eq('name', award.title)
      .eq('category', 'ai_generated')
      .single()

    if (achievementType) {
      // Check if user already has this achievement this week
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekId = weekStart.toISOString().split('T')[0]

      const { data: existing } = await supabaseClient
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_type_id', achievementType.id)
        .eq('week_earned', weekId)
        .single()

      if (!existing) {
        await supabaseClient
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_type_id: achievementType.id,
            week_earned: weekId,
            ai_generated: true,
            metadata: award
          })
      }
    }
  }
}