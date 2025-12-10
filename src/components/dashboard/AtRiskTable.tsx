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
import {
  Deal,
  getAccountById,
  getTitleById,
  formatCurrency,
  getStageLabel,
  getAdSizeLabel,
} from "@/data/mockData";

interface AtRiskTableProps {
  deals: Deal[];
}

export function AtRiskTable({ deals }: AtRiskTableProps) {
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
            const account = getAccountById(deal.account_id);
            const title = getTitleById(deal.title_id);
            
            return (
              <TableRow key={deal.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="font-medium">{account?.company_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {title?.name.split(" ").slice(0, 2).join(" ")}...
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
                  <Button size="sm" variant="ghost">
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
