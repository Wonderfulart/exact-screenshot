import { CalendarDays } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Title, formatCurrency, getDaysUntil } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface PublicationCardProps {
  title: Title;
}

export function PublicationCard({ title }: PublicationCardProps) {
  const revenuePercent = Math.round((title.revenue_booked / title.revenue_goal) * 100);
  const pagesPercent = Math.round((title.pages_sold / title.pages_goal) * 100);
  const daysUntil = getDaysUntil(title.deadline);
  
  const getStatusColor = (percent: number) => {
    if (percent >= 75) return "success";
    if (percent >= 50) return "warning";
    return "danger";
  };

  const status = getStatusColor(revenuePercent);

  return (
    <div className="animate-fade-in rounded-lg border border-border bg-card p-5 card-shadow transition-shadow hover:card-shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1">{title.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{title.region}</p>
        </div>
        <div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
            status === "success" && "bg-success/10 text-success",
            status === "warning" && "bg-warning/10 text-warning",
            status === "danger" && "bg-danger/10 text-danger"
          )}
        >
          {status === "success" ? "●" : status === "warning" ? "●" : "●"}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {/* Revenue Progress */}
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatCurrency(title.revenue_booked)} / {formatCurrency(title.revenue_goal)}
            </span>
          </div>
          <Progress 
            value={revenuePercent} 
            className="mt-1.5 h-2"
          />
        </div>

        {/* Pages Progress */}
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pages</span>
            <span className="font-medium tabular-nums text-foreground">
              {title.pages_sold} / {title.pages_goal}
            </span>
          </div>
          <Progress 
            value={pagesPercent} 
            className="mt-1.5 h-2"
          />
        </div>
      </div>

      {/* Deadline */}
      <div className="mt-4 flex items-center gap-1.5 text-sm">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className={cn(
          daysUntil <= 30 ? "text-danger" : daysUntil <= 60 ? "text-warning" : "text-muted-foreground"
        )}>
          {daysUntil} days until deadline
        </span>
      </div>
    </div>
  );
}
