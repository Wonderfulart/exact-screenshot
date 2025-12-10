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

  // Validate cron secret for scheduled invocations
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.error("Unauthorized: Invalid or missing cron secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log("Running daily digest job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch summary data
    const { data: titles } = await supabase
      .from("titles")
      .select("*")
      .order("deadline");

    const { data: deals } = await supabase
      .from("deals")
      .select("*")
      .not("stage", "in", "(signed,lost)");

    const { data: atRiskDeals } = await supabase
      .from("deals")
      .select("*")
      .eq("is_at_risk", true)
      .not("stage", "in", "(signed,lost)");

    // Calculate metrics
    const totalGoal = (titles || []).reduce((sum, t) => sum + Number(t.revenue_goal), 0);
    const totalBooked = (titles || []).reduce((sum, t) => sum + Number(t.revenue_booked), 0);
    const pipelineValue = (deals || []).reduce((sum, d) => sum + Number(d.value), 0);
    const atRiskValue = (atRiskDeals || []).reduce((sum, d) => sum + Number(d.value), 0);

    // Get upcoming deadlines (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = (titles || []).filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      return deadline >= now && deadline <= nextWeek;
    });

    const digest = {
      generated_at: new Date().toISOString(),
      metrics: {
        total_goal: totalGoal,
        total_booked: totalBooked,
        progress_percent: totalGoal > 0 ? (totalBooked / totalGoal) * 100 : 0,
        pipeline_value: pipelineValue,
        at_risk_value: atRiskValue,
        at_risk_deals_count: (atRiskDeals || []).length,
      },
      upcoming_deadlines: upcomingDeadlines.map(t => ({
        name: t.name,
        deadline: t.deadline,
        progress: t.revenue_goal > 0 ? (t.revenue_booked / t.revenue_goal) * 100 : 0,
      })),
    };

    console.log("Daily digest generated:", JSON.stringify(digest, null, 2));

    return new Response(JSON.stringify({ success: true, digest }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Daily digest error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
