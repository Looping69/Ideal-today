-- Add email templates to admin_settings
alter table public.admin_settings
add column if not exists welcome_email_template text default 'Welcome to Ideal Stay! We are glad to have you.',
add column if not exists booking_confirmation_template text default 'Your booking has been confirmed. Enjoy your stay!';
