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
    console.log("Running at-risk detection job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active deals with account info
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("*, accounts(*)")
      .not("stage", "in", "(signed,lost)");

    if (dealsError) throw dealsError;

    const now = new Date();
    const updates: { id: string; is_at_risk: boolean; reason: string }[] = [];

    for (const deal of deals || []) {
      let isAtRisk = false;
      const reasons: string[] = [];

      // Rule 1: No activity in 10+ days
      if (deal.last_activity_date) {
        const lastActivity = new Date(deal.last_activity_date);
        const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceActivity > 10) {
          isAtRisk = true;
          reasons.push(`No activity for ${daysSinceActivity} days`);
        }
      }

      // Rule 2: Account has high waffling score (>60)
      if (deal.accounts && deal.accounts.waffling_score > 60) {
        isAtRisk = true;
        reasons.push(`High waffling score: ${deal.accounts.waffling_score}%`);
      }

      // Rule 3: Account decision certainty is "at_risk"
      if (deal.accounts && deal.accounts.decision_certainty === "at_risk") {
        isAtRisk = true;
        reasons.push("Account marked as at risk");
      }

      // Rule 4: Low probability (<30%) and not yet pitched
      if ((deal.probability || 0) < 30 && deal.stage === "prospect") {
        isAtRisk = true;
        reasons.push("Low probability prospect");
      }

      // Only update if status changed
      if (deal.is_at_risk !== isAtRisk) {
        updates.push({
          id: deal.id,
          is_at_risk: isAtRisk,
          reason: reasons.join("; "),
        });
      }
    }

    // Apply updates
    let updatedCount = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from("deals")
        .update({ is_at_risk: update.is_at_risk })
        .eq("id", update.id);

      if (!error) {
        updatedCount++;
        console.log(`Deal ${update.id}: is_at_risk=${update.is_at_risk} (${update.reason})`);
      }
    }

    console.log(`At-risk detection complete. Updated ${updatedCount} deals.`);

    return new Response(
      JSON.stringify({
        success: true,
        deals_checked: (deals || []).length,
        deals_updated: updatedCount,
        updates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("At-risk detection error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
