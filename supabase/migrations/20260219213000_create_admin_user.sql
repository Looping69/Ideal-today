-- Add admin email to invited list
INSERT INTO public.admin_invites (email)
VALUES ('admin@idealstay.co.za')
ON CONFLICT (email) DO NOTHING;

-- Grant admin privileges to the user if they already exist
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@idealstay.co.za';
