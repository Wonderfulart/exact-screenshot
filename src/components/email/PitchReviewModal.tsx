import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, Copy, Save, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { EmailScheduler } from "./EmailScheduler";

interface PitchReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: { subject: string; body: string } | null;
  onApprove: (email: { subject: string; body: string }, scheduledAt: Date | null) => void;
  isSaving?: boolean;
}

export function PitchReviewModal({ 
  open, 
  onOpenChange, 
  email, 
  onApprove,
  isSaving = false 
}: PitchReviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    if (email) {
      setEditedSubject(email.subject);
      setEditedBody(email.body);
    }
  }, [email]);

  useEffect(() => {
    if (!open) {
      setScheduledAt(null);
      setShowScheduler(false);
    }
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${editedSubject}\n\n${editedBody}`);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = () => {
    onApprove({ subject: editedSubject, body: editedBody }, scheduledAt);
  };

  if (!email) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Review Your Pitch</DialogTitle>
          <DialogDescription>
            Review and edit your email before saving. Take a moment to personalize it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">Subject Line</Label>
            {isEditing ? (
              <Input
                id="subject"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="font-medium"
              />
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="font-medium">{editedSubject}</p>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body" className="text-sm font-medium">Email Body</Label>
            {isEditing ? (
              <Textarea
                id="body"
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={10}
                className="resize-none"
              />
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 border min-h-[150px] max-h-[200px] overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{editedBody}</p>
              </div>
            )}
          </div>

          {/* Schedule Section */}
          {showScheduler ? (
            <div className="border rounded-lg p-4 bg-muted/30">
              <EmailScheduler scheduledAt={scheduledAt} onScheduleChange={setScheduledAt} />
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowScheduler(true)}
              className="w-full gap-2"
            >
              <CalendarClock className="h-4 w-4" />
              Schedule for Later
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              {isEditing ? "Done Editing" : "Edit Manually"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          
          <Button 
            onClick={handleApprove}
            disabled={isSaving}
            size="lg"
            className="bg-success hover:bg-success/90 text-success-foreground gap-2"
          >
            {scheduledAt ? <CalendarClock className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : scheduledAt ? "Schedule Send" : "Approve & Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
