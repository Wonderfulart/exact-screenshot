import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sun, Flame, TrendingUp, ChevronRight } from "lucide-react";
import { useAutomations } from "@/hooks/useAutomations";
import { useNeedsAttentionAccounts } from "@/hooks/useAccounts";
import { useAtRiskDeals } from "@/hooks/useDeals";

interface CommandCenterProps {
  gapToGoal: number;
  totalGoal: number;
  totalBooked: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

export function CommandCenter({ gapToGoal, totalGoal, totalBooked }: CommandCenterProps) {
  const navigate = useNavigate();
  const { runAll, isAnyRunning, states } = useAutomations();
  const { data: needsAttention = [] } = useNeedsAttentionAccounts();
  const { data: atRiskDeals = [] } = useAtRiskDeals();

  const hotLeadsCount = needsAttention.length + atRiskDeals.length;
  const progressPercent = totalGoal > 0 ? Math.min(100, Math.round((totalBooked / totalGoal) * 100)) : 0;

  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleRunAnalysis = async () => {
    await runAll();
    setAnalysisComplete(true);
    setTimeout(() => setAnalysisComplete(false), 3000);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Step 1: Morning Briefing */}
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          1
        </div>
        <CardContent className="pt-14 pb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sun className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Morning Briefing</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start your day with fresh insights
          </p>
          <Button 
            onClick={handleRunAnalysis} 
            disabled={isAnyRunning}
            size="lg"
            className="w-full"
          >
            {isAnyRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : analysisComplete ? (
              "Analysis Complete ✓"
            ) : (
              "Run Daily Analysis"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Outreach Mode */}
      <Card className="relative overflow-hidden border-2 border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
        <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-warning text-warning-foreground text-sm font-bold">
          2
        </div>
        <CardContent className="pt-14 pb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <Flame className="h-8 w-8 text-warning" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Outreach Mode</h3>
          <div className="mb-4">
            <span className="text-4xl font-bold text-warning">{hotLeadsCount}</span>
            <p className="text-sm text-muted-foreground">Hot Leads Ready</p>
          </div>
          <Button 
            onClick={() => navigate("/accounts?filter=attention")}
            variant="outline"
            size="lg"
            className="w-full border-warning/50 hover:bg-warning/10"
          >
            View Top Prospects
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Step 3: Revenue Pulse */}
      <Card className="relative overflow-hidden border-2 border-success/20 bg-gradient-to-br from-success/5 to-success/10">
        <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground text-sm font-bold">
          3
        </div>
        <CardContent className="pt-14 pb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Revenue Pulse</h3>
          <div className="mb-4">
            <span className="text-3xl font-bold text-foreground">{formatCurrency(gapToGoal)}</span>
            <p className="text-sm text-muted-foreground">Gap to Goal</p>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div 
              className="bg-success h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progressPercent}% of goal achieved</p>
        </CardContent>
      </Card>
    </div>
  );
}
