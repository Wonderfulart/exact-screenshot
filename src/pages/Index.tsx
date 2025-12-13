import { AppLayout } from "@/components/layout/AppLayout";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { HotLeadsList } from "@/components/dashboard/HotLeadsList";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PublicationCard } from "@/components/dashboard/PublicationCard";
import { DeadlineAlertsWidget } from "@/components/dashboard/DeadlineAlertsWidget";
import { StaleContactsWidget } from "@/components/dashboard/StaleContactsWidget";
import { useTitles } from "@/hooks/useTitles";
import { useNeedsAttentionAccounts } from "@/hooks/useAccounts";
import { useAtRiskDeals, useDeals } from "@/hooks/useDeals";
import { useAIInsights } from "@/hooks/useAIInsights";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, AlertTriangle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: titles = [], isLoading: titlesLoading } = useTitles();
  const { data: needsAttention = [], isLoading: attentionLoading } = useNeedsAttentionAccounts();
  const { data: atRiskDeals = [], isLoading: riskLoading } = useAtRiskDeals();
  const { data: allDeals = [] } = useDeals();
  const { data: aiInsights, isLoading: insightsLoading } = useAIInsights();
  
  const [showPublications, setShowPublications] = useState(false);

  const isLoading = titlesLoading || attentionLoading || riskLoading;

  // Calculate metrics
  const totalBooked = titles.reduce((sum, t) => sum + (t.revenue_booked || 0), 0);
  const totalGoal = titles.reduce((sum, t) => sum + (t.revenue_goal || 0), 0);
  const gapToGoal = totalGoal - totalBooked;
  const atRiskValue = atRiskDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const openProposals = allDeals.filter((d) => d.stage !== "signed" && d.stage !== "lost").length;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Simplified Header with Greeting */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-foreground">
            {getGreeting()}! Ready to close some deals?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your 3-step workflow to maximize sales success
          </p>
        </div>

        {/* 3-Step Command Center */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : (
          <CommandCenter 
            gapToGoal={gapToGoal}
            totalGoal={totalGoal}
            totalBooked={totalBooked}
          />
        )}

        {/* Quick Metrics Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </>
          ) : (
            <>
              <MetricCard
                label="Total Booked"
                value={formatCurrency(totalBooked)}
                subtext={totalGoal > 0 ? `${Math.round((totalBooked / totalGoal) * 100)}% of goal` : ""}
                variant="default"
              />
              <MetricCard
                label="Gap to Goal"
                value={formatCurrency(gapToGoal)}
                subtext="across all publications"
                variant="warning"
              />
              <MetricCard
                label="At-Risk Revenue"
                value={formatCurrency(atRiskValue)}
                subtext={`${atRiskDeals.length} proposals flagged`}
                variant="danger"
              />
              <MetricCard
                label="Open Proposals"
                value={openProposals.toString()}
                subtext="in pipeline"
                variant="default"
              />
            </>
          )}
        </div>

        {/* Hot Leads & Opportunities at Risk */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Hot Leads */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                🔥 Hot Leads
                {needsAttention.length > 0 && (
                  <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-sm font-medium text-warning">
                    {needsAttention.length}
                  </span>
                )}
              </h2>
            </div>
            {attentionLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <HotLeadsList accounts={needsAttention} />
            )}
          </section>

          {/* Opportunities at Risk */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Opportunities at Risk
                {atRiskDeals.length > 0 && (
                  <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-sm font-medium text-danger">
                    {atRiskDeals.length}
                  </span>
                )}
              </h2>
            </div>
            {riskLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : atRiskDeals.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-lg font-medium text-foreground mb-1">Looking good!</p>
                <p className="text-sm text-muted-foreground">No at-risk proposals right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {atRiskDeals.slice(0, 5).map((deal) => (
                  <div
                    key={deal.id}
                    className="group flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md hover:border-warning/30 cursor-pointer"
                    onClick={() => navigate(`/accounts/${deal.account_id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{formatCurrency(deal.value)}</p>
                        <p className="text-sm text-muted-foreground capitalize">{deal.stage.replace("_", " ")}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Alerts Row - Deadlines & Stale Contacts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <DeadlineAlertsWidget />
          <StaleContactsWidget />
        </div>

        {/* Publications Overview - Collapsible */}
        <section>
          <Button
            variant="ghost"
            className="w-full justify-between mb-4 py-6 text-left"
            onClick={() => setShowPublications(!showPublications)}
          >
            <span className="text-lg font-semibold text-foreground">Publications Overview</span>
            {showPublications ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
          
          {showPublications && (
            titlesLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {titles.map((title) => (
                  <PublicationCard key={title.id} title={title} />
                ))}
              </div>
            )
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
