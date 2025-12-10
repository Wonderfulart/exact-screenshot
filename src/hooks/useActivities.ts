import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Activity {
  id: string;
  account_id: string;
  deal_id: string | null;
  activity_type: "call" | "email" | "meeting" | "note" | "task";
  title: string;
  description: string | null;
  outcome: "positive" | "neutral" | "negative" | "pending" | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityInput {
  account_id: string;
  deal_id?: string | null;
  activity_type: Activity["activity_type"];
  title: string;
  description?: string | null;
  outcome?: Activity["outcome"];
  scheduled_at?: string | null;
  completed_at?: string | null;
}

export function useActivities(accountId?: string) {
  return useQuery({
    queryKey: ["activities", accountId],
    queryFn: async () => {
      let query = supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false });

      if (accountId) {
        query = query.eq("account_id", accountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!accountId || accountId === undefined,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data, error } = await supabase
        .from("activities")
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      // Update the account's last_contact_date
      if (input.activity_type !== "task") {
        await supabase
          .from("accounts")
          .update({ last_contact_date: new Date().toISOString().split("T")[0] })
          .eq("id", input.account_id);
      }

      return data as Activity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({
        title: "Activity logged",
        description: `${data.title} has been recorded.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to log activity: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Activity> & { id: string }) => {
      const { data, error } = await supabase
        .from("activities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({
        title: "Activity updated",
        description: "The activity has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update activity: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({
        title: "Activity deleted",
        description: "The activity has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete activity: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
