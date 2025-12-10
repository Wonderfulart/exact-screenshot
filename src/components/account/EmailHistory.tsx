import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Send, CheckCircle, MessageSquare, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type EmailStatus = Database["public"]["Enums"]["email_status"];

interface EmailHistoryProps {
  accountId: string;
}

export function EmailHistory({ accountId }: EmailHistoryProps) {
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["emails", "account", accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emails_sent")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, sent_at }: { id: string; status: EmailStatus; sent_at?: string }) => {
      const updates: { status: EmailStatus; sent_at?: string } = { status };
      if (sent_at) updates.sent_at = sent_at;
      
      const { error } = await supabase
        .from("emails_sent")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails", "account", accountId] });
      toast.success("Email status updated");
    },
    onError: () => {
      toast.error("Failed to update email status");
    },
  });

  const deleteEmail = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emails_sent")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails", "account", accountId] });
      toast.success("Email deleted");
    },
    onError: () => {
      toast.error("Failed to delete email");
    },
  });

  const handleMarkAsSent = (id: string) => {
    updateStatus.mutate({ id, status: "sent", sent_at: new Date().toISOString() });
  };

  const handleMarkAsReplied = (id: string) => {
    updateStatus.mutate({ id, status: "replied" });
  };

  const getStatusConfig = (status: EmailStatus) => {
    const config: Record<EmailStatus, { icon: typeof Mail; label: string; variant: "default" | "secondary" | "outline" }> = {
      draft: { icon: Clock, label: "Draft", variant: "secondary" },
      sent: { icon: Send, label: "Sent", variant: "default" },
      opened: { icon: CheckCircle, label: "Opened", variant: "default" },
      replied: { icon: MessageSquare, label: "Replied", variant: "default" },
    };
    return config[status];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const emailTypeLabels: Record<string, string> = {
    initial_pitch: "Initial Pitch",
    follow_up: "Follow Up",
    deadline_reminder: "Deadline Reminder",
    win_back: "Win Back",
    thank_you: "Thank You",
  };

  if (isLoading) {
    return (
      <div className="py-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No emails generated yet</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-3">
      {emails.map((email) => {
        const statusConfig = getStatusConfig(email.status);
        const StatusIcon = statusConfig.icon;

        return (
          <Card key={email.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusConfig.variant} className="text-xs">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {emailTypeLabels[email.email_type] || email.email_type}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm truncate">{email.subject}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {email.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {formatDate(email.created_at)}
                    {email.sent_at && ` • Sent: ${formatDate(email.sent_at)}`}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {email.status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsSent(email.id)}
                      disabled={updateStatus.isPending}
                      className="text-xs h-7"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Mark Sent
                    </Button>
                  )}
                  {(email.status === "sent" || email.status === "opened") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsReplied(email.id)}
                      disabled={updateStatus.isPending}
                      className="text-xs h-7"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Mark Replied
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEmail.mutate(email.id)}
                    disabled={deleteEmail.isPending}
                    className="text-xs h-7 text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
