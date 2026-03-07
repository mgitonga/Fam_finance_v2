# BUG-001: Fix Password Reset Flow

## Bug Summary

The forgot password workflow is broken. When a user clicks the password reset link received via email, they are redirected to the login page instead of being shown a form to enter a new password. **Users cannot reset their passwords.**

**Severity:** P1 — High (blocking authentication flow, violates FR-01.3)

---

## Steps to Reproduce

1. Navigate to `/login`
2. Click **"Forgot Password?"** → redirected to `/forgot-password`
3. Enter a valid registered email, click **"Send reset link"**
4. Receive email with reset link ✅
5. Click the reset link in the email
6. **BUG:** User is redirected to `/login` — no password reset form is shown
7. Password remains unchanged

---

## Root Cause Analysis

There are **three compounding issues** that cause this bug:

### Cause 1 (PRIMARY): `/reset-password` page does not exist

The `forgotPassword()` server action in `src/lib/supabase/auth-actions.ts` (line 104) tells Supabase to redirect to:

```
/auth/callback?next=/reset-password
```

The `/auth/callback` route (line 8) reads `next` and redirects to `/reset-password` after exchanging the code. But **no page exists at `src/app/(auth)/reset-password/page.tsx`** — the directory was never created.

### Cause 2 (MIDDLEWARE): `/reset-password` not handled in middleware

In `src/lib/supabase/middleware.ts` (line 40), the public routes are:

```typescript
const publicRoutes = ['/login', '/register', '/forgot-password', '/auth/callback'];
```

`/reset-password` is **not listed**. Moreover, even if it were added, lines 48–51 redirect **any authenticated user on a public route** to `/dashboard`:

```typescript
if (user && isPublicRoute && request.nextUrl.pathname !== '/auth/callback') {
  url.pathname = '/dashboard';
  return NextResponse.redirect(url);
}
```

After `/auth/callback` exchanges the reset code, the user **has an active session** — so visiting `/reset-password` (if it were a public route) would redirect them to `/dashboard`. This is a Catch-22.

### Cause 3 (AUTH PROVIDER): `PASSWORD_RECOVERY` event ignored

In `src/providers/auth-provider.tsx` (line 38), `onAuthStateChange` ignores the event type:

```typescript
supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  setLoading(false);
});
```

When Supabase fires a `PASSWORD_RECOVERY` event, the app should detect it and redirect to the reset password form. This opportunity is missed.

### Cause 4 (MINOR): Fragile `redirectTo` URL

In `src/lib/supabase/auth-actions.ts` (line 104):

```typescript
redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/auth/callback?next=/reset-password`,
```

When `NEXT_PUBLIC_SUPABASE_URL` is set (which it always is), this evaluates to just `/auth/callback?next=/reset-password` — a relative URL with no origin. This should use `NEXT_PUBLIC_SITE_URL` or a dedicated environment variable for the app origin.

---

## Current Flow (Broken)

```
User clicks reset link
    → /auth/callback?code=XXX&next=/reset-password
    → exchangeCodeForSession() succeeds (user now authenticated)
    → redirect to /reset-password
    → /reset-password page does NOT exist → 404
    → user ends up at /login or sees a not-found page
```

---

## Expected Flow (Fixed)

```
User clicks "Forgot Password?" on /login
    │
    ▼
/forgot-password — enter email, click "Send reset link"
    │
    ▼
Email received with link to /auth/callback?code=XXX&next=/reset-password
    │
    ▼
/auth/callback — exchanges code for session, redirects to /reset-password
    │
    ▼
/reset-password — form with:
    • New Password (with show/hide toggle)
    • Confirm New Password (with show/hide toggle)
    • Password strength requirements shown
    • [Reset Password] button
    │
    ├── Validation passes → supabase.auth.updateUser({ password }) → sign out → redirect /login with success toast
    │
    └── Validation fails → show inline errors (mismatch, too short, missing number/special char)
```

---

## Files to Modify

### 1. CREATE: `src/app/(auth)/reset-password/page.tsx`

Create the reset password page with:

- Two password fields (new + confirm) with show/hide toggles
- Use existing `resetPasswordSchema` from `src/lib/validations/auth.ts`
- Use existing `resetPassword()` server action from `src/lib/supabase/auth-actions.ts`
- Use `react-hook-form` + `zodResolver` (same pattern as `forgot-password/page.tsx`)
- On successful reset: sign out the user, redirect to `/login` with a success message
- On error: display appropriate error message
- If no session exists (expired link): redirect to `/forgot-password` with error message
- Include `data-testid` attributes for testing (follow existing patterns)
- Match the visual style of existing auth pages (same card layout, same classes)

### 2. MODIFY: `src/lib/supabase/middleware.ts`

Update the middleware to allow authenticated users to access `/reset-password`:

```typescript
// Add /reset-password to public routes
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/auth/callback',
  '/reset-password',
];

