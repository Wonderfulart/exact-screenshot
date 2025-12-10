import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account } from "@/hooks/useAccounts";
import type { Deal } from "@/hooks/useDeals";

interface AccountHealthSectionProps {
  account: Account;
  deals: Deal[];
}

interface RiskSignal {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  icon: typeof AlertTriangle;
}

export function AccountHealthSection({ account, deals }: AccountHealthSectionProps) {
  const wafflingScore = account.waffling_score || 0;
  const daysSinceContact = account.last_contact_date
    ? Math.floor((Date.now() - new Date(account.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const atRiskDeals = deals.filter(d => d.is_at_risk);

  // Determine risk signals
  const riskSignals: RiskSignal[] = [];

  if (wafflingScore > 70) {
    riskSignals.push({
      id: "high-waffling",
      label: "High waffling score indicates hesitation",
      severity: "high",
      icon: TrendingDown,
    });
  } else if (wafflingScore > 50) {
    riskSignals.push({
      id: "medium-waffling",
      label: "Elevated waffling score - monitor closely",
      severity: "medium",
      icon: TrendingDown,
    });
  }

  if (daysSinceContact !== null && daysSinceContact > 10) {
    riskSignals.push({
      id: "stale-contact",
      label: `No contact in ${daysSinceContact} days`,
      severity: "high",
      icon: Clock,
    });
  } else if (daysSinceContact !== null && daysSinceContact > 5) {
    riskSignals.push({
      id: "aging-contact",
      label: `${daysSinceContact} days since last contact`,
      severity: "medium",
      icon: Clock,
    });
  }

  if (atRiskDeals.length > 0) {
    riskSignals.push({
      id: "at-risk-deals",
      label: `${atRiskDeals.length} proposal${atRiskDeals.length !== 1 ? 's' : ''} flagged at-risk`,
      severity: atRiskDeals.length > 2 ? "high" : "medium",
      icon: AlertTriangle,
    });
  }

  if (account.decision_certainty === "at_risk") {
    riskSignals.push({
      id: "decision-at-risk",
      label: "Account marked as at-risk",
      severity: "high",
      icon: XCircle,
    });
  }

  // Calculate overall health score (inverse of risk)
  const healthScore = Math.max(0, 100 - wafflingScore - (riskSignals.length * 10));
  
  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-warning";
    return "text-danger";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 70) return "Healthy";
    if (score >= 40) return "Needs Attention";
    return "At Risk";
  };

  const getWafflingColor = (score: number) => {
    if (score <= 25) return "bg-success";
    if (score <= 50) return "bg-warning";
    return "bg-danger";
  };

  const getCertaintyBadge = (certainty: string | null) => {
    const styles: Record<string, { bg: string; icon: typeof CheckCircle2 }> = {
      firm: { bg: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
      leaning: { bg: "bg-primary/10 text-primary border-primary/20", icon: TrendingDown },
      waffling: { bg: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
      at_risk: { bg: "bg-danger/10 text-danger border-danger/20", icon: XCircle },
    };
    const labels: Record<string, string> = {
      firm: "Firm",
      leaning: "Leaning",
      waffling: "Waffling",
      at_risk: "At Risk",
    };
    if (!certainty) return null;
    const style = styles[certainty] || styles.leaning;
    const Icon = style.icon;
    return (
      <Badge variant="outline" className={cn("font-medium gap-1", style.bg)}>
        <Icon className="h-3 w-3" />
        {labels[certainty]}
      </Badge>
    );
  };

  return (
    <div className="py-4 space-y-6">
      {/* Health Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Overall Health */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Health</span>
              <Heart className={cn("h-4 w-4", getHealthColor(healthScore))} />
            </div>
            <p className={cn("text-2xl font-semibold", getHealthColor(healthScore))}>
              {getHealthLabel(healthScore)}
            </p>
            <Progress 
              value={healthScore} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        {/* Waffling Score */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Waffling Score</span>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold">{wafflingScore}%</p>
            <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className={cn("h-full transition-all", getWafflingColor(wafflingScore))}
                style={{ width: `${wafflingScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Decision Certainty */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Decision Certainty</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getCertaintyBadge(account.decision_certainty)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {daysSinceContact !== null 
                ? `${daysSinceContact} day${daysSinceContact !== 1 ? 's' : ''} since last contact`
                : "No contact date recorded"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Signals */}
      {riskSignals.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Risk Signals</h4>
          <div className="space-y-2">
            {riskSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <div
                  key={signal.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    signal.severity === "high" && "border-danger/20 bg-danger/5",
                    signal.severity === "medium" && "border-warning/20 bg-warning/5",
                    signal.severity === "low" && "border-muted"
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-4 w-4",
                      signal.severity === "high" && "text-danger",
                      signal.severity === "medium" && "text-warning",
                      signal.severity === "low" && "text-muted-foreground"
                    )} 
                  />
                  <span className="text-sm">{signal.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="text-sm text-success">No risk signals detected. Account is in good standing.</span>
        </div>
      )}
    </div>
  );
}
