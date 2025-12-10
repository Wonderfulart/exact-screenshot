import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Deal } from "@/hooks/useDeals";
import type { Account } from "@/hooks/useAccounts";
import type { Title } from "@/hooks/useTitles";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, DollarSign, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickEmailDialog } from "@/components/email/QuickEmailDialog";

const STAGES = [
  { id: "prospect", label: "Prospect", color: "bg-muted" },
  { id: "pitched", label: "Pitched", color: "bg-primary/20" },
  { id: "negotiating", label: "Negotiating", color: "bg-warning/20" },
  { id: "verbal_yes", label: "Verbal Yes", color: "bg-success/20" },
  { id: "contract_sent", label: "Contract Sent", color: "bg-primary/30" },
  { id: "signed", label: "Signed", color: "bg-success/30" },
  { id: "lost", label: "Lost", color: "bg-danger/20" },
] as const;

type DealStage = typeof STAGES[number]["id"];

interface PipelineKanbanProps {
  deals: Deal[];
  accounts: Account[];
  titles: Title[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency: "USD", 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

const AD_SIZE_LABELS: Record<string, string> = {
  quarter_page: "¼ Page",
  half_page: "½ Page",
  full_page: "Full Page",
  two_page_spread: "2-Page Spread",
};

export function PipelineKanban({ deals, accounts, titles }: PipelineKanbanProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, newStage }: { dealId: string; newStage: DealStage }) => {
      const { error } = await supabase
        .from("deals")
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq("id", dealId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Proposal stage updated");
    },
    onError: () => {
      toast.error("Failed to update proposal stage");
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStage = destination.droppableId as DealStage;
    
    const deal = deals.find(d => d.id === draggableId);
    if (deal && deal.stage !== newStage) {
      updateStageMutation.mutate({ dealId: draggableId, newStage });
    }
  };

  const getAccount = (accountId: string) => accounts.find(a => a.id === accountId);
  const getAccountName = (accountId: string) => getAccount(accountId)?.company_name || "Unknown";
  const getTitle = (titleId: string) => titles.find(t => t.id === titleId);
  const getTitleName = (titleId: string) => getTitle(titleId)?.name || "Unknown";

  const getDealsByStage = (stage: string) => deals.filter(d => d.stage === stage);
  const getStageTotal = (stage: string) => getDealsByStage(stage).reduce((sum, d) => sum + Number(d.value), 0);

  const handleEmailClick = (e: React.MouseEvent, deal: Deal) => {
    e.stopPropagation();
    setSelectedDeal(deal);
    setEmailDialogOpen(true);
  };

  const selectedAccount = selectedDeal ? getAccount(selectedDeal.account_id) : null;
  const selectedTitle = selectedDeal ? getTitle(selectedDeal.title_id) : null;

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const stageTotal = getStageTotal(stage.id);
            
            return (
              <div key={stage.id} className="flex-shrink-0 w-[220px]">
                {/* Column Header */}
                <div className={cn(
                  "rounded-t-lg px-3 py-2 border border-b-0 border-border",
                  stage.color
                )}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{stage.label}</span>
                    <span className="text-xs bg-background/80 rounded-full px-2 py-0.5 text-muted-foreground">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(stageTotal)}
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[400px] rounded-b-lg border border-border p-2 space-y-2 transition-colors",
                        snapshot.isDraggingOver ? "bg-accent/50" : "bg-card"
                      )}
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/accounts/${deal.account_id}`)}
                              className={cn(
                                "rounded-lg border border-border bg-background p-3 cursor-pointer transition-all group",
                                "hover:border-primary/50 hover:shadow-sm",
                                snapshot.isDragging && "shadow-lg rotate-2"
                              )}
                            >
                              {/* Header with email button */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-medium text-sm text-foreground truncate flex-1">
                                  {getAccountName(deal.account_id)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => handleEmailClick(e, deal)}
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              
                              {/* Publication */}
                              <div className="text-xs text-muted-foreground truncate mt-0.5">
                                {getTitleName(deal.title_id)}
                              </div>

                              {/* Value & Ad Size */}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(deal.value).replace("$", "")}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {AD_SIZE_LABELS[deal.ad_size] || deal.ad_size}
                                </span>
                              </div>

                              {/* Risk Indicator */}
                              {deal.is_at_risk && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-danger">
                                  <AlertTriangle className="h-3 w-3" />
                                  At Risk
                                </div>
                              )}

                              {/* Probability */}
                              {deal.probability !== null && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Probability</span>
                                    <span className="font-medium">{deal.probability}%</span>
                                  </div>
                                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full transition-all",
                                        deal.probability >= 70 ? "bg-success" :
                                        deal.probability >= 40 ? "bg-warning" : "bg-danger"
                                      )}
                                      style={{ width: `${deal.probability}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {selectedAccount && (
        <QuickEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          account={selectedAccount}
          deal={selectedDeal}
          title={selectedTitle}
        />
      )}
    </>
  );
}