// Update the authenticated-user redirect to ALSO exclude /reset-password
if (
  user &&
  isPublicRoute &&
  request.nextUrl.pathname !== '/auth/callback' &&
  request.nextUrl.pathname !== '/reset-password'
) {
  url.pathname = '/dashboard';
  return NextResponse.redirect(url);
}
```

### 3. MODIFY: `src/lib/supabase/auth-actions.ts`

Fix the `forgotPassword()` `redirectTo` URL (line 104):

```typescript
// Replace the fragile ternary with a proper site URL
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
```

Fix `resetPassword()` (line 114) to sign out and redirect to `/login` instead of `/dashboard`:

```typescript
export async function resetPassword(formData: { password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Sign out after password reset so user logs in with new credentials
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login?message=Password updated successfully. Please sign in.');
}
```

### 4. MODIFY: `src/providers/auth-provider.tsx`

Handle the `PASSWORD_RECOVERY` event as a client-side fallback:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
  setLoading(false);

  if (event === 'PASSWORD_RECOVERY') {
    // Redirect to reset password page when recovery token is detected
    window.location.href = '/reset-password';
  }
});
```

### 5. MODIFY: `src/app/(auth)/login/page.tsx`

Display a success message when redirected from password reset:

- Read `?message=` query parameter from URL
- If present, display a green success banner at the top of the login form

### 6. MODIFY: `src/app/(auth)/forgot-password/page.tsx`

Improve the success message to include helpful instructions:

```
"We've sent a password reset link to your email. Please check your inbox (and spam folder). The link expires in 1 hour."
```

### 7. ADD: `NEXT_PUBLIC_SITE_URL` environment variable

Add to `.env.local` (and document):

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production: set to the actual Vercel deployment URL.

---

## Existing Code That Can Be Reused

| Asset                                  | Location                                          | Status                                                                 |
| -------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| `resetPasswordSchema` (Zod validation) | `src/lib/validations/auth.ts` (line 31–44)        | ✅ Ready — validates password policy + confirms match                  |
| `ResetPasswordInput` type              | `src/lib/validations/auth.ts` (line 50)           | ✅ Ready                                                               |
| `resetPassword()` server action        | `src/lib/supabase/auth-actions.ts` (line 114–124) | ⚠️ Needs fix — should sign out + redirect to `/login` not `/dashboard` |
| Auth page card layout                  | `src/app/(auth)/forgot-password/page.tsx`         | ✅ Copy this visual pattern                                            |
| Auth layout wrapper                    | `src/app/(auth)/layout.tsx`                       | ✅ Reset page will inherit this layout automatically                   |

---

## Acceptance Criteria

- [ ] User clicks "Forgot Password" on login page → lands on `/forgot-password`
- [ ] User enters valid email → receives password reset email
- [ ] User enters unregistered email → still shows success message (prevent email enumeration)
- [ ] Clicking reset link in email → lands on `/reset-password` with password form (NOT `/login`)
- [ ] `/reset-password` page shows: new password field, confirm password field, both with show/hide toggles
- [ ] Password validation enforces: min 8 chars, 1 number, 1 special character
- [ ] Mismatched passwords show inline error: "Passwords do not match"
- [ ] Weak passwords show inline error with specific unmet requirements
- [ ] Successful reset → user signed out → redirected to `/login` with green success message
- [ ] User can log in with the new password immediately
- [ ] Expired/invalid reset link → user sees error and is directed to `/forgot-password`
- [ ] Visiting `/reset-password` directly (no session) → redirected to `/forgot-password`
- [ ] Existing login, register, forgot-password pages still work (no regressions)
- [ ] Works in both light and dark mode
- [ ] Works on mobile viewport (320px+)
- [ ] All interactive elements have `data-testid` attributes

---

## Testing Plan

### Unit Tests

- [ ] `resetPasswordSchema` validates password policy correctly (existing schema)
- [ ] `resetPasswordSchema` rejects mismatched passwords
- [ ] `resetPassword()` action calls `supabase.auth.updateUser` then `signOut`

### Integration Tests

- [ ] Reset password page renders form when session exists
- [ ] Reset password page redirects to `/forgot-password` when no session
- [ ] Form submission with valid data calls `resetPassword()` action
- [ ] Form submission with invalid data shows validation errors

### E2E Tests

- [ ] Full flow: forgot password → email → click link → enter new password → login with new password
- [ ] Expired link flow: old reset link → error message → redirected to forgot-password
