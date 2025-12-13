import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, Clock, Trash2, Send, Building2, Edit } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { toast } from "sonner";

interface ScheduledEmail {
  id: string;
  subject: string;
  body: string;
  email_type: string;
  scheduled_at: string;
  created_at: string;
  account_id: string;
  accounts?: { company_name: string } | null;
}

const emailTypeLabels: Record<string, string> = {
  initial_pitch: "Initial Pitch",
  follow_up: "Follow Up",
  deadline_reminder: "Deadline Reminder",
  win_back: "Win Back",
  thank_you: "Thank You",
};

export function EmailQueue() {
  const queryClient = useQueryClient();

  const { data: scheduledEmails, isLoading } = useQuery({
    queryKey: ["scheduled_emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emails_sent")
        .select("*, accounts(company_name)")
        .not("scheduled_at", "is", null)
        .eq("status", "draft")
        .order("scheduled_at", { ascending: true });
      
      if (error) throw error;
      return data as ScheduledEmail[];
    },
  });

  const cancelSchedule = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from("emails_sent")
        .update({ scheduled_at: null })
        .eq("id", emailId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_emails"] });
      toast.success("Email unscheduled");
    },
  });

  const deleteEmail = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from("emails_sent")
        .delete()
        .eq("id", emailId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_emails"] });
      toast.success("Email deleted");
    },
  });

  const markAsSent = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from("emails_sent")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", emailId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_emails"] });
      toast.success("Email marked as sent");
    },
  });

  const formatScheduleTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow at ${format(date, "h:mm a")}`;
    return format(date, "MMM d 'at' h:mm a");
  };

  const getStatusBadge = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date)) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    }
    if (isToday(date)) {
      return <Badge className="bg-warning text-warning-foreground text-xs">Today</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Scheduled</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!scheduledEmails?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No scheduled emails</p>
          <p className="text-xs text-muted-foreground mt-1">
            Draft a pitch and schedule it for later
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Email Queue
        </h3>
        <Badge variant="outline">{scheduledEmails.length} scheduled</Badge>
      </div>

      {scheduledEmails.map((email) => (
        <Card key={email.id} className="hover:shadow-md transition-shadow">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(email.scheduled_at)}
                  <Badge variant="outline" className="text-xs">
                    {emailTypeLabels[email.email_type] || email.email_type}
                  </Badge>
                </div>
                <h4 className="font-medium truncate">{email.subject}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {email.accounts?.company_name || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatScheduleTime(email.scheduled_at)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => markAsSent.mutate(email.id)}
                  title="Mark as sent"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => cancelSchedule.mutate(email.id)}
                  title="Unschedule"
                >
                  <CalendarClock className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteEmail.mutate(email.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
