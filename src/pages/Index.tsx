import { AppLayout } from "@/components/layout/AppLayout";
import { AISummaryBanner } from "@/components/dashboard/AISummaryBanner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PublicationCard } from "@/components/dashboard/PublicationCard";
import { NeedsAttentionList } from "@/components/dashboard/NeedsAttentionList";
import { AtRiskTable } from "@/components/dashboard/AtRiskTable";
import {
  titles,
  deals,
  getNeedsAttentionAccounts,
  getAtRiskDeals,
  formatCurrency,
} from "@/data/mockData";

const Dashboard = () => {
  const needsAttention = getNeedsAttentionAccounts();
  const atRiskDeals = getAtRiskDeals();
  
  // Calculate metrics
  const totalBooked = titles.reduce((sum, t) => sum + t.revenue_booked, 0);
  const totalGoal = titles.reduce((sum, t) => sum + t.revenue_goal, 0);
  const gapToGoal = totalGoal - totalBooked;
  const atRiskValue = atRiskDeals.reduce((sum, d) => sum + d.value, 0);
  const openProposals = deals.filter(d => d.stage !== "signed" && d.stage !== "lost").length;

  const priorities = [
    { label: "Oregon Coast Magazine deadline is in 53 days - $21,000 gap remaining", type: "danger" as const },
    { label: "Salishan Coastal Lodge's $4,200 spread is at risk - no contact in 12 days", type: "warning" as const },
    { label: "3 contracts pending signature worth $4,950 total", type: "success" as const },
  ];

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
        <AISummaryBanner
          greeting="Good morning! Here's your sales snapshot."
          priorities={priorities}
        />

        {/* Metrics Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Booked"
            value={formatCurrency(totalBooked)}
            subtext={`${Math.round((totalBooked / totalGoal) * 100)}% of goal`}
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
        </div>

        {/* Publications Overview */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Publications Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {titles.map((title) => (
              <PublicationCard key={title.id} title={title} />
            ))}
          </div>
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
            <NeedsAttentionList accounts={needsAttention} />
          </section>

          {/* At-Risk Proposals */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              At-Risk Proposals
              <span className="ml-2 rounded-full bg-warning/10 px-2 py-0.5 text-sm font-medium text-warning">
                {atRiskDeals.length}
              </span>
            </h2>
            <AtRiskTable deals={atRiskDeals} />
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
