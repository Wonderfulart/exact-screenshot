import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccounts } from "@/hooks/useAccounts";
import { useTitles } from "@/hooks/useTitles";
import type { Deal } from "@/hooks/useDeals";

interface AtRiskTableProps {
  deals: Deal[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

const getStageLabel = (stage: string) => {
  const labels: Record<string, string> = {
    prospect: "Prospect",
    pitched: "Pitched",
    negotiating: "Negotiating",
    verbal_yes: "Verbal Yes",
    contract_sent: "Contract Sent",
    signed: "Signed",
    lost: "Lost",
  };
  return labels[stage] || stage;
};

const getAdSizeLabel = (size: string) => {
  const labels: Record<string, string> = {
    quarter_page: "¼ Page",
    half_page: "½ Page",
    full_page: "Full Page",
    two_page_spread: "2-Page Spread",
  };
  return labels[size] || size;
};

export function AtRiskTable({ deals }: AtRiskTableProps) {
  const navigate = useNavigate();
  const { data: accounts = [] } = useAccounts();
  const { data: titles = [] } = useTitles();

  const getAccount = (id: string) => accounts.find((a) => a.id === id);
  const getTitle = (id: string) => titles.find((t) => t.id === id);

  if (deals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center card-shadow">
        <p className="text-muted-foreground">No at-risk proposals at this time.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card card-shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Account</TableHead>
            <TableHead>Publication</TableHead>
            <TableHead>Ad Size</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => {
            const account = getAccount(deal.account_id);
            const title = getTitle(deal.title_id);

            return (
              <TableRow 
                key={deal.id} 
                className="cursor-pointer"
                onClick={() => navigate(`/accounts/${deal.account_id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="font-medium">{account?.company_name || "Unknown"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {title?.name ? `${title.name.split(" ").slice(0, 2).join(" ")}...` : "Unknown"}
                </TableCell>
                <TableCell>{getAdSizeLabel(deal.ad_size)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                    {getStageLabel(deal.stage)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(deal.value)}
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/accounts/${deal.account_id}`);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
