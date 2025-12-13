import { AppLayout } from "@/components/layout/AppLayout";
import { EmailQueue } from "@/components/email/EmailQueue";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, Send, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function EmailQueuePage() {
  const { data: stats } = useQuery({
    queryKey: ["email_stats"],
    queryFn: async () => {
      const [scheduled, drafts, sent] = await Promise.all([
        supabase
          .from("emails_sent")
          .select("id", { count: "exact" })
          .not("scheduled_at", "is", null)
          .eq("status", "draft"),
        supabase
          .from("emails_sent")
          .select("id", { count: "exact" })
          .is("scheduled_at", null)
          .eq("status", "draft"),
        supabase
          .from("emails_sent")
          .select("id", { count: "exact" })
          .eq("status", "sent"),
      ]);
      
      return {
        scheduled: scheduled.count || 0,
        drafts: drafts.count || 0,
        sent: sent.count || 0,
      };
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Email Queue</h1>
          <p className="text-muted-foreground">Manage your scheduled and draft emails</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CalendarClock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.scheduled || 0}</p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.drafts || 0}</p>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <Send className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.sent || 0}</p>
                  <p className="text-sm text-muted-foreground">Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Emails</CardTitle>
            <CardDescription>
              Emails waiting to be sent. Remember to actually send them at the scheduled time!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailQueue />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
