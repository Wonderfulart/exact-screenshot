import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomationCard } from "./AutomationCard";
import { useAutomations } from "@/hooks/useAutomations";
import {
  Zap,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Loader2,
} from "lucide-react";

export function AutomationDashboard() {
  const {
    states,
    runAll,
    recalculateWaffling,
    detectAtRisk,
    checkDeadlines,
    checkStaleContacts,
    generateDigest,
    isAnyRunning,
  } = useAutomations();

  const getResultPreview = (key: string) => {
    const result = states[key]?.lastResult;
    if (!result) return undefined;

    switch (key) {
      case "recalculate-waffling":
        return `${(result as { accounts_updated?: number }).accounts_updated || 0} scores updated`;
      case "detect-at-risk":
        return `${(result as { deals_updated?: number }).deals_updated || 0} proposals flagged`;
      case "deadline-alerts":
        return `${(result as { alerts_count?: number }).alerts_count || 0} alerts found`;
      case "stale-contacts":
        return `${(result as { stale_contacts_count?: number }).stale_contacts_count || 0} contacts need follow-up`;
      default:
        return undefined;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Automations
            </CardTitle>
            <CardDescription>
              Run health checks and data analysis
            </CardDescription>
          </div>
          <Button
            onClick={runAll}
            disabled={isAnyRunning}
            className="gap-2"
          >
            {states["run-all"]?.isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running All...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AutomationCard
            title="Waffling Scores"
            description="Recalculate contact engagement scores"
            icon={<RefreshCw className="h-4 w-4" />}
            state={states["recalculate-waffling"]}
            onRun={recalculateWaffling}
            resultPreview={getResultPreview("recalculate-waffling")}
          />
          <AutomationCard
            title="At-Risk Detection"
            description="Identify proposals needing attention"
            icon={<AlertTriangle className="h-4 w-4" />}
            state={states["detect-at-risk"]}
            onRun={detectAtRisk}
            resultPreview={getResultPreview("detect-at-risk")}
          />
          <AutomationCard
            title="Deadline Alerts"
            description="Check publications due in 7 days"
            icon={<Calendar className="h-4 w-4" />}
            state={states["deadline-alerts"]}
            onRun={() => checkDeadlines(7)}
            resultPreview={getResultPreview("deadline-alerts")}
          />
          <AutomationCard
            title="Stale Contacts"
            description="Find contacts inactive 5+ days"
            icon={<Users className="h-4 w-4" />}
            state={states["stale-contacts"]}
            onRun={() => checkStaleContacts(5)}
            resultPreview={getResultPreview("stale-contacts")}
          />
          <AutomationCard
            title="Daily Digest"
            description="Generate performance summary"
            icon={<FileText className="h-4 w-4" />}
            state={states["daily-digest"]}
            onRun={generateDigest}
          />
        </div>

        {/* Run All Summary */}
        {states["run-all"]?.lastResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">Last Full Run Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <SummaryItem
                label="Waffling Updated"
                value={(states["run-all"].lastResult.summary as { waffling_updated?: number })?.waffling_updated || 0}
              />
              <SummaryItem
                label="At-Risk Detected"
                value={(states["run-all"].lastResult.summary as { at_risk_detected?: number })?.at_risk_detected || 0}
              />
              <SummaryItem
                label="Deadline Alerts"
                value={(states["run-all"].lastResult.summary as { deadline_alerts?: number })?.deadline_alerts || 0}
              />
              <SummaryItem
                label="Stale Contacts"
                value={(states["run-all"].lastResult.summary as { stale_contacts?: number })?.stale_contacts || 0}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-lg">{value}</p>
    </div>
  );
}
