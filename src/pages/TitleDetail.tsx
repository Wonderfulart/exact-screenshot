import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { TitleFormDialog } from "@/components/title/TitleFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Title } from "@/hooks/useTitles";
import type { Deal } from "@/hooks/useDeals";
import type { Account } from "@/hooks/useAccounts";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const getDaysUntil = (dateStr: string | null) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const TitleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editTitleOpen, setEditTitleOpen] = useState(false);

  // Fetch title
  const { data: title, isLoading: titleLoading } = useQuery({
    queryKey: ["title", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("titles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Title;
    },
    enabled: !!id,
  });

  // Fetch deals for this title
  const { data: deals = [] } = useQuery({
    queryKey: ["deals", "title", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("title_id", id)
        .order("value", { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!id,
  });

  // Fetch accounts for deal display
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) throw error;
      return data as Account[];
    },
  });

  const getStageBadge = (stage: string) => {
    const styles: Record<string, string> = {
      prospect: "bg-muted text-muted-foreground",
      pitched: "bg-primary/10 text-primary",
      negotiating: "bg-warning/10 text-warning",
      verbal_yes: "bg-success/10 text-success",
      contract_sent: "bg-primary/10 text-primary",
      signed: "bg-success/10 text-success",
      lost: "bg-danger/10 text-danger",
    };
    const labels: Record<string, string> = {
      prospect: "Prospect",
      pitched: "Pitched",
      negotiating: "Negotiating",
      verbal_yes: "Verbal Yes",
      contract_sent: "Contract Sent",
      signed: "Signed",
      lost: "Lost",
    };
    return (
      <Badge variant="outline" className={cn("font-medium", styles[stage])}>
        {labels[stage] || stage}
      </Badge>
    );
  };

  if (titleLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!title) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Publication not found</p>
          <Button variant="link" onClick={() => navigate("/titles")}>
            Back to Publications
          </Button>
        </div>
      </AppLayout>
    );
  }

  const daysUntil = getDaysUntil(title.deadline);
  const revenueProgress = title.revenue_goal > 0 
    ? (Number(title.revenue_booked) / Number(title.revenue_goal)) * 100 
    : 0;
  const pagesProgress = title.pages_goal > 0 
    ? (title.pages_sold / title.pages_goal) * 100 
    : 0;

  const activeDeals = deals.filter(d => !["signed", "lost"].includes(d.stage));
  const signedDeals = deals.filter(d => d.stage === "signed");
  const atRiskDeals = deals.filter(d => d.is_at_risk);
  const pipelineValue = activeDeals.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/titles")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{title.name}</h1>
                <Badge variant="outline">{title.region}</Badge>
              </div>
              {title.description && (
                <p className="text-muted-foreground mt-1">{title.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {daysUntil !== null && (
              <Badge
                variant="outline"
                className={cn(
                  daysUntil <= 7 ? "bg-danger/10 text-danger border-danger/20" :
                  daysUntil <= 21 ? "bg-warning/10 text-warning border-warning/20" :
                  "bg-success/10 text-success border-success/20"
                )}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {daysUntil} days until deadline
              </Badge>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Booked</p>
                  <p className="text-2xl font-semibold">{formatCurrency(Number(title.revenue_booked))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pipeline Value</p>
                  <p className="text-2xl font-semibold">{formatCurrency(pipelineValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pages Sold</p>
                  <p className="text-2xl font-semibold">{title.pages_sold} / {title.pages_goal}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">At Risk Proposals</p>
                  <p className="text-2xl font-semibold">{atRiskDeals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{formatCurrency(Number(title.revenue_booked))}</span>
                  <span className="text-muted-foreground">Goal: {formatCurrency(Number(title.revenue_goal))}</span>
                </div>
                <Progress value={Math.min(revenueProgress, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {revenueProgress.toFixed(0)}% of goal • {formatCurrency(Number(title.revenue_goal) - Number(title.revenue_booked))} remaining
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Sales Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{title.pages_sold} pages</span>
                  <span className="text-muted-foreground">Goal: {title.pages_goal} pages</span>
                </div>
                <Progress value={Math.min(pagesProgress, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {pagesProgress.toFixed(0)}% of goal • {title.pages_goal - title.pages_sold} pages remaining
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rate Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {title.rate_quarter_page && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Quarter Page</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(title.rate_quarter_page))}</p>
                </div>
              )}
              {title.rate_half_page && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Half Page</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(title.rate_half_page))}</p>
                </div>
              )}
              {title.rate_full_page && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Full Page</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(title.rate_full_page))}</p>
                </div>
              )}
              {title.rate_two_page_spread && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Two Page Spread</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(title.rate_two_page_spread))}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Proposals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proposals ({deals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No proposals for this publication yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Ad Size</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => {
                    const account = accounts.find(a => a.id === deal.account_id);
                    return (
                      <TableRow
                        key={deal.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => navigate(`/accounts/${deal.account_id}`)}
                      >
                        <TableCell className="font-medium">{account?.company_name || "Unknown"}</TableCell>
                        <TableCell className="capitalize">{deal.ad_size.replace(/_/g, " ")}</TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(Number(deal.value))}</TableCell>
                        <TableCell>{getStageBadge(deal.stage)}</TableCell>
                        <TableCell>
                          {deal.is_at_risk && (
                            <Badge variant="outline" className="bg-danger/10 text-danger border-danger/20">
                              At Risk
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(deal.last_activity_date)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TitleDetail;
