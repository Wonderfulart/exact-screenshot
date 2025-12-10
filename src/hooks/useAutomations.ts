import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AutomationResult {
  success: boolean;
  duration_ms?: number;
  ran_at?: string;
  [key: string]: unknown;
}

export interface AutomationState {
  isRunning: boolean;
  lastResult: AutomationResult | null;
  lastError: string | null;
  lastRanAt: string | null;
}

export function useAutomations() {
  const [states, setStates] = useState<Record<string, AutomationState>>({
    "run-all": { isRunning: false, lastResult: null, lastError: null, lastRanAt: null },
    "recalculate-waffling": { isRunning: false, lastResult: null, lastError: null, lastRanAt: null },
    "detect-at-risk": { isRunning: false, lastResult: null, lastError: null, lastRanAt: null },
    "deadline-alerts": { isRunning: false, lastResult: null, lastError: null, lastRanAt: null },
    "stale-contacts": { isRunning: false, lastResult: null, lastError: null, lastRanAt: null },
    "daily-digest": { isRunning: false, lastResult: null, lastError: null, lastRanAt: null },
  });

  const runAutomation = async (functionName: string, body: Record<string, unknown> = {}) => {
    setStates((prev) => ({
      ...prev,
      [functionName]: { ...prev[functionName], isRunning: true, lastError: null },
    }));

    try {
      const { data, error } = await supabase.functions.invoke(
        functionName === "run-all" ? "run-all-automations" : functionName,
        { body }
      );

      if (error) throw error;

      const result = data as AutomationResult;
      setStates((prev) => ({
        ...prev,
        [functionName]: {
          isRunning: false,
          lastResult: result,
          lastError: null,
          lastRanAt: new Date().toISOString(),
        },
      }));

      toast({
        title: "Automation complete",
        description: getSuccessMessage(functionName, result),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setStates((prev) => ({
        ...prev,
        [functionName]: {
          ...prev[functionName],
          isRunning: false,
          lastError: errorMessage,
        },
      }));

      toast({
        title: "Automation failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  };

  const runAll = () => runAutomation("run-all");
  const recalculateWaffling = () => runAutomation("recalculate-waffling");
  const detectAtRisk = () => runAutomation("detect-at-risk");
  const checkDeadlines = (days?: number) => runAutomation("deadline-alerts", { days_threshold: days || 7 });
  const checkStaleContacts = (days?: number) => runAutomation("stale-contacts", { days_threshold: days || 5 });
  const generateDigest = () => runAutomation("daily-digest");

  return {
    states,
    runAll,
    recalculateWaffling,
    detectAtRisk,
    checkDeadlines,
    checkStaleContacts,
    generateDigest,
    isAnyRunning: Object.values(states).some((s) => s.isRunning),
  };
}

function getSuccessMessage(functionName: string, result: AutomationResult): string {
  switch (functionName) {
    case "run-all":
      const summary = result.summary as { waffling_updated?: number; at_risk_detected?: number; deadline_alerts?: number; stale_contacts?: number } | undefined;
      return `Updated ${summary?.waffling_updated || 0} waffling scores, detected ${summary?.at_risk_detected || 0} at-risk proposals, found ${summary?.deadline_alerts || 0} deadline alerts and ${summary?.stale_contacts || 0} stale contacts.`;
    case "recalculate-waffling":
      return `Updated ${(result as { accounts_updated?: number }).accounts_updated || 0} account waffling scores.`;
    case "detect-at-risk":
      return `Detected ${(result as { deals_updated?: number }).deals_updated || 0} at-risk proposals.`;
    case "deadline-alerts":
      return `Found ${(result as { alerts_count?: number }).alerts_count || 0} publications with upcoming deadlines.`;
    case "stale-contacts":
      return `Found ${(result as { stale_contacts_count?: number }).stale_contacts_count || 0} contacts needing follow-up.`;
    case "daily-digest":
      return "Daily digest generated successfully.";
    default:
      return "Automation completed successfully.";
  }
}
