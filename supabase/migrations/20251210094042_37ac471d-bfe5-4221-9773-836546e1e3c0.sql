-- Create activities table for tracking all contact interactions
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('positive', 'neutral', 'negative', 'pending')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can read activities"
ON public.activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert activities"
ON public.activities FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update activities"
ON public.activities FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete activities"
ON public.activities FOR DELETE
TO authenticated
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

-- Add index for faster queries
CREATE INDEX idx_activities_account_id ON public.activities(account_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);