import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Account } from "@/hooks/useAccounts";

const accountSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  contact_name: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  city: z.string().optional(),
  business_type: z.string().optional(),
  budget_range_low: z.coerce.number().optional(),
  budget_range_high: z.coerce.number().optional(),
  decision_certainty: z.enum(["firm", "leaning", "waffling", "at_risk"]).optional(),
  waffling_score: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
}

export function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!account;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      company_name: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      city: "",
      business_type: "",
      budget_range_low: undefined,
      budget_range_high: undefined,
      decision_certainty: "leaning",
      waffling_score: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        company_name: account.company_name,
        contact_name: account.contact_name || "",
        contact_email: account.contact_email || "",
        contact_phone: account.contact_phone || "",
        city: account.city || "",
        business_type: account.business_type || "",
        budget_range_low: account.budget_range_low || undefined,
        budget_range_high: account.budget_range_high || undefined,
        decision_certainty: account.decision_certainty || "leaning",
        waffling_score: account.waffling_score || 0,
        notes: account.notes || "",
      });
    } else {
      form.reset({
        company_name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        city: "",
        business_type: "",
        budget_range_low: undefined,
        budget_range_high: undefined,
        decision_certainty: "leaning",
        waffling_score: 0,
        notes: "",
      });
    }
  }, [account, form]);

  const mutation = useMutation({
    mutationFn: async (values: AccountFormValues) => {
      if (isEditing && account) {
        const { error } = await supabase
          .from("accounts")
          .update({
            company_name: values.company_name,
            contact_name: values.contact_name || null,
            contact_email: values.contact_email || null,
            contact_phone: values.contact_phone || null,
            city: values.city || null,
            business_type: values.business_type || null,
            budget_range_low: values.budget_range_low || null,
            budget_range_high: values.budget_range_high || null,
            decision_certainty: values.decision_certainty || null,
            waffling_score: values.waffling_score || null,
            notes: values.notes || null,
          })
          .eq("id", account.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounts").insert({
          company_name: values.company_name,
          contact_name: values.contact_name || null,
          contact_email: values.contact_email || null,
          contact_phone: values.contact_phone || null,
          city: values.city || null,
          business_type: values.business_type || null,
          budget_range_low: values.budget_range_low || null,
          budget_range_high: values.budget_range_high || null,
          decision_certainty: values.decision_certainty || null,
          waffling_score: values.waffling_score || null,
          notes: values.notes || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
      toast.success(isEditing ? "Account updated" : "Account created");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save account");
    },
  });

  const onSubmit = (values: AccountFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Account" : "Add New Account"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="business_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget_range_low"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Min ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget_range_high"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Max ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="decision_certainty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="firm">Firm</SelectItem>
                        <SelectItem value="leaning">Leaning</SelectItem>
                        <SelectItem value="waffling">Waffling</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="waffling_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waffling Score (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Account"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
