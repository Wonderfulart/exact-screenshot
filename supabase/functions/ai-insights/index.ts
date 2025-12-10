import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch data for analysis
    const [titlesRes, accountsRes, dealsRes] = await Promise.all([
      supabase.from("titles").select("*"),
      supabase.from("accounts").select("*"),
      supabase.from("deals").select("*"),
    ]);

    const titles = titlesRes.data || [];
    const accounts = accountsRes.data || [];
    const deals = dealsRes.data || [];

    // Calculate key metrics
    const totalGoal = titles.reduce((sum, t) => sum + (t.revenue_goal || 0), 0);
    const totalBooked = titles.reduce((sum, t) => sum + (t.revenue_booked || 0), 0);
    const atRiskDeals = deals.filter((d) => d.is_at_risk && d.stage !== "signed" && d.stage !== "lost");
    const atRiskValue = atRiskDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    
    // Find accounts needing attention
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const needsAttention = accounts.filter((a) => {
      const lastContact = new Date(a.last_contact_date);
      return lastContact < fiveDaysAgo || (a.waffling_score || 0) > 50;
    });

    // Find urgent deadlines
    const urgentTitles = titles.filter((t) => {
      const deadline = new Date(t.deadline);
      const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 60;
    });

    const dataContext = `
Current Sales Data:
- Total Revenue Goal: $${totalGoal.toLocaleString()}
- Total Booked: $${totalBooked.toLocaleString()} (${Math.round((totalBooked / totalGoal) * 100)}%)
- Gap to Goal: $${(totalGoal - totalBooked).toLocaleString()}
- At-Risk Revenue: $${atRiskValue.toLocaleString()} (${atRiskDeals.length} deals)
- Accounts Needing Attention: ${needsAttention.length}

Urgent Deadlines:
${urgentTitles.map((t) => {
  const daysUntil = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const gap = t.revenue_goal - t.revenue_booked;
  return `- ${t.name}: ${daysUntil} days, $${gap.toLocaleString()} gap`;
}).join("\n")}

At-Risk Deals:
${atRiskDeals.slice(0, 5).map((d) => {
  const account = accounts.find((a) => a.id === d.account_id);
  const title = titles.find((t) => t.id === d.title_id);
  return `- ${account?.company_name}: $${d.value} (${d.stage.replace("_", " ")}) for ${title?.name?.split(" ").slice(0, 2).join(" ")}`;
}).join("\n")}
`;

    console.log("Generating AI insights...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are Hand AI, an intelligent sales assistant for tourism magazine advertising. 
Analyze the sales data and provide 3 concise, actionable priorities for today.
Be specific - mention company names, dollar amounts, and deadlines.
Format each priority with a type (danger/warning/success) based on urgency.
Keep each priority under 15 words.`,
          },
          {
            role: "user",
            content: `${dataContext}

Generate 3 priorities in this exact JSON format:
[
  {"label": "priority text", "type": "danger|warning|success"},
  {"label": "priority text", "type": "danger|warning|success"},
  {"label": "priority text", "type": "danger|warning|success"}
]`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let priorities = [];
    
    if (jsonMatch) {
      try {
        priorities = JSON.parse(jsonMatch[0]);
      } catch {
        console.error("Failed to parse priorities JSON");
        priorities = [
          { label: "Review at-risk deals and schedule follow-ups", type: "danger" },
          { label: "Check accounts with no recent contact", type: "warning" },
          { label: "Follow up on pending contracts", type: "success" },
        ];
      }
    }

    console.log("AI insights generated:", priorities.length, "priorities");

    return new Response(
      JSON.stringify({ 
        priorities,
        greeting: getGreeting(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating insights:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        priorities: [
          { label: "Review your at-risk deals today", type: "danger" },
          { label: "Check accounts needing attention", type: "warning" },
          { label: "Follow up on pending contracts", type: "success" },
        ],
        greeting: getGreeting(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning! Here's your sales snapshot.";
  if (hour < 17) return "Good afternoon! Here's your sales update.";
  return "Good evening! Here's where things stand.";
}
