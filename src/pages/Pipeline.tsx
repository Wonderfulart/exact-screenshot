import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PipelineKanban } from "@/components/pipeline/PipelineKanban";
import { useDeals } from "@/hooks/useDeals";
import { useAccounts } from "@/hooks/useAccounts";
import { useTitles } from "@/hooks/useTitles";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Download } from "lucide-react";
import { exportToCSV, dealColumns } from "@/lib/exportUtils";
import { toast } from "@/hooks/use-toast";

const Pipeline = () => {
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: titles = [], isLoading: titlesLoading } = useTitles();
  const [titleFilter, setTitleFilter] = useState("all");

  const isLoading = dealsLoading || accountsLoading || titlesLoading;

  const filteredDeals = titleFilter === "all" 
    ? deals 
    : deals.filter(d => d.title_id === titleFilter);

  const handleExport = () => {
    const exportData = filteredDeals.map((deal) => {
      const account = accounts.find((a) => a.id === deal.account_id);
      const title = titles.find((t) => t.id === deal.title_id);
      return {
        ...deal,
        account_name: account?.company_name || "Unknown",
        title_name: title?.name || "Unknown",
      };
    });
    exportToCSV(exportData, "pipeline_export", dealColumns);
    toast({
      title: "Export complete",
      description: `Exported ${exportData.length} proposals to CSV`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Proposal Pipeline</h1>
            <p className="mt-1 text-muted-foreground">
              Drag proposals between stages to update their status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Select value={titleFilter} onValueChange={setTitleFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Publications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Publications</SelectItem>
                {titles.map((title) => (
                  <SelectItem key={title.id} value={title.id}>{title.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <PipelineKanban 
            deals={filteredDeals} 
            accounts={accounts} 
            titles={titles} 
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Pipeline;
