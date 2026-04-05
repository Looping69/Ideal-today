-- Create guest_notes table
CREATE TABLE IF NOT EXISTS public.guest_notes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.guest_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Hosts can view their own guest notes"
    ON public.guest_notes FOR SELECT
    USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert their own guest notes"
    ON public.guest_notes FOR INSERT
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own guest notes"
    ON public.guest_notes FOR UPDATE
    USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own guest notes"
    ON public.guest_notes FOR DELETE
    USING (auth.uid() = host_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guest_notes_updated_at
    BEFORE UPDATE ON public.guest_notes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
