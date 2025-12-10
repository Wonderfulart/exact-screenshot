-- Create enums for constrained values
CREATE TYPE public.decision_certainty AS ENUM ('firm', 'leaning', 'waffling', 'at_risk');
CREATE TYPE public.deal_stage AS ENUM ('prospect', 'pitched', 'negotiating', 'verbal_yes', 'contract_sent', 'signed', 'lost');
CREATE TYPE public.ad_size AS ENUM ('quarter_page', 'half_page', 'full_page', 'two_page_spread');
CREATE TYPE public.email_type AS ENUM ('initial_pitch', 'follow_up', 'deadline_reminder', 'win_back', 'thank_you');
CREATE TYPE public.email_status AS ENUM ('draft', 'sent', 'opened', 'replied');

-- Create titles (publications) table
CREATE TABLE public.titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT NOT NULL,
  revenue_goal DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_booked DECIMAL(10,2) NOT NULL DEFAULT 0,
  pages_goal INTEGER NOT NULL DEFAULT 0,
  pages_sold INTEGER NOT NULL DEFAULT 0,
  deadline DATE,
  rate_full_page DECIMAL(10,2),
  rate_half_page DECIMAL(10,2),
  rate_quarter_page DECIMAL(10,2),
  rate_two_page_spread DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create accounts (advertisers/contact records) table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  business_type TEXT,
  city TEXT,
  budget_range_low DECIMAL(10,2),
  budget_range_high DECIMAL(10,2),
  notes TEXT,
  waffling_score INTEGER DEFAULT 0 CHECK (waffling_score >= 0 AND waffling_score <= 100),
  decision_certainty decision_certainty DEFAULT 'leaning',
  last_contact_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create deals (proposals) table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title_id UUID NOT NULL REFERENCES public.titles(id) ON DELETE CASCADE,
  ad_size ad_size NOT NULL,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  stage deal_stage NOT NULL DEFAULT 'prospect',
  is_at_risk BOOLEAN NOT NULL DEFAULT false,
  probability INTEGER DEFAULT 25 CHECK (probability >= 0 AND probability <= 100),
  last_activity_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create emails_sent table
CREATE TABLE public.emails_sent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  email_type email_type NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status email_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails_sent ENABLE ROW LEVEL SECURITY;

-- Create public read policies (this is a single-user/team app, data is shared)
CREATE POLICY "Allow public read on titles" ON public.titles FOR SELECT USING (true);
CREATE POLICY "Allow public read on accounts" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Allow public read on deals" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Allow public read on emails_sent" ON public.emails_sent FOR SELECT USING (true);

-- Create authenticated write policies
CREATE POLICY "Authenticated users can insert titles" ON public.titles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update titles" ON public.titles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete titles" ON public.titles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update accounts" ON public.accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete accounts" ON public.accounts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update deals" ON public.deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete deals" ON public.deals FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert emails" ON public.emails_sent FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update emails" ON public.emails_sent FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete emails" ON public.emails_sent FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_deals_account_id ON public.deals(account_id);
CREATE INDEX idx_deals_title_id ON public.deals(title_id);
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_emails_account_id ON public.emails_sent(account_id);
CREATE INDEX idx_accounts_decision_certainty ON public.accounts(decision_certainty);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_titles_updated_at BEFORE UPDATE ON public.titles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();