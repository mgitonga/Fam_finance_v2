# FamFin — Production Deployment Plan

**Date:** March 3, 2026
**Status:** APPROVED

---

## Deployment Summary

| Item                  | Decision                                                                |
| --------------------- | ----------------------------------------------------------------------- |
| **Hosting**           | Vercel (free tier)                                                      |
| **Domain**            | `famfin.vercel.app` (default subdomain)                                 |
| **Database**          | New separate Supabase project for production                            |
| **Deploy trigger**    | Auto-deploy from `mgitonga/Fam_finance_v2` on push to `main`            |
| **Registration**      | Disabled — 2 users created manually in Supabase dashboard               |
| **Email**             | Supabase built-in auth emails only (Resend deferred)                    |
| **Data**              | Clean start — empty database with seed categories on first registration |
| **Branch protection** | Enabled — CI checks required before merge to main                       |

---

## Deployment Steps

### Step 1: Create Production Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New Project
2. Name: `FamFin-Production`, Region: Central EU (Frankfurt)
3. Save these values:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service role key (`SUPABASE_SERVICE_ROLE_KEY`)
   - Project reference ID

### Step 2: Push Migrations to Production Supabase

```bash
pnpm exec supabase link --project-ref <new-prod-project-id>
pnpm exec supabase db push --yes
```

### Step 3: Configure Production Supabase Settings

- **Authentication → Providers → Email:** Disable "Confirm email"
- **Authentication → URL Configuration:**
  - Site URL: `https://famfin.vercel.app`
  - Redirect URLs: `https://famfin.vercel.app/**`

### Step 4: Connect Vercel

1. Go to [vercel.com](https://vercel.com) → Add New → Project
2. Import `mgitonga/Fam_finance_v2` from GitHub
3. Settings:
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Install Command: `pnpm install --frozen-lockfile`
4. Environment Variables (Production):
   - `NEXT_PUBLIC_SUPABASE_URL` = production Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = production anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = production service role key
5. Deploy

### Step 5: Create Users in Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. **Admin user:** Click "Add User" → enter husband's email + password
3. **Contributor user:** Use the app's invite flow after admin logs in, OR create manually in Supabase
4. First admin login triggers household creation + default category seeding

### Step 6: Enable GitHub Branch Protection

1. GitHub → `mgitonga/Fam_finance_v2` → Settings → Branches
2. Add rule for `main`:
   - ✅ Require pull request reviews (1 reviewer)
   - ✅ Require status checks: `Lint, Type-check & Test`
   - ✅ Require branches up to date before merging
   - ✅ Do not allow bypassing

### Step 7: Verify Production

- [ ] App loads at `https://famfin.vercel.app`
- [ ] Admin can log in
- [ ] Dashboard renders (empty state)
- [ ] Default categories seeded after first registration
- [ ] Transactions page works (create, filter, paginate)
- [ ] Budgets page works (set budget, see progress)
- [ ] Reports page renders charts
- [ ] CSV export downloads correctly
- [ ] Dark/light mode toggle works
- [ ] PWA installable on mobile
- [ ] Contributor user can log in with limited permissions

---

## Post-Deployment Checklist

- [ ] Monitor Vercel deployment logs for errors
- [ ] Check Supabase dashboard for RLS policy enforcement
- [ ] Test all sidebar navigation links
- [ ] Verify security headers (X-Frame-Options, etc.) via browser DevTools
- [ ] Both users complete a basic UAT walkthrough
