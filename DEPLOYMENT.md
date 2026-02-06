# Deployment Guide for Ideal Stay

Your application is production-ready! Here is how to deploy it to the world.

## Option 1: Netlify (Recommended)
Netlify is excellent for Vite/React applications and offers a generous free tier.

1.  **Push to GitHub**: Ensure your latest code is pushed to your GitHub repository.
2.  **Log in to Netlify**: Go to [netlify.com](https://www.netlify.com) and log in.
3.  **Add New Site**: Click "Add new site" -> "Import from existing project".
4.  **Connect GitHub**: Select GitHub and choose your `Ideal-today` repository.
5.  **Configure Build**:
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
    *   *Note: The included `netlify.toml` file will handle routing automatically.*
6.  **Environment Variables**:
    Click "Show advanced" or go to "Site settings" -> "Environment variables" and add the following keys from your `.env` file:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `VITE_GOOGLE_MAPS_KEY`
    *   `VITE_YOCO_PUBLIC_KEY` (Use your LIVE key for production)
7.  **Deploy**: Click "Deploy site".

## Option 2: Vercel
Vercel is the creators of Next.js but works great for Vite too.

1.  **Push to GitHub**.
2.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com).
3.  **Add New Project**: Click "Add New..." -> "Project".
4.  **Import Repository**: Select your `Ideal-today` repo.
5.  **Environment Variables**:
    Expand the "Environment Variables" section and add:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `VITE_GOOGLE_MAPS_KEY`
    *   `VITE_YOCO_PUBLIC_KEY`
6.  **Deploy**: Click "Deploy".

## Post-Deployment Checklist

1.  **Supabase URL**: Ensure your Supabase project URL is whitelisted if you have any strict CORS settings (usually not needed for public read).
2.  **Auth Redirects**:
    *   Go to your Supabase Dashboard -> Authentication -> URL Configuration.
    *   Add your new Netlify/Vercel URL (e.g., `https://ideal-stay.netlify.app`) to the **Site URL** and **Redirect URLs**.
    *   *This is critical for email confirmation links to work.*
3.  **Yoco Live Key**: Switch your `VITE_YOCO_PUBLIC_KEY` to the **Live** key from your Yoco dashboard to accept real payments.
4.  **Edge Functions**:
    *   If you are using the email sending feature, ensure you have deployed your edge functions to Supabase:
    *   `npx supabase functions deploy send-email --no-verify-jwt`
    *   And set the Resend API key: `npx supabase secrets set RESEND_API_KEY=re_123...`

## Troubleshooting
*   **404 on Refresh**: If you refresh a page like `/host` and get a 404, ensure the `netlify.toml` file was included in your deploy.
*   **Map not loading**: Check that your Google Maps API key has the correct "HTTP Referrer" restrictions for your new domain.
