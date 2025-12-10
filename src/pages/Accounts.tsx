import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { accounts, formatCurrency, formatDate } from "@/data/mockData";
import { cn } from "@/lib/utils";

const Accounts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === "all" || account.decision_certainty === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (certainty: string) => {
    const styles = {
      firm: "bg-success/10 text-success",
      leaning: "bg-primary/10 text-primary",
      waffling: "bg-warning/10 text-warning",
      at_risk: "bg-danger/10 text-danger",
    };
    const labels = {
      firm: "Firm",
      leaning: "Leaning",
      waffling: "Waffling",
      at_risk: "At Risk",
    };
    return (
      <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", styles[certainty as keyof typeof styles])}>
        {labels[certainty as keyof typeof labels]}
      </span>
    );
  };

  const getWafflingIndicator = (score: number) => {
    if (score <= 25) return { color: "text-success", bg: "bg-success" };
    if (score <= 50) return { color: "text-warning", bg: "bg-warning" };
    return { color: "text-danger", bg: "bg-danger" };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Contact Records</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your advertiser relationships
            </p>
          </div>
          <Button>Add Contact</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by company, contact, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="firm">Firm</SelectItem>
              <SelectItem value="leaning">Leaning</SelectItem>
              <SelectItem value="waffling">Waffling</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waffling</TableHead>
                <TableHead>Last Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => {
                const waffling = getWafflingIndicator(account.waffling_score);
                return (
                  <TableRow
                    key={account.id}
                    className="cursor-pointer transition-colors hover:bg-accent/50"
                  >
                    <TableCell className="font-medium">{account.company_name}</TableCell>
                    <TableCell>{account.contact_name}</TableCell>
                    <TableCell className="text-muted-foreground">{account.city}</TableCell>
                    <TableCell className="text-muted-foreground">{account.business_type}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(account.budget_range_low)} - {formatCurrency(account.budget_range_high)}
                    </TableCell>
                    <TableCell>{getStatusBadge(account.decision_certainty)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full transition-all", waffling.bg)}
                            style={{ width: `${account.waffling_score}%` }}
                          />
                        </div>
                        <span className={cn("text-sm tabular-nums", waffling.color)}>
                          {account.waffling_score}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(account.last_contact_date)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Accounts;
