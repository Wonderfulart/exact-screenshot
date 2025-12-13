-- Add scheduled_at column to emails_sent table for scheduling emails
ALTER TABLE public.emails_sent 
ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Add index for efficient queue queries
CREATE INDEX idx_emails_sent_scheduled_at ON public.emails_sent(scheduled_at) 
WHERE scheduled_at IS NOT NULL AND status = 'draft';