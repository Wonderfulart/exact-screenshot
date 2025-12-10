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
    console.log("Running all automations...");
    const startTime = Date.now();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Record<string, { accounts_updated?: number; deals_updated?: number; alerts_count?: number; stale_contacts_count?: number } | null> = {};
    const errors: string[] = [];

    // 1. Recalculate waffling scores
    console.log("Step 1: Recalculating waffling scores...");
    try {
      const { data: wafflingResult, error: wafflingError } = await supabase.functions.invoke(
        "recalculate-waffling",
        { body: {} }
      );
      if (wafflingError) throw wafflingError;
      results.waffling = wafflingResult;
      console.log("Waffling scores recalculated:", wafflingResult);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      errors.push(`recalculate-waffling: ${msg}`);
      console.error("Waffling error:", e);
    }

    // 2. Detect at-risk deals
    console.log("Step 2: Detecting at-risk proposals...");
    try {
      const { data: atRiskResult, error: atRiskError } = await supabase.functions.invoke(
        "detect-at-risk",
        { body: {} }
      );
      if (atRiskError) throw atRiskError;
      results.at_risk = atRiskResult;
      console.log("At-risk detection complete:", atRiskResult);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      errors.push(`detect-at-risk: ${msg}`);
      console.error("At-risk error:", e);
    }

    // 3. Check deadline alerts
    console.log("Step 3: Checking deadline alerts...");
    try {
      const { data: deadlineResult, error: deadlineError } = await supabase.functions.invoke(
        "deadline-alerts",
        { body: { days_threshold: 7 } }
      );
      if (deadlineError) throw deadlineError;
      results.deadlines = deadlineResult;
      console.log("Deadline alerts:", deadlineResult);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      errors.push(`deadline-alerts: ${msg}`);
      console.error("Deadline error:", e);
    }

    // 4. Check stale contacts
    console.log("Step 4: Checking stale contacts...");
    try {
      const { data: staleResult, error: staleError } = await supabase.functions.invoke(
        "stale-contacts",
        { body: { days_threshold: 5 } }
      );
      if (staleError) throw staleError;
      results.stale_contacts = staleResult;
      console.log("Stale contacts:", staleResult);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      errors.push(`stale-contacts: ${msg}`);
      console.error("Stale contacts error:", e);
    }

    // 5. Generate daily digest
    console.log("Step 5: Generating daily digest...");
    try {
      const { data: digestResult, error: digestError } = await supabase.functions.invoke(
        "daily-digest",
        { body: {} }
      );
      if (digestError) throw digestError;
      results.digest = digestResult;
      console.log("Daily digest:", digestResult);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      errors.push(`daily-digest: ${msg}`);
      console.error("Digest error:", e);
    }

    const duration = Date.now() - startTime;
    console.log(`All automations complete in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        duration_ms: duration,
        ran_at: new Date().toISOString(),
        results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          waffling_updated: results.waffling?.accounts_updated || 0,
          at_risk_detected: results.at_risk?.deals_updated || 0,
          deadline_alerts: results.deadlines?.alerts_count || 0,
          stale_contacts: results.stale_contacts?.stale_contacts_count || 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Run all automations error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
