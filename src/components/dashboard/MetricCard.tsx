import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: {
    value: string;
    type: "up" | "down" | "neutral";
  };
  variant?: "default" | "success" | "warning" | "danger";
}

export function MetricCard({ label, value, subtext, trend, variant = "default" }: MetricCardProps) {
  return (
    <div className="animate-fade-in rounded-lg border border-border bg-card p-5 card-shadow">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          variant === "success" && "text-success",
          variant === "warning" && "text-warning",
          variant === "danger" && "text-danger",
          variant === "default" && "text-foreground"
        )}
      >
        {value}
      </p>
      {(subtext || trend) && (
        <div className="mt-1 flex items-center gap-2">
          {subtext && <span className="text-sm text-muted-foreground">{subtext}</span>}
          {trend && (
            <span
              className={cn(
                "text-sm font-medium",
                trend.type === "up" && "text-success",
                trend.type === "down" && "text-danger",
                trend.type === "neutral" && "text-muted-foreground"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
