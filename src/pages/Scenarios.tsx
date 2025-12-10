import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GitBranch, Sparkles, TrendingUp, TrendingDown, AlertTriangle, DollarSign, RotateCcw } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useTitles } from "@/hooks/useTitles";
import { useDeals } from "@/hooks/useDeals";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

interface AllocationState {
  [titleId: string]: number; // percentage 0-100
}

const Scenarios = () => {
  const { data: accounts = [] } = useAccounts();
  const { data: titles = [] } = useTitles();
  const { data: deals = [] } = useDeals();

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<AllocationState>({});
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);

  // Calculate total budget from selected accounts
  const totalBudget = useMemo(() => {
    return accounts
      .filter(a => selectedAccounts.includes(a.id))
      .reduce((sum, a) => sum + ((a.budget_range_low || 0) + (a.budget_range_high || 0)) / 2, 0);
  }, [accounts, selectedAccounts]);

  // Initialize allocations when titles change
  const activeAllocations = useMemo(() => {
    const allocs: AllocationState = {};
    titles.forEach((title, index) => {
      allocs[title.id] = allocations[title.id] ?? (index === 0 ? 100 : 0);
    });
    return allocs;
  }, [titles, allocations]);

  // Calculate scenario results
  const scenarioResults = useMemo(() => {
    return titles.map(title => {
      const allocationPercent = activeAllocations[title.id] || 0;
      const allocatedBudget = (totalBudget * allocationPercent) / 100;
      const currentRevenue = Number(title.revenue_booked);
      const projectedRevenue = currentRevenue + allocatedBudget;
      const goalProgress = title.revenue_goal > 0 
        ? (projectedRevenue / title.revenue_goal) * 100 
        : 0;
      const gap = title.revenue_goal - projectedRevenue;

      return {
        title,
        allocationPercent,
        allocatedBudget,
        currentRevenue,
        projectedRevenue,
        goalProgress: Math.min(goalProgress, 150),
        gap,
        isOverAllocated: goalProgress > 100,
      };
    });
  }, [titles, activeAllocations, totalBudget]);

  const totalAllocated = Object.values(activeAllocations).reduce((sum, v) => sum + v, 0);
  const isOverAllocated = totalAllocated > 100;

  const handleAllocationChange = (titleId: string, value: number[]) => {
    setAllocations(prev => ({ ...prev, [titleId]: value[0] }));
  };

  const handleReset = () => {
    setAllocations({});
    setSelectedAccounts([]);
    setShowAIRecommendation(false);
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  // AI recommendation based on gaps and waffling scores
  const aiRecommendation = useMemo(() => {
    if (!showAIRecommendation) return null;

    const recommendations: string[] = [];
    
    // Find underperforming titles
    const underperforming = scenarioResults.filter(r => r.gap > 0).sort((a, b) => b.gap - a.gap);
    if (underperforming.length > 0) {
      const top = underperforming[0];
      recommendations.push(`Focus on ${top.title.name} - it has the largest revenue gap of ${formatCurrency(top.gap)}.`);
    }

    // Check for high-waffling accounts
    const highWaffling = accounts.filter(a => selectedAccounts.includes(a.id) && (a.waffling_score || 0) > 50);
    if (highWaffling.length > 0) {
      recommendations.push(`${highWaffling.length} selected account(s) have high waffling scores - consider prioritizing follow-up before allocating budget.`);
    }

    // Balance recommendation
    if (isOverAllocated) {
      recommendations.push(`Budget is over-allocated by ${totalAllocated - 100}%. Reduce allocations to stay within available budget.`);
    }

    return recommendations;
  }, [showAIRecommendation, scenarioResults, accounts, selectedAccounts, isOverAllocated, totalAllocated]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Scenario Planner</h1>
            <p className="mt-1 text-muted-foreground">
              Model budget allocations across publications
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={() => setShowAIRecommendation(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Get AI Recommendation
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Account Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleAccount(account.id)}
                >
                  <Checkbox
                    checked={selectedAccounts.includes(account.id)}
                    onCheckedChange={() => toggleAccount(account.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{account.company_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.budget_range_low && account.budget_range_high
                        ? `${formatCurrency(account.budget_range_low)} - ${formatCurrency(account.budget_range_high)}`
                        : "No budget set"}
                    </p>
                  </div>
                  {(account.waffling_score || 0) > 50 && (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Waffling
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Middle: Allocation Sliders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Budget Allocation</CardTitle>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{formatCurrency(totalBudget)}</span>
                  <span className="text-muted-foreground">available</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select accounts to start planning
                </div>
              ) : (
                <>
                  {/* Allocation bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Allocated</span>
                      <span className={cn(isOverAllocated && "text-danger font-medium")}>
                        {totalAllocated}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(totalAllocated, 100)}
                      className={cn("h-2", isOverAllocated && "[&>div]:bg-danger")}
                    />
                    {isOverAllocated && (
                      <p className="text-sm text-danger flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Over-allocated by {totalAllocated - 100}%
                      </p>
                    )}
                  </div>

                  {/* Title sliders */}
                  <div className="space-y-4">
                    {scenarioResults.map(result => (
                      <div key={result.title.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.title.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {result.title.region}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(result.allocatedBudget)}
                            </span>
                            <span className="text-sm font-medium w-12 text-right">
                              {result.allocationPercent}%
                            </span>
                          </div>
                        </div>
                        <Slider
                          value={[result.allocationPercent]}
                          max={100}
                          step={5}
                          onValueChange={(value) => handleAllocationChange(result.title.id, value)}
                          className="py-2"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Goal: {formatCurrency(result.title.revenue_goal)}
                          </span>
                          <span className={cn(
                            result.isOverAllocated ? "text-success" : "text-warning"
                          )}>
                            {result.isOverAllocated ? (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Exceeds goal
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" />
                                Gap: {formatCurrency(result.gap)}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        {aiRecommendation && aiRecommendation.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiRecommendation.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        {selectedAccounts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            {scenarioResults.map(result => (
              <Card key={result.title.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.title.name}</span>
                      {result.isOverAllocated ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Projected</span>
                        <span className="font-medium">{formatCurrency(result.projectedRevenue)}</span>
                      </div>
                      <Progress value={result.goalProgress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{result.goalProgress.toFixed(0)}% of goal</span>
                        <span>Goal: {formatCurrency(result.title.revenue_goal)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Scenarios;
