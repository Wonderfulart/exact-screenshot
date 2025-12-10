import { AlertCircle, Clock, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Account } from "@/hooks/useAccounts";
import { cn } from "@/lib/utils";

interface NeedsAttentionListProps {
  accounts: Account[];
}

const formatDate = (dateStr: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

export function NeedsAttentionList({ accounts }: NeedsAttentionListProps) {
  const getReasonIcon = (account: Account) => {
    const lastContact = account.last_contact_date ? new Date(account.last_contact_date) : new Date(0);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    if ((account.waffling_score || 0) > 50) return TrendingDown;
    if (lastContact < fiveDaysAgo) return Clock;
    return AlertCircle;
  };

  const getReason = (account: Account) => {
    const lastContact = account.last_contact_date ? new Date(account.last_contact_date) : new Date(0);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    if ((account.waffling_score || 0) > 50) return `Waffling score: ${account.waffling_score}%`;
    if (lastContact < fiveDaysAgo) return `Last contact: ${formatDate(account.last_contact_date)}`;
    return "Needs attention";
  };

  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center card-shadow">
        <p className="text-muted-foreground">All caught up! No accounts need immediate attention.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card card-shadow">
      <div className="divide-y divide-border">
        {accounts.slice(0, 5).map((account) => {
          const ReasonIcon = getReasonIcon(account);
          const reason = getReason(account);

          return (
            <div
              key={account.id}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
                    account.decision_certainty === "at_risk"
                      ? "bg-danger/10 text-danger"
                      : account.decision_certainty === "waffling"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {account.company_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{account.company_name}</p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ReasonIcon className="h-3.5 w-3.5" />
                    <span>{reason}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Callback
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
