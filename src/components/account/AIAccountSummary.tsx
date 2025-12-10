import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Lightbulb, AlertCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Account } from "@/hooks/useAccounts";
import type { Deal } from "@/hooks/useDeals";

interface AIAccountSummaryProps {
  account: Account;
  deals: Deal[];
}

interface AccountInsight {
  keyFact: string;
  currentSituation: string;
  suggestedAction: string;
}

export function AIAccountSummary({ account, deals }: AIAccountSummaryProps) {
  const [insight, setInsight] = useState<AccountInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const activeDeals = deals.filter(d => !["signed", "lost"].includes(d.stage));
        const totalValue = deals.reduce((sum, d) => sum + Number(d.value), 0);
        const atRiskDeals = deals.filter(d => d.is_at_risk);

        const { data, error: fnError } = await supabase.functions.invoke("account-insights", {
          body: {
            account: {
              company_name: account.company_name,
              contact_name: account.contact_name,
              decision_certainty: account.decision_certainty,
              waffling_score: account.waffling_score,
              last_contact_date: account.last_contact_date,
              business_type: account.business_type,
            },
            metrics: {
              activeDeals: activeDeals.length,
              totalValue,
              atRiskCount: atRiskDeals.length,
            },
          },
        });

        if (fnError) throw fnError;

        setInsight(data);
      } catch (err) {
        console.error("Failed to fetch account insights:", err);
        // Generate fallback insight based on account data
        const fallbackInsight = generateFallbackInsight(account, deals);
        setInsight(fallbackInsight);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsight();
  }, [account, deals]);

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insight) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI Summary</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-medium">Key fact:</span> {insight.keyFact}
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-medium">Current situation:</span> {insight.currentSituation}
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-medium text-primary">Suggested action:</span> {insight.suggestedAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function generateFallbackInsight(account: Account, deals: Deal[]): AccountInsight {
  const activeDeals = deals.filter(d => !["signed", "lost"].includes(d.stage));
  const totalValue = deals.reduce((sum, d) => sum + Number(d.value), 0);
  const atRiskDeals = deals.filter(d => d.is_at_risk);
  
  const daysSinceContact = account.last_contact_date
    ? Math.floor((Date.now() - new Date(account.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let keyFact = `${account.company_name} has ${activeDeals.length} active proposal${activeDeals.length !== 1 ? 's' : ''}`;
  if (totalValue > 0) {
    keyFact += ` worth $${totalValue.toLocaleString()}`;
  }

  let currentSituation = "";
  if (account.decision_certainty === "at_risk" || (account.waffling_score && account.waffling_score > 50)) {
    currentSituation = `This account shows signs of hesitation with a waffling score of ${account.waffling_score || 0}%.`;
  } else if (account.decision_certainty === "firm") {
    currentSituation = "This account is a strong prospect with firm buying signals.";
  } else if (daysSinceContact && daysSinceContact > 5) {
    currentSituation = `No contact in ${daysSinceContact} days. Consider reaching out.`;
  } else {
    currentSituation = `Account is in ${account.decision_certainty || 'active'} status.`;
  }

  let suggestedAction = "";
  if (atRiskDeals.length > 0) {
    suggestedAction = `Follow up on ${atRiskDeals.length} at-risk proposal${atRiskDeals.length !== 1 ? 's' : ''} immediately.`;
  } else if (daysSinceContact && daysSinceContact > 7) {
    suggestedAction = "Schedule a check-in call to maintain momentum.";
  } else if (account.decision_certainty === "waffling") {
    suggestedAction = "Send a deadline reminder or special offer to create urgency.";
  } else {
    suggestedAction = "Continue regular follow-up to close pending proposals.";
  }

  return { keyFact, currentSituation, suggestedAction };
}
