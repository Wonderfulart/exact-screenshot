import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { account, deal, emailType, title, customContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const emailTypePrompts: Record<string, string> = {
      initial_pitch: `Write an initial pitch email introducing the advertising opportunity.`,
      follow_up: `Write a friendly follow-up email checking in on their decision.`,
      deadline_reminder: `Write a deadline reminder email with urgency but remain professional.`,
      win_back: `Write a win-back email to re-engage a cold or lost prospect.`,
      thank_you: `Write a thank you email after they've signed the contract.`,
    };

    const systemPrompt = `You are a warm, professional ad sales representative for Pacific Northwest tourism publications. 
Your tone is:
- Friendly and relationship-focused, never pushy
- Professional but personable
- Knowledgeable about Oregon tourism
- Focused on partnership and mutual benefit

Write emails that feel personal, not templated. Use the contact's first name. Keep emails concise (under 200 words).
Never use phrases like "I hope this email finds you well" or other clichés.
Reference specific details about their business when relevant.`;

    const userPrompt = `${emailTypePrompts[emailType] || emailTypePrompts.follow_up}

Account Details:
- Company: ${account.company_name}
- Contact: ${account.contact_name}
- Business Type: ${account.business_type}
- City: ${account.city}

${deal ? `Deal Details:
- Publication: ${title?.name || 'Tourism Publication'}
- Ad Size: ${deal.ad_size?.replace('_', ' ')}
- Value: $${deal.value}
- Stage: ${deal.stage?.replace('_', ' ')}` : ''}

${customContext ? `Additional Context: ${customContext}` : ''}

Generate a subject line and email body. Format as:
SUBJECT: [subject line]
BODY:
[email body]`;

    console.log("Generating email for:", account.company_name, "Type:", emailType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse subject and body
    const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/i);
    const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i);
    
    const subject = subjectMatch?.[1]?.trim() || "Following up on advertising opportunity";
    const body = bodyMatch?.[1]?.trim() || content;

    console.log("Email generated successfully");

    return new Response(
      JSON.stringify({ subject, body }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
