import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Copy, Check, Sparkles, FileText, Save } from "lucide-react";
import { useGenerateEmail } from "@/hooks/useGenerateEmail";
import { useEmailTemplates, type EmailTemplate } from "@/hooks/useEmailTemplates";
import { useCreateActivity } from "@/hooks/useActivities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Account } from "@/hooks/useAccounts";
import type { Deal } from "@/hooks/useDeals";
import type { Title } from "@/hooks/useTitles";

interface QuickEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account;
  deal?: Deal | null;
  title?: Title | null;
}

const EMAIL_TYPES = [
  { value: "initial_pitch", label: "Initial Pitch" },
  { value: "follow_up", label: "Follow Up" },
  { value: "deadline_reminder", label: "Deadline Reminder" },
  { value: "win_back", label: "Win Back" },
  { value: "thank_you", label: "Thank You" },
];

function applyTemplateVariables(text: string, account: Account, title?: Title | null): string {
  return text
    .replace(/\{\{contact_name\}\}/g, account.contact_name?.split(" ")[0] || "there")
    .replace(/\{\{company_name\}\}/g, account.company_name || "")
    .replace(/\{\{city\}\}/g, account.city || "your area")
    .replace(/\{\{business_type\}\}/g, account.business_type || "your business")
    .replace(/\{\{publication\}\}/g, title?.name || "our publication");
}

export function QuickEmailDialog({ open, onOpenChange, account, deal, title }: QuickEmailDialogProps) {
  const [emailType, setEmailType] = useState<string>("follow_up");
  const [customContext, setCustomContext] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const generateEmail = useGenerateEmail();
  const { data: templates } = useEmailTemplates(emailType);
  const createActivity = useCreateActivity();
  const queryClient = useQueryClient();

  const saveEmail = useMutation({
    mutationFn: async (email: { subject: string; body: string }) => {
      const { error } = await supabase.from("emails_sent").insert({
        account_id: account.id,
        deal_id: deal?.id || null,
        email_type: emailType as "initial_pitch" | "follow_up" | "deadline_reminder" | "win_back" | "thank_you",
        subject: email.subject,
        body: email.body,
        status: "draft" as const,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails_sent"] });
      createActivity.mutate({
        account_id: account.id,
        deal_id: deal?.id,
        activity_type: "email",
        title: `Email draft saved: ${generatedEmail?.subject}`,
        description: `Email type: ${EMAIL_TYPES.find(t => t.value === emailType)?.label}`,
        completed_at: new Date().toISOString(),
      });
      toast.success("Email saved to history");
    },
  });

  const handleGenerateAI = async () => {
    try {
      const result = await generateEmail.mutateAsync({
        account,
        deal,
        title,
        emailType: emailType as any,
        customContext,
      });
      setGeneratedEmail(result);
    } catch (error) {
      toast.error("Failed to generate email");
    }
  };

  const handleApplyTemplate = () => {
    const template = templates?.find(t => t.id === selectedTemplateId);
    if (template) {
      setGeneratedEmail({
        subject: applyTemplateVariables(template.subject_template, account, title),
        body: applyTemplateVariables(template.body_template, account, title),
      });
    }
  };

  const handleCopy = () => {
    if (generatedEmail) {
      navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    if (generatedEmail) {
      saveEmail.mutate(generatedEmail);
    }
  };

  const resetState = () => {
    setGeneratedEmail(null);
    setCustomContext("");
    setSelectedTemplateId("");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetState(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Email - {account.company_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Type</Label>
              <Select value={emailType} onValueChange={(v) => { setEmailType(v); setSelectedTemplateId(""); setGeneratedEmail(null); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Generation Method</Label>
              <div className="flex gap-2">
                <Button
                  variant={!useTemplate ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setUseTemplate(false)}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Generate
                </Button>
                <Button
                  variant={useTemplate ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setUseTemplate(true)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Template
                </Button>
              </div>
            </div>
          </div>

          {!useTemplate ? (
            <div className="space-y-2">
              <Label>Additional Context (optional)</Label>
              <Textarea
                placeholder="Add any specific details or context for the AI..."
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                rows={2}
              />
              <Button onClick={handleGenerateAI} disabled={generateEmail.isPending} className="w-full">
                {generateEmail.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} {template.is_default && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleApplyTemplate} disabled={!selectedTemplateId} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Apply Template
              </Button>
            </div>
          )}

          {generatedEmail && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <p className="font-medium">{generatedEmail.subject}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Body</Label>
                  <p className="whitespace-pre-wrap text-sm">{generatedEmail.body}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saveEmail.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    Save to History
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {deal && (
            <div className="text-xs text-muted-foreground">
              Related Proposal: {title?.name} - ${deal.value?.toLocaleString()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
