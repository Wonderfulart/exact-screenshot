import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PipelineKanban } from "@/components/pipeline/PipelineKanban";
import { useDeals } from "@/hooks/useDeals";
import { useAccounts } from "@/hooks/useAccounts";
import { useTitles } from "@/hooks/useTitles";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

const Pipeline = () => {
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: titles = [], isLoading: titlesLoading } = useTitles();
  const [titleFilter, setTitleFilter] = useState("all");

  const isLoading = dealsLoading || accountsLoading || titlesLoading;

  const filteredDeals = titleFilter === "all" 
    ? deals 
    : deals.filter(d => d.title_id === titleFilter);

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
