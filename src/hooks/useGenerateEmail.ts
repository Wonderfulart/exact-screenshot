import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Account } from "./useAccounts";
import type { Deal } from "./useDeals";
import type { Title } from "./useTitles";

interface GenerateEmailParams {
  account: Account;
  deal?: Deal | null;
  title?: Title | null;
  emailType: "initial_pitch" | "follow_up" | "deadline_reminder" | "win_back" | "thank_you";
  customContext?: string;
}

interface GenerateEmailResponse {
  subject: string;
  body: string;
}

export function useGenerateEmail() {
  return useMutation({
    mutationFn: async (params: GenerateEmailParams): Promise<GenerateEmailResponse> => {
      const { data, error } = await supabase.functions.invoke("generate-email", {
        body: params,
      });
      
      if (error) {
        console.error("Email generation error:", error);
        throw new Error(error.message || "Failed to generate email");
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data as GenerateEmailResponse;
    },
  });
}
