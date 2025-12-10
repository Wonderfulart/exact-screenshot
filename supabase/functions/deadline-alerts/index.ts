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
    console.log("Running deadline alerts check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get days threshold from request body or default to 7
    let daysThreshold = 7;
    try {
      const body = await req.json();
      if (body.days_threshold) {
        daysThreshold = parseInt(body.days_threshold);
      }
    } catch {
      // Use default if no body
    }

    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    // Fetch titles with upcoming deadlines
    const { data: titles, error: titlesError } = await supabase
      .from("titles")
      .select("*")
      .not("deadline", "is", null)
      .gte("deadline", now.toISOString().split("T")[0])
      .lte("deadline", thresholdDate.toISOString().split("T")[0])
      .order("deadline", { ascending: true });

    if (titlesError) throw titlesError;

    const alerts = (titles || []).map((title) => {
      const deadline = new Date(title.deadline);
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const revenueGap = (title.revenue_goal || 0) - (title.revenue_booked || 0);
      const pagesGap = (title.pages_goal || 0) - (title.pages_sold || 0);

      let urgency: "critical" | "high" | "medium" | "low";
      if (daysRemaining <= 2) {
        urgency = "critical";
      } else if (daysRemaining <= 4) {
        urgency = "high";
      } else if (daysRemaining <= 7) {
        urgency = "medium";
      } else {
        urgency = "low";
      }

      return {
        title_id: title.id,
        title_name: title.name,
        region: title.region,
        deadline: title.deadline,
        days_remaining: daysRemaining,
        urgency,
        revenue_goal: title.revenue_goal,
        revenue_booked: title.revenue_booked,
        revenue_gap: revenueGap,
        pages_goal: title.pages_goal,
        pages_sold: title.pages_sold,
        pages_gap: pagesGap,
        percent_to_goal: title.revenue_goal > 0 
          ? Math.round((title.revenue_booked / title.revenue_goal) * 100) 
          : 0,
      };
    });

    console.log(`Found ${alerts.length} publications with upcoming deadlines`);

    return new Response(
      JSON.stringify({
        success: true,
        threshold_days: daysThreshold,
        alerts_count: alerts.length,
        alerts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Deadline alerts error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
