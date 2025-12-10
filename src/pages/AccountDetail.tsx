import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Edit,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { EmailGenerator } from "@/components/account/EmailGenerator";
import { AccountFormDialog } from "@/components/account/AccountFormDialog";
import { DealFormDialog } from "@/components/account/DealFormDialog";
import { toast } from "sonner";
import type { Account } from "@/hooks/useAccounts";
import type { Deal } from "@/hooks/useDeals";
import type { Title } from "@/hooks/useTitles";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const AccountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Fetch account
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["account", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Account;
    },
    enabled: !!id,
  });

  // Fetch deals for this account
  const { data: deals = [] } = useQuery({
    queryKey: ["deals", "account", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("account_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!id,
  });

  // Fetch titles for deal forms
  const { data: titles = [] } = useQuery({
    queryKey: ["titles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("titles")
        .select("*")
        .order("deadline");
      if (error) throw error;
      return data as Title[];
    },
  });

  // Fetch emails sent
  const { data: emailsSent = [] } = useQuery({
    queryKey: ["emails", "account", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emails_sent")
        .select("*")
        .eq("account_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Update notes mutation
  const updateNotes = useMutation({
    mutationFn: async (notes: string) => {
      const { error } = await supabase
        .from("accounts")
        .update({ notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", id] });
      toast.success("Notes saved");
    },
  });

  const getStatusBadge = (certainty: string | null) => {
    const styles: Record<string, string> = {
      firm: "bg-success/10 text-success border-success/20",
      leaning: "bg-primary/10 text-primary border-primary/20",
      waffling: "bg-warning/10 text-warning border-warning/20",
      at_risk: "bg-danger/10 text-danger border-danger/20",
    };
    const labels: Record<string, string> = {
      firm: "Firm",
      leaning: "Leaning",
      waffling: "Waffling",
      at_risk: "At Risk",
    };
    if (!certainty) return null;
    return (
      <Badge variant="outline" className={cn("font-medium", styles[certainty])}>
        {labels[certainty]}
      </Badge>
    );
  };

  const getWafflingColor = (score: number | null) => {
    const s = score || 0;
    if (s <= 25) return "text-success";
    if (s <= 50) return "text-warning";
    return "text-danger";
  };

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

  if (accountLoading) {
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

  if (!account) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Account not found</p>
          <Button variant="link" onClick={() => navigate("/accounts")}>
            Back to Accounts
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/accounts")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{account.company_name}</h1>
                {getStatusBadge(account.decision_certainty)}
              </div>
              <p className="text-muted-foreground mt-1">
                {account.contact_name || "No contact"} • {account.city || "No location"}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditAccountOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Account
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Deals</p>
                  <p className="text-2xl font-semibold">{deals.filter(d => !["signed", "lost"].includes(d.stage)).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Building2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pipeline Value</p>
                  <p className="text-2xl font-semibold">{formatCurrency(deals.reduce((sum, d) => sum + Number(d.value), 0))}</p>
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
                  <p className="text-sm text-muted-foreground">Waffling Score</p>
                  <p className={cn("text-2xl font-semibold", getWafflingColor(account.waffling_score))}>
                    {account.waffling_score || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Contact</p>
                  <p className="text-lg font-medium">{formatDate(account.last_contact_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Accordion type="multiple" defaultValue={["contact", "deals", "email", "notes"]} className="space-y-4">
          {/* Contact Information */}
          <AccordionItem value="contact" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Contact Information</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 md:grid-cols-2 py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{account.contact_email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{account.contact_phone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{account.city || "No location"}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Business Type</p>
                    <p className="font-medium">{account.business_type || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget Range</p>
                    <p className="font-medium">
                      {account.budget_range_low && account.budget_range_high
                        ? `${formatCurrency(account.budget_range_low)} - ${formatCurrency(account.budget_range_high)}`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Active Deals */}
          <AccordionItem value="deals" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Deals & Proposals ({deals.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-4">
                <div className="flex justify-end mb-4">
                  <Button size="sm" onClick={() => setAddDealOpen(true)}>
                    Add Deal
                  </Button>
                </div>
                {deals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No deals yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Publication</TableHead>
                        <TableHead>Ad Size</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>At Risk</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deals.map((deal) => {
                        const title = titles.find(t => t.id === deal.title_id);
                        return (
                          <TableRow key={deal.id}>
                            <TableCell className="font-medium">{title?.name || "Unknown"}</TableCell>
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
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => setEditingDeal(deal)}>
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Email Generator */}
          <AccordionItem value="email" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">Generate Email</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <EmailGenerator account={account} deals={deals} titles={titles} />
            </AccordionContent>
          </AccordionItem>

          {/* Email History */}
          <AccordionItem value="history" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email History ({emailsSent.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-4">
                {emailsSent.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No emails sent yet</p>
                ) : (
                  <div className="space-y-3">
                    {emailsSent.map((email) => (
                      <div key={email.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{email.subject}</p>
                          <Badge variant="outline" className="capitalize">{email.email_type.replace(/_/g, " ")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{email.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDate(email.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Notes */}
          <AccordionItem value="notes" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Notes</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-4">
                <Textarea
                  placeholder="Add notes about this account..."
                  defaultValue={account.notes || ""}
                  className="min-h-[120px]"
                  onBlur={(e) => {
                    if (e.target.value !== (account.notes || "")) {
                      updateNotes.mutate(e.target.value);
                    }
                  }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Dialogs */}
      <AccountFormDialog
        open={editAccountOpen}
        onOpenChange={setEditAccountOpen}
        account={account}
      />
      <DealFormDialog
        open={addDealOpen || !!editingDeal}
        onOpenChange={(open) => {
          if (!open) {
            setAddDealOpen(false);
            setEditingDeal(null);
          }
        }}
        accountId={account.id}
        deal={editingDeal}
        titles={titles}
      />
    </AppLayout>
  );
};

export default AccountDetail;
