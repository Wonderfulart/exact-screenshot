import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Deal = Tables<"deals">;

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Deal[];
    },
  });
}

export function useAtRiskDeals() {
  return useQuery({
    queryKey: ["deals", "at-risk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("is_at_risk", true)
        .not("stage", "in", "(signed,lost)")
        .order("value", { ascending: false });
      
      if (error) throw error;
      return data as Deal[];
    },
  });
}
