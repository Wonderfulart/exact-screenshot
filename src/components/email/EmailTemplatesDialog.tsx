import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { useEmailTemplates, useCreateEmailTemplate, useUpdateEmailTemplate, useDeleteEmailTemplate, type EmailTemplate } from "@/hooks/useEmailTemplates";
import { toast } from "sonner";

interface EmailTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMAIL_TYPES = [
  { value: "initial_pitch", label: "Initial Pitch" },
  { value: "follow_up", label: "Follow Up" },
  { value: "deadline_reminder", label: "Deadline Reminder" },
  { value: "win_back", label: "Win Back" },
  { value: "thank_you", label: "Thank You" },
];

export function EmailTemplatesDialog({ open, onOpenChange }: EmailTemplatesDialogProps) {
  const [activeTab, setActiveTab] = useState("initial_pitch");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: templates, isLoading } = useEmailTemplates(activeTab);
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();

  const [formData, setFormData] = useState({
    name: "",
    email_type: "initial_pitch",
    subject_template: "",
    body_template: "",
    is_default: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email_type: activeTab,
      subject_template: "",
      body_template: "",
      is_default: false,
    });
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      email_type: template.email_type,
      subject_template: template.subject_template,
      body_template: template.body_template,
      is_default: template.is_default,
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject_template || !formData.body_template) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...formData });
        toast.success("Template updated");
      } else {
        await createTemplate.mutateAsync(formData);
        toast.success("Template created");
      }
      resetForm();
    } catch (error) {
      toast.error("Failed to save template");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate.mutateAsync(id);
        toast.success("Template deleted");
      } catch (error) {
        toast.error("Failed to delete template");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Email Templates
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetForm(); }}>
          <TabsList className="grid grid-cols-5">
            {EMAIL_TYPES.map(type => (
              <TabsTrigger key={type.value} value={type.value} className="text-xs">
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {EMAIL_TYPES.map(type => (
            <TabsContent key={type.value} value={type.value} className="space-y-4">
              {isCreating ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingTemplate ? "Edit Template" : "New Template"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Template Name *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Follow Up - Friendly"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          checked={formData.is_default}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                        />
                        <Label>Set as default template</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Subject Template *</Label>
                      <Input
                        value={formData.subject_template}
                        onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
                        placeholder="e.g., Following up on {{publication}} opportunity"
                      />
                      <p className="text-xs text-muted-foreground">
                        Variables: {"{{contact_name}}"}, {"{{company_name}}"}, {"{{city}}"}, {"{{business_type}}"}, {"{{publication}}"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Body Template *</Label>
                      <Textarea
                        value={formData.body_template}
                        onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                        rows={8}
                        placeholder="Hi {{contact_name}},..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={createTemplate.isPending || updateTemplate.isPending}>
                        {editingTemplate ? "Update" : "Create"} Template
                      </Button>
                      <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Button onClick={() => { setIsCreating(true); setFormData({ ...formData, email_type: type.value }); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>

                  {isLoading ? (
                    <p className="text-muted-foreground">Loading templates...</p>
                  ) : templates?.length === 0 ? (
                    <p className="text-muted-foreground">No templates for this type yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {templates?.map(template => (
                        <Card key={template.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{template.name}</h4>
                                  {template.is_default && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{template.subject_template}</p>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{template.body_template}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
