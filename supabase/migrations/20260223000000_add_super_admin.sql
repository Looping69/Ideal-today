-- Add super admin email to invited list
INSERT INTO public.admin_invites (email)
VALUES ('super@idealstay.co.za')
ON CONFLICT (email) DO NOTHING;

-- Grant admin privileges to the user if they already exist
UPDATE public.profiles
SET is_admin = true
WHERE email = 'super@idealstay.co.za';
