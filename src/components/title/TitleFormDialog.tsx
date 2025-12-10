import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Title } from "@/hooks/useTitles";

const titleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  region: z.string().min(1, "Region is required"),
  description: z.string().optional(),
  deadline: z.string().optional(),
  revenue_goal: z.coerce.number().min(0).default(0),
  revenue_booked: z.coerce.number().min(0).default(0),
  pages_goal: z.coerce.number().int().min(0).default(0),
  pages_sold: z.coerce.number().int().min(0).default(0),
  rate_quarter_page: z.coerce.number().min(0).nullable().optional(),
  rate_half_page: z.coerce.number().min(0).nullable().optional(),
  rate_full_page: z.coerce.number().min(0).nullable().optional(),
  rate_two_page_spread: z.coerce.number().min(0).nullable().optional(),
});

type TitleFormValues = z.infer<typeof titleSchema>;

interface TitleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: Title | null;
}

export function TitleFormDialog({ open, onOpenChange, title }: TitleFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!title;

  const form = useForm<TitleFormValues>({
    resolver: zodResolver(titleSchema),
    defaultValues: {
      name: "",
      region: "",
      description: "",
      deadline: "",
      revenue_goal: 0,
      revenue_booked: 0,
      pages_goal: 0,
      pages_sold: 0,
      rate_quarter_page: null,
      rate_half_page: null,
      rate_full_page: null,
      rate_two_page_spread: null,
    },
  });

  useEffect(() => {
    if (title) {
      form.reset({
        name: title.name,
        region: title.region,
        description: title.description || "",
        deadline: title.deadline || "",
        revenue_goal: Number(title.revenue_goal) || 0,
        revenue_booked: Number(title.revenue_booked) || 0,
        pages_goal: title.pages_goal || 0,
        pages_sold: title.pages_sold || 0,
        rate_quarter_page: title.rate_quarter_page ? Number(title.rate_quarter_page) : null,
        rate_half_page: title.rate_half_page ? Number(title.rate_half_page) : null,
        rate_full_page: title.rate_full_page ? Number(title.rate_full_page) : null,
        rate_two_page_spread: title.rate_two_page_spread ? Number(title.rate_two_page_spread) : null,
      });
    } else {
      form.reset({
        name: "",
        region: "",
        description: "",
        deadline: "",
        revenue_goal: 0,
        revenue_booked: 0,
        pages_goal: 0,
        pages_sold: 0,
        rate_quarter_page: null,
        rate_half_page: null,
        rate_full_page: null,
        rate_two_page_spread: null,
      });
    }
  }, [title, form]);

  const mutation = useMutation({
    mutationFn: async (values: TitleFormValues) => {
      const payload = {
        name: values.name,
        region: values.region,
        description: values.description || null,
        deadline: values.deadline || null,
        revenue_goal: values.revenue_goal,
        revenue_booked: values.revenue_booked,
        pages_goal: values.pages_goal,
        pages_sold: values.pages_sold,
        rate_quarter_page: values.rate_quarter_page || null,
        rate_half_page: values.rate_half_page || null,
        rate_full_page: values.rate_full_page || null,
        rate_two_page_spread: values.rate_two_page_spread || null,
      };

      if (isEditing && title) {
        const { error } = await supabase
          .from("titles")
          .update(payload)
          .eq("id", title.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("titles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["titles"] });
      queryClient.invalidateQueries({ queryKey: ["title"] });
      toast.success(isEditing ? "Publication updated" : "Publication created");
      onOpenChange(false);
    },
    onError: () => {
      toast.error(isEditing ? "Failed to update publication" : "Failed to create publication");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!title) return;
      const { error } = await supabase.from("titles").delete().eq("id", title.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["titles"] });
      toast.success("Publication deleted");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to delete publication");
    },
  });

  const onSubmit = (values: TitleFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Publication" : "Add Publication"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Publication name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Northeast, Midwest" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Publication description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Goals & Progress</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="revenue_goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenue Goal ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="revenue_booked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenue Booked ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pages_goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pages Goal</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pages_sold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pages Sold</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Rate Card</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rate_quarter_page"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quarter Page Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate_half_page"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Half Page Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate_full_page"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Page Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate_two_page_spread"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Two Page Spread Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  Delete Publication
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Save Changes" : "Create Publication"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
