import { AppLayout } from "@/components/layout/AppLayout";
import { AISummaryBanner } from "@/components/dashboard/AISummaryBanner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PublicationCard } from "@/components/dashboard/PublicationCard";
import { NeedsAttentionList } from "@/components/dashboard/NeedsAttentionList";
import { AtRiskTable } from "@/components/dashboard/AtRiskTable";
import { useTitles } from "@/hooks/useTitles";
import { useNeedsAttentionAccounts } from "@/hooks/useAccounts";
import { useAtRiskDeals, useDeals } from "@/hooks/useDeals";
import { useAIInsights } from "@/hooks/useAIInsights";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

const Dashboard = () => {
  const { data: titles = [], isLoading: titlesLoading } = useTitles();
  const { data: needsAttention = [], isLoading: attentionLoading } = useNeedsAttentionAccounts();
  const { data: atRiskDeals = [], isLoading: riskLoading } = useAtRiskDeals();
  const { data: allDeals = [] } = useDeals();
  const { data: aiInsights, isLoading: insightsLoading } = useAIInsights();

  const isLoading = titlesLoading || attentionLoading || riskLoading;

  // Calculate metrics
  const totalBooked = titles.reduce((sum, t) => sum + (t.revenue_booked || 0), 0);
  const totalGoal = titles.reduce((sum, t) => sum + (t.revenue_goal || 0), 0);
  const gapToGoal = totalGoal - totalBooked;
  const atRiskValue = atRiskDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const openProposals = allDeals.filter((d) => d.stage !== "signed" && d.stage !== "lost").length;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Your ad sales command center across all publications
          </p>
        </div>

        {/* AI Summary Banner */}
        {insightsLoading ? (
          <Skeleton className="h-36 w-full rounded-lg" />
        ) : (
          <AISummaryBanner
            greeting={aiInsights?.greeting || "Good day! Here's your sales snapshot."}
            priorities={aiInsights?.priorities || []}
          />
        )}

        {/* Metrics Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
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

        {/* Publications Overview */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Publications Overview</h2>
          {titlesLoading ? (
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
          )}
        </section>

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Needs Attention */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Needs Attention
              <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-sm font-medium text-danger">
                {needsAttention.length}
              </span>
            </h2>
            {attentionLoading ? (
              <Skeleton className="h-64 rounded-lg" />
            ) : (
              <NeedsAttentionList accounts={needsAttention} />
            )}
          </section>

          {/* At-Risk Proposals */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              At-Risk Proposals
              <span className="ml-2 rounded-full bg-warning/10 px-2 py-0.5 text-sm font-medium text-warning">
                {atRiskDeals.length}
              </span>
            </h2>
            {riskLoading ? (
              <Skeleton className="h-64 rounded-lg" />
            ) : (
              <AtRiskTable deals={atRiskDeals} />
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
