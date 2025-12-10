-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can read templates" ON public.email_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert templates" ON public.email_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update templates" ON public.email_templates FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete templates" ON public.email_templates FOR DELETE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default templates
INSERT INTO public.email_templates (name, email_type, subject_template, body_template, is_default) VALUES
('Initial Pitch - Standard', 'initial_pitch', 'Advertising Partnership Opportunity - {{publication}}', 'Hi {{contact_name}},

I hope this message finds you well. I''m reaching out from {{publication}} to discuss an exciting advertising opportunity that could help {{company_name}} reach thousands of visitors exploring the Pacific Northwest.

Our publication reaches over 50,000 engaged travelers annually who are actively seeking local businesses and experiences. Given your location in {{city}} and your focus on {{business_type}}, I believe there''s a great fit here.

I''d love to schedule a brief call to discuss how we can showcase {{company_name}} to our readers. Would you have 15 minutes this week?

Best regards', true),

('Follow Up - Gentle', 'follow_up', 'Following up on {{publication}} opportunity', 'Hi {{contact_name}},

I wanted to circle back on my previous message about featuring {{company_name}} in {{publication}}. I know things get busy, so I wanted to make sure this didn''t slip through the cracks.

Our deadline is approaching, and I''d hate for you to miss out on this opportunity to connect with our readers.

Do you have a few minutes to chat this week?

Best', true),

('Deadline Reminder - Urgent', 'deadline_reminder', 'Final Days: {{publication}} Deadline Approaching', 'Hi {{contact_name}},

I wanted to give you a heads up that our deadline for {{publication}} is coming up soon. This is the last chance to secure your spot in this year''s edition.

If you''ve been considering advertising with us, now is the time to act. I can help expedite the process if you''re ready to move forward.

Let me know if you have any questions or if you''d like to discuss options.

Best regards', true),

('Win Back - Re-engagement', 'win_back', 'We''d love to work with {{company_name}} again', 'Hi {{contact_name}},

It''s been a while since we last connected, and I wanted to reach out to see how things are going at {{company_name}}.

We have some exciting opportunities coming up with {{publication}} and immediately thought of you. Our readership continues to grow, and I believe your business would resonate well with our audience.

Would you be open to a quick call to explore how we might work together again?

Hope to hear from you soon.

Best', true),

('Thank You - Post-Sale', 'thank_you', 'Welcome to {{publication}} - Next Steps', 'Hi {{contact_name}},

Thank you so much for partnering with {{publication}}! We''re thrilled to have {{company_name}} as part of this year''s edition.

Here''s what happens next:
1. Our design team will reach out about ad specifications
2. You''ll receive a proof for approval before printing
3. We''ll send you copies once published

If you have any questions in the meantime, don''t hesitate to reach out.

Thank you again for your trust in us!

Best regards', true);