import { AppLayout } from "@/components/layout/AppLayout";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, DollarSign, FileText } from "lucide-react";
import { useTitles } from "@/hooks/useTitles";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

const getDaysUntil = (dateStr: string | null) => {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const Titles = () => {
  const { data: titles = [], isLoading } = useTitles();

  const totalGoal = titles.reduce((sum, t) => sum + (t.revenue_goal || 0), 0);
  const totalBooked = titles.reduce((sum, t) => sum + (t.revenue_booked || 0), 0);
  const overallPercent = totalGoal > 0 ? Math.round((totalBooked / totalGoal) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Publications</h1>
          <p className="mt-1 text-muted-foreground">
            Track revenue and page sales across all titles
          </p>
        </div>

        {/* Season Overview */}
        <div className="rounded-lg border border-border bg-card p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Season Overview</h2>
              <p className="text-sm text-muted-foreground">Combined revenue across all publications</p>
            </div>
            <div className="text-right">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <p className="text-2xl font-semibold text-foreground tabular-nums">
                    {formatCurrency(totalBooked)}
                  </p>
                  <p className="text-sm text-muted-foreground">of {formatCurrency(totalGoal)} goal</p>
                </>
              )}
            </div>
          </div>
          <Progress value={overallPercent} className="h-3" />
          <p className="mt-2 text-sm text-muted-foreground">
            {overallPercent}% complete · {formatCurrency(totalGoal - totalBooked)} remaining
          </p>
        </div>

        {/* Publication Cards */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {titles.map((title) => {
              const revenuePercent = title.revenue_goal > 0
                ? Math.round((title.revenue_booked / title.revenue_goal) * 100)
                : 0;
              const pagesPercent = title.pages_goal > 0
                ? Math.round((title.pages_sold / title.pages_goal) * 100)
                : 0;
              const daysUntil = getDaysUntil(title.deadline);
              const isUrgent = daysUntil <= 30;
              const isWarning = daysUntil <= 60 && daysUntil > 30;

              return (
                <div
                  key={title.id}
                  className="animate-fade-in rounded-lg border border-border bg-card p-6 card-shadow transition-shadow hover:card-shadow-md"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-foreground">{title.name}</h3>
                    <p className="text-sm text-muted-foreground">{title.region}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-xs">Revenue</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground tabular-nums">
                        {formatCurrency(title.revenue_booked)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {formatCurrency(title.revenue_goal)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">Pages</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground tabular-nums">
                        {title.pages_sold}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {title.pages_goal} pages
                      </p>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Revenue Progress</span>
                        <span className="font-medium tabular-nums">{revenuePercent}%</span>
                      </div>
                      <Progress value={revenuePercent} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Page Progress</span>
                        <span className="font-medium tabular-nums">{pagesPercent}%</span>
                      </div>
                      <Progress value={pagesPercent} className="h-2" />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2",
                      isUrgent ? "bg-danger/10" : isWarning ? "bg-warning/10" : "bg-muted/50"
                    )}
                  >
                    <CalendarDays
                      className={cn(
                        "h-4 w-4",
                        isUrgent ? "text-danger" : isWarning ? "text-warning" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isUrgent ? "text-danger" : isWarning ? "text-warning" : "text-muted-foreground"
                      )}
                    >
                      {daysUntil} days until {formatDate(title.deadline)}
                    </span>
                  </div>

                  {/* Rate Card Preview */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Rate Card</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Full Page</span>
                        <span className="font-medium tabular-nums">
                          {title.rate_full_page ? formatCurrency(title.rate_full_page) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">½ Page</span>
                        <span className="font-medium tabular-nums">
                          {title.rate_half_page ? formatCurrency(title.rate_half_page) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">¼ Page</span>
                        <span className="font-medium tabular-nums">
                          {title.rate_quarter_page ? formatCurrency(title.rate_quarter_page) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Spread</span>
                        <span className="font-medium tabular-nums">
                          {title.rate_two_page_spread ? formatCurrency(title.rate_two_page_spread) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Titles;
