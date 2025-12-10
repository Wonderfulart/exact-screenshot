import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { GitBranch, Sparkles } from "lucide-react";

const Scenarios = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Scenario Planner</h1>
          <p className="mt-1 text-muted-foreground">
            Model budget allocations across publications
          </p>
        </div>

        {/* Coming Soon State */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <GitBranch className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Scenario Planning Coming Soon
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Model how budget moves between publications affect your overall goals. 
            Hand AI will analyze cannibalization risks and recommend optimal allocations.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-full px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Powered by AI analysis</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Scenarios;
