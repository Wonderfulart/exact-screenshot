import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Account = Tables<"accounts">;

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("company_name");
      
      if (error) throw error;
      return data as Account[];
    },
  });
}

export function useNeedsAttentionAccounts() {
  return useQuery({
    queryKey: ["accounts", "needs-attention"],
    queryFn: async () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const fiveDaysAgoStr = fiveDaysAgo.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .or(`waffling_score.gt.50,last_contact_date.lt.${fiveDaysAgoStr}`)
        .order("waffling_score", { ascending: false });
      
      if (error) throw error;
      return data as Account[];
    },
  });
}
