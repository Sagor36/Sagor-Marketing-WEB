# SAGOR MARKETING TEAM — Supabase Edition

## Supabase setup

1. Open your Supabase project: `https://xsjuorowymldseyedpey.supabase.co`.
2. Open **SQL Editor → New query**.
3. Paste and run the complete `supabase/schema.sql` file. It creates the database tables, profile trigger, RLS policies, and the `marketing-screenshots` Storage bucket with upload/read/delete policies.
4. For local development, copy `.env.example` to `.env` and fill in your Supabase Project URL and Publishable/anon key. Do not commit `.env`. On Vercel, configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Project Environment Variables.
5. In Supabase **Authentication → URL Configuration**, set the Site URL to your deployed app URL. For local development, add `http://localhost:3000` to the Redirect URLs.
6. Create your first account through the app's Sign up screen. To make that account the administrator, run this in SQL Editor, replacing the email with the exact signup email:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_SIGNUP_EMAIL';
```

7. Install dependencies and run:

```bash
npm install
npm run dev
```

## Screenshot storage

Uploaded screenshots are stored in the Supabase Storage bucket named `marketing-screenshots`. The SQL script creates this bucket automatically. The bucket is currently public so screenshot URLs can be displayed in the dashboard; uploads are restricted to authenticated users and each user's own folder. Do not upload private or sensitive images.

## Environment

`.env` contains the project URL and Publishable key. `.env.example` documents the required variables. Never put a Supabase `service_role` or `sb_secret_` key in browser code or share it publicly.


## Admin audit and account identity update

After deploying this version, run the complete `supabase/schema.sql` in the Supabase SQL Editor. The added SQL migration stores each submitter's account email, limits member accounts to reading their own submissions, and lets admins read all submissions. Existing submissions are backfilled from their `created_by` profile where possible.

The Admin Management Console now shows the account name and email of each submitter, allows filtering by the actual account, and supports marking each uploaded image as Real or Fake (or leaving it Pending). Admins can delete individual images or complete submissions. These actions require the signed-in profile to have `role = 'admin'` in `public.profiles`.


## Vercel deployment

This project includes `vercel.json` and `api/[...path].ts` so Vercel deploys the Express API as a serverless function as well as the Vite frontend. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production, Preview, and Development, then redeploy. The API function uses the same values server-side and disables the platform body parser so Multer can receive multipart image uploads.
