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
    console.log("Running waffling score recalculation...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all accounts with their deals and emails
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("*");

    if (accountsError) throw accountsError;

    const { data: allDeals } = await supabase.from("deals").select("*");
    const { data: allEmails } = await supabase.from("emails_sent").select("*");

    const now = new Date();
    const updates: { id: string; old_score: number; new_score: number }[] = [];

    for (const account of accounts || []) {
      let wafflingScore = 0;

      // Factor 1: Days since last contact (0-30 points)
      if (account.last_contact_date) {
        const lastContact = new Date(account.last_contact_date);
        const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        wafflingScore += Math.min(daysSinceContact * 2, 30);
      } else {
        wafflingScore += 30; // No contact date = max points
      }

      // Factor 2: Decision certainty (0-25 points)
      const certaintyScores: Record<string, number> = {
        firm: 0,
        leaning: 10,
        waffling: 20,
        at_risk: 25,
      };
      wafflingScore += certaintyScores[account.decision_certainty || "leaning"] || 10;

      // Factor 3: Deal activity (0-25 points)
      const accountDeals = (allDeals || []).filter(d => d.account_id === account.id);
      const activeDeals = accountDeals.filter(d => !["signed", "lost"].includes(d.stage));
      
      if (activeDeals.length === 0) {
        wafflingScore += 25; // No active deals
      } else {
        // Check for stalled deals
        const stalledDeals = activeDeals.filter(d => {
          if (!d.last_activity_date) return true;
          const lastActivity = new Date(d.last_activity_date);
          const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          return daysSince > 7;
        });
        wafflingScore += Math.min(stalledDeals.length * 10, 25);
      }

      // Factor 4: Email engagement (0-20 points)
      const accountEmails = (allEmails || []).filter(e => e.account_id === account.id);
      const recentEmails = accountEmails.filter(e => {
        const sentAt = new Date(e.created_at);
        const daysSince = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 30;
      });
      
      if (recentEmails.length === 0) {
        wafflingScore += 20;
      } else {
        const repliedEmails = recentEmails.filter(e => e.status === "replied");
        const replyRate = repliedEmails.length / recentEmails.length;
        wafflingScore += Math.round((1 - replyRate) * 20);
      }

      // Cap at 100
      wafflingScore = Math.min(wafflingScore, 100);

      // Only update if changed significantly (±5 points)
      const oldScore = account.waffling_score || 0;
      if (Math.abs(wafflingScore - oldScore) >= 5) {
        updates.push({ id: account.id, old_score: oldScore, new_score: wafflingScore });
      }
    }

    // Apply updates
    let updatedCount = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from("accounts")
        .update({ waffling_score: update.new_score })
        .eq("id", update.id);

      if (!error) {
        updatedCount++;
        console.log(`Account ${update.id}: waffling ${update.old_score} -> ${update.new_score}`);
      }
    }

    console.log(`Waffling recalculation complete. Updated ${updatedCount} accounts.`);

    return new Response(
      JSON.stringify({
        success: true,
        accounts_checked: (accounts || []).length,
        accounts_updated: updatedCount,
        updates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Waffling recalculation error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
