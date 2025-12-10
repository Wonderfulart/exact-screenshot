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
    console.log("Running stale contacts check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get days threshold from request body or default to 5
    let daysThreshold = 5;
    try {
      const body = await req.json();
      if (body.days_threshold) {
        daysThreshold = parseInt(body.days_threshold);
      }
    } catch {
      // Use default if no body
    }

    const now = new Date();
    const thresholdDate = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1000);

    // Fetch accounts with stale contact dates
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("*")
      .or(`last_contact_date.is.null,last_contact_date.lt.${thresholdDate.toISOString().split("T")[0]}`)
      .order("last_contact_date", { ascending: true, nullsFirst: true });

    if (accountsError) throw accountsError;

    // Fetch active deals for these accounts
    const accountIds = (accounts || []).map(a => a.id);
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("account_id, value, stage")
      .in("account_id", accountIds)
      .not("stage", "in", "(signed,lost)");

    if (dealsError) throw dealsError;

    // Group deals by account
    const dealsByAccount: Record<string, { count: number; value: number }> = {};
    for (const deal of deals || []) {
      if (!dealsByAccount[deal.account_id]) {
        dealsByAccount[deal.account_id] = { count: 0, value: 0 };
      }
      dealsByAccount[deal.account_id].count++;
      dealsByAccount[deal.account_id].value += Number(deal.value) || 0;
    }

    const staleContacts = (accounts || []).map((account) => {
      let daysSinceContact: number | null = null;
      if (account.last_contact_date) {
        const lastContact = new Date(account.last_contact_date);
        daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
      }

      const accountDeals = dealsByAccount[account.id] || { count: 0, value: 0 };

      // Calculate priority score (higher = more urgent)
      let priorityScore = 0;
      if (daysSinceContact === null) {
        priorityScore += 50; // Never contacted is high priority
      } else {
        priorityScore += Math.min(daysSinceContact * 2, 40);
      }
      priorityScore += (account.waffling_score || 0) * 0.3;
      priorityScore += accountDeals.value > 0 ? 20 : 0;
      if (account.decision_certainty === "at_risk") priorityScore += 15;
      if (account.decision_certainty === "leaning") priorityScore += 5;

      return {
        account_id: account.id,
        company_name: account.company_name,
        contact_name: account.contact_name,
        contact_email: account.contact_email,
        contact_phone: account.contact_phone,
        city: account.city,
        last_contact_date: account.last_contact_date,
        days_since_contact: daysSinceContact,
        waffling_score: account.waffling_score,
        decision_certainty: account.decision_certainty,
        active_deals_count: accountDeals.count,
        active_deals_value: accountDeals.value,
        priority_score: Math.round(priorityScore),
      };
    }).sort((a, b) => b.priority_score - a.priority_score);

    console.log(`Found ${staleContacts.length} stale contacts`);

    return new Response(
      JSON.stringify({
        success: true,
        threshold_days: daysThreshold,
        stale_contacts_count: staleContacts.length,
        stale_contacts: staleContacts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Stale contacts error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
