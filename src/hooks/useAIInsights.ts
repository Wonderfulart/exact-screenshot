import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Priority {
  label: string;
  type: "danger" | "warning" | "success";
}

interface AIInsightsResponse {
  priorities: Priority[];
  greeting: string;
}

export function useAIInsights() {
  return useQuery({
    queryKey: ["ai-insights"],
    queryFn: async (): Promise<AIInsightsResponse> => {
      const { data, error } = await supabase.functions.invoke("ai-insights");
      
      if (error) {
        console.error("AI insights error:", error);
        return {
          priorities: [
            { label: "Review your at-risk deals today", type: "danger" },
            { label: "Check accounts needing attention", type: "warning" },
            { label: "Follow up on pending contracts", type: "success" },
          ],
          greeting: "Good day! Here's your sales snapshot.",
        };
      }
      
      return data as AIInsightsResponse;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}
