import { useNavigate } from "react-router-dom";
import { Flame, ArrowRight, TrendingDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Account } from "@/hooks/useAccounts";
import { cn } from "@/lib/utils";

interface HotLeadsListProps {
  accounts: Account[];
}

const getEngagementLevel = (account: Account): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  const score = account.waffling_score || 0;
  if (score > 70) return { label: "Needs Attention", variant: "destructive" };
  if (score > 50) return { label: "Uncertain", variant: "secondary" };
  return { label: "Warming Up", variant: "outline" };
};

const getStatusIcon = (account: Account) => {
  const lastContact = account.last_contact_date ? new Date(account.last_contact_date) : new Date(0);
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  if ((account.waffling_score || 0) > 50) return TrendingDown;
  if (lastContact < fiveDaysAgo) return Clock;
  return Flame;
};

export function HotLeadsList({ accounts }: HotLeadsListProps) {
  const navigate = useNavigate();

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <Flame className="h-6 w-6 text-success" />
          </div>
        </div>
        <p className="text-lg font-medium text-foreground mb-1">All caught up!</p>
        <p className="text-sm text-muted-foreground">No leads need immediate attention right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.slice(0, 5).map((account) => {
        const StatusIcon = getStatusIcon(account);
        const engagement = getEngagementLevel(account);

        return (
          <div
            key={account.id}
            className={cn(
              "group flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card",
              "transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer"
            )}
            onClick={() => navigate(`/accounts/${account.id}`)}
          >
            <div className="flex items-center gap-4">
              {/* Avatar with status indicator */}
              <div className="relative">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold",
                  account.decision_certainty === "at_risk" 
                    ? "bg-danger/10 text-danger" 
                    : account.decision_certainty === "waffling"
                    ? "bg-warning/10 text-warning"
                    : "bg-primary/10 text-primary"
                )}>
                  {account.company_name.charAt(0)}
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full",
                  account.decision_certainty === "at_risk" 
                    ? "bg-danger" 
                    : account.decision_certainty === "waffling"
                    ? "bg-warning"
                    : "bg-primary"
                )}>
                  <StatusIcon className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* Info */}
              <div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {account.company_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={engagement.variant} className="text-xs">
                    {engagement.label}
                  </Badge>
                  {account.city && (
                    <span className="text-xs text-muted-foreground">{account.city}</span>
                  )}
                </div>
              </div>
            </div>

            <Button 
              size="sm" 
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/accounts/${account.id}`);
              }}
            >
              View
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        );
      })}

      {accounts.length > 5 && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/accounts?filter=attention")}
        >
          View All {accounts.length} Hot Leads
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
