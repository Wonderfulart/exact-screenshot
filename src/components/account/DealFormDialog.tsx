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
import { Switch } from "@/components/ui/switch";
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
import type { Deal } from "@/hooks/useDeals";
import type { Title } from "@/hooks/useTitles";

const dealSchema = z.object({
  title_id: z.string().min(1, "Publication is required"),
  ad_size: z.enum(["quarter_page", "half_page", "full_page", "two_page_spread"]),
  value: z.coerce.number().min(0, "Value must be positive"),
  stage: z.enum(["prospect", "pitched", "negotiating", "verbal_yes", "contract_sent", "signed", "lost"]),
  probability: z.coerce.number().min(0).max(100).optional(),
  is_at_risk: z.boolean(),
  notes: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  deal?: Deal | null;
  titles: Title[];
}

const adSizeLabels: Record<string, string> = {
  quarter_page: "Quarter Page",
  half_page: "Half Page",
  full_page: "Full Page",
  two_page_spread: "Two Page Spread",
};

const stageLabels: Record<string, string> = {
  prospect: "Prospect",
  pitched: "Pitched",
  negotiating: "Negotiating",
  verbal_yes: "Verbal Yes",
  contract_sent: "Contract Sent",
  signed: "Signed",
  lost: "Lost",
};

export function DealFormDialog({ open, onOpenChange, accountId, deal, titles }: DealFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!deal;

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title_id: "",
      ad_size: "full_page",
      value: 0,
      stage: "prospect",
      probability: 25,
      is_at_risk: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (deal) {
      form.reset({
        title_id: deal.title_id,
        ad_size: deal.ad_size,
        value: Number(deal.value),
        stage: deal.stage,
        probability: deal.probability || 25,
        is_at_risk: deal.is_at_risk,
        notes: deal.notes || "",
      });
    } else {
      form.reset({
        title_id: "",
        ad_size: "full_page",
        value: 0,
        stage: "prospect",
        probability: 25,
        is_at_risk: false,
        notes: "",
      });
    }
  }, [deal, form]);

  // Auto-calculate value based on title rates
  const selectedTitleId = form.watch("title_id");
  const selectedAdSize = form.watch("ad_size");

  useEffect(() => {
    if (!isEditing && selectedTitleId && selectedAdSize) {
      const title = titles.find((t) => t.id === selectedTitleId);
      if (title) {
        const rateMap: Record<string, number | null> = {
          quarter_page: title.rate_quarter_page,
          half_page: title.rate_half_page,
          full_page: title.rate_full_page,
          two_page_spread: title.rate_two_page_spread,
        };
        const rate = rateMap[selectedAdSize];
        if (rate) {
          form.setValue("value", rate);
        }
      }
    }
  }, [selectedTitleId, selectedAdSize, titles, form, isEditing]);

  const mutation = useMutation({
    mutationFn: async (values: DealFormValues) => {
      if (isEditing && deal) {
        const { error } = await supabase
          .from("deals")
          .update({
            title_id: values.title_id,
            ad_size: values.ad_size,
            value: values.value,
            stage: values.stage,
            probability: values.probability || null,
            is_at_risk: values.is_at_risk,
            notes: values.notes || null,
          })
          .eq("id", deal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("deals").insert({
          account_id: accountId,
          title_id: values.title_id,
          ad_size: values.ad_size,
          value: values.value,
          stage: values.stage,
          probability: values.probability || null,
          is_at_risk: values.is_at_risk,
          notes: values.notes || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success(isEditing ? "Deal updated" : "Deal created");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save deal");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return;
      const { error } = await supabase.from("deals").delete().eq("id", deal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal deleted");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete deal");
    },
  });

  const onSubmit = (values: DealFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Deal" : "Add New Deal"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publication *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select publication..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {titles.map((title) => (
                        <SelectItem key={title.id} value={title.id}>
                          {title.name} ({title.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="ad_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Size</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(adSizeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(stageLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability (%)</FormLabel>
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
              name="is_at_risk"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">At Risk</FormLabel>
                    <p className="text-sm text-muted-foreground">Mark this deal as at risk</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
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
            <div className="flex justify-between pt-4">
              {isEditing ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Save Changes" : "Create Deal"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
