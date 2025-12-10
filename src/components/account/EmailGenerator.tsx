import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Copy, Check, Loader2, Save } from "lucide-react";
import { useGenerateEmail } from "@/hooks/useGenerateEmail";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Account } from "@/hooks/useAccounts";
import type { Deal } from "@/hooks/useDeals";
import type { Title } from "@/hooks/useTitles";
import type { Database } from "@/integrations/supabase/types";

type EmailType = Database["public"]["Enums"]["email_type"];

interface EmailGeneratorProps {
  account: Account;
  deals: Deal[];
  titles: Title[];
}

const emailTypeLabels: Record<EmailType, string> = {
  initial_pitch: "Initial Pitch",
  follow_up: "Follow Up",
  deadline_reminder: "Deadline Reminder",
  win_back: "Win Back",
  thank_you: "Thank You",
};

export function EmailGenerator({ account, deals, titles }: EmailGeneratorProps) {
  const [emailType, setEmailType] = useState<EmailType>("follow_up");
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const [customContext, setCustomContext] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const generateEmail = useGenerateEmail();

  const saveEmail = useMutation({
    mutationFn: async () => {
      if (!generatedEmail) return;
      const { error } = await supabase.from("emails_sent").insert({
        account_id: account.id,
        deal_id: selectedDealId || null,
        email_type: emailType,
        subject: generatedEmail.subject,
        body: generatedEmail.body,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails", "account", account.id] });
      toast.success("Email saved to history");
    },
    onError: () => {
      toast.error("Failed to save email");
    },
  });

  const handleGenerate = async () => {
    const selectedDeal = deals.find((d) => d.id === selectedDealId);
    const selectedTitle = selectedDeal ? titles.find((t) => t.id === selectedDeal.title_id) : null;

    try {
      const result = await generateEmail.mutateAsync({
        account,
        deal: selectedDeal,
        title: selectedTitle,
        emailType,
        customContext: customContext || undefined,
      });
      setGeneratedEmail(result);
    } catch (error) {
      toast.error("Failed to generate email");
    }
  };

  const handleCopy = async () => {
    if (!generatedEmail) return;
    const text = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-2 block">Email Type</label>
          <Select value={emailType} onValueChange={(v) => setEmailType(v as EmailType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(emailTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Related Deal (Optional)</label>
          <Select value={selectedDealId} onValueChange={setSelectedDealId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a deal..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {deals.map((deal) => {
                const title = titles.find((t) => t.id === deal.title_id);
                return (
                  <SelectItem key={deal.id} value={deal.id}>
                    {title?.name} - {deal.ad_size.replace(/_/g, " ")}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Custom Context (Optional)</label>
        <Textarea
          placeholder="Add any specific context for this email (e.g., recent meeting notes, special offers, etc.)"
          value={customContext}
          onChange={(e) => setCustomContext(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      <Button onClick={handleGenerate} disabled={generateEmail.isPending} className="w-full">
        {generateEmail.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Email
          </>
        )}
      </Button>

      {generatedEmail && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Subject</p>
                <p className="font-medium">{generatedEmail.subject}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Body</p>
                <div className="whitespace-pre-wrap text-sm bg-background rounded-lg p-4 border">
                  {generatedEmail.body}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopy} className="flex-1">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveEmail.mutate()}
                  disabled={saveEmail.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save to History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
