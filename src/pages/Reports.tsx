import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/useAccounts";
import { useDeals } from "@/hooks/useDeals";
import { useTitles } from "@/hooks/useTitles";
import { useActivities } from "@/hooks/useActivities";
import { exportToCSV, accountColumns, dealColumns, activityColumns } from "@/lib/exportUtils";
import { toast } from "@/hooks/use-toast";
import {
  FileSpreadsheet,
  Users,
  TrendingUp,
  Clock,
  Calendar,
  Download,
} from "lucide-react";

const Reports = () => {
  const { data: accounts = [] } = useAccounts();
  const { data: deals = [] } = useDeals();
  const { data: titles = [] } = useTitles();
  const { data: activities = [] } = useActivities();

  const handleExportAccounts = () => {
    exportToCSV(accounts, "contact_records", accountColumns);
    toast({ title: "Exported", description: `${accounts.length} contact records exported` });
  };

  const handleExportDeals = () => {
    const exportData = deals.map((deal) => {
      const account = accounts.find((a) => a.id === deal.account_id);
      const title = titles.find((t) => t.id === deal.title_id);
      return {
        ...deal,
        account_name: account?.company_name || "Unknown",
        title_name: title?.name || "Unknown",
      };
    });
    exportToCSV(exportData, "proposals", dealColumns);
    toast({ title: "Exported", description: `${deals.length} proposals exported` });
  };

  const handleExportActivities = () => {
    exportToCSV(activities, "activities", activityColumns);
    toast({ title: "Exported", description: `${activities.length} activities exported` });
  };

  const handleExportAtRisk = () => {
    const atRiskDeals = deals.filter((d) => d.is_at_risk);
    const exportData = atRiskDeals.map((deal) => {
      const account = accounts.find((a) => a.id === deal.account_id);
      const title = titles.find((t) => t.id === deal.title_id);
      return {
        ...deal,
        account_name: account?.company_name || "Unknown",
        title_name: title?.name || "Unknown",
      };
    });
    exportToCSV(exportData, "at_risk_proposals", dealColumns);
    toast({ title: "Exported", description: `${atRiskDeals.length} at-risk proposals exported` });
  };

  const handleExportStaleContacts = () => {
    const now = new Date();
    const staleAccounts = accounts.filter((a) => {
      if (!a.last_contact_date) return true;
      const lastContact = new Date(a.last_contact_date);
      const daysSince = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 7;
    });
    exportToCSV(staleAccounts, "stale_contacts", accountColumns);
    toast({ title: "Exported", description: `${staleAccounts.length} stale contacts exported` });
  };

  const reports = [
    {
      title: "Contact Records",
      description: "Export all contact records with company info, status, and engagement scores",
      icon: Users,
      count: accounts.length,
      action: handleExportAccounts,
    },
    {
      title: "All Proposals",
      description: "Export all proposals with publication, value, stage, and probability",
      icon: TrendingUp,
      count: deals.length,
      action: handleExportDeals,
    },
    {
      title: "Activity Log",
      description: "Export all logged activities including calls, emails, and meetings",
      icon: Clock,
      count: activities.length,
      action: handleExportActivities,
    },
    {
      title: "At-Risk Proposals",
      description: "Export proposals flagged as at-risk for follow-up action",
      icon: Calendar,
      count: deals.filter((d) => d.is_at_risk).length,
      action: handleExportAtRisk,
      variant: "warning" as const,
    },
    {
      title: "Stale Contacts",
      description: "Export contacts with no activity in the last 7 days",
      icon: Users,
      count: accounts.filter((a) => {
        if (!a.last_contact_date) return true;
        const lastContact = new Date(a.last_contact_date);
        const daysSince = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 7;
      }).length,
      action: handleExportStaleContacts,
      variant: "danger" as const,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports & Export</h1>
          <p className="mt-1 text-muted-foreground">
            Download your data for analysis or backup
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.title} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <report.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-2xl font-bold">{report.count}</span>
                </div>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="text-xs">{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={report.action}
                  disabled={report.count === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{accounts.length}</p>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{deals.length}</p>
                <p className="text-sm text-muted-foreground">Total Proposals</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
                    deals.reduce((sum, d) => sum + Number(d.value), 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{activities.length}</p>
                <p className="text-sm text-muted-foreground">Activities Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
