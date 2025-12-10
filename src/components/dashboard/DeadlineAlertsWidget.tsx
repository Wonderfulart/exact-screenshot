import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface DeadlineAlert {
  title_id: string;
  title_name: string;
  region: string;
  deadline: string;
  days_remaining: number;
  urgency: "critical" | "high" | "medium" | "low";
  revenue_goal: number;
  revenue_booked: number;
  revenue_gap: number;
  percent_to_goal: number;
}

const urgencyStyles: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-warning/10 text-warning border-warning/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground",
};

export function DeadlineAlertsWidget() {
  const [alerts, setAlerts] = useState<DeadlineAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchAlerts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("deadline-alerts", {
        body: { days_threshold: 14 },
      });
      if (error) throw error;
      setAlerts(data?.alerts || []);
    } catch (err) {
      console.error("Failed to fetch deadline alerts:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Deadlines
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-1">{alerts.length}</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchAlerts(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming deadlines in the next 14 days</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.title_id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => navigate(`/titles/${alert.title_id}`)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{alert.title_name}</span>
                    <Badge variant="outline" className={urgencyStyles[alert.urgency]}>
                      {alert.days_remaining}d
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(alert.deadline), "MMM d, yyyy")} • {alert.region}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{alert.percent_to_goal}%</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(alert.revenue_gap)} gap
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
