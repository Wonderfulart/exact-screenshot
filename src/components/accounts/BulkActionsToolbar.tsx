import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreHorizontal, X, RefreshCw, Loader2 } from "lucide-react";
import { exportToCSV, accountColumns } from "@/lib/exportUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Account } from "@/hooks/useAccounts";

interface BulkActionsToolbarProps {
  selectedIds: string[];
  accounts: Account[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function BulkActionsToolbar({
  selectedIds,
  accounts,
  onClearSelection,
  onRefresh,
}: BulkActionsToolbarProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));

  const handleExportSelected = () => {
    exportToCSV(selectedAccounts, "accounts_export", accountColumns);
    toast({
      title: "Export complete",
      description: `Exported ${selectedAccounts.length} contact records to CSV`,
    });
  };

  const handleExportAll = () => {
    exportToCSV(accounts, "all_accounts_export", accountColumns);
    toast({
      title: "Export complete",
      description: `Exported ${accounts.length} contact records to CSV`,
    });
  };

  const handleBulkUpdateCertainty = async (certainty: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ decision_certainty: certainty as Account["decision_certainty"] })
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Updated",
        description: `Updated ${selectedIds.length} contact records to "${certainty}"`,
      });
      onRefresh();
      onClearSelection();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact records",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkResetWaffling = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ waffling_score: 0 })
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Reset",
        description: `Reset waffling scores for ${selectedIds.length} contact records`,
      });
      onRefresh();
      onClearSelection();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset waffling scores",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (selectedIds.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExportAll}>
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <span className="text-sm font-medium">
        {selectedIds.length} selected
      </span>

      <Button variant="outline" size="sm" onClick={handleExportSelected}>
        <Download className="h-4 w-4 mr-2" />
        Export Selected
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4 mr-2" />
            )}
            Bulk Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handleBulkUpdateCertainty("firm")}>
            Set as Firm
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBulkUpdateCertainty("leaning")}>
            Set as Leaning
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBulkUpdateCertainty("waffling")}>
            Set as Waffling
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBulkUpdateCertainty("at_risk")}>
            Set as At Risk
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBulkResetWaffling}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Waffling Scores
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
