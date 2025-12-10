import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Title = Tables<"titles">;

export function useTitles() {
  return useQuery({
    queryKey: ["titles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("titles")
        .select("*")
        .order("deadline");
      
      if (error) throw error;
      return data as Title[];
    },
  });
}
