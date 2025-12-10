import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Search, Filter, ArrowUpDown, Mail } from "lucide-react";
import { useAccounts, type Account } from "@/hooks/useAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AccountFormDialog } from "@/components/account/AccountFormDialog";
import { BulkActionsToolbar } from "@/components/accounts/BulkActionsToolbar";
import { QuickEmailDialog } from "@/components/email/QuickEmailDialog";
import { useQueryClient } from "@tanstack/react-query";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

type SortOption = "company" | "last_contact" | "waffling" | "budget";

const Accounts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("company");
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAccount, setEmailAccount] = useState<Account | null>(null);
  const { data: accounts = [], isLoading } = useAccounts();

  // Extract unique business types and cities for filter dropdowns
  const { businessTypes, cities } = useMemo(() => {
    const types = new Set<string>();
    const citySet = new Set<string>();
    accounts.forEach((account) => {
      if (account.business_type) types.add(account.business_type);
      if (account.city) citySet.add(account.city);
    });
    return {
      businessTypes: Array.from(types).sort(),
      cities: Array.from(citySet).sort(),
    };
  }, [accounts]);

  const filteredAndSortedAccounts = useMemo(() => {
    let result = accounts.filter((account) => {
      const matchesSearch =
        account.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (account.contact_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (account.city?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || account.decision_certainty === statusFilter;

      const matchesBusinessType =
        businessTypeFilter === "all" || account.business_type === businessTypeFilter;

      const matchesCity =
        cityFilter === "all" || account.city === cityFilter;

      return matchesSearch && matchesStatus && matchesBusinessType && matchesCity;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "company":
          return a.company_name.localeCompare(b.company_name);
        case "last_contact":
          const dateA = a.last_contact_date ? new Date(a.last_contact_date).getTime() : 0;
          const dateB = b.last_contact_date ? new Date(b.last_contact_date).getTime() : 0;
          return dateB - dateA;
        case "waffling":
          return (b.waffling_score || 0) - (a.waffling_score || 0);
        case "budget":
          return (b.budget_range_high || 0) - (a.budget_range_high || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [accounts, searchQuery, statusFilter, businessTypeFilter, cityFilter, sortBy]);

  const getStatusIndicator = (certainty: string | null) => {
    const config: Record<string, { color: string; bg: string; label: string }> = {
      firm: { color: "bg-success", bg: "bg-success/10", label: "Firm" },
      leaning: { color: "bg-primary", bg: "bg-primary/10", label: "Leaning" },
      waffling: { color: "bg-warning", bg: "bg-warning/10", label: "Waffling" },
      at_risk: { color: "bg-danger", bg: "bg-danger/10", label: "At Risk" },
    };
    if (!certainty || !config[certainty]) return null;
    const { color, bg, label } = config[certainty];
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium", bg)}>
        <span className={cn("h-2 w-2 rounded-full", color)} />
        {label}
      </span>
    );
  };

  const getWafflingIndicator = (score: number | null) => {
    const s = score || 0;
    if (s <= 25) return { color: "text-success", bg: "bg-success" };
    if (s <= 50) return { color: "text-warning", bg: "bg-warning" };
    return { color: "text-danger", bg: "bg-danger" };
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedAccounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedAccounts.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  };

  const handleEmailClick = (e: React.MouseEvent, account: Account) => {
    e.stopPropagation();
    setEmailAccount(account);
    setEmailDialogOpen(true);
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
          <Button onClick={() => setAddAccountOpen(true)}>Add Contact</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by company, contact, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
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

          <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Business Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {businessTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Company Name</SelectItem>
              <SelectItem value="last_contact">Last Contact</SelectItem>
              <SelectItem value="waffling">Waffling Score</SelectItem>
              <SelectItem value="budget">Budget (High)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          selectedIds={selectedIds}
          accounts={filteredAndSortedAccounts}
          onClearSelection={() => setSelectedIds([])}
          onRefresh={handleRefresh}
        />

        {/* Table */}
        <div className="rounded-lg border border-border bg-card card-shadow overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredAndSortedAccounts.length && filteredAndSortedAccounts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Budget Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waffling</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No contact records found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedAccounts.map((account) => {
                    const waffling = getWafflingIndicator(account.waffling_score);
                    const isSelected = selectedIds.includes(account.id);
                    return (
                      <TableRow
                        key={account.id}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-accent/50",
                          isSelected && "bg-primary/5"
                        )}
                        onClick={() => navigate(`/accounts/${account.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(account.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{account.company_name}</TableCell>
                        <TableCell>{account.contact_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{account.city || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{account.business_type || "—"}</TableCell>
                        <TableCell className="tabular-nums">
                          {account.budget_range_low && account.budget_range_high
                            ? `${formatCurrency(account.budget_range_low)} - ${formatCurrency(account.budget_range_high)}`
                            : "—"}
                        </TableCell>
                        <TableCell>{getStatusIndicator(account.decision_certainty)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn("h-full transition-all", waffling.bg)}
                                style={{ width: `${account.waffling_score || 0}%` }}
                              />
                            </div>
                            <span className={cn("text-sm tabular-nums", waffling.color)}>
                              {account.waffling_score || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(account.last_contact_date)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleEmailClick(e, account)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <AccountFormDialog open={addAccountOpen} onOpenChange={setAddAccountOpen} />
      
      {emailAccount && (
        <QuickEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          account={emailAccount}
        />
      )}
    </AppLayout>
  );
};

export default Accounts;
